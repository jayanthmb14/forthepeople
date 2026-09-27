/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * READ-ONLY check: does every India data module's status in
 * src/lib/india/india-modules.ts match what it shows? "live" = at least one
 * IndiaIndicator row with a value (src/lib/india/module-status.ts).
 * Prints the mismatches and exits 1 when there are any. Writes nothing.
 *
 *   npx tsx scripts/check-india-module-status.ts
 */
import "./_env";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { INDIA_MODULES } from "../src/lib/india/india-modules";
import { moduleStatusMismatches } from "../src/lib/india/module-status";

async function main() {
  const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  try {
    const rows = await p.indiaIndicator.findMany({
      where: { numericValue: { not: null } },
      select: { moduleSlug: true },
      distinct: ["moduleSlug"],
    });
    const withFigures = new Set(rows.map((r) => r.moduleSlug));
    const bad = moduleStatusMismatches(INDIA_MODULES, withFigures);
    if (bad.length === 0) {
      console.log(`All ${INDIA_MODULES.filter((m) => m.contentType === "data").length} data modules match their figures.`);
      return;
    }
    for (const b of bad) console.log(`${b.slug.padEnd(32)} status "${b.status}" → should be "${b.shouldBe}"`);
    console.log(`\n${bad.length} module(s) to fix in src/lib/india/india-modules.ts.`);
    process.exitCode = 1;
  } finally {
    await p.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
