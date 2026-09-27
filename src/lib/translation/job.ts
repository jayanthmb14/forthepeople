/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════
// Translate-once job for LIVE text
// ═══════════════════════════════════════════════════════════
// Finds live text (news, AI insights) that has no stored translation for a
// target language — or whose English changed since it was translated — and
// translates it ONCE, storing the result in ContentTranslation.
//
// Called by:
//   /api/cron/translate-content    (scheduled catch-up, vercel.json)
//   /api/cron/scrape-news          (right after new articles land)
//   /api/cron/generate-insights    (right after new insights are written)
//
// Credit safety:
//   - never runs on a page request; visitors only read stored rows
//   - skips anything already translated from the same English (sourceHash)
//   - only recent, visible items (no duplicates, approved insights only)
//   - per-run cap TRANSLATION_MAX_CHARS_PER_RUN (default 60,000 characters)
//   - optional monthly cap TRANSLATION_MONTHLY_CHAR_LIMIT (Redis counter)
//   - no provider key → does nothing
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { getTranslationProvider, type TranslationProvider } from "./providers";
import { TRANSLATED_FIELDS, isMissingTable, sourceHash, translationTargets, type EntityType } from "./content";

const DAY = 86_400_000;

export interface TranslateRunResult {
  enabled: boolean;
  reason?: string;
  provider?: string;
  locales: string[];
  /** Text pieces × languages still missing before this run. */
  pending: number;
  pendingChars: number;
  translated: number;
  failed: number;
  chars: number;
  stoppedBy?: "run-cap" | "monthly-cap" | "time";
  errors: string[];
  probe?: string;
}

interface Piece {
  entityType: EntityType;
  entityId: string;
  field: string;
  text: string;
  hash: string;
}

function pieces(entityType: EntityType, rows: Record<string, unknown>[]): Piece[] {
  const out: Piece[] = [];
  for (const row of rows) {
    for (const field of TRANSLATED_FIELDS[entityType]) {
      const text = typeof row[field] === "string" ? (row[field] as string).trim() : "";
      if (text.length < 2) continue;
      out.push({ entityType, entityId: String(row.id), field, text, hash: sourceHash(text) });
    }
  }
  return out;
}

/** Everything a visitor can currently see, newest and most-read first. */
async function visiblePieces(newsDays: number): Promise<Piece[]> {
  const since = new Date(Date.now() - newsDays * DAY);
  const [news, moduleInsights, insights, indiaNews] = await Promise.all([
    prisma.newsItem.findMany({
      where: { duplicateOf: null, publishedAt: { gte: since } },
      orderBy: { publishedAt: "desc" },
      take: 600,
      select: { id: true, title: true, summary: true },
    }),
    prisma.aIModuleInsight.findMany({
      orderBy: { generatedAt: "desc" },
      take: 600,
      select: { id: true, opinion: true, recommendation: true },
    }),
    prisma.aIInsight.findMany({
      where: { approved: true },
      orderBy: { createdAt: "desc" },
      take: 300,
      select: { id: true, headline: true, summary: true },
    }),
    prisma.indiaModuleNews.findMany({
      where: { status: "active" },
      orderBy: { publishedAt: "desc" },
      take: 300,
      select: { id: true, headline: true, summary: true },
    }),
  ]);
  return [
    ...pieces("news", news),
    ...pieces("moduleInsight", moduleInsights),
    ...pieces("insight", insights),
    ...pieces("indiaNews", indiaNews),
  ];
}

function monthKey(): string {
  return `ftp:translate:chars:${new Date().toISOString().slice(0, 7)}`;
}

async function monthlyCharsUsed(): Promise<number> {
  if (!redis) return 0;
  try {
    return Number((await redis.get<number>(monthKey())) ?? 0);
  } catch {
    return 0;
  }
}

async function addMonthlyChars(n: number): Promise<void> {
  if (!redis || n <= 0) return;
  try {
    await redis.incrby(monthKey(), n);
    await redis.expire(monthKey(), 40 * DAY / 1000);
  } catch {
    /* counter is best-effort */
  }
}

export async function translatePendingContent(opts: {
  /** Stop after this many ms (leave room inside the cron's maxDuration). */
  budgetMs?: number;
  maxChars?: number;
  newsDays?: number;
  /** Plan only: count what is missing and make one tiny test call. */
  dry?: boolean;
} = {}): Promise<TranslateRunResult> {
  const locales = translationTargets();
  const result: TranslateRunResult = {
    enabled: false, locales, pending: 0, pendingChars: 0, translated: 0, failed: 0, chars: 0, errors: [],
  };

  const provider = getTranslationProvider();
  if (!provider) {
    result.reason = "No translation provider key set (see .env.example: TRANSLATION_PROVIDER).";
    return result;
  }
  if (locales.length === 0) {
    result.reason = "No non-English language is switched on.";
    return result;
  }
  result.enabled = true;
  result.provider = provider.name;

  const deadline = Date.now() + (opts.budgetMs ?? 240_000);
  const runCap = opts.maxChars ?? Number(process.env.TRANSLATION_MAX_CHARS_PER_RUN || 60_000);
  const monthCap = Number(process.env.TRANSLATION_MONTHLY_CHAR_LIMIT || 0);
  const monthUsed = monthCap ? await monthlyCharsUsed() : 0;

  // 1. What is visible, and what is already translated from the same English.
  let all: Piece[];
  let done: Set<string>;
  try {
    all = await visiblePieces(opts.newsDays ?? 14);
    const existing = await prisma.contentTranslation.findMany({
      where: {
        entityId: { in: [...new Set(all.map((p) => p.entityId))] },
        locale: { in: locales },
      },
      select: { entityType: true, entityId: true, field: true, locale: true, sourceHash: true },
    });
    done = new Set(existing.map((e) => `${e.entityType}|${e.entityId}|${e.field}|${e.locale}|${e.sourceHash}`));
  } catch (err) {
    result.enabled = false;
    result.reason = isMissingTable(err)
      ? "ContentTranslation table missing: run `npm run db:push` once."
      : `Could not read content: ${err instanceof Error ? err.message : String(err)}`;
    return result;
  }

  const todo: { piece: Piece; locale: string }[] = [];
  for (const piece of all) {
    for (const locale of locales) {
      if (provider.unsupported.has(locale)) continue;
      if (!done.has(`${piece.entityType}|${piece.entityId}|${piece.field}|${locale}|${piece.hash}`)) {
        todo.push({ piece, locale });
      }
    }
  }
  result.pending = todo.length;
  result.pendingChars = todo.reduce((s, t) => s + t.piece.text.length, 0);

  if (opts.dry) {
    try {
      const [probe] = await provider.translate(["Your district. Your data."], locales[0]);
      result.probe = probe;
    } catch (err) {
      result.errors.push(`probe ${locales[0]}: ${err instanceof Error ? err.message : String(err)}`);
    }
    return result;
  }

  // 2. Translate in per-language batches, oldest-visible last.
  const queues = new Map<string, Piece[]>();
  const deadLocales = new Set<string>();

  async function flush(locale: string, p: TranslationProvider): Promise<void> {
    const batch = queues.get(locale) ?? [];
    queues.set(locale, []);
    if (batch.length === 0 || deadLocales.has(locale)) return;
    try {
      const out = await p.translate(batch.map((b) => b.text), locale);
      await prisma.$transaction(
        batch.map((b, i) =>
          prisma.contentTranslation.upsert({
            where: {
              entityType_entityId_field_locale: { entityType: b.entityType, entityId: b.entityId, field: b.field, locale },
            },
            create: {
              entityType: b.entityType, entityId: b.entityId, field: b.field, locale,
              text: out[i], sourceHash: b.hash, provider: p.name,
            },
            update: { text: out[i], sourceHash: b.hash, provider: p.name },
          }),
        ),
      );
      const n = batch.reduce((s, b) => s + b.text.length, 0);
      result.translated += batch.length;
      result.chars += n;
      await addMonthlyChars(n);
    } catch (err) {
      result.failed += batch.length;
      const msg = `${locale}: ${err instanceof Error ? err.message : String(err)}`.slice(0, 240);
      if (result.errors.length < 10) result.errors.push(msg);
      // Two failures in a row for a language → stop spending on it this run.
      if (result.errors.filter((e) => e.startsWith(`${locale}:`)).length >= 2) deadLocales.add(locale);
    }
  }

  let planned = 0;
  for (const { piece, locale } of todo) {
    if (Date.now() > deadline) { result.stoppedBy = "time"; break; }
    if (planned + piece.text.length > runCap) { result.stoppedBy = "run-cap"; break; }
    if (monthCap && monthUsed + planned + piece.text.length > monthCap) { result.stoppedBy = "monthly-cap"; break; }
    if (deadLocales.has(locale) || piece.text.length > provider.maxBatchChars) continue;

    const q = queues.get(locale) ?? [];
    const qChars = q.reduce((s, b) => s + b.text.length, 0);
    if (q.length >= provider.maxBatchItems || qChars + piece.text.length > provider.maxBatchChars) {
      await flush(locale, provider);
    }
    (queues.get(locale) ?? queues.set(locale, []).get(locale)!).push(piece);
    planned += piece.text.length;
  }
  for (const locale of queues.keys()) {
    if (Date.now() > deadline) { result.stoppedBy = "time"; break; }
    await flush(locale, provider);
  }
  return result;
}
