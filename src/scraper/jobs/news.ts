/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: News — Google News RSS feed
// Schedule: Every 1 hour
// ═══════════════════════════════════════════════════════════
import * as cheerio from "cheerio";
import { prisma } from "@/lib/db";
import { classifyArticleWithAI, executeNewsAction } from "@/lib/news-action-engine";
import { logUpdate } from "@/lib/update-log";

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
import { JobContext, ScraperResult } from "../types";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  politics: ["election", "mla", "mp", "bjp", "congress", "party", "minister", "vote", "rally"],
  development: ["project", "scheme", "fund", "tender", "launch", "inaugurate", "development"],
  agriculture: ["crop", "farmer", "agri", "harvest", "sugar", "paddy", "mandi", "market"],
  crime: ["arrest", "murder", "theft", "robbery", "fraud", "police", "fir", "accused"],
  health: ["hospital", "health", "doctor", "disease", "covid", "dengue", "treatment"],
  education: ["school", "college", "exam", "result", "student", "education", "teacher"],
  infrastructure: ["road", "bridge", "water", "power", "electricity", "construction", "nh"],
  weather: ["rain", "flood", "drought", "storm", "temperature", "weather"],
};

// NOTE: precedence matters — first match wins. "transport" sits ABOVE crops,
// police, and generic categories so that specific train/metro keywords like
// "vande bharat" or "mumbai local" win over incidental "agri"/"crime" mentions.
const MODULE_KEYWORDS: Array<[string, string[]]> = [
  ["leaders",        ["mla", "mp", "minister", "collector", "sp police", "deputy commissioner", "dc ", "elected", "appointment", "sworn in", "cabinet", "official"]],
  ["infrastructure", ["road", "bridge", "highway", "nh-", "overbridge", "underpass", "construction", "inaugurate", "flyover", "project"]],
  ["transport",      [
    // Core + existing
    "bus", "transport", "ksrtc", "railway", "metro", "taxi", "auto", "road accident", "traffic",
    // Rail services — named trains (these were being misclassified as crops)
    "vande bharat", "shatabdi", "rajdhani", "duronto", "tejas", "jan shatabdi",
    // Mumbai-specific suburban rail + buses
    "local train", "mumbai local", "suburban", "suburban rail", "wr local", "cr local",
    "best bus", "best undertaking", "monorail", "metro line",
    // Commuter / crowding — previously snagged by "police/crime"
    "commuter", "commuters", "overcrowding", "overcrowded", "stampede at station",
    // Generic rail
    "train", "platform", "station", "irctc",
  ]],
  ["budget",         ["budget", "fund", "crore", "lakh", "allocation", "grant", "expenditure", "revenue", "deficit", "treasury"]],
  ["water",          ["dam", "reservoir", "water level", "krishnaraja sagar", "krs", "kabini", "irrigation", "cauvery", "drinking water supply"]],
  ["crops",          ["crop", "farmer", "paddy", "sugarcane", "mandi price", "apmc", "harvest", "agri", "ragi", "tomato price", "onion price"]],
  ["weather",        ["rain", "flood", "drought", "cyclone", "storm", "temperature", "imd", "monsoon", "heatwave"]],
  ["police",         ["police", "arrest", "fir", "crime", "murder", "theft", "robbery", "accused", "case registered", "custody", "sp ", "ips officer"]],
  ["elections",      ["election", "vote", "polling", "candidate", "bjp", "congress", "jds", "bypoll", "constituency", "electoral"]],
  ["education",      ["school", "college", "university", "exam", "result", "student", "teacher", "sylhet", "sslc", "puc result"]],
  ["health",         ["hospital", "health", "doctor", "disease", "dengue", "malaria", "covid", "vaccination", "primary health centre", "phc"]],
  ["schemes",        ["scheme", "yojana", "pmay", "mgnrega", "welfare", "beneficiary", "pension", "ration card", "anna bhagya"]],
  ["housing",        ["housing", "house", "flat", "apartment", "pmay", "slum", "eviction", "shelter"]],
  ["power",          ["power cut", "electricity", "outage", "load shedding", "substation", "bescom", "mescom", "voltage", "power supply"]],
  ["courts",         ["court", "hc order", "high court", "supreme court", "verdict", "judgment", "bail", "hearing", "legal"]],
  ["jjm",            ["jal jeevan", "jjm", "tap water", "household water connection", "piped water"]],
  ["gram-panchayat", ["panchayat", "gram sabha", "village council", "grama panchayati", "taluk panchayat", "zilla panchayat"]],
  ["alerts",         ["alert", "red alert", "orange alert", "warning", "emergency", "disaster", "rescue", "ndrf"]],
  ["sugar-factory",  ["sugar factory", "sugar mill", "sugarcane crushing", "mandya sugar", "mysore sugar"]],
  ["rti",            ["rti", "right to information", "transparency", "public information officer"]],
];

function categorize(headline: string): string {
  const lower = headline.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return "general";
}

function classifyModule(headline: string): string | null {
  const lower = headline.toLowerCase();
  for (const [module, keywords] of MODULE_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) return module;
  }
  return "news";
}

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

// Near-duplicate check at ingest: returns canonical id if one exists within
// 24h sharing the same first-40-char normalized title prefix.
async function findNearDuplicateCanonical(
  title: string,
  districtId: string,
  publishedAt: Date,
): Promise<string | null> {
  const prefix = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
  if (!prefix || prefix.length < 15) return null;

  const DAY_MS = 24 * 60 * 60 * 1000;
  const candidate = await prisma.newsItem.findFirst({
    where: {
      districtId,
      duplicateOf: null,
      publishedAt: {
        gte: new Date(publishedAt.getTime() - DAY_MS),
        lte: new Date(publishedAt.getTime() + DAY_MS),
      },
      title: { contains: prefix, mode: "insensitive" },
    },
    orderBy: { publishedAt: "asc" },
    select: { id: true },
  });
  return candidate?.id ?? null;
}

// Dedup by first 5 significant words in title — catches same article via different URLs
async function isTitleDuplicate(
  title: string,
  districtId: string,
  seenTitleKeys: Set<string>
): Promise<boolean> {
  const normalized = title.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const words = normalized.split(/\s+/).filter((w) => w.length > 3);
  const key = words.slice(0, 5).join(" ");
  if (!key) return false;
  if (seenTitleKeys.has(key)) return true;
  seenTitleKeys.add(key);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const existing = await prisma.newsItem.findFirst({
    where: {
      districtId,
      publishedAt: { gte: sevenDaysAgo },
      title: { contains: key, mode: "insensitive" },
    },
    select: { id: true },
  });
  return !!existing;
}

function buildQueries(districtSlug: string, stateName: string): string[] {
  const name = districtSlug.replace(/-/g, " ");
  return [
    `${name} ${stateName}`,
    `${name} district news`,
    `${name} ${stateName} latest`,
  ];
}

// Static RSS sources filtered by district name match
function buildStaticSources(districtName: string, stateName: string): Array<{ url: string; sourceName: string }> {
  return [
    { url: `https://www.thehindu.com/news/national/karnataka/feeder/default.rss`, sourceName: "The Hindu" },
    { url: `https://www.deccanherald.com/rss/karnataka.rss`, sourceName: "Deccan Herald" },
    { url: `https://news.google.com/rss/search?q=${encodeURIComponent(districtName + " " + stateName + " government")}&hl=en-IN&gl=IN&ceid=IN:en`, sourceName: "Google News" },
  ];
}

async function fetchStaticRSSItems(sourceUrl: string, sourceName: string, districtName: string): Promise<Array<{
  headline: string; url: string; summary: string; source: string; publishedAt: Date;
}>> {
  const res = await fetch(sourceUrl, {
    headers: { "User-Agent": "ForThePeople.in News Aggregator (citizen transparency)" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return [];

  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });
  const districtLower = districtName.toLowerCase();

  return $("item").toArray()
    .map((item) => ({
      headline: $(item).find("title").text().replace(/ - .*$/, "").trim(),
      url: $(item).find("link").text().trim() || $(item).find("guid").text().trim(),
      summary: $(item).find("description").text().replace(/<[^>]+>/g, "").slice(0, 300).trim(),
      source: sourceName,
      publishedAt: parseRSSDate($(item).find("pubDate").text().trim()),
    }))
    .filter((item) =>
      (item.headline.toLowerCase().includes(districtLower) ||
       item.summary.toLowerCase().includes(districtLower)) &&
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

export async function scrapeNews(ctx: JobContext): Promise<ScraperResult> {
  try {
    const queries = buildQueries(ctx.districtSlug, ctx.stateName);
    const seenUrls = new Set<string>();
    const seenTitleKeys = new Set<string>();
    let newCount = 0;

    // Load existing URLs to avoid re-inserting
    const existingUrls = await prisma.newsItem.findMany({
      where: { districtId: ctx.districtId },
      select: { url: true },
    });
    existingUrls.forEach((n) => { if (n.url) seenUrls.add(n.url); });

    async function saveItems(items: Array<{ headline: string; url: string; summary: string; source: string; publishedAt: Date }>, limit = 20) {
      for (const item of items.slice(0, limit)) {
        if (!item.headline || item.headline.length < 5) continue;
        if (!item.url) continue;
        if (seenUrls.has(item.url)) continue;
        // Date freshness check (defensive — already filtered at fetch time)
        if (!isArticleFresh(item.publishedAt)) {
          ctx.log(`[News] SKIPPED (old): "${item.headline}" — ${item.publishedAt.toISOString()}`);
          continue;
        }
        // Title-based dedup: same story, different URL
        if (await isTitleDuplicate(item.headline, ctx.districtId, seenTitleKeys)) {
          ctx.log(`[News] SKIPPED (dup title): "${item.headline.slice(0, 60)}"`);
          continue;
        }
        seenUrls.add(item.url);

        // April 13, 2026 — cost optimisation: keyword-first, AI only when
        // keyword matcher gives us nothing useful OR when the article falls
        // into an actionable module (infrastructure/alerts/exams/etc.) where
        // we want structured data extraction from the AI.
        const keywordModule = classifyModule(item.headline);
        const needsAI =
          !keywordModule ||
          keywordModule === "news" ||
          ACTIONABLE_MODULES.includes(keywordModule);

        const aiClassification = needsAI
          ? await classifyArticleWithAI(
              item.headline,
              item.source,
              ctx.districtName,
              item.publishedAt
            ).catch(() => null)
          : null;

        const targetMod = aiClassification?.targetModule ?? keywordModule ?? "news";
        const modAction = aiClassification?.moduleAction ?? "";
        const classifiedBy = aiClassification?.provider ?? "keyword";

        // Extract publisher from RSS description suffix + clean summary if
        // it's just a title dupe (Google News pattern).
        const { publisher, cleanedSummary } = extractPublisherAndClean(
          item.summary,
          item.headline,
        );

        // Check for near-duplicates (same district, same 40-char prefix,
        // within 24h) already persisted.
        const canonicalId = await findNearDuplicateCanonical(
          item.headline,
          ctx.districtId,
          item.publishedAt,
        );

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

        // Execute module action if AI classified with confidence
        if (aiClassification && aiClassification.confidence >= 0.60) {
          executeNewsAction({
            articleId: saved.id,
            articleTitle: item.headline,
            articleUrl: item.url,
            districtId: ctx.districtId,
            targetModule: aiClassification.targetModule,
            moduleAction: aiClassification.moduleAction,
            extractedData: aiClassification.extractedData,
            confidence: aiClassification.confidence,
          }).catch(() => {});
        }

        newCount++;
      }
    }

    for (const query of queries) {
      let items: Awaited<ReturnType<typeof fetchRSSItems>>;
      try {
        items = await fetchRSSItems(query);
      } catch (err) {
        ctx.log(`Query "${query}" failed: ${err instanceof Error ? err.message : String(err)}`);
        continue;
      }
      await saveItems(items, 20);
    }

    // Additional static sources (The Hindu, Deccan Herald) — filtered by district name
    const staticSources = buildStaticSources(ctx.districtName, ctx.stateName);
    for (const src of staticSources) {
      try {
        const items = await fetchStaticRSSItems(src.url, src.sourceName, ctx.districtName);
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

    const summary = `News: ${newCount} new items across ${queries.length} queries`;
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
