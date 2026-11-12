/**
 * Pune PopulationHistory — 4 rows: 1991/2001/2011 Census + 2021 estimate.
 *
 * ForThePeople.in — independent citizen platform by Jayanth M B.
 *
 * Matches Mandya/BLR 4-row pattern. 2021 explicitly tagged as Maharashtra
 * State Evaluation Committee estimate (actual 2021 Census postponed due
 * to COVID-19; pending as of 2026).
 *
 * IDEMPOTENT. Uses findFirst({districtId, year}).
 *
 * Refs: Forthepeople/27-Pune-Module-Population-2026-04-24.md
 */

import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

type DBClient = ReturnType<typeof makeClient>;

const RECORDS = [
  { year: 1991, population: 5532532, sexRatio: 932, literacy: 65.62, urbanPct: 52.6, density: 354, source: "Census of India 1991" },
  { year: 2001, population: 7232555, sexRatio: 919, literacy: 80.45, urbanPct: 58.1, density: 462, source: "Census of India 2001" },
  { year: 2011, population: 9429408, sexRatio: 915, literacy: 86.15, urbanPct: 60.9, density: 603, source: "Census of India 2011" },
  { year: 2021, population: 10800000, sexRatio: 920, literacy: 89, urbanPct: 63, density: 690, source: "Maharashtra State Evaluation Committee estimate (2021 Census postponed due to COVID-19; pending as of 2026)" },
];

export async function seedPunePopulationHistory(prisma?: DBClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;
  try {
    const pune = await client.district.findFirstOrThrow({ where: { slug: "pune" } });
    let created = 0;
    let skipped = 0;
    for (const r of RECORDS) {
      const exists = await client.populationHistory.findFirst({
        where: { districtId: pune.id, year: r.year },
      });
      if (exists) {
        skipped++;
        continue;
      }
      await client.populationHistory.create({ data: { districtId: pune.id, ...r } });
      console.log(`  ✅ ${r.year}: pop=${r.population.toLocaleString()}`);
      created++;
    }
    console.log(`PopulationHistory: created=${created} skipped=${skipped}`);
  } finally {
    if (standalone) await client.$disconnect();
  }
}

if (require.main === module) {
  seedPunePopulationHistory().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
