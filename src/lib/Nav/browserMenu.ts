export const browserMenu = import.meta.env.CHROME
  ? [
      {
        id: "history",
        label: {
          en: "History",
          ja: "履歴",
        },
        url: "chrome://history",
      },
      {
        id: "bookmarks",
        label: {
          en: "Bookmarks",
          ja: "ブックマーク",
        },
        url: "chrome://bookmarks",
      },
      {
        id: "downloads",
        label: {
          en: "Downloads",
          ja: "ダウンロード",
        },
        url: "chrome://downloads",
      },
      {
        id: "extensions",
        label: {
          en: "Extensions",
          ja: "拡張機能",
        },
        url: "chrome://extensions",
      },
      {
        id: "settings",
        label: {
          en: "Settings",
          ja: "設定",
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
            ja: "ダウンロード",
          },
          url: "about:downloads",
        },
        {
          id: "extensions",
          label: {
            en: "Add-ons",
            ja: "アドオン",
          },
          url: "about:addons",
        },
        {
          id: "settings",
          label: {
            en: "Settings",
            ja: "設定",
          },
          url: "about:preferences",
        },
        {
          id: "passwords",
          label: {
            en: "Passwords",
            ja: "パスワード",
          },
          url: "about:logins",
        },
        {
          id: "home",
          label: {
            en: "Home",
            ja: "ホーム",
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
