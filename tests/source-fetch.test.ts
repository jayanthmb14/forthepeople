/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// The shared polite fetcher (src/scraper/lib/source-fetch.ts): at most one
// request per `minGapMs` per host — also when callers start together — and
// the redirect mode passed through (the exams collector must not follow
// upsc.gov.in's redirect to its home page). Global fetch is mocked.
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSource } from "@/scraper/lib/source-fetch";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(status = 200) {
  const calls: Array<{ url: string; at: number; init: RequestInit }> = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, at: Date.now(), init });
      return new Response("ok", { status });
    }),
  );
  return calls;
}

describe("fetchSource politeness", () => {
  it("keeps sequential requests to one host at least minGapMs apart", async () => {
    const calls = stubFetch();
    await fetchSource("https://seq.example.gov.in/a", { minGapMs: 80 });
    await fetchSource("https://seq.example.gov.in/b", { minGapMs: 80 });
    expect(calls).toHaveLength(2);
    expect(calls[1].at - calls[0].at).toBeGreaterThanOrEqual(75);
  });

  it("queues callers that start together instead of letting them burst", async () => {
    const calls = stubFetch();
    await Promise.all(["a", "b", "c"].map((p) => fetchSource(`https://burst.example.gov.in/${p}`, { minGapMs: 80 })));
    const times = calls.map((c) => c.at).sort((x, y) => x - y);
    expect(times[1] - times[0]).toBeGreaterThanOrEqual(75);
    expect(times[2] - times[1]).toBeGreaterThanOrEqual(75);
  });

  it("does not make different hosts wait for each other", async () => {
    const calls = stubFetch();
    const t0 = Date.now();
    await Promise.all([
      fetchSource("https://one.example.gov.in/x", { minGapMs: 5_000 }),
      fetchSource("https://two.example.gov.in/x", { minGapMs: 5_000 }),
    ]);
    expect(calls).toHaveLength(2);
    expect(Date.now() - t0).toBeLessThan(1_000);
  });
});

describe("fetchSource redirect mode", () => {
  it("follows redirects by default and passes 'manual' through", async () => {
    const calls = stubFetch();
    await fetchSource("https://r1.example.gov.in/", { minGapMs: 0 });
    await fetchSource("https://r2.example.gov.in/", { minGapMs: 0, redirect: "manual" });
    expect(calls[0].init.redirect).toBe("follow");
    expect(calls[1].init.redirect).toBe("manual");
  });

  it("reports a 3xx under 'manual' as a failure, without retrying", async () => {
    const calls = stubFetch(301);
    const res = await fetchSource("https://r3.example.gov.in/moved", { minGapMs: 0, redirect: "manual" });
    expect(res.ok).toBe(false);
    expect(res.error).toBe("HTTP 301");
    expect(calls).toHaveLength(1);
  });
});
