/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// scrape-news gives each district a fair share of the AI time
// (aiDeadlineAt). The AI classification itself used to get the RUN's
// deadline, so one call walking the whole model chain ate most of the run
// and 8–9 of 10 districts got no news (ScraperLog, 27 Sep 2026). The call
// must get the district's share.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const answer = {
  targetModule: "news",
  moduleAction: "",
  confidence: 0.9,
  extractedData: {},
  isAboutDistrict: true,
  provider: "test",
  model: "test-model",
};
const classify = vi.fn<(...args: unknown[]) => Promise<typeof answer>>(async () => answer);

vi.mock("@/lib/news-action-engine", () => ({
  classifyArticleWithAI: (...args: unknown[]) => classify(...args),
  executeNewsAction: async () => {},
}));
vi.mock("@/lib/update-log", () => ({ logUpdate: async () => {} }));
vi.mock("@/lib/db", () => ({
  prisma: {
    newsItem: {
      findMany: async () => [],
      create: async ({ data }: { data: { title: string; publishedAt: Date; duplicateOf?: string | null } }) => ({
        id: "n1",
        title: data.title,
        publishedAt: data.publishedAt,
        duplicateOf: data.duplicateOf ?? null,
      }),
      deleteMany: async () => ({ count: 0 }),
    },
  },
}));

import { scrapeNews } from "@/scraper/jobs/news";

// One fresh article that does not name the district, so the place must be
// checked by the AI.
const rss = () => `<?xml version="1.0"?><rss><channel><item>
  <title>State cabinet approves new irrigation policy for farmers - Some Paper</title>
  <link>https://example.com/story-1</link>
  <description>The cabinet approved the policy on Tuesday.</description>
  <source>Some Paper</source>
  <pubDate>${new Date(Date.now() - 3_600_000).toUTCString()}</pubDate>
</item></channel></rss>`;

describe("scrapeNews AI deadline", () => {
  beforeEach(() => {
    classify.mockClear();
    vi.stubGlobal("fetch", async () => new Response(rss(), { status: 200 }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("passes the district's AI share, not the run deadline, to the classifier", async () => {
    const deadlineAt = Date.now() + 240_000;
    const aiDeadlineAt = Date.now() + 24_000;
    const result = await scrapeNews(
      {
        districtSlug: "mandya",
        districtId: "d1",
        districtName: "Mandya",
        stateSlug: "karnataka",
        stateName: "Karnataka",
        log: () => {},
      },
      { deadlineAt, aiDeadlineAt },
    );
    expect(result.success).toBe(true);
    expect(classify).toHaveBeenCalled();
    for (const call of classify.mock.calls) {
      expect((call[4] as { deadlineAt?: number }).deadlineAt).toBe(aiDeadlineAt);
    }
  });

  it("falls back to the run deadline when no share is given", async () => {
    const deadlineAt = Date.now() + 240_000;
    await scrapeNews(
      { districtSlug: "mandya", districtId: "d1", districtName: "Mandya", stateSlug: "karnataka", stateName: "Karnataka", log: () => {} },
      { deadlineAt },
    );
    expect(classify).toHaveBeenCalled();
    expect((classify.mock.calls[0][4] as { deadlineAt?: number }).deadlineAt).toBe(deadlineAt);
  });
});
