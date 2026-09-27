/**
 * ForThePeople.in — Shared helper for infra project AI analysis.
 *
 * Used by BOTH:
 *   /api/cron/generate-insights  — pre-computes up to 10 project
 *                                   analyses per cron run (max AI spend)
 *   /api/data/infra-analysis     — cache-only read path (zero AI)
 *
 * Analyses are keyed by projectId in Redis with a 24h TTL. The public
 * page NEVER triggers an AI call — if there's no cache entry, the UI
 * shows an italic "Analysis will be available soon" placeholder.
 */

import type { Prisma } from "@/generated/prisma";
import { prisma } from "./db";
import { callAIJSON } from "./ai-provider";
import redis from "./redis";
import { budgetChange, politicalParty } from "./civic/project-facts";

export const INFRA_ANALYSIS_TTL_S = 24 * 60 * 60;
export const INFRA_ANALYSIS_KEY_PREFIX = "ftp:infra-analysis:";

export function infraAnalysisKey(projectId: string): string {
  return `${INFRA_ANALYSIS_KEY_PREFIX}${projectId}:v1`;
}

export interface InfraAnalysis {
  citizenImpact: string[];
  accountability: string[];
  notes: string;
  sources: number;
  generatedAt: string;
  cached: boolean;
}

const SYSTEM_PROMPT =
  "You produce a NEUTRAL, factual infrastructure project analysis. " +
  "Return ONLY JSON. You must: (1) never use 'scam', 'loot', 'corrupt', 'waste', or any moral judgment; " +
  "(2) never attribute blame to any person or party; " +
  "(3) never invent figures or dates that aren't in the supplied data; " +
  "(4) quote any news-alleged controversy as 'According to [source], concerns were raised about…'. " +
  "Output 2 short, factual bullet lists: citizenImpact (~3 bullets, what the project means for citizens) and " +
  "accountability (~3 bullets, comparative or quantitative facts citizens can weigh themselves). " +
  "Keep every bullet under 160 characters.";

function buildPrompt(project: Record<string, unknown>, updates: Array<Record<string, unknown>>): string {
  return `Project record:
${JSON.stringify(project, null, 2)}

Recent news updates (most recent first):
${JSON.stringify(updates.slice(0, 15), null, 2)}

Return JSON shaped:
{
  "citizenImpact": ["bullet 1", "bullet 2", "bullet 3"],
  "accountability": ["bullet 1", "bullet 2", "bullet 3"],
  "notes": "Optional one-line caveat for readers."
}

Rules reminder:
- Neutral tone only. Facts, not opinions.
- If you don't have a fact, leave it out — don't invent.
- If you cite cost-per-km or timeline comparisons, only reference well-known public projects.`;
}

/**
 * Generate a fresh analysis and cache it. Returns null on failure.
 */
export async function generateInfraAnalysis(projectId: string): Promise<InfraAnalysis | null> {
  const project = await prisma.infraProject.findUnique({
    where: { id: projectId },
    select: {
      id: true, name: true, shortName: true, category: true, status: true, scope: true,
      announcedBy: true, announcedByRole: true, party: true, executingAgency: true,
      keyPeople: true,
      originalBudget: true, revisedBudget: true, costOverrun: true, costOverrunPct: true,
      announcedDate: true, actualStartDate: true, originalEndDate: true,
      revisedEndDate: true, completionDate: true, cancelledDate: true,
      cancellationReason: true, delayMonths: true, progressPct: true,
      verificationCount: true,
    },
  });
  if (!project) return null;
  // Same rules as the page (project-facts.ts): the budget change comes from
  // the two budgets, not the stored costOverrun, and only a political
  // party counts as a party (Sept 2026 audit).
  const change = budgetChange(project);
  const facts = {
    ...project,
    party: politicalParty(project.party),
    costOverrun: change?.amount ?? null,
    costOverrunPct: change ? Math.round(change.pct * 10) / 10 : null,
  };

  const updates = await prisma.infraUpdate.findMany({
    where: { projectId },
    orderBy: { date: "desc" },
    take: 20,
    select: {
      date: true, updateType: true, headline: true, summary: true,
      personName: true, personRole: true, personParty: true,
      budgetChange: true, progressPct: true, newsSource: true, newsUrl: true,
    },
  });

  try {
    const { data: parsed } = await callAIJSON<Partial<InfraAnalysis>>({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildPrompt(
        facts as unknown as Record<string, unknown>,
        updates as unknown as Array<Record<string, unknown>>
      ),
      purpose: "insight", // Tier 2 (low-cost flash-lite), see src/lib/ai-models.ts
      jsonShape: "object",
      maxTokens: 700,
      temperature: 0.3,
      timeoutMs: 45_000,
    });
    const analysis: InfraAnalysis = {
      citizenImpact: Array.isArray(parsed.citizenImpact)
        ? parsed.citizenImpact.filter((s): s is string => typeof s === "string").slice(0, 6)
        : [],
      accountability: Array.isArray(parsed.accountability)
        ? parsed.accountability.filter((s): s is string => typeof s === "string").slice(0, 6)
        : [],
      notes: typeof parsed.notes === "string"
        ? parsed.notes
        : "AI-generated from news sources. Verify with the executing agency for official project status.",
      sources: updates.length,
      generatedAt: new Date().toISOString(),
      cached: false,
    };
    try {
      if (redis) await redis.set(infraAnalysisKey(projectId), analysis, { ex: INFRA_ANALYSIS_TTL_S });
    } catch {
      /* non-fatal */
    }
    return analysis;
  } catch (err) {
    console.error("[infra-analysis] generation failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Cache-only read. The public page uses this — never triggers AI.
 */
export async function readCachedInfraAnalysis(projectId: string): Promise<InfraAnalysis | null> {
  try {
    if (!redis) return null;
    const cached = await redis.get<InfraAnalysis>(infraAnalysisKey(projectId));
    return cached ?? null;
  } catch {
    return null;
  }
}

/**
 * Find project IDs eligible for pre-computation:
 *   - at least 1 InfraUpdate row (excluding SEED-only)
 *   - no cached analysis
 *   - limited to `max`, ordered by most recent news first
 *
 * We mark "eligible" in-memory then filter out those that have cache hits.
 */
export async function selectProjectsNeedingAnalysis(max: number): Promise<string[]> {
  const candidates = await prisma.infraProject.findMany({
    where: {
      updates: { some: { updateType: { not: "SEED" } } },
    },
    orderBy: { lastNewsAt: "desc" },
    select: { id: true },
    take: max * 3, // over-select so the cache filter still yields `max`
  });

  const picked: string[] = [];
  for (const p of candidates) {
    const hit = await readCachedInfraAnalysis(p.id);
    if (hit) continue;
    picked.push(p.id);
    if (picked.length >= max) break;
  }
  return picked;
}

// Keeps a satellite export so helper stays ts-valid even if unused downstream.
export type { Prisma };
