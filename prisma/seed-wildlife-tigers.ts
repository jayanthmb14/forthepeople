/**
 * Wildlife/Tigers static seed data — Phase 4.4 validation case.
 *
 * Source: NTCA "Status of Tigers in India 2022" report
 * (published 9 Apr 2023; Project Tiger reserve list updated through 2025).
 *
 * All values traced to NTCA/Project Tiger publications. The seed script
 * is committed to the repo for transparency — anyone can verify these
 * numbers against the source PDFs.
 *
 * Run: npx tsx prisma/seed-wildlife-tigers.ts
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

function getPrisma() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

const NOW = new Date();
// Sept 2026 audit: the 3,682 estimate and the state-wise figures were released
// with the detailed "Status of Tigers 2022" report on 29 Jul 2023 (PIB
// PRID 1943922); the 9 Apr 2023 release gave only the 3,167 camera-trap
// minimum. The 2018 (4th cycle) estimate is 2,967 (PIB PRID 1580622, 29 Jul
// 2019) — 3,167 is the 2022 minimum, not a 2018 figure.
const REPORT_DATE = new Date("2023-07-29");
const PRIOR_REPORT_DATE = new Date("2018-12-01");
const TIGERS_2018 = 2967;
const NTCA_URL = "https://ntca.gov.in/";
const NTCA_METHODOLOGY_PDF = "https://ntca.gov.in/Status-of-Tigers-2022.pdf";
const PROJECT_TIGER_URL = "https://projecttiger.nic.in/";

async function main() {
  const prisma = getPrisma();

  // ── Headline KPI ──────────────────────────────────────────
  await prisma.indiaIndicator.upsert({
    where: {
      moduleSlug_metricKey: {
        moduleSlug: "wildlife-tigers",
        metricKey: "tiger_population_total",
      },
    },
    update: {
      numericValue: 3682,
      unit: "tigers",
      asOfDate: REPORT_DATE,
      previousValue: TIGERS_2018,
      previousAsOfDate: PRIOR_REPORT_DATE,
      dataQuality: "published",
      source: "NTCA",
      sourceUrl: NTCA_URL,
      methodologyUrl: NTCA_METHODOLOGY_PDF,
      conflictingSources: undefined,
      derivationNotes: null,
      metricLabel: "Tiger Population",
      fetchedAt: NOW,
    },
    create: {
      moduleSlug: "wildlife-tigers",
      metricKey: "tiger_population_total",
      metricLabel: "Tiger Population",
      numericValue: 3682,
      unit: "tigers",
      asOfDate: REPORT_DATE,
      previousValue: TIGERS_2018,
      previousAsOfDate: PRIOR_REPORT_DATE,
      dataQuality: "published",
      source: "NTCA",
      sourceUrl: NTCA_URL,
      methodologyUrl: NTCA_METHODOLOGY_PDF,
      derivationNotes: null,
      displayOrder: 1,
      fetchedAt: NOW,
    },
  });

  // ── Supporting KPI: tiger reserves count ──────────────────
  await prisma.indiaIndicator.upsert({
    where: {
      moduleSlug_metricKey: {
        moduleSlug: "wildlife-tigers",
        metricKey: "tiger_reserves_count",
      },
    },
    update: {
      numericValue: 58,
      unit: "notified",
      asOfDate: new Date("2025-04-01"),
      previousValue: 50,
      previousAsOfDate: PRIOR_REPORT_DATE,
      dataQuality: "published",
      source: "NTCA",
      sourceUrl: NTCA_URL,
      methodologyUrl: NTCA_METHODOLOGY_PDF,
      metricLabel: "Tiger Reserves",
      fetchedAt: NOW,
    },
    create: {
      moduleSlug: "wildlife-tigers",
      metricKey: "tiger_reserves_count",
      metricLabel: "Tiger Reserves",
      numericValue: 58,
      unit: "notified",
      asOfDate: new Date("2025-04-01"),
      previousValue: 50,
      previousAsOfDate: PRIOR_REPORT_DATE,
      dataQuality: "published",
      source: "NTCA",
      sourceUrl: NTCA_URL,
      methodologyUrl: NTCA_METHODOLOGY_PDF,
      displayOrder: 2,
      fetchedAt: NOW,
    },
  });

  // ── Supporting KPI: reserve area protected ────────────────
  await prisma.indiaIndicator.upsert({
    where: {
      moduleSlug_metricKey: {
        moduleSlug: "wildlife-tigers",
        metricKey: "reserve_area_protected_sqkm",
      },
    },
    update: {
      numericValue: 78735,
      unit: "km²",
      asOfDate: new Date("2025-04-01"),
      dataQuality: "published",
      source: "Project Tiger",
      sourceUrl: PROJECT_TIGER_URL,
      methodologyUrl: NTCA_METHODOLOGY_PDF,
      metricLabel: "Reserve Area Protected",
      fetchedAt: NOW,
    },
    create: {
      moduleSlug: "wildlife-tigers",
      metricKey: "reserve_area_protected_sqkm",
      metricLabel: "Reserve Area Protected",
      numericValue: 78735,
      unit: "km²",
      asOfDate: new Date("2025-04-01"),
      dataQuality: "published",
      source: "Project Tiger",
      sourceUrl: PROJECT_TIGER_URL,
      methodologyUrl: NTCA_METHODOLOGY_PDF,
      displayOrder: 3,
      fetchedAt: NOW,
    },
  });

  // ── Time series: 5 census years ───────────────────────────
  const series: Array<[string, number]> = [
    ["2006-12-01", 1411],
    ["2010-12-01", 1706],
    ["2014-12-01", 2226],
    ["2018-12-01", TIGERS_2018],
    ["2022-12-01", 3682],
  ];
  for (const [iso, value] of series) {
    await prisma.indiaTimeSeries.upsert({
      where: {
        moduleSlug_metricKey_date: {
          moduleSlug: "wildlife-tigers",
          metricKey: "tiger_population_total",
          date: new Date(iso),
        },
      },
      update: {
        value,
        unit: "tigers",
        source: "NTCA",
        sourceUrl: NTCA_URL,
      },
      create: {
        moduleSlug: "wildlife-tigers",
        metricKey: "tiger_population_total",
        date: new Date(iso),
        value,
        unit: "tigers",
        source: "NTCA",
        sourceUrl: NTCA_URL,
      },
    });
  }

  // ── State leaderboard: top 5 by tiger count (2022 census) ──
  const leaderboard: Array<[string, string, number, number]> = [
    ["madhya-pradesh", "Madhya Pradesh", 785, 1],
    ["karnataka", "Karnataka", 563, 2],
    ["uttarakhand", "Uttarakhand", 560, 3],
    ["maharashtra", "Maharashtra", 444, 4],
    ["tamil-nadu", "Tamil Nadu", 306, 5],
  ];
  for (const [slug, name, value, rank] of leaderboard) {
    await prisma.indiaStateBreakdown.upsert({
      where: {
        moduleSlug_metricKey_stateSlug: {
          moduleSlug: "wildlife-tigers",
          metricKey: "tiger_population_total",
          stateSlug: slug,
        },
      },
      update: {
        stateName: name,
        value,
        unit: "tigers",
        rank,
        asOfDate: REPORT_DATE,
        source: "NTCA",
        sourceUrl: NTCA_URL,
      },
      create: {
        moduleSlug: "wildlife-tigers",
        metricKey: "tiger_population_total",
        stateSlug: slug,
        stateName: name,
        value,
        unit: "tigers",
        rank,
        asOfDate: REPORT_DATE,
        source: "NTCA",
        sourceUrl: NTCA_URL,
      },
    });
  }

  // ── Placeholder source-sync rows for all 4 sources ────────
  // Tiger module cites NTCA, Project Tiger, WII, and Forest Survey of
  // India. Each has a placeholder IndiaScraperRun row so the freshness
  // dot on each source has a row to look up. Honest disclosure — automated
  // sync builds in a future phase; until then the dataset is hand-seeded.
  const sourcePlaceholders: Array<[string, string]> = [
    ["ntca-tigers", "Initial dataset · Automated sync planned (NTCA)"],
    ["project-tiger-reserves", "Initial dataset · Automated sync planned (Project Tiger)"],
    ["wii-tigers-methodology", "Initial dataset · Automated sync planned (Wildlife Institute of India)"],
    ["fsi-tiger-buffers", "Initial dataset · Automated sync planned (Forest Survey of India)"],
  ];
  // Wipe any prior placeholder rows from earlier seed runs so the table
  // doesn't accumulate duplicates on re-run.
  await prisma.indiaScraperRun.deleteMany({
    where: {
      scraperKey: { in: sourcePlaceholders.map(([k]) => k) },
      status: "partial",
    },
  });
  for (const [scraperKey, errorMessage] of sourcePlaceholders) {
    await prisma.indiaScraperRun.create({
      data: {
        scraperKey,
        startedAt: NOW,
        completedAt: NOW,
        status: "partial",
        recordsAdded: 0,
        recordsUpdated: 0,
        errorMessage,
        rawResponseUrl: null,
      },
    });
  }

  console.log("✅ Wildlife/Tigers seed complete");
  console.log("   3 IndiaIndicator rows (tiger_population_total, tiger_reserves_count, reserve_area_protected_sqkm)");
  console.log(`   ${series.length} IndiaTimeSeries rows (5 census years)`);
  console.log(`   ${leaderboard.length} IndiaStateBreakdown rows (top 5 states)`);
  console.log(`   ${sourcePlaceholders.length} IndiaScraperRun placeholder rows (one per source)`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
