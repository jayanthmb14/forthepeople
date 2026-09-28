/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * One-time duplicate clean-up, September 2026.
 *
 * Owner rule: duplicates mean the code that wrote them was wrong — the
 * writers are fixed (exam-sync, the ECI / PMGSY / UPSC-SSC collectors,
 * infra-sync, seeds) and the backend removes its own duplicates daily
 * (/api/cron/dedupe-data). This script runs the SAME guard
 * (src/lib/dedupe/guard.ts) once over today's data, plus one thing the
 * daily cron only reports: exams whose organiser is clearly not government
 * (private universities, college semester results, COMEDK) are deleted.
 *
 *   npx tsx scripts/dedupe-2026-09.ts            # DRY RUN (default): prints every change
 *   npx tsx scripts/dedupe-2026-09.ts --confirm  # apply, all in ONE transaction
 *   npx tsx scripts/dedupe-2026-09.ts --only=GovernmentExam,ElectionResult
 *
 * What it does on today's data:
 *   - GovernmentExam: every national exam stored once per district becomes
 *     ONE national row (districtId, stateId null) with the best facts of all
 *     copies (NEET 2026 / NEET (UG) 2026 / NEET UG 2026 → one "NEET UG 2026",
 *     organiser NTA); state exams one row per state; legacy statuses
 *     ("upcoming", "declared", "Panel Set Up" …) rewritten in the canonical
 *     set (unknown → UNVERIFIED); non-government exams deleted.
 *   - ElectionResult: same seat stored twice ("LokSabha" / "Lok Sabha",
 *     "Shivajinagar" / "Shivajinagar (157)") → one row; every electionType
 *     rewritten as LOK_SABHA / ASSEMBLY.
 *   - Every other citizen-facing table: exact canonical duplicates merged
 *     (see the guard's header).
 *   - FUZZY candidates (≥ 85 % alike) are only PRINTED for a person to
 *     review — never changed here. The daily cron queues them.
 * Idempotent: a second run finds nothing to do.
 */
import "./_env"; // MUST be first: loads .env + .env.local before any module reads process.env
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { runDuplicateGuard, type Db, type GuardReport } from "../src/lib/dedupe/guard";

const CONFIRM = process.argv.includes("--confirm");
const ONLY = (process.argv.find((a) => a.startsWith("--only="))?.slice("--only=".length) ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function print(report: GuardReport, slugOf: Map<string, string>) {
  const line = (s = "") => console.log(s);
  const verb = CONFIRM ? "" : "would be ";
  line(`\n═══ Duplicate clean-up ${CONFIRM ? "(APPLIED)" : "(DRY RUN — nothing written)"} ═══`);

  const ex = report.exams;
  if (ex) {
    line(`\n── GovernmentExam: ${ex.scanned} rows ──`);
    line(`  ${ex.groupsMerged} exams stored more than once → one row each (${ex.rowsRemoved} copies ${verb}removed)`);
    line(`  ${ex.rowsMoved} kept rows ${verb}moved to (or relabelled with) their one national / state / district place`);
    line(`  ${ex.statusesNormalised} statuses ${verb}rewritten in the canonical set`);
    for (const e of ex.examples) line(`    • ${e}`);
    if (ex.rewritten.length) {
      line(`  Single rows rewritten (status / placement):`);
      for (const r of ex.rewritten) line(`    • ${r}`);
    }
    line(`  Non-government organisers (${ex.nonGovernment.length}) — ${ex.nonGovernment.some((n) => n.removed) ? `${verb}deleted` : "reported only"}:`);
    for (const n of ex.nonGovernment) line(`    ✗ ${n.title} [${n.id}]`);
    if (ex.unknownOrganiser.length) {
      line(`  Organiser not recognised as government or private (${ex.unknownOrganiser.length}) — kept, check by hand:`);
      for (const n of ex.unknownOrganiser) line(`    ? ${n.title} [${n.id}]`);
    }
    if (ex.conflicts.length) {
      line(`  Copies disagreed (the kept row's value stays):`);
      for (const c of ex.conflicts) line(`    ! ${c}`);
    }
    if (ex.crossScope.length) {
      line(`  Same exam under two scopes (a person decides):`);
      for (const c of ex.crossScope) line(`    ? ${c}`);
    }
  }

  line(`\n── Other tables ──`);
  line(`  ${"table".padEnd(18)} ${"scanned".padStart(7)} ${"groups".padStart(6)} ${"rows".padStart(5)}  action       ${"fixed".padStart(5)} ${"fuzzy".padStart(5)}`);
  for (const t of report.tables) {
    const action = t.resolved ? (t.resolution === "delete" ? "delete" : "deactivate") : "-";
    line(`  ${t.table.padEnd(18)} ${String(t.scanned).padStart(7)} ${String(t.exactGroups).padStart(6)} ${String(t.resolved).padStart(5)}  ${action.padEnd(12)} ${String(t.normalised).padStart(5)} ${String(t.fuzzy).padStart(5)}`);
  }
  for (const t of report.tables) {
    if (!t.examples.length) continue;
    line(`\n  ${t.table}:`);
    for (const e of t.examples) line(`    • ${e}`);
    if (t.childrenMoved || t.childrenDropped) line(`    child rows: ${t.childrenMoved} moved, ${t.childrenDropped} dropped as repeats`);
  }
  const normalised = report.tables.filter((t) => t.normalised);
  for (const t of normalised) line(`\n  ${t.table}: ${t.normalised} rows ${verb}rewritten in the canonical spelling`);

  const conflicts = report.fuzzy.filter((f) => f.kind === "conflict");
  const similar = report.fuzzy.filter((f) => f.kind === "similar");
  const show = (f: GuardReport["fuzzy"][number]) => {
    const where = f.districtId ? slugOf.get(f.districtId) ?? f.districtId : "no district";
    const tag = f.kind === "conflict" ? "CONFLICT" : `${Math.round(f.score * 100)}%`;
    line(`  ${tag.padStart(8)}  ${f.table.padEnd(16)} ${where.padEnd(16)} "${f.names[0]}"  /  "${f.names[1]}"  [${f.ids.join(", ")}]`);
  };
  line(`\n── Same slot, different facts — a person decides (never changed here): ${conflicts.length} ──`);
  conflicts.forEach(show);
  line(`\n── Fuzzy candidates for a person (never changed here): ${similar.length} ──`);
  similar.forEach(show);
  if (report.errors.length) line(`\nErrors: ${report.errors.join(" | ")}`);

  const removed = report.tables.reduce((n, t) => n + t.resolved, 0) + (ex?.rowsRemoved ?? 0) + (ex?.nonGovernment.filter((n) => n.removed).length ?? 0);
  line(`\nSummary: ${removed} duplicate / junk rows ${verb}removed or retired; ${conflicts.length} conflicts and ${similar.length} fuzzy pairs listed for review.`);
  if (!CONFIRM) line("Dry run only. Re-run with --confirm to apply (one transaction).");
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL not set");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const districts = await prisma.district.findMany({ select: { id: true, slug: true } });
    const slugOf = new Map(districts.map((d) => [d.id, d.slug]));
    const run = (db: Db) =>
      runDuplicateGuard(db, {
        dryRun: !CONFIRM,
        only: ONLY.length ? ONLY : undefined,
        queueFuzzy: false,
        removeNonGovernmentExams: true,
        verbose: true,
      });
    const report = CONFIRM
      ? await prisma.$transaction(
          async (tx) => {
            const r = await run(tx);
            // All or nothing: a failed table rolls the whole clean-up back.
            if (r.errors.length) throw new Error(`rolled back — ${r.errors.join(" | ")}`);
            return r;
          },
          { timeout: 300_000, maxWait: 30_000 },
        )
      : await run(prisma);
    print(report, slugOf);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Fatal:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
