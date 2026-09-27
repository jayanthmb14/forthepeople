/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
// GET /api/data/glance?district=mandya&state=karnataka
//
// The few facts the glance row shows on every district page, in one small
// cached response (instead of six full module payloads on every page):
//   collector  { name, role }            Leader rows (same filter as /leaders)
//   mp         { name, party }
//   population { value, dataset, year, estimate }  DemographicProfile, else
//                                        the District row (an estimate)
//   projects   { active, total }         InfraProject, LOCAL_INFRA, renamings
//                                        left out; active = stage "building"
//                                        (under construction / ongoing), the
//                                        same rule as the Projects page and
//                                        the home map — never proposed or
//                                        approved work
//   budget     { allocated, fiscalYear, estimate }  newest financial year
//   election   { type, label, date, approximate }   next ElectionEvent
//   grade      { grade, score, generatedAt }        only while not expired
//   alerts     { active, topSeverity, topTitle }
// Every field is null when there is nothing honest to show. Read-only.
// ═══════════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheKey, cacheSet } from "@/lib/cache";
import { LOCAL_INFRA, NOT_FROM_NEWS_OPTIONAL, NOT_SEEDED_BUDGET, OFFICIAL_ALERT } from "@/lib/data-filters";
import type { GlanceData } from "@/components/district/shell/glance-types";
import { isNonProject, projectStage } from "@/lib/civic/project-facts";
import { isCollectorRole } from "@/lib/leader-roles";

export const runtime = "nodejs";

const CACHE_SECONDS = 600;


// The district head goes by several titles (src/lib/leader-roles.ts — the
// same rule as the overview's "District leaders" card).
const isCollector = isCollectorRole;
const isMP = (role: string) => /\bmp\b|member of parliament/i.test(role);

// Same ranking as the alerts page (/api/data/alerts).
const SEVERITY_RANK: Record<string, number> = {
  critical: 0, high: 1, severe: 1, warning: 2, medium: 2, moderate: 2, low: 3, info: 4,
};
const rankOf = (s: string | null | undefined) => SEVERITY_RANK[(s ?? "").toLowerCase()] ?? 5;

/** The soonest future date among an event's polling date, expected date or next term. */
function nextDate(e: {
  pollingDate: Date | null;
  nextExpected: Date | null;
  lastHeld: Date | null;
  termYears: number;
}, now: number): { date: Date; approximate: boolean } | null {
  if (e.pollingDate && e.pollingDate.getTime() >= now) return { date: e.pollingDate, approximate: false };
  if (e.nextExpected && e.nextExpected.getTime() >= now) return { date: e.nextExpected, approximate: true };
  // Held already and no new date announced: the next one is due a term later.
  const held = e.pollingDate ?? e.lastHeld;
  if (held) {
    const due = new Date(held);
    due.setUTCFullYear(due.getUTCFullYear() + (e.termYears || 5));
    if (due.getTime() >= now) return { date: due, approximate: true };
  }
  return null;
}

export async function GET(req: NextRequest) {
  const districtSlug = req.nextUrl.searchParams.get("district");
  const stateSlug = req.nextUrl.searchParams.get("state") ?? "";
  if (!districtSlug) return NextResponse.json({ error: "district required" }, { status: 400 });

  const key = cacheKey(districtSlug, "glance:v4");
  const cached = await cacheGet<GlanceData>(key);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}` },
    });
  }

  const district = await prisma.district.findFirst({
    where: { slug: districtSlug, ...(stateSlug ? { state: { slug: stateSlug } } : {}) },
    select: { id: true, population: true, state: { select: { slug: true } } },
  });
  if (!district) return NextResponse.json({ error: "District not found" }, { status: 404 });
  const did = district.id;

  const [leaders, profile, projects, history, newestBudget, events, score, alertRows] = await Promise.all([
    prisma.leader.findMany({
      where: { districtId: did, active: true, ...NOT_FROM_NEWS_OPTIONAL },
      select: { name: true, role: true, party: true, lastVerifiedAt: true },
      orderBy: [{ lastVerifiedAt: { sort: "desc", nulls: "last" } }],
    }),
    prisma.demographicProfile.findFirst({
      where: { districtId: did, totalPopulation: { not: null } },
      orderBy: [{ year: "desc" }, { updatedAt: "desc" }],
      select: { totalPopulation: true, dataset: true, year: true },
    }),
    prisma.infraProject.findMany({ where: { districtId: did, ...LOCAL_INFRA }, select: { status: true, name: true } }),
    // Census head count from the population history when there is no census profile.
    prisma.populationHistory.findFirst({
      where: {
        districtId: did,
        source: { startsWith: "Census of India", mode: "insensitive" },
        NOT: [{ source: { contains: "estimat", mode: "insensitive" } }, { source: { contains: "postpon", mode: "insensitive" } }],
        year: { lte: new Date().getFullYear() },
      },
      orderBy: { year: "desc" },
      select: { year: true, population: true },
    }),
    // Seed rows are never a district budget (NOT_SEEDED_BUDGET, data-filters).
    prisma.budgetEntry.findFirst({
      where: { districtId: did, ...NOT_SEEDED_BUDGET },
      orderBy: { fiscalYear: "desc" },
      select: { fiscalYear: true },
    }),
    prisma.electionEvent.findMany({
      where: { isActive: true, OR: [{ state: null }, { state: district.state.slug }] },
      select: { type: true, label: true, district: true, pollingDate: true, nextExpected: true, lastHeld: true, termYears: true },
    }),
    prisma.districtHealthScore.findUnique({
      where: { districtId: did },
      select: { grade: true, overallScore: true, generatedAt: true, expiresAt: true },
    }),
    // Official warnings only (OFFICIAL_ALERT): news stories are not warnings.
    prisma.localAlert.findMany({
      where: { districtId: did, active: true, ...OFFICIAL_ALERT },
      select: { severity: true, title: true },
      take: 50,
    }),
  ]);

  const now = Date.now();
  const usable = (name: string) => name.trim().length > 0 && !name.startsWith("[");

  const collector = leaders.find((l) => isCollector(l.role) && usable(l.name)) ?? null;
  // A district can span several Lok Sabha seats (Pune: four). Keep every
  // distinct Lok Sabha MP so the row can say "4 MPs" instead of picking one.
  const mpRows = leaders.filter((l) => isMP(l.role) && usable(l.name) && !/rajya/i.test(l.role));
  const mpNames = [...new Set(mpRows.map((l) => l.name.trim()))];
  const mp = mpRows[0] ?? null;

  let budget: GlanceData["budget"] = null;
  if (newestBudget) {
    const rows = await prisma.budgetEntry.findMany({
      where: { districtId: did, fiscalYear: newestBudget.fiscalYear, ...NOT_SEEDED_BUDGET },
      select: { allocated: true, source: true },
    });
    const allocated = rows.reduce((s, r) => s + (r.allocated || 0), 0);
    if (allocated > 0) {
      budget = {
        allocated,
        fiscalYear: newestBudget.fiscalYear,
        estimate: rows.some((r) => /estimat/i.test(r.source ?? "")),
      };
    }
  }

  let election: GlanceData["election"] = null;
  for (const e of events) {
    if (e.district && e.district !== districtSlug) continue;
    const next = nextDate(e, now);
    if (next && (!election || next.date.getTime() < new Date(election.date).getTime())) {
      election = { type: e.type, label: e.label, date: next.date.toISOString(), approximate: next.approximate };
    }
  }

  const sortedAlerts = [...alertRows].sort((a, b) => rankOf(a.severity) - rankOf(b.severity));
  // Same rule as the Projects page and the home map (src/lib/civic/project-facts.ts).
  const realProjects = projects.filter((p) => !isNonProject({ name: p.name ?? "" }));
  const beingBuilt = realProjects.filter((p) => projectStage(p.status) === "building");

  const data: GlanceData = {
    collector: collector ? { name: collector.name, role: collector.role } : null,
    mp: mp ? { name: mp.name, party: mp.party, count: mpNames.length, names: mpNames } : null,
    population: profile?.totalPopulation
      ? { value: profile.totalPopulation, dataset: profile.dataset, year: profile.year, estimate: false }
      : history?.population
        ? { value: history.population, dataset: `Census ${history.year}`, year: history.year, estimate: false }
        : district.population
          ? { value: district.population, dataset: null, year: null, estimate: true }
          : null,
    projects: realProjects.length > 0 ? { active: beingBuilt.length, total: realProjects.length } : null,
    budget,
    election,
    grade:
      score && score.expiresAt.getTime() > now
        ? { grade: score.grade, score: score.overallScore, generatedAt: score.generatedAt.toISOString() }
        : null,
    alerts: {
      active: alertRows.length,
      topSeverity: sortedAlerts[0]?.severity?.toLowerCase() ?? null,
      topTitle: sortedAlerts[0]?.title ?? null,
    },
    checkedAt: new Date(now).toISOString(),
  };

  await cacheSet(key, data, CACHE_SECONDS);
  return NextResponse.json(data, {
    headers: { "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}` },
  });
}
