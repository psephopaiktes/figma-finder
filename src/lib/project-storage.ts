import type { LocalProjectState, Project } from "@/types";

export type ProjectSnapshot = {
  projects: Record<string, Project>;
  order: LocalProjectState[];
  signature: string;
  fetchedAt: number;
  retryAt: number;
};

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const validId = (id: string) =>
  id.length > 0 && !["__proto__", "prototype", "constructor"].includes(id);
const timestamp = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
const snapshotKey = (id: string) =>
  `local:projectData:${encodeURIComponent(id)}` as const;
const preferenceKey = (id: string) =>
  `local:projectOrder:${encodeURIComponent(id)}` as const;
const lockKey = (id: string, kind: "storage" | "refresh") =>
  `figma-finder-project-${kind}:${encodeURIComponent(id)}`;

function cleanOrder(input: unknown): LocalProjectState[] {
  let value = input;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  return value.flatMap((entry) => {
    const item = record(entry);
    if (
      typeof item.id !== "string" ||
      !validId(item.id) ||
      typeof item.open !== "boolean" ||
      ids.has(item.id)
    )
      return [];
    ids.add(item.id);
    return [{ id: item.id, open: item.open }];
  });
}

function savedOrder(input: unknown): LocalProjectState[] | undefined {
  let value = input;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  if (!Array.isArray(value)) return undefined;
  const order = cleanOrder(value);
  return value.length === 0 || order.length > 0 ? order : undefined;
}

function cleanProjects(input: unknown): Record<string, Project> {
  return Object.fromEntries(
    Object.entries(record(input)).flatMap(([id, value]) => {
      const project = record(value);
      if (
        !validId(id) ||
        typeof project.name !== "string" ||
        typeof project.team !== "string"
      )
        return [];
      const files = Object.fromEntries(
        Object.entries(record(project.files)).flatMap(([fileId, value]) => {
          const file = record(value);
          if (!validId(fileId) || typeof file.name !== "string") return [];
          return [
            [
              fileId,
              {
                name: file.name,
                last_modified:
                  typeof file.last_modified === "string"
                    ? file.last_modified
                    : "",
                thumbnail_url:
                  typeof file.thumbnail_url === "string"
                    ? file.thumbnail_url
                    : "",
              },
            ],
          ];
        }),
      );
      return [[id, { name: project.name, team: project.team, files }]];
    }),
  );
}

function mergeOrder(
  preferred: LocalProjectState[],
  projects: Record<string, Project>,
  fallback: LocalProjectState[] = [],
): LocalProjectState[] {
  const ids = new Set<string>();
  const order: LocalProjectState[] = [];
  for (const entry of [...preferred, ...fallback]) {
    if (!Object.hasOwn(projects, entry.id) || ids.has(entry.id)) continue;
    ids.add(entry.id);
    order.push({ ...entry });
  }
  const added = Object.entries(projects)
    .filter(([id]) => !ids.has(id))
    .sort(([, a], [, b]) =>
      `${a.team} - ${a.name}`.localeCompare(`${b.team} - ${b.name}`),
    )
    .map(([id]) => ({ id, open: true }));
  return [...order, ...added];
}

function storageLocked<T>(id: string, change: () => Promise<T>): Promise<T> {
  return navigator.locks.request(lockKey(id, "storage"), change);
}

export function withProjectRefreshLock<T>(
  id: string,
  refresh: () => Promise<T>,
): Promise<T> {
  return navigator.locks.request(lockKey(id, "refresh"), refresh);
}

async function readSnapshot(id: string): Promise<ProjectSnapshot> {
  const input = record(await storage.getItem(snapshotKey(id)));
  const projects = cleanProjects(input.projects);
  const fetchedAt = timestamp(input.fetchedAt);
  const ownOrder = savedOrder(input.order);
  let order = ownOrder ?? [];
  // A cooldown-only record is not a completed migration. Old cached project
  // contents have no owner, so only their separately saved order is considered.
  if (
    ownOrder === undefined ||
    (order.length === 0 &&
      fetchedAt === 0 &&
      Object.keys(projects).length === 0)
  ) {
    order =
      savedOrder(await storage.getItem(preferenceKey(id))) ??
      cleanOrder(await storage.getItem("local:localProjectState"));
  }
  return {
    projects,
    order: Object.keys(projects).length ? mergeOrder(order, projects) : order,
    signature: typeof input.signature === "string" ? input.signature : "",
    fetchedAt,
    retryAt: timestamp(input.retryAt),
  };
}

export function readProjectSnapshot(id: string): Promise<ProjectSnapshot> {
  return storageLocked(id, () => readSnapshot(id));
}

export function commitProjectSnapshot(
  id: string,
  projects: Record<string, Project>,
  signature: string,
  fetchedAt = Date.now(),
): Promise<ProjectSnapshot> {
  return storageLocked(id, async () => {
    const current = await readSnapshot(id);
    const cleaned = cleanProjects(projects);
    const next: ProjectSnapshot = {
      projects: cleaned,
      order: mergeOrder(current.order, cleaned),
      signature,
      fetchedAt: timestamp(fetchedAt),
      retryAt: 0,
    };
    await storage.setItem(snapshotKey(id), next);
    return next;
  });
}

export function persistProjectOrder(
  id: string,
  order: LocalProjectState[],
  baseline?: LocalProjectState[] | string,
): Promise<ProjectSnapshot> {
  const snapshot = cleanOrder(order);
  const previous = baseline === undefined ? undefined : cleanOrder(baseline);
  return storageLocked(id, async () => {
    const current = await readSnapshot(id);
    // Initial placeholder rendering must not overwrite migration candidates.
    if (Object.keys(current.projects).length === 0) return current;
    const reordered =
      previous === undefined ||
      JSON.stringify(snapshot.map(({ id }) => id)) !==
        JSON.stringify(previous.map(({ id }) => id));
    const merged = mergeOrder(
      reordered ? snapshot : current.order,
      current.projects,
      current.order,
    );
    if (previous !== undefined) {
      const before = new Map(previous.map(({ id, open }) => [id, open]));
      const requested = new Map(snapshot.map(({ id, open }) => [id, open]));
      const latest = new Map(current.order.map(({ id, open }) => [id, open]));
      for (const entry of merged) {
        // A stale view's untouched flags are not user edits. In particular,
        // dragging rows must not reopen a project folded in another page.
        const changed =
          before.has(entry.id) &&
          requested.has(entry.id) &&
          before.get(entry.id) !== requested.get(entry.id);
        entry.open = changed
          ? (requested.get(entry.id) as boolean)
          : (latest.get(entry.id) ?? entry.open);
      }
    }
    if (JSON.stringify(merged) === JSON.stringify(current.order))
      return current;
    const next = { ...current, order: merged };
    await storage.setItem(snapshotKey(id), next);
    return next;
  });
}

export function setProjectRetryAt(
  id: string,
  retryAt: number,
): Promise<ProjectSnapshot> {
  return storageLocked(id, async () => {
    const current = await readSnapshot(id);
    const next = { ...current, retryAt: timestamp(retryAt) };
    if (next.retryAt === current.retryAt) return current;
    await storage.setItem(snapshotKey(id), next);
    return next;
  });
}

export function clearProjectSnapshot(
  id: string,
  afterClear?: () => Promise<void>,
): Promise<void> {
  // Finish any in-flight fetch before deleting, so its late commit cannot
  // recreate the cache after logout. Ordinary order saves only need storage.
  return withProjectRefreshLock(id, async () => {
    await storageLocked(id, async () => {
      const input = record(await storage.getItem(snapshotKey(id)));
      const order = savedOrder(input.order);
      const verified =
        timestamp(input.fetchedAt) > 0 ||
        Object.keys(cleanProjects(input.projects)).length > 0;
      // Logging out clears file metadata, not the user's ordering preferences.
      // Legacy candidates and cooldown-only records are not verified ownership.
      if (verified && order !== undefined)
        await storage.setItem(preferenceKey(id), order);
      await storage.removeItem(snapshotKey(id));
    });
    // Auth removal must finish before a queued refresh can start, while the
    // cache must be cleared before auth watchers can navigate this page away.
    await afterClear?.();
  });
}
