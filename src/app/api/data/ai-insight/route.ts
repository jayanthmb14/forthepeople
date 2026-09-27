/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Shared AI Insight API
// GET /api/data/ai-insight?district=mandya&module=water
//
// 3-tier cascade: district → state → national
// Rule-based templates for 80% of cases (zero Gemini cost)
// Stores/reads SharedAIInsight model with TTL-based expiry
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";
import { JJM_DISTRICT_TOTAL, LOCAL_INFRA, NOT_FROM_NEWS_OPTIONAL } from "@/lib/data-filters";
import {
  INSIGHT_TEMPLATES,
  damInsightLevel,
  weatherInsightLevel,
  cropInsightLevel,
} from "@/lib/ai/insight-templates";

const TTL_DISTRICT = 6 * 60 * 60; // 6 hours
const TTL_FALLBACK = 60 * 60;     // 1 hour fallback

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const districtSlug = sp.get("district") ?? "";
  const moduleSlug = sp.get("module") ?? "";

  if (!districtSlug || !moduleSlug) {
    return NextResponse.json({ error: "district and module params required" }, { status: 400 });
  }

  const cacheKey = `ftp:ai-insight:${districtSlug}:${moduleSlug}`;

  // 1. Redis cache check
  const cached = await cacheGet<{ insight: string; generatedAt: string; source: string }>(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached, fromCache: true });
  }

  // 2. Check SharedAIInsight DB for non-expired district insight
  try {
    const district = await prisma.district.findFirst({
      where: { slug: districtSlug },
      select: { id: true, name: true },
    });

    if (district) {
      const existing = await prisma.sharedAIInsight.findFirst({
        where: {
          scope: "district",
          scopeId: district.id,
          module: moduleSlug,
          expiresAt: { gt: new Date() },
        },
        orderBy: { generatedAt: "desc" },
      });

      if (existing) {
        const result = { insight: existing.insight, generatedAt: existing.generatedAt.toISOString(), source: existing.source, fromCache: false };
        await cacheSet(cacheKey, result, TTL_FALLBACK);
        return NextResponse.json(result);
      }

      // 3. Generate template-based insight for this district + moduleSlug
      const insight = await generateTemplateInsight(district.id, district.name, moduleSlug);
      if (insight) {
        const expiresAt = new Date(Date.now() + TTL_DISTRICT * 1000);
        await prisma.sharedAIInsight.create({
          data: {
            scope: "district",
            scopeId: district.id,
            module: moduleSlug,
            insight,
            expiresAt,
            source: "template",
          },
        });
        const result = { insight, generatedAt: new Date().toISOString(), source: "template", fromCache: false };
        await cacheSet(cacheKey, result, TTL_FALLBACK);
        return NextResponse.json(result);
      }
    }

    // 4. No insight available — return empty
    return NextResponse.json({ insight: null, fromCache: false });
  } catch (err) {
    console.error("[ai-insight]", err);
    return NextResponse.json({ insight: null, fromCache: false, error: true });
  }
}

// ── Template-based insight generator ────────────────────────────────────────
async function generateTemplateInsight(
  districtId: string,
  districtName: string,
  module: string
): Promise<string | null> {
  try {
    switch (module) {
      case "water": {
        const dam = await prisma.damReading.findFirst({
          where: { districtId },
          orderBy: { recordedAt: "desc" },
          select: { damName: true, storagePct: true },
        });
        if (!dam) return INSIGHT_TEMPLATES.water.none();
        const level = damInsightLevel(dam.storagePct);
        return INSIGHT_TEMPLATES.water[level](dam.damName, Math.round(dam.storagePct));
      }

      case "crops": {
        const latestCrop = await prisma.cropPrice.findFirst({
          where: { districtId },
          orderBy: { date: "desc" },
          select: { commodity: true, modalPrice: true, date: true },
        });
        if (!latestCrop) return INSIGHT_TEMPLATES.crops.none();
        // Look for a week-old price to compare
        const weekAgo = new Date(latestCrop.date.getTime() - 7 * 24 * 60 * 60 * 1000);
        const olderCrop = await prisma.cropPrice.findFirst({
          where: {
            districtId,
            commodity: latestCrop.commodity,
            date: { lte: weekAgo },
          },
          orderBy: { date: "desc" },
          select: { modalPrice: true },
        });
        if (!olderCrop) return INSIGHT_TEMPLATES.crops.stable(latestCrop.commodity, Math.round(latestCrop.modalPrice));
        const changePct = ((latestCrop.modalPrice - olderCrop.modalPrice) / olderCrop.modalPrice) * 100;
        const level = cropInsightLevel(changePct);
        if (level === "rising") return INSIGHT_TEMPLATES.crops.rising(latestCrop.commodity, changePct, Math.round(latestCrop.modalPrice));
        if (level === "falling") return INSIGHT_TEMPLATES.crops.falling(latestCrop.commodity, Math.abs(changePct), Math.round(latestCrop.modalPrice));
        return INSIGHT_TEMPLATES.crops.stable(latestCrop.commodity, Math.round(latestCrop.modalPrice));
      }

      case "weather": {
        const weather = await prisma.weatherReading.findFirst({
          where: { districtId },
          orderBy: { recordedAt: "desc" },
          select: { temperature: true, rainfall: true },
        });
        if (!weather || weather.temperature == null) return INSIGHT_TEMPLATES.weather.none();
        const level = weatherInsightLevel(weather.temperature, weather.rainfall ?? 0);
        if (level === "rain") return INSIGHT_TEMPLATES.weather.rain(districtName, weather.rainfall ?? 0);
        return INSIGHT_TEMPLATES.weather[level](districtName, Math.round(weather.temperature));
      }

      case "schools": {
        const results = await prisma.schoolResult.findMany({
          where: { school: { districtId } },
          orderBy: { year: "desc" },
          take: 20,
          select: { passPercentage: true },
        });
        if (!results.length) return INSIGHT_TEMPLATES.schools.none();
        const avg = results.reduce((s, r) => s + r.passPercentage, 0) / results.length;
        const STATE_AVG = 72; // Karnataka average
        if (avg >= STATE_AVG) return INSIGHT_TEMPLATES.schools.good(districtName, avg);
        return INSIGHT_TEMPLATES.schools.concern(districtName, avg, STATE_AVG);
      }

      case "leadership": {
        const total = await prisma.leader.count({ where: { districtId, active: true, ...NOT_FROM_NEWS_OPTIONAL } });
        if (!total) return INSIGHT_TEMPLATES.leadership.none();
        return INSIGHT_TEMPLATES.leadership.filled(total, total);
      }

      case "infrastructure": {
        const onTrack = await prisma.infraProject.count({
          where: { districtId, ...LOCAL_INFRA, status: { in: ["ongoing", "completed"] } },
        });
        const delayed = await prisma.infraProject.count({
          where: { districtId, ...LOCAL_INFRA, status: "delayed" },
        });
        if (delayed > 0) return INSIGHT_TEMPLATES.infrastructure.delayed(delayed);
        if (onTrack > 0) return INSIGHT_TEMPLATES.infrastructure.onTrack(onTrack);
        return null;
      }

      case "jjm": {
        const jjm = await prisma.jJMStatus.findFirst({
          where: { districtId, ...JJM_DISTRICT_TOTAL },
          orderBy: { updatedAt: "desc" },
          select: { coveragePct: true },
        });
        if (!jjm) return INSIGHT_TEMPLATES.jjm.none();
        if (jjm.coveragePct >= 80) return INSIGHT_TEMPLATES.jjm.good(districtName, jjm.coveragePct);
        return INSIGHT_TEMPLATES.jjm.poor(districtName, jjm.coveragePct);
      }

      case "housing": {
        const housing = await prisma.housingScheme.findFirst({
          where: { districtId },
          orderBy: { updatedAt: "desc" },
          select: { schemeName: true, targetHouses: true, completed: true },
        });
        if (!housing) return INSIGHT_TEMPLATES.housing.none();
        const pct = housing.targetHouses > 0 ? (housing.completed / housing.targetHouses) * 100 : 0;
        if (pct >= 60) return INSIGHT_TEMPLATES.housing.good(housing.schemeName, pct);
        return INSIGHT_TEMPLATES.housing.slow(housing.schemeName, pct);
      }

      default:
        return null;
    }
  } catch {
    return null;
  }
}
