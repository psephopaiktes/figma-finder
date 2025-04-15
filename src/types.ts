export type Store = {
  loading: boolean;
  projects: Record<string, Project>;
  localProjectState: LocalProjectState[];
  targetProps: [id: string, type: "file" | "project"];
  options: {
    currentUser: string | null;
    theme: string;
    locale: string | null;
    openInApp: boolean;
    users: Record<string, User>;
  };
};

export type User = {
  email: string;
  handle: string;
  img_url: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  teams: Record<string, string>;
};

export type Project = {
  team: string;
  name: string;
  files: Record<string, File>;
};

export type File = {
  last_modified: string;
  name: string;
  thumbnail_url: string;
};

export type LocalProjectState = {
  id: string;
  open: boolean;
};
