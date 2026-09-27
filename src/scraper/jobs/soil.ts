/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Soil Health — Soil Health Card Portal (DAC&FW)
// Schedule: Monthly (15th of month, 3 AM)
// Source: data.gov.in soil health cards dataset
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";
import { firstAmount } from "../lib/sanity";

const DATA_GOV_BASE = "https://api.data.gov.in/resource";
// Soil Health Card distribution data (DAC&FW)
const SOIL_RESOURCE = "a3e6c6e0-dff9-4e3b-9049-b3e7efb3ecf2";

type SoilRating = "Low" | "Medium" | "High" | "Slightly Acidic" | "Neutral" | "Slightly Alkaline";

function nitrogenRating(v: number): SoilRating {
  return v < 280 ? "Low" : v < 560 ? "Medium" : "High";
}
function phosphorusRating(v: number): SoilRating {
  return v < 11 ? "Low" : v < 22 ? "Medium" : "High";
}
function potassiumRating(v: number): SoilRating {
  return v < 110 ? "Low" : v < 280 ? "Medium" : "High";
}

export async function scrapeSoil(ctx: JobContext): Promise<ScraperResult> {
  const apiKey = process.env.DATA_GOV_API_KEY;
  if (!apiKey) {
    ctx.log("Soil: DATA_GOV_API_KEY not set — skipping");
    return { success: true, recordsNew: 0, recordsUpdated: 0 };
  }

  try {
    let newCount = 0;
    let updatedCount = 0;

    const url = `${DATA_GOV_BASE}/${SOIL_RESOURCE}?api-key=${apiKey}&format=json&limit=100&filters[district]=${encodeURIComponent(ctx.districtSlug)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });

    if (!res.ok) throw new Error(`HTTP ${res.status} from data.gov.in Soil`);

    const json = await res.json();
    const records: Record<string, string>[] = json?.records ?? [];

    for (const rec of records) {
      const villageName = (rec.village_name ?? rec.village ?? rec.taluk ?? "").trim();
      if (!villageName) continue;

      // Only published readings. The old code defaulted a missing pH to 6.8
      // and missing N/P/K to 0 (then rated them) — invented soil results.
      const pHRaw = firstAmount(rec, ["ph", "pH"]);
      const pH = pHRaw !== null && pHRaw <= 14 ? pHRaw : null;
      const nitrogen = firstAmount(rec, ["nitrogen", "N"]);
      const phosphorus = firstAmount(rec, ["phosphorus", "P"]);
      const potassium = firstAmount(rec, ["potassium", "K"]);
      if (pH === null && nitrogen === null && phosphorus === null && potassium === null) continue;

      const recommendation =
        nitrogen !== null && phosphorus !== null && potassium !== null
          ? `N: ${nitrogenRating(nitrogen)}, P: ${phosphorusRating(phosphorus)}, K: ${potassiumRating(potassium)}`
          : null;

      const existing = await prisma.soilHealth.findFirst({
        where: { districtId: ctx.districtId, villageName },
      });

      if (!existing) {
        await prisma.soilHealth.create({
          data: {
            districtId: ctx.districtId,
            villageName,
            pH,
            nitrogen: nitrogen !== null && nitrogen > 0 ? nitrogenRating(nitrogen) : null,
            phosphorus: phosphorus !== null && phosphorus > 0 ? phosphorusRating(phosphorus) : null,
            potassium: potassium !== null && potassium > 0 ? potassiumRating(potassium) : null,
            organicCarbon: rec.organic_carbon ?? null,
            recommendation,
            testedAt: rec.test_date ? new Date(rec.test_date) : null,
            source: "Soil Health Card / data.gov.in",
          },
        });
        newCount++;
      } else {
        await prisma.soilHealth.update({
          where: { id: existing.id },
          data: {
            pH: pH ?? existing.pH,
            nitrogen: nitrogen !== null && nitrogen > 0 ? nitrogenRating(nitrogen) : existing.nitrogen,
            phosphorus: phosphorus !== null && phosphorus > 0 ? phosphorusRating(phosphorus) : existing.phosphorus,
            potassium: potassium !== null && potassium > 0 ? potassiumRating(potassium) : existing.potassium,
            recommendation: recommendation ?? existing.recommendation,
            source: "Soil Health Card / data.gov.in",
          },
        });
        updatedCount++;
      }
    }

    ctx.log(`Soil: ${newCount} new, ${updatedCount} updated`);
    return { success: true, recordsNew: newCount, recordsUpdated: updatedCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
