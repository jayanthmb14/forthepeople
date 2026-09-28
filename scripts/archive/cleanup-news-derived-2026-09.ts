/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Clean up rows the Sept 2026 audit found wrong on district pages.
 *
 * DRY RUN by default: prints what it would change and exits.
 * Pass --confirm to write. Run against prod only after reading the dry run.
 *
 *   npx tsx scripts/cleanup-news-derived-2026-09.ts            # dry run
 *   npx tsx scripts/cleanup-news-derived-2026-09.ts --confirm  # apply
 *
 * What it does:
 *   1. InfraProject scope=NATIONAL → delete (and their InfraUpdates, by
 *      cascade). The old sync copied these onto every active district.
 *   2. CrimeStat with an article URL as source → delete. A number from a
 *      headline is not an NCRB statistic.
 *   3. PowerOutage with an article URL as source → delete. Headlines such as
 *      "Factories go fully solar" were stored as outages.
 *   4. Leader with an article URL as source → active=false (kept for the
 *      admin to review, hidden from pages).
 *
 * The public API already hides all four (src/lib/data-filters.ts), so this
 * is housekeeping, not a hotfix. Idempotent.
 */
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const CONFIRM = process.argv.includes("--confirm");
const FROM_NEWS = { source: { startsWith: "http" } };

async function main() {
  const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  try {
    const national = await p.infraProject.findMany({
      where: { scope: "NATIONAL" },
      select: { id: true, name: true, district: { select: { slug: true } } },
    });
    const crime = await p.crimeStat.count({ where: FROM_NEWS });
    const power = await p.powerOutage.count({ where: FROM_NEWS });
    const leaders = await p.leader.count({ where: { ...FROM_NEWS, active: true } });

    console.log(`InfraProject NATIONAL rows to delete: ${national.length}`);
    const byName = new Map<string, string[]>();
    for (const n of national) byName.set(n.name, [...(byName.get(n.name) ?? []), n.district.slug]);
    for (const [name, slugs] of byName) console.log(`  - ${name.slice(0, 70)}  (${slugs.length} districts)`);
    console.log(`CrimeStat rows from news to delete:   ${crime}`);
    console.log(`PowerOutage rows from news to delete: ${power}`);
    console.log(`Leader rows from news to deactivate:  ${leaders}`);

    if (!CONFIRM) {
      console.log("\nDry run only. Re-run with --confirm to apply.");
      return;
    }
    const [a, b, c, d] = await p.$transaction([
      p.infraProject.deleteMany({ where: { scope: "NATIONAL" } }),
      p.crimeStat.deleteMany({ where: FROM_NEWS }),
      p.powerOutage.deleteMany({ where: FROM_NEWS }),
      p.leader.updateMany({ where: { ...FROM_NEWS, active: true }, data: { active: false } }),
    ]);
    console.log(`\nDone: infra ${a.count}, crime ${b.count}, power ${c.count}, leaders deactivated ${d.count}.`);
    console.log("Clear the Redis caches (admin → Cache) so pages pick this up at once.");
  } finally {
    await p.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
