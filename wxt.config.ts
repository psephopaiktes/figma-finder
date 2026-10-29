import { defineConfig } from "wxt";

const manifest = {
  name: "__MSG_extName__",
  description: "__MSG_extDescription__",
  default_locale: "en",
  homepage_url: "https://github.com/psephopaiktes/figma-finder",
  permissions: ["tabs", "storage", "activeTab", "identity"],
  minimum_chrome_version: "126",
  commands: {
    "open-popup": {
      suggested_key: {
        default: "Alt+F",
      },
      description: "__MSG_keyboardAction__",
    },
  },
  action: {
    default_icon: {
      16: "/img/action-icon.png",
      32: "/img/action-icon.png",
      48: "/img/action-icon.png",
      128: "/img/action-icon.png",
    },
    default_title: "__MSG_iconTitle__",
  },
  browser_specific_settings: {
    gecko: {
      id: "figma-finder@hira.page",
      strict_min_version: "140.0",
      data_collection_permissions: {
        required: ["authenticationInfo", "personallyIdentifyingInfo"],
      },
    },
  },
  host_permissions: ["https://www.figma.com/*", "https://api.figma.com/*"],
  key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAry7JIpqk5zlJTeh0p+SGQr0Rmyx+iYP0pu/7/QxKCb5bPZNCzm1xvGsUrU/NmAjIPg1FUePat9MfpjiGXCKbSLlNBCIAiI+/qN+sVyB0DmlLb2/zDBvRn2oxdKdWT3ySYXznvxQujCIS+7YKgApxc+jOQwrrhScTcCjplw3ad/YPVWi+9dh8A3SIFa+lot1U475V4IJdVOPPZhlA8qDLa7jMAJDUPw3xnA13xWlpvgmoFaYTSmF4wyenUH9EP31TyelspX9+Fq31/JF7z7ZI1WZbGB0j8syNCxEp3a4zm07a1jNr6pX8YHCgO/19k0sxHpRWb6j6tn9P28YRr6lDCwIDAQAB",
};

export default defineConfig({
  srcDir: "src",
  outDir: "build",
  modules: ["@wxt-dev/module-svelte", "@wxt-dev/auto-icons"],
  webExt: {
    startUrls: [
      "https://figma.com/",
      // "chrome-extension://klifomaejfaibpkbigbpljdmelbkehbe/options.html?nav",
    ],
    chromiumArgs: ["--user-data-dir=./.wxt/chrome-data"],
  },
  zip: {
    includeSources: [
      "src/**",
      "public/**",
      "package.json",
      "package-lock.json",
      "wxt.config.ts",
      "wxt-env.d.ts",
      "tsconfig.json",
      "AGENTS.md",
      "LICENSE",
    ],
    excludeSources: ["**/.env*", "**/*.pem", "**/*.key", "web-ext.config.ts"],
    exclude: ["**/.env*", "**/*.pem", "**/*.key", "**/*.map"],
  },
  manifest,
});
