/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Exam news API — /api/data/exam-news?district=&state=[&locale=]
// ═══════════════════════════════════════════════════════════
// Read-only. For every exam shown on a district's Exams page, the news
// headlines that mention it, so the exam's detail sheet can say "in the
// news". A headline belongs to an exam when:
//   • its URL is one of the exam's sourceUrls (the news items that fed
//     the exam record in src/lib/exam-sync.ts), or
//   • it contains the exam's short name ("SSC MTS 2026"), or that name
//     without the year when at least two words are left ("SSC MTS").
// Only exam-tagged news (targetModule = "exams", any district, since
// national exams are reported everywhere) plus the exams' own source URLs
// are searched, from the last 180 days, near-duplicates excluded.
//
// Response: { data: { byExam: { [examId]: ExamNewsItem[] } }, meta }
// Headlines are English unless a stored translation exists (?locale=kn),
// the same overlay /api/data/news uses. Cache: 30 min in Redis.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheKey, cacheSet } from "@/lib/cache";
import { contentLocale } from "@/lib/translation/content";
import { localizeRows } from "@/lib/translation/overlay";
import { publicCacheControl } from "@/lib/read-api";

const TTL_SECONDS = 1800;
const LOOKBACK_DAYS = 180;
const PER_EXAM = 5;

interface ExamNewsItem {
  id: string;
  title: string;
  url: string;
  publisher: string | null;
  source: string;
  publishedAt: string;
  /** Language of `title`: the requested locale once translated, else "en". */
  lang?: string;
}

/** Lower-case, letters and digits only, single spaces, padded for whole-word matching. */
function norm(text: string): string {
  return ` ${text.toLowerCase().replace(/&amp;/g, "&").replace(/[^\p{L}\p{N}]+/gu, " ").trim()} `;
}

/** The phrases that identify an exam in a headline (already normalised). */
function examTerms(shortName: string | null): string[] {
  if (!shortName) return [];
  const full = norm(shortName);
  const terms = new Set<string>();
  if (full.trim().split(" ").length >= 2) terms.add(full);
  const noYear = norm(shortName.replace(/\b(19|20)\d{2}(\s*[-–/]\s*\d{2,4})?\b/g, " "));
  if (noYear.trim().split(" ").length >= 2) terms.add(noYear);
  return [...terms];
}

function urlList(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((u): u is string => typeof u === "string" && u.length > 0) : [];
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const districtSlug = sp.get("district") ?? "";
  const locale = contentLocale(sp.get("locale"));
  if (!districtSlug) {
    return NextResponse.json({ error: "district param required" }, { status: 400 });
  }

  const baseKey = cacheKey(districtSlug, "exam-news");
  const key = locale ? `${baseKey}@${locale}` : baseKey;
  const cached = await cacheGet<{ data: unknown; meta: Record<string, unknown> }>(key);
  if (cached) {
    const resp = NextResponse.json({ ...cached, meta: { ...cached.meta, fromCache: true } });
    resp.headers.set("Cache-Control", publicCacheControl(TTL_SECONDS));
    return resp;
  }

  try {
    const now = new Date();
    const meta = { module: "exam-news", district: districtSlug, updatedAt: now.toISOString(), fromCache: false, locale };

    const district = await prisma.district.findFirst({
      where: { slug: districtSlug },
      select: { id: true, stateId: true },
    });
    if (!district) {
      return NextResponse.json({ data: null, meta: { ...meta, error: "District not found" } });
    }

    // The same exams the Exams page lists (national + this state + this district).
    const exams = await prisma.governmentExam.findMany({
      where: {
        OR: [{ level: "national" }, { level: "state", stateId: district.stateId }, { districtId: district.id }],
      },
      select: { id: true, shortName: true, sourceUrls: true },
    });

    const sourceUrls = [...new Set(exams.flatMap((e) => urlList(e.sourceUrls)))];
    const since = new Date(now.getTime() - LOOKBACK_DAYS * 86_400_000);
    const rows = await prisma.newsItem.findMany({
      where: {
        duplicateOf: null,
        publishedAt: { gte: since },
        OR: [{ targetModule: "exams" }, ...(sourceUrls.length ? [{ url: { in: sourceUrls } }] : [])],
      },
      orderBy: { publishedAt: "desc" },
      take: 400,
      select: { id: true, title: true, url: true, publisher: true, source: true, publishedAt: true },
    });

    // One row per story: the same headline arrives from many districts' feeds.
    const seen = new Set<string>();
    const stories = rows.filter((r) => {
      const k = norm(r.title);
      if (seen.has(k) || seen.has(r.url)) return false;
      seen.add(k);
      seen.add(r.url);
      return true;
    });
    const normTitles = new Map(stories.map((s) => [s.id, norm(s.title)]));

    const byExamRows = new Map<string, typeof stories>();
    for (const exam of exams) {
      const urls = new Set(urlList(exam.sourceUrls));
      const terms = examTerms(exam.shortName);
      if (urls.size === 0 && terms.length === 0) continue;
      const hits = stories
        .filter((s) => urls.has(s.url) || terms.some((term) => (normTitles.get(s.id) ?? "").includes(term)))
        .slice(0, PER_EXAM);
      if (hits.length) byExamRows.set(exam.id, hits);
    }

    // Stored translations of the headlines (one query), when a language is asked for.
    const matched = [...new Map([...byExamRows.values()].flat().map((r) => [r.id, r])).values()];
    const localized = await localizeRows("news", matched, locale);
    const byId = new Map(localized.map((r) => [r.id, r]));

    const byExam: Record<string, ExamNewsItem[]> = {};
    for (const [examId, hits] of byExamRows) {
      byExam[examId] = hits.map((h) => {
        const r = byId.get(h.id) ?? h;
        return {
          id: h.id,
          title: r.title,
          url: h.url,
          publisher: h.publisher,
          source: h.source,
          publishedAt: h.publishedAt.toISOString(),
          ...("lang" in r && r.lang ? { lang: r.lang as string } : {}),
        };
      });
    }

    const result = { data: { byExam }, meta };
    await cacheSet(key, result, TTL_SECONDS);
    const resp = NextResponse.json(result);
    resp.headers.set("Cache-Control", publicCacheControl(TTL_SECONDS));
    return resp;
  } catch (err) {
    console.error("[API] exam-news error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
