import assert from "node:assert/strict";
import test from "node:test";
import {
  checkEntryNames,
  parseVersion,
  submissionArgs,
  versionChanged,
} from "../.github/scripts/release.mjs";

test("Store versions require numeric increasing versions with bounded components", () => {
  for (const version of [
    "1.2",
    "01.2.3",
    "1.2.3-beta",
    "0.0.0",
    "65536.0.0",
    "1.2.3.4",
    "x",
  ]) {
    assert.throws(() => parseVersion(version));
  }
  assert.equal(versionChanged("1.0.3", "1.0.3"), false);
  assert.equal(versionChanged("1.1.0", "1.0.99"), true);
  assert.equal(versionChanged("2.0.0", "1.65535.65535"), true);
  assert.throws(() => versionChanged("1.0.2", "1.0.3"), /increase/);
});

test("Each store is submitted separately and dry-run cannot upload", () => {
  const chrome = submissionArgs("chrome", "1.0.4", true);
  assert.ok(chrome.includes("--dry-run"));
  assert.ok(chrome.includes("--chrome-zip"));
  assert.ok(!chrome.includes("--firefox-zip"));
  const firefox = submissionArgs("firefox", "1.0.4", false);
  assert.ok(!firefox.includes("--dry-run"));
  assert.ok(firefox.includes("--firefox-sources-zip"));
  assert.ok(!firefox.includes("--chrome-zip"));
  assert.throws(() => submissionArgs("both", "1.0.4", false));
  assert.throws(() => submissionArgs("chrome", "1.0.4", "false"));
});

test("Archives reject hidden/local configuration, keys, traversal and unexpected sources", () => {
  const sources = [
    "package.json",
    "package-lock.json",
    "wxt.config.ts",
    "AGENTS.md",
  ];
  checkEntryNames([...sources, "src/lib/store.svelte.ts"], true);
  checkEntryNames(["manifest.json", "background.js"], false);
  for (const entry of [
    ".env",
    ".env.production",
    "../secret",
    "src/.env",
    "service.key",
    "key.pem",
    "web-ext.config.ts",
    "node_modules/x",
    ".wxt/cloud.config.ts",
    ".git/config",
    "build/x",
    "stats.html",
  ]) {
    assert.throws(() => checkEntryNames([...sources, entry], true));
  }
  assert.throws(() => checkEntryNames([...sources, "notes.txt"], true));
  assert.throws(() => checkEntryNames([], false), /Missing/);
});
