import assert from "node:assert/strict";
import test from "node:test";
import {
  checkEntryNames,
  checkNoSecret,
  parseVersion,
  submissionArgs,
  versionChanged,
} from "../.github/scripts/release.mjs";

test("Credential scans catch raw and encoded sentinels without printing them", () => {
  const secret = "test-only-sensitive-marker+/=";
  for (const value of [
    secret,
    encodeURIComponent(secret),
    Buffer.from(secret).toString("base64"),
    Buffer.from(`client:${secret}`).toString("base64"),
  ]) {
    assert.throws(
      () =>
        checkNoSecret(Buffer.from(`prefix ${value} suffix`), secret, "client"),
      (error) => {
        assert.ok(!error.message.includes(secret));
        return /sentinel/.test(error.message);
      },
    );
  }
  checkNoSecret(Buffer.from("safe compiled code"), secret, "client");
  assert.throws(() => checkNoSecret(Buffer.from("anything"), ""));
});

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

test("Only Chrome can be submitted and dry-run cannot upload", () => {
  const dryRun = submissionArgs("chrome", "1.0.5", true);
  assert.deepEqual(dryRun, [
    "--no-install",
    "wxt",
    "submit",
    "--dry-run",
    "--chrome-zip",
    "build/figma-finder-1.0.5-chrome.zip",
  ]);
  const real = submissionArgs("chrome", "1.0.5", false);
  assert.ok(!real.includes("--dry-run"));
  assert.ok(real.includes("--chrome-zip"));
  for (const store of ["firefox", "both", "unknown"]) {
    assert.throws(() => submissionArgs(store, "1.0.5", false), /Only Chrome/);
  }
  assert.throws(() => submissionArgs("chrome", "1.0.5", "false"));
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
