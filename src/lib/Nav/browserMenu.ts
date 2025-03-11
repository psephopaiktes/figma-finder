export const browserMenu = import.meta.env.CHROME
  ? [
      {
        id: "history",
        label: {
          en: "History",
          jp: "履歴",
        },
        url: "chrome://history",
      },
      {
        id: "bookmarks",
        label: {
          en: "Bookmarks",
          jp: "ブックマーク",
        },
        url: "chrome://bookmarks",
      },
      {
        id: "downloads",
        label: {
          en: "Downloads",
          jp: "ダウンロード",
        },
        url: "chrome://downloads",
      },
      {
        id: "extensions",
        label: {
          en: "Extensions",
          jp: "拡張機能",
        },
        url: "chrome://extensions",
      },
      {
        id: "settings",
        label: {
          en: "Settings",
          jp: "設定",
        },
        url: "chrome://settings",
      },
      {
        id: "dino",
        label: {
          en: "Dino",
        },
        url: "chrome://dino",
      },
    ]
  : import.meta.env.FIREFOX
    ? [
        {
          id: "downloads",
          label: {
            en: "Downloads",
            jp: "ダウンロード",
          },
          url: "about:downloads",
        },
        {
          id: "extensions",
          label: {
            en: "Add-ons",
            jp: "アドオン",
          },
          url: "about:addons",
        },
        {
          id: "settings",
          label: {
            en: "Settings",
            jp: "設定",
          },
          url: "about:preferences",
        },
        {
          id: "passwords",
          label: {
            en: "Passwords",
            jp: "パスワード",
          },
          url: "about:logins",
        },
        {
          id: "home",
          label: {
            en: "Home",
            jp: "ホーム",
          },
          url: "about:home",
        },
        {
          id: "robot",
          label: {
            en: "Robot",
          },
          url: "about:robots",
        },
      ]
    : [];
