/**
 * ForThePeople.in — News-driven InfraProject sync
 *
 * NewsItem classified as module="infrastructure" →
 *   extractInfraFromNews (free-tier AI) →
 *   verifyInfraExtraction (second free-tier AI pass, different prompt) →
 *   syncInfraFromNews (fuzzy upsert + InfraUpdate timeline entry)
 *
 * Every timeline entry MUST link to a news URL. Status never downgrades
 * (except CANCELLED which is terminal). null values never overwrite
 * concrete existing data.
 *
 * Tone / legal:
 *   - AI prompts are instructed to be neutral. No "scam/loot/corrupt/waste".
 *   - Party and person attribution must come from the article text itself.
 *   - If the article only says "the government", announcedBy is null.
 */

import { Prisma } from "@/generated/prisma";
import { prisma } from "./db";
import { AIDeadlineError, callAIJSON } from "./ai-provider";
import { cacheKey, cacheSet } from "./cache";
import { logUpdate } from "./update-log";
import { findSameNamed } from "./dedupe/match";
import { plausibleBudgetRevision, politicalParty } from "./civic/project-facts";
import { applyScopeOverride, sanitizeInfra, type InfraExtraction, type KeyPerson } from "./infra-extraction";

export type { InfraExtraction } from "./infra-extraction";

// ═══════════════════════════════════════════════════════════
// Types (the extraction's own types: src/lib/infra-extraction.ts)
// ═══════════════════════════════════════════════════════════

export interface InfraVerification {
  verified: boolean;
  corrections: Partial<InfraExtraction> | null;
  flags: string[];
}

export interface NewsArticleRef {
  title: string;
  url: string;
  publishedAt: Date;
  source?: string | null;
}

/** deadlineAt: epoch ms after which no AI call starts (the news cron's time budget). */
export interface InfraAIOptions {
  deadlineAt?: number;
}

function aiFailure(step: string, err: unknown): void {
  if (err instanceof AIDeadlineError) console.log(`[infra-sync] ${step} skipped: no time left in the run`);
  else console.error(`[infra-sync] ${step} failed:`, err instanceof Error ? err.message : err);
}

// ═══════════════════════════════════════════════════════════
// Status ordering (CANCELLED terminal, rest ladder)
// ═══════════════════════════════════════════════════════════

const STATUS_RANK: Record<string, number> = {
  // legacy lowercase (in existing seed data)
  planned: 0, proposed: 0,
  approved: 1, sanctioned: 1,
  tendered: 2, "tender issued": 2,
  ongoing: 3, "in-progress": 3, "under_construction": 3, "under construction": 3, active: 3,
  "on_track": 3, "on track": 3,
  delayed: 4, stalled: 4,
  completed: 5, inaugurated: 5,
  cancelled: 99,
  // New uppercase
  PROPOSED: 0,
  APPROVED: 1,
  TENDER_ISSUED: 2,
  UNDER_CONSTRUCTION: 3,
  ON_TRACK: 3,
  DELAYED: 4,
  STALLED: 4,
  COMPLETED: 5,
  CANCELLED: 99,
};

function statusRank(s: string | null | undefined): number {
  if (!s) return -1;
  return STATUS_RANK[s] ?? STATUS_RANK[s.toLowerCase()] ?? -1;
}

function parseDate(v: string | null | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ═══════════════════════════════════════════════════════════
// AI: extraction
// ═══════════════════════════════════════════════════════════

const EXTRACTION_SYSTEM =
  "You extract structured infrastructure project metadata from Indian news articles. " +
  "Return ONLY valid JSON (no markdown, no commentary). Every field you cannot confirm " +
  "from the article text MUST be null — never guess dates, budgets, names, or parties. " +
  "Be factually neutral. Never use words like 'scam', 'loot', 'corrupt', or 'waste'. " +
  "If an article alleges wrongdoing, report it as-is without endorsing the characterisation.";

function buildExtractionPrompt(article: NewsArticleRef): string {
  return `Article title: "${article.title}"
Source: ${article.source ?? article.url}
Published: ${article.publishedAt.toISOString().split("T")[0]}

Extract infrastructure project metadata. Return JSON shaped:

{
  "projectName": "Full project name, e.g. 'Mumbai Coastal Road Phase 2'",
  "shortName": "Canonical short name, 2-4 words, e.g. 'Coastal Road'",
  "description": "1-2 short factual sentences explaining what the project IS and what problem it solves for citizens. Skip if the article doesn't supply enough detail.",
  "category": "ROAD|METRO|RAIL|BRIDGE|FLYOVER|WATER|SEWAGE|HOUSING|PORT|AIRPORT|POWER|TELECOM|HOSPITAL|SCHOOL|OTHER",
  "updateType": "ANNOUNCEMENT|APPROVAL|TENDER|CONSTRUCTION_START|BUDGET_INCREASE|BUDGET_DECREASE|DELAY|STALL|PROGRESS_UPDATE|CONTROVERSY|COMPLETION|CANCELLATION|PHASE_COMPLETE|INAUGURATION|REVIEW",
  "announcedBy": "The person named in the article who announced/approved this, or null if only 'the government' is mentioned",
  "announcedByRole": "Their designation (e.g. 'Chief Minister, Maharashtra'), or null",
  "party": "Their party affiliation ONLY if the article mentions it, or null",
  "keyPeople": [{"name":"...", "role":"...", "party":"... or null", "context":"what they did in this article"}],
  "executingAgency": "NHAI|MMRDA|BMC|PWD|Metro Rail Corp|...  or null",
  "budget": "Budget in RUPEES as a plain integer (₹12,700 Cr → 127000000000, ₹500 Lakh → 50000000), or null",
  "progressPct": "Number 0-100 or null",
  "status": "PROPOSED|APPROVED|TENDER_ISSUED|UNDER_CONSTRUCTION|ON_TRACK|DELAYED|STALLED|CANCELLED|COMPLETED",
  "startDate": "YYYY-MM-DD or null",
  "expectedEndDate": "YYYY-MM-DD or null",
  "cancellationReason": "string if CANCELLED/STALLED with reason given, else null",
  "scope": "DISTRICT|STATE|NATIONAL",
  "districtNames": ["Mumbai", "Thane"],
  "summary": "One factual sentence describing THIS update (not the whole project).",
  "confidence": 0.0-1.0
}

Hard rules:
- Budget: convert "₹X Cr" → X*10000000, "₹X Lakh" → X*100000, "₹X crore" → X*10000000.
- Never infer party affiliation if the article doesn't state it — set party to null.
- Never assume a person if the article says "the government", "officials", "sources".
- Never invent dates. If only a year is mentioned without month/day, set the date to null.
- districtNames must be places actually named in the article.
- If the article is not about an identifiable infrastructure project, return {"projectName":""}.`;
}

export async function extractInfraFromNews(
  article: NewsArticleRef,
  opts: InfraAIOptions = {},
): Promise<InfraExtraction | null> {
  try {
    const { data: parsed } = await callAIJSON<Record<string, unknown>>({
      systemPrompt: EXTRACTION_SYSTEM,
      userPrompt: buildExtractionPrompt(article),
      purpose: "classify", // free tier per spec
      jsonShape: "object",
      maxTokens: 1400,
      temperature: 0,
      timeoutMs: 30_000,
      deadlineAt: opts.deadlineAt,
    });
    const safe = sanitizeInfra(parsed, article.title);
    return safe ? applyScopeOverride(safe) : null;
  } catch (err) {
    aiFailure("extract", err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// AI: verification (second pass, different prompt)
// ═══════════════════════════════════════════════════════════

const VERIFY_SYSTEM =
  "You are a verifier for an infrastructure-tracking pipeline. Given an article and a prior extraction, " +
  "flag anything that cannot be verified directly from the article text. Return ONLY JSON. " +
  "Be factually neutral: never use 'scam', 'loot', 'corrupt', 'waste' or any moral judgment. " +
  "Never attribute blame to a person or party — only flag what the article does or does not state.";

function buildVerifyPrompt(article: NewsArticleRef, extraction: InfraExtraction): string {
  return `Article: "${article.title}"
Source: ${article.source ?? article.url}
Published: ${article.publishedAt.toISOString().split("T")[0]}

Prior extraction:
${JSON.stringify(extraction, null, 2)}

Verify:
1. Is "projectName" actually named (or clearly referenced) in the article?
2. Are announcedBy / keyPeople / party values supported by the article text?
3. Is the budget figure correctly converted to RUPEES (not Crores, not Lakhs)?
4. Is the status mapping consistent with the article's language?
5. Are any dates inferred rather than stated?

Return JSON:
{
  "verified": true|false,
  "corrections": {<any fields the extraction got wrong — same shape as extraction, include only the corrected fields>},
  "flags": ["short human-readable notes — e.g. 'party assumed, not in article'"]
}

Set verified=false if the article doesn't support the core facts. Be conservative.`;
}

export async function verifyInfraExtraction(
  article: NewsArticleRef,
  extraction: InfraExtraction,
  opts: InfraAIOptions = {},
): Promise<InfraVerification> {
  try {
    const { data: parsed } = await callAIJSON<Partial<InfraVerification>>({
      systemPrompt: VERIFY_SYSTEM,
      userPrompt: buildVerifyPrompt(article, extraction),
      purpose: "classify", // free tier
      jsonShape: "object",
      maxTokens: 800,
      temperature: 0,
      timeoutMs: 30_000,
      deadlineAt: opts.deadlineAt,
    });
    return {
      verified: parsed.verified === true,
      corrections: parsed.corrections ?? null,
      flags: Array.isArray(parsed.flags) ? parsed.flags.filter((s): s is string => typeof s === "string").slice(0, 10) : [],
    };
  } catch (err) {
    aiFailure("verify", err);
    // On verifier failure (or no time left), don't falsely mark verified — nothing is written.
    return { verified: false, corrections: null, flags: ["verifier_error"] };
  }
}

// ═══════════════════════════════════════════════════════════
// Sync: upsert + timeline entry
// ═══════════════════════════════════════════════════════════

async function findTargetDistricts(extraction: InfraExtraction, sourceDistrictId: string) {
  // NATIONAL projects are not written to any district. The old fan-out
  // copied them onto EVERY active district (Sept 2026 audit: a Delhi project
  // was listed on all ten district pages, an RRTS line on nine). A national
  // project that runs through a district is re-extracted from that
  // district's own news with scope DISTRICT.
  if (extraction.scope === "NATIONAL") return [];
  if (extraction.scope === "STATE") {
    const src = await prisma.district.findUnique({
      where: { id: sourceDistrictId },
      select: { id: true, slug: true, stateId: true },
    });
    if (!src) return [];
    // If the AI extracted specific district names, only target those districts
    // within the source state — don't fan out to ALL state districts.
    const stripSuffixState = (n: string) =>
      n.trim().replace(/\s+(district|dist\.?)$/i, "").trim();
    const stateNames = extraction.districtNames
      .map(stripSuffixState)
      .filter(Boolean)
      .map((n) => n.toLowerCase());
    if (stateNames.length > 0) {
      const matched = await prisma.district.findMany({
        where: {
          stateId: src.stateId,
          active: true,
          OR: stateNames.map((n) => ({ name: { equals: n, mode: "insensitive" as const } })),
        },
        select: { id: true, slug: true, stateId: true },
      });
      if (matched.length > 0) return matched;
    }
    // No specific districts named — fall back to source district only
    // (safer than applying to ALL districts in the state).
    return [{ id: src.id, slug: src.slug, stateId: src.stateId }];
  }
  // DISTRICT: if article names specific districts, try to hit them by name;
  // else default to the source district.
  // Normalize extracted names: AI sometimes returns "Mandya District" or "Mandya
  // dist." — strip these suffixes so equality matching finds the canonical row.
  const stripSuffix = (n: string) =>
    n.trim().replace(/\s+(district|dist\.?)$/i, "").trim();
  const normalizedNames = extraction.districtNames.map(stripSuffix).filter(Boolean);

  // Additionally, scan the project name for an "in <Name> district" pattern —
  // a strong explicit-location signal that overrides the source-district
  // fallback when the AI extraction missed populating districtNames.
  const nameScanMatches: string[] = [];
  const inDistrictRe = /\bin\s+([A-Z][A-Za-z\- ]{2,30}?)\s+district\b/gi;
  for (const m of extraction.projectName.matchAll(inDistrictRe)) {
    nameScanMatches.push(stripSuffix(m[1]));
  }

  const candidateNames = Array.from(
    new Set([...normalizedNames, ...nameScanMatches].map((n) => n.toLowerCase()))
  );

  // Always fetch the source district so we can validate state membership.
  const src = await prisma.district.findUnique({
    where: { id: sourceDistrictId },
    select: { id: true, slug: true, stateId: true },
  });
  if (!src) return [];

  if (candidateNames.length > 0) {
    const rows = await prisma.district.findMany({
      where: {
        active: true,
        // By name, or by slug: the scope override (src/lib/infra-extraction.ts)
        // names the district by its slug ("bengaluru-urban"), which never
        // equalled a name, so "Hebbal Flyover" from the Mysuru feed was filed
        // under Mysuru.
        OR: candidateNames.flatMap((n) => [{ name: { equals: n, mode: "insensitive" as const } }, { slug: n }]),
      },
      select: { id: true, slug: true, stateId: true },
    });
    // CRITICAL: Only accept districts in the SAME STATE as the source article's
    // district. This prevents a Mandya scraper from accidentally assigning a
    // project to Mumbai just because the article mentions Mumbai.
    const sameState = rows.filter((r) => r.stateId === src.stateId);
    if (sameState.length > 0) return sameState;
    // Every place named is in another state: the project is not this
    // district's. Write nothing (it used to be filed under the source
    // district — a Bengaluru metro line on the Chennai page).
    if (rows.length > 0) {
      console.warn(
        `[infra-sync] Cross-state district match: article from ${src.slug} ` +
        `names ${rows.map((r) => r.slug).join(", ")} in other state(s) — not written.`
      );
      return [];
    }
  }
  return [src];
}

function mergeSourceUrls(existing: unknown, next: string): string[] {
  const arr = Array.isArray(existing) ? (existing as unknown[]).filter((v): v is string => typeof v === "string") : [];
  if (!arr.includes(next)) arr.push(next);
  return arr.slice(-20); // keep last 20
}

// ── Is this project already stored? ──────────────────────────
// Sept 2026: the old matcher took "name contains the first three words"
// (so "Bengaluru Metro Phase 3" matched Phase 2) and knew no aliases (so
// "Atal Setu" and "Sewri–Nhava Sheva" became two projects). It now uses
// the shared canonical keys (src/lib/dedupe/keys.ts, match.ts): same
// canonical name, same 2+-word short name, or similarity ≥ 0.85 — never
// across different numbers (Phase 1 / Phase 2, Line 2A / Line 3). A match
// is updated fill-only; the duplicate guard queues anything closer than
// that for a person to look at.
async function findExistingProject(districtId: string, extraction: InfraExtraction) {
  const pool = await prisma.infraProject.findMany({
    where: { districtId },
    orderBy: { updatedAt: "desc" },
    take: 1000,
  });
  const match = findSameNamed(pool, { name: extraction.projectName, shortName: extraction.shortName });
  if (match && match.how !== "exact") {
    console.log(`[infra-sync] dedup-match (${match.how}, ${match.score.toFixed(2)}): "${extraction.projectName}" ≈ "${match.row.name}"`);
  }
  return match?.row ?? null;
}

function mergeKeyPeople(existing: unknown, incoming: KeyPerson[]): KeyPerson[] {
  const prev: KeyPerson[] = Array.isArray(existing)
    ? (existing as unknown[])
        .map((p) => (p && typeof p === "object" ? (p as KeyPerson) : null))
        .filter((p): p is KeyPerson => !!p && typeof p.name === "string")
    : [];
  const byKey = new Map<string, KeyPerson>();
  for (const p of prev) byKey.set(`${p.name}|${p.role ?? ""}`.toLowerCase(), p);
  for (const p of incoming) {
    const key = `${p.name}|${p.role ?? ""}`.toLowerCase();
    if (!byKey.has(key)) byKey.set(key, p);
  }
  return [...byKey.values()].slice(0, 25);
}

export interface InfraSyncResult {
  projectsTouched: number;
  created: number;
  updatedProjects: number;
  timelineCreated: number;
  duplicatesSkipped: number;
}

export async function syncInfraFromNews(
  extraction: InfraExtraction,
  article: NewsArticleRef,
  sourceDistrictId: string,
  verified: boolean = false
): Promise<InfraSyncResult> {
  // Only a political party is stored as a party. The extraction wrote
  // agencies, lenders and companies there ("JICA", "Jindal Steel",
  // "Telangana government") and the page showed them as parties (Sept
  // 2026 audit).
  extraction = {
    ...extraction,
    party: politicalParty(extraction.party),
    keyPeople: extraction.keyPeople.map((k) => ({ ...k, party: politicalParty(k.party) })),
  };
  const targets = await findTargetDistricts(extraction, sourceDistrictId);
  if (targets.length === 0) {
    return { projectsTouched: 0, created: 0, updatedProjects: 0, timelineCreated: 0, duplicatesSkipped: 0 };
  }

  // Log when a project is being assigned to a different district than the
  // source article's origin — this is expected for scope overrides but helps
  // audit potential contamination.
  const crossDistrict = targets.filter((t) => t.id !== sourceDistrictId);
  if (crossDistrict.length > 0) {
    console.warn(
      `[infra-sync] Cross-district assignment: article from source district ${sourceDistrictId} ` +
      `→ targeting ${crossDistrict.map((t) => t.slug).join(", ")} (scope=${extraction.scope}). ` +
      `Project: "${extraction.projectName.slice(0, 60)}"`
    );
  }

  const now = new Date();
  const startDate = parseDate(extraction.startDate);
  const expectedEnd = parseDate(extraction.expectedEndDate);
  const isCancel = extraction.status === "CANCELLED";

  let created = 0;
  let updatedProjects = 0;
  let timelineCreated = 0;
  let duplicatesSkipped = 0;

  for (const t of targets) {
    // Same project already stored in this district? (canonical name / alias / ≥ 0.85 similar)
    let project = await findExistingProject(t.id, extraction);
    const isNew = !project;
    let changed = false;

    // ── CREATE ────────────────────────────────────────────
    if (!project) {
      project = await prisma.infraProject.create({
        data: {
          districtId: t.id,
          name: extraction.projectName,
          shortName: extraction.shortName,
          description: extraction.description,
          category: extraction.category,
          status: extraction.status,
          scope: extraction.scope,
          announcedBy: extraction.announcedBy,
          announcedByRole: extraction.announcedByRole,
          party: extraction.party,
          executingAgency: extraction.executingAgency,
          keyPeople: extraction.keyPeople.length ? (extraction.keyPeople as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          originalBudget: extraction.budget,
          revisedBudget: extraction.budget,
          budget: extraction.budget,
          progressPct: extraction.progressPct,
          // The article's date, and only for an announcement: the sync date
          // said "announced Apr 2026" for a line opened in 2021.
          announcedDate: !isCancel && extraction.updateType === "ANNOUNCEMENT" ? article.publishedAt : null,
          actualStartDate: startDate,
          startDate: startDate,
          originalEndDate: expectedEnd,
          expectedEnd: expectedEnd,
          cancelledDate: isCancel ? now : null,
          cancellationReason: isCancel ? extraction.cancellationReason : null,
          source: article.url,
          sourceUrls: [article.url] as Prisma.InputJsonValue,
          lastNewsAt: now,
          lastVerifiedAt: verified ? now : null,
          verificationCount: verified ? 1 : 0,
        },
      });
      created++;
    } else {
      // ── UPDATE (never downgrade, never overwrite concrete with null) ──
      const incomingRank = statusRank(extraction.status);
      const existingRank = statusRank(project.status);

      // The facts this article changes (bookkeeping is added below).
      const patch: Prisma.InfraProjectUpdateInput = {};

      // Status: allow cancel from any state; otherwise only upward
      if (isCancel && project.status !== "CANCELLED" && project.status !== "cancelled") {
        patch.status = "CANCELLED";
        if (!project.cancelledDate) patch.cancelledDate = now;
        if (!project.cancellationReason && extraction.cancellationReason) patch.cancellationReason = extraction.cancellationReason;
      } else if (incomingRank > existingRank && statusRank(project.status) !== 99) {
        patch.status = extraction.status;
      }

      // Budget lifecycle
      if (extraction.budget != null) {
        if (project.originalBudget == null) {
          patch.originalBudget = extraction.budget;
          patch.budget = extraction.budget;
          patch.revisedBudget = extraction.budget;
        } else if (extraction.budget !== project.revisedBudget && plausibleBudgetRevision(project.originalBudget, extraction.budget)) {
          // A figure over 3× or under half the first budget is not stored:
          // it is far more often a lakh/crore slip or another project in the
          // article (Namma Metro Phase 2A/2B got "+298%", Sept 2026 audit).
          patch.revisedBudget = extraction.budget;
          patch.budget = extraction.budget;
          const overrun = extraction.budget - project.originalBudget;
          patch.costOverrun = overrun;
          patch.costOverrunPct = project.originalBudget > 0 ? (overrun / project.originalBudget) * 100 : null;
        }
      }

      // Progress: only update if newer and higher
      if (extraction.progressPct != null) {
        if (project.progressPct == null || extraction.progressPct >= project.progressPct) {
          patch.progressPct = extraction.progressPct;
        }
      }

      // Dates: fill-only
      if (!project.actualStartDate && startDate) {
        patch.actualStartDate = startDate;
        if (!project.startDate) patch.startDate = startDate;
      }
      if (!project.originalEndDate && expectedEnd) {
        patch.originalEndDate = expectedEnd;
        if (!project.expectedEnd) patch.expectedEnd = expectedEnd;
      } else if (project.originalEndDate && expectedEnd && expectedEnd.getTime() > project.originalEndDate.getTime()) {
        // Deadline extended
        patch.revisedEndDate = expectedEnd;
        const monthsDelay = Math.round((expectedEnd.getTime() - project.originalEndDate.getTime()) / (30 * 86_400_000));
        if (monthsDelay > 0) patch.delayMonths = monthsDelay;
      }

      // People: fill-only for principals, APPEND for keyPeople
      if (!project.announcedBy && extraction.announcedBy) patch.announcedBy = extraction.announcedBy;
      if (!project.announcedByRole && extraction.announcedByRole) patch.announcedByRole = extraction.announcedByRole;
      if (!project.party && extraction.party) patch.party = extraction.party;
      if (!project.executingAgency && extraction.executingAgency) patch.executingAgency = extraction.executingAgency;
      if (!project.shortName) patch.shortName = extraction.shortName;
      if (!project.description && extraction.description) patch.description = extraction.description;
      if (!project.scope) patch.scope = extraction.scope;

      if (extraction.keyPeople.length > 0) {
        const merged = mergeKeyPeople(project.keyPeople, extraction.keyPeople);
        // Only when someone new is named (the old code rewrote the list on
        // every mention, which counted every mention as an update).
        if (merged.length > mergeKeyPeople(project.keyPeople, []).length) {
          patch.keyPeople = merged as unknown as Prisma.InputJsonValue;
        }
      }
      changed = Object.keys(patch).length > 0;

      // Bookkeeping on every mention: when the news last named it, which articles, verification.
      patch.lastNewsAt = now;
      patch.sourceUrls = mergeSourceUrls(project.sourceUrls, article.url) as unknown as Prisma.InputJsonValue;
      if (verified) {
        patch.lastVerifiedAt = now;
        patch.verificationCount = { increment: 1 };
      }
      await prisma.infraProject.update({ where: { id: project.id }, data: patch });
      if (changed) updatedProjects++;
      else duplicatesSkipped++;
    }

    // ── TIMELINE ENTRY (dedupe by newsUrl) ────────────────
    const existingEntry = await prisma.infraUpdate.findFirst({
      where: { projectId: project.id, newsUrl: article.url },
      select: { id: true },
    });
    const timelineAdded = !existingEntry;
    if (timelineAdded) {
      const budgetChange =
        extraction.updateType === "BUDGET_INCREASE" || extraction.updateType === "BUDGET_DECREASE"
          ? extraction.budget ?? null
          : null;
      await prisma.infraUpdate.create({
        data: {
          projectId: project.id,
          date: article.publishedAt,
          headline: extraction.summary || article.title,
          summary: extraction.summary || null,
          updateType: extraction.updateType,
          personName: extraction.announcedBy ?? (extraction.keyPeople[0]?.name ?? null),
          personRole: extraction.announcedByRole ?? (extraction.keyPeople[0]?.role ?? null),
          personParty: extraction.party ?? (extraction.keyPeople[0]?.party ?? null),
          budgetChange,
          progressPct: extraction.progressPct,
          statusChange: extraction.status,
          newsUrl: article.url,
          newsTitle: article.title,
          newsSource: article.source ?? null,
          newsDate: article.publishedAt,
          verified,
          verifiedAt: verified ? now : null,
        },
      });
      timelineCreated++;
    }

    // Cache bust
    try {
      await cacheSet(cacheKey(t.slug, "infrastructure"), null, 1);
    } catch {
      /* cache optional */
    }

    // UpdateLog (the public change feed): only when the project was created,
    // a fact changed or its timeline got this article — not for a repeat of
    // an article already on the timeline.
    if (!isNew && !changed && !timelineAdded) continue;
    await logUpdate({
      source: "scraper",
      actorLabel: "news-cron",
      tableName: "InfraProject",
      recordId: project.id,
      action: isNew ? "create" : "update",
      districtId: t.id,
      moduleName: "infrastructure",
      description: `${extraction.shortName}: ${extraction.updateType}`,
      recordCount: 1,
      details: {
        scope: extraction.scope,
        status: extraction.status,
        verified,
        newsUrl: article.url,
      },
    });
  }

  return {
    projectsTouched: targets.length,
    created,
    updatedProjects,
    timelineCreated,
    duplicatesSkipped,
  };
}

/**
 * Top-level orchestrator: extract → verify → sync.
 * Returns null when the article isn't about a real project or the verifier
 * did not confirm it.
 */
export async function extractVerifyAndSyncInfra(
  article: NewsArticleRef,
  sourceDistrictId: string,
  opts: InfraAIOptions = {},
): Promise<InfraSyncResult | null> {
  const extraction = await extractInfraFromNews(article, opts);
  if (!extraction) return null;
  if (extraction.confidence < 0.5) return null;

  // Verified or hidden: only what the second pass confirms is written. (It
  // used to be written anyway when the extractor rated itself ≥ 0.85 —
  // also when the verifier said the article does not support it, or failed.)
  const verification = await verifyInfraExtraction(article, extraction, opts);
  if (!verification.verified) {
    console.log(`[infra-sync] skipped unverified: "${article.title.slice(0, 80)}" flags=${verification.flags.join(",")}`);
    return null;
  }

  // The verifier's corrections are raw model JSON: they go through the same
  // checks and the same scope rules as the first extraction. A correction
  // that nulls the project name means the article does not name one.
  const corrections =
    verification.corrections && typeof verification.corrections === "object" && !Array.isArray(verification.corrections)
      ? verification.corrections
      : {};
  const merged = sanitizeInfra({ ...extraction, ...corrections }, article.title);
  if (!merged) {
    console.log(`[infra-sync] skipped: verifier nulled projectName for "${article.title.slice(0, 80)}"`);
    return null;
  }

  return syncInfraFromNews(applyScopeOverride(merged), article, sourceDistrictId, true);
}
