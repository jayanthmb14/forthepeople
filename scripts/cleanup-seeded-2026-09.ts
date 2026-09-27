/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Remove rows the Sept 2026 audit found invented (seeded by hand or by
 * Math.random, never read from a source). Owner-approved 27 Sep 2026.
 *
 * DRY RUN by default: prints what it would change and exits.
 * Pass --confirm to write.
 *
 *   npx tsx scripts/cleanup-seeded-2026-09.ts            # dry run
 *   npx tsx scripts/cleanup-seeded-2026-09.ts --confirm  # apply
 *
 * What it does:
 *   1. RainfallHistory from the seed sources for 2020–2024 → delete
 *      (random numbers; same filter as NOT_SEEDED_RAINFALL in data-filters.ts).
 *   2. TrafficCollection with fractional rupees → delete (Math.random).
 *   3. SugarFactorySeason.totalArrears with fractional rupees → set to null.
 *   4. GovernmentExam rows from the old hard-coded list (links to
 *      upscrecruitment.gov.in / ssc.nic.in / ksp / kea, invented vacancies)
 *      → delete.
 *   5. DamReading rows hand-entered in March (2025/2026, "approximate") →
 *      delete. The scrape-dams cron writes the real readings.
 *
 * Idempotent. The API already hides 1–3.
 */
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const CONFIRM = process.argv.includes("--confirm");

const SEEDED_RAIN_SOURCES = [
  "Karnataka State Natural Disaster Monitoring Centre (KSNDMC)",
  "KSNDMC / IMD",
  "IMD Delhi",
];
const HARDCODED_EXAM_HOSTS = String.raw`(upscrecruitment\.gov\.in|ssc\.nic\.in|ksp\.karnataka\.gov\.in|kea\.karnataka\.gov\.in)`;
const SEEDED_DAM_SOURCES = [
  "Telangana Irrigation Department / HMWSSB (approximate)",
  "BWSSB / water.karnataka.gov.in",
  "Karnataka Neeravari Nigama Limited / water.karnataka.gov.in",
  "Karnataka Neeravari Nigama",
];

const SQL = {
  rain: `FROM "RainfallHistory" WHERE source = ANY($1) AND year <= 2024`,
  traffic: `FROM "TrafficCollection" WHERE amount <> floor(amount)`,
  sugar: `FROM "SugarFactorySeason" WHERE "totalArrears" IS NOT NULL AND "totalArrears" <> floor("totalArrears")`,
  exams: `FROM "GovernmentExam" WHERE coalesce("notificationUrl",'') ~ $1 OR coalesce("applyUrl",'') ~ $1`,
  dams: `FROM "DamReading" WHERE source = ANY($1)`,
};

async function main() {
  const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  try {
    const count = async (sql: string, ...args: unknown[]) =>
      Number(((await p.$queryRawUnsafe(`SELECT count(*)::int AS n ${sql}`, ...args)) as Array<{ n: number }>)[0].n);

    const rain = await count(SQL.rain, SEEDED_RAIN_SOURCES);
    const traffic = await count(SQL.traffic);
    const sugar = await count(SQL.sugar);
    const exams = (await p.$queryRawUnsafe(`SELECT title ${SQL.exams} ORDER BY title`, HARDCODED_EXAM_HOSTS)) as Array<{ title: string }>;
    const dams = await count(SQL.dams, SEEDED_DAM_SOURCES);

    console.log(`RainfallHistory seeded rows to delete:     ${rain}`);
    console.log(`TrafficCollection fractional to delete:    ${traffic}`);
    console.log(`SugarFactorySeason arrears to blank:       ${sugar}`);
    console.log(`GovernmentExam hard-coded rows to delete:  ${exams.length}`);
    for (const e of exams) console.log(`  - ${e.title}`);
    console.log(`DamReading hand-entered rows to delete:    ${dams}`);

    if (!CONFIRM) {
      console.log("\nDry run only. Re-run with --confirm to apply.");
      return;
    }
    const done = await p.$transaction([
      p.$executeRawUnsafe(`DELETE ${SQL.rain}`, SEEDED_RAIN_SOURCES),
      p.$executeRawUnsafe(`DELETE ${SQL.traffic}`),
      p.$executeRawUnsafe(`UPDATE "SugarFactorySeason" SET "totalArrears" = NULL WHERE "totalArrears" IS NOT NULL AND "totalArrears" <> floor("totalArrears")`),
      p.$executeRawUnsafe(`DELETE ${SQL.exams}`, HARDCODED_EXAM_HOSTS),
      p.$executeRawUnsafe(`DELETE ${SQL.dams}`, SEEDED_DAM_SOURCES),
    ]);
    console.log(`Done: rainfall ${done[0]}, traffic ${done[1]}, sugar arrears blanked ${done[2]}, exams ${done[3]}, dams ${done[4]}.`);
    console.log("Clear the Redis caches (admin → Cache) so pages pick this up at once.");
  } finally {
    await p.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
