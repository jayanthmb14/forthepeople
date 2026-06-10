/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { runModuleFactCheck } from "@/lib/fact-checker";

async function isAuthed() {
  const { ok } = await requireAdmin();
  return ok;
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { district: districtSlug, module } = await req.json() as { district: string; module: string };
  if (!districtSlug || !module) return NextResponse.json({ error: "district and module required" }, { status: 400 });

  const district = await prisma.district.findFirst({
    where: { slug: districtSlug },
    include: { state: { select: { name: true } } },
  });
  if (!district) return NextResponse.json({ error: "District not found" }, { status: 404 });

  // Mark as running
  await prisma.factCheckStatus.upsert({
    where: { districtId_module: { districtId: district.id, module } },
    create: { districtId: district.id, module, status: "running" },
    update: { status: "running" },
  });

  try {
    const results = await runModuleFactCheck(district, module);

    await prisma.factCheckStatus.upsert({
      where: { districtId_module: { districtId: district.id, module } },
      create: {
        districtId: district.id,
        module,
        status: results.issuesFound > 0 ? "issues" : "passed",
        itemsChecked: results.itemsChecked,
        issuesFound: results.issuesFound,
        staleItems: results.staleItems,
        lastChecked: new Date(),
        checkedBy: "opus",
        details: results.details as object,
      },
      update: {
        status: results.issuesFound > 0 ? "issues" : "passed",
        itemsChecked: results.itemsChecked,
        issuesFound: results.issuesFound,
        staleItems: results.staleItems,
        lastChecked: new Date(),
        checkedBy: "opus",
        details: results.details as object,
      },
    });

    return NextResponse.json({ success: true, module, district: districtSlug, ...results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.factCheckStatus.upsert({
      where: { districtId_module: { districtId: district.id, module } },
      create: { districtId: district.id, module, status: "failed", details: { error: msg } as object },
      update: { status: "failed", details: { error: msg } as object },
    });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
