/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callAIJSON } from "@/lib/ai-provider";
import { requireAdmin } from "@/lib/admin-auth";

async function isAuthed() {
  const { ok } = await requireAdmin();
  return ok;
}

type VerificationResult = {
  module: string;
  district: string;
  issues: string[];
  suggestions: string[];
  confidence: number;
  status: "ok" | "warning" | "error";
};

const SYSTEM_PROMPT = `You are a data quality expert for Indian government data.
You verify the accuracy, completeness, and plausibility of district-level government data.
Return ONLY valid JSON with no markdown. Be concise and factual.`;

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { module, district } = await req.json() as { module: string; district: string };
  if (!module || !district) {
    return NextResponse.json({ error: "module and district required" }, { status: 400 });
  }

  // Resolve district slug → id + state name
  const districtRow = await prisma.district.findFirst({
    where: { slug: district },
    include: { state: { select: { name: true } } },
  });
  if (!districtRow) {
    return NextResponse.json({ error: `District not found: ${district}` }, { status: 404 });
  }
  const districtId = districtRow.id;
  const stateName = (districtRow as { state?: { name: string } }).state?.name ?? "Karnataka";

  try {
    let dataToVerify: unknown = null;

    switch (module) {
      case "leadership": {
        dataToVerify = await prisma.leader.findMany({ where: { districtId }, take: 20 });
        break;
      }
      case "budget": {
        dataToVerify = await prisma.budgetEntry.findMany({ where: { districtId }, take: 30 });
        break;
      }
      case "infrastructure": {
        dataToVerify = await prisma.infraProject.findMany({ where: { districtId }, take: 20 });
        break;
      }
      case "demographics": {
        dataToVerify = await prisma.district.findFirst({
          where: { id: districtId },
          select: { name: true, population: true, area: true, literacy: true, sexRatio: true, talukCount: true, villageCount: true },
        });
        break;
      }
      case "courts": {
        dataToVerify = await prisma.courtStat.findMany({ where: { districtId }, take: 20 });
        break;
      }
      case "news": {
        dataToVerify = await prisma.newsItem.findMany({
          where: { districtId },
          orderBy: { publishedAt: "desc" },
          take: 10,
          select: { title: true, summary: true, source: true, publishedAt: true, category: true },
        });
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown module: ${module}` }, { status: 400 });
    }

    if (!dataToVerify || (Array.isArray(dataToVerify) && dataToVerify.length === 0)) {
      return NextResponse.json({
        module,
        district,
        issues: ["No data found in database"],
        suggestions: ["Seed data for this module or run the appropriate scraper"],
        confidence: 0,
        status: "error",
      } satisfies VerificationResult);
    }

    const userPrompt = `Verify this ${module} data for ${district} district, ${stateName}, India.
Check for: accuracy, completeness, plausible values, missing fields, outdated information.

Data:
${JSON.stringify(dataToVerify, null, 2)}

Return JSON with exactly this shape:
{
  "issues": ["list of data quality issues found"],
  "suggestions": ["actionable suggestions to fix issues"],
  "confidence": <integer 0-100 for data quality>,
  "status": "ok" | "warning" | "error"
}`;

    try {
      const { data } = await callAIJSON<{
        issues: string[];
        suggestions: string[];
        confidence: number;
        status: "ok" | "warning" | "error";
      }>({ systemPrompt: SYSTEM_PROMPT, userPrompt, purpose: "fact-check", maxTokens: 1024, temperature: 0.2 });

      return NextResponse.json({ module, district, ...data } satisfies VerificationResult);
    } catch (aiErr) {
      console.error("[verify-data] AI call failed:", module, district, aiErr);
      return NextResponse.json({
        module,
        district,
        issues: [`AI verification failed: ${aiErr instanceof Error ? aiErr.message : String(aiErr)}`],
        suggestions: ["Check AI provider settings and API key in /admin/ai-settings"],
        confidence: 0,
        status: "error",
      } satisfies VerificationResult);
    }
  } catch (err) {
    console.error("[verify-data]", module, district, err);
    return NextResponse.json({
      module,
      district,
      issues: [`Error: ${err instanceof Error ? err.message : String(err)}`],
      suggestions: ["Check server logs for details"],
      confidence: 0,
      status: "error",
    } satisfies VerificationResult);
  }
}
