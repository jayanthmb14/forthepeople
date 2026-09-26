/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Scraper logger + DB log writer
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { ScraperResult } from "./types";

export function makeLogger(jobName: string) {
  const lines: string[] = [];
  const log = (msg: string) => {
    const line = `[${new Date().toISOString()}] [${jobName}] ${msg}`;
    console.log(line);
    lines.push(line);
  };
  return { log, lines };
}

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
