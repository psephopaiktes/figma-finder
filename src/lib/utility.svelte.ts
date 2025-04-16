import i18n from "@/lib/i18n.svelte";

/**
 * Opens the side panel in the browser
 *
 * Handles different browser environments:
 * - Chrome: Uses the sidePanel API
 * - Firefox: Uses the sidebarAction API
 */
export const openSidePanel = async () => {
  if (import.meta.env.CHROME) {
    const queryOptions = { active: true, currentWindow: true };
    const [tab] = await browser.tabs.query(queryOptions);
    chrome.sidePanel.open({ windowId: tab.windowId });
  } else {
    // @ts-ignore
    browser.sidebarAction.open();
  }
};

/**
 * Formats a date string into a human-readable "time ago" format
 *
 * @param isoDateStr - ISO format date string to format
 * @returns Localized string describing when the edit occurred
 */
export const formatEditedDate = (isoDateStr: string): string => {
  const date = new Date(isoDateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffYears = now.getFullYear() - date.getFullYear();

  if (diffMinutes < 60) {
    return i18n.t({
      en: `Edited ${diffMinutes} minutes ago`,
      ja: `${diffMinutes}分前に編集済み`,
      "zh-cn": `编辑于${diffMinutes}分钟前`,
      es: `Editado hace ${diffMinutes} minutos`,
    });
  }

  if (diffHours < 24 && now.getDate() === date.getDate()) {
    return i18n.t({
      en: `Edited ${diffHours} hours ago`,
      ja: `${diffHours}時間前に編集済み`,
      "zh-cn": `编辑于${diffHours}小时前`,
      es: `Editado hace ${diffHours} horas`,
    });
  }

  if (diffDays === 1) {
    return i18n.t({
      en: "Edited yesterday",
      ja: "1日前に編集済み",
      "zh-cn": "昨天编辑",
      es: "Editado ayer",
    });
  }

  if (diffDays === 2) {
    return i18n.t({
      en: "Edited 2 days ago",
      ja: "2日前に編集済み",
      "zh-cn": "前天编辑",
      es: "Editado hace 2 días",
    });
  }

  if (diffYears >= 2) {
    return i18n.t({
      en: `Edited ${diffYears} years ago`,
      ja: `${diffYears}年前に編集済み`,
      "zh-cn": `${diffYears}年前编辑`,
      es: `Editado hace ${diffYears} años`,
    });
  }

  if (diffYears === 1) {
    return i18n.t({
      en: "Edited 1 year ago",
      ja: "1年前に編集済み",
      "zh-cn": "1年前编辑",
      es: "Editado hace 1 año",
    });
  }

  return i18n.t({
    en: `Edited ${diffDays} days ago`,
    ja: `${diffDays}日前に編集済み`,
    "zh-cn": `${diffDays}天前编辑`,
    es: `Editado hace ${diffDays} días`,
  });
};

/**
 * Determines if the current operating system is macOS
 */
export const isMac =
  "userAgentData" in navigator
    ? (navigator.userAgentData as NavigatorUAData).platform === "macOS"
    : navigator.userAgent.includes("Mac");

/**
 * Interface for Navigator User Agent Data API
 */
interface NavigatorUAData {
  platform: string;
  brands: { brand: string; version: string }[];
  mobile: boolean;
}
