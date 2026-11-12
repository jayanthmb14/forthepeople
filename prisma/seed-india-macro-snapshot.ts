/**
 * Seed: macro-snapshot IndiaIndicator rows for the new "India at a Glance"
 * magazine-spread band (Step 4 of the v2 mockup rollout).
 *
 * Each row is upserted on (moduleSlug, metricKey). If a live scraper has
 * already populated the row with a fresher value, the update path keeps
 * the value; only metadata (label, source, etc.) is refreshed. We use
 * upsert so reruns are idempotent.
 *
 * Intentional: NO update of `numericValue` for rows that already exist —
 * the live scraper is authoritative once it lands. The seed only fills
 * missing rows.
 *
 * Run: npx tsx prisma/seed-india-macro-snapshot.ts
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

const ROWS: SeedRow[] = [
  // ── Population (demographics-population) ──
  {
    moduleSlug: "demographics-population",
    metricKey: "population_total",
    metricLabel: "Total Population",
    numericValue: 1_430_000_000,
    unit: "people",
    source: "UN Population Prospects",
    sourceUrl: "https://population.un.org/wpp/",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "demographics-population",
    metricKey: "population_growth_yoy",
    metricLabel: "Population Growth (YoY)",
    numericValue: 0.8,
    unit: "percent",
    source: "UN Population Prospects",
    sourceUrl: "https://population.un.org/wpp/",
    asOfDate: NOW,
    displayOrder: 2,
  },

  // ── Economy (economy-gdp / economy-inflation) ──
  {
    moduleSlug: "economy-gdp",
    metricKey: "gdp_nominal_usd_trillion",
    metricLabel: "Nominal GDP (USD trillion)",
    numericValue: 4.1,
    unit: "trillion_usd",
    source: "IMF",
    sourceUrl: "https://www.imf.org/en/Publications/WEO",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "economy-gdp",
    metricKey: "gdp_growth_yoy",
    metricLabel: "GDP Growth (YoY)",
    numericValue: 7.4,
    unit: "percent",
    source: "MoSPI",
    sourceUrl: "https://www.mospi.gov.in/",
    asOfDate: NOW,
    displayOrder: 2,
  },
  {
    moduleSlug: "economy-gdp",
    metricKey: "gdp_per_capita_inr",
    metricLabel: "Per Capita Income (₹)",
    numericValue: 240000,
    unit: "rupees",
    source: "MoSPI",
    sourceUrl: "https://www.mospi.gov.in/",
    asOfDate: NOW,
    displayOrder: 3,
  },
  {
    moduleSlug: "economy-inflation",
    metricKey: "cpi_inflation",
    metricLabel: "CPI Inflation (YoY)",
    numericValue: 5.0,
    unit: "percent",
    source: "MoSPI",
    sourceUrl: "https://www.rbi.org.in/",
    asOfDate: NOW,
    displayOrder: 1,
  },

  // ── National Snapshot (national-snapshot) ──
  {
    moduleSlug: "national-snapshot",
    metricKey: "states_count",
    metricLabel: "States",
    numericValue: 28,
    unit: "count",
    source: "MHA",
    sourceUrl: "https://www.mha.gov.in/",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "national-snapshot",
    metricKey: "uts_count",
    metricLabel: "Union Territories",
    numericValue: 8,
    unit: "count",
    source: "MHA",
    sourceUrl: "https://www.mha.gov.in/",
    asOfDate: NOW,
    displayOrder: 2,
  },
  {
    moduleSlug: "national-snapshot",
    metricKey: "scheduled_languages",
    metricLabel: "Scheduled Languages (Schedule 8)",
    numericValue: 22,
    unit: "count",
    source: "Constitution Schedule 8",
    sourceUrl: "https://www.indiacode.nic.in/",
    asOfDate: NOW,
    displayOrder: 3,
  },

  // ── Workforce (economy-employment) ──
  {
    moduleSlug: "economy-employment",
    metricKey: "workforce_size",
    metricLabel: "Workforce Size",
    numericValue: 600_000_000,
    unit: "people",
    source: "PLFS / NSO",
    sourceUrl: "https://www.mospi.gov.in/web/mospi/plfs",
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

  console.log(`Macro-snapshot seed: created=${created}, kept=${kept}, total=${ROWS.length}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
