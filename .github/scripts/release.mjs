import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, readdirSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const parseVersion = (value) => {
  if (
    typeof value !== "string" ||
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)
  ) {
    throw new Error(
      "Use a three-part numeric store version without leading zeros",
    );
  }
  const parts = value.split(".").map(Number);
  if (parts.some((part) => part > 65535) || parts.every((part) => part === 0)) {
    throw new Error(
      "Store version components must be <=65535 and not all zero",
    );
  }
  return parts;
};

export const versionChanged = (current, previous) => {
  const parts = parseVersion(current);
  const old = parseVersion(previous);
  const index = parts.findIndex((part, i) => part !== old[i]);
  if (index < 0) return false;
  if (parts[index] < old[index]) throw new Error("Version must increase");
  return true;
};

export const submissionArgs = (store, version, dryRun) => {
  parseVersion(version);
  if (!["chrome", "firefox"].includes(store)) throw new Error("Unknown store");
  if (typeof dryRun !== "boolean") throw new Error("dryRun must be a boolean");
  const args = ["--no-install", "wxt", "submit"];
  if (dryRun) args.push("--dry-run");
  args.push(`--${store}-zip`, `build/figma-finder-${version}-${store}.zip`);
  if (store === "firefox")
    args.push(
      "--firefox-sources-zip",
      `build/figma-finder-${version}-sources.zip`,
    );
  return args;
};

export const checkEntryNames = (entries, sources) => {
  const required = sources
    ? ["package.json", "package-lock.json", "wxt.config.ts", "AGENTS.md"]
    : ["manifest.json"];
  for (const name of required) {
    if (!entries.includes(name))
      throw new Error(`Missing archive entry: ${name}`);
  }
  for (const entry of entries) {
    if (
      entry.split("/").some((part) => part.startsWith(".")) ||
      /(^|\/)(node_modules|build|web-ext\.config\.ts|stats[^/]*|skills-lock\.json)(\/|$)/.test(
        entry,
      ) ||
      /\.(pem|key|map)$/i.test(entry) ||
      entry.startsWith("/") ||
      entry.includes("\\")
    ) {
      throw new Error(`Forbidden archive entry: ${entry}`);
    }
    if (
      sources &&
      !/^(src\/|public\/|package(?:-lock)?\.json$|wxt\.config\.ts$|wxt-env\.d\.ts$|tsconfig\.json$|AGENTS\.md$|LICENSE$)/.test(
        entry,
      )
    ) {
      throw new Error(`Unexpected source entry: ${entry}`);
    }
  }
};

const json = (path) => JSON.parse(readFileSync(path, "utf8"));
const gitJson = (ref, file) =>
  JSON.parse(
    execFileSync("git", ["show", `${ref}:${file}`], { encoding: "utf8" }),
  );

const main = () => {
  const [command, ...args] = process.argv.slice(2);
  const pkg = json("package.json");
  const lock = json("package-lock.json");
  parseVersion(pkg.version);
  if (
    lock.version !== pkg.version ||
    lock.packages[""].version !== pkg.version
  ) {
    throw new Error("package.json and package-lock.json versions must match");
  }
  if (command === "version") {
    const base = args[0];
    if (!base || !/^[a-f0-9]{40}$/.test(base) || /^0+$/.test(base))
      throw new Error("A valid base commit is required");
    const old = gitJson(base, "package.json");
    const changed = versionChanged(pkg.version, old.version);
    if (changed) {
      const oldLock = gitJson(base, "package-lock.json");
      if (oldLock.version === lock.version)
        throw new Error("Bump both package files in the PR");
    }
    const output = `version=${pkg.version}\nchanged=${changed}\n`;
    if (process.env.GITHUB_OUTPUT)
      appendFileSync(process.env.GITHUB_OUTPUT, output);
    process.stdout.write(output);
  } else if (command === "archives") {
    const names = ["chrome", "firefox", "sources"].map(
      (kind) => `figma-finder-${pkg.version}-${kind}.zip`,
    );
    for (const name of names) {
      if (!readdirSync("build").includes(name))
        throw new Error(`Missing ${name}`);
      const path = `build/${name}`;
      const entries = execFileSync("unzip", ["-Z1", path], { encoding: "utf8" })
        .trim()
        .split("\n");
      const sources = name.endsWith("-sources.zip");
      checkEntryNames(entries, sources);
      const contents = execFileSync("unzip", ["-p", path], {
        maxBuffer: 32 * 1024 * 1024,
      }).toString("utf8");
      if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(contents))
        throw new Error("Private key found in archive");
      if (!sources) {
        const manifest = JSON.parse(
          execFileSync("unzip", ["-p", path, "manifest.json"], {
            encoding: "utf8",
          }),
        );
        if (manifest.version !== pkg.version)
          throw new Error("Manifest version mismatch");
        const firefox = name.endsWith("-firefox.zip");
        if (
          firefox &&
          manifest.browser_specific_settings?.gecko?.id !==
            "figma-finder@hira.page"
        )
          throw new Error("Wrong Firefox ID");
        if (
          !firefox &&
          (!manifest.side_panel || !manifest.permissions.includes("sidePanel"))
        )
          throw new Error("Missing Chrome side panel configuration");
      }
      console.log(`Checked ${name}: ${entries.length} entries`);
    }
  } else if (command === "submit") {
    const [store, dryRun = "true"] = args;
    if (!["true", "false"].includes(dryRun))
      throw new Error("Expected true or false for dry-run");
    const result = spawnSync(
      "npx",
      submissionArgs(store, pkg.version, dryRun === "true"),
      { stdio: "inherit" },
    );
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } else {
    throw new Error("Expected version, archives, or submit");
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main();
