/**
 * "Governance and justice" band (Section 08) as a BandSpec.
 * Numbers from IndiaIndicator (the Lok Sabha seat count now reads its
 * stored row instead of a typed "543"); words from page_india "gov.*".
 */

import { indicatorKey, specRefs, type BandSpec, type MetricRef } from "../band-spec";

export { indicatorKey };
export type { MetricRef };

const POL = "justice-police";

export const GOV_SPEC: BandSpec = {
  group: "gov",
  slug: "governance",
  tintId: "governance",
  titleId: "governance-title",
  watermarkClass: "scaleWatermark",
  dotsAccent: "#3C3489",
  directory: [
    { moduleSlug: POL, featured: true, value: { ref: { moduleSlug: POL, metricKey: "civil_police_total_lakh" }, fmt: "fmt.lakh" } },
    { moduleSlug: "justice-pendency", value: { ref: { moduleSlug: "justice-pendency", metricKey: "total_pending_crore_cases" }, fmt: "fmt.crore" } },
    { moduleSlug: "justice-crime", value: { ref: { moduleSlug: "justice-crime", metricKey: "ipc_cases_per_year_lakh" }, fmt: "gov.fmt.lakhYear" } },
    { moduleSlug: "justice-prisons", value: { ref: { moduleSlug: "justice-prisons", metricKey: "prison_population_lakh" }, decimals: 1, fmt: "fmt.lakh" } },
    { moduleSlug: "elections-loksabha", value: { ref: { moduleSlug: "elections-loksabha", metricKey: "loksabha_seats_total" }, fmt: "gov.fmt.seats" } },
    { moduleSlug: "elections-rajyasabha", value: { ref: { moduleSlug: "elections-rajyasabha", metricKey: "rajyasabha_seats_total" }, fmt: "gov.fmt.seats" } },
    { moduleSlug: "elections-turnout", value: { ref: { moduleSlug: "elections-turnout", metricKey: "ge_2024_turnout_pct" }, decimals: 1, fmt: "fmt.pct" } },
    { moduleSlug: "defence-budget", value: { ref: { moduleSlug: "defence-budget", metricKey: "defence_allocation_lakh_cr" }, decimals: 1, fmt: "fmt.inrLakhCr" } },
    { moduleSlug: "defence-exports", value: { ref: { moduleSlug: "defence-exports", metricKey: "defence_exports_thousand_cr" }, fmt: "gov.fmt.inrThousandCr" } },
    { moduleSlug: "defence-dpsu", value: { ref: { moduleSlug: "defence-dpsu", metricKey: "dpsu_count" }, fmt: "gov.fmt.dpsus" } },
  ],
  featured: {
    moduleSlug: POL,
    headline: { ref: { moduleSlug: POL, metricKey: "civil_police_total_lakh" } },
    growth: { ref: { moduleSlug: POL, metricKey: "police_per_lakh_population" }, fmt: "gov.growth" },
    callout: { value: { ref: { moduleSlug: POL, metricKey: "un_target_per_lakh" } }, sub: "calloutSub" },
    cells: [
      { key: "police", value: { ref: { moduleSlug: POL, metricKey: "civil_police_total_lakh" }, decimals: 1 }, sub: { text: "sub" } },
      { key: "pending", value: { ref: { moduleSlug: "justice-pendency", metricKey: "total_pending_crore_cases" }, decimals: 1 }, sub: { text: "sub" } },
      { key: "defence", value: { ref: { moduleSlug: "defence-budget", metricKey: "defence_allocation_lakh_cr" }, decimals: 1 }, sub: { text: "sub" } },
      { key: "lokSabha", value: { ref: { moduleSlug: "elections-loksabha", metricKey: "loksabha_seats_total" } }, sub: { text: "sub" } },
    ],
  },
  cards: [
    {
      key: "justice",
      glyph: "justice",
      href: "/india/justice-police",
      rows: [
        { key: "police", value: { ref: { moduleSlug: POL, metricKey: "civil_police_total_lakh" }, fmt: "fmt.lakh" } },
        { key: "pending", value: { ref: { moduleSlug: "justice-pendency", metricKey: "total_pending_crore_cases" }, fmt: "fmt.crore" } },
        { key: "prisons", value: { ref: { moduleSlug: "justice-prisons", metricKey: "prison_population_lakh" }, decimals: 1, fmt: "fmt.lakh" } },
        { key: "crime", value: { ref: { moduleSlug: "justice-crime", metricKey: "ipc_cases_per_year_lakh" }, fmt: "gov.fmt.lakhYear" } },
        { key: "conviction", value: { ref: { moduleSlug: "justice-crime", metricKey: "conviction_rate_pct" }, fmt: "fmt.pct" } },
      ],
    },
    {
      key: "defenceElections",
      glyph: "shield",
      href: "/india/defence-budget",
      rows: [
        { key: "defenceBudget", value: { ref: { moduleSlug: "defence-budget", metricKey: "defence_allocation_lakh_cr" }, decimals: 1, fmt: "fmt.inrLakhCr" } },
        { key: "defenceExports", value: { ref: { moduleSlug: "defence-exports", metricKey: "defence_exports_thousand_cr" }, fmt: "gov.fmt.inrThousandCr" } },
        { key: "lokSabha", value: { ref: { moduleSlug: "elections-loksabha", metricKey: "loksabha_seats_total" } } },
        { key: "turnout", value: { ref: { moduleSlug: "elections-turnout", metricKey: "ge_2024_turnout_pct" }, decimals: 1, fmt: "fmt.pct" } },
      ],
    },
  ],
};

export function allGovernanceRefs(): MetricRef[] {
  return specRefs(GOV_SPEC);
}
