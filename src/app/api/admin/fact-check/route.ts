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

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { module: moduleName, districtSlug } = await req.json() as {
    module?: string;
    districtSlug?: string;
  };

  const startTime = Date.now();
  const now = new Date();

  if (!districtSlug) return NextResponse.json({ error: "districtSlug required" }, { status: 400 });

  const district = await prisma.district.findFirst({
    where: { slug: districtSlug },
    include: { state: { select: { name: true } } },
  });
  if (!district) return NextResponse.json({ error: "District not found" }, { status: 404 });

  const districtLabel = `${district.name} district, ${(district as { state?: { name: string } }).state?.name ?? "Karnataka"}, India`;

  const factCheck = await prisma.factCheck.create({
    data: { districtId: district.id, module: moduleName || "all", status: "running", results: {} },
  });

  try {
    const allResults: Record<string, unknown> = {};

    // ── NEWS & ALERTS ──────────────────────────────────────
    if (!moduleName || moduleName === "all" || moduleName === "news" || moduleName === "alerts") {
      const alerts = await prisma.localAlert.findMany({
        where: { districtId: district.id, active: true },
        orderBy: { createdAt: "desc" },
      });
      const newsItems = await prisma.newsItem.findMany({
        where: { districtId: district.id },
        orderBy: { publishedAt: "desc" },
        take: 30,
        select: { id: true, title: true, publishedAt: true },
      });

      // Stale alerts (>7 days)
      const staleAlerts = alerts
        .map((a) => ({
          id: a.id,
          title: a.title,
          ageInDays: Math.round((now.getTime() - new Date(a.createdAt).getTime()) / 86_400_000),
        }))
        .filter((a) => a.ageInDays > 7)
        .map((a) => ({
          ...a,
          recommendation: a.ageInDays > 14 ? "EXPIRE" : "VERIFY",
        }));

      // Duplicate news (same first 50 chars)
      const headlineSeen = new Map<string, typeof newsItems>();
      for (const item of newsItems) {
        const key = (item.title ?? "").toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().substring(0, 50);
        if (!headlineSeen.has(key)) headlineSeen.set(key, []);
        headlineSeen.get(key)!.push(item);
      }
      const duplicateNews = [...headlineSeen.values()]
        .filter((items) => items.length > 1)
        .map((items) => ({
          headline: items[0].title,
          ids: items.map((i) => i.id),
          count: items.length,
          recommendation: "DEDUPLICATE",
        }));

      // AI verification for stale alerts
      let aiVerification: unknown = null;
      if (staleAlerts.length > 0) {
        const alertList = staleAlerts.map((a) => `"${a.title}" (${a.ageInDays} days old)`).join("\n");
        try {
          const { data } = await callAIJSON<{
            alerts: Array<{ title: string; status: string; reason: string; confidence: number }>;
          }>({
            systemPrompt: `You are a fact-checking engine for ForThePeople.in, a civic transparency platform. Today is ${now.toISOString().split("T")[0]}. Respond ONLY with valid JSON.`,
            userPrompt: `These alerts have been showing on the ${district.name} district page. Check if each is still relevant:\n\n${alertList}\n\nReturn JSON:\n{\n  "alerts": [\n    { "title": "...", "status": "keep"|"expire"|"needs_update", "reason": "...", "confidence": 0.0-1.0 }\n  ]\n}`,
            purpose: "fact-check",
            maxTokens: 1024,
            temperature: 0.2,
          });
          aiVerification = data;
        } catch { /* non-fatal */ }
      }

      allResults.alerts = { staleAlerts, duplicateNews, aiVerification };
    }

    // ── LEADERSHIP ────────────────────────────────────────
    if (!moduleName || moduleName === "all" || moduleName === "leadership") {
      const leaders = await prisma.leader.findMany({
        where: { districtId: district.id },
        orderBy: { tier: "asc" },
      });
      if (leaders.length > 0) {
        const leaderList = leaders.map((l) => `${l.name} — ${l.role} (Tier ${l.tier})`).join("\n");
        try {
          const { data } = await callAIJSON({
            systemPrompt: `Fact-check leadership data for ${districtLabel}. Use knowledge up to early 2025. If uncertain, say so. Today is ${now.toISOString().split("T")[0]}. Return JSON only.`,
            userPrompt: `Verify these officials:\n\n${leaderList}\n\nReturn JSON:\n{\n  "module": "leadership",\n  "totalChecked": ${leaders.length},\n  "issues": [\n    { "name": "...", "designation": "...", "status": "correct"|"outdated"|"wrong"|"uncertain", "correction": "...", "confidence": 0.0-1.0 }\n  ],\n  "summary": "Brief assessment"\n}`,
            purpose: "fact-check",
            maxTokens: 2048,
            temperature: 0.2,
          });
          allResults.leadership = data;
        } catch (e) {
          allResults.leadership = { error: String(e) };
        }
      } else {
        allResults.leadership = { message: "No leadership data in database" };
      }
    }

    // ── BUDGET ────────────────────────────────────────────
    if (!moduleName || moduleName === "all" || moduleName === "budget") {
      const budgets = await prisma.budgetEntry.findMany({
        where: { districtId: district.id },
        take: 20,
      });
      const budgetList = budgets.length > 0
        ? budgets.map((b) => `${b.sector}: Allocated ₹${b.allocated}Cr, Spent ₹${b.spent}Cr (${b.fiscalYear})`).join("\n")
        : "No budget data in database.";
      try {
        const { data } = await callAIJSON({
          purpose: "fact-check",
          systemPrompt: `Fact-check budget data for ${districtLabel}. Reference state budget 2024-25. Return JSON only.`,
          userPrompt: `Verify budget figures:\n\n${budgetList}\n\nReturn JSON:\n{\n  "module": "budget",\n  "totalChecked": ${budgets.length},\n  "issues": [\n    { "sector": "...", "status": "correct"|"wrong"|"uncertain"|"outdated", "correction": "...", "confidence": 0.0-1.0 }\n  ],\n  "missingDepartments": [],\n  "summary": "Brief assessment"\n}`,
          maxTokens: 1024,
          temperature: 0.2,
        });
        allResults.budget = data;
      } catch (e) {
        allResults.budget = { error: String(e) };
      }
    }

    // ── INFRASTRUCTURE ────────────────────────────────────
    if (!moduleName || moduleName === "all" || moduleName === "infrastructure") {
      const projects = await prisma.infraProject.findMany({
        where: { districtId: district.id },
        take: 20,
      });
      const projectList = projects.length > 0
        ? projects.map((p) => `${p.name}: Status=${p.status}, ${p.progressPct ?? 0}% complete`).join("\n")
        : "No project data.";
      try {
        const { data } = await callAIJSON({
          purpose: "fact-check",
          systemPrompt: `Fact-check infrastructure projects for ${districtLabel}. Return JSON only.`,
          userPrompt: `Verify projects:\n\n${projectList}\n\nReturn JSON:\n{\n  "module": "infrastructure",\n  "totalChecked": ${projects.length},\n  "issues": [\n    { "project": "...", "status": "correct"|"outdated"|"wrong"|"uncertain", "correction": "...", "confidence": 0.0-1.0 }\n  ],\n  "missingProjects": [],\n  "summary": "Brief assessment"\n}`,
          maxTokens: 1024,
          temperature: 0.2,
        });
        allResults.infrastructure = data;
      } catch (e) {
        allResults.infrastructure = { error: String(e) };
      }
    }

    // ── DEMOGRAPHICS ──────────────────────────────────────
    if (!moduleName || moduleName === "all" || moduleName === "demographics") {
      const d = await prisma.district.findFirst({
        where: { id: district.id },
        select: { population: true, area: true, literacy: true, sexRatio: true, talukCount: true },
      });
      try {
        const { data } = await callAIJSON({
          purpose: "fact-check",
          systemPrompt: `Provide verified demographic data for ${districtLabel} from Census 2011. Return JSON only.`,
          userPrompt: `Website shows: Population ${d?.population ?? "unknown"}, Area ${d?.area ?? "unknown"} km², Literacy ${d?.literacy ?? "unknown"}%, ${d?.talukCount ?? "unknown"} Taluks.\n\nVerify and return JSON:\n{\n  "module": "demographics",\n  "population": { "correct": true/false, "actual": "...", "source": "Census 2011" },\n  "area": { "correct": true/false, "actual": "..." },\n  "literacy": { "correct": true/false, "actual": "..." },\n  "taluks": { "correct": true/false, "actual": 0, "names": [] },\n  "summary": "Brief assessment"\n}`,
          maxTokens: 512,
          temperature: 0.2,
        });
        allResults.demographics = data;
      } catch (e) {
        allResults.demographics = { error: String(e) };
      }
    }

    // ── COURTS ────────────────────────────────────────────
    if (!moduleName || moduleName === "all" || moduleName === "courts") {
      try {
        const { data } = await callAIJSON({
          purpose: "fact-check",
          systemPrompt: `Verify courts and police data for ${districtLabel}. Return JSON only.`,
          userPrompt: `Provide verified courts data:\n\nReturn JSON:\n{\n  "module": "courts",\n  "districtCourt": { "judgeName": "...", "confidence": 0.0-1.0 },\n  "policeStations": { "count": 0 },\n  "currentSP": { "name": "...", "confidence": 0.0-1.0 },\n  "summary": "Brief assessment"\n}`,
          maxTokens: 512,
          temperature: 0.2,
        });
        allResults.courts = data;
      } catch (e) {
        allResults.courts = { error: String(e) };
      }
    }

    // ── Tallies ────────────────────────────────────────────
    let totalIssues = 0, totalStale = 0, totalDuplicates = 0, totalItems = 0;
    for (const result of Object.values(allResults)) {
      if (result && typeof result === "object") {
        const r = result as Record<string, unknown>;
        if (Array.isArray(r.issues)) totalIssues += (r.issues as Array<{ status: string }>).filter((i) => i.status !== "correct").length;
        if (typeof r.totalChecked === "number") totalItems += r.totalChecked;
        if (Array.isArray(r.staleAlerts)) totalStale += (r.staleAlerts as unknown[]).length;
        if (Array.isArray(r.duplicateNews)) totalDuplicates += (r.duplicateNews as unknown[]).length;
      }
    }

    const durationMs = Date.now() - startTime;

    // Fetch current AI settings for model info
    const aiSettings = await prisma.aIProviderSettings.findUnique({ where: { id: "singleton" } });

    await prisma.factCheck.update({
      where: { id: factCheck.id },
      data: {
        status: "completed",
        totalItems,
        issuesFound: totalIssues,
        staleItems: totalStale,
        duplicates: totalDuplicates,
        results: allResults as object,
        aiProvider: aiSettings?.activeProvider ?? "anthropic",
        aiModel: aiSettings?.anthropicModel ?? "claude-opus-4-6",
        durationMs,
      },
    });

    return NextResponse.json({
      success: true,
      factCheckId: factCheck.id,
      duration: `${(durationMs / 1000).toFixed(1)}s`,
      summary: { totalItems, issuesFound: totalIssues, staleItems: totalStale, duplicates: totalDuplicates },
      results: allResults,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    const durationMs = Date.now() - startTime;
    await prisma.factCheck.update({
      where: { id: factCheck.id },
      data: {
        status: "failed",
        results: { error: errMsg } as object,
        durationMs,
      },
    }).catch(() => {});

    // Return a graceful response instead of 500 — UI can display the error
    return NextResponse.json({
      success: false,
      factCheckId: factCheck.id,
      duration: `${(durationMs / 1000).toFixed(1)}s`,
      summary: { totalItems: 0, issuesFound: 0, staleItems: 0, duplicates: 0 },
      results: { error: errMsg },
      error: `Fact check failed: ${errMsg}. Check AI provider settings.`,
    });
  }
}

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const checks = await prisma.factCheck.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true, districtId: true, module: true, status: true,
      totalItems: true, issuesFound: true, staleItems: true, duplicates: true,
      aiProvider: true, aiModel: true, durationMs: true, createdAt: true,
    },
  });
  return NextResponse.json({ checks });
}
