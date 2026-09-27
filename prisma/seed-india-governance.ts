/**
 * Seed: 14 governance IndiaIndicator rows for Section 08 v1.
 *
 * Featured = justice-police (only one of 3 live modules with a
 * citizen-facing ratio metric). Defence-budget + defence-exports
 * are used in the 4-cell + DEFENCE_AND_ELECTIONS card to give all
 * 3 sub-pillars (justice / defence / elections) representation.
 *
 * Most card values come from coming_soon modules (justice-pendency,
 * justice-crime, justice-prisons, elections-turnout) — same fallback
 * pattern as Step 8's PMKVY and Step 9's PMFBY: values seeded under
 * existing module slugs, no registry edits.
 *
 * Run: npx tsx prisma/seed-india-governance.ts
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
const BPRD = "https://bprd.nic.in/";
const NCRB_CRIME = "https://ncrb.gov.in/crime-in-india";
const NCRB_PRISONS = "https://ncrb.gov.in/prison-statistics-india";
const NJDG = "https://njdg.ecourts.gov.in/";
const MOD = "https://www.mod.gov.in/";
const DDPMOD = "https://ddpmod.gov.in/";

const ROWS: SeedRow[] = [
  // ── Featured Police Strength (under justice-police) ──
  {
    moduleSlug: "justice-police",
    metricKey: "civil_police_total_lakh",
    metricLabel: "Civil police strength (lakh)",
    numericValue: 21,
    unit: "lakh",
    source: "BPRD · Data on Police Organizations",
    sourceUrl: BPRD,
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "justice-police",
    metricKey: "police_per_lakh_population",
    metricLabel: "Police per lakh population",
    numericValue: 152,
    unit: "per_lakh",
    source: "BPRD · sanctioned strength",
    sourceUrl: BPRD,
    asOfDate: NOW,
    displayOrder: 2,
  },
  {
    moduleSlug: "justice-police",
    metricKey: "un_target_per_lakh",
    metricLabel: "UN target per lakh",
    numericValue: 222,
    unit: "per_lakh",
    source: "UN Office on Drugs & Crime (UNODC)",
    sourceUrl: "https://www.unodc.org/",
    asOfDate: NOW,
    displayOrder: 3,
  },
  {
    moduleSlug: "justice-police",
    metricKey: "change_yoy_lakh",
    metricLabel: "YoY change (lakh)",
    numericValue: 0.4,
    unit: "lakh",
    source: "BPRD prior-year delta",
    sourceUrl: BPRD,
    asOfDate: NOW,
    displayOrder: 4,
  },

  // ── Justice System card data ──
  {
    moduleSlug: "justice-pendency",
    metricKey: "total_pending_crore_cases",
    metricLabel: "Total pending cases (crore)",
    numericValue: 5,
    unit: "crore",
    source: "National Judicial Data Grid (NJDG)",
    sourceUrl: NJDG,
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "justice-prisons",
    metricKey: "prison_population_lakh",
    metricLabel: "Prison population (lakh)",
    numericValue: 5.7,
    unit: "lakh",
    source: "Prison Statistics India · NCRB",
    sourceUrl: NCRB_PRISONS,
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "justice-crime",
    metricKey: "ipc_cases_per_year_lakh",
    metricLabel: "IPC cases per year (lakh)",
    numericValue: 36,
    unit: "lakh_per_year",
    source: "Crime in India · NCRB",
    sourceUrl: NCRB_CRIME,
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "justice-crime",
    metricKey: "conviction_rate_pct",
    metricLabel: "Conviction rate (%)",
    numericValue: 57,
    unit: "percent",
    source: "Crime in India · NCRB",
    sourceUrl: NCRB_CRIME,
    asOfDate: NOW,
    displayOrder: 2,
  },

  // ── Defence & Elections card data ──
  {
    moduleSlug: "defence-budget",
    metricKey: "defence_allocation_lakh_cr",
    metricLabel: "Defence allocation (₹ lakh cr)",
    numericValue: 6.2,
    unit: "lakh_cr",
    source: "MoD · Union Budget",
    sourceUrl: MOD,
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "defence-exports",
    metricKey: "defence_exports_thousand_cr",
    metricLabel: "Defence exports (₹ thousand cr)",
    numericValue: 21,
    unit: "thousand_cr",
    source: "DDPMoD · Defence Production",
    sourceUrl: DDPMOD,
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "elections-loksabha",
    metricKey: "loksabha_seats_total",
    metricLabel: "Lok Sabha seats",
    numericValue: 543,
    unit: "seats",
    // Article 81 only caps the House at 550; 543 comes from the Delimitation
    // Order 2008 (Sept 2026 audit). Cite the Secretariat, as know-india does.
    source: "Lok Sabha Secretariat",
    sourceUrl: "https://sansad.in/ls/",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "elections-turnout",
    metricKey: "ge_2024_turnout_pct",
    metricLabel: "General Election 2024 turnout (%)",
    numericValue: 65.8,
    unit: "percent",
    source: "ECI · 2024 General Election",
    sourceUrl: "https://results.eci.gov.in/",
    asOfDate: NOW,
    displayOrder: 1,
  },

  // ── Directory headlines for the 2 remaining non-featured modules ──
  {
    moduleSlug: "elections-rajyasabha",
    metricKey: "rajyasabha_seats_total",
    metricLabel: "Rajya Sabha seats",
    numericValue: 245,
    unit: "seats",
    // 233 elected (Fourth Schedule) + 12 nominated; Article 80 caps it at 250.
    source: "Rajya Sabha Secretariat",
    sourceUrl: "https://sansad.in/rs/",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "defence-dpsu",
    metricKey: "dpsu_count",
    metricLabel: "DPSU count",
    numericValue: 9,
    unit: "entities",
    source: "DDPMoD · Defence PSU list",
    sourceUrl: DDPMOD,
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
  console.log(`Governance seed: created=${created}, kept=${kept}, total=${ROWS.length}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
