/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: News — Google News RSS + The Hindu state/city feeds
// Schedule: daily (cron scrape-news, 06:00 UTC, vercel.json)
//
// v5 (Sept 2026 audit): queries and feeds use the district's OWN state
// (they said "Karnataka" for every district); the keyword classifier
// matches whole words; the AI classifier answers isAboutDistrict, and
// items it says are about another place are not saved or acted on; the
// caller can pass a deadline after which no AI call is started.
// Keyword tables and source lists live in src/lib/news-keywords.ts (pure).
// ═══════════════════════════════════════════════════════════
import * as cheerio from "cheerio";
import { prisma } from "@/lib/db";
import { classifyArticleWithAI, executeNewsAction } from "@/lib/news-action-engine";
import { logUpdate } from "@/lib/update-log";
import {
  buildNewsQueries,
  categorize,
  classifyModule,
  mentionsDistrict,
  mentionsOtherState,
  newsFeedsFor,
} from "@/lib/news-keywords";
import { JobContext, ScraperResult } from "../types";
import { findCanonicalStory, titleKey, type StoredStory } from "@/lib/news-dedupe";
import { urlKey } from "@/lib/dedupe/keys";

// Keyword-matcher categories that still benefit from AI-driven data extraction
// (because we act on them downstream — create Infrastructure projects, alerts,
// exam records, etc.). Purely informational categories skip the AI round-trip.
const ACTIONABLE_MODULES = [
  "infrastructure",
  "alerts",
  "exams",
  "staffing",
  "leaders",
  "police",
  "health",
  "power",
  "schemes",
];

function parseRSSDate(dateStr: string): Date {
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  } catch {
    return new Date();
  }
}

// Reject articles older than maxAgeDays, future-dated, or from year < current-1
function isArticleFresh(publishedDate: Date, maxAgeDays = 3): boolean {
  const now = new Date();
  const ageMs = now.getTime() - publishedDate.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays > maxAgeDays) return false;
  if (publishedDate > now) return false;
  if (publishedDate.getFullYear() < now.getFullYear() - 1) return false;
  return true;
}

// Extract publisher from Google News RSS description suffix, and clear
// summary when the cleaned text is just a repeat of the title.
function extractPublisherAndClean(
  rawSummary: string | undefined | null,
  title: string,
): { publisher: string | null; cleanedSummary: string | null } {
  if (!rawSummary) return { publisher: null, cleanedSummary: null };

  let publisher: string | null = null;
  let cleaned = rawSummary.trim();

  // Google News pattern: "<title>&nbsp;&nbsp;<Publisher>" or "  <Publisher>".
  const nbspMatch = cleaned.match(/&nbsp;&nbsp;(.+?)$/);
  const dblSpaceMatch = cleaned.match(/\s{2,}([^\s][^]+)$/);
  if (nbspMatch) {
    publisher = nbspMatch[1].trim();
    cleaned = cleaned.replace(nbspMatch[0], "").trim();
  } else if (dblSpaceMatch) {
    publisher = dblSpaceMatch[1].trim();
    cleaned = cleaned.replace(dblSpaceMatch[0], "").trim();
  }

  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);

  const finalSummary = !cleaned || norm(cleaned) === norm(title) ? null : cleaned;
  return { publisher, cleanedSummary: finalSummary };
}

/**
 * Same headline (first five long words) already stored for this district in
 * the last 7 days, or seen earlier in this run? Keys are computed the same
 * way for both (src/lib/news-dedupe.ts titleKey) — the old SQL `contains`
 * never matched a stored title with punctuation in it.
 */
function isTitleDuplicate(title: string, seenTitleKeys: Set<string>, storedKeys: ReadonlySet<string>): boolean {
  const key = titleKey(title);
  if (!key) return false;
  if (seenTitleKeys.has(key) || storedKeys.has(key)) return true;
  seenTitleKeys.add(key);
  return false;
}

async function fetchStaticRSSItems(
  sourceUrl: string,
  sourceName: string,
  districtName: string,
  filterByDistrict: boolean,
): Promise<Array<{
  headline: string; url: string; summary: string; source: string; publishedAt: Date;
}>> {
  const res = await fetch(sourceUrl, {
    headers: { "User-Agent": "ForThePeople.in News Aggregator (citizen transparency)" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return [];

  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });

  return $("item").toArray()
    .map((item) => ({
      headline: $(item).find("title").text().replace(/ - .*$/, "").trim(),
      url: $(item).find("link").text().trim() || $(item).find("guid").text().trim(),
      summary: $(item).find("description").text().replace(/<[^>]+>/g, "").slice(0, 300).trim(),
      source: sourceName,
      publishedAt: parseRSSDate($(item).find("pubDate").text().trim()),
    }))
    .filter((item) =>
      (!filterByDistrict || mentionsDistrict(`${item.headline} ${item.summary}`, districtName)) &&
      isArticleFresh(item.publishedAt)
    )
    .slice(0, 10);
}

async function fetchRSSItems(query: string): Promise<Array<{
  headline: string; url: string; summary: string; source: string; publishedAt: Date;
}>> {
  const encoded = encodeURIComponent(query);
  const rssUrl = `https://news.google.com/rss/search?q=${encoded}&hl=en-IN&gl=IN&ceid=IN:en`;

  const res = await fetch(rssUrl, {
    headers: { "User-Agent": "ForThePeople.in News Aggregator (citizen transparency)" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });

  return $("item").toArray().map((item) => ({
    headline: $(item).find("title").text().replace(/ - .*$/, "").trim(),
    url: $(item).find("link").text().trim() || $(item).find("guid").text().trim(),
    summary: $(item).find("description").text().replace(/<[^>]+>/g, "").slice(0, 300).trim(),
    source: $(item).find("source").text().trim() || "Google News",
    publishedAt: parseRSSDate($(item).find("pubDate").text().trim()),
  })).filter((item) => isArticleFresh(item.publishedAt));
}

/** At most this many AI classifications per district per run, so one busy
 *  district cannot use the whole run and the free model's daily cap lasts. */
const MAX_AI_PER_DISTRICT = 20;

export async function scrapeNews(
  ctx: JobContext,
  /** deadlineAt: nothing new starts after it. aiDeadlineAt: this district's
   *  share of the run — after it, articles get the keyword pass only. */
  opts: { deadlineAt?: number; aiDeadlineAt?: number } = {},
): Promise<ScraperResult> {
  const pastDeadline = () => opts.deadlineAt !== undefined && Date.now() >= opts.deadlineAt;
  const aiDeadline = opts.aiDeadlineAt ?? opts.deadlineAt;
  let aiCalls = 0;
  const aiUnavailable = () =>
    aiCalls >= MAX_AI_PER_DISTRICT || (aiDeadline !== undefined && Date.now() >= aiDeadline);
  try {
    const queries = buildNewsQueries(ctx.districtName, ctx.stateName);
    let aiSkippedForTime = 0;
    let placeCheckDeferred = 0;
    let offTopicSkipped = 0;
    const seenUrls = new Set<string>();
    const seenTitleKeys = new Set<string>();
    let newCount = 0;

    // Load existing URLs to avoid re-inserting
    const existingUrls = await prisma.newsItem.findMany({
      where: { districtId: ctx.districtId },
      select: { url: true },
    });
    // Keyed by urlKey (no www / tracking parameters / trailing slash): the same article, one row.
    existingUrls.forEach((n) => { if (n.url) seenUrls.add(urlKey(n.url)); });

    // The last 7 days of this district's stories: same-headline check and
    // the canonical story a new copy points at (duplicateOf).
    const recentStories: StoredStory[] = await prisma.newsItem.findMany({
      where: { districtId: ctx.districtId, publishedAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
      select: { id: true, title: true, publishedAt: true, duplicateOf: true },
      orderBy: { publishedAt: "asc" },
      take: 3000,
    });
    const storedTitleKeys = new Set(recentStories.map((r) => titleKey(r.title)).filter(Boolean));
    const placeWords = [ctx.districtName, ctx.districtSlug];

    async function saveItems(items: Array<{ headline: string; url: string; summary: string; source: string; publishedAt: Date }>, limit = 20) {
      for (const item of items.slice(0, limit)) {
        if (!item.headline || item.headline.length < 5) continue;
        if (!item.url) continue;
        if (seenUrls.has(urlKey(item.url))) continue;
        // Date freshness check (defensive — already filtered at fetch time)
        if (!isArticleFresh(item.publishedAt)) {
          ctx.log(`[News] SKIPPED (old): "${item.headline}" — ${item.publishedAt.toISOString()}`);
          continue;
        }
        // Title-based dedup: same story, different URL
        if (isTitleDuplicate(item.headline, seenTitleKeys, storedTitleKeys)) {
          ctx.log(`[News] SKIPPED (dup title): "${item.headline.slice(0, 60)}"`);
          continue;
        }
        seenUrls.add(urlKey(item.url));

        // Keyword-first (April 2026 cost rule): AI only when the keyword
        // matcher gives us nothing useful, when the article falls into an
        // actionable module (we want structured data), or when it may be
        // about another place (no district name, or another state named).
        const text = `${item.headline} ${item.summary ?? ""}`;
        const keywordModule = classifyModule(item.headline);
        const needsPlaceCheck =
          !mentionsDistrict(text, ctx.districtName) || mentionsOtherState(text, ctx.stateName);
        const needsAI =
          needsPlaceCheck ||
          keywordModule === "news" ||
          ACTIONABLE_MODULES.includes(keywordModule);

        let aiClassification: Awaited<ReturnType<typeof classifyArticleWithAI>> = null;
        if (needsAI && aiUnavailable()) {
          // Might be about another place and nobody checked: leave it for the
          // next run (its URL is not marked seen) rather than show it unchecked.
          if (needsPlaceCheck) {
            seenUrls.delete(urlKey(item.url));
            placeCheckDeferred++;
            continue;
          }
          aiSkippedForTime++;
        } else if (needsAI) {
          aiCalls++;
          aiClassification = await classifyArticleWithAI(
            item.headline,
            item.source,
            ctx.districtName,
            item.publishedAt,
            { stateName: ctx.stateName, summary: item.summary, deadlineAt: opts.deadlineAt },
          ).catch(() => null);
        }

        // The AI read it and says it is about another district/state: do not
        // show it on this district's page, and never act on it.
        if (aiClassification && !aiClassification.isAboutDistrict) {
          offTopicSkipped++;
          ctx.log(`[News] SKIPPED (not about ${ctx.districtName}): "${item.headline.slice(0, 60)}"`);
          continue;
        }

        const targetMod = aiClassification?.targetModule ?? keywordModule;
        const modAction = aiClassification?.moduleAction ?? "";
        const classifiedBy = aiClassification ? `ai:${aiClassification.model}`.slice(0, 120) : "keyword";

        // Extract publisher from RSS description suffix + clean summary if
        // it's just a title dupe (Google News pattern).
        const { publisher, cleanedSummary } = extractPublisherAndClean(
          item.summary,
          item.headline,
        );

        // The same story already stored within 24 h (reworded headline from
        // another outlet)? Then this row points at it (duplicateOf).
        const canonicalId = findCanonicalStory(item.headline, item.publishedAt, recentStories, placeWords);

        const saved = await prisma.newsItem.create({
          data: {
            districtId: ctx.districtId,
            title: item.headline,
            summary: cleanedSummary,
            originalSummary: item.summary || null,
            publisher,
            duplicateOf: canonicalId,
            source: item.source,
            url: item.url,
            category: categorize(item.headline),
            publishedAt: item.publishedAt,
            targetModule: targetMod,
            moduleAction: modAction || null,
            classifiedBy,
            classifiedAt: new Date(),
          },
        });
        recentStories.push({ id: saved.id, title: saved.title, publishedAt: saved.publishedAt, duplicateOf: saved.duplicateOf });

        // Execute module action only if the AI says it is about this district
        // and is confident (executeNewsAction checks both again).
        if (aiClassification && aiClassification.isAboutDistrict && aiClassification.confidence >= 0.60) {
          executeNewsAction({
            articleId: saved.id,
            articleTitle: item.headline,
            articleUrl: item.url,
            districtId: ctx.districtId,
            targetModule: aiClassification.targetModule,
            moduleAction: aiClassification.moduleAction,
            extractedData: aiClassification.extractedData,
            confidence: aiClassification.confidence,
            isAboutDistrict: aiClassification.isAboutDistrict,
          }).catch(() => {});
        }

        newCount++;
      }
    }

    for (const query of queries) {
      if (pastDeadline()) break;
      let items: Awaited<ReturnType<typeof fetchRSSItems>>;
      try {
        items = await fetchRSSItems(query);
      } catch (err) {
        ctx.log(`Query "${query}" failed: ${err instanceof Error ? err.message : String(err)}`);
        continue;
      }
      await saveItems(items, 20);
    }

    // Fixed feeds for the district's own city/state (The Hindu) + a Google
    // News "government" search. State-wide feeds keep only items naming the
    // district. (Deccan Herald's Karnataka feed was dropped: 404 since 2026.)
    const staticSources = newsFeedsFor(ctx.districtSlug, ctx.districtName, ctx.stateSlug, ctx.stateName);
    for (const src of staticSources) {
      if (pastDeadline()) break;
      try {
        const items = await fetchStaticRSSItems(src.url, src.sourceName, ctx.districtName, src.filterByDistrict);
        await saveItems(items, 10);
      } catch (err) {
        ctx.log(`Static source "${src.sourceName}" failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Keep only last 50 news items
    const old = await prisma.newsItem.findMany({
      where: { districtId: ctx.districtId },
      orderBy: { publishedAt: "desc" },
      skip: 50,
      select: { id: true },
    });
    if (old.length > 0) {
      await prisma.newsItem.deleteMany({ where: { id: { in: old.map((n) => n.id) } } });
    }

    const summary =
      `News: ${newCount} new items across ${queries.length} queries` +
      (offTopicSkipped ? `, ${offTopicSkipped} about other places skipped` : "") +
      (aiSkippedForTime ? `, ${aiSkippedForTime} classified by keyword only (time budget)` : "") +
      (placeCheckDeferred ? `, ${placeCheckDeferred} left for the next run (place not checked yet)` : "");
    ctx.log(summary);

    if (newCount > 0) {
      await logUpdate({
        source: "scraper",
        actorLabel: "cron",
        tableName: "NewsItem",
        recordId: `${ctx.districtId}:${Date.now()}`,
        action: "create",
        districtId: ctx.districtId,
        districtName: ctx.districtName,
        moduleName: "news",
        description: summary,
        recordCount: newCount,
      });
    }

    return { success: true, recordsNew: newCount, recordsUpdated: 0 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
