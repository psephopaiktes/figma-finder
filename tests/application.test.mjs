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
    .replaceAll("import.meta.env.WXT_AUTH_BASE_URL", "undefined");
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
    AbortSignal,
    console: { warn() {}, error() {} },
    $state: (value) => value,
    ...globals,
  });
  return exports;
};

const i18n = {
  __esModule: true,
  default: { t: (translations) => translations.en },
};

const makeAccounts = (initial = {}) => {
  const data = structuredClone(initial);
  const writes = [];
  const queues = new Map();
  const navigator = {
    locks: {
      request: (name, callback) => {
        const next = (queues.get(name) ?? Promise.resolve()).then(callback);
        queues.set(
          name,
          next.catch(() => {}),
        );
        return next;
      },
    },
  };
  const storage = {
    getItem: async (key) => structuredClone(data[key] ?? null),
    setItem: async (key, value) => {
      data[key] = structuredClone(value);
      writes.push([key, structuredClone(value)]);
    },
    removeItem: async (key) => {
      delete data[key];
    },
  };
  const accounts = load("src/lib/account-storage.ts", { storage, navigator });
  const projects = load("src/lib/project-storage.ts", { storage, navigator });
  return { data, writes, storage, navigator, accounts, projects };
};
const auth = (
  callback = (state) =>
    `https://test.chromiumapp.org/?state=${state}&code=code`,
  fixture = makeAccounts(),
) => {
  const store = { auth: {}, options: { currentUser: null, users: {} } };
  const requests = [];
  const messages = [];
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
      fetch: async (url, init) => {
        requests.push({ url, init });
        const custom = await fixture.respond?.(url, init);
        if (custom) return custom;
        return {
          ok: true,
          status: 200,
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
      storage: fixture.storage,
      alert: (message) => messages.push(message),
      console: { warn: (message) => messages.push(message) },
      confirm: () => true,
    },
    {
      "@/lib/store.svelte": {
        store,
        applyAccounts: (state) => {
          store.auth = state.auth;
          store.options = state.options;
        },
      },
      "@/lib/account-storage": fixture.accounts,
      "@/lib/project-storage": fixture.projects,
      "@/lib/auth-config": { getAuthBaseUrl: () => "https://auth.test" },
      "@/lib/i18n.svelte": i18n,
    },
  ).default;
  return { api, store, requests, messages, ...fixture };
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

test("Worker login keeps credentials local and rotated refresh tokens are persisted", async () => {
  for (const add of [false, true]) {
    const { api, store, writes, data, requests } = auth();
    assert.equal(await api.logIn({ add }), true);
    assert.equal(store.options.currentUser, "user");
    assert.equal(store.options.users.user.refresh_token, undefined);
    assert.equal(data["local:auth"].user.refresh_token, "new-refresh");
    assert.equal(requests[0].url, "https://auth.test/oauth/exchange");
    assert.equal(requests[0].init.headers.Authorization, undefined);
    assert.equal(requests[0].init.credentials, "omit");
    assert.equal(JSON.parse(requests[0].init.body).code, "code");
    data["local:auth"].user.refresh_token = "old-refresh";
    data["local:auth"].user.expires_at = 0;
    assert.equal(await api.refreshTokens(), true);
    assert.equal(store.auth.user.refresh_token, "new-refresh");
    assert.equal(requests.at(-1).url, "https://auth.test/oauth/refresh");
    assert.equal(
      JSON.parse(requests.at(-1).init.body).refresh_token,
      "old-refresh",
    );
    for (const [key, value] of writes) {
      if (key === "sync:options")
        assert.ok(!JSON.stringify(value).includes("new-refresh"));
    }
  }
});

test("login failures report a safe stage and status without leaking credentials or exception text", async () => {
  const sensitive = "private-code-token-or-url";
  for (const failure of ["exchange", "profile", "storage", "authorization"]) {
    const fixture = makeAccounts();
    fixture.respond = (url) => {
      if (
        (failure === "exchange" && url.endsWith("/oauth/exchange")) ||
        (failure === "profile" && url.endsWith("/me"))
      )
        return {
          ok: false,
          status: 502,
          json: async () => ({ error: sensitive }),
        };
    };
    if (failure === "storage")
      fixture.storage.setItem = async () => {
        throw new Error(sensitive);
      };
    const client = auth(
      failure === "authorization"
        ? () => {
            throw new Error(sensitive);
          }
        : undefined,
      fixture,
    );
    assert.equal(await client.api.logIn(), false);
    assert.equal(client.store.options.currentUser, null);
    assert.equal(client.messages.length, 2);
    for (const message of client.messages) {
      assert.ok(message.includes(failure));
      assert.ok(!message.includes(sensitive));
      assert.ok(!message.includes("new-access"));
      assert.ok(!message.includes("new-refresh"));
    }
    if (["exchange", "profile"].includes(failure))
      assert.ok(client.messages.at(-1).includes("502"));
  }
});

const accountProfile = {
  email: "test@example.com",
  handle: "test",
  img_url: "",
  teams: { team: "Team" },
};
const accountTokens = {
  access_token: "access",
  refresh_token: "refresh",
  expires_at: 0,
};
const savedAccounts = () => ({
  "sync:options": {
    currentUser: "user",
    users: { user: accountProfile },
    theme: "dark",
    locale: "ja",
    openInApp: false,
  },
  "local:auth": { user: accountTokens },
});

test("legacy credentials are copied before sync cleanup, with teams and preferences preserved", async () => {
  const legacy = {
    currentUser: "user",
    theme: "dark",
    locale: "ja",
    users: { user: { ...accountProfile, ...accountTokens } },
  };
  const fixture = makeAccounts({ "sync:options": legacy });
  const first = await fixture.accounts.loadAccounts();
  assert.equal(first.auth.user.refresh_token, "refresh");
  assert.equal(first.options.users.user.teams.team, "Team");
  assert.equal(first.options.theme, "dark");
  assert.equal(first.options.locale, "ja");
  assert.deepEqual(
    fixture.writes.map(([key]) => key),
    ["local:auth", "sync:options"],
  );
  assert.equal(
    fixture.data["sync:options"].users.user.refresh_token,
    undefined,
  );
  await fixture.accounts.loadAccounts();
  assert.equal(fixture.writes.length, 2);
});

test("migration retries safely after a local-save or sync-cleanup failure", async () => {
  for (const failureKey of ["local:auth", "sync:options"]) {
    const fixture = makeAccounts({
      "sync:options": {
        currentUser: "user",
        users: { user: { ...accountProfile, ...accountTokens } },
      },
    });
    const original = fixture.storage.setItem;
    fixture.storage.setItem = async (key, value) => {
      if (key === failureKey) throw new Error("test failure");
      return original(key, value);
    };
    await assert.rejects(fixture.accounts.loadAccounts());
    assert.equal(
      fixture.data["sync:options"].users.user.refresh_token,
      "refresh",
    );
    fixture.storage.setItem = original;
    await fixture.accounts.loadAccounts();
    assert.equal(fixture.data["local:auth"].user.refresh_token, "refresh");
    assert.equal(
      fixture.data["sync:options"].users.user.refresh_token,
      undefined,
    );
  }
});

test("a stale synchronized token never replaces an already rotated local token", async () => {
  const fixture = makeAccounts(savedAccounts());
  fixture.data["sync:options"].users.user = {
    ...accountProfile,
    ...accountTokens,
    refresh_token: "old-sync-refresh",
  };
  fixture.data["local:auth"].user.refresh_token = "rotated-local-refresh";
  await fixture.accounts.loadAccounts();
  assert.equal(
    fixture.data["local:auth"].user.refresh_token,
    "rotated-local-refresh",
  );
  assert.equal(
    fixture.data["sync:options"].users.user.refresh_token,
    undefined,
  );
});

test("sync writes strip credentials and stale preference pages cannot erase or resurrect accounts", async () => {
  const fixture = makeAccounts(savedAccounts());
  const stale = structuredClone(fixture.data["sync:options"]);
  stale.users.user = { ...accountProfile, ...accountTokens };
  fixture.data["sync:options"].users.new = structuredClone(accountProfile);
  await fixture.accounts.persistOptions(stale);
  assert.ok(fixture.data["sync:options"].users.new);
  assert.equal(fixture.data["sync:options"].users.user.access_token, undefined);
  delete fixture.data["sync:options"].users.user;
  delete fixture.data["local:auth"].user;
  fixture.data["sync:options"].currentUser = "new";
  await fixture.accounts.persistOptions(stale);
  assert.equal(fixture.data["sync:options"].users.user, undefined);
  assert.equal(fixture.data["sync:options"].currentUser, "new");
});

test("two extension pages refreshing concurrently perform a single token rotation", async () => {
  const fixture = makeAccounts(savedAccounts());
  const first = auth(undefined, fixture);
  const second = auth(undefined, fixture);
  first.store.options.currentUser = "user";
  second.store.options.currentUser = "user";
  const results = await Promise.all([
    first.api.refreshTokens(),
    second.api.refreshTokens(),
  ]);
  assert.deepEqual(results, [true, true]);
  assert.equal(first.requests.length + second.requests.length, 1);
  assert.equal(fixture.data["local:auth"].user.refresh_token, "new-refresh");
});

test("invalid grants require re-login while temporary failures retain credentials", async () => {
  for (const status of [400, 429, 500]) {
    const fixture = makeAccounts(savedAccounts());
    fixture.respond = async () => ({ ok: false, status });
    const client = auth(undefined, fixture);
    client.store.options.currentUser = "user";
    assert.equal(await client.api.refreshTokens(), false);
    assert.equal(Boolean(fixture.data["local:auth"].user), status !== 400);
    assert.ok(fixture.data["sync:options"].users.user);
  }
});

test("refresh responses without a new refresh token preserve the current one", async () => {
  const fixture = makeAccounts(savedAccounts());
  fixture.respond = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ access_token: "rotated-access", expires_in: 3600 }),
  });
  const client = auth(undefined, fixture);
  client.store.options.currentUser = "user";
  assert.equal(await client.api.refreshTokens(), true);
  assert.equal(fixture.data["local:auth"].user.refresh_token, "refresh");
});

test("logout removes local credentials and synced account metadata", async () => {
  const fixture = makeAccounts(savedAccounts());
  fixture.data["local:projectData:user"] = { projects: { private: {} } };
  fixture.data["local:projectData:other"] = { projects: { retained: {} } };
  const client = auth(undefined, fixture);
  client.store.options.currentUser = "user";
  assert.equal(await client.api.logOut(), true);
  assert.equal(fixture.data["local:auth"].user, undefined);
  assert.equal(fixture.data["sync:options"].users.user, undefined);
  assert.equal(fixture.data["sync:options"].currentUser, null);
  assert.equal(fixture.data["local:projectData:user"], undefined);
  assert.ok(fixture.data["local:projectData:other"]);
});

test("reauthentication preserves teams and duplicate login retains newly issued tokens", async () => {
  for (const duplicate of [true, false]) {
    const fixture = makeAccounts(savedAccounts());
    if (!duplicate) delete fixture.data["local:auth"].user;
    const client = auth(undefined, fixture);
    assert.equal(await client.api.logIn(), !duplicate);
    assert.equal(fixture.data["local:auth"].user.refresh_token, "new-refresh");
    assert.equal(fixture.data["sync:options"].users.user.teams.team, "Team");
    assert.equal(
      fixture.data["sync:options"].users.user.refresh_token,
      undefined,
    );
  }
});

test("the auth endpoint accepts HTTPS origins only", () => {
  const { getAuthBaseUrl } = load("src/lib/auth-config.ts");
  assert.equal(
    getAuthBaseUrl(),
    "https://figma-finder.hirataakira6.workers.dev",
  );
  assert.equal(
    getAuthBaseUrl("https://example.workers.dev/"),
    "https://example.workers.dev",
  );
  for (const value of [
    "http://example.test",
    "https://user:pass@example.test",
    "https://example.test/path",
    "https://example.test?x=1",
    "https://example.test/#hash",
  ]) {
    assert.throws(() => getAuthBaseUrl(value));
  }
});

test("Welcome page opens on installation without reading tab information", () => {
  for (const chrome of [true, false]) {
    let onInstalled;
    const created = [];
    load(
      "src/entrypoints/background.ts",
      {
        defineBackground: (callback) => callback(),
        chrome: { sidePanel: { setPanelBehavior: async () => {} } },
        browser: {
          runtime: {
            getURL: (path) => `chrome-extension://test${path}`,
            onInstalled: {
              addListener: (callback) => {
                onInstalled = callback;
              },
            },
          },
          tabs: {
            create: (options) => {
              created.push(options.url);
            },
          },
          action: { onClicked: { addListener() {} } },
          commands: { onCommand: { addListener() {} } },
        },
      },
      {},
      chrome,
    );
    onInstalled({ reason: "update" });
    assert.deepEqual(created, []);
    onInstalled({ reason: "install" });
    assert.deepEqual(created, ["chrome-extension://test/help.html?welcome"]);
  }
});

test("Sidebar opens using only non-sensitive tab window information", async () => {
  for (const chrome of [true, false]) {
    const calls = [];
    const tab = { windowId: 42 };
    for (const property of ["url", "pendingUrl", "title", "favIconUrl"]) {
      Object.defineProperty(tab, property, {
        get() {
          throw new Error(`Sensitive tab property accessed: ${property}`);
        },
      });
    }
    const { openSidePanel } = load(
      "src/lib/utility.svelte.ts",
      {
        navigator: { userAgent: "test" },
        browser: {
          tabs: {
            query: async (options) => {
              assert.equal(options.active, true);
              assert.equal(options.currentWindow, true);
              return [tab];
            },
          },
          sidebarAction: {
            open: async () => calls.push("sidebar"),
          },
        },
        chrome: {
          sidePanel: {
            open: async ({ windowId }) => calls.push(windowId),
          },
        },
      },
      { "@/lib/i18n.svelte": i18n },
      chrome,
    );
    await openSidePanel();
    assert.deepEqual(calls, chrome ? [42] : ["sidebar"]);
  }
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
