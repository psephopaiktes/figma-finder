import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const load = (file, globals, imports = {}) => {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const exports = {};
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  vm.runInNewContext(compiled, {
    exports,
    require: (name) => {
      if (name in imports) return imports[name];
      throw new Error(`Unexpected import: ${name}`);
    },
    URL,
    URLSearchParams,
    AbortController,
    AbortSignal,
    DOMException,
    Response,
    Headers,
    structuredClone,
    crypto,
    setTimeout,
    clearTimeout,
    console: { warn() {}, error() {} },
    $state: (value) => value,
    ...globals,
  });
  return exports;
};

const plain = (value) => JSON.parse(JSON.stringify(value));
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
const snapshotKey = (id) => `local:projectData:${encodeURIComponent(id)}`;

// Two independent module instances represent separate extension pages. They share
// only the storage and Web Locks boundaries, just as popup and sidebar do.
const fixture = () => {
  const data = {};
  const calls = [];
  const alerts = [];
  const queues = new Map();
  const clock = { now: Date.UTC(2026, 10, 6) };
  let active = 0;
  let peak = 0;
  const state = {
    projectIds: ["p0", "p1", "p2", "p3"],
    respond: undefined,
    beforeSet: undefined,
  };
  class ClockDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [clock.now]));
    }
    static now() {
      return clock.now;
    }
  }
  const storage = {
    getItem: async (key) => structuredClone(data[key] ?? null),
    setItem: async (key, value) => {
      const captured = structuredClone(value);
      await state.beforeSet?.(key, captured);
      data[key] = captured;
    },
    removeItem: async (key) => {
      delete data[key];
    },
    removeItems: async (keys) => {
      for (const key of keys) delete data[key];
    },
  };
  const navigator = {
    locks: {
      request: (name, options, callback) => {
        const run = callback ?? options;
        const next = (queues.get(name) ?? Promise.resolve()).then(run);
        queues.set(
          name,
          next.catch(() => {}),
        );
        return next;
      },
    },
  };
  const success = (url, init) => {
    const owner = new Headers(init.headers).get("Authorization");
    return Response.json(
      url.includes("/teams/")
        ? {
            projects: state.projectIds.map((id) => ({ id, name: id })),
          }
        : {
            files: [
              {
                key: "file",
                name: `Design ${owner}`,
                last_modified: "2026-11-06T00:00:00Z",
              },
            ],
          },
    );
  };
  const fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    active++;
    peak = Math.max(peak, active);
    try {
      if (state.respond) return await state.respond(String(url), init);
      // Yield so concurrency is measured rather than hidden by immediate mocks.
      await new Promise((done) => setTimeout(done, 1));
      return success(String(url), init);
    } finally {
      active--;
    }
  };
  const page = (id = "user", teams = { team: "Team" }) => {
    const globals = {
      storage,
      navigator,
      fetch,
      Date: ClockDate,
      alert: (message) => alerts.push(message),
    };
    const projects = load("src/lib/project-storage.ts", globals);
    const api = load("src/lib/store.svelte.ts", globals, {
      "@/lib/project-storage": projects,
      "@/lib/account-storage": {
        loadAccounts: async () => {
          throw new Error("Unexpected account reload");
        },
        persistOptions: async () => {},
      },
      "@/lib/i18n.svelte": {
        __esModule: true,
        default: { t: (translations) => translations.en },
      },
    });
    api.store.options.currentUser = id;
    api.store.options.users[id] = {
      email: `${id}@example.com`,
      handle: id,
      img_url: "",
      teams,
    };
    data["local:auth"] ??= {};
    const auth = data["local:auth"];
    auth[id] ??= {
      access_token: `${id}-access`,
      refresh_token: `${id}-refresh`,
      expires_at: clock.now + 3_600_000,
    };
    api.store.auth[id] = structuredClone(auth[id]);
    return { ...api, projects };
  };
  return {
    data,
    calls,
    alerts,
    clock,
    state,
    page,
    success,
    get peak() {
      return peak;
    },
  };
};

test("two pages share a fresh refresh and keep request concurrency bounded", async () => {
  const f = fixture();
  const first = f.page();
  const second = f.page();
  await Promise.all([first.loadFiles(), second.loadFiles()]);
  assert.equal(f.calls.length, 5);
  assert.ok(f.peak <= 2, `Unexpected request concurrency: ${f.peak}`);
  assert.deepEqual(plain(first.store.projects), plain(second.store.projects));
  assert.equal(Object.keys(first.store.projects).length, 4);
  const reopened = f.page();
  await reopened.loadFiles();
  assert.equal(f.calls.length, 5);
  assert.equal(Object.keys(reopened.store.projects).length, 4);
});

test("force bypasses cache freshness while ordinary reloads reuse it", async () => {
  const f = fixture();
  const page = f.page();
  await page.loadFiles();
  await page.loadFiles();
  assert.equal(f.calls.length, 5);
  await page.loadFiles({ force: true });
  assert.equal(f.calls.length, 10);
  f.clock.now += 5 * 60_000 + 1;
  await page.loadFiles();
  assert.equal(f.calls.length, 15);
});

test("team insertion order does not invalidate freshness, but changed teams do", async () => {
  const f = fixture();
  await f.page("user", { first: "First", second: "Second" }).loadFiles();
  const count = f.calls.length;
  const page = f.page("user", { second: "Second", first: "First" });
  await page.loadFiles();
  assert.equal(f.calls.length, count);
  page.store.options.users.user.teams.third = "Third";
  await page.loadFiles();
  assert.ok(
    f.calls
      .slice(count)
      .some(({ url }) => url.includes("/teams/third/projects")),
  );
});

test("fresh project caches are isolated between accounts", async () => {
  const f = fixture();
  const first = f.page("first");
  const second = f.page("second");
  await first.loadFiles();
  await second.loadFiles();
  assert.equal(f.calls.length, 10);
  assert.match(first.store.projects.p0.files.file.name, /first-access/);
  assert.match(second.store.projects.p0.files.file.name, /second-access/);
  assert.ok(f.data[snapshotKey("first")]);
  assert.ok(f.data[snapshotKey("second")]);
});

test("429 stops queued requests, aborts active work, and preserves cached data without modal alerts", async () => {
  const f = fixture();
  const page = f.page();
  await page.loadFiles();
  const before = plain(f.data[snapshotKey("user")]);
  const projects = [];
  let aborted = false;
  f.state.respond = async (url, init) => {
    if (url.includes("/teams/")) return f.success(url, init);
    projects.push(url);
    if (projects.length === 1)
      return new Response("private upstream body", {
        status: 429,
        headers: { "Retry-After": "120" },
      });
    return new Promise((_, reject) => {
      const abort = () => {
        aborted = true;
        reject(init.signal.reason ?? new DOMException("Aborted", "AbortError"));
      };
      if (init.signal.aborted) abort();
      else init.signal.addEventListener("abort", abort, { once: true });
    });
  };
  await assert.rejects(page.loadFiles({ force: true }), (error) => {
    assert.ok(error instanceof page.FigmaRateLimitError);
    assert.equal(error.retryAt, f.clock.now + 120_000);
    assert.ok(!error.message.includes("private upstream body"));
    return true;
  });
  assert.ok(projects.length <= 2);
  if (projects.length === 2) assert.equal(aborted, true);
  assert.equal(f.alerts.length, 0);
  const saved = f.data[snapshotKey("user")];
  assert.deepEqual(plain(saved.projects), before.projects);
  assert.deepEqual(plain(saved.order), before.order);
  assert.equal(saved.retryAt, f.clock.now + 120_000);
  const count = f.calls.length;
  const reopened = f.page();
  await assert.rejects(reopened.loadFiles({ force: true }));
  assert.equal(f.calls.length, count);
  f.clock.now += 120_001;
  f.state.respond = undefined;
  await reopened.loadFiles({ force: true });
  assert.equal(f.calls.length, count + 5);
  assert.equal(f.data[snapshotKey("user")].retryAt, 0);
});

test("Retry-After HTTP dates survive reopening the page", async () => {
  const f = fixture();
  const retryAt = f.clock.now + 90_000;
  f.state.respond = async () =>
    new Response("rate limited", {
      status: 429,
      headers: { "Retry-After": new Date(retryAt).toUTCString() },
    });
  await assert.rejects(f.page().loadFiles(), (error) => {
    assert.equal(error.retryAt, retryAt);
    return true;
  });
  const count = f.calls.length;
  await assert.rejects(f.page().loadFiles({ force: true }));
  assert.equal(f.calls.length, count);
});

test("failed team refresh preserves cached files and custom project order", async () => {
  const f = fixture();
  const page = f.page();
  await page.loadFiles();
  const order = [
    { id: "p3", open: false },
    { id: "p0", open: true },
    { id: "p2", open: false },
    { id: "p1", open: true },
  ];
  await page.projects.persistProjectOrder("user", order);
  const before = plain(f.data[snapshotKey("user")]);
  f.state.respond = async () => {
    throw new Error("Offline");
  };
  await assert.rejects(page.loadFiles({ force: true }), /Offline/);
  assert.deepEqual(plain(page.store.projects), before.projects);
  assert.deepEqual(plain(page.store.localProjectState), order);
  assert.deepEqual(plain(f.data[snapshotKey("user")]), before);
});

test("successful refresh keeps saved order and collapse state while reconciling project IDs", async () => {
  const f = fixture();
  f.state.projectIds = ["a", "gone", "b"];
  const page = f.page();
  await page.loadFiles();
  await page.projects.persistProjectOrder("user", [
    { id: "b", open: false },
    { id: "gone", open: false },
    { id: "a", open: true },
  ]);
  f.state.projectIds = ["a", "b", "new"];
  await page.loadFiles({ force: true });
  assert.deepEqual(plain(page.store.localProjectState), [
    { id: "b", open: false },
    { id: "a", open: true },
    { id: "new", open: true },
  ]);
  assert.equal(page.store.projects.gone, undefined);
  assert.equal(
    page.store.projects.new.files.file.name,
    "Design Bearer user-access",
  );
});

test("a reorder made while refresh commits survives in both the UI and storage", async () => {
  const f = fixture();
  const page = f.page();
  await page.loadFiles();
  const committing = deferred();
  const resume = deferred();
  let blocked = false;
  f.state.beforeSet = async (key) => {
    if (key === snapshotKey("user") && !blocked) {
      blocked = true;
      committing.resolve();
      await resume.promise;
    }
  };
  const refreshing = page.loadFiles({ force: true });
  await committing.promise;
  const changed = [
    { id: "p3", open: false },
    { id: "p1", open: true },
    { id: "p0", open: false },
    { id: "p2", open: true },
  ];
  try {
    page.store.localProjectState = structuredClone(changed);
    // Persistence queues behind the refresh's short storage transaction.
    const saving = page.saveProjectOrder();
    resume.resolve();
    await Promise.all([refreshing, saving]);
    assert.deepEqual(plain(page.store.localProjectState), changed);
    assert.deepEqual(plain(f.data[snapshotKey("user")].order), changed);
  } finally {
    resume.resolve();
  }
});

test("a stale page's collapse preserves another page's newer order and shows its canonical result", async () => {
  const f = fixture();
  const first = f.page();
  const stale = f.page();
  await first.loadFiles();
  await stale.loadFiles();
  const reversed = plain(first.store.localProjectState).reverse();
  first.store.localProjectState = structuredClone(reversed);
  await first.saveProjectOrder();
  const collapsed = stale.store.localProjectState.find(({ id }) => id === "p0");
  collapsed.open = false;
  await stale.saveProjectOrder();
  const expected = reversed.map((entry) =>
    entry.id === "p0" ? { ...entry, open: false } : entry,
  );
  assert.deepEqual(plain(f.data[snapshotKey("user")].order), expected);
  assert.deepEqual(plain(stale.store.localProjectState), expected);
});

test("an immediate undo queued behind a pending reorder remains the final UI and storage order", async () => {
  const f = fixture();
  const page = f.page();
  await page.loadFiles();
  const original = plain(page.store.localProjectState);
  const committing = deferred();
  const resume = deferred();
  let blocked = false;
  f.state.beforeSet = async (key) => {
    if (key === snapshotKey("user") && !blocked) {
      blocked = true;
      committing.resolve();
      await resume.promise;
    }
  };
  page.store.localProjectState = [...structuredClone(original)].reverse();
  const saving = page.saveProjectOrder();
  await committing.promise;
  try {
    page.store.localProjectState = structuredClone(original);
    const undoing = page.saveProjectOrder();
    resume.resolve();
    await Promise.all([saving, undoing]);
    assert.deepEqual(plain(page.store.localProjectState), original);
    assert.deepEqual(plain(f.data[snapshotKey("user")].order), original);
  } finally {
    resume.resolve();
  }
});

test("an in-flight refresh cannot overwrite an account switch or mix access tokens", async () => {
  const f = fixture();
  const page = f.page("first");
  const started = deferred();
  const resume = deferred();
  f.state.respond = async (url, init) => {
    if (url.includes("/teams/")) {
      started.resolve();
      await resume.promise;
    }
    return f.success(url, init);
  };
  const refreshing = page.loadFiles();
  await started.promise;
  page.store.options.currentUser = "second";
  page.store.options.users.second = { teams: { other: "Other team" } };
  page.store.auth.second = { access_token: "second-access" };
  f.data["local:auth"].second = plain(page.store.auth.second);
  const secondProjects = { second: { name: "Second account", files: {} } };
  page.store.projects = secondProjects;
  resume.resolve();
  await Promise.allSettled([refreshing]);
  assert.equal(page.store.options.currentUser, "second");
  assert.deepEqual(plain(page.store.projects), secondProjects);
  for (const { init } of f.calls)
    assert.equal(
      new Headers(init.headers).get("Authorization"),
      "Bearer first-access",
    );
});

test("a stale page cannot fetch or recreate project data after another page logs out", async () => {
  const f = fixture();
  const stale = f.page();
  await stale.loadFiles();
  const count = f.calls.length;
  await stale.projects.clearProjectSnapshot("user");
  delete f.data["local:auth"].user;
  // The stale page has not yet observed the cross-page auth storage change.
  assert.ok(stale.store.auth.user);
  await Promise.allSettled([stale.loadFiles({ force: true })]);
  assert.equal(f.calls.length, count);
  assert.equal(f.data[snapshotKey("user")], undefined);
});

test("credentials removed during a refresh prevent its late cache commit", async () => {
  const f = fixture();
  const page = f.page();
  const started = deferred();
  const resume = deferred();
  f.state.respond = async (url, init) => {
    if (url.includes("/teams/")) {
      started.resolve();
      await resume.promise;
    }
    return f.success(url, init);
  };
  const refreshing = page.loadFiles();
  await started.promise;
  delete f.data["local:auth"].user;
  resume.resolve();
  await Promise.allSettled([refreshing]);
  assert.equal(f.data[snapshotKey("user")], undefined);
});
