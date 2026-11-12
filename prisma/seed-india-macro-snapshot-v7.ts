/**
 * Seed: 5 additional macro-snapshot IndiaIndicator rows for the v7
 * dense IndiaAtGlance band (Step 6).
 *
 * Idempotent — only inserts where (moduleSlug, metricKey) doesn't
 * already exist. Live scrapers, when they land, take over via their
 * existing upsert path.
 *
 * Run: npx tsx prisma/seed-india-macro-snapshot-v7.ts
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
  {
    moduleSlug: "demographics-population",
    metricKey: "population_density_per_sq_km",
    metricLabel: "Population density (per km²)",
    numericValue: 481,
    unit: "per_sq_km",
    source: "Census of India",
    sourceUrl: "https://censusindia.gov.in/",
    asOfDate: NOW,
    displayOrder: 3,
  },
  {
    moduleSlug: "demographics-population",
    metricKey: "global_rank",
    metricLabel: "Global rank",
    numericValue: 1,
    unit: "rank",
    source: "UN Population Prospects",
    sourceUrl: "https://population.un.org/wpp/",
    asOfDate: NOW,
    displayOrder: 4,
  },
  {
    moduleSlug: "budget-union",
    metricKey: "total_outlay_inr_lakh_crore",
    metricLabel: "Total outlay (₹ lakh crore)",
    numericValue: 47.6,
    unit: "lakh_crore_inr",
    source: "MoF",
    sourceUrl: "https://www.indiabudget.gov.in/",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "budget-gst",
    metricKey: "monthly_collection_inr_lakh_crore",
    metricLabel: "Monthly GST collection (₹ lakh crore)",
    numericValue: 1.6,
    unit: "lakh_crore_inr",
    source: "MoF GST",
    sourceUrl: "https://www.gst.gov.in/",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "economy-inflation",
    metricKey: "rbi_target_midpoint",
    metricLabel: "RBI inflation target midpoint",
    numericValue: 4.0,
    unit: "percent",
    source: "RBI",
    sourceUrl: "https://www.rbi.org.in/",
    asOfDate: NOW,
    displayOrder: 2,
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

  console.log(`Macro-snapshot v7 seed: created=${created}, kept=${kept}, total=${ROWS.length}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
