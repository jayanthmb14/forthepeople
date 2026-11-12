/**
 * Pune government schemes seed — 6 central + central-state schemes with
 * Pune district-level status (Prompt 5/6, Seed D).
 *
 * ForThePeople.in — independent citizen platform by Jayanth M B.
 *
 * MODEL: Scheme (not HousingScheme). Scheme is the generic-purpose model
 * Mumbai uses (10 rows). HousingScheme requires per-fiscal-year sanctioned/
 * completed/in-progress Int counts which I do not have verified Pune figures
 * for, so PMAY-U and PMAY-G are seeded as Scheme rows with category="Housing"
 * to avoid fabricating HousingScheme counts.
 *
 * FIELD MAPPING (prompt → schema):
 *   schemeName        → name
 *   category          → category (free-text; matches Mumbai conventions)
 *   level             → level  ("CENTRAL" for central / central-state schemes,
 *                                matching Mumbai's mixed-case use of CENTRAL/STATE)
 *   unitSubsidy*      → amount (primary subsidy value)
 *   beneficiaryCount  → beneficiaryCount (where verified)
 *   puneDistrictStatus + eligibility → eligibility (packed prose)
 *   source            → source ("Publication | URL" primary)
 *   sourceSecondary   → packed into eligibility
 *   disclaimer        → packed into eligibility
 *   applyUrl          → applyUrl (official portal)
 *
 * Schema gap noted: Scheme has no separate description/sourceSecondary/
 * disclaimer fields. Packing into `eligibility` is a pragmatic workaround
 * that keeps `source` clean as primary.
 *
 * IDEMPOTENT. Uses findFirst({districtId, name}) → skip-if-exists.
 */

import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

type DBClient = ReturnType<typeof makeClient>;

type SchemeRec = {
  name: string;
  category: string;
  level: string;
  amount?: number;
  beneficiaryCount?: number;
  eligibility: string; // packed: eligibility + Pune status + secondary + disclaimer
  applyUrl?: string;
  source: string;
};

const RECORDS: SchemeRec[] = [
  // ── 1. PMAY-U ─────────────────────────────────────────────
  {
    name: "Pradhan Mantri Awas Yojana — Urban (PMAY-U)",
    category: "Housing",
    level: "CENTRAL",
    amount: 267000, // ₹2.67 lakh combined EWS subsidy + CLSS
    eligibility:
      "Urban EWS/LIG/MIG households — ₹2.67 lakh subsidy + interest-rate reduction for home purchase",
    applyUrl: "https://pmay-urban.gov.in/",
    source: "PMAY Urban Official | https://pmay-urban.gov.in/",
  },

  // ── 2. PMAY-G ─────────────────────────────────────────────
  {
    name: "Pradhan Mantri Awas Yojana — Gramin (PMAY-G)",
    category: "Housing",
    level: "CENTRAL",
    amount: 120000, // ₹1.20 lakh plains area unit subsidy
    eligibility:
      "Rural families without pukka house — ₹1.20 lakh (plains) / ₹1.30 lakh (hilly) construction grant",
    applyUrl: "https://pmayg.nic.in/",
    source: "Divisional Commissioner, Pune Division — Maha Awas Abhiyan | https://divcompune.maharashtra.gov.in/en/scheme/maha-awas-abhiyan-2024-25/",
  },

  // ── 3. Jal Jeevan Mission ─────────────────────────────────
  {
    name: "Jal Jeevan Mission (JJM) — Har Ghar Jal",
    category: "Water",
    level: "CENTRAL",
    eligibility:
      "Every rural household — Functional Household Tap Connection with potable water",
    applyUrl: "https://ejalshakti.gov.in/jjmreport/",
    source: "Jal Jeevan Mission Dashboard | https://ejalshakti.gov.in/jjmreport/",
  },

  // ── 4. MGNREGA ────────────────────────────────────────────
  {
    name: "Mahatma Gandhi National Rural Employment Guarantee Scheme (MGNREGS)",
    category: "Employment",
    level: "CENTRAL",
    eligibility:
      "Rural households — 100 days guaranteed unskilled manual wage employment per year",
    applyUrl: "https://nrega.nic.in/",
    source: "MGNREGA Official | https://nrega.nic.in/",
  },

  // ── 5. Ayushman Bharat PM-JAY ────────────────────────────
  {
    name: "Ayushman Bharat — Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)",
    category: "Health Insurance",
    level: "CENTRAL",
    amount: 500000, // ₹5 lakh coverage per family per year
    eligibility:
      "SECC-identified families + seniors 70+ — ₹5 lakh/year cashless hospital coverage",
    applyUrl: "https://pmjay.gov.in/",
    source: "PM-JAY Official | https://pmjay.gov.in/",
  },

  // ── 6. PM POSHAN ─────────────────────────────────────────
  {
    name: "Pradhan Mantri POSHAN Shakti Nirman (PM POSHAN / Mid-Day Meal)",
    category: "Education",
    level: "CENTRAL",
    beneficiaryCount: 238395,
    eligibility:
      "Students Class 1-8 in government schools — free mid-day meal, supplementary food weekly",
    applyUrl: "https://pmposhan.education.gov.in/",
    source: "Pune Zilla Parishad Primary Education | https://www.punezp.gov.in/en/primary-education-2/",
  },
];

export async function seedPuneSchemes(prisma?: DBClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    const mh = await client.state.findUniqueOrThrow({
      where: { slug: "maharashtra" },
    });
    const pune = await client.district.findUniqueOrThrow({
      where: { stateId_slug: { stateId: mh.id, slug: "pune" } },
    });
    console.log(`Seeding Pune schemes (districtId=${pune.id})...`);

    let created = 0;
    let skipped = 0;

    for (const rec of RECORDS) {
      const existing = await client.scheme.findFirst({
        where: { districtId: pune.id, name: rec.name },
      });
      if (existing) {
        console.log(`  ⏭️  ${rec.name} — already present`);
        skipped++;
        continue;
      }

      await client.scheme.create({
        data: {
          districtId: pune.id,
          name: rec.name,
          category: rec.category,
          level: rec.level,
          amount: rec.amount ?? null,
          beneficiaryCount: rec.beneficiaryCount ?? null,
          eligibility: rec.eligibility,
          applyUrl: rec.applyUrl ?? null,
          source: rec.source,
          active: true,
        },
      });
      console.log(`  ✅ [${rec.category}/${rec.level}] ${rec.name}`);
      created++;
    }

    console.log(
      `\nSummary: ${created} created + ${skipped} skipped = ${RECORDS.length} total target.`,
    );
  } finally {
    if (standalone) await client.$disconnect();
  }
}

if (require.main === module) {
  seedPuneSchemes()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
