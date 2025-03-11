import { defineConfig } from "wxt";

const manifest = {
  name: "__MSG_extName__",
  description: "__MSG_extDescription__",
  default_locale: "en",
  homepage_url: "https://github.com/psephopaiktes/figma-finder",
  permissions: ["tabs", "storage", "activeTab"],
  commands: {
    _execute_action: {
      suggested_key: {
        default: "Alt+F",
      },
    },
  },
  browser_specific_settings: {
    gecko: {
      id: "figma-finder@hira.page",
    },
  },
  action: {}, // Required
};

export default defineConfig({
  srcDir: "src",
  outDir: "build",
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-svelte", "@wxt-dev/auto-icons"],
  runner: {
    startUrls: ["https://figma.com/"],
    chromiumArgs: ["--user-data-dir=./.wxt/chrome-data"],
  },
  manifest,
});
