/**
 * ForThePeople.in — Backfill GovernmentExam rows from historic NewsItems
 * Run: npx tsx scripts/backfill-exams-from-news.ts [--limit 20] [--dry-run]
 *
 * Walks existing NewsItems tagged with exam-like keywords, runs the same
 * extractor used by the news cron, then syncs upserts via syncExamFromNews.
 *
 * Cost guard:
 *   - Default limit: 10 extractions per run (override with --limit N)
 *   - Dedupes by normalized title prefix so the same AI call isn't made twice
 *   - Uses the free-tier model via purpose="news-analysis"
 *   - Wraps every extraction in try/catch — one bad article never aborts the run
 *
 * After: optionally prune exam rows with no dates, no applyUrl, no sourceUrls.
 *   DELETE FROM "GovernmentExam" WHERE "sourceUrls" IS NULL AND
 *     "applyUrl" IS NULL AND "startDate" IS NULL;
 *   (run manually; this script does not auto-delete seed data)
 */

import "./_env"; // MUST be first: loads .env + .env.local before any module reads process.env
import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import { extractExamFromNews, syncExamFromNews } from "../src/lib/exam-sync";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ── CLI args ─────────────────────────────────────────────────
const args = process.argv.slice(2);
function flagValue(flag: string, fallback: number): number {
  const i = args.indexOf(flag);
  if (i < 0) return fallback;
  const n = Number(args[i + 1]);
  return Number.isFinite(n) ? n : fallback;
}
const LIMIT = Math.max(1, Math.min(50, flagValue("--limit", 10)));
const DRY_RUN = args.includes("--dry-run");

// Keyword filter — surfaces articles that look like exam notifications
// without needing an existing module classification.
const KEYWORD_RE =
  /\b(upsc|ssc|ibps|rbi|rrb|sbi|nta|mpsc|kpsc|tspsc|uppsc|cat|jee|neet|gate|clat|cet|pcs|cgpsc|rpsc|bpsc)\b|\bexam(?:ination)?\b|\bvacanc(?:y|ies)\b|\bnotification\b|\bapply\s+online\b|\brecruitment\b|\badmit\s+card\b/i;

function normalizeTitleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 6)
    .join(" ");
}

async function main() {
  console.log(`📝 Mumbai-and-beyond exam backfill starting (limit=${LIMIT}, dryRun=${DRY_RUN})\n`);

  // Only articles newer than 120 days matter — older notifications are closed/stale.
  const since = new Date(Date.now() - 120 * 86_400_000);

  // Pull candidates ordered newest-first; cap query so we don't fetch 10k rows
  // just to filter client-side.
  const candidates = await prisma.newsItem.findMany({
    where: {
      publishedAt: { gte: since },
      OR: [
        { targetModule: "exams" },
        { title: { contains: "exam", mode: "insensitive" } },
        { title: { contains: "notification", mode: "insensitive" } },
        { title: { contains: "recruitment", mode: "insensitive" } },
        { title: { contains: "vacancy", mode: "insensitive" } },
      ],
      districtId: { not: null },
    },
    select: {
      id: true,
      title: true,
      url: true,
      publishedAt: true,
      districtId: true,
      targetModule: true,
    },
    orderBy: { publishedAt: "desc" },
    take: 200,
  });

  // Filter further by keyword regex + dedupe by normalized title prefix
  const seen = new Set<string>();
  const queue: typeof candidates = [];
  for (const n of candidates) {
    if (!KEYWORD_RE.test(n.title)) continue;
    const key = normalizeTitleKey(n.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    queue.push(n);
    if (queue.length >= LIMIT) break;
  }

  console.log(`  ${candidates.length} candidates scanned, ${queue.length} picked for extraction\n`);

  let extracted = 0;
  let synced = 0;
  let failed = 0;
  let skipped = 0;

  for (const n of queue) {
    const label = `[${n.publishedAt.toISOString().slice(0, 10)}] ${n.title.slice(0, 70)}…`;
    try {
      const ext = await extractExamFromNews({
        title: n.title,
        url: n.url,
        publishedAt: n.publishedAt,
      });
      if (!ext) {
        skipped++;
        console.log(`  ⏭  ${label}  → extraction returned null`);
        continue;
      }
      extracted++;
      if (DRY_RUN) {
        console.log(`  👀 ${label}`);
        console.log(`     → ${ext.shortName} (${ext.status}, scope=${ext.scope}, apply=${ext.applyUrl ?? "—"})`);
        continue;
      }
      if (!n.districtId) {
        skipped++;
        console.log(`  ⏭  ${label}  → no districtId`);
        continue;
      }
      const result = await syncExamFromNews(
        ext,
        { title: n.title, url: n.url, publishedAt: n.publishedAt },
        n.districtId
      );
      synced++;
      console.log(
        `  ✅ ${label}\n     → ${ext.shortName}: created ${result.created}, updated ${result.updated}, skipped ${result.skipped} across ${result.affectedDistricts} districts`
      );
    } catch (err) {
      failed++;
      console.error(`  ❌ ${label}\n     → ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\n📊 Result: extracted=${extracted}, synced=${synced}, skipped=${skipped}, failed=${failed}`);
  if (DRY_RUN) console.log("(dry-run: no DB writes)");
}

main()
  .catch((err) => {
    console.error("Fatal:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
