/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 *
 * ───────────────────────────────────────────────────────────────────────────
 * One-off data fix: District.nameLocal that is empty or just the English name
 * ───────────────────────────────────────────────────────────────────────────
 * Found 2026-09-27: Pune's row in the District table has nameLocal "Pune"
 * (English) instead of "पुणे" (Marathi, Devanagari). Pages that print the
 * local-script name next to the English one then show "Pune Pune".
 *
 * What this script does:
 *   1. Lists every ACTIVE district whose nameLocal is empty or equal to its
 *      English name (ignoring case and surrounding spaces).
 *   2. For each one, proposes a fix ONLY from REVIEWED_LOCAL_NAMES below —
 *      a small hand-checked map. It never guesses, transliterates or
 *      machine-translates. A problem row with no entry in the map is listed
 *      as "needs review" and left alone.
 *   3. With --confirm, writes just those proposals. Each write is guarded so
 *      it only lands if the row still holds the bad value it had when the
 *      script read it (so a manual fix made in the meantime is never undone).
 *
 * SAFE BY DEFAULT: a plain run is a DRY RUN (reads only — no writes).
 *
 *   # Preview (no writes):
 *   npx tsx scripts/fix-district-local-names.ts
 *
 *   # Apply the reviewed fixes to the configured DATABASE_URL:
 *   npx tsx scripts/fix-district-local-names.ts --confirm
 *
 * The database URL comes from .env / .env.local (scripts/_env.ts) or from a
 * DATABASE_URL=... prefix on the command.
 *
 * To add a district: check the spelling against the district's official
 * website or the static registry (src/lib/constants/districts.ts), then add
 * one line to REVIEWED_LOCAL_NAMES, keyed "<state-slug>/<district-slug>".
 */

import "./_env";
import { prisma } from "@/lib/db";

/**
 * Hand-reviewed local-script names. Keyed by "<state-slug>/<district-slug>"
 * so two districts with the same slug in different states can never collide.
 * Only add an entry after checking the spelling yourself.
 */
const REVIEWED_LOCAL_NAMES: Record<string, string> = {
  // Marathi (Devanagari). Matches the static registry entry for Pune.
  "maharashtra/pune": "पुणे",
};

/** True when a local name is missing or just repeats the English name. */
function isProblem(name: string, nameLocal: string | null): boolean {
  const local = (nameLocal ?? "").trim();
  return local === "" || local.toLowerCase() === name.trim().toLowerCase();
}

async function main() {
  const confirm = process.argv.includes("--confirm");

  const districts = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true, nameLocal: true, state: { select: { slug: true } } },
    orderBy: [{ state: { slug: "asc" } }, { slug: "asc" }],
  });

  const problems = districts.filter((d) => isProblem(d.name, d.nameLocal));

  console.log(`Active districts checked: ${districts.length}`);
  console.log(`With an empty or English-only nameLocal: ${problems.length}\n`);

  if (problems.length === 0) {
    console.log("Nothing to fix.");
    return;
  }

  const fixable: Array<{ id: string; key: string; current: string; proposed: string }> = [];
  for (const d of problems) {
    const key = `${d.state.slug}/${d.slug}`;
    const proposed = REVIEWED_LOCAL_NAMES[key];
    const current = d.nameLocal ?? "";
    if (proposed) {
      fixable.push({ id: d.id, key, current, proposed });
      console.log(`  ${key.padEnd(34)} "${current}"  ->  "${proposed}"`);
    } else {
      console.log(`  ${key.padEnd(34)} "${current}"  ->  (needs review: no entry in REVIEWED_LOCAL_NAMES)`);
    }
  }

  if (fixable.length === 0) {
    console.log("\nNo reviewed fixes to apply. Add entries to REVIEWED_LOCAL_NAMES first.");
    return;
  }

  if (!confirm) {
    console.log(`\nDRY RUN: nothing was written. ${fixable.length} reviewed fix(es) would be applied.`);
    console.log("Re-run with --confirm to write them to the configured DATABASE_URL:");
    console.log("  npx tsx scripts/fix-district-local-names.ts --confirm");
    return;
  }

  let written = 0;
  for (const f of fixable) {
    // Guarded update: only if the row still holds the value we read above.
    const res = await prisma.district.updateMany({
      where: { id: f.id, nameLocal: f.current },
      data: { nameLocal: f.proposed },
    });
    if (res.count === 1) {
      written++;
      console.log(`  updated ${f.key}`);
    } else {
      console.log(`  skipped ${f.key} (value changed since it was read)`);
    }
  }
  console.log(`\nDone: ${written} of ${fixable.length} row(s) updated.`);
  console.log("Remember to bust the district caches (scripts/bust-all-caches.ts) so pages pick up the new names.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
