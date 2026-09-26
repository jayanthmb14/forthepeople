/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Exams & Jobs API — /api/data/exams
// Returns: state-level exams + district-level exams
// Cache: 1 hour (TTL 3600)
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import redis from "@/lib/redis";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const districtSlug = sp.get("district") ?? "";
  const stateSlug = sp.get("state") ?? "";

  if (!districtSlug) {
    return NextResponse.json({ error: "district param required" }, { status: 400 });
  }

  // ── Cache check (1 hour TTL) ─────────────────────────────
  const cacheKey = `ftp:${districtSlug}:exams`;
  try {
    if (redis) {
      const cached = await redis.get<{ data: unknown; meta: Record<string, unknown> }>(cacheKey);
      if (cached) {
        const resp = NextResponse.json({ ...cached, meta: { ...cached.meta, fromCache: true } });
        resp.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");
        return resp;
      }
    }
  } catch {
    // Non-fatal: proceed without cache
  }

  // ── Fetch ────────────────────────────────────────────────
  try {
    const now = new Date().toISOString();
    const meta = { module: "exams", district: districtSlug, updatedAt: now, fromCache: false };

    const district = await prisma.district.findFirst({
      where: { slug: districtSlug },
      select: { id: true, name: true, state: { select: { id: true, name: true } } },
    });

    if (!district) {
      return NextResponse.json({ data: null, meta: { ...meta, error: "District not found" } });
    }

    const stateId = district.state.id;

    // Fetch national, state-level, and district-level exams in parallel
    const [nationalExams, stateExams, districtExams, staffing] = await Promise.all([
      // National exams (UPSC, SSC, IBPS, RBI, RRB, SBI, NTA) — show for ALL districts
      prisma.governmentExam.findMany({
        where: { level: "national" },
        orderBy: [{ status: "asc" }, { announcedDate: "desc" }],
      }),
      // State-specific exams — only for THIS state
      prisma.governmentExam.findMany({
        where: { stateId, level: "state" },
        orderBy: [{ status: "asc" }, { announcedDate: "desc" }],
      }),
      prisma.governmentExam.findMany({
        where: { districtId: district.id },
        orderBy: [{ status: "asc" }, { announcedDate: "desc" }],
      }),
      prisma.departmentStaffing.findMany({
        where: { districtId: district.id },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    // Merge national + state exams for the "stateExams" field (backwards-compatible)
    const allExams = [...nationalExams, ...stateExams];
    const openStatuses = new Set([
      "open", "APPLICATIONS_OPEN", "ADMIT_CARD_OUT", "EXAM_SCHEDULED",
    ]);
    const upcomingStatuses = new Set(["upcoming", "NOTIFICATION_OUT"]);
    const combined = [...allExams, ...districtExams];
    const result = {
      stateExams: allExams,
      districtExams,
      staffing,
      summary: {
        totalStateExams: allExams.length,
        totalDistrictExams: districtExams.length,
        openExams: combined.filter((e) => openStatuses.has(e.status)).length,
        upcomingExams: combined.filter((e) => upcomingStatuses.has(e.status)).length,
        totalStaffingRecords: staffing.length,
      },
    };

    // Cache for 1 hour
    try {
      if (redis) {
        await redis.set(cacheKey, { data: result, meta }, { ex: 3600 });
      }
    } catch {
      // Non-fatal
    }

    const resp = NextResponse.json({ data: result, meta });
    resp.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");
    return resp;
  } catch (err) {
    console.error("[API] exams error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
