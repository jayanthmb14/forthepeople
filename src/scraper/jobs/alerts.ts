/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Alerts — Auto-generated from Google News RSS
// Schedule: Every 2 hours
// ═══════════════════════════════════════════════════════════
import * as cheerio from "cheerio";
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";

const ALERT_PATTERNS: Array<{ regex: RegExp; type: string; severity: string }> = [
  { regex: /flood|flash flood|inundation/i, type: "flood", severity: "critical" },
  { regex: /road block|road closed|traffic block/i, type: "road_closure", severity: "medium" },
  { regex: /power cut|power outage|electricity failure/i, type: "power_outage", severity: "medium" },
  { regex: /water supply|water shortage|water cut/i, type: "water_supply", severity: "medium" },
  { regex: /storm|cyclone|heavy rain|rainfall warning/i, type: "weather", severity: "high" },
  { regex: /fire accident|building collapse/i, type: "emergency", severity: "critical" },
  { regex: /strike|bandh|shutdown/i, type: "strike", severity: "high" },
  { regex: /land ?slide|earth ?quake/i, type: "natural_disaster", severity: "critical" },
];

export async function scrapeAlerts(ctx: JobContext): Promise<ScraperResult> {
  try {
    const topics = ["road closure", "power cut", "water supply", "flood", "strike"];
    let newCount = 0;

    for (const topic of topics) {
      const query = encodeURIComponent(`${ctx.districtSlug} ${topic}`);
      const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;

      await new Promise((r) => setTimeout(r, 2000)); // polite delay

      const res = await fetch(rssUrl, {
        headers: { "User-Agent": "ForThePeople.in Alerts Aggregator" },
      });
      if (!res.ok) continue;

      const xml = await res.text();
      const $ = cheerio.load(xml, { xmlMode: true });

      for (const item of $("item").toArray().slice(0, 5)) {
        const title = $(item).find("title").text().replace(/ - .*$/, "").trim();
        const dateStr = $(item).find("pubDate").text().trim();
        const publishedAt = new Date(dateStr || Date.now());

        // Only last 7 days
        if (Date.now() - publishedAt.getTime() > 7 * 24 * 3600_000) continue;

        const matched = ALERT_PATTERNS.find((p) => p.regex.test(title));
        if (!matched) continue;

        const existing = await prisma.localAlert.findFirst({
          where: { districtId: ctx.districtId, title },
        });
        if (existing) continue;

        await prisma.localAlert.create({
          data: {
            districtId: ctx.districtId,
            type: matched.type,
            severity: matched.severity,
            title,
            description: title,
            active: true,
            createdAt: publishedAt,
          },
        });
        newCount++;
      }
    }

    // Expire old alerts (>3 days)
    await prisma.localAlert.updateMany({
      where: {
        districtId: ctx.districtId,
        active: true,
        createdAt: { lt: new Date(Date.now() - 3 * 24 * 3600_000) },
      },
      data: { active: false },
    });

    ctx.log(`Alerts: ${newCount} new`);
    return { success: true, recordsNew: newCount, recordsUpdated: 0 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
