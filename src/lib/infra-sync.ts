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
import { callAI } from "./ai-provider";
import { cacheKey, cacheSet } from "./cache";
import { logUpdate } from "./update-log";
import {
  detectDistrictFromName,
  detectDistrictFromAgency,
  allDistrictsMentionedInName,
} from "./constants/infra-locations";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type InfraCategory =
  | "ROAD" | "METRO" | "RAIL" | "BRIDGE" | "FLYOVER" | "WATER" | "SEWAGE"
  | "HOUSING" | "PORT" | "AIRPORT" | "POWER" | "TELECOM" | "HOSPITAL"
  | "SCHOOL" | "OTHER";

export type InfraStatus =
  | "PROPOSED" | "APPROVED" | "TENDER_ISSUED" | "UNDER_CONSTRUCTION"
  | "ON_TRACK" | "DELAYED" | "STALLED" | "CANCELLED" | "COMPLETED";

export type InfraUpdateType =
  | "ANNOUNCEMENT" | "APPROVAL" | "TENDER" | "CONSTRUCTION_START"
  | "BUDGET_INCREASE" | "BUDGET_DECREASE" | "DELAY" | "STALL"
  | "PROGRESS_UPDATE" | "CONTROVERSY" | "COMPLETION" | "CANCELLATION"
  | "PHASE_COMPLETE" | "INAUGURATION" | "REVIEW" | "SEED";

export type InfraScope = "DISTRICT" | "STATE" | "NATIONAL";

export interface KeyPerson {
  name: string;
  role: string | null;
  party: string | null;
  context: string | null;
}

export interface InfraExtraction {
  projectName: string;
  shortName: string;
  description: string | null;
  category: InfraCategory;
  updateType: InfraUpdateType;
  announcedBy: string | null;
  announcedByRole: string | null;
  party: string | null;
  keyPeople: KeyPerson[];
  executingAgency: string | null;
  budget: number | null; // rupees
  progressPct: number | null;
  status: InfraStatus;
  startDate: string | null;
  expectedEndDate: string | null;
  cancellationReason: string | null;
  scope: InfraScope;
  districtNames: string[];
  summary: string;
  confidence: number;
}

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
  article: NewsArticleRef
): Promise<InfraExtraction | null> {
  try {
    const response = await callAI({
      systemPrompt: EXTRACTION_SYSTEM,
      userPrompt: buildExtractionPrompt(article),
      purpose: "classify", // free tier per spec
      jsonMode: true,
      maxTokens: 1400,
      temperature: 0,
    });
    const cleaned = response.text.trim().replace(/```(?:json)?/g, "").trim();
    const parsed = JSON.parse(cleaned) as Partial<InfraExtraction>;
    if (!parsed.projectName || typeof parsed.projectName !== "string" || parsed.projectName.trim().length < 3) {
      return null;
    }
    const safe: InfraExtraction = {
      projectName: parsed.projectName.trim(),
      shortName: (parsed.shortName ?? parsed.projectName).toString().trim(),
      description: typeof parsed.description === "string" && parsed.description.trim().length > 10
        ? parsed.description.trim().slice(0, 400)
        : null,
      category: (parsed.category as InfraCategory) ?? "OTHER",
      updateType: (parsed.updateType as InfraUpdateType) ?? "ANNOUNCEMENT",
      announcedBy: parsed.announcedBy ?? null,
      announcedByRole: parsed.announcedByRole ?? null,
      party: parsed.party ?? null,
      keyPeople: Array.isArray(parsed.keyPeople)
        ? parsed.keyPeople
            .filter((p): p is KeyPerson => !!p && typeof (p as KeyPerson).name === "string")
            .slice(0, 10)
        : [],
      executingAgency: parsed.executingAgency ?? null,
      budget: typeof parsed.budget === "number" ? parsed.budget : null,
      progressPct: typeof parsed.progressPct === "number" ? Math.min(100, Math.max(0, parsed.progressPct)) : null,
      status: (parsed.status as InfraStatus) ?? "PROPOSED",
      startDate: parsed.startDate ?? null,
      expectedEndDate: parsed.expectedEndDate ?? null,
      cancellationReason: parsed.cancellationReason ?? null,
      scope: (parsed.scope as InfraScope) ?? "DISTRICT",
      districtNames: Array.isArray(parsed.districtNames) ? parsed.districtNames.filter((s): s is string => typeof s === "string") : [],
      summary: parsed.summary ?? article.title,
      confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
    };
    return applyScopeOverride(safe);
  } catch (err) {
    console.error("[infra-sync] extract failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

// ── Rule-based scope override ──────────────────────────────
// AI sometimes returns scope=STATE for a clearly city-level project
// (e.g. "Bengaluru Metro"), which then fans out to every Karnataka
// district. These rules force the correct scope from the project name
// before the sync engine ever sees it.
const NAMED_CITY_RX = /\b(bengaluru|bangalore|namma|mumbai|hyderabad|chennai|delhi|kolkata|lucknow|mysuru|mysore|mandya|pune|ahmedabad|surat|jaipur|nagpur|kanpur|thiruvananthapuram|kochi|bhubaneswar|patna|guwahati|chandigarh|coimbatore|indore|bhopal|vadodara|nashik|nagaland|gurgaon|gurugram|noida|ghaziabad)\b/i;
const CITY_PROJECT_MARKER_RX = /\b(metro|airport|flyover|depot|station|municipal|bmc|ndmc|mcd|smart\s*city|outer\s*ring\s*road|peripheral\s*ring\s*road|inner\s*ring\s*road|orbital|sub-?urban\s*rail)\b/i;
const STATE_HIGHWAY_RX = /\b(state\s*highway|sh-\d+|state\s*high\s*way)\b/i;
const NATIONAL_RX = /\b(national\s*highway|nh-?\d+|bharatmala|sagarmala|pmgsy|bullet\s*train|vande\s*bharat|namo\s*bharat|rrts|udan)\b/i;

function applyScopeOverride(extraction: InfraExtraction): InfraExtraction {
  const name = extraction.projectName;

  // Pass 1 — AREA mapping (from shared infra-locations constants).
  // If the name references a single neighborhood/area that uniquely maps to
  // one district, force scope=DISTRICT + districtNames=[that district] so the
  // sync fan-out stays narrow.
  const mentioned = allDistrictsMentionedInName(name);
  if (mentioned.length === 1) {
    const target = mentioned[0];
    if (extraction.scope !== "DISTRICT" || !extraction.districtNames.includes(target)) {
      console.log(`[infra-sync] scope override: "${name.slice(0, 60)}" → DISTRICT (area maps to ${target})`);
      return { ...extraction, scope: "DISTRICT", districtNames: [target] };
    }
    return extraction;
  }
  // Area detected but maps to null (e.g. "Nagpur Metro Phase II") →
  // returning "NATIONAL" lets the caller decide to drop it via verification
  // gates; we also flag district=null so sync finds no target.
  const areaNullHit = detectDistrictFromName(name);
  if (areaNullHit === null) {
    console.log(`[infra-sync] scope override: "${name.slice(0, 60)}" references a city not served — marked NATIONAL w/ empty districtNames`);
    return { ...extraction, scope: "NATIONAL", districtNames: [] };
  }

  // Pass 2 — AGENCY mapping. BMRCL/CMRL/DMRC/… are city-locked, overriding
  // the scope even if the project name doesn't mention the city.
  if (extraction.executingAgency) {
    const agencyDistrict = detectDistrictFromAgency(extraction.executingAgency);
    if (agencyDistrict) {
      console.log(`[infra-sync] scope override: agency "${extraction.executingAgency}" → DISTRICT ${agencyDistrict}`);
      return { ...extraction, scope: "DISTRICT", districtNames: [agencyDistrict] };
    }
  }

  // Pass 3 — the original regex rules (two cities → STATE, NH-/Vande Bharat → NATIONAL)
  const namesTwo = (() => {
    let count = 0;
    let m: RegExpExecArray | null;
    const rx = new RegExp(NAMED_CITY_RX.source, "gi");
    while ((m = rx.exec(name)) && count < 3) count++;
    return count >= 2;
  })();

  let next: InfraScope | null = null;
  if (NATIONAL_RX.test(name)) next = "NATIONAL";
  else if (namesTwo) next = "STATE";
  else if (STATE_HIGHWAY_RX.test(name)) next = "STATE";
  else if (NAMED_CITY_RX.test(name) && CITY_PROJECT_MARKER_RX.test(name)) next = "DISTRICT";

  if (next && next !== extraction.scope) {
    console.log(`[infra-sync] scope override: AI said ${extraction.scope} but "${name.slice(0, 60)}" forced to ${next}`);
    return { ...extraction, scope: next };
  }
  return extraction;
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
  extraction: InfraExtraction
): Promise<InfraVerification> {
  try {
    const response = await callAI({
      systemPrompt: VERIFY_SYSTEM,
      userPrompt: buildVerifyPrompt(article, extraction),
      purpose: "classify", // free tier
      jsonMode: true,
      maxTokens: 800,
      temperature: 0,
    });
    const cleaned = response.text.trim().replace(/```(?:json)?/g, "").trim();
    const parsed = JSON.parse(cleaned) as Partial<InfraVerification>;
    return {
      verified: parsed.verified === true,
      corrections: parsed.corrections ?? null,
      flags: Array.isArray(parsed.flags) ? parsed.flags.filter((s): s is string => typeof s === "string").slice(0, 10) : [],
    };
  } catch (err) {
    console.error("[infra-sync] verify failed:", err instanceof Error ? err.message : err);
    // On verifier failure, don't falsely mark verified — return neutral
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
        OR: candidateNames.map((n) => ({ name: { equals: n, mode: "insensitive" as const } })),
      },
      select: { id: true, slug: true, stateId: true },
    });
    // CRITICAL: Only accept districts in the SAME STATE as the source article's
    // district. This prevents a Mandya scraper from accidentally assigning a
    // project to Mumbai just because the article mentions Mumbai.
    const sameState = rows.filter((r) => r.stateId === src.stateId);
    if (sameState.length > 0) return sameState;
    // If all matched districts are in other states, fall back to source district
    // rather than polluting other states' data.
    if (rows.length > 0) {
      console.warn(
        `[infra-sync] Cross-state district match suppressed: article from ${src.slug} ` +
        `matched ${rows.map((r) => r.slug).join(", ")} in different state(s). Falling back to source district.`
      );
    }
  }
  return [src];
}

function mergeSourceUrls(existing: unknown, next: string): string[] {
  const arr = Array.isArray(existing) ? (existing as unknown[]).filter((v): v is string => typeof v === "string") : [];
  if (!arr.includes(next)) arr.push(next);
  return arr.slice(-20); // keep last 20
}

// ── Dedup helpers (sync-time fuzzy matcher) ───────────────────
const STOP = new Set(["the", "of", "in", "a", "an", "for", "to", "and", "at", "on", "by", "with", "from"]);
function significantTokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    // Keep anything with a digit (so "2a", "3", "phase-2", "line-6" survive
    // and distinguish Metro Line 2A from Metro Line 3). Otherwise require len>2.
    .filter((w) => (w.length > 2 || /\d/.test(w)) && !STOP.has(w));
}
function tokenOverlap(a: string, b: string): number {
  const ta = new Set(significantTokens(a));
  const tb = new Set(significantTokens(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let hits = 0;
  for (const t of ta) if (tb.has(t)) hits++;
  return hits / Math.min(ta.size, tb.size);
}
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const v0 = new Array(b.length + 1).fill(0);
  const v1 = new Array(b.length + 1).fill(0);
  for (let i = 0; i <= b.length; i++) v0[i] = i;
  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= b.length; j++) v0[j] = v1[j];
  }
  return v1[b.length];
}
/**
 * Find an existing project in the district that is the "same thing" as
 * the incoming extraction. Handles three passes:
 *   1. exact shortName/title contains match
 *   2. first 4 significant-token overlap
 *   3. Levenshtein distance ≤ 30% of shorter title length
 */
async function findExistingProject(
  districtId: string,
  extraction: InfraExtraction
): Promise<{ id: string; name: string; [k: string]: unknown } | null> {
  const namePrefix = extraction.projectName.split(/\s+/).slice(0, 3).join(" ");
  // Pass 1 — contains / shortName match in DB
  const dbMatches = await prisma.infraProject.findMany({
    where: {
      districtId,
      OR: [
        { shortName: { equals: extraction.shortName, mode: "insensitive" } },
        { name: { contains: extraction.shortName, mode: "insensitive" } },
        { name: { contains: namePrefix, mode: "insensitive" } },
      ],
    },
  });
  if (dbMatches.length > 0) return dbMatches[0] as unknown as { id: string; name: string };

  // Pass 2 & 3 — pull recent projects for this district, do fuzzy in-memory
  const pool = await prisma.infraProject.findMany({
    where: { districtId },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  for (const candidate of pool) {
    // Guard: if both names contain digit tokens AND those sets differ,
    // these are distinguishable (Metro Line 2A vs 3, Phase 1 vs 2).
    const digitsA = new Set(significantTokens(candidate.name).filter((t) => /\d/.test(t)));
    const digitsB = new Set(significantTokens(extraction.projectName).filter((t) => /\d/.test(t)));
    if (digitsA.size > 0 && digitsB.size > 0) {
      const shared = [...digitsA].some((d) => digitsB.has(d));
      if (!shared) continue; // different numbers → different project
    }
    const overlap = tokenOverlap(candidate.name, extraction.projectName);
    if (overlap >= 0.75) {
      console.log(`[infra-sync] dedup-match via token overlap (${overlap.toFixed(2)}): "${extraction.projectName}" ≈ "${candidate.name}"`);
      return candidate as unknown as { id: string; name: string };
    }
    const short = Math.min(candidate.name.length, extraction.projectName.length);
    if (short >= 10) {
      const dist = levenshtein(candidate.name.toLowerCase(), extraction.projectName.toLowerCase());
      if (dist / short < 0.15) {
        console.log(`[infra-sync] dedup-match via Levenshtein (d=${dist}, ratio=${(dist / short).toFixed(2)}): "${extraction.projectName}" ≈ "${candidate.name}"`);
        return candidate as unknown as { id: string; name: string };
      }
    }
  }
  return null;
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
    // Use the richer matcher (exact → token-overlap → Levenshtein)
    const matched = await findExistingProject(t.id, extraction);
    let project = matched
      ? await prisma.infraProject.findUnique({ where: { id: matched.id } })
      : null;

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
          announcedDate: isCancel ? null : now,
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

      const patch: Prisma.InfraProjectUpdateInput = {
        lastNewsAt: now,
      };

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
        } else if (extraction.budget !== project.revisedBudget) {
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
        patch.keyPeople = merged as unknown as Prisma.InputJsonValue;
      }

      patch.sourceUrls = mergeSourceUrls(project.sourceUrls, article.url) as unknown as Prisma.InputJsonValue;
      if (verified) {
        patch.lastVerifiedAt = now;
        patch.verificationCount = { increment: 1 };
      }

      if (Object.keys(patch).length > 2) {
        await prisma.infraProject.update({ where: { id: project.id }, data: patch });
        updatedProjects++;
      } else {
        await prisma.infraProject.update({ where: { id: project.id }, data: { lastNewsAt: now, sourceUrls: patch.sourceUrls } });
        duplicatesSkipped++;
      }
    }

    // ── TIMELINE ENTRY (dedupe by newsUrl) ────────────────
    const existingEntry = await prisma.infraUpdate.findFirst({
      where: { projectId: project.id, newsUrl: article.url },
      select: { id: true },
    });
    if (!existingEntry) {
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

    // UpdateLog
    await logUpdate({
      source: "scraper",
      actorLabel: "news-cron",
      tableName: "InfraProject",
      recordId: project.id,
      action: existingEntry ? "update" : "update",
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
 * Returns null when the article isn't about a real project or verification fails.
 */
export async function extractVerifyAndSyncInfra(
  article: NewsArticleRef,
  sourceDistrictId: string
): Promise<InfraSyncResult | null> {
  const extraction = await extractInfraFromNews(article);
  if (!extraction) return null;
  if (extraction.confidence < 0.5) return null;

  const verification = await verifyInfraExtraction(article, extraction);
  const merged: InfraExtraction = verification.corrections
    ? { ...extraction, ...verification.corrections }
    : extraction;

  // Defensive: a verifier "correction" can null out projectName/shortName
  // (it sometimes treats vague articles as un-anchored). Drop those here so
  // the downstream split() / fuzzy matcher never blows up.
  if (typeof merged.projectName !== "string" || merged.projectName.trim().length < 3) {
    console.log(`[infra-sync] skipped: verifier nulled projectName for "${article.title.slice(0, 80)}"`);
    return null;
  }
  if (typeof merged.shortName !== "string" || merged.shortName.trim().length < 1) {
    merged.shortName = merged.projectName.split(/\s+/).slice(0, 3).join(" ");
  }

  // Sync only if verifier said ok OR confidence is very high
  if (!verification.verified && merged.confidence < 0.85) {
    console.log(`[infra-sync] skipped unverified: "${article.title.slice(0, 80)}" flags=${verification.flags.join(",")}`);
    return null;
  }

  return syncInfraFromNews(merged, article, sourceDistrictId, verification.verified);
}
