import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const key = "local:majorUpdateNotice";
const load = (file, globals, imports = {}) => {
  const source = readFileSync(
    new URL(`../${file}`, import.meta.url),
    "utf8",
  ).replaceAll("import.meta.env.CHROME", "true");
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
    ...globals,
  });
  return exports;
};

const fixture = (initial) => {
  const data = initial === undefined ? {} : { [key]: structuredClone(initial) };
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
  const state = { data, writes, beforeSet: null };
  const storage = {
    getItem: async (name) => structuredClone(data[name] ?? null),
    setItem: async (name, value) => {
      await state.beforeSet?.(name, value);
      data[name] = structuredClone(value);
      writes.push([name, structuredClone(value)]);
    },
  };
  const page = () => load("src/lib/update-notice.ts", { storage, navigator });
  return Object.assign(state, { storage, navigator, page });
};
const notice = async (api, version) =>
  structuredClone(await api.readMajorUpdateNotice(version));

test("numeric major upgrades record their exact release, including skipped majors", async () => {
  for (const [previous, current] of [
    ["1.0.7", "2.0.0"],
    ["1.9.9", "3.4.5"],
    ["9.9.9", "10.0.0"],
    ["0.9.9", "1.0.0"],
    ["65534.0.0", "65535.65535.65535"],
  ]) {
    const state = fixture();
    const api = state.page();
    assert.equal(api.majorUpdateNoticeKey, key);
    await api.recordMajorUpdate(previous, current);
    assert.deepEqual(await notice(api, current), {
      version: current,
      major: Number(current.split(".")[0]),
    });
    assert.deepEqual(state.data[key], {
      pendingVersion: current,
      dismissedMajor: 0,
    });
  }
});

test("fresh state, minor, patch, same-version and downgrade changes stay silent", async () => {
  const state = fixture();
  const api = state.page();
  assert.equal(await notice(api, "2.0.0"), null);
  for (const [previous, current] of [
    ["1.0.7", "1.1.0"],
    ["1.0.7", "1.0.8"],
    ["2.0.0", "2.0.0"],
    ["3.0.0", "2.0.0"],
  ]) {
    await api.recordMajorUpdate(previous, current);
    assert.equal(await notice(api, current), null);
  }
  assert.deepEqual(state.writes, []);
});

test("malformed versions never record a notice or become a release target", async () => {
  const state = fixture();
  const api = state.page();
  const invalid = [
    undefined,
    null,
    false,
    2,
    {},
    [],
    "",
    "0.0.0",
    "02.0.0",
    "2.00.0",
    "2.0.00",
    "2.0",
    "2.0.0.0",
    "2.0.0-beta",
    "v2.0.0",
    " 2.0.0",
    "65536.0.0",
    "2.65536.0",
    "2.0.65536",
    "https://example.test/2.0.0",
  ];
  for (const version of invalid) {
    await api.recordMajorUpdate(version, "2.0.0");
    await api.recordMajorUpdate("1.0.7", version);
    assert.equal(await notice(api, version), null);
  }
  assert.deepEqual(state.writes, []);
});

test("patches preserve unread major release and acknowledgement survives new pages", async () => {
  const state = fixture();
  const popup = state.page();
  await popup.recordMajorUpdate("1.0.7", "2.0.0");
  await popup.recordMajorUpdate("2.0.0", "2.1.3");
  assert.deepEqual(await notice(state.page(), "2.1.3"), {
    version: "2.0.0",
    major: 2,
  });
  assert.equal(await notice(popup, "1.0.7"), null);
  assert.equal(await notice(popup, "3.0.0"), null);
  await popup.dismissMajorUpdate(2);
  await state.page().recordMajorUpdate("1.0.7", "2.9.9");
  await state.page().recordMajorUpdate("2.1.3", "2.1.4");
  assert.equal(await notice(state.page(), "2.9.9"), null);
  assert.deepEqual(state.data[key], {
    pendingVersion: null,
    dismissedMajor: 2,
  });
  await state.page().recordMajorUpdate("2.9.9", "3.0.0");
  assert.deepEqual(await notice(state.page(), "3.0.1"), {
    version: "3.0.0",
    major: 3,
  });
});

test("stale acknowledgement cannot erase a future major in either write order", async () => {
  for (const first of ["record", "dismiss"]) {
    const state = fixture({ pendingVersion: "2.0.0", dismissedMajor: 0 });
    const popup = state.page();
    const panel = state.page();
    let release;
    let entered;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const writing = new Promise((resolve) => {
      entered = resolve;
    });
    state.beforeSet = async () => {
      state.beforeSet = null;
      entered();
      await gate;
    };
    const firstWrite =
      first === "record"
        ? popup.recordMajorUpdate("2.0.0", "3.0.0")
        : popup.dismissMajorUpdate(2);
    await writing;
    const secondWrite =
      first === "record"
        ? panel.dismissMajorUpdate(2)
        : panel.recordMajorUpdate("2.0.0", "3.0.0");
    release();
    await Promise.all([firstWrite, secondWrite]);
    assert.deepEqual(state.data[key], {
      pendingVersion: "3.0.0",
      dismissedMajor: 2,
    });
    assert.deepEqual(await notice(state.page(), "3.0.0"), {
      version: "3.0.0",
      major: 3,
    });
  }
});

test("concurrent acknowledgement and duplicate update cannot resurrect the same major", async () => {
  for (const dismissFirst of [false, true]) {
    const state = fixture();
    const popup = state.page();
    const panel = state.page();
    const actions = [
      () => popup.recordMajorUpdate("1.0.7", "2.0.0"),
      () => panel.dismissMajorUpdate(2),
    ];
    if (dismissFirst) actions.reverse();
    await Promise.all(actions.map((action) => action()));
    assert.equal(await notice(state.page(), "2.0.0"), null);
    assert.equal(state.data[key].dismissedMajor, 2);
  }
});

test("state validation ignores arbitrary targets and invalid acknowledgement values", async () => {
  for (const input of [
    null,
    false,
    "2.0.0",
    [],
    {},
    { pendingVersion: "https://example.test/release", dismissedMajor: 0 },
    { pendingVersion: "02.0.0", dismissedMajor: 0 },
    { pendingVersion: "2.0.0", dismissedMajor: 2 },
    { pendingVersion: "2.0.0", dismissedMajor: 3 },
  ]) {
    assert.equal(await notice(fixture(input).page(), "2.0.0"), null);
  }
  for (const dismissedMajor of [-1, 2.5, "2", null, NaN, Infinity, 65536]) {
    const state = fixture({ pendingVersion: "2.0.0", dismissedMajor });
    const api = state.page();
    assert.deepEqual(await notice(api, "2.0.0"), {
      version: "2.0.0",
      major: 2,
    });
    await api.dismissMajorUpdate(dismissedMajor);
    assert.deepEqual(state.writes, []);
  }
});

test("failed storage writes leave the notice retryable without global memory state", async () => {
  const state = fixture();
  const api = state.page();
  state.beforeSet = () => {
    throw new Error("storage unavailable");
  };
  await assert.rejects(api.recordMajorUpdate("1.0.7", "2.0.0"));
  assert.equal(await notice(state.page(), "2.0.0"), null);
  state.beforeSet = null;
  await state.page().recordMajorUpdate("1.0.7", "2.0.0");
  state.beforeSet = () => {
    throw new Error("storage unavailable");
  };
  await assert.rejects(api.dismissMajorUpdate(2));
  assert.deepEqual(await notice(state.page(), "2.0.0"), {
    version: "2.0.0",
    major: 2,
  });
  state.beforeSet = null;
  await state.page().dismissMajorUpdate(2);
  assert.equal(await notice(state.page(), "2.0.0"), null);
});

test("Chrome installed events only record major extension upgrades", async () => {
  const state = fixture();
  const api = state.page();
  let installed;
  let version = "2.0.0";
  const created = [];
  const warnings = [];
  load(
    "src/entrypoints/background.ts",
    {
      defineBackground: (callback) => callback(),
      console: { warn: (message) => warnings.push(message), error() {} },
      chrome: { sidePanel: { setPanelBehavior: async () => {} } },
      browser: {
        runtime: {
          getURL: (path) => `extension://test${path}`,
          getManifest: () => ({ version }),
          onInstalled: {
            addListener: (callback) => {
              installed = callback;
            },
          },
        },
        tabs: {
          create: async ({ url }) => {
            created.push(url);
          },
        },
        action: { onClicked: { addListener() {} } },
        commands: { onCommand: { addListener() {} } },
      },
    },
    { "@/lib/update-notice": api },
  );
  await installed({ reason: "install" });
  assert.deepEqual(created, ["extension://test/help.html?welcome"]);
  assert.equal(await notice(api, version), null);
  for (const reason of ["chrome_update", "shared_module_update"]) {
    await installed({ reason, previousVersion: "1.0.7" });
  }
  await installed({ reason: "update" });
  version = "2.1.0";
  await installed({ reason: "update", previousVersion: "2.0.0" });
  version = "2.1.1";
  await installed({ reason: "update", previousVersion: "2.1.0" });
  assert.deepEqual(state.writes, []);
  await installed({ reason: "update", previousVersion: "1.0.7" });
  assert.deepEqual(await notice(api, version), { version, major: 2 });
  assert.deepEqual(created, ["extension://test/help.html?welcome"]);
  await api.dismissMajorUpdate(2);
  state.beforeSet = () => {
    throw new Error("private error content");
  };
  version = "3.0.0";
  await installed({ reason: "update", previousVersion: "2.1.1" });
  assert.deepEqual(warnings, ["Update notice could not be saved."]);
});
