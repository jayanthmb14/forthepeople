/**
 * "Natural resources and energy" band (Section 06) as a BandSpec.
 * Numbers from IndiaIndicator; words from page_india "energy.*". The
 * energy-mix card draws one stacked bar of the published shares.
 */

import { indicatorKey, specRefs, type BandSpec, type MetricRef } from "../band-spec";

export { indicatorKey };
export type { MetricRef };

const P = "energy-power";

export const ENERGY_SPEC: BandSpec = {
  group: "energy",
  slug: "natural-resources-energy",
  tintId: "natural",
  titleId: "natural-resources-energy-title",
  watermarkClass: "sunWatermark",
  dotsAccent: "#1F5C5C",
  directory: [
    { moduleSlug: P, emoji: "⚡", featured: true, value: { ref: { moduleSlug: P, metricKey: "installed_capacity_gw" }, fmt: "fmt.gw" } },
    { moduleSlug: "energy-renewables", emoji: "☀️", value: { ref: { moduleSlug: "energy-renewables", metricKey: "renewable_installed_gw" }, fmt: "energy.fmt.gwClean" } },
    { moduleSlug: "energy-coal", emoji: "🪨", value: { ref: { moduleSlug: "energy-coal", metricKey: "coal_production_million_tonnes" }, fmt: "energy.fmt.mtCoal" } },
    { moduleSlug: "energy-fuels", emoji: "🛢", value: { ref: { moduleSlug: "energy-fuels", metricKey: "crude_imports_million_tonnes" }, fmt: "energy.fmt.mtCrude" } },
  ],
  featured: {
    moduleSlug: P,
    emoji: "⚡",
    headline: { ref: { moduleSlug: P, metricKey: "installed_capacity_gw" } },
    growth: { ref: { moduleSlug: P, metricKey: "capacity_change_yoy_gw" }, fmt: "energy.growth" },
    callout: { value: { ref: { moduleSlug: P, metricKey: "re_target_gw_2030" }, fmt: "fmt.gw" }, sub: "calloutSub" },
    cells: [
      { key: "coal", value: { ref: { moduleSlug: P, metricKey: "coal_capacity_gw" }, fmt: "fmt.gw" }, sub: { ref: { moduleSlug: P, metricKey: "mix_pct_coal" }, fmt: "energy.fmt.mix" } },
      { key: "re", value: { ref: { moduleSlug: P, metricKey: "renewables_capacity_gw" }, fmt: "fmt.gw" }, sub: { ref: { moduleSlug: P, metricKey: "mix_pct_renewables" }, fmt: "energy.fmt.mix" } },
      { key: "hydro", value: { ref: { moduleSlug: P, metricKey: "hydro_capacity_gw" }, fmt: "fmt.gw" }, sub: { ref: { moduleSlug: P, metricKey: "mix_pct_hydro" }, fmt: "energy.fmt.mix" } },
      { key: "nuclear", value: { ref: { moduleSlug: P, metricKey: "nuclear_capacity_gw" }, decimals: 1, fmt: "fmt.gw" }, sub: { ref: { moduleSlug: P, metricKey: "mix_pct_nuclear" }, decimals: 1, fmt: "energy.fmt.mix" } },
    ],
  },
  cards: [
    {
      key: "topStates",
      emoji: "⚡",
      href: "/india/energy-power",
      bars: true,
      rows: [
        // Order and ranks from CEA's installed-capacity report, 31 Aug 2026 (docs/DATA-FIXES-2026-09.md):
        // Gujarat 77.0 GW, Rajasthan 67.8, Maharashtra 62.4, Tamil Nadu 48.0, (Uttar Pradesh 39.7), Karnataka 39.3.
        { key: "gj", rank: 1, state: "gujarat", value: { ref: { moduleSlug: P, metricKey: "top_state_gj_capacity_gw" }, fmt: "fmt.gw" } },
        { key: "rj", rank: 2, state: "rajasthan", value: { ref: { moduleSlug: P, metricKey: "top_state_rj_capacity_gw" }, fmt: "fmt.gw" } },
        { key: "mh", rank: 3, state: "maharashtra", value: { ref: { moduleSlug: P, metricKey: "top_state_mh_capacity_gw" }, fmt: "fmt.gw" } },
        { key: "tn", rank: 4, state: "tamil-nadu", value: { ref: { moduleSlug: P, metricKey: "top_state_tn_capacity_gw" }, fmt: "fmt.gw" } },
        { key: "ka", rank: 6, state: "karnataka", value: { ref: { moduleSlug: P, metricKey: "top_state_kn_capacity_gw" }, fmt: "fmt.gw" } },
      ],
    },
    {
      key: "mix",
      emoji: "🔌",
      href: "/india/energy-renewables",
      mixBar: true,
      rows: [
        { key: "coal", emoji: "🪨", color: "#475569", value: { ref: { moduleSlug: P, metricKey: "mix_pct_coal" }, fmt: "fmt.pct" } },
        { key: "renewables", emoji: "☀️", color: "#D97706", value: { ref: { moduleSlug: P, metricKey: "mix_pct_renewables" }, fmt: "fmt.pct" } },
        { key: "hydro", emoji: "💧", color: "#0369A1", value: { ref: { moduleSlug: P, metricKey: "mix_pct_hydro" }, fmt: "fmt.pct" } },
        { key: "nuclear", emoji: "⚛️", color: "#7C3AED", value: { ref: { moduleSlug: P, metricKey: "mix_pct_nuclear" }, decimals: 1, fmt: "fmt.pct" } },
      ],
    },
  ],
};

export function allNaturalResourcesEnergyRefs(): MetricRef[] {
  return specRefs(ENERGY_SPEC);
}
