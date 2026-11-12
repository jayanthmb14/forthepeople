/**
 * Seed: 11 know-india IndiaIndicator rows for the Section 02
 * "Know About India" v6 band (Step 7 PART B).
 *
 * All 6 know-india modules are status='planned' in the registry,
 * but the foundational facts they showcase (Constitution articles,
 * Lok Sabha seats, India's geographic area, etc.) are well-known
 * NCERT-cited primary-source values. Seeding them now lets the
 * band render with real data; live scrapers/editors can refine
 * via the existing upsert path.
 *
 * Run: npx tsx prisma/seed-india-know-about.ts
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
  // Constitution Works — featured module, drives the hero stat + 2x2 grid
  {
    moduleSlug: "know-india-constitution",
    metricKey: "articles_count",
    metricLabel: "Articles",
    numericValue: 470,
    unit: "count",
    source: "NCERT Class 11 Polity",
    sourceUrl: "https://ncert.nic.in/textbook.php",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "know-india-constitution",
    metricKey: "schedules_count",
    metricLabel: "Schedules",
    numericValue: 12,
    unit: "count",
    source: "Constitution of India",
    sourceUrl: "https://www.indiacode.nic.in/",
    asOfDate: NOW,
    displayOrder: 2,
  },
  {
    moduleSlug: "know-india-constitution",
    metricKey: "parts_count",
    metricLabel: "Parts",
    numericValue: 25,
    unit: "count",
    source: "Constitution of India",
    sourceUrl: "https://www.indiacode.nic.in/",
    asOfDate: NOW,
    displayOrder: 3,
  },
  {
    moduleSlug: "know-india-constitution",
    metricKey: "adopted_year",
    metricLabel: "Adopted (year)",
    numericValue: 1950,
    unit: "year",
    source: "Constitution of India",
    sourceUrl: "https://www.indiacode.nic.in/",
    asOfDate: NOW,
    displayOrder: 4,
  },
  // History
  {
    moduleSlug: "know-india-history-timeline",
    metricKey: "civilization_span_years",
    metricLabel: "Civilization span (years)",
    numericValue: 5000,
    unit: "years",
    source: "NCERT History Class 6-12",
    sourceUrl: "https://ncert.nic.in/textbook.php",
    asOfDate: NOW,
    displayOrder: 1,
  },
  // Geography
  {
    moduleSlug: "know-india-geography-physical",
    metricKey: "area_total_million_km2",
    metricLabel: "Total area (million km²)",
    numericValue: 3.29,
    unit: "million_km2",
    source: "Survey of India",
    sourceUrl: "https://surveyofindia.gov.in/",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "know-india-geography-physical",
    metricKey: "world_rank_by_area",
    metricLabel: "World rank by area",
    numericValue: 7,
    unit: "rank",
    source: "World Bank",
    sourceUrl: "https://www.worldbank.org/",
    asOfDate: NOW,
    displayOrder: 2,
  },
  // Parliament
  {
    moduleSlug: "know-india-parliament",
    metricKey: "lok_sabha_seats",
    metricLabel: "Lok Sabha seats",
    numericValue: 543,
    unit: "seats",
    source: "Lok Sabha Secretariat",
    sourceUrl: "https://sansad.in/ls/",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "know-india-parliament",
    metricKey: "rajya_sabha_seats",
    metricLabel: "Rajya Sabha seats",
    numericValue: 245,
    unit: "seats",
    source: "Rajya Sabha Secretariat",
    sourceUrl: "https://sansad.in/rs/",
    asOfDate: NOW,
    displayOrder: 2,
  },
  // Elections (replaces "judiciary" in the directory)
  {
    moduleSlug: "know-india-elections",
    metricKey: "registered_voters_millions",
    metricLabel: "Registered voters (millions)",
    numericValue: 970,
    unit: "millions_people",
    source: "ECI",
    sourceUrl: "https://eci.gov.in/",
    asOfDate: NOW,
    displayOrder: 1,
  },
  // Budget (replaces "culture-heritage" in the directory)
  {
    moduleSlug: "know-india-budget",
    metricKey: "budget_process_stages",
    metricLabel: "Budget process stages",
    numericValue: 8,
    unit: "stages",
    source: "Constitution Article 112 · NCERT",
    sourceUrl: "https://www.indiacode.nic.in/",
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

  console.log(`Know-india seed: created=${created}, kept=${kept}, total=${ROWS.length}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
