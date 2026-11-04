/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Writes src/i18n/client-namespaces.ts: for every <ScopedMessages scope="…">
// in src/app, the message namespaces that the client components under it can
// read. Each page used to ship every namespace (~400 KB of JSON per page);
// now a page ships only what its own import graph mentions.
//
// How a scope is measured:
//   - A layout.tsx that renders <ScopedMessages scope="x"> covers itself plus
//     every route file below it (page, loading, error, not-found, template,
//     default, unscoped layouts) up to the next scoped layout.
//   - A page.tsx that renders <ScopedMessages scope="x"> covers itself only.
//   - From those entry files, follow every import ("@/…" and relative,
//     static and dynamic) and collect each string literal that names a
//     namespace ("page_finance", "common.more", `page_india.${x}`), plus any
//     identifier exported as a namespace constant (INDIA_NS).
// This over-includes (server-only strings count too) and never under-includes
// a namespace that is named anywhere a scope can reach.
//
// Usage: node scripts/gen-client-namespaces.mjs          (write)
//        node scripts/gen-client-namespaces.mjs --check  (exit 1 if stale)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const APP = path.join(SRC, "app");
const OUT = path.join(SRC, "i18n", "client-namespaces.ts");

// Files that list every namespace by design; scanning them would pull every
// namespace into every scope.
const SKIP = new Set(
  ["i18n/client-namespaces.ts", "i18n/namespaces.ts", "i18n/request.ts", "i18n/ScopedMessages.tsx"].map((p) =>
    path.join(SRC, p),
  ),
);
const ROUTE_FILE = /^(page|loading|error|not-found|template|default|layout)\.(tsx?|jsx?)$/;
const EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs"];

function namespaces() {
  const en = JSON.parse(fs.readFileSync(path.join(SRC, "dictionaries", "en.json"), "utf8"));
  const pages = fs
    .readdirSync(path.join(SRC, "dictionaries", "en"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5));
  return [...new Set([...Object.keys(en), ...pages])].sort();
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (EXTS.includes(path.extname(e.name))) out.push(p);
  }
  return out;
}

function resolveImport(from, spec) {
  let base;
  if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const cand of [base, ...EXTS.map((x) => base + x), ...EXTS.map((x) => path.join(base, "index" + x))]) {
    if (fs.existsSync(cand) && fs.statSync(cand).isFile() && EXTS.includes(path.extname(cand))) return cand;
  }
  return null;
}

const IMPORT_RE = /(?:from\s+|import\s*\(\s*|import\s+|require\s*\(\s*)["'`]([^"'`]+)["'`]/g;
const SCOPE_RE = /<ScopedMessages\b[^>]*\bscope="([^"]+)"/g;

export function computeScopes() {
  const all = namespaces();
  const nsSet = new Set(all);
  const files = walk(SRC);
  const text = new Map(files.map((f) => [f, fs.readFileSync(f, "utf8")]));

  // Identifiers exported as a namespace name: `export const INDIA_NS = "page_india"`.
  const nsConsts = new Map();
  for (const [f, s] of text) {
    if (SKIP.has(f)) continue;
    for (const m of s.matchAll(/export\s+const\s+([A-Za-z_]\w*)\s*=\s*["'`]([^"'`]+)["'`]/g)) {
      if (nsSet.has(m[2])) nsConsts.set(m[1], m[2]);
    }
  }

  const fileNs = new Map();
  function namespacesIn(f) {
    if (fileNs.has(f)) return fileNs.get(f);
    const s = text.get(f) ?? "";
    const found = new Set();
    for (const m of s.matchAll(/["'`]([A-Za-z_][\w-]*)(?=["'`.$])/g)) if (nsSet.has(m[1])) found.add(m[1]);
    for (const [id, ns] of nsConsts) if (new RegExp(`\\b${id}\\b`).test(s)) found.add(ns);
    fileNs.set(f, found);
    return found;
  }

  function graphNamespaces(entries) {
    const seen = new Set();
    const stack = [...entries];
    const out = new Set();
    while (stack.length) {
      const f = stack.pop();
      if (seen.has(f) || SKIP.has(f)) continue;
      seen.add(f);
      for (const ns of namespacesIn(f)) out.add(ns);
      for (const m of (text.get(f) ?? "").matchAll(IMPORT_RE)) {
        const r = resolveImport(f, m[1]);
        if (r && !seen.has(r)) stack.push(r);
      }
    }
    return out;
  }

  // Scoped files under src/app, by the scope key they declare.
  const scopeOf = new Map();
  const keys = new Map();
  for (const f of files) {
    if (!f.startsWith(APP)) continue;
    const declared = [...(text.get(f) ?? "").matchAll(SCOPE_RE)].map((m) => m[1]);
    if (!declared.length) continue;
    if (declared.length > 1 && new Set(declared).size > 1) throw new Error(`${f}: more than one scope key`);
    const key = declared[0];
    if (keys.has(key)) throw new Error(`scope "${key}" declared twice: ${keys.get(key)} and ${f}`);
    keys.set(key, f);
    scopeOf.set(f, key);
  }

  // Assign every route file to the scope that wraps it.
  const entries = new Map([...keys.keys()].map((k) => [k, [keys.get(k)]]));
  const scopedLayoutDir = new Map(
    [...scopeOf].filter(([f]) => /^layout\./.test(path.basename(f))).map(([f, k]) => [path.dirname(f), k]),
  );
  const unscoped = [];
  for (const f of files) {
    if (!f.startsWith(APP) || scopeOf.has(f) || !ROUTE_FILE.test(path.basename(f))) continue;
    let dir = path.dirname(f);
    let key = null;
    for (;;) {
      if (scopedLayoutDir.has(dir)) {
        key = scopedLayoutDir.get(dir);
        break;
      }
      if (dir === APP) break;
      dir = path.dirname(dir);
    }
    if (key) entries.get(key).push(f);
    else unscoped.push(path.relative(ROOT, f).replace(/\\/g, "/"));
  }

  /** @type {Record<string, string[]>} */
  const scopes = {};
  for (const [k, list] of [...entries].sort(([a], [b]) => a.localeCompare(b))) {
    scopes[k] = [...graphNamespaces(list)].sort();
  }
  return { scopes, unscoped };
}

export function render(scopes) {
  const lines = [
    "// GENERATED by scripts/gen-client-namespaces.mjs — do not edit.",
    "// Message namespaces each <ScopedMessages scope> sends to the browser.",
    "export const CLIENT_NAMESPACES = {",
  ];
  for (const [k, list] of Object.entries(scopes)) {
    lines.push(`  ${JSON.stringify(k)}: [${list.map((n) => JSON.stringify(n)).join(", ")}],`);
  }
  lines.push("} as const satisfies Record<string, readonly string[]>;", "", "export type MessageScope = keyof typeof CLIENT_NAMESPACES;", "");
  return lines.join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { scopes, unscoped } = computeScopes();
  const next = render(scopes);
  if (process.argv.includes("--check")) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8").replace(/\r\n/g, "\n") : "";
    if (cur !== next) {
      console.error("src/i18n/client-namespaces.ts is stale: run node scripts/gen-client-namespaces.mjs");
      process.exit(1);
    }
  } else {
    fs.writeFileSync(OUT, next);
    console.log(`wrote ${path.relative(ROOT, OUT)}: ${Object.keys(scopes).length} scopes`);
  }
  if (unscoped.length) console.log("route files outside any scope (no messages):", unscoped);
}
