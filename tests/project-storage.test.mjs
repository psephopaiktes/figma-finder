import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const key = (id) => `local:projectData:${encodeURIComponent(id)}`;
const project = (name, team = "Team") => ({ name, team, files: {} });
const order = (...ids) => ids.map((id) => ({ id, open: true }));

function fixture(initial = {}) {
  const data = structuredClone(initial);
  const writes = [];
  const queues = new Map();
  const storage = {
    getItem: async (name) => structuredClone(data[name] ?? null),
    setItem: async (name, value) => {
      data[name] = structuredClone(value);
      writes.push([name, structuredClone(value)]);
    },
    removeItem: async (name) => {
      delete data[name];
    },
  };
  const navigator = {
    locks: {
      request: (name, change) => {
        const next = (queues.get(name) ?? Promise.resolve()).then(change);
        queues.set(
          name,
          next.catch(() => {}),
        );
        return next;
      },
    },
  };
  const source = readFileSync(
    new URL("../src/lib/project-storage.ts", import.meta.url),
    "utf8",
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, navigator, storage, Date });
  return { api: exports, data, writes };
}

const plain = (value) => JSON.parse(JSON.stringify(value));

test("project caches and custom order remain isolated when switching A to B to A", async () => {
  const { api, data } = fixture();
  await api.commitProjectSnapshot(
    "account/a:b",
    { a1: project("One"), a2: project("Two") },
    "teams-a",
    100,
  );
  await api.persistProjectOrder("account/a:b", [
    { id: "a2", open: false },
    { id: "a1", open: true },
  ]);
  await api.commitProjectSnapshot(
    "account-b",
    { b1: project("Other") },
    "teams-b",
    200,
  );
  const a = await api.readProjectSnapshot("account/a:b");
  const b = await api.readProjectSnapshot("account-b");
  assert.deepEqual(plain(a.order), [
    { id: "a2", open: false },
    { id: "a1", open: true },
  ]);
  assert.deepEqual(Object.keys(a.projects), ["a1", "a2"]);
  assert.deepEqual(Object.keys(b.projects), ["b1"]);
  assert.equal(a.signature, "teams-a");
  assert.equal(b.fetchedAt, 200);
  assert.ok(data["local:projectData:account%2Fa%3Ab"]);
  assert.equal(data["local:projects"], undefined);
  assert.equal(data["local:localProjectState"], undefined);
});

test("legacy order is a candidate only and migrates against each account's actual project IDs", async () => {
  const legacy = JSON.stringify([
    { id: "a2", open: false },
    { id: "b2", open: false },
    ...order("a1", "b1", "gone"),
  ]);
  const { api, data } = fixture({
    "local:projects": { private: project("Unknown account's cache") },
    "local:localProjectState": legacy,
  });
  const initial = await api.readProjectSnapshot("a");
  assert.deepEqual(Object.keys(initial.projects), []);
  assert.equal(initial.fetchedAt, 0);
  await api.persistProjectOrder("a", []);
  assert.equal(data[key("a")], undefined);
  await api.commitProjectSnapshot(
    "a",
    { a1: project("One"), a2: project("Two") },
    "a",
    100,
  );
  await api.commitProjectSnapshot(
    "b",
    { b1: project("One"), b2: project("Two") },
    "b",
    100,
  );
  assert.deepEqual(plain((await api.readProjectSnapshot("a")).order), [
    { id: "a2", open: false },
    { id: "a1", open: true },
  ]);
  assert.deepEqual(plain((await api.readProjectSnapshot("b")).order), [
    { id: "b2", open: false },
    { id: "b1", open: true },
  ]);
  assert.equal(data["local:localProjectState"], legacy);
  assert.ok(data["local:projects"].private);
});

test("a refresh re-reads order after fetch and preserves a reorder saved by another page", async () => {
  const { api } = fixture();
  await api.commitProjectSnapshot(
    "a",
    { a1: project("One"), a2: project("Two") },
    "a",
    10,
  );
  let release;
  let entered;
  const fetching = new Promise((resolve) => {
    entered = resolve;
  });
  const blocked = new Promise((resolve) => {
    release = resolve;
  });
  const refresh = api.withProjectRefreshLock("a", async () => {
    entered();
    await blocked;
    return api.commitProjectSnapshot(
      "a",
      {
        a1: project("One"),
        a2: project("Two"),
        newZ: project("Zulu"),
        newA: project("Alpha"),
      },
      "a",
      20,
    );
  });
  await fetching;
  // A short order save must not wait for the unrelated network/refresh lock.
  try {
    await api.persistProjectOrder("a", [
      { id: "a2", open: false },
      ...order("a1"),
    ]);
  } finally {
    release();
  }
  const result = await refresh;
  assert.deepEqual(plain(result.order), [
    { id: "a2", open: false },
    ...order("a1", "newA", "newZ"),
  ]);
});

test("a stale page's order save cannot erase newly added projects or their open state", async () => {
  const { api } = fixture();
  await api.commitProjectSnapshot(
    "a",
    { a: project("A"), b: project("B"), new: project("New") },
    "a",
    10,
  );
  await api.persistProjectOrder("a", [
    { id: "new", open: false },
    ...order("a", "b"),
  ]);
  const result = await api.persistProjectOrder("a", [
    ...order("b", "a"),
    { id: "deleted", open: true },
  ]);
  assert.deepEqual(plain(result.order), [
    ...order("b", "a"),
    { id: "new", open: false },
  ]);
  assert.ok(result.projects.new);
  assert.equal(result.projects.deleted, undefined);
});

test("folding in a stale page preserves a newer order and newly added project positions", async () => {
  const { api } = fixture();
  const baseline = order("a", "b");
  await api.commitProjectSnapshot(
    "a",
    { a: project("A"), b: project("B"), added: project("Added") },
    "teams",
    10,
  );
  await api.persistProjectOrder("a", [
    { id: "added", open: false },
    ...order("b", "a"),
  ]);
  const saved = await api.persistProjectOrder(
    "a",
    [{ id: "a", open: false }, ...order("b")],
    JSON.stringify(baseline),
  );
  assert.deepEqual(plain(saved.order), [
    { id: "added", open: false },
    { id: "b", open: true },
    { id: "a", open: false },
  ]);
});

test("an explicit reorder preserves another page's newer fold when its flag was untouched", async () => {
  const { api } = fixture();
  const baseline = order("a", "b");
  await api.commitProjectSnapshot(
    "a",
    { a: project("A"), b: project("B") },
    "teams",
    10,
  );
  await api.persistProjectOrder("a", [{ id: "a", open: false }, ...order("b")]);
  const saved = await api.persistProjectOrder("a", order("b", "a"), baseline);
  assert.deepEqual(plain(saved.order), [
    { id: "b", open: true },
    { id: "a", open: false },
  ]);
});

test("malformed legacy data is ignored without overwriting it or writing initial empty order", async () => {
  for (const malformed of ["{broken", "null", '{"id":"a"}', 123, null]) {
    const { api, data, writes } = fixture({
      "local:localProjectState": malformed,
    });
    assert.deepEqual(plain((await api.readProjectSnapshot("a")).order), []);
    await api.persistProjectOrder("a", []);
    assert.equal(writes.length, 0);
    assert.equal(data["local:localProjectState"], malformed);
    const result = await api.commitProjectSnapshot(
      "a",
      { z: project("Z"), a: project("A") },
      "a",
      10,
    );
    assert.deepEqual(plain(result.order), order("a", "z"));
  }
});

test("valid saved order survives malformed project contents and a cooldown-only update", async () => {
  const saved = [{ id: "b", open: false }, ...order("a")];
  const { api } = fixture({
    [key("a")]: { order: saved, projects: "malformed" },
  });
  await api.setProjectRetryAt("a", 1234);
  const result = await api.commitProjectSnapshot(
    "a",
    { a: project("A"), b: project("B") },
    "teams",
    20,
  );
  assert.deepEqual(plain(result.order), saved);
});

test("a malformed owned order falls back to valid legacy order without an empty overwrite", async () => {
  const saved = [{ id: "b", open: false }, ...order("a")];
  for (const malformed of ["{broken", [{ id: "a", open: "wrong type" }]]) {
    const { api, writes } = fixture({
      [key("a")]: {
        projects: { a: project("A"), b: project("B") },
        order: malformed,
        fetchedAt: 10,
      },
      "local:localProjectState": JSON.stringify(saved),
    });
    assert.deepEqual(plain((await api.readProjectSnapshot("a")).order), saved);
    await api.persistProjectOrder("a", []);
    assert.equal(writes.length, 0);
    const refreshed = await api.commitProjectSnapshot(
      "a",
      { a: project("A"), b: project("B") },
      "teams",
      20,
    );
    assert.deepEqual(plain(refreshed.order), saved);
  }
});

test("cooldown updates preserve cache metadata and first-429 records retain legacy migration", async () => {
  const { api, data } = fixture({
    "local:localProjectState": JSON.stringify([
      { id: "b", open: false },
      ...order("a"),
    ]),
  });
  const cooldown = await api.setProjectRetryAt("a", 500);
  assert.equal(cooldown.retryAt, 500);
  assert.equal(cooldown.fetchedAt, 0);
  assert.deepEqual(Object.keys(cooldown.projects), []);
  const result = await api.commitProjectSnapshot(
    "a",
    { a: project("A"), b: project("B") },
    "teams",
    100,
  );
  assert.deepEqual(plain(result.order), [
    { id: "b", open: false },
    ...order("a"),
  ]);
  assert.equal(result.retryAt, 0);
  const before = structuredClone(data[key("a")]);
  await api.setProjectRetryAt("a", 700);
  const after = data[key("a")];
  assert.deepEqual(after.projects, before.projects);
  assert.deepEqual(after.order, before.order);
  assert.equal(after.signature, before.signature);
  assert.equal(after.fetchedAt, before.fetchedAt);
  assert.equal(after.retryAt, 700);
});

test("clear waits for an in-flight refresh then removes only that account's snapshot", async () => {
  const { api, data } = fixture();
  await api.commitProjectSnapshot("a", { a: project("A") }, "a", 10);
  await api.commitProjectSnapshot("b", { b: project("B") }, "b", 10);
  let release;
  let entered;
  const fetching = new Promise((resolve) => {
    entered = resolve;
  });
  const blocked = new Promise((resolve) => {
    release = resolve;
  });
  const refresh = api.withProjectRefreshLock("a", async () => {
    entered();
    await blocked;
    await api.commitProjectSnapshot("a", { late: project("Late") }, "a", 20);
  });
  await fetching;
  let cleared = false;
  const clearing = api.clearProjectSnapshot("a").then(() => {
    cleared = true;
  });
  await Promise.resolve();
  assert.equal(cleared, false);
  release();
  await Promise.all([refresh, clearing]);
  assert.equal(data[key("a")], undefined);
  assert.ok(data[key("b")]);
});

test("clear holds the refresh lock through auth cleanup before allowing the next fetch", async () => {
  const { api, data } = fixture();
  await api.commitProjectSnapshot("a", { a: project("A") }, "a", 10);
  let releaseAuth;
  let enteredAuth;
  const entered = new Promise((resolve) => {
    enteredAuth = resolve;
  });
  const blocked = new Promise((resolve) => {
    releaseAuth = resolve;
  });
  let authRemoved = false;
  const clearing = api.clearProjectSnapshot("a", async () => {
    assert.equal(data[key("a")], undefined);
    enteredAuth();
    await blocked;
    authRemoved = true;
  });
  await entered;
  let nextStarted = false;
  const next = api.withProjectRefreshLock("a", async () => {
    nextStarted = true;
    assert.equal(authRemoved, true);
  });
  await Promise.resolve();
  assert.equal(nextStarted, false);
  releaseAuth();
  await Promise.all([clearing, next]);
  assert.equal(nextStarted, true);
  assert.equal(data[key("a")], undefined);
});

test("clearing file cache retains verified custom order across relogin ahead of legacy order", async () => {
  const legacy = JSON.stringify(order("a", "b"));
  const { api, data } = fixture({ "local:localProjectState": legacy });
  const projects = { a: project("A"), b: project("B") };
  const customized = [{ id: "b", open: false }, ...order("a")];
  await api.commitProjectSnapshot("account/a", projects, "teams", 10);
  await api.persistProjectOrder("account/a", customized);
  await api.clearProjectSnapshot("account/a");
  assert.equal(data[key("account/a")], undefined);
  assert.deepEqual(data["local:projectOrder:account%2Fa"], customized);
  const cleared = await api.readProjectSnapshot("account/a");
  assert.deepEqual(Object.keys(cleared.projects), []);
  assert.deepEqual(plain(cleared.order), customized);
  const relogged = await api.commitProjectSnapshot(
    "account/a",
    projects,
    "teams",
    20,
  );
  assert.deepEqual(plain(relogged.order), customized);
  assert.equal(data["local:localProjectState"], legacy);
});

test("an explicitly empty owned order remains empty after clearing instead of reviving legacy order", async () => {
  const { api, data } = fixture({
    "local:localProjectState": JSON.stringify(order("old")),
    "local:projectOrder:a": order("older"),
  });
  await api.commitProjectSnapshot("a", {}, "empty-teams", 10);
  await api.clearProjectSnapshot("a");
  assert.deepEqual(data["local:projectOrder:a"], []);
  assert.deepEqual(plain((await api.readProjectSnapshot("a")).order), []);
});

test("clear never assigns unverified legacy candidate order to an account", async () => {
  const legacy = JSON.stringify(order("a", "b"));
  const { api, data } = fixture({ "local:localProjectState": legacy });
  await api.setProjectRetryAt("a", 500);
  await api.clearProjectSnapshot("a");
  assert.equal(data[key("a")], undefined);
  assert.equal(data["local:projectOrder:a"], undefined);
  assert.equal(data["local:localProjectState"], legacy);
});
