/**
 * "Agriculture and livestock" band (Section 05) as a BandSpec.
 * Numbers from IndiaIndicator; words from page_india "agri.*".
 */

import { indicatorKey, specRefs, type BandSpec, type MetricRef } from "../band-spec";

export { indicatorKey };
export type { MetricRef };

const P = "agriculture-production";
const K = "agriculture-pmkisan";

export const AGRI_SPEC: BandSpec = {
  group: "agri",
  slug: "agriculture-livestock",
  tintId: "agriculture",
  titleId: "agriculture-livestock-title",
  watermarkClass: "wheatWatermark",
  dotsAccent: "#B58A1E",
  directory: [
    { moduleSlug: P, emoji: "🌾", featured: true, value: { ref: { moduleSlug: P, metricKey: "foodgrain_output_million_tonnes" }, decimals: 1, fmt: "fmt.mt" } },
    { moduleSlug: K, emoji: "💰", value: { ref: { moduleSlug: K, metricKey: "farmers_count_crore" }, fmt: "agri.fmt.crFarmers" } },
    { moduleSlug: "agriculture-plantation", emoji: "🍃", value: { ref: { moduleSlug: "agriculture-plantation", metricKey: "tea_production_million_kg" }, fmt: "agri.fmt.tea" } },
    { moduleSlug: "livestock-census", emoji: "🐄", value: { ref: { moduleSlug: "livestock-census", metricKey: "livestock_total_million" }, fmt: "agri.fmt.livestock" } },
    { moduleSlug: "livestock-fisheries", emoji: "🐟", value: { ref: { moduleSlug: "livestock-fisheries", metricKey: "fish_production_lakh_tonnes" }, fmt: "agri.fmt.fish" } },
  ],
  featured: {
    moduleSlug: P,
    emoji: "🌾",
    headline: { ref: { moduleSlug: P, metricKey: "foodgrain_output_million_tonnes" }, decimals: 1 },
    growth: { ref: { moduleSlug: P, metricKey: "foodgrain_change_yoy_mt" }, fmt: "agri.growth" },
    callout: { label: "calloutLabel", valueText: "calloutValue", subValue: { ref: { moduleSlug: P, metricKey: "top_producer_state_pct" }, fmt: "agri.fmt.share" } },
    cells: [
      { key: "rice", value: { ref: { moduleSlug: P, metricKey: "rice_production_million_tonnes" } }, sub: { text: "sub" } },
      { key: "wheat", value: { ref: { moduleSlug: P, metricKey: "wheat_production_million_tonnes" } }, sub: { text: "sub" } },
      { key: "topState", value: { text: "value" }, sub: { text: "sub" } },
      { key: "source", value: { text: "value" }, sub: { ref: { moduleSlug: P, metricKey: "estimate_year" }, year: true, fmt: "agri.fmt.estimate" } },
    ],
  },
  cards: [
    {
      key: "topCrops",
      emoji: "🌾",
      href: "/india/agriculture-production",
      bars: true,
      rows: [
        { key: "up", rank: 1, state: "uttar-pradesh", note: { text: "wheat" }, value: { ref: { moduleSlug: P, metricKey: "top_state_up_wheat_mt" }, fmt: "fmt.mt" } },
        { key: "mp", rank: 2, state: "madhya-pradesh", note: { text: "wheat" }, value: { ref: { moduleSlug: P, metricKey: "top_state_mp_wheat_mt" }, fmt: "fmt.mt" } },
        { key: "pb", rank: 3, state: "punjab", note: { text: "wheat" }, value: { ref: { moduleSlug: P, metricKey: "top_state_pb_wheat_mt" }, fmt: "fmt.mt" } },
        // Ranks are within each crop (DA&FW final estimates 2024-25): wheat UP, MP, Punjab; rice UP, Telangana,
        // West Bengal (3rd). Andhra Pradesh is not in the official top three for rice, so its row was removed.
        { key: "wb", rank: 3, state: "west-bengal", note: { text: "rice" }, value: { ref: { moduleSlug: P, metricKey: "top_state_wb_rice_mt" }, fmt: "fmt.mt" } },
      ],
    },
    {
      key: "schemes",
      emoji: "🌱",
      href: "/india/agriculture-pmkisan",
      rows: [
        { key: "pmkisan", value: { ref: { moduleSlug: K, metricKey: "farmers_count_crore" }, fmt: "agri.fmt.crFarmers" } },
        { key: "pmfby", value: { ref: { moduleSlug: K, metricKey: "pmfby_insured_crore" }, decimals: 1, fmt: "agri.fmt.crInsured" } },
        { key: "kcc", value: { ref: { moduleSlug: K, metricKey: "kcc_active_cards_crore" }, fmt: "agri.fmt.crCards" } },
        { key: "soilHealth", value: { ref: { moduleSlug: K, metricKey: "soil_health_cards_crore" }, fmt: "agri.fmt.crCards" } },
      ],
    },
  ],
};

export function allAgricultureLivestockRefs(): MetricRef[] {
  return specRefs(AGRI_SPEC);
}
