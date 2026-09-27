/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Jal Jeevan Mission — eJalShakti National Dashboard
// Schedule: Weekly
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";
import { firstAmount } from "../lib/sanity";

// eJalShakti API for district-level JJM data
// Public API: https://ejalshakti.gov.in/JJM/JJMReports/BasicInformation/JJMRpt_HouseHoldTapConn_D.aspx
const JJM_API = "https://ejalshakti.gov.in/JJM/API/Reports/GetHHTPConn";

interface JJMRecord {
  villageName: string;
  totalHouseholds: number;
  tapConnections: number;
  coveragePct: number;
}

export async function scrapeJJM(ctx: JobContext): Promise<ScraperResult> {
  try {
    // POST request to JJM API with district filter
    const res = await fetch(JJM_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "ForThePeople.in Data Aggregator",
      },
      body: JSON.stringify({
        StateCode: "29", // Karnataka
        DistrictCode: ctx.districtSlug.toUpperCase(),
        FYear: new Date().getFullYear(),
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const records: JJMRecord[] = Array.isArray(data) ? data : data.data ?? [];

    let newCount = 0;
    let updCount = 0;

    for (const r of records) {
      // Both counts must be published; coverage is only derived from them.
      if (!r.villageName) continue;
      const households = firstAmount(r as unknown as Record<string, unknown>, ["totalHouseholds"]);
      const taps = firstAmount(r as unknown as Record<string, unknown>, ["tapConnections"]);
      if (households === null || taps === null || households === 0 || taps > households) continue;
      const existing = await prisma.jJMStatus.findFirst({
        where: { districtId: ctx.districtId, villageName: r.villageName },
      });

      const payload = {
        totalHouseholds: Math.round(households),
        tapConnections: Math.round(taps),
        coveragePct: (taps / households) * 100,
        source: "eJalShakti / JJM Dashboard",
        updatedAt: new Date(),
      };

      if (existing) {
        await prisma.jJMStatus.update({ where: { id: existing.id }, data: payload });
        updCount++;
      } else {
        await prisma.jJMStatus.create({
          data: { districtId: ctx.districtId, villageName: r.villageName, ...payload },
        });
        newCount++;
      }
    }

    ctx.log(`JJM: ${newCount} new, ${updCount} updated villages`);
    return { success: true, recordsNew: newCount, recordsUpdated: updCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
