/**
 * Seed: 17 infrastructure IndiaIndicator rows for Section 07 v1.
 *
 * Featured = infra-roads (live, displayOrder 1). Top Highway States
 * + Flagship Projects right cards anchored under infra-roads since
 * none of Bharatmala / Sagarmala / UDAN / GatiShakti have their own
 * modules. Same fallback pattern as Step 8's PMKVY / Step 9's PMFBY.
 *
 * Module-slug map: roads → infra-roads, railways → infra-railways,
 * aviation → infra-aviation, ports → infra-ports, smart cities →
 * infra-smart-cities, telecom → infra-telecom.
 *
 * Run: npx tsx prisma/seed-india-infrastructure.ts
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
const MORTH = "https://morth.nic.in/road-transport-overview";
const MORTH_BASE = "https://morth.nic.in/";
const NHAI = "https://nhai.gov.in/";

const ROWS: SeedRow[] = [
  // ── Featured Roads & Highways ──
  {
    moduleSlug: "infra-roads",
    metricKey: "nh_length_km",
    metricLabel: "National Highway length (km)",
    numericValue: 146145,
    unit: "km",
    source: "MoRTH · Basic Road Statistics",
    sourceUrl: MORTH,
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "infra-roads",
    metricKey: "nh_target_km_2027",
    metricLabel: "NH target by 2027 (Bharatmala)",
    numericValue: 200000,
    unit: "km",
    source: "Bharatmala Pariyojana",
    sourceUrl: "https://morth.nic.in/bharatmala-pariyojana",
    asOfDate: NOW,
    displayOrder: 2,
  },
  {
    moduleSlug: "infra-roads",
    metricKey: "nh_change_yoy_km",
    metricLabel: "NH length change YoY (km)",
    numericValue: 5200,
    unit: "km",
    source: "MoRTH FY25 added",
    sourceUrl: MORTH,
    asOfDate: NOW,
    displayOrder: 3,
  },
  {
    moduleSlug: "infra-roads",
    metricKey: "expressway_km",
    metricLabel: "Expressway length (km)",
    numericValue: 6000,
    unit: "km",
    source: "NHAI · Expressways",
    sourceUrl: NHAI,
    asOfDate: NOW,
    displayOrder: 4,
  },
  {
    moduleSlug: "infra-roads",
    metricKey: "data_year",
    metricLabel: "MoRTH data year",
    numericValue: 2024,
    unit: "year",
    source: "MoRTH",
    sourceUrl: MORTH_BASE,
    asOfDate: NOW,
    displayOrder: 5,
  },

  // ── Top Highway States (5) ──
  {
    moduleSlug: "infra-roads",
    metricKey: "top_state_mh_nh_km",
    metricLabel: "Top state · Maharashtra NH (km)",
    numericValue: 18000,
    unit: "km",
    source: "MoRTH · Maharashtra",
    sourceUrl: MORTH_BASE,
    asOfDate: NOW,
    displayOrder: 10,
  },
  {
    moduleSlug: "infra-roads",
    metricKey: "top_state_up_nh_km",
    metricLabel: "Top state · Uttar Pradesh NH (km)",
    numericValue: 12000,
    unit: "km",
    source: "MoRTH · UP",
    sourceUrl: MORTH_BASE,
    asOfDate: NOW,
    displayOrder: 11,
  },
  {
    moduleSlug: "infra-roads",
    metricKey: "top_state_rj_nh_km",
    metricLabel: "Top state · Rajasthan NH (km)",
    numericValue: 10000,
    unit: "km",
    source: "MoRTH · Rajasthan",
    sourceUrl: MORTH_BASE,
    asOfDate: NOW,
    displayOrder: 12,
  },
  {
    moduleSlug: "infra-roads",
    metricKey: "top_state_mp_nh_km",
    metricLabel: "Top state · Madhya Pradesh NH (km)",
    numericValue: 9000,
    unit: "km",
    source: "MoRTH · MP",
    sourceUrl: MORTH_BASE,
    asOfDate: NOW,
    displayOrder: 13,
  },
  {
    moduleSlug: "infra-roads",
    metricKey: "top_state_ka_nh_km",
    metricLabel: "Top state · Karnataka NH (km)",
    numericValue: 7000,
    unit: "km",
    source: "MoRTH · Karnataka",
    sourceUrl: MORTH_BASE,
    asOfDate: NOW,
    displayOrder: 14,
  },

  // ── Flagship Projects (4) ──
  {
    moduleSlug: "infra-roads",
    metricKey: "bharatmala_nh_km",
    metricLabel: "Bharatmala NH (km)",
    numericValue: 65000,
    unit: "km",
    source: "Bharatmala dashboard",
    sourceUrl: "https://morth.nic.in/bharatmala-pariyojana",
    asOfDate: NOW,
    displayOrder: 20,
  },
  {
    moduleSlug: "infra-roads",
    metricKey: "sagarmala_ports_count",
    metricLabel: "Sagarmala major ports",
    numericValue: 12,
    unit: "ports",
    source: "Sagarmala · Ministry of Ports",
    sourceUrl: "https://sagarmala.gov.in/",
    asOfDate: NOW,
    displayOrder: 21,
  },
  {
    moduleSlug: "infra-roads",
    metricKey: "udan_airports_count",
    metricLabel: "UDAN airports",
    numericValue: 85,
    unit: "airports",
    source: "UDAN dashboard",
    sourceUrl: "https://www.civilaviation.gov.in/en/udan-rcs",
    asOfDate: NOW,
    displayOrder: 22,
  },
  {
    moduleSlug: "infra-roads",
    metricKey: "gatishakti_projects_count",
    metricLabel: "GatiShakti projects",
    numericValue: 200,
    unit: "projects",
    source: "PM GatiShakti dashboard",
    sourceUrl: "https://www.pmgatishakti.gov.in/",
    asOfDate: NOW,
    displayOrder: 23,
  },

  // ── Directory headlines for non-featured modules ──
  {
    moduleSlug: "infra-railways",
    metricKey: "route_km",
    metricLabel: "Indian Railways route length (km)",
    numericValue: 68000,
    unit: "km",
    source: "Indian Railways",
    sourceUrl: "https://indianrailways.gov.in/",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "infra-aviation",
    metricKey: "airports_operational_count",
    metricLabel: "Operational airports",
    numericValue: 150,
    unit: "airports",
    source: "AAI",
    sourceUrl: "https://aai.aero/",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "infra-ports",
    metricKey: "major_ports_count",
    metricLabel: "Major ports",
    numericValue: 12,
    unit: "ports",
    source: "Ministry of Ports",
    sourceUrl: "https://shipmin.gov.in/",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "infra-smart-cities",
    metricKey: "cities_count",
    metricLabel: "Smart Cities Mission cities",
    numericValue: 100,
    unit: "cities",
    source: "Smart Cities Mission",
    sourceUrl: "https://smartcities.gov.in/",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "infra-telecom",
    metricKey: "subscribers_crore",
    // TRAI's headline total counts wireless AND wireline (Sept 2026 audit).
    metricLabel: "Telephone subscribers, wireless + wireline (crore)",
    numericValue: 117,
    unit: "crore",
    source: "TRAI",
    sourceUrl: "https://www.trai.gov.in/",
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
  console.log(`Infrastructure seed: created=${created}, kept=${kept}, total=${ROWS.length}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
