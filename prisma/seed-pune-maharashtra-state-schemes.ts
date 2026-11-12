/**
 * Pune — 4 Maharashtra state schemes (mirrored from Mumbai's verified DB rows).
 *
 * ForThePeople.in — independent citizen platform by Jayanth M B.
 *
 * SCOPE: Adds 4 state-level Scheme records for Pune that Pune was missing
 * pre-launch. Mirrors the exact content of Mumbai's 4 state-level Scheme
 * rows (already in DB, verified 2026-04-24 via direct Prisma query) so
 * Maharashtra districts present a consistent state-scheme set.
 *
 * SCHEMES SEEDED:
 *   1. Mukhyamantri Majhi Ladki Bahin Yojana   ₹1,500/month
 *   2. Mahatma Jyotirao Phule Jan Arogya Yojana  ₹5,00,000 coverage
 *   3. Maharashtra Gharkul Yojana                ₹2,50,000 housing grant
 *   4. Ramai Awas Gharkul Yojana                 ₹2,50,000 SC/ST housing grant
 *
 * CONVENTION DECISIONS (per Phase D approval):
 *   - level: "STATE" (uppercase) — matches Mumbai's existing rows + Pune's
 *     existing CENTRAL casing. Cross-district reconciliation deferred.
 *   - source: "Maharashtra Govt" (short tag) — matches Mumbai convention
 *     for Maharashtra state schemes. The applyUrl field carries the
 *     real government portal URL where present, preserving provenance.
 *   - eligibility: brief one-line per row, matching Mandya/Mumbai
 *     convention (≤100 chars).
 *   - amount: rupees as integer.
 *
 * IDEMPOTENT. Uses findFirst({districtId, name}) → skip-if-exists.
 *
 * Refs: Forthepeople/26-Pune-Pre-Push-Fix-2026-04-24.md
 */

import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

type DBClient = ReturnType<typeof makeClient>;

type StateSchemeRec = {
  name: string;
  category: string;
  level: string;
  amount: number;
  eligibility: string;
  applyUrl: string | null;
  source: string;
};

const RECORDS: StateSchemeRec[] = [
  {
    name: "Mukhyamantri Majhi Ladki Bahin Yojana",
    category: "Women & Child Development",
    level: "STATE",
    amount: 1500,
    eligibility: "Women aged 21-65, annual family income below ₹2.5 lakh, Maharashtra domicile",
    applyUrl: "https://ladkibahin.maharashtra.gov.in",
    source: "Maharashtra Govt",
  },
  {
    name: "Mahatma Jyotirao Phule Jan Arogya Yojana",
    category: "Health Insurance",
    level: "STATE",
    amount: 500000,
    eligibility: "Maharashtra residents with yellow/orange ration card",
    applyUrl: "https://www.jeevandayee.gov.in",
    source: "Maharashtra Govt",
  },
  {
    name: "Maharashtra Gharkul Yojana",
    category: "Housing",
    level: "STATE",
    amount: 250000,
    eligibility: "EWS/LIG families, Maharashtra domicile",
    applyUrl: null,
    source: "Maharashtra Govt",
  },
  {
    name: "Ramai Awas Gharkul Yojana",
    category: "Housing",
    level: "STATE",
    amount: 250000,
    eligibility: "SC/ST/NT/DNT families below poverty line",
    applyUrl: null,
    source: "Maharashtra Govt",
  },
];

export async function seedPuneMaharashtraStateSchemes(prisma?: DBClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    const mh = await client.state.findUniqueOrThrow({ where: { slug: "maharashtra" } });
    const pune = await client.district.findUniqueOrThrow({
      where: { stateId_slug: { stateId: mh.id, slug: "pune" } },
    });
    console.log(`Seeding Pune Maharashtra state schemes (districtId=${pune.id})...`);

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
          amount: rec.amount,
          eligibility: rec.eligibility,
          applyUrl: rec.applyUrl,
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
  seedPuneMaharashtraStateSchemes()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
