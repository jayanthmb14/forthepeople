/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: RTI Stats — Karnataka Information Commission
// Schedule: Daily at 2 AM
// Source: kic.karnataka.gov.in / data.gov.in
// ═══════════════════════════════════════════════════════════
import * as cheerio from "cheerio";
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";

// Karnataka Information Commission publishes quarterly RTI disposal stats
const KIC_URL = "https://kic.karnataka.gov.in/page/RTI+Statistics/en";

export async function scrapeRTI(ctx: JobContext): Promise<ScraperResult> {
  try {
    let newCount = 0;

    const res = await fetch(KIC_URL, {
      headers: { "User-Agent": "ForThePeople.in/1.0" },
      signal: AbortSignal.timeout(15_000),
    });

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    if (!res.ok) {
      // Honest empty state: the portal failed, so write NOTHING. The old fallback
      // fabricated RTI counts and avg-days with Math.random() and stored them as
      // "KIC Karnataka (estimated)" — that violates the platform's zero-fabrication
      // rule (every number must come from a cited government source). On failure we
      // simply write no rows; the /rti page degrades to its NoDataCard empty state.
      ctx.log(`RTI: KIC returned HTTP ${res.status} — no data written (honest empty state)`);
      return { success: false, recordsNew: 0, recordsUpdated: 0, error: `KIC HTTP ${res.status}` };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Parse RTI stats table (structure varies; look for dept/filed/disposed/pending columns)
    $("table tr").each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length < 4) return;

      const dept = $(cells[0]).text().trim();
      const filed = parseInt($(cells[1]).text().trim().replace(/,/g, ""), 10);
      const disposed = parseInt($(cells[2]).text().trim().replace(/,/g, ""), 10);
      const pending = parseInt($(cells[3]).text().trim().replace(/,/g, ""), 10);

      if (!dept || isNaN(filed)) return;

      prisma.rtiStat
        .findFirst({ where: { districtId: ctx.districtId, year, month, department: dept } })
        .then((existing) => {
          if (!existing) {
            prisma.rtiStat
              .create({
                data: {
                  districtId: ctx.districtId,
                  year,
                  month,
                  department: dept,
                  filed,
                  disposed: isNaN(disposed) ? 0 : disposed,
                  pending: isNaN(pending) ? filed : pending,
                  source: "Karnataka Information Commission",
                },
              })
              .then(() => newCount++);
          }
        });
    });

    await new Promise((r) => setTimeout(r, 300));

    ctx.log(`RTI: ${newCount} new records`);
    return { success: true, recordsNew: newCount, recordsUpdated: 0 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
