/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Fact Checker
// Verifies each module's data for a given district
// ═══════════════════════════════════════════════════════════
import { callAI } from "@/lib/ai-provider";
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

// ── AI caller (routed through OpenRouter) ──────────────────
async function callOpus(prompt: string): Promise<string> {
  try {
    const res = await callAI({
      systemPrompt: "You are a fact-checker. Respond with valid JSON only.",
      userPrompt: prompt,
      purpose: "fact-check",
      jsonMode: true,
      maxTokens: 2048,
    });
    return res.text;
  } catch (err) {
    return JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
  }
}

function parseJSON<T>(text: string): T | null {
  try {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    return JSON.parse(match ? match[1].trim() : text.trim());
  } catch {
    return null;
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Module routers ─────────────────────────────────────────

export async function runModuleFactCheck(
  district: DistrictWithState,
  module: string
): Promise<CheckResult> {
  switch (module) {
    case "leadership":         return checkLeadership(district);
    case "famous-personalities": return checkFamousPersonalities(district);
    case "finance-budget":     return checkBudget(district);
    case "police":             return checkPolice(district);
    case "schools":            return checkSchools(district);
    case "elections":          return checkElections(district);
    case "offices":            return checkOffices(district);
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
async function checkLeadership(district: DistrictWithState): Promise<CheckResult> {
  const leaders = await prisma.leader.findMany({
    where: { districtId: district.id },
    orderBy: { tier: "asc" },
  });
  if (leaders.length === 0) return { itemsChecked: 0, issuesFound: 0, staleItems: 0, details: { message: "No leadership data" } };

  const issues: unknown[] = [];
  const BATCH = 10;

  for (let i = 0; i < leaders.length; i += BATCH) {
    const batch = leaders.slice(i, i + BATCH);
    const list = batch.map((l) => `- ${l.name}: ${l.role}, Party: ${l.party ?? "N/A"}, Constituency: ${l.constituency ?? "N/A"}, Phone: ${l.phone ?? "missing"}`).join("\n");

    const prompt = `Fact-check these officials for ${district.name} district, ${district.state.name}, India as of March 2026.
Verify each person currently holds this position. Check party affiliation and constituency.
For any MISSING phone numbers, research aggressively — government office numbers are almost always publicly available.

${list}

Return ONLY JSON array:
[{"name":"...","role":"...","correct":true/false,"issue":"...","fix":"...","phone":"found number or null"}]`;

    const text = await callOpus(prompt);
    const raw = parseJSON<unknown>(text);
    const parsed = (Array.isArray(raw) ? raw : []) as Array<{ correct: boolean; issue?: string; phone?: string; name?: string; fix?: string }>;
    for (let j = 0; j < parsed.length; j++) {
      const item = parsed[j];
      if (!item.correct && item.issue) issues.push({ name: item.name, issue: item.issue, fix: item.fix });
      // Update phone number if found
      if (item.phone && item.phone !== "null" && !item.phone.includes("null") && batch[j] && !batch[j].phone) {
        await prisma.leader.update({ where: { id: batch[j].id }, data: { phone: item.phone } }).catch(() => {});
      }
    }
    if (i + BATCH < leaders.length) await delay(2000);
  }

  return {
    itemsChecked: leaders.length,
    issuesFound: issues.length,
    staleItems: 0,
    details: { issues },
  };
}

// ── FAMOUS PERSONALITIES ───────────────────────────────────
async function checkFamousPersonalities(district: DistrictWithState): Promise<CheckResult> {
  const people = await prisma.famousPersonality.findMany({ where: { districtId: district.id } });
  if (people.length === 0) return { itemsChecked: 0, issuesFound: 0, staleItems: 0, details: { message: "No data" } };

  const list = people.map((p) => `- ${p.name}: ${p.bio ?? "N/A"}, birthPlace: ${p.birthPlace ?? "N/A"}, bornInDistrict: ${p.bornInDistrict}`).join("\n");

  const prompt = `Verify each person was BORN in ${district.name} district, ${district.state.name}, India.
STRICT RULES:
- Must be BORN in this district (not just lived, worked, or associated)
- Dr. Rajkumar was born in Gajanur, Erode, Tamil Nadu — NOT in ${district.name}
- Verify birthplace for each person carefully

${list}

Return ONLY JSON array:
[{"name":"...","birthPlace":"...","correctDistrict":true/false,"shouldRemove":false/true,"reason":"..."}]`;

  const text = await callOpus(prompt);
  const raw = parseJSON<unknown>(text);
  const parsed = (Array.isArray(raw) ? raw : []) as Array<{ name: string; shouldRemove: boolean; reason?: string }>;

  const toRemove: string[] = [];
  const issues: unknown[] = [];
  for (const item of parsed) {
    if (item.shouldRemove) {
      const person = people.find((p) => p.name === item.name);
      if (person) {
        toRemove.push(person.id);
        issues.push({ name: item.name, reason: item.reason });
      }
    }
    }
  // Auto-remove wrongly listed personalities
  if (toRemove.length > 0) {
    await prisma.famousPersonality.deleteMany({ where: { id: { in: toRemove } } });
  }

  return {
    itemsChecked: people.length,
    issuesFound: issues.length,
    staleItems: 0,
    details: { issues, removed: toRemove.length },
  };
}

// ── BUDGET ─────────────────────────────────────────────────
async function checkBudget(district: DistrictWithState): Promise<CheckResult> {
  const budgets = await prisma.budgetEntry.findMany({
    where: { districtId: district.id },
    take: 30,
  });
  if (budgets.length === 0) return { itemsChecked: 0, issuesFound: 0, staleItems: 0, details: { message: "No budget data" } };

  const list = budgets.map((b) => `${b.sector}: Allocated ₹${(b.allocated / 1e7).toFixed(1)}Cr, Spent ₹${(b.spent / 1e7).toFixed(1)}Cr (${b.fiscalYear})`).join("\n");

  const prompt = `Verify these budget figures for ${district.name} district, ${district.state.name}, India.
Cross-check against Karnataka state budget 2024-25 and typical district allocations.

${list}

Return ONLY JSON:
{"totalChecked":${budgets.length},"issues":[{"sector":"...","problem":"...","expectedRange":"..."}],"summary":"brief"}`;

  const text = await callOpus(prompt);
  const parsed = parseJSON<{ issues?: unknown[] }>(text);
  const issues = parsed?.issues ?? [];

  return {
    itemsChecked: budgets.length,
    issuesFound: issues.length,
    staleItems: 0,
    details: { issues },
  };
}

// ── POLICE ─────────────────────────────────────────────────
async function checkPolice(district: DistrictWithState): Promise<CheckResult> {
  const stations = await prisma.policeStation.findMany({ where: { districtId: district.id } });
  const leaders = await prisma.leader.findMany({
    where: { districtId: district.id, tier: { gte: 4, lte: 6 } },
  });
  const sp = leaders.find((l) => l.role.toLowerCase().includes("superintendent") || l.role.toLowerCase().includes("commissioner of police"));

  const noPhones = stations.filter((s) => !s.phone).length;
  const issues: unknown[] = [];

  if (noPhones > 0) {
    // Try to fill missing phone numbers
    const missing = stations.filter((s) => !s.phone).slice(0, 10);
    const list = missing.map((s) => `- ${s.name}, ${(s as Record<string, unknown>).address ?? "address unknown"}`).join("\n");
    const prompt = `Find phone numbers for these police stations in ${district.name}, ${district.state.name}, India.
These are public government numbers — almost always available on district websites, state portals, or Google Maps.

${list}

Return ONLY JSON array: [{"name":"...","phone":"STD-number or null","source":"..."}]`;

    const text = await callOpus(prompt);
    const parsed = parseJSON<Array<{ name: string; phone?: string }>>(text);
    if (parsed) {
      for (const item of parsed) {
        if (item.phone && item.phone !== "null") {
          const station = missing.find((s) => s.name === item.name);
          if (station) await prisma.policeStation.update({ where: { id: station.id }, data: { phone: item.phone } }).catch(() => {});
        }
      }
      issues.push({ type: "missing_phones", count: noPhones });
    }
  }

  if (!sp) issues.push({ type: "missing_sp_or_commissioner", note: "No SP/Commissioner found in tier 4-6 leaders" });

  return {
    itemsChecked: stations.length + 1,
    issuesFound: issues.length,
    staleItems: 0,
    details: { stationCount: stations.length, noPhoneCount: noPhones, issues },
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
async function checkElections(district: DistrictWithState): Promise<CheckResult> {
  const elections = await prisma.electionResult.findMany({
    where: { districtId: district.id },
    orderBy: { year: "desc" },
    take: 20,
  });
  if (elections.length === 0) return { itemsChecked: 0, issuesFound: 0, staleItems: 0, details: { message: "No election data" } };

  const list = elections.map((e) => `${e.constituency}: Winner ${e.winnerName} (${e.winnerParty}) in ${e.year}`).join("\n");
  const prompt = `Verify these election results for ${district.name} district, ${district.state.name}, India.

${list}

Return ONLY JSON:
{"totalChecked":${elections.length},"issues":[{"constituency":"...","problem":"...","correct":"..."}],"summary":"brief"}`;

  const text = await callOpus(prompt);
  const parsed = parseJSON<{ issues?: unknown[] }>(text);

  return {
    itemsChecked: elections.length,
    issuesFound: parsed?.issues?.length ?? 0,
    staleItems: 0,
    details: { issues: parsed?.issues ?? [] },
  };
}

// ── OFFICES ────────────────────────────────────────────────
async function checkOffices(district: DistrictWithState): Promise<CheckResult> {
  const offices = await prisma.govOffice.findMany({ where: { districtId: district.id } });
  const noPhone = offices.filter((o) => !o.phone).length;

  if (noPhone > 0) {
    const missing = offices.filter((o) => !o.phone).slice(0, 10);
    const list = missing.map((o) => `- ${o.name}, ${o.address ?? "unknown"}`).join("\n");
    const prompt = `Find phone numbers for these government offices in ${district.name}, ${district.state.name}, India.
All these are public government offices — numbers are on district websites and state portals.

${list}

Return ONLY JSON array: [{"name":"...","phone":"number or null","source":"..."}]`;
    const text = await callOpus(prompt);
    const parsed = parseJSON<Array<{ name: string; phone?: string }>>(text);
    if (parsed) {
      for (const item of parsed) {
        if (item.phone && item.phone !== "null") {
          const office = missing.find((o) => o.name === item.name);
          if (office) await prisma.govOffice.update({ where: { id: office.id }, data: { phone: item.phone } }).catch(() => {});
        }
      }
    }
    await delay(2000);
  }

  return {
    itemsChecked: offices.length,
    issuesFound: noPhone > 0 ? 1 : 0,
    staleItems: 0,
    details: { total: offices.length, missingPhones: noPhone },
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
