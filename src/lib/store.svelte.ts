interface Store {
  options: {
    currentUser: string | null;
    theme: string;
    locale: string | null;
    users: Record<string, User>;
  };
}
interface User {
  email: string;
  handle: string;
  img_url: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  // teams: Record<string, string>;
}

export const store: Store = $state({
  options: {
    currentUser: null,
    theme: "system",
    locale: null,
    users: {},
  },
});

export const loadOptions = async () => {
  const options = await storage.getItem("sync:options");
  if (options) {
    Object.assign(store.options, options);
  } else {
    await storage.setItem("sync:options", store.options);
  }
};
