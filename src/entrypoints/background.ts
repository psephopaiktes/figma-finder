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
    browser.action.onClicked.addListener(() => {
      // @ts-expect-error WXT omits the Firefox-only sidebarAction API.
      browser.sidebarAction.open();
    });
  }

  // ショートカットでのみポップアップを開く
  browser.commands.onCommand.addListener(async (command) => {
    if (command === "open-popup") {
      await browser.action.setPopup({ popup: "popup.html" });
      try {
        await browser.action.openPopup();
      } finally {
        await browser.action.setPopup({ popup: "" });
      }
    }
  });
});
