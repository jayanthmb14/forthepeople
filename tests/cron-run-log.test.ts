/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// How a cron run becomes one ScraperLog row (src/scraper/lib/run-log.ts).
// The admin panel and the public verification section read these rows, so
// the status must say what really happened.
import { describe, expect, it } from "vitest";
import { runOutcome, scraperJobName, scraperLogStatus, summariseFailures } from "@/scraper/lib/run-log";

describe("scraperJobName", () => {
  it("strips the verb so names match the admin panel's job prefixes", () => {
    expect(scraperJobName("scrape-weather")).toBe("weather");
    expect(scraperJobName("scrape-alerts")).toBe("alerts");
    expect(scraperJobName("update-exams")).toBe("exams");
    expect(scraperJobName("generate-insights")).toBe("insights");
    expect(scraperJobName("news-intelligence")).toBe("news-intelligence");
    expect(scraperJobName("health-score")).toBe("health-score");
  });
});

describe("runOutcome", () => {
  it("tells ok, partial, error and skipped apart", () => {
    expect(runOutcome({ attempted: 10, failed: 0 })).toBe("ok");
    expect(runOutcome({ attempted: 10, failed: 3 })).toBe("partial");
    expect(runOutcome({ attempted: 10, failed: 0, budgetExhausted: true })).toBe("partial");
    expect(runOutcome({ attempted: 10, failed: 10 })).toBe("error");
    expect(runOutcome({ attempted: 0, failed: 0 })).toBe("skipped");
  });

  it("maps to the ScraperLog status words", () => {
    expect(scraperLogStatus("ok")).toBe("success");
    expect(scraperLogStatus("partial")).toBe("partial");
    expect(scraperLogStatus("error")).toBe("error");
    expect(scraperLogStatus("skipped")).toBe("skipped");
  });
});

describe("summariseFailures", () => {
  it("names each failed district with its reason", () => {
    expect(
      summariseFailures(
        [
          { district: "pune", error: "HTTP 502" },
          { district: "chennai", error: "The operation was aborted due to timeout" },
        ],
        10,
      ),
    ).toBe("2 of 10 districts failed: pune (HTTP 502); chennai (The operation was aborted due to timeout)");
  });

  it("returns null when nothing failed and caps the length", () => {
    expect(summariseFailures([], 10)).toBeNull();
    const many = Array.from({ length: 40 }, (_, i) => ({ district: `district-${i}`, error: "x".repeat(60) }));
    const line = summariseFailures(many, 40, 200) ?? "";
    expect(line.length).toBe(200);
    expect(line.endsWith("…")).toBe(true);
  });
});
