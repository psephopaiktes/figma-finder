import type { Project, Store } from "@/types";
import type {
  GetProjectFilesResponse,
  GetTeamProjectsResponse,
} from "@figma/rest-api-spec";
import { storage } from "@wxt-dev/storage";

export const store: Store = $state({
  projects: {},
  loading: true,
  options: {
    currentUser: null,
    theme: "system",
    locale: null,
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
  const res = await fetch(`https://api.figma.com/v1${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${user()?.access_token}`,
    },
  });

  if (!res.ok) {
    return Promise.reject(res);
  }

  return res.json() as Promise<T>;
};

export const loadFiles = async () => {
  // 1. local:にあればstoreに反映
  const projects: Record<string, Project> =
    (await storage.getItem("local:projects")) || {};
  if (Object.keys(projects).length !== 0) {
    Object.assign(store.projects, projects);
  }

  // 2. APIから読み込んでstoreを上書き
  //// 2-1. チームをループしてProjectsを取得
  for (const [teamId, teamName] of Object.entries(user()?.teams || {})) {
    // Promise.all で並列にすべきかも
    const data = await req<GetTeamProjectsResponse>(
      `/teams/${teamId}/projects`,
    );
    for (const project of data.projects) {
      projects[project.id] = {
        team: teamName,
        name: project.name,
        files: {},
      };
    }
  }

  //// 2-1. projectsをループしてFileを取得
  for (const [projectId] of Object.entries(projects)) {
    // Promise.all で並列にすべきかも
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
  }

  // storeへの反映は最後にいっきにやる！
  store.projects = projects;
  await storage.setItem("local:projects", projects);

  // 3. retrun
};
