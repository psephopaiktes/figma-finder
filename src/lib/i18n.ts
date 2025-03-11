const default_locale: string =
  browser.runtime.getManifest().default_locale || "en";

interface LocaleSetting {
  [key: Lowercase<string>]: {
    label: string;
    lang?: string;
    dir?: "rtl" | "ltr";
  };
}
const locales: LocaleSetting = {
  en: {
    label: "English",
    lang: "en-US",
  },
  ja: {
    label: "日本語",
  },
  "zh-cn": {
    label: "简体中文",
    lang: "zh-CN",
  },
  es: {
    label: "Español",
  },
};

export default {
  default_locale,
  locales,

  t(translations: Record<string, string | undefined>): string {
    if (!(default_locale in translations)) {
      throw new Error(
        `The default locale '${default_locale}' is required in the translations`,
      );
    }

    const userLang =
      browser.i18n.getUILanguage().toLowerCase() || default_locale;
    return translations[userLang] ?? translations[default_locale] ?? "";
  },
};
