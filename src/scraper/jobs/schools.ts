/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Schools — UDISE+ (Ministry of Education)
// Schedule: Weekly Sunday 4 AM
// Source: data.gov.in UDISE+ dataset / udiseplus.gov.in
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";

const DATA_GOV_BASE = "https://api.data.gov.in/resource";
// UDISE+ school enrolment & infrastructure Karnataka
const UDISE_RESOURCE = "3b5e8ad0-19d8-4c27-b24a-e1cf8d9a8b3d";

export async function scrapeSchools(ctx: JobContext): Promise<ScraperResult> {
  const apiKey = process.env.DATA_GOV_API_KEY;
  if (!apiKey) {
    ctx.log("Schools: DATA_GOV_API_KEY not set — skipping");
    return { success: true, recordsNew: 0, recordsUpdated: 0 };
  }

  try {
    let newCount = 0;
    let updatedCount = 0;

    const url = `${DATA_GOV_BASE}/${UDISE_RESOURCE}?api-key=${apiKey}&format=json&limit=200&filters[district_name]=${encodeURIComponent(ctx.districtSlug)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(25_000) });

    if (!res.ok) throw new Error(`HTTP ${res.status} from UDISE+ data.gov.in`);

    const json = await res.json();
    const records: Record<string, string>[] = json?.records ?? [];

    for (const rec of records) {
      const udiseCode = rec.udise_code ?? rec.school_code ?? null;
      const name = (rec.school_name ?? rec.name ?? "").trim();
      if (!name) continue;

      const students = parseInt(rec.total_students ?? rec.enrolment ?? 0, 10);
      const teachers = parseInt(rec.teachers ?? rec.total_teachers ?? 0, 10);
      const type = rec.management ?? rec.school_type ?? "Government";
      const level = rec.school_category ?? rec.level ?? "Primary";
      const hasToilets = (rec.toilet ?? "0") !== "0";
      const hasLibrary = (rec.library ?? "0") !== "0";

      const existing = udiseCode
        ? await prisma.school.findFirst({ where: { districtId: ctx.districtId, udiseCode } })
        : await prisma.school.findFirst({ where: { districtId: ctx.districtId, name } });

      if (!existing) {
        await prisma.school.create({
          data: {
            districtId: ctx.districtId,
            name,
            type,
            level,
            udiseCode,
            students: isNaN(students) ? null : students,
            teachers: isNaN(teachers) ? null : teachers,
            studentTeacherRatio:
              teachers > 0 ? Math.round((students / teachers) * 10) / 10 : null,
            hasToilets,
            hasLibrary,
          },
        });
        newCount++;
      } else {
        // Update enrollment figures annually
        await prisma.school.update({
          where: { id: existing.id },
          data: {
            students: isNaN(students) || students === 0 ? existing.students : students,
            teachers: isNaN(teachers) || teachers === 0 ? existing.teachers : teachers,
            studentTeacherRatio:
              teachers > 0 ? Math.round((students / teachers) * 10) / 10 : existing.studentTeacherRatio,
          },
        });
        updatedCount++;
      }
    }

    ctx.log(`Schools: ${newCount} new, ${updatedCount} updated`);
    return { success: true, recordsNew: newCount, recordsUpdated: updatedCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
