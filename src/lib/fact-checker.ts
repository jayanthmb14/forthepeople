/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Fact Checker (admin-triggered only)
// Verifies each module's data for a given district.
//
// v5 rules (Sept 2026 audit):
//   - An AI failure is an ERROR, never "0 issues": runModuleFactCheck()
//     throws, and the admin routes record the module as "failed".
//   - The model has no web access, so it must not "research" facts. Phone
//     numbers it suggests are NEVER written to Leader / PoliceStation /
//     GovOffice; they go to the admin review queue (NewsActionQueue,
//     dataType "contact-phone") and are listed in the check's details.
//   - Likewise a "not born here" verdict no longer deletes a famous
//     personality; it is queued for review ("famous-personality-removal").
//   - Prompts carry today's date and the district's own state, and the
//     result details name the model that actually answered.
// Model routing: purpose "fact-check" = Claude Sonnet → Haiku, no free
// fallback (src/lib/ai-models.ts).
// ═══════════════════════════════════════════════════════════
import { Prisma } from "@/generated/prisma";
import { callAIJSON } from "@/lib/ai-provider";
import { asArray } from "@/lib/ai-json";
import { prisma } from "@/lib/db";

export type CheckResult = {
  itemsChecked: number;
  issuesFound: number;
  staleItems: number;
  details: Record<string, unknown>;
};

type DistrictWithState = {
  id: string;
  name: string;
  slug: string;
  population?: number | null;
  area?: number | null;
  literacy?: number | null;
  sexRatio?: number | null;
  talukCount?: number | null;
  state: { name: string };
};

/** Thrown when the AI could not answer: the module check FAILED (not "0 issues"). */
export class FactCheckAIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FactCheckAIError";
  }
}

// ── AI caller (routed through OpenRouter, purpose "fact-check") ──
/** Collects the models that actually answered during one module check. */
class FactCheckAI {
  readonly models = new Set<string>();

  /** Ask for a JSON object. Throws FactCheckAIError when no model answers. */
  async ask(prompt: string): Promise<Record<string, unknown>> {
    try {
      const { data, model } = await callAIJSON<Record<string, unknown>>({
        systemPrompt:
          "You are a careful fact-checker for an Indian public-data website. You do not have web access: " +
          "judge only from what you reliably know, and answer \"unknown\" / null when you are not sure. " +
          "Never guess phone numbers, names or dates. Respond with valid JSON only.",
        userPrompt: prompt,
        purpose: "fact-check",
        jsonShape: "object",
        maxTokens: 2048,
        temperature: 0.1,
      });
      this.models.add(model);
      return data;
    } catch (err) {
      throw new FactCheckAIError(`AI fact-check failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /** Ask, then pull the list at `listKey` out of the answer ([] when absent). */
  async askList<T>(prompt: string, listKey: string): Promise<T[]> {
    return asArray<T>(await this.ask(prompt), listKey);
  }
}

/** "September 2026" — the model is told what "now" is. */
function currentMonthYear(): string {
  return new Date().toLocaleString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
}

function isUsablePhone(phone: unknown): phone is string {
  if (typeof phone !== "string") return false;
  const p = phone.trim().toLowerCase();
  return p !== "" && p !== "null" && p !== "unknown" && p !== "n/a" && /\d{6,}/.test(p.replace(/[\s-]/g, ""));
}

interface ReviewSuggestion {
  districtId: string;
  dataType: "contact-phone" | "famous-personality-removal";
  headline: string;
  source?: unknown;
  data: Record<string, unknown>;
}

/**
 * Put an AI suggestion in the admin review queue. Never throws: a queue
 * write failing must not fail the whole check (the suggestion is still in
 * the check's details).
 */
async function queueForReview(s: ReviewSuggestion, model: string): Promise<void> {
  const src = typeof s.source === "string" && /^https?:\/\//i.test(s.source.trim()) ? s.source.trim() : `fact-check:${model}`;
  await prisma.newsActionQueue
    .create({
      data: {
        districtId: s.districtId,
        dataType: s.dataType,
        extractedData: { ...s.data, suggestedBy: model, origin: "fact-check" } as unknown as Prisma.InputJsonValue,
        sourceUrl: src.slice(0, 500),
        headline: s.headline.slice(0, 300),
        confidence: 0.5,
        status: "pending",
      },
    })
    .catch((err) => console.error("[fact-check] could not queue suggestion:", err instanceof Error ? err.message : err));
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Module routers ─────────────────────────────────────────

/**
 * Run one module's check. Throws FactCheckAIError when the AI could not
 * answer (callers record the module as "failed", not "passed").
 */
export async function runModuleFactCheck(
  district: DistrictWithState,
  module: string
): Promise<CheckResult> {
  const ai = new FactCheckAI();
  const result = await runChecker(district, module, ai);
  if (ai.models.size > 0) {
    result.details = { ...result.details, aiModel: [...ai.models].join(", ") };
  }
  return result;
}

async function runChecker(district: DistrictWithState, module: string, ai: FactCheckAI): Promise<CheckResult> {
  switch (module) {
    case "leadership":         return checkLeadership(district, ai);
    case "famous-personalities": return checkFamousPersonalities(district, ai);
    case "finance-budget":     return checkBudget(district, ai);
    case "police":             return checkPolice(district, ai);
    case "schools":            return checkSchools(district);
    case "elections":          return checkElections(district, ai);
    case "offices":            return checkOffices(district, ai);
    case "schemes":            return checkSchemes(district);
    case "local-industries":   return checkIndustries(district);
    case "population":         return checkPopulation(district);
    case "crop-prices":        return checkCropPrices(district);
    case "water-dams":         return checkDams(district);
    case "weather":            return checkWeather(district);
    case "transport":          return checkTransport(district);
    case "jjm-water":          return checkJJM(district);
    case "housing":            return checkHousing(district);
    case "power-outages":      return checkPower(district);
    case "courts":             return checkCourts(district);
    case "health":             return checkHealth(district);
    case "gram-panchayat":     return checkGramPanchayat(district);
    case "farm-advisory":      return checkFarmAdvisory(district);
    case "rti-tracker":
    case "file-rti":           return checkRTI(district);
    case "citizen-corner":     return checkCitizenTips(district);
    case "alerts":             return checkAlerts(district);
    case "news":               return checkNews(district);
    default:
      return { itemsChecked: 0, issuesFound: 0, staleItems: 0, details: { message: "No checker for this module" } };
  }
}

// ── LEADERSHIP ─────────────────────────────────────────────
async function checkLeadership(district: DistrictWithState, ai: FactCheckAI): Promise<CheckResult> {
  const leaders = await prisma.leader.findMany({
    where: { districtId: district.id },
    orderBy: { tier: "asc" },
  });
  if (leaders.length === 0) return { itemsChecked: 0, issuesFound: 0, staleItems: 0, details: { message: "No leadership data" } };

  const issues: unknown[] = [];
  const phoneSuggestions: unknown[] = [];
  const BATCH = 10;

  for (let i = 0; i < leaders.length; i += BATCH) {
    const batch = leaders.slice(i, i + BATCH);
    const list = batch.map((l, j) => `${j + 1}. ${l.name}: ${l.role}, Party: ${l.party ?? "N/A"}, Constituency: ${l.constituency ?? "N/A"}`).join("\n");

    const prompt = `Today is ${currentMonthYear()}. Fact-check these officials for ${district.name} district, ${district.state.name}, India.
For each, say whether they still hold this position and whether party and constituency are right, as far as you reliably know.
If you are not sure, set "correct" to null and say so in "issue". Only give a phone number if you are certain it is the official published office number; otherwise null.

${list}

Return ONLY a JSON object:
{"results":[{"index":1,"name":"...","role":"...","correct":true|false|null,"issue":"...","fix":"...","phone":null}]}`;

    const parsed = await ai.askList<{ index?: number; correct?: boolean | null; issue?: string; phone?: unknown; name?: string; fix?: string }>(prompt, "results");
    for (let j = 0; j < parsed.length; j++) {
      const item = parsed[j];
      if (!item || typeof item !== "object") continue;
      if (item.correct === false && item.issue) issues.push({ name: item.name, issue: item.issue, fix: item.fix });
      // Match by the index we gave (fall back to position), and only for leaders WITHOUT a phone.
      const leader = batch[(typeof item.index === "number" ? item.index : j + 1) - 1];
      if (leader && !leader.phone && isUsablePhone(item.phone)) {
        const suggestion = { table: "Leader", recordId: leader.id, name: leader.name, role: leader.role, field: "phone", suggestedValue: item.phone.trim() };
        phoneSuggestions.push(suggestion);
        await queueForReview(
          { districtId: district.id, dataType: "contact-phone", headline: `Phone for ${leader.name} (${leader.role}): ${item.phone.trim()}`, data: suggestion },
          [...ai.models].pop() ?? "unknown",
        );
      }
    }
    if (i + BATCH < leaders.length) await delay(2000);
  }

  return {
    itemsChecked: leaders.length,
    issuesFound: issues.length,
    staleItems: 0,
    details: { issues, phoneSuggestionsQueued: phoneSuggestions.length, phoneSuggestions },
  };
}

// ── FAMOUS PERSONALITIES ───────────────────────────────────
async function checkFamousPersonalities(district: DistrictWithState, ai: FactCheckAI): Promise<CheckResult> {
  const people = await prisma.famousPersonality.findMany({ where: { districtId: district.id } });
  if (people.length === 0) return { itemsChecked: 0, issuesFound: 0, staleItems: 0, details: { message: "No data" } };

  const list = people.map((p) => `- ${p.name}: ${p.bio ?? "N/A"}, birthPlace: ${p.birthPlace ?? "N/A"}, bornInDistrict: ${p.bornInDistrict}`).join("\n");

  const prompt = `Verify whether each person was BORN in ${district.name} district, ${district.state.name}, India.
STRICT RULES:
- Must be BORN in this district (not just lived, worked, or associated)
- Dr. Rajkumar was born in Gajanur, Erode, Tamil Nadu — NOT in ${district.name}
- If you do not reliably know the birthplace, set "correctDistrict" to null and "shouldRemove" to false

${list}

Return ONLY a JSON object:
{"results":[{"name":"...","birthPlace":"...","correctDistrict":true|false|null,"shouldRemove":false,"reason":"..."}]}`;

  const parsed = await ai.askList<{ name?: string; shouldRemove?: boolean; reason?: string; birthPlace?: string }>(prompt, "results");

  // A removal is a suggestion for a human, never an automatic delete.
  const issues: unknown[] = [];
  for (const item of parsed) {
    if (!item || item.shouldRemove !== true) continue;
    const person = people.find((p) => p.name === item.name);
    if (!person) continue;
    issues.push({ name: item.name, reason: item.reason, suggestedBirthPlace: item.birthPlace });
    await queueForReview(
      {
        districtId: district.id,
        dataType: "famous-personality-removal",
        headline: `Remove ${person.name}? ${item.reason ?? "birthplace not in this district"}`,
        data: { table: "FamousPersonality", recordId: person.id, name: person.name, reason: item.reason ?? null, suggestedBirthPlace: item.birthPlace ?? null },
      },
      [...ai.models].pop() ?? "unknown",
    );
  }

  return {
    itemsChecked: people.length,
    issuesFound: issues.length,
    staleItems: 0,
    details: { issues, removalsQueuedForReview: issues.length },
  };
}

// ── BUDGET ─────────────────────────────────────────────────
async function checkBudget(district: DistrictWithState, ai: FactCheckAI): Promise<CheckResult> {
  const budgets = await prisma.budgetEntry.findMany({
    where: { districtId: district.id },
    take: 30,
  });
  if (budgets.length === 0) return { itemsChecked: 0, issuesFound: 0, staleItems: 0, details: { message: "No budget data" } };

  const list = budgets.map((b) => `${b.sector}: Allocated ₹${(b.allocated / 1e7).toFixed(1)}Cr, Spent ₹${(b.spent / 1e7).toFixed(1)}Cr (${b.fiscalYear})`).join("\n");

  const prompt = `Today is ${currentMonthYear()}. Check whether these budget figures for ${district.name} district, ${district.state.name}, India look plausible
against the ${district.state.name} state budget and typical district allocations, as far as you reliably know. Flag only clear problems.

${list}

Return ONLY JSON:
{"totalChecked":${budgets.length},"issues":[{"sector":"...","problem":"...","expectedRange":"..."}],"summary":"brief"}`;

  const issues = await ai.askList<unknown>(prompt, "issues");

  return {
    itemsChecked: budgets.length,
    issuesFound: issues.length,
    staleItems: 0,
    details: { issues },
  };
}

// ── POLICE ─────────────────────────────────────────────────
async function checkPolice(district: DistrictWithState, ai: FactCheckAI): Promise<CheckResult> {
  const stations = await prisma.policeStation.findMany({ where: { districtId: district.id } });
  const leaders = await prisma.leader.findMany({
    where: { districtId: district.id, tier: { gte: 4, lte: 6 } },
  });
  const sp = leaders.find((l) => l.role.toLowerCase().includes("superintendent") || l.role.toLowerCase().includes("commissioner of police"));

  const noPhones = stations.filter((s) => !s.phone).length;
  const issues: unknown[] = [];
  const phoneSuggestions: unknown[] = [];

  if (noPhones > 0) {
    issues.push({ type: "missing_phones", count: noPhones });
    // Ask for numbers the model is SURE of; they go to review, never to the table.
    const missing = stations.filter((s) => !s.phone).slice(0, 10);
    const list = missing.map((s) => `- ${s.name}, ${(s as Record<string, unknown>).address ?? "address unknown"}`).join("\n");
    const prompt = `Which of these police stations in ${district.name}, ${district.state.name}, India have an official published phone number that you know for certain?
Give null for any you are not certain of. Do not guess.

${list}

Return ONLY a JSON object: {"results":[{"name":"...","phone":null,"source":"URL or null"}]}`;

    const parsed = await ai.askList<{ name?: string; phone?: unknown; source?: unknown }>(prompt, "results");
    for (const item of parsed) {
      if (!item || !isUsablePhone(item.phone)) continue;
      const station = missing.find((s) => s.name === item.name);
      if (!station) continue;
      const suggestion = { table: "PoliceStation", recordId: station.id, name: station.name, field: "phone", suggestedValue: item.phone.trim(), source: item.source ?? null };
      phoneSuggestions.push(suggestion);
      await queueForReview(
        { districtId: district.id, dataType: "contact-phone", headline: `Phone for ${station.name}: ${item.phone.trim()}`, source: item.source, data: suggestion },
        [...ai.models].pop() ?? "unknown",
      );
    }
  }

  if (!sp) issues.push({ type: "missing_sp_or_commissioner", note: "No SP/Commissioner found in tier 4-6 leaders" });

  return {
    itemsChecked: stations.length + 1,
    issuesFound: issues.length,
    staleItems: 0,
    details: { stationCount: stations.length, noPhoneCount: noPhones, issues, phoneSuggestionsQueued: phoneSuggestions.length, phoneSuggestions },
  };
}

// ── SCHOOLS ────────────────────────────────────────────────
async function checkSchools(district: DistrictWithState): Promise<CheckResult> {
  const schools = await prisma.school.findMany({ where: { districtId: district.id } });
  const noContact = schools.filter((s) => !(s as Record<string, unknown>).phone && !(s as Record<string, unknown>).email).length;

  return {
    itemsChecked: schools.length,
    issuesFound: noContact > 0 ? 1 : 0,
    staleItems: 0,
    details: { total: schools.length, missingContact: noContact },
  };
}

// ── ELECTIONS ──────────────────────────────────────────────
async function checkElections(district: DistrictWithState, ai: FactCheckAI): Promise<CheckResult> {
  const elections = await prisma.electionResult.findMany({
    where: { districtId: district.id },
    orderBy: { year: "desc" },
    take: 20,
  });
  if (elections.length === 0) return { itemsChecked: 0, issuesFound: 0, staleItems: 0, details: { message: "No election data" } };

  const list = elections.map((e) => `${e.constituency}: Winner ${e.winnerName} (${e.winnerParty}) in ${e.year}`).join("\n");
  const prompt = `Verify these election results for ${district.name} district, ${district.state.name}, India, as far as you reliably know.
Flag only results you are confident are wrong.

${list}

Return ONLY JSON:
{"totalChecked":${elections.length},"issues":[{"constituency":"...","problem":"...","correct":"..."}],"summary":"brief"}`;

  const issues = await ai.askList<unknown>(prompt, "issues");

  return {
    itemsChecked: elections.length,
    issuesFound: issues.length,
    staleItems: 0,
    details: { issues },
  };
}

// ── OFFICES ────────────────────────────────────────────────
async function checkOffices(district: DistrictWithState, ai: FactCheckAI): Promise<CheckResult> {
  const offices = await prisma.govOffice.findMany({ where: { districtId: district.id } });
  const noPhone = offices.filter((o) => !o.phone).length;
  const phoneSuggestions: unknown[] = [];

  if (noPhone > 0) {
    // Ask for numbers the model is SURE of; they go to review, never to the table.
    const missing = offices.filter((o) => !o.phone).slice(0, 10);
    const list = missing.map((o) => `- ${o.name}, ${o.address ?? "unknown"}`).join("\n");
    const prompt = `Which of these government offices in ${district.name}, ${district.state.name}, India have an official published phone number that you know for certain?
Give null for any you are not certain of. Do not guess.

${list}

Return ONLY a JSON object: {"results":[{"name":"...","phone":null,"source":"URL or null"}]}`;
    const parsed = await ai.askList<{ name?: string; phone?: unknown; source?: unknown }>(prompt, "results");
    for (const item of parsed) {
      if (!item || !isUsablePhone(item.phone)) continue;
      const office = missing.find((o) => o.name === item.name);
      if (!office) continue;
      const suggestion = { table: "GovOffice", recordId: office.id, name: office.name, field: "phone", suggestedValue: item.phone.trim(), source: item.source ?? null };
      phoneSuggestions.push(suggestion);
      await queueForReview(
        { districtId: district.id, dataType: "contact-phone", headline: `Phone for ${office.name}: ${item.phone.trim()}`, source: item.source, data: suggestion },
        [...ai.models].pop() ?? "unknown",
      );
    }
    await delay(2000);
  }

  return {
    itemsChecked: offices.length,
    issuesFound: noPhone > 0 ? 1 : 0,
    staleItems: 0,
    details: { total: offices.length, missingPhones: noPhone, phoneSuggestionsQueued: phoneSuggestions.length, phoneSuggestions },
  };
}

// ── SCHEMES ────────────────────────────────────────────────
async function checkSchemes(district: DistrictWithState): Promise<CheckResult> {
  const schemes = await prisma.scheme.findMany({ where: { districtId: district.id } });
  return { itemsChecked: schemes.length, issuesFound: 0, staleItems: 0, details: { total: schemes.length } };
}

// ── INDUSTRIES ─────────────────────────────────────────────
async function checkIndustries(district: DistrictWithState): Promise<CheckResult> {
  const industries = await prisma.localIndustry.findMany({ where: { districtId: district.id } });
  return { itemsChecked: industries.length, issuesFound: 0, staleItems: 0, details: { total: industries.length } };
}

// ── POPULATION ─────────────────────────────────────────────
async function checkPopulation(district: DistrictWithState): Promise<CheckResult> {
  const issues: unknown[] = [];
  if (!district.population) issues.push({ field: "population", issue: "Missing" });
  if (!district.area) issues.push({ field: "area", issue: "Missing" });
  if (!district.literacy) issues.push({ field: "literacy", issue: "Missing" });

  const history = await prisma.populationHistory.findMany({ where: { districtId: district.id } });

  return {
    itemsChecked: 5,
    issuesFound: issues.length,
    staleItems: 0,
    details: { population: district.population, area: district.area, literacy: district.literacy, historyRecords: history.length, issues },
  };
}

// ── CROP PRICES ────────────────────────────────────────────
async function checkCropPrices(district: DistrictWithState): Promise<CheckResult> {
  const prices = await prisma.cropPrice.findMany({
    where: { districtId: district.id },
    orderBy: { date: "desc" },
    take: 5,
  });
  const now = new Date();
  const stale = prices.filter((p) => {
    const ageHrs = (now.getTime() - new Date(p.date).getTime()) / 3_600_000;
    return ageHrs > 48;
  });

  return {
    itemsChecked: prices.length,
    issuesFound: 0,
    staleItems: stale.length,
    details: { recordCount: prices.length, staleCount: stale.length, lastDate: prices[0]?.date ?? null },
  };
}

// ── DAMS ───────────────────────────────────────────────────
async function checkDams(district: DistrictWithState): Promise<CheckResult> {
  const dams = await prisma.damReading.findMany({
    where: { districtId: district.id },
    orderBy: { recordedAt: "desc" },
    take: 5,
    distinct: ["damName"],
  });
  const now = new Date();
  const stale = dams.filter((d) => (now.getTime() - new Date(d.recordedAt).getTime()) / 3_600_000 > 2);

  return {
    itemsChecked: dams.length,
    issuesFound: 0,
    staleItems: stale.length,
    details: { damCount: dams.length, staleCount: stale.length },
  };
}

// ── WEATHER ────────────────────────────────────────────────
async function checkWeather(district: DistrictWithState): Promise<CheckResult> {
  const readings = await prisma.weatherReading.findMany({
    where: { districtId: district.id },
    orderBy: { recordedAt: "desc" },
    take: 1,
  });
  const now = new Date();
  const stale = readings.filter((r) => (now.getTime() - new Date(r.recordedAt).getTime()) / 3_600_000 > 1);

  return {
    itemsChecked: readings.length,
    issuesFound: 0,
    staleItems: stale.length,
    details: { hasData: readings.length > 0, lastUpdate: readings[0]?.recordedAt ?? null },
  };
}

// ── TRANSPORT ──────────────────────────────────────────────
async function checkTransport(district: DistrictWithState): Promise<CheckResult> {
  const buses = await prisma.busRoute.findMany({ where: { districtId: district.id } });
  const trains = await prisma.trainSchedule.findMany({ where: { districtId: district.id } });
  return {
    itemsChecked: buses.length + trains.length,
    issuesFound: 0,
    staleItems: 0,
    details: { busRoutes: buses.length, trainSchedules: trains.length },
  };
}

// ── JJM ────────────────────────────────────────────────────
async function checkJJM(district: DistrictWithState): Promise<CheckResult> {
  const jjm = await prisma.jJMStatus.findMany({ where: { districtId: district.id } });
  return { itemsChecked: jjm.length, issuesFound: 0, staleItems: 0, details: { total: jjm.length } };
}

// ── HOUSING ────────────────────────────────────────────────
async function checkHousing(district: DistrictWithState): Promise<CheckResult> {
  const housing = await prisma.housingScheme.findMany({ where: { districtId: district.id } });
  return { itemsChecked: housing.length, issuesFound: 0, staleItems: 0, details: { total: housing.length } };
}

// ── POWER ──────────────────────────────────────────────────
async function checkPower(district: DistrictWithState): Promise<CheckResult> {
  const outages = await prisma.powerOutage.findMany({
    where: { districtId: district.id },
    orderBy: { startTime: "desc" },
    take: 5,
  });
  const now = new Date();
  const stale = outages.filter((o) => (now.getTime() - new Date(o.startTime).getTime()) / 86_400_000 > 3);

  return {
    itemsChecked: outages.length,
    issuesFound: 0,
    staleItems: stale.length,
    details: { recent: outages.length, stale: stale.length },
  };
}

// ── COURTS ─────────────────────────────────────────────────
async function checkCourts(district: DistrictWithState): Promise<CheckResult> {
  const courts = await prisma.courtStat.findMany({ where: { districtId: district.id } });
  return { itemsChecked: courts.length, issuesFound: 0, staleItems: 0, details: { total: courts.length } };
}

// ── HEALTH ─────────────────────────────────────────────────
async function checkHealth(district: DistrictWithState): Promise<CheckResult> {
  const offices = await prisma.govOffice.findMany({
    where: { districtId: district.id, type: { contains: "hospital", mode: "insensitive" } },
  });
  return { itemsChecked: offices.length, issuesFound: 0, staleItems: 0, details: { hospitals: offices.length } };
}

// ── GRAM PANCHAYAT ─────────────────────────────────────────
async function checkGramPanchayat(district: DistrictWithState): Promise<CheckResult> {
  const gps = await prisma.gramPanchayat.findMany({ where: { districtId: district.id } });
  return { itemsChecked: gps.length, issuesFound: 0, staleItems: 0, details: { total: gps.length } };
}

// ── FARM ADVISORY ──────────────────────────────────────────
async function checkFarmAdvisory(district: DistrictWithState): Promise<CheckResult> {
  const advisories = await prisma.agriAdvisory.findMany({ where: { districtId: district.id } });
  const now = new Date();
  const stale = advisories.filter((a) => (now.getTime() - new Date(a.createdAt).getTime()) / 86_400_000 > 30);

  return {
    itemsChecked: advisories.length,
    issuesFound: 0,
    staleItems: stale.length,
    details: { total: advisories.length, stale: stale.length },
  };
}

// ── RTI ────────────────────────────────────────────────────
async function checkRTI(district: DistrictWithState): Promise<CheckResult> {
  const rtiStats = await prisma.rtiStat.findMany({ where: { districtId: district.id } });
  const templates = await prisma.rtiTemplate.findMany({ where: { districtId: district.id } });

  return {
    itemsChecked: rtiStats.length + templates.length,
    issuesFound: 0,
    staleItems: 0,
    details: { stats: rtiStats.length, templates: templates.length },
  };
}

// ── CITIZEN TIPS ───────────────────────────────────────────
async function checkCitizenTips(district: DistrictWithState): Promise<CheckResult> {
  const tips = await prisma.citizenTip.findMany({ where: { districtId: district.id } });
  return { itemsChecked: tips.length, issuesFound: 0, staleItems: 0, details: { total: tips.length } };
}

// ── ALERTS ─────────────────────────────────────────────────
async function checkAlerts(district: DistrictWithState): Promise<CheckResult> {
  const now = new Date();
  const alerts = await prisma.localAlert.findMany({
    where: { districtId: district.id, active: true },
    orderBy: { createdAt: "desc" },
  });
  const stale = alerts.filter((a) => (now.getTime() - new Date(a.createdAt).getTime()) / 86_400_000 > 7);

  return {
    itemsChecked: alerts.length,
    issuesFound: 0,
    staleItems: stale.length,
    details: { active: alerts.length, staleCount: stale.length },
  };
}

// ── NEWS ───────────────────────────────────────────────────
async function checkNews(district: DistrictWithState): Promise<CheckResult> {
  const news = await prisma.newsItem.findMany({
    where: { districtId: district.id },
    orderBy: { publishedAt: "desc" },
    take: 30,
    select: { id: true, title: true, publishedAt: true },
  });

  // Detect duplicates
  const seen = new Map<string, typeof news>();
  for (const item of news) {
    const key = (item.title ?? "").toLowerCase().replace(/[^a-z0-9 ]/g, "").substring(0, 50);
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key)!.push(item);
  }
  const dupeGroups = [...seen.values()].filter((g) => g.length > 1);
  const dupeIds = dupeGroups.flatMap((g) => g.slice(1).map((i) => i.id));
  if (dupeIds.length > 0) await prisma.newsItem.deleteMany({ where: { id: { in: dupeIds } } });

  const now = new Date();
  const oldest = news[news.length - 1];
  const stale = oldest && (now.getTime() - new Date(oldest.publishedAt).getTime()) / 3_600_000 > 24 ? 1 : 0;

  return {
    itemsChecked: news.length,
    issuesFound: 0,
    staleItems: stale,
    details: { total: news.length, duplicatesRemoved: dupeIds.length, stale },
  };
}
