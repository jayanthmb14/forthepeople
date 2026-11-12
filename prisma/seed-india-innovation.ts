/**
 * Seed: 19 innovation IndiaIndicator rows for Section 09 v1.
 *
 * Featured = science-startups (live, displayOrder 1) — the
 * Startups & Unicorns module. Top Startup Hubs anchored under
 * science-startups; Digital Stack split between science-digital
 * (UPI/Aadhaar/DigiLocker/FASTag) + science-isro (satellites).
 * Same fallback pattern as earlier sections.
 *
 * Run: npx tsx prisma/seed-india-innovation.ts
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
const STARTUP_INDIA = "https://www.startupindia.gov.in/";
const NPCI = "https://www.npci.org.in/";
const UIDAI = "https://uidai.gov.in/";
const DIGILOCKER = "https://www.digilocker.gov.in/";
const NETC = "https://www.netc.org.in/";
const ISRO = "https://www.isro.gov.in/";

const ROWS: SeedRow[] = [
  // ── Featured DPIIT Startups (under science-startups) ──
  {
    moduleSlug: "science-startups",
    metricKey: "dpiit_recognised_lakh",
    metricLabel: "DPIIT-recognised startups (lakh)",
    numericValue: 1.4,
    unit: "lakh",
    source: "DPIIT · Startup India dashboard",
    sourceUrl: STARTUP_INDIA,
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "science-startups",
    metricKey: "unicorns_count",
    metricLabel: "Unicorns count",
    numericValue: 110,
    unit: "unicorns",
    source: "DPIIT · Unicorn list",
    sourceUrl: STARTUP_INDIA,
    asOfDate: NOW,
    displayOrder: 2,
  },
  {
    moduleSlug: "science-startups",
    metricKey: "change_yoy_lakh",
    metricLabel: "Startups YoY change (lakh)",
    numericValue: 0.3,
    unit: "lakh",
    source: "DPIIT prior-year delta",
    sourceUrl: STARTUP_INDIA,
    asOfDate: NOW,
    displayOrder: 3,
  },
  {
    moduleSlug: "science-startups",
    metricKey: "data_year",
    metricLabel: "DPIIT dataset year",
    numericValue: 2024,
    unit: "year",
    source: "DPIIT",
    sourceUrl: STARTUP_INDIA,
    asOfDate: NOW,
    displayOrder: 4,
  },

  // ── Top Startup Hubs (5 rows under science-startups) ──
  {
    moduleSlug: "science-startups",
    metricKey: "top_state_ka_startups_thousand",
    metricLabel: "Top state · Karnataka startups (k)",
    numericValue: 18,
    unit: "thousand",
    source: "DPIIT · Karnataka",
    sourceUrl: STARTUP_INDIA,
    asOfDate: NOW,
    displayOrder: 10,
  },
  {
    moduleSlug: "science-startups",
    metricKey: "top_state_mh_startups_thousand",
    metricLabel: "Top state · Maharashtra startups (k)",
    numericValue: 15,
    unit: "thousand",
    source: "DPIIT · Maharashtra",
    sourceUrl: STARTUP_INDIA,
    asOfDate: NOW,
    displayOrder: 11,
  },
  {
    moduleSlug: "science-startups",
    metricKey: "top_state_dl_startups_thousand",
    metricLabel: "Top state · Delhi NCR startups (k)",
    numericValue: 13,
    unit: "thousand",
    source: "DPIIT · Delhi",
    sourceUrl: STARTUP_INDIA,
    asOfDate: NOW,
    displayOrder: 12,
  },
  {
    moduleSlug: "science-startups",
    metricKey: "top_state_tn_startups_thousand",
    metricLabel: "Top state · Tamil Nadu startups (k)",
    numericValue: 9,
    unit: "thousand",
    source: "DPIIT · Tamil Nadu",
    sourceUrl: STARTUP_INDIA,
    asOfDate: NOW,
    displayOrder: 13,
  },
  {
    moduleSlug: "science-startups",
    metricKey: "top_state_tg_startups_thousand",
    metricLabel: "Top state · Telangana startups (k)",
    numericValue: 7,
    unit: "thousand",
    source: "DPIIT · Telangana",
    sourceUrl: STARTUP_INDIA,
    asOfDate: NOW,
    displayOrder: 14,
  },

  // ── Digital Stack (5 rows split across science-digital + science-isro) ──
  {
    moduleSlug: "science-digital",
    metricKey: "upi_txn_per_month_billion",
    metricLabel: "UPI transactions per month (billion)",
    numericValue: 14,
    unit: "billion_per_month",
    source: "NPCI",
    sourceUrl: NPCI,
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "science-digital",
    metricKey: "aadhaar_enrolled_crore",
    metricLabel: "Aadhaar enrolled (crore)",
    numericValue: 140,
    unit: "crore",
    source: "UIDAI",
    sourceUrl: UIDAI,
    asOfDate: NOW,
    displayOrder: 2,
  },
  {
    moduleSlug: "science-digital",
    metricKey: "digilocker_users_crore",
    metricLabel: "DigiLocker users (crore)",
    numericValue: 25,
    unit: "crore",
    source: "DigiLocker",
    sourceUrl: DIGILOCKER,
    asOfDate: NOW,
    displayOrder: 3,
  },
  {
    moduleSlug: "science-digital",
    metricKey: "fastag_active_crore",
    metricLabel: "FASTag active (crore)",
    numericValue: 8,
    unit: "crore",
    source: "NETC · NPCI",
    sourceUrl: NETC,
    asOfDate: NOW,
    displayOrder: 4,
  },
  {
    moduleSlug: "science-isro",
    metricKey: "satellites_launched_count",
    metricLabel: "ISRO satellites launched",
    numericValue: 120,
    unit: "satellites",
    source: "ISRO mission catalogue",
    sourceUrl: ISRO,
    asOfDate: NOW,
    displayOrder: 1,
  },

  // ── Directory headlines for non-featured modules ──
  {
    moduleSlug: "science-rd",
    metricKey: "rd_pct_gdp",
    metricLabel: "R&D spend (% of GDP)",
    numericValue: 0.65,
    unit: "percent",
    source: "DST · India R&D Statistics",
    sourceUrl: "https://dst.gov.in/",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "trade-overview",
    metricKey: "exports_annual_lakh_cr",
    metricLabel: "Annual merchandise exports (₹ lakh cr)",
    numericValue: 37,
    unit: "lakh_cr",
    source: "DGCI&S · Foreign Trade Statistics",
    sourceUrl: "https://dgciskol.gov.in/",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "trade-fdi",
    metricKey: "fdi_equity_inflow_billion_usd",
    metricLabel: "Annual FDI equity inflow ($ bn)",
    numericValue: 70,
    unit: "billion_usd",
    source: "DPIIT · FDI Statistics",
    sourceUrl: "https://dpiit.gov.in/",
    asOfDate: NOW,
    displayOrder: 1,
  },
  {
    moduleSlug: "trade-diaspora",
    metricKey: "remittances_annual_billion_usd",
    metricLabel: "Annual remittances ($ bn)",
    numericValue: 125,
    unit: "billion_usd",
    source: "World Bank Migration & Development",
    sourceUrl: "https://www.worldbank.org/migration",
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
  console.log(`Innovation seed: created=${created}, kept=${kept}, total=${ROWS.length}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
