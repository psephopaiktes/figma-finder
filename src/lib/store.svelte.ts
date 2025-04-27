import i18n from "@/lib/i18n.svelte";
import type { LocalProjectState, Project, Store } from "@/types";
import type {
  GetProjectFilesResponse,
  GetTeamProjectsResponse,
} from "@figma/rest-api-spec";

/**
 * Global state store for the application
 */
export const store: Store = $state({
  projects: {},
  localProjectState: [],
  loading: true,
  targetProps: ["", "file"],
  options: {
    currentUser: null,
    theme: "system",
    locale: null,
    openInApp: false,
    users: {},
  },
});

/**
 * Returns the current user information if available
 * @returns Current user data or null if not logged in
 */
export const user = () => {
  const user = $derived(
    store.options.currentUser
      ? store.options.users[store.options.currentUser]
      : null,
  );
  return user;
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
  const options = await storage.getItem("sync:options");
  if (options) {
    Object.assign(store.options, options);
  }
};

/**
 * Makes an authenticated request to the Figma API
 * @param path - API endpoint path
 * @returns Promise resolving to the API response
 * @throws Error if authentication fails or request is unsuccessful
 */
const req = async <T>(path: string) => {
  const authToken = user()?.access_token;
  if (!authToken) {
    throw new Error("No access token available");
  }

  const res = await fetch(`https://api.figma.com/v1${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();

    switch (res.status) {
      case 403:
        throw new Error(`403 Error: - ${res.statusText} - ${errorText}`);

      case 429:
        alert(
          i18n.t({
            en: "Too many requests. Please try again later.",
            ja: "リクエストが多すぎます。時間を置いてもう一度お試しください。",
            "zh-cn": "请求过多。请稍后再试。",
            es: "Demasiadas solicitudes. Por favor, inténtelo de nuevo más tarde.",
            ko: "요청이 너무 많습니다. 나중에 다시 시도하세요.",
          }),
        );
        throw new Error(`429 Error: - ${res.statusText} - ${errorText}`);

      case 500:
        alert(
          i18n.t({
            en: "A server-side error occurred. Please try again later.",
            ja: "サーバー側のエラーが発生しました。時間を置いてもう一度お試しください。",
            "zh-cn": "发生了服务器端错误。请稍后再试。",
            es: "Ocurrió un error en el servidor. Por favor, inténtelo de nuevo más tarde.",
            ko: "서버 측 오류가 발생했습니다. 나중에 다시 시도하세요.",
          }),
        );
        throw new Error(`500 Error: - ${res.statusText} - ${errorText}`);

      default:
        throw new Error(
          `Unexpected Error: ${res.status} - ${res.statusText} - ${errorText}`,
        );
    }
  }

  return res.json() as Promise<T>;
};

/**
 * Loads project and file data from Figma API
 *
 * Process:
 * 1. Loads cached data from local storage
 * 2. Fetches team projects
 * 3. Fetches files for each project
 * 4. Updates local state and storage
 */
export const loadFiles = async () => {
  // 1. いったんlocalをstoreに反映
  const localProjects = await storage.getItem("local:projects");
  if (localProjects && JSON.stringify(localProjects) !== "{}") {
    Object.assign(store.projects, localProjects);
  }
  const localProjectState = await storage.getItem<string>(
    "local:localProjectState",
  );
  if (localProjectState && localProjectState !== "[]") {
    store.localProjectState = JSON.parse(localProjectState); //WXT対策
  }

  // 2. teamsをループして配下のprojectsを取得
  const projects: Record<string, Project> = {};
  const teamRequests = Object.entries(user()?.teams || {}).map(
    async ([teamId, teamName]) => {
      try {
        const data = await req<GetTeamProjectsResponse>(
          `/teams/${teamId}/projects`,
        );
        return data.projects.map((project) => ({
          id: project.id,
          team: teamName,
          name: project.name,
        }));
      } catch (error) {
        console.warn(`Failed to fetch projects for team id: ${teamId}:`, error);
        return []; // スキップする
      }
    },
  );
  const results = await Promise.all(teamRequests);
  for (const projectsArray of results) {
    for (const project of projectsArray) {
      projects[project.id] = {
        team: project.team,
        name: project.name,
        files: {},
      };
    }
  }

  // 3. projectsをループして配下のfilesを取得
  const fileRequests = Object.entries(projects).map(async ([projectId]) => {
    const data = await req<GetProjectFilesResponse>(
      `/projects/${projectId}/files`,
    );
    for (const file of data.files) {
      projects[projectId].files[file.key] = {
        name: file.name,
        last_modified: file.last_modified,
        thumbnail_url: file.thumbnail_url || "",
      };
    }
  });
  await Promise.all(fileRequests);

  // 4. レスポンスに存在していないプロジェクトは削除
  for (const oldId of Object.keys(store.projects)) {
    if (!projects[oldId]) delete store.projects[oldId];
  }

  // 5. プロジェクトの順序を更新
  if (localProjectState) {
    // 削除されたプロジェクトは除去
    const filteredState = store.localProjectState.filter(
      (localProject: LocalProjectState) => localProject.id in projects,
    );
    // 新しく追加されたプロジェクト
    const newProjectStates = Object.keys(projects)
      .filter(
        (id) =>
          !filteredState.some(
            (localProject: LocalProjectState) => localProject.id === id,
          ),
      )
      .map((id) => ({
        id,
        open: true,
      }));
    store.localProjectState = [...filteredState, ...newProjectStates];
  } else {
    store.localProjectState = Object.entries(projects)
      .sort(([, a], [, b]) => {
        const nameA = `${a.team} - ${a.name}`;
        const nameB = `${b.team} - ${b.name}`;
        return nameA.localeCompare(nameB);
      })
      .map(([id]) => ({
        id,
        open: true,
      }));
  }
  await storage.setItem<string>(
    "local:localProjectState",
    JSON.stringify(store.localProjectState), //WXT対策
  );

  // 6. storeに反映
  store.projects = { ...projects };
  await storage.setItem("local:projects", projects);
};
