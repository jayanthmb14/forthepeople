/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════
// GET /api/data/leader-news?district=mandya&id=<leaderId>&locale=kn
// ═══════════════════════════════════════════════════════════
// "In the news" for one person on the Leadership page's detail sheet:
// the latest 5 stories from this district's news that mention the
// person by name (title or summary, case-insensitive), one per story
// (duplicateOf null), from the last 180 days, newest first.
//
// Also returns the contact fields stored on the record (office phone,
// email) and the local-script name/role, which the shared leaders list
// does not carry. Read-only; rows guessed from news (source = article
// URL) are never served, same rule as the leaders list.
//
// Headlines are live text: with ?locale= the STORED translation is
// swapped in (src/lib/translation/overlay.ts), never a provider call.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheKey, cacheSet } from "@/lib/cache";
import { NOT_FROM_NEWS_OPTIONAL } from "@/lib/data-filters";
import { contentLocale } from "@/lib/translation/content";
import { localizeRows } from "@/lib/translation/overlay";
import { shownRoleLocal } from "@/lib/local-text";

const WINDOW_DAYS = 180;
const LIMIT = 5;
const TTL_SECONDS = 600;
const SLUG = /^[a-z0-9-]{2,64}$/;
const ID = /^[A-Za-z0-9_-]{6,40}$/;

export interface LeaderNewsItem {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  source: string;
  publisher: string | null;
  publishedAt: string;
  /** Language of title/summary: the page language once translated, else "en". */
  lang?: string;
}

export interface LeaderNewsPayload {
  leaderId: string;
  contact: { phone: string | null; email: string | null };
  nameLocal: string | null;
  roleLocal: string | null;
  windowDays: number;
  news: LeaderNewsItem[];
}

/**
 * The spellings to look for. "H.D. Kumaraswamy" is also written
 * "HD Kumaraswamy" and "H D Kumaraswamy" by different papers. Names that
 * are too short to be specific (under 5 letters) are skipped: they would
 * match unrelated stories.
 */
function nameVariants(name: string): string[] {
  const clean = name.trim().replace(/\s+/g, " ");
  if (!clean || clean.startsWith("[")) return [];
  const noDots = clean.replace(/\.\s*/g, " ").replace(/\s+/g, " ").trim();
  const joined = clean.replace(/\.\s*/g, "").replace(/\s+/g, " ").trim();
  return [...new Set([clean, noDots, joined])].filter((v) => v.replace(/[^\p{L}]/gu, "").length >= 5);
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const districtSlug = sp.get("district") ?? "";
  const stateSlug = sp.get("state") ?? "";
  const id = sp.get("id") ?? "";
  const locale = contentLocale(sp.get("locale"));

  if (!SLUG.test(districtSlug) || !ID.test(id) || (stateSlug && !SLUG.test(stateSlug))) {
    return NextResponse.json({ error: "district and id params required" }, { status: 400 });
  }

  const key = `${cacheKey(districtSlug, `leader-news:${id}`)}${locale ? `@${locale}` : ""}`;
  const cached = await cacheGet<{ data: LeaderNewsPayload | null; meta: Record<string, unknown> }>(key);
  if (cached) {
    const resp = NextResponse.json({ ...cached, meta: { ...cached.meta, fromCache: true } });
    resp.headers.set("Cache-Control", `public, s-maxage=${TTL_SECONDS}, stale-while-revalidate=${TTL_SECONDS * 2}`);
    return resp;
  }

  const meta = { module: "leader-news", district: districtSlug, updatedAt: new Date().toISOString(), fromCache: false };
  try {
    const district = await prisma.district.findFirst({
      where: stateSlug ? { slug: districtSlug, state: { slug: stateSlug } } : { slug: districtSlug },
      select: { id: true },
    });
    if (!district) return NextResponse.json({ data: null, meta: { ...meta, error: "District not found" } });

    const leader = await prisma.leader.findFirst({
      where: { id, districtId: district.id, active: true, ...NOT_FROM_NEWS_OPTIONAL },
      select: { id: true, name: true, nameLocal: true, role: true, roleLocal: true, phone: true, email: true },
    });
    if (!leader) return NextResponse.json({ data: null, meta: { ...meta, error: "Person not found" } });

    const variants = nameVariants(leader.name);
    // A local-script name is matched too, for papers that print it.
    if (leader.nameLocal && leader.nameLocal.trim().length >= 3) variants.push(leader.nameLocal.trim());

    const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000);
    const rows =
      variants.length === 0
        ? []
        : await prisma.newsItem.findMany({
            where: {
              districtId: district.id,
              duplicateOf: null,
              publishedAt: { gte: since },
              OR: variants.flatMap((v) => [
                { title: { contains: v, mode: "insensitive" as const } },
                { summary: { contains: v, mode: "insensitive" as const } },
              ]),
            },
            orderBy: { publishedAt: "desc" },
            take: LIMIT,
            select: { id: true, title: true, summary: true, url: true, source: true, publisher: true, publishedAt: true },
          });

    const news = await localizeRows(
      "news",
      rows.map((r) => ({ ...r, publishedAt: r.publishedAt.toISOString() })),
      locale,
    );

    const data: LeaderNewsPayload = {
      leaderId: leader.id,
      contact: { phone: leader.phone?.trim() || null, email: leader.email?.trim() || null },
      nameLocal: leader.nameLocal,
      roleLocal: shownRoleLocal(leader.role, leader.roleLocal),
      windowDays: WINDOW_DAYS,
      news,
    };
    const result = { data, meta };
    await cacheSet(key, result, TTL_SECONDS);
    const resp = NextResponse.json(result);
    resp.headers.set("Cache-Control", `public, s-maxage=${TTL_SECONDS}, stale-while-revalidate=${TTL_SECONDS * 2}`);
    return resp;
  } catch (err) {
    console.error("[api/data/leader-news] query failed:", err instanceof Error ? err.message : err);
    // Empty, never a 500: the sheet shows "no news" instead of breaking.
    return NextResponse.json({ data: null, meta: { ...meta, error: "query_failed" } });
  }
}
