/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════
// GET /api/data/responsibility-news?district=mandya&state=karnataka&locale=kn
// ═══════════════════════════════════════════════════════════
// "Because of what's in the news this week" on the What-you-can-do page.
// Counts this district's news from the last 14 days by topic, using the
// rule table in src/lib/civic/news-topics.ts (headline keywords, then the
// pipeline's targetModule, then its category — no AI call), and returns
// the topics busiest first with their 3 latest headlines.
//
// One story per event: rows marked duplicateOf are skipped and reworded
// copies of the same story are folded (src/lib/news-dedupe.ts). Read-only.
// Headlines are live text: with ?locale= the STORED translation is
// swapped in, never a provider call.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheKey, cacheSet } from "@/lib/cache";
import { dedupeStories } from "@/lib/news-dedupe";
import { topicOf, type NewsTopicId } from "@/lib/civic/news-topics";
import { contentLocale } from "@/lib/translation/content";
import { localizeRows } from "@/lib/translation/overlay";
import { publicCacheControl } from "@/lib/read-api";

const WINDOW_DAYS = 14;
const HEADLINES_PER_TOPIC = 3;
const TTL_SECONDS = 900;
const SLUG = /^[a-z0-9-]{2,64}$/;

export interface TopicHeadline {
  id: string;
  title: string;
  url: string;
  source: string;
  publisher: string | null;
  publishedAt: string;
  /** Language of the title: the page language once translated, else "en". */
  lang?: string;
}

export interface NewsTopicCount {
  topic: NewsTopicId;
  count: number;
  headlines: TopicHeadline[];
}

export interface ResponsibilityNewsPayload {
  windowDays: number;
  /** Stories in the window (after folding duplicates), with or without a topic. */
  totalStories: number;
  /** Stories that fell into a topic. */
  topicalStories: number;
  /** Newest story in the window, for the "as of" line. */
  latestAt: string | null;
  topics: NewsTopicCount[];
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const districtSlug = sp.get("district") ?? "";
  const stateSlug = sp.get("state") ?? "";
  const locale = contentLocale(sp.get("locale"));
  if (!SLUG.test(districtSlug) || (stateSlug && !SLUG.test(stateSlug))) {
    return NextResponse.json({ error: "district param required" }, { status: 400 });
  }

  const key = `${cacheKey(districtSlug, "responsibility-news")}${locale ? `@${locale}` : ""}`;
  const cached = await cacheGet<{ data: ResponsibilityNewsPayload | null; meta: Record<string, unknown> }>(key);
  if (cached) {
    const resp = NextResponse.json({ ...cached, meta: { ...cached.meta, fromCache: true } });
    resp.headers.set("Cache-Control", publicCacheControl(TTL_SECONDS));
    return resp;
  }

  const meta = { module: "responsibility-news", district: districtSlug, updatedAt: new Date().toISOString(), fromCache: false };
  try {
    const district = await prisma.district.findFirst({
      where: stateSlug ? { slug: districtSlug, state: { slug: stateSlug } } : { slug: districtSlug },
      select: { id: true, name: true },
    });
    if (!district) return NextResponse.json({ data: null, meta: { ...meta, error: "District not found" } });

    const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000);
    const rows = await prisma.newsItem.findMany({
      where: { districtId: district.id, duplicateOf: null, publishedAt: { gte: since } },
      orderBy: { publishedAt: "desc" },
      take: 300,
      select: { id: true, title: true, url: true, source: true, publisher: true, publishedAt: true, category: true, targetModule: true },
    });
    const stories = dedupeStories(rows, [districtSlug, district.name]);

    const byTopic = new Map<NewsTopicId, typeof stories>();
    for (const s of stories) {
      const topic = topicOf(s);
      if (!topic) continue;
      const list = byTopic.get(topic) ?? [];
      list.push(s);
      byTopic.set(topic, list);
    }

    const ranked = [...byTopic.entries()].sort((a, b) => b[1].length - a[1].length || b[1][0].publishedAt.getTime() - a[1][0].publishedAt.getTime());
    // Translate only the headlines that will be shown.
    const shown = ranked.flatMap(([, list]) => list.slice(0, HEADLINES_PER_TOPIC));
    const localized = await localizeRows(
      "news",
      shown.map((s) => ({ id: s.id, title: s.title, url: s.url, source: s.source, publisher: s.publisher, publishedAt: s.publishedAt.toISOString() })),
      locale,
    );
    const byId = new Map(localized.map((h) => [h.id, h]));

    const data: ResponsibilityNewsPayload = {
      windowDays: WINDOW_DAYS,
      totalStories: stories.length,
      topicalStories: ranked.reduce((n, [, list]) => n + list.length, 0),
      latestAt: stories[0]?.publishedAt.toISOString() ?? null,
      topics: ranked.map(([topic, list]) => ({
        topic,
        count: list.length,
        headlines: list
          .slice(0, HEADLINES_PER_TOPIC)
          .map((s) => byId.get(s.id))
          .filter((h): h is TopicHeadline => Boolean(h)),
      })),
    };
    const result = { data, meta };
    await cacheSet(key, result, TTL_SECONDS);
    const resp = NextResponse.json(result);
    resp.headers.set("Cache-Control", publicCacheControl(TTL_SECONDS));
    return resp;
  } catch (err) {
    console.error("[api/data/responsibility-news] query failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ data: null, meta: { ...meta, error: "query_failed" } });
  }
}
