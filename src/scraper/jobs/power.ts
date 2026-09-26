/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Power Outages — State-wise DISCOM Plugin Architecture
//
// Each state's DISCOM has a different portal and format.
// This uses a plugin pattern — each state has its own parser.
//
// Currently implemented:
// - Karnataka: BESCOM (bescom.karnataka.gov.in)
//
// Pending integration (NoDataCard shown to users):
// - Telangana: TGSPDCL (tgsouthernpower.org)
// - Delhi: BSES Rajdhani / BSES Yamuna / Tata Power DDL
// - Maharashtra: Adani Electricity / BEST
// - West Bengal: CESC (cesc.co.in)
// - Tamil Nadu: TANGEDCO (tnebnet.org)
//
// To add a new DISCOM:
// 1. Create a parser function: parseTGSPDCL(html, districtSlug) => outage records
// 2. Add entry to DISCOM_PARSERS array
// That's it — zero changes to the main scraper logic.
//
// Schedule: Every 15 minutes
// ═══════════════════════════════════════════════════════════
import * as cheerio from "cheerio";
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";

// ── DISCOM plugin interface ─────────────────────────────────
interface PowerOutageRecord {
  area: string;
  type: string;
  reason: string;
  startTime: Date;
  endTime: Date;
}

interface DISCOMParser {
  stateSlug: string;
  name: string;
  url: string;
  parse: (html: string, districtSlug: string) => PowerOutageRecord[];
}

// ── BESCOM parser (Karnataka) ───────────────────────────────
function parseBESCOM(html: string, districtSlug: string): PowerOutageRecord[] {
  const $ = cheerio.load(html);
  const outages: PowerOutageRecord[] = [];
  const districtName = districtSlug.replace(/-/g, " ");

  $("table tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 3) return;

    const area = $(cells[0]).text().trim();
    const timeText = $(cells[1]).text().trim();
    const reason = $(cells[2]).text().trim() || "Planned maintenance";

    if (!area.toLowerCase().includes(districtName)) return;
    if (!area) return;

    const timeMatch = timeText.match(/(\d{1,2}:\d{2})\s*(?:to|-)\s*(\d{1,2}:\d{2})/i);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startTime = new Date(today);
    const endTime = new Date(today);

    if (timeMatch) {
      const [sh, sm] = timeMatch[1].split(":").map(Number);
      const [eh, em] = timeMatch[2].split(":").map(Number);
      startTime.setHours(sh, sm);
      endTime.setHours(eh, em);
    } else {
      startTime.setHours(9, 0);
      endTime.setHours(17, 0);
    }

    outages.push({ area, type: "Planned", reason, startTime, endTime });
  });

  return outages;
}

// ── Parser registry ─────────────────────────────────────────
const DISCOM_PARSERS: DISCOMParser[] = [
  {
    stateSlug: "karnataka",
    name: "BESCOM",
    url: "https://bescom.karnataka.gov.in/page/Planned+Outage/en",
    parse: parseBESCOM,
  },
  // Future: Add new DISCOM parsers here
  // { stateSlug: "telangana", name: "TGSPDCL", url: "...", parse: parseTGSPDCL },
  // { stateSlug: "delhi", name: "BSES", url: "...", parse: parseBSES },
];

// ── Main scraper ────────────────────────────────────────────
export async function scrapePower(ctx: JobContext): Promise<ScraperResult> {
  const stateSlug = ctx.stateSlug ?? "karnataka";
  const parser = DISCOM_PARSERS.find((p) => p.stateSlug === stateSlug);

  if (!parser) {
    ctx.log(`Power: No DISCOM integration for state "${stateSlug}" — skipping. NoDataCard shown to users.`);
    return { success: true, recordsNew: 0, recordsUpdated: 0 };
  }

  try {
    // Fetch HTML from DISCOM portal
    const res = await fetch(parser.url, {
      headers: { "User-Agent": "ForThePeople.in/1.0 (citizen transparency platform)" },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} from ${parser.name}`);

    const html = await res.text();

    // Parse outage records using the state-specific parser
    const outages = parser.parse(html, ctx.districtSlug);

    // Insert new records (dedup by area + date)
    let newCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const outage of outages) {
      const existing = await prisma.powerOutage.findFirst({
        where: {
          districtId: ctx.districtId,
          area: outage.area,
          startTime: { gte: today },
        },
      });

      if (!existing) {
        await prisma.powerOutage.create({
          data: {
            districtId: ctx.districtId,
            area: outage.area,
            type: outage.type,
            reason: outage.reason,
            startTime: outage.startTime,
            endTime: outage.endTime,
            active: outage.endTime > new Date(),
            source: parser.name,
          },
        });
        newCount++;
      }
    }

    // Mark past outages as inactive
    await prisma.powerOutage.updateMany({
      where: {
        districtId: ctx.districtId,
        active: true,
        endTime: { lt: new Date() },
      },
      data: { active: false },
    });

    if (outages.length === 0) {
      ctx.log(`Power: no outages parsed from ${parser.name} (may have no planned outages or HTML changed)`);
    }

    ctx.log(`Power: ${newCount} new outages from ${parser.name}`);
    return { success: true, recordsNew: newCount, recordsUpdated: 0 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
