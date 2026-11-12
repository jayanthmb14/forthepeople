/**
 * Seed: natural-resources-energy IndiaIndicator rows for Section 06 v1.
 *
 * After commit 0 of Step 9 (revised), NRE has 4 modules:
 *   energy-power (live, featured)
 *   energy-renewables (live)
 *   energy-coal (coming_soon)
 *   energy-fuels (coming_soon)
 *
 * Featured = Power Generation. Headline 460 GW installed capacity,
 * +27 GW YoY, RE target 500 GW by 2030 (NDC). 4 cells show coal/RE/
 * hydro/nuclear capacity in GW with mix-percentage sub-stats. Right
 * column has TOP POWER STATES (5 entries) + ENERGY MIX (4 entries:
 * Coal/RE/Hydro/Nuclear share %).
 *
 * Run: npx tsx prisma/seed-india-natural-resources-energy.ts
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
const CEA = "https://cea.nic.in/installed-capacity-report/";
const CEA_BASE = "https://cea.nic.in/";
const MNRE = "https://mnre.gov.in/";
const DAE = "https://dae.gov.in/";

const ROWS: SeedRow[] = [
  // ── Power Generation (featured) ──
  {
    moduleSlug: "energy-power",
    metricKey: "installed_capacity_gw",
    metricLabel: "Total installed capacity (GW)",
    numericValue: 460,
    unit: "gigawatts",
    source: "CEA · Installed Capacity Report",
    sourceUrl: CEA,
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "energy-power",
    metricKey: "capacity_change_yoy_gw",
    metricLabel: "Installed capacity YoY change (GW)",
    numericValue: 27,
    unit: "gigawatts",
    source: "CEA prior-year delta",
    sourceUrl: CEA,
    asOfDate: NOW,
    displayOrder: 2,
  },
  {
    moduleSlug: "energy-power",
    metricKey: "re_target_gw_2030",
    metricLabel: "Renewable energy target by 2030 (GW)",
    numericValue: 500,
    unit: "gigawatts",
    source: "India NDC · 2030",
    sourceUrl: "https://moef.gov.in/",
    asOfDate: NOW,
    displayOrder: 3,
  },
  {
    moduleSlug: "energy-power",
    metricKey: "coal_capacity_gw",
    metricLabel: "Coal capacity (GW)",
    numericValue: 217,
    unit: "gigawatts",
    source: "CEA",
    sourceUrl: CEA_BASE,
    asOfDate: NOW,
    displayOrder: 4,
  },
  {
    moduleSlug: "energy-power",
    metricKey: "renewables_capacity_gw",
    metricLabel: "Renewables capacity (GW)",
    numericValue: 180,
    unit: "gigawatts",
    source: "CEA · MNRE",
    sourceUrl: MNRE,
    asOfDate: NOW,
    displayOrder: 5,
  },
  {
    moduleSlug: "energy-power",
    metricKey: "hydro_capacity_gw",
    metricLabel: "Hydro capacity (GW)",
    numericValue: 47,
    unit: "gigawatts",
    source: "CEA",
    sourceUrl: CEA_BASE,
    asOfDate: NOW,
    displayOrder: 6,
  },
  {
    moduleSlug: "energy-power",
    metricKey: "nuclear_capacity_gw",
    metricLabel: "Nuclear capacity (GW)",
    numericValue: 7.5,
    unit: "gigawatts",
    source: "CEA · DAE",
    sourceUrl: DAE,
    asOfDate: NOW,
    displayOrder: 7,
  },

  // ── Energy mix percentages ──
  {
    moduleSlug: "energy-power",
    metricKey: "mix_pct_coal",
    metricLabel: "Energy mix · Coal share (%)",
    numericValue: 47,
    unit: "percent",
    source: "CEA",
    sourceUrl: CEA_BASE,
    asOfDate: NOW,
    displayOrder: 8,
  },
  {
    moduleSlug: "energy-power",
    metricKey: "mix_pct_renewables",
    metricLabel: "Energy mix · Renewables share (%)",
    numericValue: 39,
    unit: "percent",
    source: "CEA · MNRE",
    sourceUrl: MNRE,
    asOfDate: NOW,
    displayOrder: 9,
  },
  {
    moduleSlug: "energy-power",
    metricKey: "mix_pct_hydro",
    metricLabel: "Energy mix · Hydro share (%)",
    numericValue: 10,
    unit: "percent",
    source: "CEA",
    sourceUrl: CEA_BASE,
    asOfDate: NOW,
    displayOrder: 10,
  },
  {
    moduleSlug: "energy-power",
    metricKey: "mix_pct_nuclear",
    metricLabel: "Energy mix · Nuclear share (%)",
    numericValue: 1.6,
    unit: "percent",
    source: "CEA · DAE",
    sourceUrl: DAE,
    asOfDate: NOW,
    displayOrder: 11,
  },

  // ── Top power states (5 by installed capacity) ──
  {
    moduleSlug: "energy-power",
    metricKey: "top_state_mh_capacity_gw",
    metricLabel: "Top state · Maharashtra capacity (GW)",
    numericValue: 45,
    unit: "gigawatts",
    source: "CEA · Maharashtra",
    sourceUrl: CEA_BASE,
    asOfDate: NOW,
    displayOrder: 20,
  },
  {
    moduleSlug: "energy-power",
    metricKey: "top_state_gj_capacity_gw",
    metricLabel: "Top state · Gujarat capacity (GW)",
    numericValue: 42,
    unit: "gigawatts",
    source: "CEA · Gujarat",
    sourceUrl: CEA_BASE,
    asOfDate: NOW,
    displayOrder: 21,
  },
  {
    moduleSlug: "energy-power",
    metricKey: "top_state_tn_capacity_gw",
    metricLabel: "Top state · Tamil Nadu capacity (GW)",
    numericValue: 37,
    unit: "gigawatts",
    source: "CEA · Tamil Nadu",
    sourceUrl: CEA_BASE,
    asOfDate: NOW,
    displayOrder: 22,
  },
  {
    moduleSlug: "energy-power",
    metricKey: "top_state_rj_capacity_gw",
    metricLabel: "Top state · Rajasthan capacity (GW)",
    numericValue: 33,
    unit: "gigawatts",
    source: "CEA · Rajasthan",
    sourceUrl: CEA_BASE,
    asOfDate: NOW,
    displayOrder: 23,
  },
  {
    moduleSlug: "energy-power",
    metricKey: "top_state_kn_capacity_gw",
    metricLabel: "Top state · Karnataka capacity (GW)",
    numericValue: 31,
    unit: "gigawatts",
    source: "CEA · Karnataka",
    sourceUrl: CEA_BASE,
    asOfDate: NOW,
    displayOrder: 24,
  },

  // ── Directory headlines for non-featured modules ──
  {
    moduleSlug: "energy-renewables",
    metricKey: "renewable_installed_gw",
    metricLabel: "RE installed capacity (GW)",
    numericValue: 180,
    unit: "gigawatts",
    source: "MNRE",
    sourceUrl: MNRE,
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "energy-coal",
    metricKey: "coal_production_million_tonnes",
    metricLabel: "Coal production (MT)",
    numericValue: 990,
    unit: "million_tonnes",
    source: "Coal India · MoCoal",
    sourceUrl: "https://coal.nic.in/",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "energy-fuels",
    metricKey: "crude_imports_million_tonnes",
    metricLabel: "Annual crude imports (MT)",
    numericValue: 232,
    unit: "million_tonnes",
    source: "MoPNG · PPAC",
    sourceUrl: "https://ppac.gov.in/",
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
  console.log(`Natural-resources-energy seed: created=${created}, kept=${kept}, total=${ROWS.length}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
