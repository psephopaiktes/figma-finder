import type {
  GetProjectFilesResponse,
  GetTeamProjectsResponse,
} from "@figma/rest-api-spec";
import {
  loadAccounts,
  persistFileView,
  persistOptions,
} from "@/lib/account-storage";
import {
  commitProjectSnapshot,
  type ProjectSnapshot,
  persistProjectOrder,
  readProjectSnapshot,
  setProjectRetryAt,
  withProjectRefreshLock,
} from "@/lib/project-storage";
import type {
  Accounts,
  AuthTokens,
  LocalProjectState,
  Options,
  Project,
  Store,
} from "@/types";

/**
 * Global state store for the application
 */
export const store: Store = $state({
  auth: {},
  projects: {},
  localProjectState: [],
  projectAccount: null,
  projectOrderSaved: "",
  projectDataReady: false,
  loading: true,
  targetProps: ["", "file"],
  options: {
    currentUser: null,
    theme: "system",
    locale: null,
    openInApp: false,
    fileView: "list",
    users: {},
  },
});

/**
 * Returns the current user information if available
 * @returns Current user data or null if not logged in
 */
export const user = () => {
  return store.options.currentUser && store.auth[store.options.currentUser]
    ? (store.options.users[store.options.currentUser] ?? null)
    : null;
};

export const tokens = () =>
  store.options.currentUser ? store.auth[store.options.currentUser] : undefined;

export const applyAccounts = (state: Accounts) => {
  store.auth = state.auth;
  store.options = state.options;
};

export const saveOptions = (selectCurrent = false) =>
  persistOptions(store.options, selectCurrent).catch(() => {
    console.warn("Settings could not be saved.");
  });

export const setFileView = (fileView: Options["fileView"]) => {
  store.options.fileView = fileView;
  return persistFileView(fileView).catch(() => {
    console.warn("Settings could not be saved.");
  });
};

/**
 * Constructs a Figma URL based on path and environment
 * @param path - The path to append to the Figma URL
 * @param env - Optional environment, either "browser" or "app"
 * @returns Complete Figma URL
 */
export const getFigUrl = (path: string, env?: "browser" | "app") => {
  if (env === "browser") {
    return `https://figma.com/${path}`;
  }
  if (env === "app") {
    return `figma://${path}`;
  }
  return store.options.openInApp
    ? `figma://${path}`
    : `https://figma.com/${path}`;
};

/**
 * Gets the target URL based on current store state
 * @param env - Optional environment, either "browser" or "app"
 * @returns Complete Figma URL to either a file or project
 */
export const getTargetUrl = (env?: "browser" | "app") => {
  return store.targetProps[1] === "file"
    ? getFigUrl(`file/${store.targetProps[0]}`, env)
    : getFigUrl(`files/project/${store.targetProps[0]}`, env);
};

/**
 * Loads user options from storage
 */
export const loadOptions = async () => {
  applyAccounts(await loadAccounts());
};

const PROJECT_CACHE_TTL = 5 * 60_000;
const pendingOrderSaves = new Map<
  string,
  { order: LocalProjectState[]; captured: string }
>();

export class FigmaRateLimitError extends Error {
  readonly retryAt: number;

  constructor(retryAt: number) {
    super("Figma API request limit reached");
    this.name = "FigmaRateLimitError";
    this.retryAt = retryAt;
  }
}

const teamSignature = (teams: Record<string, string>) =>
  JSON.stringify(Object.entries(teams).sort(([a], [b]) => a.localeCompare(b)));

const retryDeadline = (header: string | null | undefined) => {
  const now = Date.now();
  const value = header?.trim() ?? "";
  const deadline = /^\d+$/u.test(value)
    ? now + Number(value) * 1000
    : Date.parse(value);
  return Number.isFinite(deadline) && deadline > now
    ? Math.min(deadline, now + 30 * 24 * 60 * 60_000)
    : now + 60_000;
};

async function request<T>(path: string, token: string, signal: AbortSignal) {
  const response = await fetch(`https://api.figma.com/v1${path}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "omit",
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
  });
  if (!response.ok) {
    const retryAt = retryDeadline(response.headers?.get("Retry-After"));
    await response.body?.cancel();
    if (response.status === 429) throw new FigmaRateLimitError(retryAt);
    throw new Error(`Figma request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

// Stop assigning new work after a failure and settle active work before releasing
// the cross-page refresh lock. A rejected Promise.all would leave requests running.
async function fetchBatch<T, R>(
  items: T[],
  controller: AbortController,
  run: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  const pending = items.entries();
  let failed = false;
  let failure: unknown;
  await Promise.all(
    Array.from({ length: Math.min(2, items.length) }, async () => {
      while (!failed) {
        const next = pending.next();
        if (next.done) return;
        const [index, item] = next.value;
        try {
          results[index] = await run(item);
        } catch (error) {
          if (!failed) {
            failed = true;
            failure = error;
            controller.abort();
          }
        }
      }
    }),
  );
  if (failed) throw failure;
  return results;
}

function applyProjects(
  id: string,
  signature: string,
  snapshot: ProjectSnapshot,
) {
  if (
    store.options.currentUser !== id ||
    teamSignature(user()?.teams ?? {}) !== signature
  )
    return;
  const pending = pendingOrderSaves.get(id);
  const keepLocalOrder =
    store.projectAccount === id &&
    store.projectDataReady &&
    (pending !== undefined ||
      JSON.stringify(store.localProjectState) !== store.projectOrderSaved);
  // Hydrate order before showing cached projects, so mounting Tree cannot save
  // an empty placeholder. A user edit waiting for the persistence lock must
  // survive a refresh commit; its queued save will merge any new project IDs.
  store.projectDataReady = false;
  store.projectAccount = id;
  if (!keepLocalOrder) {
    store.projectOrderSaved =
      pending?.captured ?? JSON.stringify(snapshot.order);
    store.localProjectState = pending
      ? pending.order.map(({ id, open }) => ({ id, open }))
      : snapshot.order;
  }
  store.projects = snapshot.signature === signature ? snapshot.projects : {};
  store.projectDataReady = true;
}

export const saveProjectOrder = async () => {
  const id = store.projectAccount;
  if (!id || id !== store.options.currentUser || !store.projectDataReady)
    return;
  const order = store.localProjectState.map(({ id, open }) => ({ id, open }));
  const captured = JSON.stringify(order);
  const baseline = store.projectOrderSaved;
  const pending = { order, captured };
  pendingOrderSaves.set(id, pending);
  // Capture each user action's baseline, including a quick undo of a pending
  // reorder. The pending marker keeps refresh commits from replacing the UI.
  store.projectOrderSaved = captured;
  try {
    const saved = await persistProjectOrder(id, order, baseline);
    if (
      pendingOrderSaves.get(id) === pending &&
      store.projectAccount === id &&
      store.options.currentUser === id &&
      JSON.stringify(store.localProjectState) === captured
    ) {
      store.projectOrderSaved = JSON.stringify(saved.order);
      store.localProjectState = saved.order;
    }
  } catch {
    if (
      pendingOrderSaves.get(id) === pending &&
      store.projectAccount === id &&
      store.projectOrderSaved === captured
    )
      store.projectOrderSaved = baseline;
    console.warn("Project order could not be saved.");
  } finally {
    if (pendingOrderSaves.get(id) === pending) pendingOrderSaves.delete(id);
  }
};

export const loadFiles = async ({
  force = false,
}: {
  force?: boolean;
} = {}) => {
  const id = store.options.currentUser;
  const profile = user();
  if (!id || !profile) return;
  const teams = { ...profile.teams };
  const signature = teamSignature(teams);
  const requestedAt = Date.now();
  const active = () =>
    store.options.currentUser === id &&
    teamSignature(user()?.teams ?? {}) === signature;
  applyProjects(id, signature, await readProjectSnapshot(id));

  await withProjectRefreshLock(id, async () => {
    const cached = await readProjectSnapshot(id);
    if (!active()) return;
    const auth =
      await storage.getItem<Record<string, AuthTokens>>("local:auth");
    const token = auth?.[id]?.access_token;
    if (!token) return;
    applyProjects(id, signature, cached);
    if (cached.retryAt > Date.now())
      throw new FigmaRateLimitError(cached.retryAt);
    if (
      cached.signature === signature &&
      cached.fetchedAt > 0 &&
      ((!force && Date.now() - cached.fetchedAt < PROJECT_CACHE_TTL) ||
        cached.fetchedAt > requestedAt)
    )
      return;

    const controller = new AbortController();
    const signal = AbortSignal.any([
      controller.signal,
      AbortSignal.timeout(30_000),
    ]);
    try {
      const lists = await fetchBatch(
        Object.entries(teams),
        controller,
        async ([teamId, teamName]) => {
          const data = await request<GetTeamProjectsResponse>(
            `/teams/${teamId}/projects`,
            token,
            signal,
          );
          return data.projects.map(({ id, name }) => ({
            id,
            name,
            team: teamName,
          }));
        },
      );
      const projects: Record<string, Project> = {};
      for (const list of lists) {
        for (const project of list)
          projects[project.id] = {
            name: project.name,
            team: project.team,
            files: {},
          };
      }
      await fetchBatch(
        Object.entries(projects),
        controller,
        async ([projectId, project]) => {
          const data = await request<GetProjectFilesResponse>(
            `/projects/${projectId}/files`,
            token,
            signal,
          );
          for (const file of data.files)
            project.files[file.key] = {
              name: file.name,
              last_modified: file.last_modified,
              thumbnail_url: file.thumbnail_url || "",
            };
        },
      );
      const liveAuth =
        await storage.getItem<Record<string, AuthTokens>>("local:auth");
      if (!liveAuth?.[id]?.access_token) return;
      const saved = await commitProjectSnapshot(
        id,
        projects,
        signature,
        Date.now(),
      );
      applyProjects(id, signature, saved);
    } catch (error) {
      if (error instanceof FigmaRateLimitError) {
        const liveAuth =
          await storage.getItem<Record<string, AuthTokens>>("local:auth");
        if (liveAuth?.[id]?.access_token) {
          const saved = await setProjectRetryAt(id, error.retryAt);
          applyProjects(id, signature, saved);
        }
      }
      throw error;
    } finally {
      controller.abort();
    }
  });
};
