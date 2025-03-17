export const store = $state({
  doc: "",
  options: {
    theme: "system",
    locale: null,
    users: [
      {
        id: null,
        handle: null,
        img_url: null,
        token: null,
      },
    ],
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
