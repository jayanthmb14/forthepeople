/**
 * ForThePeople.in — Backfill InfraProject + InfraUpdate rows from
 *                   existing NewsItems.
 * Run: npx tsx scripts/backfill-infra-from-news.ts [--limit 10] [--dry-run]
 *
 * Walks infrastructure-tagged NewsItems (newest first), runs the same
 * extract → verify → sync pipeline the news cron uses, and produces
 * InfraUpdate timeline entries on existing or new InfraProject rows.
 *
 * Additionally: for any seed InfraProject with zero InfraUpdate rows
 * AND a source URL, create a synthetic "SEED" timeline entry so the
 * project card always has at least one link-backed data point.
 *
 * Cost guards:
 *   --limit default 10, hard-capped at 40
 *   --dry-run: no DB writes
 *   Free-tier AI via purpose="classify"
 *   Dedupe by newsUrl (InfraUpdate.newsUrl is a unique-ish source anchor)
 *   One failure never aborts the run
 */

import "./_env"; // MUST be first: loads .env + .env.local before any module reads process.env
import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import { extractVerifyAndSyncInfra } from "../src/lib/infra-sync";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const args = process.argv.slice(2);
function flagValue(flag: string, fallback: number): number {
  const i = args.indexOf(flag);
  if (i < 0) return fallback;
  const n = Number(args[i + 1]);
  return Number.isFinite(n) ? n : fallback;
}
const LIMIT = Math.max(1, Math.min(40, flagValue("--limit", 10)));
const DRY_RUN = args.includes("--dry-run");

// Cheap filter to pre-select candidates before the AI tax
const KEYWORD_RE =
  /\b(road|bridge|metro|rail|flyover|overbridge|underpass|highway|nh-\d|nhai|mmrda|bmc|pwd|tender|construction|project|phase|corridor|port|airport|hospital|sewage|sewer|water\s+supply|housing|pmay|nmrcl|nhspl|sanitation|infrastructure)\b/i;

function normalizeKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 6)
    .join(" ");
}

async function main() {
  console.log(`📝 Infrastructure backfill starting (limit=${LIMIT}, dryRun=${DRY_RUN})\n`);

  const since = new Date(Date.now() - 180 * 86_400_000); // last 180 days
  const candidates = await prisma.newsItem.findMany({
    where: {
      publishedAt: { gte: since },
      districtId: { not: null },
      OR: [
        { targetModule: "infrastructure" },
        { title: { contains: "project", mode: "insensitive" } },
        { title: { contains: "metro", mode: "insensitive" } },
        { title: { contains: "highway", mode: "insensitive" } },
        { title: { contains: "flyover", mode: "insensitive" } },
        { title: { contains: "bridge", mode: "insensitive" } },
        { title: { contains: "construction", mode: "insensitive" } },
        { title: { contains: "tender", mode: "insensitive" } },
      ],
    },
    select: {
      id: true, title: true, url: true, source: true,
      publishedAt: true, districtId: true, targetModule: true,
    },
    orderBy: { publishedAt: "desc" },
    take: 250,
  });

  const seen = new Set<string>();
  const queue: typeof candidates = [];
  for (const n of candidates) {
    if (!KEYWORD_RE.test(n.title)) continue;
    const key = normalizeKey(n.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    queue.push(n);
    if (queue.length >= LIMIT) break;
  }

  console.log(`  ${candidates.length} candidates scanned, ${queue.length} picked for AI extraction\n`);

  let synced = 0;
  let skipped = 0;
  let failed = 0;

  for (const n of queue) {
    const label = `[${n.publishedAt.toISOString().slice(0, 10)}] ${n.title.slice(0, 70)}…`;
    try {
      if (DRY_RUN) {
        console.log(`  👀 ${label}`);
        continue;
      }
      if (!n.districtId) {
        skipped++;
        console.log(`  ⏭  ${label}  → no districtId`);
        continue;
      }
      const result = await extractVerifyAndSyncInfra(
        { title: n.title, url: n.url, source: n.source, publishedAt: n.publishedAt },
        n.districtId
      );
      if (!result) {
        skipped++;
        console.log(`  ⏭  ${label}  → skipped (low confidence / verify fail)`);
        continue;
      }
      synced++;
      console.log(
        `  ✅ ${label}\n     → created ${result.created}, updated ${result.updatedProjects}, timeline +${result.timelineCreated}, dup ${result.duplicatesSkipped} across ${result.projectsTouched} districts`
      );
    } catch (err) {
      failed++;
      console.error(`  ❌ ${label}\n     → ${err instanceof Error ? err.message : err}`);
    }
  }

  // ── Phase 2: backfill a SEED timeline row for legacy projects that
  //             have zero InfraUpdate entries but do carry a source URL.
  if (!DRY_RUN) {
    const orphans = await prisma.infraProject.findMany({
      where: {
        source: { not: null },
        updates: { none: {} },
      },
      select: { id: true, name: true, source: true, startDate: true, updatedAt: true, districtId: true },
      take: 500,
    });
    let seeded = 0;
    for (const o of orphans) {
      if (!o.source) continue;
      await prisma.infraUpdate.create({
        data: {
          projectId: o.id,
          date: o.startDate ?? o.updatedAt ?? new Date(),
          headline: `Initial record for ${o.name}`,
          summary: `Seeded from the project's original source (${o.source}). News-driven updates will supersede this entry as articles appear.`,
          updateType: "SEED",
          newsUrl: o.source,
          verified: false,
        },
      });
      seeded++;
    }
    console.log(`\n  🌱 Seed timeline rows created for legacy projects: ${seeded}`);
  }

  console.log(`\n📊 Result: synced=${synced}, skipped=${skipped}, failed=${failed}`);
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
