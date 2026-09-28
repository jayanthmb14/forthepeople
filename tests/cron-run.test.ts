/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Shared cron route helpers (v5.5): withCronErrors records a run that
// throws after cronStarted() as an error (it used to stay "running"),
// the district list / JobContext come from one place, and every lock is
// the same lock:cron:<name> key, released in a finally.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cronFinished = vi.fn<(name: string, runStart: number, result: { status: string; error?: string }) => Promise<void>>(
  async () => {},
);
vi.mock("@/lib/cron-auth", () => ({
  cronFinished: (name: string, runStart: number, result: { status: string; error?: string }) =>
    cronFinished(name, runStart, result),
}));
vi.mock("@sentry/nextjs", () => ({ captureException: () => {} }));
const findMany = vi.fn<(...a: unknown[]) => Promise<unknown[]>>(async () => [
  { id: "d1", slug: "mandya", name: "Mandya", state: { slug: "karnataka", name: "Karnataka" } },
]);
vi.mock("@/lib/db", () => ({ prisma: { district: { findMany: (...a: unknown[]) => findMany(...a) } } }));

import { withCronErrors } from "@/scraper/lib/cron-run";
import { jobContextFor, listActiveDistricts } from "@/scraper/lib/cron-districts";

describe("withCronErrors", () => {
  beforeEach(() => cronFinished.mockClear());

  it("returns the body's response and records nothing itself", async () => {
    const res = await withCronErrors("scrape-x", 1, async () => new Response("fine", { status: 200 }));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("fine");
    expect(cronFinished).not.toHaveBeenCalled();
  });

  it("records a throw as an error run once and answers 500", async () => {
    const res = await withCronErrors("scrape-x", 123, async () => {
      throw new Error("db unreachable");
    });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: "db unreachable" });
    expect(cronFinished).toHaveBeenCalledTimes(1);
    expect(cronFinished.mock.calls[0]).toEqual(["scrape-x", 123, { status: "error", error: "db unreachable" }]);
  });
});

describe("listActiveDistricts / jobContextFor", () => {
  it("reads active districts with their state, A→Z", async () => {
    const rows = await listActiveDistricts();
    expect(rows[0].slug).toBe("mandya");
    expect(findMany.mock.calls[0][0]).toEqual({
      where: { active: true },
      select: { id: true, slug: true, name: true, state: { select: { slug: true, name: true } } },
      orderBy: { name: "asc" },
    });
  });

  it("builds the JobContext from the district's own state (no Karnataka default)", () => {
    const log = () => {};
    expect(
      jobContextFor({ id: "d9", slug: "pune", name: "Pune", state: { slug: "maharashtra", name: "Maharashtra" } }, log),
    ).toEqual({ districtId: "d9", districtSlug: "pune", districtName: "Pune", stateSlug: "maharashtra", stateName: "Maharashtra", log });
  });
});

describe("cron routes", () => {
  const dir = path.resolve(__dirname, "../src/app/api/cron");
  const routes = readdirSync(dir).map((name) => ({ name, src: readFileSync(path.join(dir, name, "route.ts"), "utf8") }));

  it("use one lock style (lock:cron:<name>), always released in a finally", () => {
    for (const r of routes) {
      expect(r.src, r.name).not.toMatch(/ftp:lock:/);
      if (r.src.includes("acquireCronLock(")) {
        expect(r.src, r.name).toMatch(/finally\s*\{\s*await releaseCronLock\(CRON_NAME\);/);
      }
    }
  });

  it("scrape-news's 14-day alert sweep never touches official SACHET alerts", () => {
    const news = routes.find((r) => r.name === "scrape-news")!.src;
    const sweep = news.slice(news.indexOf("localAlert.updateMany"), news.indexOf("data: { active: false }"));
    expect(sweep).toMatch(/OR: \[\{ sourceUrl: null \}, \{ NOT: OFFICIAL_ALERTS \}\]/);
  });

  it("never default a district's state to Karnataka", () => {
    for (const r of routes) expect(r.src, r.name).not.toMatch(/\?\?\s*"karnataka"/i);
  });
});
