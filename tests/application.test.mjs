import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Exercise the actual TypeScript functions with browser/network/storage boundaries mocked.
// Rune identity is sufficient here: these tests do not assert Svelte rendering or reactivity.
const load = (file, globals = {}, imports = {}, chrome = true) => {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8")
    .replaceAll("import.meta.env.CHROME", String(chrome))
    .replaceAll("import.meta.env.WXT_FIGMA_ID", '"test-client"')
    .replaceAll("import.meta.env.WXT_FIGMA_SECRET", '"test-only-value"');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require: (name) => {
      if (name in imports) return imports[name];
      throw new Error(`Unexpected import: ${name}`);
    },
    URL,
    URLSearchParams,
    Date,
    crypto,
    btoa,
    console: { warn() {}, error() {} },
    $state: (value) => value,
    ...globals,
  });
  return exports;
};

const i18n = { default: { t: (translations) => translations.en } };

const auth = (
  callback = (state) =>
    `https://test.chromiumapp.org/?state=${state}&code=code`,
) => {
  const store = { options: { currentUser: null, users: {} } };
  const requests = [];
  const writes = [];
  const api = load(
    "src/lib/oauth.svelte.ts",
    {
      browser: {
        identity: {
          getRedirectURL: () => "https://test.chromiumapp.org/",
          launchWebAuthFlow: async ({ url }) => {
            const parsed = new URL(url);
            const params = parsed.searchParams.has("cont")
              ? new URL(
                  `https://www.figma.com${parsed.searchParams.get("cont")}`,
                ).searchParams
              : parsed.searchParams;
            assert.notEqual(params.get("state"), "null");
            return callback(params.get("state"));
          },
        },
      },
      fetch: async (url) => {
        requests.push(url);
        return {
          ok: true,
          json: async () =>
            url.endsWith("/me")
              ? { email: "test@example.com", handle: "test", img_url: "" }
              : {
                  user_id: "user",
                  access_token: "new-access",
                  refresh_token: "new-refresh",
                  expires_in: 3600,
                },
        };
      },
      storage: {
        setItem: async (...args) => writes.push(args),
        removeItem: async () => {},
      },
      alert() {},
      confirm: () => true,
    },
    { "@/lib/store.svelte": { store }, "@/lib/i18n.svelte": i18n },
  ).default;
  return { api, store, requests, writes };
};

test("OAuth rejects mismatched state, foreign redirect, error, and missing code before token exchange", async () => {
  for (const callback of [
    () => "https://test.chromiumapp.org/?state=wrong&code=code",
    (state) => `https://other.example/?state=${state}&code=code`,
    (state) => `https://test.chromiumapp.org/wrong?state=${state}&code=code`,
    (state) => `https://test.chromiumapp.org/?state=${state}&error=denied`,
    (state) => `https://test.chromiumapp.org/?state=${state}`,
  ]) {
    const { api, requests } = auth(callback);
    assert.equal(await api.logIn(), false);
    assert.equal(requests.length, 0);
  }
});

test("OAuth login, additional account login, and rotated refresh token are persisted", async () => {
  for (const add of [false, true]) {
    const { api, store, writes } = auth();
    assert.equal(await api.logIn({ add }), true);
    assert.equal(store.options.currentUser, "user");
    store.options.users.user.refresh_token = "old-refresh";
    assert.equal(await api.refreshTokens(), true);
    assert.equal(store.options.users.user.refresh_token, "new-refresh");
    assert.equal(writes.at(-1)[0], "sync:options");
  }
});

test("Failed team fetch preserves cached files and order without writing empty projects", async () => {
  const writes = [];
  const cached = {
    old: { name: "Cached", team: "Team", files: { key: { name: "File" } } },
  };
  const mod = load(
    "src/lib/store.svelte.ts",
    {
      storage: {
        getItem: async (key) =>
          key === "local:projects" ? cached : '[{"id":"old","open":false}]',
        setItem: async (...args) => writes.push(args),
      },
      fetch: async () => {
        throw new Error("Offline");
      },
    },
    { "@/lib/i18n.svelte": i18n },
  );
  mod.store.options.currentUser = "user";
  mod.store.options.users.user = {
    access_token: "token",
    teams: { team: "Team" },
  };
  await assert.rejects(mod.loadFiles(), /Offline/);
  assert.equal(mod.store.projects.old.name, "Cached");
  assert.equal(mod.store.localProjectState[0].open, false);
  assert.equal(writes.length, 0);
});

test("Successful file refresh keeps existing order, appends new projects and removes deleted ones", async () => {
  const writes = [];
  const mod = load(
    "src/lib/store.svelte.ts",
    {
      storage: {
        getItem: async (key) =>
          key === "local:projects"
            ? { old: {}, gone: {} }
            : '[{"id":"gone","open":true},{"id":"old","open":false}]',
        setItem: async (...args) => writes.push(args),
      },
      fetch: async (url) => ({
        ok: true,
        json: async () =>
          url.includes("/teams/")
            ? {
                projects: [
                  { id: "new", name: "New" },
                  { id: "old", name: "Old" },
                ],
              }
            : {
                files: [
                  { key: "file", name: "Design", last_modified: "2026-01-01" },
                ],
              },
      }),
    },
    { "@/lib/i18n.svelte": i18n },
  );
  mod.store.options.currentUser = "user";
  mod.store.options.users.user = {
    access_token: "token",
    teams: { team: "Team" },
  };
  await mod.loadFiles();
  assert.equal(
    JSON.stringify(mod.store.localProjectState),
    '[{"id":"old","open":false},{"id":"new","open":true}]',
  );
  assert.equal(mod.store.projects.gone, undefined);
  assert.equal(mod.store.projects.new.files.file.name, "Design");
  assert.equal(writes.at(-1)[0], "local:projects");
  mod.store.options.currentUser = null;
  assert.equal(mod.user(), null);
});

test("Chrome and Firefox shortcut await popup setup and restore toolbar sidebar behavior", async () => {
  for (const chrome of [true, false]) {
    let command;
    let click;
    const calls = [];
    load(
      "src/entrypoints/background.ts",
      {
        defineBackground: (callback) => callback(),
        chrome: { sidePanel: { setPanelBehavior: async () => {} } },
        browser: {
          runtime: { onInstalled: { addListener() {} } },
          action: {
            onClicked: {
              addListener: (callback) => {
                click = callback;
              },
            },
            setPopup: async ({ popup }) => {
              await Promise.resolve();
              calls.push(popup);
            },
            openPopup: async () => {
              calls.push("open");
            },
          },
          sidebarAction: {
            open: () => {
              calls.push("sidebar");
            },
          },
          commands: {
            onCommand: {
              addListener: (callback) => {
                command = callback;
              },
            },
          },
        },
      },
      {},
      chrome,
    );
    await command("open-popup");
    assert.deepEqual(calls, ["popup.html", "open", ""]);
    if (!chrome) {
      click();
      assert.equal(calls.at(-1), "sidebar");
    }
  }
});
