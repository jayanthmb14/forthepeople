/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 *
 * ───────────────────────────────────────────────────────────────────────────
 * One-off cleanup: purge FABRICATED ("estimated") stat rows.
 * ───────────────────────────────────────────────────────────────────────────
 * Deletes RtiStat + CourtStat rows whose `source` contains "estimated" — i.e. the
 * rows the old scraper fallbacks invented on portal failure:
 *   • RtiStat   source = "KIC Karnataka (estimated)"  (Math.random() counts/avgDays)
 *   • CourtStat source = "NJDG (estimated)"           (pending = prev + filed - disposed)
 *
 * Session 3 removed that fabrication from the scrapers, but rows already written
 * to prod before this deploy must be cleaned up. Run this DELIBERATELY against
 * prod Neon AFTER Session 3 is deployed.
 *
 * SAFE BY DEFAULT: a plain run is a DRY RUN (counts only — no writes).
 * Pass --confirm to actually delete.
 *
 *   # Preview what would be deleted (no writes):
 *   DATABASE_URL="<prod Neon pooled URL>" npx tsx scripts/purge-estimated-stats.ts
 *
 *   # Actually delete:
 *   DATABASE_URL="<prod Neon pooled URL>" npx tsx scripts/purge-estimated-stats.ts --confirm
 *
 * NOTE: real rows (source "Karnataka Information Commission", "NJDG / eCourts")
 * are NOT touched — only rows whose source contains "estimated".
 */

import { prisma } from "@/lib/db";

// Case-insensitive match so any "(estimated)" variant is caught.
const ESTIMATED = { contains: "estimated", mode: "insensitive" as const };

async function main() {
  const confirm = process.argv.includes("--confirm");

  const [rtiCount, courtCount] = await Promise.all([
    prisma.rtiStat.count({ where: { source: ESTIMATED } }),
    prisma.courtStat.count({ where: { source: ESTIMATED } }),
  ]);

  console.log("Fabricated ('estimated') rows found:");
  console.log(`  RtiStat:   ${rtiCount}`);
  console.log(`  CourtStat: ${courtCount}`);

  if (rtiCount === 0 && courtCount === 0) {
    console.log("\nNothing to purge. ✅");
    return;
  }

  if (!confirm) {
    console.log("\nDRY RUN — nothing was deleted.");
    console.log("Re-run with --confirm to delete these rows from the configured DATABASE_URL:");
    console.log('  DATABASE_URL="<prod Neon>" npx tsx scripts/purge-estimated-stats.ts --confirm');
    return;
  }

  const [rti, court] = await Promise.all([
    prisma.rtiStat.deleteMany({ where: { source: ESTIMATED } }),
    prisma.courtStat.deleteMany({ where: { source: ESTIMATED } }),
  ]);

  console.log("\nDeleted:");
  console.log(`  RtiStat:   ${rti.count}`);
  console.log(`  CourtStat: ${court.count}`);
  console.log("Done. ✅");
}

main()
  .catch((e) => {
    console.error("purge-estimated-stats failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
