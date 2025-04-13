import type { LocalProjectState, Project, Store } from "@/types";
import type {
  GetProjectFilesResponse,
  GetTeamProjectsResponse,
} from "@figma/rest-api-spec";

export const store: Store = $state({
  projects: {},
  localProjectState: [],
  loading: true,
  options: {
    currentUser: null,
    theme: "system",
    locale: null,
    openInApp: false,
    users: {},
  },
});

export const user = () => {
  const user = $derived(
    store.options.currentUser
      ? store.options.users[store.options.currentUser]
      : null,
  );
  return user;
};

export const loadOptions = async () => {
  const options = await storage.getItem("sync:options");
  if (options) {
    Object.assign(store.options, options);
  }
};

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
    throw new Error(`Error: ${res.status} ${res.statusText} - ${errorText}`);
  }
  return res.json() as Promise<T>;
};

export const loadFiles = async () => {
  // 1. いったんlocalをstoreに反映
  const localProjects = await storage.getItem("local:projects");
  if (localProjects) {
    Object.assign(store.projects, localProjects);
  }
  const localProjectState = await storage.getItem<string>(
    "local:localProjectState",
  );
  if (localProjectState) {
    store.localProjectState = JSON.parse(localProjectState); //WXT対策
  }

  // TODO TMP
  const testData = await browser.storage.local.get("test");
  // const userButtons: ButtonConfig[] = testData.options?.buttons || [];
  console.log("isArray getted:", Array.isArray(testData));

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
