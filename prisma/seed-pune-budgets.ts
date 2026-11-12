/**
 * Pune budgets seed — 5 verified records (Prompt 3/6, Seed B — money).
 *
 * ForThePeople.in — independent citizen platform by Jayanth M B.
 *
 * MODEL: BudgetAllocation (richer than BudgetEntry — has remarks/sourceUrl/
 * department/lapsed/quarter). Mumbai currently uses BudgetEntry (10 rows,
 * sector-based). This seed diverges because Mumbai's pattern (sector
 * line-items) doesn't fit the prompt's "body-level annual budget"
 * records with presenter / approval / highlights / disclaimer. The richer
 * schema fits cleanly. Flagged for reconciliation.
 *
 * FIELD MAPPING (prompt → schema):
 *   budgetBody        → department      (e.g., "Pune Municipal Corporation")
 *   fiscalYear        → fiscalYear
 *   amount            → allocated
 *   status            → category        ("Annual Budget (Previous Year)" /
 *                                        "Annual Budget (Current Year)")
 *   presentedBy/On    → packed into remarks
 *   highlights/desc   → packed into remarks
 *   sourceSecondary   → packed into remarks (schema has only 1 sourceUrl)
 *   disclaimer        → packed into remarks
 *
 * All amounts in RUPEES (not crore). All 5 records have primary source +
 * sourceUrl + packed secondary + disclaimer in remarks.
 *
 * IDEMPOTENT. Uses findFirst({districtId, fiscalYear, department, category})
 * → skip-if-exists because BudgetAllocation has no unique constraint.
 */

import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

type DBClient = ReturnType<typeof makeClient>;

type BudgetRec = {
  fiscalYear: string;
  department: string;
  category: string;
  allocated: number;
  released: number;
  spent: number;
  lapsed: number;
  source: string;
  sourceUrl: string;
  remarks: string;
};

const RECORDS: BudgetRec[] = [
  // ── Record 1 — PMC Budget FY 2025-26 (previous year) ──────
  {
    fiscalYear: "2025-26",
    department: "Pune Municipal Corporation",
    category: "Annual Budget (Previous Year)",
    allocated: 126180000000, // ₹12,618 crore
    released: 0,
    spent: 0,
    lapsed: 0,
    source: "Lokmat Times",
    sourceUrl:
      "https://www.lokmattimes.com/pune/pmc-budget-2025-26-rs-12618-crore-allocated-for-infrastructure-healthcare-and-cleanliness-no-tax-hike-for-pune-residents-a510/",
    remarks: [
      "Presented by Dr. Rajendra Bhosale, Municipal Commissioner & Administrator, on 2025-03-04.",
      "Highlights: ₹623 cr for 32 newly included villages; ₹1,200 cr for 33 missing link roads (15 high-traffic + 17 additional); no property tax hike.",
      "Actual revenue collection by January 2026: ₹7,701 crore (61% of budgeted). Reported shortfall due to real estate slowdown + election code-of-conduct restrictions. Figures per PMC mid-year review.",
      "Secondary source: The Bridge Chronicle | https://www.thebridgechronicle.com/pune/pune-budget-2026-27-13995-crore-roads-water-infrastructure-merged-villages-agn97",
      "Disclaimer: Figures as presented by PMC Commissioner to the Standing Committee. Mid-year collection figures indicative and subject to quarterly revision by PMC's Finance Department.",
    ].join("\n\n"),
  },

  // ── Record 2 — PMC Budget FY 2026-27 (current year) ───────
  {
    fiscalYear: "2026-27",
    department: "Pune Municipal Corporation",
    category: "Annual Budget (Current Year)",
    allocated: 139950000000, // ₹13,995 crore
    released: 0,
    spent: 0,
    lapsed: 0,
    source: "The Bridge Chronicle",
    sourceUrl:
      "https://www.thebridgechronicle.com/pune/pune-budget-2026-27-13995-crore-roads-water-infrastructure-merged-villages-agn97",
    remarks: [
      "Presented by Naval Kishore Ram, Municipal Commissioner, on 2026-03-10.",
      "Highlights: ₹1,377 cr increase over FY 2025-26; ₹842.85 cr AMRUT 2.0 sewer infrastructure in 23 merged villages; ₹323.76 cr sewer management in merged villages; ~100 km new sewer lines; 4,725 houses under PMAY in Hadapsar and Wadgaon; Mundhwa Chowk flyover + Shivane-Nanded City river bridge planned; structural audit of 99 bridges, flyovers, subways. Revenue mix: GST 27%, property tax 24%, development charges 24%.",
      "Secondary source: PMC Official Budget Portal | https://www.pmc.gov.in/en/b/budget-2025-2026",
      "Disclaimer: Budget as presented to Standing Committee March 10, 2026. Final approved figures may vary. For authoritative detail, refer to PMC budget publications.",
    ].join("\n\n"),
  },

  // ── Record 3 — PCMC Budget FY 2025-26 (previous year) ─────
  {
    fiscalYear: "2025-26",
    department: "Pimpri-Chinchwad Municipal Corporation",
    category: "Annual Budget (Previous Year)",
    allocated: 96752700000, // ₹9,675.27 crore
    released: 0,
    spent: 0,
    lapsed: 0,
    source: "Punekar News",
    sourceUrl:
      "https://www.punekarnews.in/pune-pcmc-presents-rs-9675-27-crore-budget-for-2025-26-with-no-hike-in-property-or-water-tax-focus-on-development-and-welfare/",
    remarks: [
      "Presented by Shekhar Singh, Municipal Commissioner, on 2025-02-20.",
      "Highlights: ₹1,962.72 cr development projects; ₹1,898 cr BSUP (Basic Services to Urban Poor); ₹753.56 cr special construction schemes; ₹417 cr PMPML public transport; ₹300 cr water supply; ₹83 cr Gender Budget; ₹62.09 cr schemes for persons with disabilities; ₹136.52 cr operation of 8 ward offices; ₹200 cr green bond raised (Harit Setu financing); no property tax or water tax hike.",
      "Secondary source: PCMC Official | https://www.pcmcindia.gov.in",
      "Disclaimer: Figures as presented by PCMC Commissioner to the Standing Committee February 20, 2025.",
    ].join("\n\n"),
  },

  // ── Record 4 — PCMC Budget FY 2026-27 (current year) ──────
  {
    fiscalYear: "2026-27",
    department: "Pimpri-Chinchwad Municipal Corporation",
    category: "Annual Budget (Current Year)",
    allocated: 56557300000, // ₹5,655.73 crore core (total with Central+State: ₹9,322.17 cr — see remarks)
    released: 0,
    spent: 0,
    lapsed: 0,
    source: "Pune Pulse",
    sourceUrl:
      "https://www.mypunepulse.com/pcmc-presents-%E2%82%B95660-crore-budget-for-2026-27-focus-on-infrastructure-social-welfare-and-sustainable-development/",
    remarks: [
      "Presented by Shravan Hardikar, outgoing Municipal Commissioner, on 2026-02-28. Commissioner replaced by Dr. Vijay Suryawanshi on 2026-03-11. Approved by PCMC General Body on 2026-03-24 with Mayor Ravi Landge presiding.",
      "Core allocation: ₹5,655.73 crore. Total including Central + State schemes: ₹9,322.17 crore.",
      "Highlights: ₹1,300 cr ongoing projects; ₹200 cr new initiatives; ₹100 cr parallel water pipeline Pavana Dam → Nigdi (₹40 cr in current year); fixed deposits held ₹5,690 cr (₹1,455 cr general + ₹4,235 cr reserved); outstanding debt ₹559.11 cr (₹200 cr green bonds + ₹200 cr municipal bonds + ₹159.11 cr World Bank loan); budget SMALLER than FY 2025-26 by ₹353 cr — described as 'polishing existing' phase; first-time ₹10 lakh/corporator fund; ₹414.22 cr + 1,100 new works added by Standing Committee during approval; no property tax or water tax hike.",
      "Secondary source: Lokmat Times | https://www.lokmattimes.com/pune/pimpri-chinchwad-civic-body-approves-rs9322-crore-budget-major-push-for-water-roads-and-urban-projects-a525/",
      "Disclaimer: Budget as presented by outgoing Commissioner Shravan Hardikar February 28, 2026 and approved by PCMC General Body March 24, 2026. For authoritative detail, refer to PCMC publications.",
    ].join("\n\n"),
  },

  // ── Record 5 — Pune ZP Budget FY 2025-26 ──────────────────
  {
    fiscalYear: "2025-26",
    department: "Pune Zilla Parishad",
    category: "Annual Budget (Current Year)",
    allocated: 2920000000, // ₹292 crore
    released: 0,
    spent: 0,
    lapsed: 0,
    source: "Saamana",
    sourceUrl:
      "https://www.saamana.com/pune-zilla-parishad-292-crore-budget-for-development/",
    remarks: [
      "Presented on 2025-03-20 by Pune ZP Administration (then-CEO Gajanan Patil; current CEO U A Jadhav).",
      "Highlights: ₹58 cr increase over previous year; ₹24.26 cr Social Welfare (20% reserve allocation); ₹8 cr Disabled welfare; ₹12.13 cr Women & Child Welfare (10% reserve allocation); ₹14 cr Education; ~45,000 beneficiaries under direct benefit schemes; ₹1 cr Educational Quality Development — NASA + ISRO exposure program for 75 ZP school students selected via IUCAA screening of ~58,000 candidates.",
      "Outstanding: Pune ZP has requested ₹136 crore from PMC for infrastructure in 32 villages merged into PMC limits.",
      "Secondary source: Punekar News | https://www.punekarnews.in/pune-zilla-parishad-to-send-75-students-to-nasa-and-isro-in-2025-26/",
      "Disclaimer: Pune ZP annual budget as approved by administrative committee. For current official figures, refer to https://www.punezp.gov.in",
    ].join("\n\n"),
  },
];

export async function seedPuneBudgets(prisma?: DBClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    const mh = await client.state.findUniqueOrThrow({
      where: { slug: "maharashtra" },
    });
    const pune = await client.district.findUniqueOrThrow({
      where: { stateId_slug: { stateId: mh.id, slug: "pune" } },
    });
    console.log(`Seeding Pune budgets (districtId=${pune.id})...`);

    let created = 0;
    let skipped = 0;

    for (const rec of RECORDS) {
      const existing = await client.budgetAllocation.findFirst({
        where: {
          districtId: pune.id,
          fiscalYear: rec.fiscalYear,
          department: rec.department,
          category: rec.category,
        },
      });
      if (existing) {
        console.log(
          `  ⏭️  ${rec.department} ${rec.fiscalYear} (${rec.category}) — already present`,
        );
        skipped++;
        continue;
      }

      await client.budgetAllocation.create({
        data: {
          districtId: pune.id,
          fiscalYear: rec.fiscalYear,
          department: rec.department,
          category: rec.category,
          allocated: rec.allocated,
          released: rec.released,
          spent: rec.spent,
          lapsed: rec.lapsed,
          source: rec.source,
          sourceUrl: rec.sourceUrl,
          remarks: rec.remarks,
        },
      });
      console.log(
        `  ✅ ${rec.department} ${rec.fiscalYear} — ₹${(rec.allocated / 10000000).toLocaleString("en-IN")} cr`,
      );
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
  seedPuneBudgets()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
