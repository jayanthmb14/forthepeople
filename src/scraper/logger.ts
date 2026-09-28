/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — ScraperLog writer for the admin "run now" button
// (src/app/api/admin/run-scraper). Cron routes log through
// cronStarted()/cronFinished() in src/lib/cron-auth.ts instead.
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { ScraperResult } from "./types";

export async function writeLog(
  jobName: string,
  startedAt: Date,
  result: ScraperResult
) {
  try {
    await prisma.scraperLog.create({
      data: {
        jobName,
        status: result.success ? "success" : "error",
        recordsNew: result.recordsNew,
        recordsUpdated: result.recordsUpdated,
        error: result.error ?? null,
        startedAt,
        completedAt: new Date(),
        duration: Date.now() - startedAt.getTime(),
      },
    });
  } catch (e) {
    console.error("[ScraperLogger] Failed to write log:", e);
  }
}
