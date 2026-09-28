/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// POST /api/admin/cleanup-news deletes duplicate headlines per district with
// planTitleDuplicates (the scrape-news cron's rule). Its old key kept only
// ASCII letters, so all Hindi / Kannada headlines of a district shared one
// empty key and every one but the oldest would have been deleted.
import { describe, expect, it } from "vitest";
import { planTitleDuplicates } from "@/lib/news-dedupe";

const row = (id: string, title: string, fetchedAt: string) => ({ id, title, fetchedAt });

describe("cleanup-news duplicate rule", () => {
  it("never groups different non-Latin headlines", () => {
    const plan = planTitleDuplicates([
      row("a", "मांड्या में किसानों ने कावेरी जल पर विरोध प्रदर्शन किया", "2026-09-20T00:00Z"),
      row("b", "मैसूरु दशहरा का उद्घाटन इस वर्ष गवीमठ स्वामीजी करेंगे", "2026-09-21T00:00Z"),
      row("c", "ಮಂಡ್ಯದಲ್ಲಿ ರೈತರ ಪ್ರತಿಭಟನೆ", "2026-09-22T00:00Z"),
    ]);
    expect(plan).toEqual([]);
  });
  it("still removes a later copy of the same English headline", () => {
    const plan = planTitleDuplicates([
      row("copy", "Mandya: KRS dam water level rises to 120 ft", "2026-09-23T00:00Z"),
      row("orig", "Mandya — KRS dam water level rises to 120 ft", "2026-09-22T00:00Z"),
    ]);
    expect(plan).toEqual([{ keepId: "orig", removeIds: ["copy"] }]);
  });
});
