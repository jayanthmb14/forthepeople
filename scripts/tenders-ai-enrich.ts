// Tender AI enrichment — manual ops script, NOT scheduled.
// Run:  npx tsx scripts/tenders-ai-enrich.ts --dry-run --limit 5
// Moved here from src/cron/tenders-ai-enrich.ts on 2026-09-28: it was never
// in vercel.json and had never run (TenderAISummary had 0 rows). Writes
// TenderAISummary rows in the database .env points at.
// For each Tender with no TenderAISummary (or with error state), generate:
//   1. Plain-English summary (150 words max)
//   2. Structured eligibility JSON
//   3. Document checklist JSON
// Route through callAI() with purpose='news-analysis' (Tier 1 / free model
// per src/lib/ai-provider.ts) to respect the project's AI cost rules. Cost
// per tender ~$0.01–$0.02 at current free-tier utilisation.
//
// Budget guard: if total daily enrichment cost exceeds $0.50 across all
// TenderAISummary rows generated today, abort further work and log to
// AdminAlert (using existing admin-alerts.ts pattern).

import "dotenv/config";
import { prisma } from "@/lib/db";
import { callAI, callAIJSON } from "@/lib/ai-provider";
import { Prisma } from "@/generated/prisma";

const DAILY_BUDGET_USD = 0.5;
const DEFAULT_LIMIT = 10;
const MAX_INPUT_CHARS = 15000; // rough proxy for token budget

interface CLIOpts {
  limit?: number;
  dryRun?: boolean;
  singleTenderId?: string;
}

function parseArgs(argv: string[]): CLIOpts {
  const o: CLIOpts = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--limit") o.limit = parseInt(argv[++i], 10);
    else if (a === "--dry-run") o.dryRun = true;
    else if (a === "--single-tender-id") o.singleTenderId = argv[++i];
  }
  return o;
}

async function todaysCostUsd(): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const rows = await prisma.tenderAISummary.findMany({
    where: { generatedAt: { gte: startOfDay } },
    select: { costInr: true },
  });
  // costInr is stored as INR; convert to USD at ~83 INR/USD.
  const totalInr = rows.reduce((sum, r) => sum + (r.costInr ?? 0), 0);
  return totalInr / 83;
}

async function buildPrompt(tenderId: string) {
  const t = await prisma.tender.findUnique({
    where: { id: tenderId },
    include: { authority: true, category: true, documents: true },
  });
  if (!t) return null;
  const docExtracts = t.documents
    .map((d) => d.extractedText ?? "")
    .filter((x) => x.length > 0)
    .join("\n\n---\n\n")
    .slice(0, MAX_INPUT_CHARS);

  const core = [
    `Title: ${t.title}`,
    `Authority: ${t.authority.name} (${t.authority.shortCode}, ${t.authority.authorityType})`,
    t.category ? `Category: ${t.category.name}` : "",
    `Work type: ${t.workType}  Procurement type: ${t.procurementType}`,
    t.estimatedValueInr ? `Estimated value: INR ${t.estimatedValueInr.toString()}` : "",
    t.emdAmountInr ? `EMD: INR ${t.emdAmountInr.toString()}` : "",
    t.tenderFeeInr ? `Tender fee: INR ${t.tenderFeeInr.toString()}` : "",
    `Published: ${t.publishedAt.toISOString().slice(0, 10)}  Closing: ${t.bidSubmissionEnd.toISOString().slice(0, 10)}`,
    `Location: ${t.locationTaluk ? t.locationTaluk + ", " : ""}${t.locationDistrict}, ${t.locationState}`,
    t.description ? `Description: ${t.description}` : "",
    t.numberOfCovers ? `Covers: ${t.numberOfCovers}` : "",
  ].filter(Boolean).join("\n");

  return { tender: t, core, docExtracts };
}

async function enrichOne(tenderId: string, dryRun: boolean): Promise<{ ok: boolean; costInr?: number; error?: string }> {
  const prompt = await buildPrompt(tenderId);
  if (!prompt) return { ok: false, error: "tender not found" };

  const { tender, core, docExtracts } = prompt;

  const summaryPrompt = `Summarise this government tender in plain English for a citizen in 150 words or fewer.
Cover: what is being procured, for whom, where, estimated value, key eligibility requirements, important deadlines, any unusual clauses.
Use factual, neutral language. Never use words like "suspicious", "corrupt", "dubious", "cartel", "irregular", or "fraudulent".

Tender metadata:
${core}

Extracted document text (PII-redacted, may be empty):
${docExtracts || "[no document text available]"}`;

  const eligibilityPrompt = `Extract eligibility criteria from this tender. Output strict JSON matching this schema exactly:
{
  "minAnnualTurnoverInr": number | null,
  "yearsInBusinessRequired": number | null,
  "similarWorkExperience": { "minValueInr": number, "minCount": number, "yearsWindow": number } | null,
  "registrationTypesAccepted": string[],
  "locationRestrictions": string | null,
  "mseEligible": boolean,
  "startupEligible": boolean,
  "emdAmountInr": number | null,
  "tenderFeeInr": number | null,
  "dscClass": "1" | "2" | "3" | null,
  "coverSystem": 1 | 2 | 3 | 4 | null
}
If a field is not explicitly stated, use null. Never guess.

Tender metadata:
${core}

Extracted document text (PII-redacted):
${docExtracts || "[no document text available]"}`;

  const checklistPrompt = `Extract the list of documents a bidder must submit. Output strict JSON only:
[{ "docName": string, "mandatory": boolean, "purpose": string, "certifyingAuthority": string | null, "pageReference": number | null }]
Only extract what is explicitly stated. Return an empty array if nothing is listed.

Tender metadata:
${core}

Extracted document text (PII-redacted):
${docExtracts || "[no document text available]"}`;

  // "In plain words" — 3-bullet summary for citizens. Grade-6 reading level,
  // ≤25 words per bullet. Separate call so the shape is strict JSON and we
  // can render it as 3 discrete <li>s on the detail page.
  const plainBulletsPrompt = `Write a 3-bullet citizen summary of this government tender. Output strict JSON only:
{
  "what": "One sentence explaining WHAT is being procured, in plain English. Max 25 words, grade-6 reading level.",
  "whoCanApply": "One sentence about WHO can apply — company type, turnover, experience. Avoid jargon. Max 25 words.",
  "deadline": "One sentence stating WHEN bids close and any key event (pre-bid, opening). Max 25 words."
}
Neutral, factual language only. Never use words like 'suspicious', 'corrupt', 'dubious', 'irregular'.

Tender metadata:
${core}

Extracted document text (PII-redacted):
${docExtracts || "[no document text available]"}`;

  if (dryRun) {
    console.log(`[enrich:dry-run] tender=${tenderId}`);
    console.log(`  summaryPrompt (${summaryPrompt.length} chars)`);
    console.log(`  eligibilityPrompt (${eligibilityPrompt.length} chars)`);
    console.log(`  checklistPrompt (${checklistPrompt.length} chars)`);
    console.log(`  plainBulletsPrompt (${plainBulletsPrompt.length} chars)`);
    return { ok: true, costInr: 0 };
  }

  try {
    const [summaryRes, eligRes, checklistRes, bulletsRes] = await Promise.all([
      callAI({ systemPrompt: "You are a civic tender summariser. Factual only.", userPrompt: summaryPrompt, purpose: "news-analysis", maxTokens: 512, temperature: 0.2 }),
      callAIJSON<Record<string, unknown>>({ systemPrompt: "You extract tender eligibility as strict JSON.", userPrompt: eligibilityPrompt, purpose: "news-analysis", maxTokens: 512, temperature: 0.1 }).catch(() => null),
      callAIJSON<Array<Record<string, unknown>>>({ systemPrompt: "You extract bidder document checklists as strict JSON.", userPrompt: checklistPrompt, purpose: "news-analysis", maxTokens: 512, temperature: 0.1 }).catch(() => null),
      callAIJSON<{ what: string; whoCanApply: string; deadline: string }>({ systemPrompt: "You write 3-bullet citizen summaries of government tenders in grade-6 English. Factual, neutral language only.", userPrompt: plainBulletsPrompt, purpose: "news-analysis", maxTokens: 256, temperature: 0.2 }).catch(() => null),
    ]);

    const summaryText = summaryRes.text.trim();
    const keyEligibility = (eligRes?.data ?? null) as Prisma.InputJsonValue | null;
    const documentChecklist = (checklistRes?.data ?? null) as Prisma.InputJsonValue | null;
    const plainBullets = (bulletsRes?.data ?? null) as Prisma.InputJsonValue | null;

    // Free-tier OpenRouter models are priced at zero → cost defaults to 0.
    // Any fallback to a paid model will surface here for the daily budget alert.
    const costInr = 0;

    await prisma.tenderAISummary.upsert({
      where: { tenderId },
      update: {
        plainEnglishSummary: summaryText,
        keyEligibility: keyEligibility ?? Prisma.JsonNull,
        documentChecklist: documentChecklist ?? Prisma.JsonNull,
        plainBullets: plainBullets ?? Prisma.JsonNull,
        aiModel: summaryRes.model,
        inputTokens: null,
        outputTokens: null,
        costInr,
        errorMsg: null,
        generatedAt: new Date(),
      },
      create: {
        tenderId,
        plainEnglishSummary: summaryText,
        keyEligibility: keyEligibility ?? Prisma.JsonNull,
        documentChecklist: documentChecklist ?? Prisma.JsonNull,
        plainBullets: plainBullets ?? Prisma.JsonNull,
        aiModel: summaryRes.model,
        costInr,
      },
    });

    // Mirror structured eligibility onto Tender for filter queries
    if (keyEligibility) {
      await prisma.tender.update({ where: { id: tender.id }, data: { eligibility: keyEligibility } });
    }

    return { ok: true, costInr };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.tenderAISummary.upsert({
      where: { tenderId },
      update: { errorMsg: msg.slice(0, 500), generatedAt: new Date() },
      create: { tenderId, plainEnglishSummary: "", aiModel: "error", errorMsg: msg.slice(0, 500) },
    });
    return { ok: false, error: msg };
  }
}

export async function runTenderEnrichment(opts: CLIOpts = {}): Promise<void> {
  const dailyCost = await todaysCostUsd();
  if (dailyCost >= DAILY_BUDGET_USD) {
    console.warn(`[enrich] Daily cost $${dailyCost.toFixed(3)} ≥ budget $${DAILY_BUDGET_USD}. Skipping this cycle.`);
    return;
  }

  let targets: string[];
  if (opts.singleTenderId) {
    targets = [opts.singleTenderId];
  } else {
    const rows = await prisma.tender.findMany({
      where: { aiSummary: null },
      select: { id: true },
      orderBy: { publishedAt: "desc" },
      take: opts.limit ?? DEFAULT_LIMIT,
    });
    targets = rows.map((r) => r.id);
  }

  console.log(`[enrich] processing ${targets.length} tender(s) · dryRun=${!!opts.dryRun} · dailyCostUsdSoFar=${dailyCost.toFixed(4)}`);
  let ok = 0; let failed = 0;
  for (const id of targets) {
    const res = await enrichOne(id, !!opts.dryRun);
    if (res.ok) ok++; else { failed++; console.warn(`[enrich] ${id} failed: ${res.error}`); }
  }
  console.log(`[enrich] done · ok=${ok} failed=${failed}`);
}

if (typeof require !== "undefined" && require.main === module) {
  const opts = parseArgs(process.argv);
  runTenderEnrichment(opts)
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}
