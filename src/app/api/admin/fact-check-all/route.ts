/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runModuleFactCheck } from "@/lib/fact-checker";
import { ALL_MODULES } from "../fact-check-status/route";
import { requireAdmin } from "@/lib/admin-auth";

// Modules that have no structured data to verify
const SKIP_MODULES = new Set(["overview", "interactive-map", "services", "file-rti"]);

async function isAuthed() {
  const { ok } = await requireAdmin();
  return ok;
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { district: districtSlug } = await req.json() as { district: string };
  if (!districtSlug) return NextResponse.json({ error: "district required" }, { status: 400 });

  const district = await prisma.district.findFirst({
    where: { slug: districtSlug },
    include: { state: { select: { name: true } } },
  });
  if (!district) return NextResponse.json({ error: "District not found" }, { status: 404 });

  const results: Record<string, unknown> = {};
  const toCheck = ALL_MODULES.filter((m) => !SKIP_MODULES.has(m.slug));

  for (const mod of toCheck) {
    try {
      const result = await runModuleFactCheck(district, mod.slug);

      await prisma.factCheckStatus.upsert({
        where: { districtId_module: { districtId: district.id, module: mod.slug } },
        create: {
          districtId: district.id,
          module: mod.slug,
          status: result.issuesFound > 0 ? "issues" : "passed",
          itemsChecked: result.itemsChecked,
          issuesFound: result.issuesFound,
          staleItems: result.staleItems,
          lastChecked: new Date(),
          checkedBy: "opus",
          details: result.details as object,
        },
        update: {
          status: result.issuesFound > 0 ? "issues" : "passed",
          itemsChecked: result.itemsChecked,
          issuesFound: result.issuesFound,
          staleItems: result.staleItems,
          lastChecked: new Date(),
          checkedBy: "opus",
          details: result.details as object,
        },
      });

      results[mod.slug] = result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await prisma.factCheckStatus.upsert({
        where: { districtId_module: { districtId: district.id, module: mod.slug } },
        create: { districtId: district.id, module: mod.slug, status: "failed", details: { error: msg } as object },
        update: { status: "failed", details: { error: msg } as object },
      });
      results[mod.slug] = { error: msg };
    }
  }

  const totalChecked = Object.values(results).reduce((sum: number, r) => {
    const res = r as Record<string, unknown>;
    return sum + (typeof res.itemsChecked === "number" ? res.itemsChecked : 0);
  }, 0 as number);
  const totalIssues = Object.values(results).reduce((sum: number, r) => {
    const res = r as Record<string, unknown>;
    return sum + (typeof res.issuesFound === "number" ? res.issuesFound : 0);
  }, 0 as number);

  return NextResponse.json({
    success: true,
    district: districtSlug,
    modulesChecked: toCheck.length,
    totalChecked,
    totalIssues,
    results,
  });
}
