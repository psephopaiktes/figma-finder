import { store } from "@/lib/store.svelte";

const default_locale: string =
  browser.runtime.getManifest().default_locale || "en";

interface LocaleSetting {
  [key: Lowercase<string>]: {
    label: string;
    lang?: string;
    dir?: "rtl" | "ltr";
  };
}

/**
 * Supported locales configuration
 */
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

/**
 * Internationalization utilities
 */
type LocaleKey = keyof typeof locales;
export default {
  default_locale,
  locales,

  /**
   * Translates text based on user's locale settings
   * @param translations - Object containing translations for different locales
   * @returns Translated string for the current locale or default locale
   * @throws Error if default locale translation is missing
   */
  t(
    translations: Partial<Record<LocaleKey, string>> &
      Record<typeof default_locale, string>,
  ): string {
    if (!(default_locale in translations)) {
      throw new Error(
        `The default locale '${default_locale}' is required in the translations`,
      );
    }

    const userLang =
      store.options.locale ||
      browser.i18n.getUILanguage().toLowerCase() ||
      default_locale;

    if (import.meta.env.DEV) {
      if (userLang in locales && !(userLang in translations)) {
        console.warn(
          `Missing translation for locale '${userLang}' \n at "${translations[default_locale]}"`,
        );
      }
      for (const key of Object.keys(translations)) {
        if (!(key in locales) && key !== default_locale) {
          console.warn(
            `Unsupported locale key '${key}' in translations \n at "${translations[default_locale]}"`,
          );
        }
      }
    }

    return (
      translations[userLang as LocaleKey] ?? translations[default_locale] ?? ""
    );
  },
};
