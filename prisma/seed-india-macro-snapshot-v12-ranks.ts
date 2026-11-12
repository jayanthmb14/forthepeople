/**
 * Seed: 7 macro-snapshot World Rank IndiaIndicator rows for the v12
 * IndiaAtGlance right column ("India's World Rank" card).
 *
 * Idempotent — only inserts where (moduleSlug, metricKey) doesn't
 * already exist. Live scrapers, when they land, take over via the
 * existing upsert path.
 *
 * Run: npx tsx prisma/seed-india-macro-snapshot-v12-ranks.ts
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
    moduleSlug: "economy-gdp",
    metricKey: "gdp_ppp_usd_trillion",
    metricLabel: "GDP PPP (USD trillion)",
    numericValue: 14.6,
    unit: "trillion_usd",
    source: "IMF World Economic Outlook",
    sourceUrl: "https://www.imf.org/en/Publications/WEO",
    asOfDate: NOW,
    displayOrder: 4,
  },
  {
    moduleSlug: "economy-gdp",
    metricKey: "world_rank_gdp_nominal",
    metricLabel: "World rank — GDP nominal",
    numericValue: 5,
    unit: "rank",
    source: "IMF",
    sourceUrl: "https://www.imf.org/",
    asOfDate: NOW,
    displayOrder: 5,
  },
  {
    moduleSlug: "economy-gdp",
    metricKey: "world_rank_gdp_ppp",
    metricLabel: "World rank — GDP PPP",
    numericValue: 3,
    unit: "rank",
    source: "IMF",
    sourceUrl: "https://www.imf.org/",
    asOfDate: NOW,
    displayOrder: 6,
  },
  {
    moduleSlug: "economy-gdp",
    metricKey: "remittances_usd_billion",
    metricLabel: "Remittances (USD billion)",
    numericValue: 129,
    unit: "billion_usd",
    source: "World Bank Migration & Development",
    sourceUrl: "https://www.worldbank.org/migration",
    asOfDate: NOW,
    displayOrder: 7,
  },
  {
    moduleSlug: "economy-gdp",
    metricKey: "world_rank_remittances",
    metricLabel: "World rank — Remittances received",
    numericValue: 1,
    unit: "rank",
    source: "World Bank",
    sourceUrl: "https://www.worldbank.org/",
    asOfDate: NOW,
    displayOrder: 8,
  },
  {
    moduleSlug: "national-snapshot",
    metricKey: "smartphone_users_millions",
    metricLabel: "Smartphone users (millions)",
    numericValue: 750,
    unit: "millions_people",
    source: "GSMA · Statista",
    sourceUrl: "https://www.gsmaintelligence.com/",
    asOfDate: NOW,
    displayOrder: 4,
  },
  {
    moduleSlug: "national-snapshot",
    metricKey: "world_rank_smartphone_users",
    metricLabel: "World rank — Smartphone users",
    numericValue: 2,
    unit: "rank",
    source: "GSMA · Statista",
    sourceUrl: "https://www.gsmaintelligence.com/",
    asOfDate: NOW,
    displayOrder: 5,
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

  console.log(`Macro-snapshot v12 ranks seed: created=${created}, kept=${kept}, total=${ROWS.length}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
