export default defineBackground(() => {
  // Show Welcome Page
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      browser.tabs.create({
        url: browser.runtime.getURL("/help.html?welcome"),
      });
    }
  });

  // Handle SidePanel open
  if (import.meta.env.CHROME) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.error(error));
  } else {
    browser.browserAction.onClicked.addListener(() => {
      // @ts-ignore
      browser.sidebarAction.open();
    });
  }
});
