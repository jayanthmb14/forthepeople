/**
 * Seed: 16 living-standards IndiaIndicator rows for Section 03 v1.
 *
 * Module slug corrections applied per the Step 8 patch:
 *   health-indicators → health-overview
 *   ayushman-bharat   → health-pmjay
 *   vaccination-uwin  → health-immunisation
 *
 * water-sanitation, housing-pmay, pmmvy don't exist as modules.
 * Education trio (schools / higher / skills) fills LS slots 4-6.
 * PMKVY trained replaces PMMVY in the SCHEME_COVERAGE card.
 *
 * Idempotent — only inserts where (moduleSlug, metricKey) doesn't
 * already exist. Live scrapers, when they land, take over via the
 * existing upsert path.
 *
 * Run: npx tsx prisma/seed-india-living-standards.ts
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
  // ── Health Overview (featured) — 5 hero metrics ──
  {
    moduleSlug: "health-overview",
    metricKey: "life_expectancy_years",
    metricLabel: "Life expectancy (years)",
    numericValue: 70.8,
    unit: "years",
    source: "SRS Statistical Report",
    sourceUrl: "https://censusindia.gov.in/nada/index.php/catalog/SRS",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "health-overview",
    metricKey: "life_expectancy_target_2030",
    metricLabel: "Life expectancy target (NHP 2030)",
    numericValue: 75.0,
    unit: "years",
    source: "National Health Policy 2017",
    sourceUrl: "https://main.mohfw.gov.in/sites/default/files/9147562941489753121.pdf",
    asOfDate: NOW,
    displayOrder: 2,
  },
  {
    moduleSlug: "health-overview",
    metricKey: "life_expectancy_change_1990",
    metricLabel: "Life expectancy gain since 1990",
    // World Bank WDI SP.DYN.LE00.IN: 58.618 (1990) → 72.235 (2024) = 13.6.
    numericValue: 13.6,
    unit: "years",
    source: "World Bank · UN",
    sourceUrl: "https://data.worldbank.org/indicator/SP.DYN.LE00.IN?locations=IN",
    asOfDate: NOW,
    displayOrder: 3,
  },
  {
    moduleSlug: "health-overview",
    metricKey: "infant_mortality_rate",
    metricLabel: "Infant mortality rate",
    numericValue: 35.0,
    unit: "per_1000_births",
    source: "SRS Statistical Report",
    sourceUrl: "https://censusindia.gov.in/nada/index.php/catalog/SRS",
    asOfDate: NOW,
    displayOrder: 4,
  },
  {
    moduleSlug: "health-overview",
    metricKey: "doctors_per_1000",
    metricLabel: "Doctors per 1,000 people",
    numericValue: 0.74,
    unit: "per_1000_people",
    source: "MoHFW · NMC",
    sourceUrl: "https://www.nmc.org.in/",
    asOfDate: NOW,
    displayOrder: 5,
  },

  // ── State Leaders (5 entries) — all under health-overview ──
  {
    moduleSlug: "health-overview",
    metricKey: "state_leader_kerala_imr",
    metricLabel: "State leader · Kerala IMR",
    numericValue: 6,
    unit: "per_1000_births",
    source: "SRS Statistical Report (Kerala)",
    sourceUrl: "https://censusindia.gov.in/nada/index.php/catalog/SRS",
    asOfDate: NOW,
    displayOrder: 10,
  },
  {
    moduleSlug: "health-overview",
    metricKey: "state_leader_kerala_life_exp",
    metricLabel: "State leader · Kerala life expectancy",
    numericValue: 75.3,
    unit: "years",
    source: "SRS Statistical Report (Kerala)",
    sourceUrl: "https://censusindia.gov.in/nada/index.php/catalog/SRS",
    asOfDate: NOW,
    displayOrder: 11,
  },
  {
    moduleSlug: "health-overview",
    metricKey: "state_leader_delhi_doctors",
    metricLabel: "State leader · Delhi doctors per 1k",
    numericValue: 1.32,
    unit: "per_1000_people",
    source: "NMC · Delhi Medical Council",
    sourceUrl: "https://www.nmc.org.in/",
    asOfDate: NOW,
    displayOrder: 12,
  },
  {
    moduleSlug: "health-overview",
    metricKey: "state_leader_manipur_imm_cov",
    metricLabel: "State leader · Manipur immunisation coverage",
    numericValue: 82,
    unit: "percent",
    source: "NFHS-5 (Manipur)",
    sourceUrl: "https://rchiips.org/nfhs/factsheet_NFHS-5.shtml",
    asOfDate: NOW,
    displayOrder: 13,
  },
  {
    moduleSlug: "health-overview",
    metricKey: "state_leader_tn_hosp_per_1000",
    metricLabel: "State leader · Tamil Nadu hospitals per 1k",
    numericValue: 1.43,
    unit: "per_1000_people",
    source: "State Health Profile (TN)",
    sourceUrl: "https://main.mohfw.gov.in/",
    asOfDate: NOW,
    displayOrder: 14,
  },

  // ── Scheme Coverage card ──
  {
    moduleSlug: "health-pmjay",
    metricKey: "cards_issued_crore",
    metricLabel: "Ayushman cards issued (crore)",
    numericValue: 36,
    unit: "crore_cards",
    source: "NHA · Ayushman Bharat dashboard",
    sourceUrl: "https://pmjay.gov.in/",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "health-pmjay",
    metricKey: "empanelled_hospitals_thousands",
    metricLabel: "Empanelled hospitals (thousands)",
    numericValue: 30,
    unit: "thousand",
    source: "NHA dashboard",
    sourceUrl: "https://pmjay.gov.in/",
    asOfDate: NOW,
    displayOrder: 2,
  },
  {
    moduleSlug: "health-immunisation",
    metricKey: "doses_administered_crore",
    metricLabel: "U-WIN doses administered (crore)",
    numericValue: 26.0,
    unit: "crore_doses",
    source: "U-WIN · MoHFW",
    sourceUrl: "https://uwin.mohfw.gov.in/",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "education-skills",
    metricKey: "pmkvy_trained_crore",
    metricLabel: "PMKVY trained (crore)",
    numericValue: 1.4,
    unit: "crore_people",
    source: "MSDE · PMKVY dashboard",
    sourceUrl: "https://www.pmkvyofficial.org/",
    asOfDate: NOW,
    displayOrder: 1,
  },

  // ── Directory headlines for non-featured education modules ──
  {
    moduleSlug: "education-schools",
    metricKey: "schools_total_lakh",
    metricLabel: "Schools (UDISE+, lakh)",
    numericValue: 14.9,
    unit: "lakh_schools",
    source: "UDISE+ 2022-23",
    sourceUrl: "https://udiseplus.gov.in/",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "education-higher",
    metricKey: "higher_ed_enrolment_crore",
    metricLabel: "Higher-Ed enrolment (crore)",
    numericValue: 4.3,
    unit: "crore_students",
    source: "AISHE 2021-22",
    sourceUrl: "https://aishe.gov.in/",
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

  console.log(`Living-standards seed: created=${created}, kept=${kept}, total=${ROWS.length}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
