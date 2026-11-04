/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Each part of the site sends the browser only the message namespaces its
// own components read (src/i18n/ScopedMessages.tsx). The lists are generated
// from the import graph; if a component starts reading a new namespace and
// the list is not regenerated, that text would show as a raw key in the
// browser — so a stale list fails here.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { computeScopes, render } from "../scripts/gen-client-namespaces.mjs";
import { pickNamespaces } from "@/i18n/ScopedMessages";

const ROOT = path.resolve(__dirname, "..");
// Walking the whole import graph takes a few seconds: do it once, at load.
const { scopes, unscoped } = computeScopes();

describe("client message scopes", () => {
  it("src/i18n/client-namespaces.ts matches the import graph", () => {
    const current = readFileSync(path.join(ROOT, "src/i18n/client-namespaces.ts"), "utf8").replace(/\r\n/g, "\n");
    expect(current, "run: node scripts/gen-client-namespaces.mjs").toBe(render(scopes));
  });

  it("every page route under [locale] sits inside a scope", () => {
    expect(unscoped.filter((f) => f.includes("[locale]"))).toEqual([]);
  });

  it("the root scope carries the site chrome but not page dictionaries", () => {
    expect(scopes.root).toEqual(expect.arrayContaining(["header", "footer2"]));
    expect(scopes.root).not.toContain("page_finance");
    expect(scopes["state/district/finance"]).toContain("page_finance");
  });

  it("pickNamespaces keeps only the named, present namespaces", () => {
    expect(pickNamespaces({ a: { x: "1" }, b: { y: "2" }, c: "3" }, ["a", "c", "missing"])).toEqual({ a: { x: "1" }, c: "3" });
  });
});
