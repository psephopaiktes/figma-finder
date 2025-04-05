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
