/**
 * Seed: 16 culture IndiaIndicator rows for Section 10 v1.
 *
 * Featured = tourism-heritage (live, displayOrder 1) — UNESCO &
 * ASI Heritage. Right cards: World Heritage Sites (5 inscription-
 * year entries on tourism-heritage) + Cultural Output (4 entries —
 * Bollywood/GI/Languages/Museums; the latter 3 anchored to
 * tourism-heritage and tourism-gi-tags since dedicated modules
 * for films/languages/museums don't exist).
 *
 * Run: npx tsx prisma/seed-india-culture.ts
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
const ASI = "https://asi.nic.in/";
const UNESCO = "https://whc.unesco.org/";
const TOURISM = "https://tourism.gov.in/";
const CBFC = "https://www.cbfcindia.gov.in/";
const GI_REGISTRY = "https://ipindia.gov.in/";
const CULTURE = "https://indiaculture.gov.in/";

const ROWS: SeedRow[] = [
  // ── Featured UNESCO & Heritage (under tourism-heritage) ──
  {
    moduleSlug: "tourism-heritage",
    metricKey: "asi_monuments_count",
    metricLabel: "ASI centrally protected monuments",
    numericValue: 3700,
    unit: "monuments",
    source: "ASI · Centrally Protected Monuments",
    sourceUrl: ASI,
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "tourism-heritage",
    metricKey: "unesco_sites_count",
    metricLabel: "UNESCO World Heritage sites",
    numericValue: 43,
    unit: "sites",
    source: "UNESCO World Heritage List",
    sourceUrl: UNESCO,
    asOfDate: NOW,
    displayOrder: 2,
  },
  {
    moduleSlug: "tourism-heritage",
    metricKey: "global_rank_unesco",
    metricLabel: "Global rank · most UNESCO sites",
    numericValue: 6,
    unit: "rank",
    source: "UNESCO ranking",
    sourceUrl: UNESCO,
    asOfDate: NOW,
    displayOrder: 3,
  },
  {
    moduleSlug: "tourism-heritage",
    metricKey: "data_year",
    metricLabel: "Heritage dataset year",
    numericValue: 2024,
    unit: "year",
    source: "ASI · UNESCO",
    sourceUrl: UNESCO,
    asOfDate: NOW,
    displayOrder: 4,
  },

  // ── Top World Heritage Sites (5 — by inscription year) ──
  {
    moduleSlug: "tourism-heritage",
    metricKey: "unesco_taj_mahal_year",
    metricLabel: "UNESCO · Taj Mahal inscription year",
    numericValue: 1983,
    unit: "year",
    source: "UNESCO · Taj Mahal",
    sourceUrl: UNESCO,
    asOfDate: NOW,
    displayOrder: 10,
  },
  {
    moduleSlug: "tourism-heritage",
    metricKey: "unesco_ajanta_year",
    metricLabel: "UNESCO · Ajanta Caves inscription year",
    numericValue: 1983,
    unit: "year",
    source: "UNESCO · Ajanta Caves",
    sourceUrl: UNESCO,
    asOfDate: NOW,
    displayOrder: 11,
  },
  {
    moduleSlug: "tourism-heritage",
    metricKey: "unesco_khajuraho_year",
    metricLabel: "UNESCO · Khajuraho inscription year",
    numericValue: 1986,
    unit: "year",
    source: "UNESCO · Khajuraho",
    sourceUrl: UNESCO,
    asOfDate: NOW,
    displayOrder: 12,
  },
  {
    moduleSlug: "tourism-heritage",
    metricKey: "unesco_hampi_year",
    metricLabel: "UNESCO · Hampi inscription year",
    numericValue: 1986,
    unit: "year",
    source: "UNESCO · Hampi",
    sourceUrl: UNESCO,
    asOfDate: NOW,
    displayOrder: 13,
  },
  {
    moduleSlug: "tourism-heritage",
    metricKey: "unesco_sundarbans_year",
    metricLabel: "UNESCO · Sundarbans inscription year",
    numericValue: 1987,
    unit: "year",
    source: "UNESCO · Sundarbans",
    sourceUrl: UNESCO,
    asOfDate: NOW,
    displayOrder: 14,
  },

  // ── Cultural Output (4 entries — anchored across tourism-heritage / gi-tags) ──
  {
    moduleSlug: "tourism-heritage",
    metricKey: "bollywood_films_per_year",
    metricLabel: "Bollywood films per year (CBFC)",
    numericValue: 1800,
    unit: "films_per_year",
    source: "CBFC · Annual Report",
    sourceUrl: CBFC,
    asOfDate: NOW,
    displayOrder: 20,
  },
  {
    moduleSlug: "tourism-gi-tags",
    metricKey: "gi_tags_count",
    metricLabel: "GI tags registered",
    numericValue: 600,
    unit: "gi_tags",
    source: "DPIIT · GI registry",
    sourceUrl: GI_REGISTRY,
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "tourism-heritage",
    metricKey: "scheduled_languages_count",
    metricLabel: "Scheduled languages (Schedule 8)",
    numericValue: 22,
    unit: "languages",
    source: "Constitution Schedule 8",
    sourceUrl: "https://www.indiacode.nic.in/",
    asOfDate: NOW,
    displayOrder: 21,
  },
  {
    moduleSlug: "tourism-heritage",
    metricKey: "museums_count",
    metricLabel: "Museums",
    numericValue: 1000,
    unit: "museums",
    source: "Ministry of Culture",
    sourceUrl: CULTURE,
    asOfDate: NOW,
    displayOrder: 22,
  },

  // ── Tourism arrivals (under tourism-overview) ──
  {
    moduleSlug: "tourism-overview",
    metricKey: "international_arrivals_lakh",
    metricLabel: "Foreign Tourist Arrivals (lakh)",
    numericValue: 94,
    unit: "lakh",
    source: "Ministry of Tourism",
    sourceUrl: TOURISM,
    asOfDate: NOW,
    displayOrder: 1,
  },

  // ── Directory headlines for the 2 remaining modules ──
  {
    moduleSlug: "sports-olympics",
    metricKey: "olympic_medals_total",
    metricLabel: "Olympic medals (all-time)",
    numericValue: 41,
    unit: "medals",
    source: "Olympic Games results",
    sourceUrl: "https://olympics.com/en/athletes/india",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "sports-khelo-india",
    metricKey: "khelo_athletes_thousand",
    metricLabel: "Khelo India athletes (thousand)",
    numericValue: 3,
    unit: "thousand",
    source: "Khelo India · MoYAS",
    sourceUrl: "https://kheloindia.gov.in/",
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
  console.log(`Culture seed: created=${created}, kept=${kept}, total=${ROWS.length}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
