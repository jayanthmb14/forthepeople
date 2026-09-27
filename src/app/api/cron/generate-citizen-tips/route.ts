/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Cron: Generate weekly citizen tips for all districts
// GET or POST /api/cron/generate-citizen-tips
// Schedule: Weekly, Sunday 06:00 UTC (Vercel cron — see vercel.json)
// Auth: verifyCron() — "Authorization: Bearer <CRON_SECRET>" (Vercel)
//       or "x-cron-secret: <CRON_SECRET>" (manual curl)
// Generates tips via callAI (free tier) and stores in Redis (7-day TTL)
//
// Sept 2026 fix: Vercel Cron only ever sends GET, but this file exported
// POST only, so every Sunday run got a 405 before the handler ran and the
// Citizen Corner page said "next tips in 1 day" forever. GET now delegates
// to POST. Run state is recorded in Redis "ftp:cron:generate-citizen-tips".
//
// v5: the answer is parsed by callAIJSON ({"tips":[…]} or a list) and each
// tip is validated; when a district gets no tips this week, LAST week's tips
// are kept (with their own date) instead of being overwritten by an empty
// list for 7 days. No new district starts after 240 s.
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";
import { callAIJSON } from "@/lib/ai-provider";
import { alertCronFailed } from "@/lib/admin-alerts";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";
import { normalizeCitizenTips, tipsToStore, type CitizenTip, type StoredTips } from "@/lib/citizen-tips";

export const runtime = "nodejs";
// 10 districts × (AI call + 2 s pause) comfortably fits; cap at 5 min.
export const maxDuration = 300;
const CRON_NAME = "generate-citizen-tips";

const TIPS_TTL = 7 * 24 * 60 * 60; // 7 days
const BUDGET_MS = 240_000;

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const SEASONS: Record<string, string> = {
  "1": "Rabi/winter", "2": "Rabi/winter", "3": "summer/pre-monsoon",
  "4": "summer/pre-monsoon", "5": "summer/pre-monsoon",
  "6": "Kharif/monsoon", "7": "Kharif/monsoon", "8": "Kharif/monsoon", "9": "Kharif/monsoon",
  "10": "post-harvest/Rabi sowing", "11": "post-harvest/Rabi sowing",
  "12": "Rabi/winter",
};

function getSeason(month: number): string {
  return SEASONS[String(month)] ?? "general";
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateTipsForDistrict(
  districtName: string,
  districtId: string,
  stateName: string,
  month: number,
  year: number,
  weather?: { temperature: number | null; conditions: string | null; rainfall: number | null },
  alerts?: Array<{ title: string; type: string; severity: string }>,
  schemes?: Array<{ name: string }>,
  deadlineAt?: number,
): Promise<{ tips: CitizenTip[]; error?: string }> {
  const monthName = MONTHS[month - 1];
  const season = getSeason(month);

  const contextParts: string[] = [];
  if (weather) {
    contextParts.push(
      `Weather: ${weather.temperature ?? "?"}°C, ${weather.conditions ?? "unknown"}`
    );
  }
  if (alerts?.length) {
    contextParts.push(
      `Active alerts: ${alerts.map((a) => `${a.title} (${a.severity})`).join(", ")}`
    );
  }
  if (schemes?.length) {
    contextParts.push(`Government schemes: ${schemes.map((s) => s.name).join(", ")}`);
  }
  const contextData =
    contextParts.length > 0 ? contextParts.join(". ") : "General district context";

  const prompt = `You are a civic advisor for ${districtName} district, ${stateName}, India. Generate exactly 6 practical, actionable citizen tips for ${monthName} ${year} (${season} season).

Current district context: ${contextData}

Respond ONLY with a valid JSON object (no markdown, no extra text):
{
  "tips": [
    {
      "category": "Agriculture|Health|Finance|Water|Rights|Safety|Education|Environment",
      "title": "short action title (max 8 words)",
      "description": "2-3 sentences of specific, practical advice relevant to ${districtName} citizens in ${monthName}",
      "urgency": "now|soon|general"
    }
  ]
}

Guidelines:
- Mix categories: 2 agriculture, 1 health, 1 government scheme, 1 safety/emergency, 1 civic duty
- Be hyper-local — mention ${districtName}-specific context where possible
- urgency "now" = must do this week, "soon" = this month, "general" = evergreen advice
- Write for ordinary citizens, not experts
- Use Indian context (schemes, government portals, local practices)
- Never invent phone numbers, dates, amounts or website addresses`;

  try {
    const { data } = await callAIJSON({
      systemPrompt: `You are a civic advisor for ${districtName} district, ${stateName}, India.`,
      userPrompt: prompt,
      purpose: "summarize",
      jsonShape: "object",
      maxTokens: 2048,
      timeoutMs: 45_000,
      deadlineAt,
    });
    const tips = normalizeCitizenTips(data);
    return tips.length > 0 ? { tips } : { tips, error: "answer had no complete tips" };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[citizen-tips cron] Failed for ${districtName}:`, error.slice(0, 300));
    return { tips: [], error };
  }
}

export async function POST(req: NextRequest) {
  // ── Auth (accepts Bearer or x-cron-secret; fails closed) ──
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const runStart = await cronStarted(CRON_NAME);
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const generatedAt = now.toISOString();

  // Next refresh: 7 days from now
  const nextRefreshDate = new Date(now.getTime() + TIPS_TTL * 1000);
  const nextRefreshDays = 7;

  const results: { district: string; ok: boolean; count: number; keptPrevious?: boolean; error?: string }[] = [];
  const deadlineAt = runStart + BUDGET_MS;
  const notReached: string[] = [];

  try {
    // Get all active districts
    const districts = await prisma.district.findMany({
      where: { active: true },
      select: { id: true, slug: true, name: true, state: { select: { name: true } } },
    });

    console.log(`[citizen-tips cron] Generating tips for ${districts.length} districts...`);

    for (const district of districts) {
      if (Date.now() >= deadlineAt) {
        notReached.push(district.slug);
        continue;
      }
      // Gather context (lightweight)
      const [weather, alerts, schemes] = await Promise.all([
        prisma.weatherReading.findFirst({
          where: { districtId: district.id },
          orderBy: { recordedAt: "desc" },
          select: { temperature: true, conditions: true, rainfall: true },
        }),
        prisma.localAlert.findMany({
          where: { districtId: district.id, active: true },
          take: 3,
          select: { title: true, type: true, severity: true },
        }),
        prisma.scheme.findMany({
          where: { districtId: district.id, active: true },
          take: 3,
          select: { name: true },
        }),
      ]);

      const { tips, error } = await generateTipsForDistrict(
        district.name,
        district.id,
        district.state.name,
        month,
        year,
        weather ?? undefined,
        alerts,
        schemes,
        deadlineAt,
      );

      const cacheKey = `ftp:ai:citizen-tips:${district.slug}`;
      const fresh: StoredTips = { tips, month, year, generatedAt, generatedBy: "cron" };

      // Never overwrite good tips with an empty list: keep last week's.
      const previous = tips.length > 0 ? null : await cacheGet<StoredTips>(cacheKey);
      const toStore = tipsToStore(fresh, previous);
      if (toStore) await cacheSet(cacheKey, toStore.payload, TIPS_TTL);

      results.push({
        district: district.slug,
        ok: tips.length > 0,
        count: tips.length,
        keptPrevious: toStore?.kept || undefined,
        error: error?.slice(0, 200),
      });

      // Rate limit: 2s between districts to avoid API limits
      await sleep(2000);
    }

    const okCount = results.filter((r) => r.ok).length;
    console.log(`[citizen-tips cron] Done. ${okCount}/${districts.length} districts succeeded.`);

    // If not a single district got tips, the AI layer is almost certainly
    // down — record the run as an error so /api/health goes "degraded".
    const attempted = results.length;
    const allFailed = attempted > 0 && okCount === 0;
    const firstError = results.find((r) => r.error)?.error;
    const errorText = allFailed
      ? `0 of ${attempted} districts received tips. ${firstError ?? ""}`.trim()
      : notReached.length > 0
        ? `time budget used; not reached: ${notReached.join(", ")}`
        : undefined;
    await cronFinished(CRON_NAME, runStart, {
      status: allFailed ? "error" : "ok",
      count: okCount,
      error: errorText,
    });
    if (allFailed && errorText) alertCronFailed(CRON_NAME, errorText).catch(() => {});

    return NextResponse.json({
      success: !allFailed,
      notReached,
      generatedAt,
      nextRefreshInDays: nextRefreshDays,
      nextRefreshDate: nextRefreshDate.toISOString(),
      results,
    });
  } catch (err) {
    console.error("[citizen-tips cron] Error:", err);
    await cronFinished(CRON_NAME, runStart, { status: "error", error: String(err) });
    return NextResponse.json({ error: "Internal error", details: String(err) }, { status: 500 });
  }
}

// Vercel Cron always calls with GET — delegate to the same handler.
export async function GET(req: NextRequest) {
  return POST(req);
}
