/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Fix wrong or outdated data records found in the September 2026 audit.
 * Every change was checked by hand against a named source (official
 * .gov.in / .nic.in / PIB pages first, reputed news only when nothing
 * official exists). The reviewed list lives in scripts/fix-records-2026-09/;
 * the plain-English table is docs/DATA-FIXES-2026-09.md.
 *
 * DRY RUN by default: prints every change (table, id, field, old → new,
 * source) and exits. Pass --confirm to apply, all in one transaction.
 *
 *   npx tsx scripts/fix-records-2026-09.ts            # dry run
 *   npx tsx scripts/fix-records-2026-09.ts --confirm  # apply
 *   npx tsx scripts/fix-records-2026-09.ts --only=InfraProject   # one table
 *
 * Rows are matched by id, so it is exact and idempotent: a row already
 * deleted, or a field already holding the new value, is skipped. If a
 * field changed since the check date (neither the old value we saw nor
 * the new one), that fix is skipped and reported — look at it by hand.
 *
 * Deleting an InfraProject also deletes its InfraUpdate timeline rows
 * (onDelete: Cascade in prisma/schema.prisma). The Leader table is never
 * touched here.
 */
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { DATE_FIELDS, type Fix, type FieldValue } from "./fix-records-2026-09/types";
import { POPULATION_FIXES } from "./fix-records-2026-09/population";
import { POLICE_FIXES } from "./fix-records-2026-09/police";
import { INFRA_FIXES } from "./fix-records-2026-09/infra";
import { FRESHNESS_FIXES } from "./fix-records-2026-09/freshness";
import { INDIA_FIXES } from "./fix-records-2026-09/india";

const CONFIRM = process.argv.includes("--confirm");
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice("--only=".length) ?? null;

const ALL_FIXES: Fix[] = [...INFRA_FIXES, ...POPULATION_FIXES, ...INDIA_FIXES, ...POLICE_FIXES, ...FRESHNESS_FIXES];

/** Prisma delegate name for a table ("InfraProject" → "infraProject"). */
const delegateName = (table: string) => table[0].toLowerCase() + table.slice(1);

/** A stored timestamp as its IST calendar day, "YYYY-MM-DD". */
const istDay = (d: Date) => new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10);

/** "YYYY-MM-DD" → Date at IST midnight (how the seeds stored dates). */
const istMidnight = (d: string) => new Date(`${d}T00:00:00+05:30`);

function toDbValue(field: string, v: FieldValue): unknown {
  if (v !== null && DATE_FIELDS.has(field) && typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return istMidnight(v);
  return v;
}

/** Compare a stored value with a planned value, tolerant of Decimal strings and dates. */
function same(field: string, current: unknown, planned: FieldValue): boolean {
  if (current === null || current === undefined) return planned === null;
  if (planned === null) return false;
  if (current instanceof Date) {
    // Compare calendar days in IST: seeds stored IST midnight, news sync stored other times.
    if (typeof planned === "string" && /^\d{4}-\d{2}-\d{2}$/.test(planned)) return istDay(current) === planned;
    const want = toDbValue(field, planned);
    return want instanceof Date && want.getTime() === current.getTime();
  }
  if (typeof planned === "number") return Math.abs(Number(current) - planned) < 1e-6;
  return String(current) === String(planned);
}

function show(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (v instanceof Date) return istDay(v);
  if (typeof v === "string") return JSON.stringify(v.length > 70 ? v.slice(0, 67) + "…" : v);
  return String(v);
}

type Planned = { fix: Fix; data?: Record<string, unknown> };

async function main() {
  // Guard: every id appears once per table, so two fixes never fight over a row.
  const seen = new Set<string>();
  for (const f of ALL_FIXES) {
    const key = `${f.table}:${f.id}`;
    if (seen.has(key)) throw new Error(`Duplicate fix for ${key}`);
    seen.add(key);
    if (f.op === "update" && (!f.set || Object.keys(f.set).length === 0)) throw new Error(`Update without fields: ${key}`);
    if ((f.table as string) === "Leader") throw new Error("Leader is out of scope for this script");
  }

  const fixes = ONLY ? ALL_FIXES.filter((f) => f.table === ONLY) : ALL_FIXES;
  const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  const plan: Planned[] = [];
  const counts: Record<string, { update: number; delete: number; skipped: number; gone: number; drift: number }> = {};
  const tally = (t: string) => (counts[t] ??= { update: 0, delete: 0, skipped: 0, gone: 0, drift: 0 });

  try {
    let currentTable = "";
    for (const f of fixes) {
      if (f.table !== currentTable) {
        currentTable = f.table;
        console.log(`\n══ ${f.table} ══`);
      }
      const rows = (await p.$queryRawUnsafe(`SELECT * FROM "${f.table}" WHERE id = $1`, f.id)) as Array<Record<string, unknown>>;
      const row = rows[0];
      console.log(`\n• ${f.op.toUpperCase()} ${f.table} ${f.id} — ${f.label}`);
      console.log(`  why:    ${f.why}`);
      console.log(`  source: ${f.source} (checked ${f.checked})`);
      if (f.says) console.log(`  says:   ${f.says}`);
      if (!row) {
        console.log("  → row not found (already deleted?) — skipped");
        tally(f.table).gone++;
        continue;
      }
      if (f.op === "delete") {
        const name = row.name ?? row.metricKey ?? row.year ?? "";
        console.log(`  → delete row (${show(name)})`);
        plan.push({ fix: f });
        tally(f.table).delete++;
        continue;
      }
      const data: Record<string, unknown> = {};
      let drift = false;
      for (const [field, planned] of Object.entries(f.set!)) {
        if (!(field in row)) throw new Error(`${f.table}.${field} does not exist (fix ${f.id})`);
        const current = row[field];
        if (same(field, current, planned)) {
          console.log(`    ${field}: ${show(current)} (already ${show(planned)})`);
          continue;
        }
        if (f.was && field in f.was && !same(field, current, f.was[field])) {
          console.log(`    ${field}: now ${show(current)}, was ${show(f.was[field])} on ${f.checked} — CHANGED SINCE CHECK`);
          drift = true;
          continue;
        }
        console.log(`    ${field}: ${show(current)} → ${show(planned)}`);
        data[field] = toDbValue(field, planned);
      }
      if (drift) {
        console.log("  → a field changed since the check — whole fix skipped; review by hand");
        tally(f.table).drift++;
        continue;
      }
      if (Object.keys(data).length === 0) {
        console.log("  → already applied — skipped");
        tally(f.table).skipped++;
        continue;
      }
      plan.push({ fix: f, data });
      tally(f.table).update++;
    }

    console.log("\n══ Summary ══");
    for (const [t, c] of Object.entries(counts)) {
      console.log(
        `${t.padEnd(18)} update ${String(c.update).padStart(3)}   delete ${String(c.delete).padStart(3)}   already done ${String(c.skipped).padStart(3)}   not found ${String(c.gone).padStart(3)}   changed-since-check ${String(c.drift).padStart(3)}`,
      );
    }
    console.log(`Total changes to apply: ${plan.length}`);

    if (!CONFIRM) {
      console.log("\nDry run only. Re-run with --confirm to apply.");
      return;
    }
    if (plan.length === 0) {
      console.log("Nothing to do.");
      return;
    }
    await p.$transaction(
      async (tx) => {
        for (const { fix, data } of plan) {
          const delegate = (tx as unknown as Record<string, { update: (a: unknown) => Promise<unknown>; delete: (a: unknown) => Promise<unknown> }>)[
            delegateName(fix.table)
          ];
          if (fix.op === "delete") await delegate.delete({ where: { id: fix.id } });
          else await delegate.update({ where: { id: fix.id }, data });
        }
      },
      { timeout: 120_000, maxWait: 20_000 },
    );
    console.log(`\nDone: applied ${plan.length} changes in one transaction.`);
    console.log("Clear the Redis caches (admin → Cache) so pages pick this up at once.");
  } finally {
    await p.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
