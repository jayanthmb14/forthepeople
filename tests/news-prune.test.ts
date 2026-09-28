/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// A stored article still inside the freshness window must not be deleted:
// the next run would take it from the feed again as "new" (new row, AI
// call, translation, UpdateLog count), then delete it again. The news job
// prunes with planNewsRetention (src/lib/news-dedupe.ts), which also caps a
// district at NEWS_HARD_MAX rows.
import { describe, expect, it } from "vitest";
import { NEWS_HARD_MAX, NEWS_KEEP_PER_DISTRICT as NEWS_KEEP, NEWS_MAX_AGE_DAYS, planNewsRetention } from "@/lib/news-dedupe";

const now = Date.parse("2026-09-28T12:00:00Z");
const hoursAgo = (h: number) => new Date(now - h * 3_600_000);
/** The district's newest NEWS_KEEP rows (always kept). */
const newest = Array.from({ length: NEWS_KEEP }, (_, i) => ({ id: `keep-${i}`, publishedAt: hoursAgo(0.5 - i / 1000) }));

describe("planNewsRetention (rows after the newest NEWS_KEEP)", () => {
  it("never deletes a row younger than the freshness window", () => {
    const rows = [
      { id: "fresh-1", publishedAt: hoursAgo(5) },
      { id: "fresh-2", publishedAt: hoursAgo(NEWS_MAX_AGE_DAYS * 24 - 1) },
      { id: "old-1", publishedAt: hoursAgo(NEWS_MAX_AGE_DAYS * 24 + 1) },
      { id: "old-2", publishedAt: hoursAgo(24 * 10) },
    ];
    expect(planNewsRetention([...newest, ...rows], now)).toEqual(["old-1", "old-2"]);
  });

  it("still caps a district at NEWS_HARD_MAX rows", () => {
    const rows = Array.from({ length: NEWS_HARD_MAX + 3 }, (_, i) => ({ id: `r${i}`, publishedAt: new Date(now - 3_600_000 - i * 1000) }));
    expect(planNewsRetention(rows, now)).toEqual([`r${NEWS_HARD_MAX}`, `r${NEWS_HARD_MAX + 1}`, `r${NEWS_HARD_MAX + 2}`]);
  });

  it("deletes nothing when there is nothing past the newest NEWS_KEEP", () => {
    expect(planNewsRetention([], now)).toEqual([]);
    expect(planNewsRetention(newest, now)).toEqual([]);
  });
});
