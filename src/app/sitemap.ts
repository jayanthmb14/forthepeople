/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * sitemap.xml — every public page, for every shipped locale.
 *
 * Honesty notes:
 *   - `lastModified` is only set where we actually know something changed.
 *     Stamping `new Date()` on every URL tells Google "everything changed
 *     today" on every crawl, which it learns to ignore. Pages that are
 *     refreshed by crons (homepage, /india, district overview + module
 *     pages) keep a daily stamp because their data really does move;
 *     static pages (about, privacy, …) carry no lastmod at all.
 *   - Locales come from src/i18n/routing.ts, so adding "hi" there is the
 *     only change needed to list Hindi URLs here.
 */

import { MetadataRoute } from "next";
import { INDIA_STATES } from "@/lib/constants/districts";
import { INDIA_MODULES } from "@/lib/india/india-modules";
import { routing } from "@/i18n/routing";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

const DISTRICT_MODULES = [
  "overview", "weather", "crops", "water", "population", "finance",
  "leadership", "infrastructure", "police", "industries", "schemes",
  "services", "elections", "transport", "jjm", "housing", "power",
  "schools", "farm", "rti", "gram-panchayat", "courts", "health",
  "alerts", "offices", "citizen-corner", "news", "map",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  // One stamp per build, not one per URL — cheap and consistent.
  const now = new Date();

  for (const locale of routing.locales) {
    const L = `${BASE}/${locale}`;

    entries.push(
      { url: L, lastModified: now, changeFrequency: "daily", priority: 1.0 },
      { url: `${L}/india`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
      { url: `${L}/india/updates`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
      { url: `${L}/prices`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
      { url: `${L}/about`, changeFrequency: "monthly", priority: 0.7 },
      { url: `${L}/support`, changeFrequency: "monthly", priority: 0.6 },
      { url: `${L}/contribute`, changeFrequency: "monthly", priority: 0.6 },
      { url: `${L}/privacy`, changeFrequency: "yearly", priority: 0.4 },
      { url: `${L}/disclaimer`, changeFrequency: "yearly", priority: 0.4 },
    );

    // Per-module national deep-dive routes. Live modules get weekly
    // cadence + 0.8 priority; coming-soon get monthly + 0.5 since they are
    // SEO-soft until populated.
    for (const mod of INDIA_MODULES) {
      const live = mod.status === "live";
      entries.push({
        url: `${L}/india/${mod.slug}`,
        ...(live ? { lastModified: now } : {}),
        changeFrequency: live ? "weekly" : "monthly",
        priority: live ? 0.8 : 0.5,
      });
    }

    // Only ACTIVE state + district + module pages (not locked coming-soon
    // districts — those render a preview, not data).
    for (const state of INDIA_STATES) {
      if (!state.active) continue;
      const stateUrl = `${L}/${state.slug}`;
      entries.push({ url: stateUrl, changeFrequency: "monthly", priority: 0.6 });

      for (const district of state.districts) {
        if (!district.active) continue;
        const base = `${stateUrl}/${district.slug}`;
        entries.push({ url: base, lastModified: now, changeFrequency: "daily", priority: 0.8 });

        for (const mod of DISTRICT_MODULES) {
          entries.push({ url: `${base}/${mod}`, lastModified: now, changeFrequency: "daily", priority: 0.65 });
        }
      }
    }
  }

  return entries;
}
