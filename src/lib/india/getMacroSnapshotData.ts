/**
 * Server-side data loader for the macro-snapshot "India at a Glance" band.
 *
 * SuperCategory + Module data come from the TypeScript registries
 * (single source of truth for editorial structure). Numeric values and
 * source attributions come from IndiaIndicator (Prisma). Last refresh
 * comes from IndiaScraperRun, filtered to the macro modules' scraperKeys
 * declared in the module registry.
 *
 * NEVER invents a value. If a row is missing, the indicator is omitted
 * from the lookup map and the corresponding component renders nothing.
 */

import { prisma } from "@/lib/db";
import { INDIA_SUPER_CATEGORIES } from "./india-super-categories";
import { INDIA_MODULES, type IndiaModuleDef } from "./india-modules";
import {
  allMacroRefs,
  indicatorKey,
} from "@/components/india/sections/IndiaAtGlance/metrics";

const MACRO_SLUG = "macro-snapshot";

export type MacroIndicator = {
  moduleSlug: string;
  metricKey: string;
  value: number;
  unit: string;
  source: string | null;
  sourceUrl: string | null;
  asOfDate: Date;
};

export type MacroModuleRef = {
  slug: string;
  title: string;
  status: IndiaModuleDef["status"];
  displayOrder: number;
};

export type LatestUpdate = {
  moduleSlug: string;
  /** Lets the band show a translated label (page_india-module "metric.*"). */
  metricKey: string;
  label: string;
  value: number | null;
  unit: string;
  asOfDate: Date;
};

export type MacroSnapshotData = {
  superCategory: (typeof INDIA_SUPER_CATEGORIES)[number];
  modules: MacroModuleRef[];
  /** Module metadata indexed by slug, for O(1) directory-row title lookup. */
  moduleBySlug: Record<string, MacroModuleRef>;
  liveCount: number;
  totalCount: number;
  indicatorByKey: Record<string, MacroIndicator>;
  sources: string[];
  lastRefreshAt: Date | null;
  totalSuperCategories: number;
  /** Most-recent indicator updates across the macro modules (live data feed). */
  latestUpdates: LatestUpdate[];
};

export async function getMacroSnapshotData(): Promise<MacroSnapshotData> {
  const superCategory = INDIA_SUPER_CATEGORIES.find((sc) => sc.slug === MACRO_SLUG);
  if (!superCategory) {
    throw new Error(`Super-category '${MACRO_SLUG}' not found in registry`);
  }

  const macroModules = INDIA_MODULES.filter((m) => m.superCategory === MACRO_SLUG).sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  const moduleSlugs = macroModules.map((m) => m.slug);
  const scraperKeys = Array.from(
    new Set(macroModules.flatMap((m) => m.scraperKeys ?? [])),
  );

  // Build the canonical list of (moduleSlug, metricKey) pairs to load.
  // The walk is owned by metrics.ts so the fetcher stays oblivious to
  // which slots the v4 layout exposes.
  const wantedRefs = allMacroRefs();

  const rows = await prisma.indiaIndicator.findMany({
    where: {
      OR: wantedRefs.map((r) => ({
        moduleSlug: r.moduleSlug,
        metricKey: r.metricKey,
      })),
    },
    orderBy: { asOfDate: "desc" },
  });

  // Index by `${moduleSlug}::${metricKey}` for O(1) lookup.
  const indicatorByKey: Record<string, MacroIndicator> = {};
  for (const r of rows) {
    const key = indicatorKey({ moduleSlug: r.moduleSlug, metricKey: r.metricKey });
    if (indicatorByKey[key]) continue; // first row wins (most recent due to sort)
    if (r.numericValue == null) continue;
    indicatorByKey[key] = {
      moduleSlug: r.moduleSlug,
      metricKey: r.metricKey,
      value: Number(r.numericValue),
      unit: r.unit ?? "",
      source: r.source ?? null,
      sourceUrl: r.sourceUrl ?? null,
      asOfDate: r.asOfDate,
    };
  }

  // Distinct sources across the loaded rows, ordered by frequency, top 5.
  const sourceCounts = new Map<string, number>();
  for (const r of rows) {
    if (!r.source) continue;
    sourceCounts.set(r.source, (sourceCounts.get(r.source) ?? 0) + 1);
  }
  const sources = Array.from(sourceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([s]) => s);

  // Most-recent scraper run across any macro module's declared scraperKeys.
  // Returns null when no run has been recorded yet — components must
  // render an em-dash or hide the field gracefully.
  const lastRun =
    scraperKeys.length === 0
      ? null
      : await prisma.indiaScraperRun.findFirst({
          where: { scraperKey: { in: scraperKeys } },
          orderBy: { startedAt: "desc" },
          select: { startedAt: true },
        });

  const modules: MacroModuleRef[] = macroModules.map((m) => ({
    slug: m.slug,
    title: m.title,
    status: m.status,
    displayOrder: m.displayOrder,
  }));

  const moduleBySlug: Record<string, MacroModuleRef> = Object.fromEntries(
    modules.map((m) => [m.slug, m]),
  );

  // Most-recent indicator activity across the macro modules. Powers the
  // "Latest updates" right-column card (live data feed).
  const latestUpdatesRaw =
    moduleSlugs.length === 0
      ? []
      : await prisma.indiaIndicator.findMany({
          where: { moduleSlug: { in: moduleSlugs } },
          orderBy: { asOfDate: "desc" },
          take: 4,
          select: {
            moduleSlug: true,
            metricKey: true,
            metricLabel: true,
            numericValue: true,
            unit: true,
            asOfDate: true,
          },
        });

  const latestUpdates: LatestUpdate[] = latestUpdatesRaw.map((u) => ({
    moduleSlug: u.moduleSlug,
    metricKey: u.metricKey,
    label: u.metricLabel ?? u.metricKey,
    value: u.numericValue == null ? null : Number(u.numericValue),
    unit: u.unit ?? "",
    asOfDate: u.asOfDate,
  }));

  return {
    superCategory,
    modules,
    moduleBySlug,
    liveCount: macroModules.filter((m) => m.status === "live").length,
    totalCount: macroModules.length,
    indicatorByKey,
    sources,
    lastRefreshAt: lastRun?.startedAt ?? null,
    totalSuperCategories: INDIA_SUPER_CATEGORIES.length,
    latestUpdates,
  };
}
