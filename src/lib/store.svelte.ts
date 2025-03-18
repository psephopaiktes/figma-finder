interface Store {
  currentUser: string | null;
  options: {
    theme: string;
    locale: string | null;
    users: Record<string, User>;
  };
}
interface User {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unixタイムスタンプ（ミリ秒）
  handle: string;
  img_url: string;
}

export const store: Store = $state({
  currentUser: null,
  options: {
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
