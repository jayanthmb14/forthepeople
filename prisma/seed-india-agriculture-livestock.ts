/**
 * Seed: agriculture-livestock IndiaIndicator rows for Section 05 v1.
 *
 * Crop Production = featured module. Top crop states + farmer schemes
 * also anchored under agriculture-production / agriculture-pmkisan
 * since PMFBY/KCC/Soil-Health-Card don't have their own modules in
 * the registry (same fallback pattern as Step 8's PMKVY).
 *
 * Idempotent: only inserts where (moduleSlug, metricKey) doesn't exist.
 *
 * Run: npx tsx prisma/seed-india-agriculture-livestock.ts
 */

import "dotenv/config";
import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";

function getPrisma() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

type SeedRow = {
  moduleSlug: string;
  metricKey: string;
  metricLabel: string;
  numericValue: number;
  unit: string;
  source: string;
  sourceUrl: string;
  asOfDate: Date;
  displayOrder: number;
};

const NOW = new Date();
const DESAGRI = "https://desagri.gov.in/";

const ROWS: SeedRow[] = [
  // ── Crop Production (featured) ──
  {
    moduleSlug: "agriculture-production",
    metricKey: "foodgrain_output_million_tonnes",
    metricLabel: "Foodgrain output (MT)",
    numericValue: 12.7,
    unit: "million_tonnes",
    source: "DA&FW · 4th Adv. Estimates",
    sourceUrl: DESAGRI,
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "agriculture-production",
    metricKey: "rice_production_million_tonnes",
    metricLabel: "Rice production (MT)",
    numericValue: 130,
    unit: "million_tonnes",
    source: "DA&FW · 4th Adv. Estimates",
    sourceUrl: DESAGRI,
    asOfDate: NOW,
    displayOrder: 2,
  },
  {
    moduleSlug: "agriculture-production",
    metricKey: "wheat_production_million_tonnes",
    metricLabel: "Wheat production (MT)",
    numericValue: 110,
    unit: "million_tonnes",
    source: "DA&FW · 4th Adv. Estimates",
    sourceUrl: DESAGRI,
    asOfDate: NOW,
    displayOrder: 3,
  },
  {
    moduleSlug: "agriculture-production",
    metricKey: "foodgrain_change_yoy_mt",
    metricLabel: "Foodgrain output change YoY (MT)",
    numericValue: 5,
    unit: "million_tonnes",
    source: "DA&FW · prior-year delta",
    sourceUrl: DESAGRI,
    asOfDate: NOW,
    displayOrder: 4,
  },
  {
    moduleSlug: "agriculture-production",
    metricKey: "top_producer_state_pct",
    metricLabel: "Top producer state share (%)",
    numericValue: 18,
    unit: "percent",
    source: "DA&FW",
    sourceUrl: DESAGRI,
    asOfDate: NOW,
    displayOrder: 5,
  },
  {
    moduleSlug: "agriculture-production",
    metricKey: "estimate_year",
    metricLabel: "Estimate year",
    numericValue: 2024,
    unit: "year",
    source: "DA&FW",
    sourceUrl: DESAGRI,
    asOfDate: NOW,
    displayOrder: 6,
  },

  // ── Top crop states (5) ──
  {
    moduleSlug: "agriculture-production",
    metricKey: "top_state_up_wheat_mt",
    metricLabel: "Top state · UP wheat (MT)",
    numericValue: 35,
    unit: "million_tonnes",
    source: "DA&FW · UP",
    sourceUrl: DESAGRI,
    asOfDate: NOW,
    displayOrder: 10,
  },
  {
    moduleSlug: "agriculture-production",
    metricKey: "top_state_pb_wheat_mt",
    metricLabel: "Top state · Punjab wheat (MT)",
    numericValue: 18,
    unit: "million_tonnes",
    source: "DA&FW · Punjab",
    sourceUrl: DESAGRI,
    asOfDate: NOW,
    displayOrder: 11,
  },
  {
    moduleSlug: "agriculture-production",
    metricKey: "top_state_wb_rice_mt",
    metricLabel: "Top state · West Bengal rice (MT)",
    numericValue: 16,
    unit: "million_tonnes",
    source: "DA&FW · West Bengal",
    sourceUrl: DESAGRI,
    asOfDate: NOW,
    displayOrder: 12,
  },
  {
    moduleSlug: "agriculture-production",
    metricKey: "top_state_mp_wheat_mt",
    metricLabel: "Top state · MP wheat (MT)",
    numericValue: 22,
    unit: "million_tonnes",
    source: "DA&FW · MP",
    sourceUrl: DESAGRI,
    asOfDate: NOW,
    displayOrder: 13,
  },
  {
    moduleSlug: "agriculture-production",
    metricKey: "top_state_ap_rice_mt",
    metricLabel: "Top state · AP rice (MT)",
    numericValue: 14,
    unit: "million_tonnes",
    source: "DA&FW · Andhra Pradesh",
    sourceUrl: DESAGRI,
    asOfDate: NOW,
    displayOrder: 14,
  },

  // ── Farmer schemes (4) — anchored to agriculture-pmkisan ──
  {
    moduleSlug: "agriculture-pmkisan",
    metricKey: "farmers_count_crore",
    metricLabel: "PM-KISAN beneficiaries (crore)",
    numericValue: 11,
    unit: "crore_farmers",
    source: "PM-KISAN dashboard",
    sourceUrl: "https://pmkisan.gov.in/",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "agriculture-pmkisan",
    metricKey: "pmfby_insured_crore",
    metricLabel: "PMFBY insured farmers (crore)",
    numericValue: 5.5,
    unit: "crore_farmers",
    source: "PMFBY · Agri Insurance",
    sourceUrl: "https://pmfby.gov.in/",
    asOfDate: NOW,
    displayOrder: 2,
  },
  {
    moduleSlug: "agriculture-pmkisan",
    metricKey: "kcc_active_cards_crore",
    metricLabel: "KCC active cards (crore)",
    numericValue: 7,
    unit: "crore_cards",
    source: "NABARD · KCC",
    sourceUrl: "https://www.nabard.org/",
    asOfDate: NOW,
    displayOrder: 3,
  },
  {
    moduleSlug: "agriculture-pmkisan",
    metricKey: "soil_health_cards_crore",
    metricLabel: "Soil Health cards issued (crore)",
    numericValue: 22,
    unit: "crore_cards",
    source: "Soil Health Card scheme",
    sourceUrl: "https://soilhealth.dac.gov.in/",
    asOfDate: NOW,
    displayOrder: 4,
  },

  // ── Directory headlines for the 3 coming_soon modules ──
  {
    moduleSlug: "agriculture-plantation",
    metricKey: "tea_production_million_kg",
    metricLabel: "Tea production (mn kg)",
    numericValue: 1400,
    unit: "million_kg",
    source: "Tea Board of India",
    sourceUrl: "https://www.teaboard.gov.in/",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "livestock-census",
    metricKey: "livestock_total_million",
    metricLabel: "Total livestock (million)",
    numericValue: 535,
    unit: "million",
    source: "Livestock Census · DA&FW",
    sourceUrl: "https://dahd.nic.in/",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "livestock-fisheries",
    metricKey: "fish_production_lakh_tonnes",
    metricLabel: "Fish production (lakh tonnes)",
    numericValue: 175,
    unit: "lakh_tonnes",
    source: "Department of Fisheries",
    sourceUrl: "https://dof.gov.in/",
    asOfDate: NOW,
    displayOrder: 1,
  },
];

async function main() {
  const prisma = getPrisma();
  let created = 0;
  let kept = 0;
  for (const row of ROWS) {
    const existing = await prisma.indiaIndicator.findUnique({
      where: { moduleSlug_metricKey: { moduleSlug: row.moduleSlug, metricKey: row.metricKey } },
    });
    if (existing) {
      kept++;
      continue;
    }
    await prisma.indiaIndicator.create({
      data: {
        moduleSlug: row.moduleSlug,
        metricKey: row.metricKey,
        metricLabel: row.metricLabel,
        numericValue: row.numericValue,
        unit: row.unit,
        asOfDate: row.asOfDate,
        source: row.source,
        sourceUrl: row.sourceUrl,
        displayOrder: row.displayOrder,
        dataQuality: "published",
      },
    });
    created++;
  }
  console.log(`Agriculture-livestock seed: created=${created}, kept=${kept}, total=${ROWS.length}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
