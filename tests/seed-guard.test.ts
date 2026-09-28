/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// `npm run db:seed` used to run prisma/seed.ts, which deleted ~50 tables
// (District and State included) and wrote invented rows — and `.env` can
// point at production. The demo seeds now live in prisma/archive/ behind
// prisma/seed-guard.ts; these tests keep it that way.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { databaseHost, seedWipeRefusal } from "../prisma/seed-guard";

const ROOT = path.resolve(__dirname, "..");
const PRISMA = path.join(ROOT, "prisma");

describe("seedWipeRefusal", () => {
  const local = "postgresql://dev:dev@localhost:5432/ftp";
  const remote = "postgresql://u:p@ep-example-123.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

  it("refuses when ALLOW_SEED_WIPE is not set, even on localhost", () => {
    expect(seedWipeRefusal({ DATABASE_URL: local })).toMatch(/ALLOW_SEED_WIPE/);
    expect(seedWipeRefusal({ DATABASE_URL: local, ALLOW_SEED_WIPE: "true" })).toMatch(/ALLOW_SEED_WIPE/);
  });

  it("refuses a database that is not on this machine", () => {
    expect(seedWipeRefusal({ DATABASE_URL: remote, ALLOW_SEED_WIPE: "1" })).toMatch(/not point at a database on this machine/);
    expect(seedWipeRefusal({ DATABASE_URL: undefined, ALLOW_SEED_WIPE: "1" })).not.toBeNull();
    expect(seedWipeRefusal({ DATABASE_URL: "not a url", ALLOW_SEED_WIPE: "1" })).not.toBeNull();
    // A host that only starts with "localhost" is still remote.
    expect(seedWipeRefusal({ DATABASE_URL: "postgresql://u:p@localhost.evil.example/db", ALLOW_SEED_WIPE: "1" })).not.toBeNull();
  });

  it("never puts the URL (it holds the password) in the reason", () => {
    const why = seedWipeRefusal({ DATABASE_URL: remote, ALLOW_SEED_WIPE: "1" }) ?? "";
    expect(why).not.toContain("neon.tech");
    expect(why).not.toContain("u:p");
  });

  it("allows a local database with the flag", () => {
    expect(seedWipeRefusal({ DATABASE_URL: local, ALLOW_SEED_WIPE: "1" })).toBeNull();
    expect(seedWipeRefusal({ DATABASE_URL: "postgresql://dev@127.0.0.1/ftp", ALLOW_SEED_WIPE: "1" })).toBeNull();
    expect(seedWipeRefusal({ DATABASE_URL: "postgresql://dev@[::1]:5432/ftp", ALLOW_SEED_WIPE: "1" })).toBeNull();
  });

  it("reads the host from a Postgres URL", () => {
    expect(databaseHost("postgresql://a:b@LocalHost:5432/x")).toBe("localhost");
    expect(databaseHost("")).toBeNull();
  });
});

describe("seed files", () => {
  const live = readdirSync(PRISMA).filter((f) => f.endsWith(".ts"));
  const archived = readdirSync(path.join(PRISMA, "archive")).filter((f) => f.endsWith(".ts"));

  it("no seed outside prisma/archive/ wipes a whole table or invents numbers", () => {
    const offenders = live.filter((f) => {
      const src = readFileSync(path.join(PRISMA, f), "utf8");
      return /deleteMany\(\s*(\{\s*\})?\s*\)/.test(src) || /Math\.random/.test(src);
    });
    expect(offenders).toEqual([]);
  });

  it("every archived seed calls the guard before doing anything", () => {
    expect(archived.length).toBeGreaterThan(0);
    for (const f of archived) {
      const src = readFileSync(path.join(PRISMA, "archive", f), "utf8");
      expect(src, f).toMatch(/^exitUnlessLocalSeedAllowed\(\);$/m);
    }
  });

  it("no npm script or prisma hook runs a seed that deletes", () => {
    const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
    const scripts = Object.values(pkg.scripts ?? {}).join("\n");
    expect(scripts).not.toMatch(/prisma\/(archive\/)?seed/);
    expect(scripts).not.toMatch(/force-reset/);
    expect(pkg.prisma?.seed).toBeUndefined();
  });
});
