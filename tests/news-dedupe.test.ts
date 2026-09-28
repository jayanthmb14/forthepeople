/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it } from "vitest";
import {
  NEWS_KEEP_PER_DISTRICT,
  NEWS_MAX_AGE_DAYS,
  dedupeStories,
  findCanonicalStory,
  planCopyPromotion,
  planNewsRetention,
  planTitleDuplicates,
  titleKey,
} from "@/lib/news-dedupe";

const n = (title: string, publishedAt: string) => ({ title, publishedAt });

describe("dedupeStories (real Mandya headlines, Sept 2026)", () => {
  it("collapses one story told by several outlets", () => {
    const out = dedupeStories(
      [
        n("India News | Karnataka: Lokayukta Raids in Mandya, Kalaburagi over Alleged Disproportionate Assets Cases", "2026-09-22T05:46Z"),
        n("Karnataka: Lokayukta raids in Mandya, Kalaburagi over alleged disproportionate assets cases", "2026-09-22T05:33Z"),
        n("Karnataka Lokayukta raids Mandya, Kalaburagi over assets claims", "2026-09-22T05:32Z"),
      ],
      ["mandya"],
    );
    expect(out).toHaveLength(1);
    expect(out[0].title.startsWith("India News")).toBe(false);
  });

  it("collapses a reworded report of the same crash (Sept 2026 audit: shown twice)", () => {
    const out = dedupeStories(
      [
        n("Mandya road accident: Woman techie dies after car falls from flyover", "2026-09-19T03:26Z"),
        n("Car Falls From Bengaluru-Mysuru Expressway Flyover in Mandya; Woman Dead", "2026-09-18T11:35Z"),
        n("Karnataka: Woman dies after car falls from Bengaluru-Mysuru expressway flyover in Mandya", "2026-09-18T10:31Z"),
        n("Mandya: Car falls from Bengaluru-Mysuru Expressway flyover, woman seriously injured", "2026-09-18T09:45Z"),
      ],
      ["mandya"],
    );
    expect(out.map((r) => r.publishedAt)).toEqual(["2026-09-19T03:26Z"]);
  });

  it("collapses stories that share only three content words (Mandya overview, Sept 2026)", () => {
    const out = dedupeStories(
      [
        n("Cauvery row: Farmers claim injustice; stage protest in Mandya", "2026-09-26T08:00Z"),
        n("Mandya farmers protest Cauvery water release recommendation", "2026-09-26T05:00Z"),
      ],
      ["mandya", "Karnataka"],
    );
    expect(out).toHaveLength(1);
    const seer = dedupeStories(
      [
        n("Gavimath pontiff to inaugurate Mysuru Dasara this year: CM Shivakumar", "2026-09-20T08:00Z"),
        n("K’taka govt picks Gavimath seer to inaugurate Mysuru Dasara", "2026-09-20T05:00Z"),
      ],
      ["Mysuru", "mysore", "Karnataka"],
    );
    expect(seer).toHaveLength(1);
  });

  it("does not merge two stories that share only small words", () => {
    const out = dedupeStories(
      [
        n("Bengaluru sees 90% of Karnataka's 4,212 influenza cases in 2026: What's behind it?", "2026-09-26T08:00Z"),
        n("Karnataka Parkland Amendment: What It Means for Bengaluru", "2026-09-26T05:00Z"),
        n("Make Mysuru Dasara illumination more attractive this year: George", "2026-09-26T04:00Z"),
        n("Gavimutt seer to inaugurate Dasara this year", "2026-09-26T03:00Z"),
      ],
      ["Bengaluru Urban", "Karnataka", "mysuru"],
    );
    expect(out).toHaveLength(4);
  });

  it("does not merge different stories that share a few words", () => {
    const out = dedupeStories(
      [
        n("Upa Lokayukta registers case against MIMS, Mandya jail authorities", "2026-09-19T17:01Z"),
        n("Upa Lokayukta registers suo moto cases against DHO, THO, doctors and PDO in Mandya", "2026-09-16T17:42Z"),
        n("3 of family killed as milk tanker rams scooter in Karnataka's Mandya, driver detained", "2026-09-15T11:58Z"),
        n("Three killed after milk tanker rams into motorcyle in Karnataka's Mandya district", "2026-09-15T06:19Z"),
      ],
      ["mandya"],
    );
    expect(out).toHaveLength(3); // the two tanker reports are one story
  });
});

describe("ingest-time checks (src/scraper/jobs/news.ts)", () => {
  it("titleKey ignores punctuation the same way for stored and incoming titles", () => {
    expect(titleKey("Karnataka: Lokayukta raids in Mandya, Kalaburagi over assets")).toBe(
      titleKey("Karnataka Lokayukta raids — Mandya / Kalaburagi over assets"),
    );
    expect(titleKey("Karnataka: Lokayukta raids in Mandya")).toBe("karnataka lokayukta raids mandya");
  });

  it("findCanonicalStory points a reworded copy at the earliest original within 24 h", () => {
    const stored = [
      { id: "a", title: "Karnataka: Lokayukta raids in Mandya, Kalaburagi over alleged disproportionate assets cases", publishedAt: "2026-09-22T05:33Z", duplicateOf: null },
      { id: "b", title: "Karnataka Lokayukta raids Mandya, Kalaburagi over assets claims", publishedAt: "2026-09-22T05:40Z", duplicateOf: "a" },
      { id: "c", title: "Mandya: KRS dam water level rises", publishedAt: "2026-09-22T06:00Z", duplicateOf: null },
    ];
    expect(findCanonicalStory("India News | Karnataka: Lokayukta Raids in Mandya, Kalaburagi over Alleged Disproportionate Assets Cases", "2026-09-22T07:00Z", stored, ["mandya"])).toBe("a");
    expect(findCanonicalStory("Karnataka: Lokayukta raids in Mandya, Kalaburagi over alleged disproportionate assets cases", "2026-09-25T07:00Z", stored, ["mandya"])).toBeNull();
    expect(findCanonicalStory("Heavy rain lashes Mysuru", "2026-09-22T07:00Z", stored, ["mandya"])).toBeNull();
  });

  it("planTitleDuplicates keeps the original (fetched first), not the latest copy", () => {
    const plan = planTitleDuplicates([
      { id: "new", title: "Mandya: KRS dam water level rises to 120 ft", fetchedAt: "2026-09-23T00:00Z" },
      { id: "old", title: "Mandya — KRS dam water level rises to 120 ft", fetchedAt: "2026-09-22T00:00Z" },
      { id: "x", title: "Short", fetchedAt: "2026-09-22T00:00Z" },
    ]);
    expect(plan).toEqual([{ keepId: "old", removeIds: ["new"] }]);
  });
});

describe("housekeeping of stored stories", () => {
  const now = Date.parse("2026-09-28T06:00:00Z");
  const hoursAgo = (h: number) => new Date(now - h * 3_600_000);

  it("planNewsRetention never deletes a story the feeds can still return (Kolkata: 60 stories, all < 3 days old)", () => {
    const fresh = Array.from({ length: 60 }, (_, i) => ({ id: `f${i}`, publishedAt: hoursAgo(i) }));
    expect(planNewsRetention(fresh, now)).toEqual([]);
  });

  it("planNewsRetention deletes only rows beyond the newest 50 that are older than the window", () => {
    const rows = [
      ...Array.from({ length: 50 }, (_, i) => ({ id: `n${i}`, publishedAt: hoursAgo(i) })),
      { id: "fresh-51", publishedAt: hoursAgo(60) }, // 2.5 days: still fetchable, kept
      { id: "old-1", publishedAt: hoursAgo(NEWS_MAX_AGE_DAYS * 24 + 1) },
      { id: "old-2", publishedAt: hoursAgo(24 * 10) },
    ];
    expect(planNewsRetention([...rows].reverse(), now).sort()).toEqual(["old-1", "old-2"]);
    // Old rows among the newest 50 stay.
    expect(planNewsRetention([{ id: "only", publishedAt: hoursAgo(24 * 30) }], now)).toEqual([]);
    expect(NEWS_KEEP_PER_DISTRICT).toBe(50);
  });

  it("planCopyPromotion makes the earliest surviving copy the story's row", () => {
    const plan = planCopyPromotion([
      { id: "c2", duplicateOf: "orig", publishedAt: "2026-09-20T10:00Z" },
      { id: "c1", duplicateOf: "orig", publishedAt: "2026-09-20T08:00Z" },
      { id: "c3", duplicateOf: "other", publishedAt: "2026-09-20T09:00Z" },
      { id: "x", duplicateOf: null, publishedAt: "2026-09-20T09:00Z" },
    ]);
    expect(plan).toEqual([
      { keepId: "c1", repointIds: ["c2"] },
      { keepId: "c3", repointIds: [] },
    ]);
  });
});
