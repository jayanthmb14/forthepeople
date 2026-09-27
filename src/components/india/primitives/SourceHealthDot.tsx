/**
 * SourceHealthDot — green/amber/red freshness dot per authenticity move #3 (file 45 §6).
 *
 * Server Component. Queries IndiaScraperRun for the latest sync row matching
 * the source key (the `scraperKey` prop name persists in code per spec — only
 * user-facing copy talks about "updates" / "source freshness").
 *
 * Phase 4.6 reality: most automated syncs haven't been wired yet, so the dot
 * defaults to amber with an honest tooltip ("First dataset, loaded by hand").
 * Honest disclosure, not a UX defect.
 */

import * as React from "react";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";

export type ScraperCadence =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annual"
  | "quadrennial"
  | "event-driven";

export interface SourceHealthDotProps {
  locale: string;
  scraperKey: string;
  expectedCadence?: ScraperCadence;
  size?: "small" | "medium";
  className?: string;
}

type Health = "green" | "amber" | "red";

const HEALTH_COLOR: Record<Health, string> = {
  green: "#16A34A",
  amber: "#BA7517",
  red: "#A32D2D",
};

// Cadence threshold in milliseconds — source is fresh if the last successful
// sync ran within this window.
const CADENCE_MS: Record<ScraperCadence, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 31 * 24 * 60 * 60 * 1000,
  quarterly: 95 * 24 * 60 * 60 * 1000,
  annual: 370 * 24 * 60 * 60 * 1000,
  quadrennial: 4 * 370 * 24 * 60 * 60 * 1000,
  // event-driven cadence has no time bound — treat as annual for staleness purposes
  "event-driven": 370 * 24 * 60 * 60 * 1000,
};

async function computeHealth(scraperKey: string, expectedCadence: ScraperCadence): Promise<{ health: Health; key: string }> {
  let latest: { startedAt: Date } | null = null;
  try {
    latest = await prisma.indiaScraperRun.findFirst({
      where: { scraperKey, status: "success" },
      orderBy: { startedAt: "desc" },
      select: { startedAt: true },
    });
  } catch {
    latest = null;
  }
  if (!latest) return { health: "amber", key: "firstLoad" };
  const sinceMs = Date.now() - new Date(latest.startedAt).getTime();
  const expected = CADENCE_MS[expectedCadence];
  if (sinceMs <= expected) return { health: "green", key: "onTime" };
  if (sinceMs <= 1.5 * expected) return { health: "amber", key: "late" };
  return { health: "red", key: "veryLate" };
}

export async function SourceHealthDot({
  locale,
  scraperKey,
  expectedCadence = "annual",
  size = "small",
  className,
}: SourceHealthDotProps) {
  const t = await getTranslations({ locale, namespace: "page_india-module" });
  const { health, key } = await computeHealth(scraperKey, expectedCadence);
  const tooltip = t(`data.health.${key}`, { cadence: t(`data.cadence.${expectedCadence}`) });
  const diameter = size === "small" ? 8 : 10;

  return (
    <span
      role="img"
      title={tooltip}
      aria-label={t("data.health.aria", { status: tooltip })}
      className={className}
      style={{
        display: "inline-block",
        width: `${diameter}px`,
        height: `${diameter}px`,
        borderRadius: "50%",
        background: HEALTH_COLOR[health],
        boxShadow: `0 0 0 3px color-mix(in srgb, ${HEALTH_COLOR[health]} 20%, transparent)`,
        verticalAlign: "middle",
        flexShrink: 0,
      }}
    />
  );
}

export default SourceHealthDot;
