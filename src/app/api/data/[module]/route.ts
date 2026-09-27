/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Unified API Route: /api/data/[module]
// Query params: ?district=mandya&state=karnataka&taluk=...
// Response: { data: T, meta: { district, module, updatedAt, fromCache } }
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet, cacheKey, getModuleTTL } from "@/lib/cache";
import { contentLocale } from "@/lib/translation/content";
import { localizeRows } from "@/lib/translation/overlay";
import {
  JJM_DISTRICT_TOTAL,
  LOCAL_INFRA,
  NJDG_COURTSTAT,
  NOT_FROM_NEWS,
  NOT_FROM_NEWS_OPTIONAL,
  NOT_SEEDED_RAINFALL,
  SHOWN_CRIME,
  SHOWN_TRAFFIC,
  VERIFIED_PANCHAYAT,
} from "@/lib/data-filters";
import { readDistrictSnapshot } from "@/scraper/lib/district-snapshot";
import type { NregaSnapshotData } from "@/scraper/lib/nrega";
import type { UdiseSnapshotData } from "@/scraper/lib/udise";
import { dedupeStories } from "@/lib/news-dedupe";

// Modules whose payload carries live text with stored translations
// (src/lib/translation). Every other module ignores ?locale=.
const LOCALIZED_MODULES = new Set(["news"]);

// ── Params type (Next.js 15+) ───────────────────────────
type RouteContext = { params: Promise<{ module: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { module } = await ctx.params;
  const sp = req.nextUrl.searchParams;
  const districtSlug = sp.get("district") ?? "";
  const stateSlug = sp.get("state") ?? "";
  const talukSlug = sp.get("taluk") ?? "";
  // ?locale=kn → overlay STORED translations of live text (no API calls).
  const locale = LOCALIZED_MODULES.has(module) ? contentLocale(sp.get("locale")) : null;

  if (!districtSlug) {
    return NextResponse.json({ error: "district param required" }, { status: 400 });
  }

  // ── Cache check ──────────────────────────────────────
  const baseKey = cacheKey(districtSlug, module + (talukSlug ? `:${talukSlug}` : ""));
  const key = locale ? `${baseKey}@${locale}` : baseKey;
  const cached = await cacheGet<{ data: unknown; meta: Record<string, unknown> }>(key);
  if (cached) {
    const ttl = getModuleTTL(module);
    const resp = NextResponse.json({ ...cached, meta: { ...cached.meta, fromCache: true } });
    resp.headers.set("Cache-Control", `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`);
    return resp;
  }

  // ── Fetch ────────────────────────────────────────────
  try {
    let result = locale ? await cacheGet<{ data: unknown; meta: Record<string, unknown> }>(baseKey) : null;
    if (!result) {
      result = await fetchModule(module, districtSlug, stateSlug, talukSlug);
      await cacheSet(baseKey, result, getModuleTTL(module));
    }
    if (locale) {
      result = await localizeModule(module, result, locale);
      // Short TTL so translations written by the job show up within minutes.
      await cacheSet(key, result, Math.min(getModuleTTL(module), 600));
    }
    const ttl = getModuleTTL(module);
    const resp = NextResponse.json(result);
    resp.headers.set("Cache-Control", `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`);
    return resp;
  } catch (err) {
    Sentry.captureException(err);
    console.error(`[API] ${module} error:`, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── Live-text overlay ────────────────────────────────────
async function localizeModule(
  module: string,
  result: { data: unknown; meta: Record<string, unknown> },
  locale: string,
): Promise<{ data: unknown; meta: Record<string, unknown> }> {
  if (module === "news" && Array.isArray(result.data)) {
    const rows = await localizeRows("news", result.data as { id: string; title: string }[], locale);
    return { ...result, data: rows.map((r) => ({ ...r, headline: r.title })), meta: { ...result.meta, locale } };
  }
  return result;
}

// ── Module resolver ──────────────────────────────────────
async function fetchModule(
  module: string,
  districtSlug: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _stateSlug: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _talukSlug: string
) {
  const now = new Date().toISOString();
  const meta = { module, district: districtSlug, updatedAt: now, fromCache: false };

  // Resolve district id once
  const district = await prisma.district.findFirst({
    where: { slug: districtSlug },
    select: { id: true, name: true, nameLocal: true },
  });

  if (!district) return { data: null, meta: { ...meta, error: "District not found" } };

  const did = district.id;

  switch (module) {
    // ══════════════════════════════════════════════════
    // 1. OVERVIEW
    // ══════════════════════════════════════════════════
    case "overview": {
      const udise = await readDistrictSnapshot<UdiseSnapshotData>("udise", districtSlug);
      const d = await prisma.district.findUnique({
        where: { id: did },
        include: {
          taluks: { select: { id: true, name: true, nameLocal: true, slug: true } },
          leaders: { where: { active: true, ...NOT_FROM_NEWS_OPTIONAL }, orderBy: { tier: "asc" } },
          _count: {
            select: {
              infraProjects: { where: LOCAL_INFRA },
              schemes: true,
              policeStations: true,
              schools: true,
            },
          },
        },
      });
      // Schools: the district's UDISE+ count (collector) when we have it, not
      // the schools we list by name (compare reads this).
      if (d && udise) d._count.schools = udise.data.totals.schools;
      return { data: d ? { ...d, schoolsFrom: udise ? "udise" : "listed" } : d, meta };
    }

    // ══════════════════════════════════════════════════
    // 2. LEADERS
    // ══════════════════════════════════════════════════
    case "leaders": {
      // Use DISTINCT ON via raw query to deduplicate by name+role, keeping newest.
      // Filters out rows explicitly marked inactive (e.g. replaced officeholders).
      const raw = await prisma.$queryRaw<{
        id: string; districtId: string; name: string; role: string; tier: number;
        party: string | null; constituency: string | null; since: string | null;
        photoUrl: string | null; source: string | null; lastVerifiedAt: Date | null;
        active: boolean; roleDescription: string | null;
        talukId: string | null; nameLocal: string | null; roleLocal: string | null;
        phone: string | null; email: string | null; photoLicense: string | null;
      }[]>`
        SELECT DISTINCT ON (LOWER("name"), LOWER("role"))
          id, "districtId", name, role, tier,
          party, constituency, since, "photoUrl",
          source, "lastVerifiedAt", active, "roleDescription",
          "talukId", "nameLocal", "roleLocal", phone, email, "photoLicense"
        FROM "Leader"
        WHERE "districtId" = ${did} AND active = true
          AND (source IS NULL OR source NOT LIKE 'http%')
        ORDER BY LOWER("name"), LOWER("role"), id DESC
      `;
      const data = raw.map(r => ({
        ...r,
        lastVerifiedAt: r.lastVerifiedAt ? r.lastVerifiedAt.toISOString() : null,
      }));
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 3. BUDGET
    // ══════════════════════════════════════════════════
    case "budget": {
      const [entries, allocations] = await Promise.all([
        prisma.budgetEntry.findMany({
          where: { districtId: did },
          orderBy: [{ fiscalYear: "desc" }, { sector: "asc" }],
        }),
        prisma.budgetAllocation.findMany({
          where: { districtId: did },
          orderBy: [{ fiscalYear: "desc" }, { department: "asc" }],
        }),
      ]);
      return { data: { entries, allocations }, meta };
    }

    // ══════════════════════════════════════════════════
    // 4. REVENUE
    // ══════════════════════════════════════════════════
    case "revenue": {
      const [entries, collections] = await Promise.all([
        prisma.revenueEntry.findMany({
          where: { districtId: did },
          orderBy: [{ fiscalYear: "desc" }, { month: "asc" }],
        }),
        prisma.revenueCollection.findMany({
          where: { districtId: did },
          orderBy: [{ fiscalYear: "desc" }, { month: "desc" }],
          take: 24,
        }),
      ]);
      return { data: { entries, collections }, meta };
    }

    // ══════════════════════════════════════════════════
    // 5. CROPS
    // ══════════════════════════════════════════════════
    case "crops": {
      const data = await prisma.cropPrice.findMany({
        where: { districtId: did },
        orderBy: [{ date: "desc" }, { commodity: "asc" }],
        take: 100,
      });
      return { data, meta: { ...meta, lastUpdated: data[0]?.date?.toISOString() ?? null } };
    }

    // ══════════════════════════════════════════════════
    // 6. WEATHER
    // ══════════════════════════════════════════════════
    case "weather": {
      const data = await prisma.weatherReading.findMany({
        where: { districtId: did },
        orderBy: { recordedAt: "desc" },
        take: 48,
      });
      return { data, meta: { ...meta, lastUpdated: data[0]?.recordedAt?.toISOString() ?? null } };
    }

    // ══════════════════════════════════════════════════
    // 7. RAINFALL
    // ══════════════════════════════════════════════════
    case "rainfall": {
      const data = await prisma.rainfallHistory.findMany({
        where: { districtId: did, ...NOT_SEEDED_RAINFALL },
        orderBy: [{ year: "desc" }, { month: "asc" }],
        take: 60,
      });
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 8. SOIL
    // ══════════════════════════════════════════════════
    case "soil": {
      const [soil, advisories] = await Promise.all([
        prisma.soilHealth.findMany({
          where: { districtId: did },
          orderBy: { testedAt: "desc" },
          take: 20,
        }),
        prisma.agriAdvisory.findMany({
          where: { districtId: did },
          orderBy: { weekOf: "desc" },
          take: 10,
        }),
      ]);
      return { data: { soil, advisories }, meta };
    }

    // ══════════════════════════════════════════════════
    // 9. WATER (dams + canals)
    // ══════════════════════════════════════════════════
    case "water": {
      const [dams, canals] = await Promise.all([
        prisma.damReading.findMany({
          where: { districtId: did },
          orderBy: { recordedAt: "desc" },
          take: 20,
        }),
        prisma.canalRelease.findMany({
          where: { districtId: did },
          orderBy: { scheduledDate: "desc" },
          take: 20,
        }),
      ]);
      return { data: { dams, canals }, meta: { ...meta, lastUpdated: dams[0]?.recordedAt?.toISOString() ?? null } };
    }

    // ══════════════════════════════════════════════════
    // 10. INFRASTRUCTURE
    // ══════════════════════════════════════════════════
    case "infrastructure": {
      const data = await prisma.infraProject.findMany({
        where: { districtId: did, ...LOCAL_INFRA },
        include: {
          updates: {
            orderBy: { date: "desc" },
            take: 25,
            select: {
              id: true, date: true, headline: true, summary: true,
              updateType: true, personName: true, personRole: true, personParty: true,
              budgetChange: true, progressPct: true, statusChange: true,
              newsUrl: true, newsTitle: true, newsSource: true, newsDate: true,
              verified: true,
            },
          },
        },
        orderBy: [{ lastNewsAt: "desc" }, { status: "asc" }, { startDate: "desc" }],
      });
      const infraUpdated = data.reduce<Date | null>((latest, p) => {
        const ts = (p as { updatedAt?: Date }).updatedAt;
        if (!ts) return latest;
        return !latest || ts > latest ? ts : latest;
      }, null);
      return { data, meta: { ...meta, lastUpdated: infraUpdated?.toISOString() ?? null } };
    }

    // ══════════════════════════════════════════════════
    // 11. SCHEMES
    // ══════════════════════════════════════════════════
    case "schemes": {
      const data = await prisma.scheme.findMany({
        where: { districtId: did },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 12. NEWS
    // ══════════════════════════════════════════════════
    case "news": {
      // Filter out near-duplicates (duplicateOf != null) so the public list
      // shows one article per story. Admin retains full visibility.
      const rows = await prisma.newsItem.findMany({
        where: { districtId: did, duplicateOf: null },
        orderBy: { publishedAt: "desc" },
        take: 60,
      });
      // The same story from several outlets, reworded, slips past the
      // ingest-time prefix check; collapse it here (src/lib/news-dedupe.ts).
      const data = dedupeStories(rows, [districtSlug, district.name])
        .slice(0, 30)
        .map((r) => ({ ...r, headline: r.title }));
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 13. POLICE
    // ══════════════════════════════════════════════════
    case "police": {
      const [stations, crime, traffic] = await Promise.all([
        prisma.policeStation.findMany({
          where: { districtId: did },
          orderBy: { name: "asc" },
        }),
        // Estimates ("… (estimated)", "Estimated from …") are never sent, so
        // the page, compare and AI insights only ever see published figures.
        prisma.crimeStat.findMany({
          where: { districtId: did, ...SHOWN_CRIME },
          orderBy: [{ year: "desc" }, { category: "asc" }],
        }),
        prisma.trafficCollection.findMany({
          where: { districtId: did, ...SHOWN_TRAFFIC },
          orderBy: { date: "desc" },
          take: 24,
        }),
      ]);
      // Seeded traffic fines were generated with Math.random() (fractional
      // paise, e.g. 4709484.63874892); real collections are whole rupees.
      const realTraffic = traffic.filter((r) => Number.isInteger(r.amount));
      return { data: { stations, crime, traffic: realTraffic }, meta };
    }

    // ══════════════════════════════════════════════════
    // 14. RTI
    // ══════════════════════════════════════════════════
    case "rti": {
      const [stats, templates] = await Promise.all([
        prisma.rtiStat.findMany({
          where: { districtId: did },
          orderBy: [{ year: "desc" }, { department: "asc" }],
        }),
        prisma.rtiTemplate.findMany({
          where: { districtId: did },
          orderBy: { department: "asc" },
        }),
      ]);
      return { data: { stats, templates }, meta };
    }

    // ══════════════════════════════════════════════════
    // 15. COURTS
    // ══════════════════════════════════════════════════
    case "courts": {
      // Only rows the NJDG collector wrote; hand-seeded rows are never sent.
      const data = await prisma.courtStat.findMany({
        where: { districtId: did, ...NJDG_COURTSTAT },
        orderBy: [{ year: "desc" }, { courtName: "asc" }],
      });
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 16. ELECTIONS
    // ══════════════════════════════════════════════════
    case "elections": {
      // Results are WITHHELD until checked against ECI (Sept 2026). The
      // ElectionResult rows were seeded, not taken from ECI: wrong winners
      // (Mandya 2024 lists Nikhil Kumaraswamy; H.D. Kumaraswamy won), a
      // Mysuru seat filed under Mandya, round "votes" (520000), placeholder
      // runners-up ("AIADMK candidate"), rows marked "approximate", and the
      // same seat twice with different counts — all labelled "ECI". Showing
      // them would break the no-fabrication rule. Flip this to false once
      // the table is re-loaded from results.eci.gov.in.
      const ELECTION_RESULTS_WITHHELD = true;
      const [results, booths] = await Promise.all([
        ELECTION_RESULTS_WITHHELD
          ? Promise.resolve([])
          : prisma.electionResult.findMany({
              where: { districtId: did },
              orderBy: [{ year: "desc" }, { constituency: "asc" }],
              take: 100,
            }),
        prisma.pollingBooth.findMany({
          where: { districtId: did },
          orderBy: { boothNumber: "asc" },
          take: 50,
        }),
      ]);
      return { data: { results, booths, resultsWithheld: ELECTION_RESULTS_WITHHELD }, meta };
    }

    // ══════════════════════════════════════════════════
    // 17. PANCHAYATS
    // ══════════════════════════════════════════════════
    case "panchayats": {
      // Seeded GramPanchayat rows (round numbers, no real source) are never
      // sent (VERIFIED_PANCHAYAT). The district's MGNREGA figures come from
      // the NREGA collector's checked snapshot (/api/cron/scrape-mgnrega),
      // sent as `snapshot` (null for urban districts / before its first run).
      const [data, snapshot] = await Promise.all([
        prisma.gramPanchayat.findMany({
          where: { districtId: did, ...VERIFIED_PANCHAYAT },
          orderBy: { name: "asc" },
        }),
        readDistrictSnapshot<NregaSnapshotData>("mgnrega", districtSlug),
      ]);
      return { data, meta: { ...meta, lastUpdated: snapshot?.fetchedAt ?? null }, snapshot };
    }

    // ══════════════════════════════════════════════════
    // 18. SCHOOLS
    // ══════════════════════════════════════════════════
    case "schools": {
      // `data`: the schools listed one by one (entered by hand). `snapshot`:
      // the district's UDISE+ totals from /api/cron/scrape-schools (schools,
      // teachers, students for the school year) — the page's headline
      // figures come from it whenever it exists, never from adding up the list.
      const [data, snapshot] = await Promise.all([
        prisma.school.findMany({
          where: { districtId: did },
          include: { results: { orderBy: { year: "desc" }, take: 3 } },
          orderBy: { name: "asc" },
          take: 200,
        }),
        readDistrictSnapshot<UdiseSnapshotData>("udise", districtSlug),
      ]);
      return { data, meta: { ...meta, lastUpdated: snapshot?.fetchedAt ?? null }, snapshot };
    }

    // ══════════════════════════════════════════════════
    // 19. JJM (Jal Jeevan Mission)
    // ══════════════════════════════════════════════════
    case "jjm": {
      // Only the JJM dashboard's district total (JJM_DISTRICT_TOTAL); the
      // seeded area rows are never sent or added to it. `level` tells the
      // page this row is the whole district, not one area — it has no water
      // test of its own, so it stays out of the water-test figures.
      const rows = await prisma.jJMStatus.findMany({
        where: { districtId: did, ...JJM_DISTRICT_TOTAL },
        orderBy: { updatedAt: "desc" },
        take: 1,
      });
      const data = rows.map((r) => ({ ...r, level: "district" as const }));
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 20. HOUSING
    // ══════════════════════════════════════════════════
    case "housing": {
      const data = await prisma.housingScheme.findMany({
        where: { districtId: did },
        orderBy: { schemeName: "asc" },
      });
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 21. POWER
    // ══════════════════════════════════════════════════
    case "power": {
      const data = await prisma.powerOutage.findMany({
        where: { districtId: did, ...NOT_FROM_NEWS },
        orderBy: { startTime: "desc" },
        take: 30,
      });
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 22. TRANSPORT
    // ══════════════════════════════════════════════════
    case "transport": {
      const [buses, trains] = await Promise.all([
        prisma.busRoute.findMany({
          where: { districtId: did },
          orderBy: { routeNumber: "asc" },
        }),
        prisma.trainSchedule.findMany({
          where: { districtId: did },
          orderBy: { trainNumber: "asc" },
        }),
      ]);
      return { data: { buses, trains }, meta };
    }

    // ══════════════════════════════════════════════════
    // 23. FACTORIES (Sugar)
    // ══════════════════════════════════════════════════
    case "factories": {
      const rows = await prisma.sugarFactory.findMany({
        where: { districtId: did },
        include: {
          seasonData: { orderBy: { season: "desc" }, take: 3 },
        },
        orderBy: { name: "asc" },
      });
      // Seeded arrears were Math.random() amounts (fractional rupees); a real
      // figure from the Sugar Directorate is whole rupees. Show none rather
      // than an invented one.
      const data = rows.map((f) => ({
        ...f,
        seasonData: f.seasonData.map((sd) =>
          sd.totalArrears !== null && !Number.isInteger(sd.totalArrears) ? { ...sd, totalArrears: null } : sd,
        ),
      }));
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // LOCAL INDUSTRIES (IT Parks, Heritage, etc.)
    // ══════════════════════════════════════════════════
    case "local-industries": {
      const data = await prisma.localIndustry.findMany({
        where: { districtId: did, active: true },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 24. SERVICES (Citizen service guides)
    // ══════════════════════════════════════════════════
    case "services": {
      const data = await prisma.serviceGuide.findMany({
        where: { districtId: did },
        orderBy: { category: "asc" },
      });
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 25. TIPS (Citizen tips)
    // ══════════════════════════════════════════════════
    case "tips": {
      // active=false = retired (the duplicate guard retires copies this way).
      const data = await prisma.citizenTip.findMany({
        where: { districtId: did, active: true },
        orderBy: { category: "asc" },
      });
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 26. ALERTS (Local alerts)
    // ══════════════════════════════════════════════════
    case "alerts": {
      const rows = await prisma.localAlert.findMany({
        where: {
          districtId: did,
          active: true,
        },
        orderBy: { createdAt: "desc" },
      });
      // Most serious first. Sorting the text column put "medium" before
      // "critical"; rank it explicitly, newest first within a level.
      const RANK: Record<string, number> = { critical: 0, high: 1, severe: 1, warning: 2, medium: 2, moderate: 2, low: 3, info: 4 };
      const data = [...rows].sort(
        (a, b) => (RANK[(a.severity ?? "").toLowerCase()] ?? 5) - (RANK[(b.severity ?? "").toLowerCase()] ?? 5),
      );
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 27. OFFICES (Government offices)
    // ══════════════════════════════════════════════════
    case "offices": {
      const data = await prisma.govOffice.findMany({
        where: { districtId: did },
        orderBy: [{ department: "asc" }, { name: "asc" }],
      });
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 28. AGRI (Agri advisories)
    // ══════════════════════════════════════════════════
    case "agri": {
      const data = await prisma.agriAdvisory.findMany({
        where: { districtId: did },
        orderBy: { weekOf: "desc" },
        take: 20,
      });
      return { data, meta };
    }

    // ══════════════════════════════════════════════════
    // 29. POPULATION
    // ══════════════════════════════════════════════════
    case "population": {
      // Exclude non-district metro-area estimates (e.g. "Mumbai Metropolitan Region")
      // so Overview (district) and Population page (district census) stay consistent.
      const [data, profile] = await Promise.all([
        prisma.populationHistory.findMany({
          where: {
            districtId: did,
            NOT: { source: { contains: "Metropolitan Region", mode: "insensitive" } },
          },
          orderBy: { year: "asc" },
        }),
        prisma.demographicProfile.findFirst({
          where: { districtId: did },
          orderBy: [{ year: "desc" }, { updatedAt: "desc" }],
        }),
      ]);
      return { data, profile, meta };
    }

    // ══════════════════════════════════════════════════
    // 30. TALUKS
    // ══════════════════════════════════════════════════
    case "taluks": {
      const data = await prisma.taluk.findMany({
        where: { districtId: did },
        include: {
          villages: { orderBy: { name: "asc" } },
          _count: { select: { villages: true } },
        },
        orderBy: { name: "asc" },
      });
      return { data, meta };
    }

    case "famous-personalities": {
      const data = await prisma.famousPersonality.findMany({
        where: { districtId: did, active: true },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });
      return { data, meta };
    }

    default:
      return { data: null, meta: { ...meta, error: `Unknown module: ${module}` } };
  }
}
