#!/usr/bin/env node
// Pre-publish gate: `npm run release:check [-- --offline] [-- --keep]`.
//
// The vitest suite runs against src/ with msw mocks, so it cannot see a broken
// package (bad exports/types/files), an ESM/CJS or type-resolution problem, or
// the live API drifting away from our types. This script tests the thing that
// actually ships: the packed tarball, installed into a fresh project.
//
// Stages run in order and stop at the first failure:
//   1 version sync   2 build + pack   3 publint + attw   4 isolated install
//   5 consumer smoke (ESM, CJS, tsc node16 + bundler)
//   6 live contract (needs FORM4API_TEST_KEY; SKIP with --offline)
//   7 npm publish --dry-run (any npm warn fails)
//
// Pure Node, no shell syntax: runs the same on Windows (cmd/PowerShell) and Linux.
// The API key is read from the environment and is never printed or written.
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const OFFLINE = args.has("--offline");
const KEEP = args.has("--keep");
// Same URL codegen/generate.mjs uses (FORM4API_OPENAPI_URL overrides it there too).
const SPEC_URL = process.env.FORM4API_OPENAPI_URL ?? "https://api.form4api.com/openapi/v1.json";
const KEY = process.env.FORM4API_TEST_KEY ?? "";

// ── helpers ──────────────────────────────────────────────────────────────────

const redact = (s) => (KEY ? String(s).split(KEY).join("***") : String(s));

class StageFailure extends Error {}
const fail = (msg) => {
  throw new StageFailure(msg);
};

/** Runs a command, returns { status, out } with stdout+stderr merged. Never throws. */
function run(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, {
    cwd: opts.cwd ?? ROOT,
    encoding: "utf8",
    env: { ...process.env, ...(opts.env ?? {}), FORCE_COLOR: "0", NO_COLOR: "1" },
    maxBuffer: 64 * 1024 * 1024,
    shell: opts.shell ?? false,
  });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  return { status: r.status ?? (r.error ? -1 : 1), out: redact(out), error: r.error };
}

/** Runs npm through npm-cli.js when we can find it, so no .cmd shim / shell is needed. */
function npm(npmArgs, opts = {}) {
  const cli = process.env.npm_execpath;
  if (cli && /\.c?js$/.test(cli)) return run(process.execPath, [cli, ...npmArgs], opts);
  const bundled = join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
  if (existsSync(bundled)) return run(process.execPath, [bundled, ...npmArgs], opts);
  const quoted = npmArgs.map((a) => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a));
  return run("npm", quoted, { ...opts, shell: true });
}

/** Path of a devDependency's CLI script, so we can run it with plain `node`. */
function binOf(pkg, binName = pkg) {
  // Read package.json off disk: many packages do not export "./package.json".
  const dir = join(ROOT, "node_modules", pkg);
  const pj = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const rel = typeof pj.bin === "string" ? pj.bin : pj.bin[binName];
  return join(dir, rel);
}

const indent = (s, n = 6) =>
  String(s)
    .trimEnd()
    .split(/\r?\n/)
    .map((l) => " ".repeat(n) + l)
    .join("\n");

// ── state shared between stages ─────────────────────────────────────────────

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const VERSION = pkg.version;
const tmpRoot = mkdtempSync(join(tmpdir(), "form4api-release-check-"));
const packDir = join(tmpRoot, "pack");
const consumerDir = join(tmpRoot, "consumer");
mkdirSync(packDir);
mkdirSync(consumerDir);
let tarball = "";

// ── stages ───────────────────────────────────────────────────────────────────

function stageVersionSync() {
  const notes = [];
  const versionTs = readFileSync(join(ROOT, "src", "version.ts"), "utf8");
  // Format written by codegen/version.mjs: export const SDK_VERSION = "x.y.z";
  const m = versionTs.match(/export const SDK_VERSION = "([^"]+)"/);
  if (!m) fail("src/version.ts does not contain `export const SDK_VERSION = \"...\"` (see codegen/version.mjs)");
  if (m[1] !== VERSION) {
    fail(`src/version.ts SDK_VERSION is ${m[1]} but package.json is ${VERSION}. Run \`npm run codegen:version\`.`);
  }

  const changelog = readFileSync(join(ROOT, "CHANGELOG.md"), "utf8");
  // Headings look like `## 1.7.0 — 2026-10-05`; `## Unreleased` is skipped.
  const heads = [...changelog.matchAll(/^##\s+v?(\d+\.\d+\.\d+)\b.*$/gm)];
  if (heads.length === 0) fail("CHANGELOG.md has no `## x.y.z` version heading");
  if (heads[0][1] !== VERSION) {
    fail(`top CHANGELOG.md entry is ${heads[0][1]} but package.json is ${VERSION}`);
  }

  const tag = run("git", ["tag", "-l", `v${VERSION}`]);
  if (tag.status === 0 && tag.out.trim() === `v${VERSION}`) {
    notes.push(`WARN git tag v${VERSION} already exists (fine if you are re-checking an already-tagged release; a new publish needs a bumped version)`);
  }
  notes.push(`package.json = src/version.ts = CHANGELOG top entry = ${VERSION}`);
  return { notes };
}

function stageBuildAndPack() {
  const build = npm(["run", "build"]);
  if (build.status !== 0) fail(`npm run build failed (exit ${build.status})\n${indent(build.out.split(/\r?\n/).slice(-40).join("\n"))}`);
  const pack = npm(["pack", "--json", "--pack-destination", packDir]);
  if (pack.status !== 0) fail(`npm pack failed (exit ${pack.status})\n${indent(pack.out)}`);
  // --json prints a JSON array; lifecycle noise (if any) precedes it, so take from the first `[`.
  const json = pack.out.slice(pack.out.indexOf("["));
  let info;
  try {
    info = JSON.parse(json)[0];
  } catch {
    fail(`could not parse \`npm pack --json\` output:\n${indent(pack.out)}`);
  }
  tarball = join(packDir, info.filename);
  if (!existsSync(tarball)) fail(`npm pack reported ${info.filename} but ${tarball} does not exist`);
  const files = info.files.map((f) => f.path);
  return { notes: [`${info.filename}: ${files.length} files, ${info.size} bytes packed`, `contents: ${files.join(", ")}`] };
}

function stageStaticLint() {
  const problems = [];
  const pl = run(process.execPath, [binOf("publint"), "run", tarball, "--strict", "--pack", "false"]);
  if (pl.status !== 0) problems.push(`publint --strict (exit ${pl.status}):\n${indent(pl.out)}`);
  const attw = run(process.execPath, [binOf("@arethetypeswrong/cli", "attw"), tarball, "--no-emoji", "--no-color"]);
  if (attw.status !== 0) problems.push(`attw (exit ${attw.status}):\n${indent(attw.out)}`);
  if (problems.length) fail(problems.join("\n"));
  return { notes: ["publint --strict clean", "attw clean (all resolution modes)"] };
}

function stageInstall() {
  writeFileSync(
    join(consumerDir, "package.json"),
    JSON.stringify({ name: "form4api-release-check-consumer", version: "0.0.0", private: true, type: "module" }, null, 2),
  );
  const r = npm(["install", tarball, "--no-audit", "--no-fund", "--loglevel=error"], { cwd: consumerDir });
  if (r.status !== 0) fail(`npm install <tarball> failed (exit ${r.status})\n${indent(r.out)}`);
  const installed = join(consumerDir, "node_modules", "form4api", "package.json");
  if (!existsSync(installed)) fail("install succeeded but node_modules/form4api/package.json is missing");
  const v = JSON.parse(readFileSync(installed, "utf8")).version;
  if (v !== VERSION) fail(`installed form4api is ${v}, expected ${VERSION}`);
  const dist = join(consumerDir, "node_modules", "form4api", "dist", "index.js");
  if (!existsSync(dist)) fail("installed package has no dist/index.js (is `dist` missing from `files`?)");
  return { notes: [`installed form4api@${v} from the tarball into ${consumerDir}`] };
}

function stageSmoke() {
  const smoke = join(ROOT, "scripts", "lib", "smoke");
  for (const f of ["smoke.mjs", "smoke.cjs", "check.mts", "check.cts"]) copyFileSync(join(smoke, f), join(consumerDir, f));
  const env = { EXPECTED_VERSION: VERSION };
  const notes = [];

  const esm = run(process.execPath, ["smoke.mjs"], { cwd: consumerDir, env });
  if (esm.status !== 0) fail(`(a) ESM import failed:\n${indent(esm.out)}`);
  notes.push(`(a) ${esm.out.trim()}`);

  const cjs = run(process.execPath, ["smoke.cjs"], { cwd: consumerDir, env });
  if (cjs.status !== 0) fail(`(b) CJS require failed:\n${indent(cjs.out)}`);
  notes.push(`(b) ${cjs.out.trim()}`);

  const tsc = join(ROOT, "node_modules", "typescript", "bin", "tsc");
  const common = {
    strict: true,
    noEmit: true,
    skipLibCheck: false,
    target: "ES2022",
    lib: ["ES2022", "DOM"],
    types: [],
  };
  const configs = [
    { name: "node16", files: ["check.mts", "check.cts"], co: { module: "node16", moduleResolution: "node16" } },
    { name: "bundler", files: ["check.mts"], co: { module: "esnext", moduleResolution: "bundler" } },
  ];
  for (const c of configs) {
    const file = `tsconfig.${c.name}.json`;
    writeFileSync(join(consumerDir, file), JSON.stringify({ compilerOptions: { ...common, ...c.co }, files: c.files }, null, 2));
    const r = run(process.execPath, [tsc, "-p", file], { cwd: consumerDir });
    if (r.status !== 0) fail(`(c) tsc --noEmit with moduleResolution ${c.name} failed:\n${indent(r.out)}`);
    notes.push(`(c) tsc --noEmit moduleResolution=${c.name}: ${c.files.join(", ")} ok`);
  }
  return { notes };
}

function stageLiveContract() {
  if (!KEY) {
    if (OFFLINE) return { skip: true, notes: ["--offline: stage skipped"] };
    fail(
      "FORM4API_TEST_KEY is not set, so the live contract cannot be checked.\n" +
        "      Set it and rerun, or pass --offline to skip this stage deliberately (CI does).",
    );
  }
  if (OFFLINE) return { skip: true, notes: ["--offline: stage skipped (FORM4API_TEST_KEY is set but unused)"] };
  copyFileSync(join(ROOT, "scripts", "lib", "live-contract-run.mjs"), join(consumerDir, "live-contract-run.mjs"));
  const r = run(
    process.execPath,
    [
      "live-contract-run.mjs",
      pathToFileURL(join(ROOT, "scripts", "lib", "contract.mjs")).href,
      join(ROOT, "contract", "live-calls.json"),
      SPEC_URL,
    ],
    { cwd: consumerDir },
  );
  if (r.status !== 0) fail(`live contract check failed against the INSTALLED package:\n${indent(r.out)}`);
  return { notes: r.out.trim().split(/\r?\n/).map((l) => l.trim()) };
}

function stageDryRunPublish() {
  const r = npm(["publish", "--dry-run"]);
  // Packaging warnings (e.g. npm rewriting a bin path) are the point of this stage, so
  // scan them FIRST, before the already-published early return, or CI on an
  // unbumped PR would never see them. The one ignored line is environmental: CI
  // runners are not logged in to npm.
  const warns = r.out
    .split(/\r?\n/)
    .filter((l) => /^npm (warn|WARN)\b/.test(l.trim()) && !/requires you to be logged in/i.test(l));
  if (warns.length) fail(`npm publish --dry-run emitted ${warns.length} warning(s):\n${indent(warns.join("\n"))}`);
  if (/cannot publish over the previously published versions/i.test(r.out)) {
    if (OFFLINE) {
      // CI runs this on every PR, where the version is normally the one already on
      // npm, so it must not turn every PR red. It is still caught: without
      // --offline (the pre-publish run) it fails, and `npm publish` itself refuses.
      return {
        notes: [
          `WARN form4api@${VERSION} is already on the npm registry (tolerated under --offline; the full local run and \`npm publish\` itself reject it). Bump the version before a real release.`,
        ],
      };
    }
    fail(`form4api@${VERSION} is already on the npm registry; bump the version (package.json, CHANGELOG.md, then \`npm run codegen:version\`) before publishing.\n${indent(r.out.split(/\r?\n/).filter((l) => /^npm error/.test(l)).join("\n"))}`);
  }
  if (r.status !== 0) fail(`npm publish --dry-run failed (exit ${r.status})\n${indent(r.out)}`);
  return { notes: ["npm publish --dry-run: no warnings"] };
}

const STAGES = [
  ["1 Version sync", stageVersionSync],
  ["2 Build and pack", stageBuildAndPack],
  ["3 Static lint of tarball (publint, attw)", stageStaticLint],
  ["4 Isolated install", stageInstall],
  ["5 Consumer smoke test (ESM, CJS, tsc)", stageSmoke],
  ["6 Live contract", stageLiveContract],
  ["7 Dry-run publish", stageDryRunPublish],
];

// ── main ─────────────────────────────────────────────────────────────────────

console.log(`release:check for form4api@${VERSION}${OFFLINE ? " (--offline)" : ""}`);
console.log(`FORM4API_TEST_KEY: ${KEY ? "set" : "not set"}   spec: ${SPEC_URL}\n`);

const results = [];
let failed = false;
try {
  for (const [name, fn] of STAGES) {
    try {
      const r = fn() ?? {};
      const status = r.skip ? "SKIP" : "PASS";
      results.push([name, status]);
      console.log(`${status}  ${name}`);
      for (const n of r.notes ?? []) console.log(`      ${n}`);
    } catch (e) {
      failed = true;
      results.push([name, "FAIL"]);
      console.log(`FAIL  ${name}`);
      console.log(`      ${e instanceof StageFailure ? e.message : (e?.stack ?? e)}`.replace(/\n(?!\s)/g, "\n      "));
      break;
    }
  }
} finally {
  if (KEEP) console.log(`\n--keep: temp directories left at ${tmpRoot}`);
  else rmSync(tmpRoot, { recursive: true, force: true });
}

const ran = new Set(results.map(([n]) => n));
for (const [name] of STAGES) if (!ran.has(name)) results.push([name, "NOT RUN"]);
console.log("\nSummary");
for (const [name, status] of results) console.log(`  ${status.padEnd(7)} ${name}`);
console.log(failed ? "\nrelease:check FAILED. Do not publish." : "\nrelease:check passed.");
process.exit(failed ? 1 : 0);
