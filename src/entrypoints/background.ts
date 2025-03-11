export default defineBackground(() => {
  if (import.meta.env.CHROME) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.error(error));
    // OR: TODO: Delte
    // chrome.action.onClicked.addListener((tab) => {
    //   chrome.sidePanel.open({ windowId: tab.windowId });
    // });
  } else {
    browser.browserAction.onClicked.addListener(() => {
      // @ts-ignore
      browser.sidebarAction.open();
    });
  }
});
