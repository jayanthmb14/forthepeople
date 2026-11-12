/**
 * Pune HousingScheme — single PMAY-U FY 2026-27 row.
 *
 * ForThePeople.in — independent citizen platform by Jayanth M B.
 *
 * BACKGROUND: /en/maharashtra/pune/housing rendered blank pre-fix because
 * HousingScheme had 0 rows for Pune. The /housing UI reads from
 * HousingScheme (not the Scheme model where Prompt 5 routed PMAY entries).
 * Mandya has 2 rows driving its full charts + AI analysis.
 *
 * SCOPE: ONE verified row only — PMAY-U FY 2026-27. PMAY-G DEFERRED to
 * post-launch because Pune district-level rural-housing disaggregation
 * is not publicly available in this audit window. Pune ZP runs real Maha
 * Awas Abhiyan with real beneficiaries; seeding zeros would misrepresent.
 * Better one honest row than two with one fabricated.
 *
 * SCHEMA NOTE: HousingScheme.targetHouses, sanctioned, completed,
 * inProgress are REQUIRED non-nullable Int. sanctioned/completed/
 * inProgress = 0 because FY 2026-27 just started April 1 — these
 * are accurate values, not placeholders.
 *
 * IDEMPOTENT. Uses findFirst({districtId, schemeName, fiscalYear}).
 *
 * Refs: Forthepeople/26-Pune-Pre-Push-Fix-2026-04-24.md
 *       (post-launch follow-up section: PMAY-G retroactive seed needed
 *       once rural disaggregation surfaces from pmayg.nic.in / ZP /
 *       Divisional Commissioner / RTI route)
 */

import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

type DBClient = ReturnType<typeof makeClient>;

type HousingRec = {
  schemeName: string;
  fiscalYear: string;
  targetHouses: number;
  sanctioned: number;
  completed: number;
  inProgress: number;
  fundsAllocated: number | null;
  fundsReleased: number | null;
  fundsSpent: number | null;
  source: string;
};

const RECORDS: HousingRec[] = [
  {
    schemeName: "PMAY-U",
    fiscalYear: "2026-27",
    targetHouses: 4725, // PMC FY 2026-27 budget allocation: Hadapsar + Wadgaon
    sanctioned: 0,
    completed: 0,
    inProgress: 0,
    fundsAllocated: null,
    fundsReleased: null,
    fundsSpent: null,
    source:
      "Pune Municipal Corporation FY 2026-27 Budget — Hadapsar + Wadgaon allocation. " +
      "Implementation begins April 2026 — targets approved, sanctioning and construction " +
      "commence in coming months. For FY 2025-26 completion data, refer to " +
      "pmay-urban.gov.in Pune district dashboard. | " +
      "https://www.thebridgechronicle.com/pune/pune-budget-2026-27-13995-crore-roads-water-infrastructure-merged-villages-agn97",
  },
];

export async function seedPuneHousing(prisma?: DBClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    const mh = await client.state.findUniqueOrThrow({ where: { slug: "maharashtra" } });
    const pune = await client.district.findUniqueOrThrow({
      where: { stateId_slug: { stateId: mh.id, slug: "pune" } },
    });
    console.log(`Seeding Pune HousingScheme (districtId=${pune.id})...`);

    let created = 0;
    let skipped = 0;

    for (const rec of RECORDS) {
      const existing = await client.housingScheme.findFirst({
        where: {
          districtId: pune.id,
          schemeName: rec.schemeName,
          fiscalYear: rec.fiscalYear,
        },
      });
      if (existing) {
        console.log(`  ⏭️  ${rec.schemeName} ${rec.fiscalYear} — already present`);
        skipped++;
        continue;
      }

      await client.housingScheme.create({
        data: {
          districtId: pune.id,
          schemeName: rec.schemeName,
          fiscalYear: rec.fiscalYear,
          targetHouses: rec.targetHouses,
          sanctioned: rec.sanctioned,
          completed: rec.completed,
          inProgress: rec.inProgress,
          fundsAllocated: rec.fundsAllocated,
          fundsReleased: rec.fundsReleased,
          fundsSpent: rec.fundsSpent,
          source: rec.source,
        },
      });
      console.log(
        `  ✅ ${rec.schemeName} ${rec.fiscalYear} — target ${rec.targetHouses.toLocaleString()} houses`,
      );
      created++;
    }

    console.log(
      `\nSummary: ${created} created + ${skipped} skipped = ${RECORDS.length} total target.`,
    );
    console.log(`\nPMAY-G: DEFERRED — see post-launch follow-up in Obsidian research log.`);
  } finally {
    if (standalone) await client.$disconnect();
  }
}

if (require.main === module) {
  seedPuneHousing()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
