/**
 * Seed: 16 wildlife-forests IndiaIndicator rows for Section 04 v1.
 *
 * Module slug corrections per Step 8 patch:
 *   forests-wildlife          → wildlife-forests
 *   tiger-conservation        → wildlife-tigers (already has 3 seeded rows)
 *   national-parks-sanctuaries → wildlife-protected-areas
 *
 * Existing wildlife-tigers rows (do NOT re-seed):
 *   tiger_population_total = 3682  (NTCA 2022 census)
 *   tiger_reserves_count   = 58    (NTCA — current expansion; mock had 53)
 *   reserve_area_protected_sqkm = 78735  (Project Tiger)
 *
 * Run: npx tsx prisma/seed-india-wildlife-forests.ts
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
  // ── Forest cover hero metrics (wildlife-forests) ──
  {
    moduleSlug: "wildlife-forests",
    metricKey: "forest_cover_pct",
    metricLabel: "Forest cover (% of geographical area)",
    numericValue: 21.7,
    unit: "percent",
    source: "FSI · ISFR 2023",
    sourceUrl: "https://fsi.nic.in/forest-report-2023",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "wildlife-forests",
    metricKey: "forest_cover_change_2021",
    metricLabel: "Forest cover change since 2021 (sq km)",
    numericValue: 1540,
    unit: "square_km",
    source: "FSI · ISFR 2023",
    sourceUrl: "https://fsi.nic.in/forest-report-2023",
    asOfDate: NOW,
    displayOrder: 2,
  },
  {
    moduleSlug: "wildlife-forests",
    metricKey: "forest_cover_target_pct",
    metricLabel: "Forest cover target (NFP 1988)",
    numericValue: 33,
    unit: "percent",
    source: "National Forest Policy 1988",
    sourceUrl: "https://moef.gov.in/",
    asOfDate: NOW,
    displayOrder: 3,
  },
  {
    moduleSlug: "wildlife-forests",
    metricKey: "forest_cover_lakh_km2",
    metricLabel: "Forest cover (lakh km²)",
    numericValue: 7.15,
    unit: "lakh_km2",
    source: "FSI · ISFR 2023",
    sourceUrl: "https://fsi.nic.in/forest-report-2023",
    asOfDate: NOW,
    displayOrder: 4,
  },
  {
    moduleSlug: "wildlife-forests",
    metricKey: "tree_cover_pct",
    metricLabel: "Tree cover (outside forest, %)",
    numericValue: 2.91,
    unit: "percent",
    source: "FSI · ISFR 2023",
    sourceUrl: "https://fsi.nic.in/forest-report-2023",
    asOfDate: NOW,
    displayOrder: 5,
  },
  {
    moduleSlug: "wildlife-forests",
    metricKey: "top_state_pct",
    metricLabel: "Top state (Madhya Pradesh) — share of national forest cover",
    numericValue: 26.6,
    unit: "percent",
    source: "FSI · ISFR 2023 · MP",
    sourceUrl: "https://fsi.nic.in/forest-report-2023",
    asOfDate: NOW,
    displayOrder: 6,
  },
  {
    moduleSlug: "wildlife-forests",
    metricKey: "isfr_edition",
    metricLabel: "ISFR edition number",
    numericValue: 18,
    unit: "integer",
    source: "FSI · ISFR 2023",
    sourceUrl: "https://fsi.nic.in/forest-report-2023",
    asOfDate: NOW,
    displayOrder: 7,
  },
  {
    moduleSlug: "wildlife-forests",
    metricKey: "isfr_year",
    metricLabel: "ISFR year",
    numericValue: 2023,
    unit: "year",
    source: "FSI · ISFR 2023",
    sourceUrl: "https://fsi.nic.in/forest-report-2023",
    asOfDate: NOW,
    displayOrder: 8,
  },

  // ── Top forest states (5) ──
  {
    moduleSlug: "wildlife-forests",
    metricKey: "top_state_mizoram_pct",
    metricLabel: "Mizoram forest cover (%)",
    numericValue: 84.5,
    unit: "percent",
    source: "FSI · ISFR 2023",
    sourceUrl: "https://fsi.nic.in/forest-report-2023",
    asOfDate: NOW,
    displayOrder: 10,
  },
  {
    moduleSlug: "wildlife-forests",
    metricKey: "top_state_arunachal_pct",
    metricLabel: "Arunachal Pradesh forest cover (%)",
    numericValue: 79.3,
    unit: "percent",
    source: "FSI · ISFR 2023",
    sourceUrl: "https://fsi.nic.in/forest-report-2023",
    asOfDate: NOW,
    displayOrder: 11,
  },
  {
    moduleSlug: "wildlife-forests",
    metricKey: "top_state_meghalaya_pct",
    metricLabel: "Meghalaya forest cover (%)",
    numericValue: 76.0,
    unit: "percent",
    source: "FSI · ISFR 2023",
    sourceUrl: "https://fsi.nic.in/forest-report-2023",
    asOfDate: NOW,
    displayOrder: 12,
  },
  {
    moduleSlug: "wildlife-forests",
    metricKey: "top_state_manipur_pct",
    metricLabel: "Manipur forest cover (%)",
    numericValue: 74.3,
    unit: "percent",
    source: "FSI · ISFR 2023",
    sourceUrl: "https://fsi.nic.in/forest-report-2023",
    asOfDate: NOW,
    displayOrder: 13,
  },
  {
    moduleSlug: "wildlife-forests",
    metricKey: "top_state_nagaland_pct",
    metricLabel: "Nagaland forest cover (%)",
    numericValue: 73.9,
    unit: "percent",
    source: "FSI · ISFR 2023",
    sourceUrl: "https://fsi.nic.in/forest-report-2023",
    asOfDate: NOW,
    displayOrder: 14,
  },

  // ── Biodiversity (elephants, rhinos under wildlife-forests; tigers/reserves
  //    already exist under wildlife-tigers, NOT re-seeded) ──
  {
    moduleSlug: "wildlife-forests",
    metricKey: "elephants_count",
    metricLabel: "Elephant population",
    numericValue: 27312,
    unit: "individuals",
    source: "Project Elephant · MoEFCC 2017 census",
    sourceUrl: "https://moef.gov.in/en/division/forest-divisions-2/project-elephant/",
    asOfDate: NOW,
    displayOrder: 20,
  },
  {
    moduleSlug: "wildlife-forests",
    metricKey: "rhinos_count",
    metricLabel: "Rhino population (Indian one-horned)",
    numericValue: 4014,
    unit: "individuals",
    source: "MoEFCC · Rhino conservation 2022",
    sourceUrl: "https://moef.gov.in/",
    asOfDate: NOW,
    displayOrder: 21,
  },

  // ── National parks & sanctuaries directory headline ──
  {
    moduleSlug: "wildlife-protected-areas",
    metricKey: "parks_count_total",
    metricLabel: "Protected areas total (parks + sanctuaries)",
    numericValue: 1014,
    unit: "parks",
    source: "WII · ENVIS Wildlife Institute",
    sourceUrl: "https://wii.gov.in/",
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

  console.log(`Wildlife-forests seed: created=${created}, kept=${kept}, total=${ROWS.length}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
