/**
 * ForThePeople.in — AI Platform Report
 * GET  /api/admin/platform-report         — latest report + cost estimate for a new one
 * POST /api/admin/platform-report?confirm=true — generate a new report now
 *
 * The POST handler requires ?confirm=true to actually call the AI. Without it,
 * it returns the cost estimate so the UI can show a confirmation.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { estimateReportCost, generatePlatformReport } from "@/lib/platform-analysis";
import { logAuditAuto } from "@/lib/audit-log";

export const runtime = "nodejs";
export const maxDuration = 60;

async function isAuthed(): Promise<boolean> {
  const { ok } = await requireAdmin();
  return ok;
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [latest, estimate] = await Promise.all([
    prisma.platformReport.findFirst({ orderBy: { generatedAt: "desc" } }),
    estimateReportCost(),
  ]);
  return NextResponse.json({
    report: latest
      ? {
          id: latest.id,
          type: latest.type,
          summary: latest.summary,
          actionItems: latest.actionItems,
          costTips: latest.costTips,
          growthNotes: latest.growthNotes,
          aiModel: latest.aiModel,
          aiCostUSD: latest.aiCostUSD,
          generatedAt: latest.generatedAt.toISOString(),
        }
      : null,
    estimate,
  });
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const confirm = req.nextUrl.searchParams.get("confirm") === "true";
  if (!confirm) {
    const estimate = await estimateReportCost();
    return NextResponse.json({ confirmationRequired: true, estimate });
  }
  try {
    const report = await generatePlatformReport("manual");
    await logAuditAuto({
      action: "platform_report_generate",
      resource: "PlatformReport",
      resourceId: report.id,
      details: { type: "manual", model: report.aiModel, costUSD: report.aiCostUSD },
    });
    return NextResponse.json({ report });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
