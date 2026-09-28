/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// The weekly platform-report cron must pass its deadline to the AI call:
// without one, a slow model chain outlived the function and the run stayed
// "running" with no report.
import { describe, expect, it, vi } from "vitest";

const callAIJSON = vi.fn<(req: { deadlineAt?: number }) => Promise<unknown>>(async () => ({
  data: { summary: "s", actionItems: [], costTips: [], growthInsights: null },
  model: "m",
  provider: "openrouter",
}));
vi.mock("@/lib/ai-provider", () => ({ callAIJSON: (req: { deadlineAt?: number }) => callAIJSON(req) }));
vi.mock("@/lib/cache", () => ({ cacheGet: async () => null }));

// Every prisma.<model>.<method>() answers with an empty result.
const empty: Record<string, unknown> = { count: 0, findMany: [], aggregate: { _sum: { amountINR: null } } };
vi.mock("@/lib/db", () => ({
  prisma: new Proxy(
    {},
    {
      get: () =>
        new Proxy(
          {},
          {
            get: (_t, method: string) => async (args?: { data?: Record<string, unknown> }) =>
              method === "create"
                ? { id: "r1", generatedAt: new Date(), aiProvider: "openrouter", ...args?.data }
                : empty[method],
          },
        ),
    },
  ),
}));

import { generatePlatformReport } from "@/lib/platform-analysis";

describe("generatePlatformReport", () => {
  it("forwards the cron's deadline to callAIJSON", async () => {
    const deadlineAt = Date.now() + 240_000;
    const report = await generatePlatformReport("weekly", { deadlineAt });
    expect(report.id).toBe("r1");
    expect(callAIJSON).toHaveBeenCalledTimes(1);
    expect(callAIJSON.mock.calls[0][0].deadlineAt).toBe(deadlineAt);
  });

  it("the admin's manual run still works without a deadline", async () => {
    callAIJSON.mockClear();
    await generatePlatformReport("manual");
    expect(callAIJSON.mock.calls[0][0].deadlineAt).toBeUndefined();
  });
});
