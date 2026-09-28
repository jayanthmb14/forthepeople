/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Exams & Jobs API — /api/data/exams
// Returns: national + this state's exams ("stateExams", the old field name)
// and this district's own exams ("districtExams").
// Cache: 1 hour (TTL 3600)
//
// Sept 2026: a national exam is ONE row (districtId null) and a state exam
// one row per state — see src/lib/dedupe/exam-rules.ts. Until the duplicate
// guard has merged the old per-district copies, this route still reads
// them and shows one row per exam (examsForDisplay: same canonical key →
// best copy, furthest status). Exams from non-government organisers are
// never shown.
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheKey, cacheSet } from "@/lib/cache";
import { isSlug, publicCacheHeaders } from "@/lib/read-api";
import { examsForDisplay, storedExamScope } from "@/lib/dedupe/exam-rules";
import { isOfficialStaffingRow } from "@/lib/data-filters";
import { withoutEligibilityTestPosts } from "@/lib/exams/eligibility-test";

const TTL_SECONDS = 3600;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const districtSlug = sp.get("district") ?? "";

  if (!districtSlug) {
    return NextResponse.json({ error: "district param required" }, { status: 400 });
  }
  if (!isSlug(districtSlug)) {
    return NextResponse.json({ error: "invalid district" }, { status: 400 });
  }

  // ── Cache check (1 hour TTL) ─────────────────────────────
  const key = cacheKey(districtSlug, "exams");
  const headers = publicCacheHeaders(TTL_SECONDS);
  const cached = await cacheGet<{ data: unknown; meta: Record<string, unknown> }>(key);
  if (cached) {
    return NextResponse.json({ ...cached, meta: { ...cached.meta, fromCache: true } }, { headers });
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

    // National rows (and legacy per-district copies of them), this state's
    // rows (and legacy copies), and this district's own rows.
    const [rows, staffingRows] = await Promise.all([
      prisma.governmentExam.findMany({
        where: {
          OR: [
            { level: "national" },
            { scope: "NATIONAL", stateId: null, districtId: null },
            { stateId },
            { districtId: district.id },
          ],
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 1000,
      }),
      prisma.departmentStaffing.findMany({
        where: { districtId: district.id },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    // Sanctioned vs working posts only from a government source: the news
    // pipeline turned national stories into "district" rows (Sept 2026 audit).
    const staffing = staffingRows.filter(isOfficialStaffingRow);

    // Keep only rows that belong on this page: every national exam, this
    // state's exams, this district's exams (a row filed under another
    // state's district never leaks in).
    const relevant = rows.filter((r) => {
      const scope = storedExamScope(r);
      if (scope === "NATIONAL") return true;
      if (scope === "STATE") return r.stateId === stateId;
      return r.districtId === district.id;
    });
    const byDate = (a: { announcedDate: Date | null; title: string }, b: { announcedDate: Date | null; title: string }) =>
      (b.announcedDate?.getTime() ?? 0) - (a.announcedDate?.getTime() ?? 0) || a.title.localeCompare(b.title);
    const shown = examsForDisplay(relevant).map(withoutEligibilityTestPosts);
    const allExams = shown.filter((e) => storedExamScope(e) !== "DISTRICT").sort(byDate);
    const districtExams = shown.filter((e) => storedExamScope(e) === "DISTRICT").sort(byDate);

    const openStatuses = new Set(["APPLICATIONS_OPEN", "ADMIT_CARD_OUT", "EXAM_SCHEDULED"]);
    const upcomingStatuses = new Set(["NOTIFICATION_OUT"]);
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

    await cacheSet(key, { data: result, meta }, TTL_SECONDS);
    return NextResponse.json({ data: result, meta }, { headers });
  } catch (err) {
    console.error("[API] exams error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
