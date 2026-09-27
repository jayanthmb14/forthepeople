/**
 * ForThePeople.in — Merge duplicate InfraProject rows
 *
 *   npx tsx scripts/dedup-infra-projects.ts            # dry run (default): lists what would change
 *   npx tsx scripts/dedup-infra-projects.ts --confirm  # apply, in one transaction
 *
 * Sept 2026: this used to carry its own rules (≥ 60 % token overlap, merged
 * automatically) — close enough to merge different phases of one metro. It
 * is now a thin wrapper around the duplicate guard (src/lib/dedupe/guard.ts),
 * which the daily /api/cron/dedupe-data cron also runs:
 *   - EXACT duplicates (same canonical name in the same district: "Atal
 *     Setu" = "Sewri–Nhava Sheva Trans Harbour Link", "Phase II" = "Phase 2")
 *     are merged — richest row kept, gaps filled, InfraUpdate timeline rows
 *     moved, sourceUrls pooled;
 *   - FUZZY pairs (≥ 85 % alike) are only listed here (the cron queues them
 *     for review as NewsActionQueue "verify-duplicates").
 */
import "./_env"; // MUST be first: loads .env + .env.local before any module reads process.env
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { runDuplicateGuard } from "../src/lib/dedupe/guard";

const CONFIRM = process.argv.includes("--confirm");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL not set");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const run = (db: Parameters<typeof runDuplicateGuard>[0]) =>
      runDuplicateGuard(db, { dryRun: !CONFIRM, only: ["InfraProject"], queueFuzzy: false, log: (m) => console.log(`  ${m}`) });
    const report = CONFIRM ? await prisma.$transaction((tx) => run(tx), { timeout: 120_000, maxWait: 20_000 }) : await run(prisma);
    const t = report.tables[0];
    console.log(`\nInfraProject: ${t?.scanned ?? 0} scanned, ${t?.exactGroups ?? 0} duplicate groups, ${t?.resolved ?? 0} rows ${CONFIRM ? "merged away" : "to merge"}`);
    for (const e of t?.examples ?? []) console.log(`  ${e}`);
    if (report.fuzzy.length) {
      console.log(`\nLook at these by hand (never merged automatically):`);
      for (const f of report.fuzzy) console.log(`  ${Math.round(f.score * 100)}%  "${f.names[0]}"  /  "${f.names[1]}"  [${f.ids.join(", ")}]`);
    }
    if (report.errors.length) console.log(`\nErrors: ${report.errors.join(" | ")}`);
    if (!CONFIRM) console.log("\nDry run only. Re-run with --confirm to apply.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exitCode = 1;
});
