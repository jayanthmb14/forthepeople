/**
 * "Wildlife and forests" band (Section 04) as a BandSpec.
 *
 * Only three modules, so the directory is a static list. Numbers come from
 * IndiaIndicator; words from page_india "wildlife.*". The report edition
 * and year cells read the stored isfr_edition / isfr_year rows instead of
 * the old typed "ISFR-18" / "2023" strings.
 */

import { indicatorKey, specRefs, type BandSpec, type MetricRef } from "../band-spec";

export { indicatorKey };
export type { MetricRef };

const F = "wildlife-forests";
const T = "wildlife-tigers";

export const WILDLIFE_SPEC: BandSpec = {
  group: "wildlife",
  slug: "wildlife-forests",
  tintId: "wildlife",
  titleId: "wildlife-forests-title",
  watermarkClass: "branchWatermark",
  dotsAccent: "#3B6D11",
  staticDirectory: true,
  directory: [
    { moduleSlug: F, emoji: "🌳", featured: true, value: { ref: { moduleSlug: F, metricKey: "forest_cover_pct" }, decimals: 1, fmt: "fmt.pct" } },
    { moduleSlug: T, emoji: "🐅", value: { ref: { moduleSlug: T, metricKey: "tiger_population_total" }, fmt: "wildlife.fmt.tigers" } },
    { moduleSlug: "wildlife-protected-areas", emoji: "🦁", value: { ref: { moduleSlug: "wildlife-protected-areas", metricKey: "parks_count_total" }, fmt: "fmt.plus" } },
  ],
  featured: {
    moduleSlug: F,
    emoji: "🌳",
    headline: { ref: { moduleSlug: F, metricKey: "forest_cover_pct" }, decimals: 1, fmt: "fmt.pct" },
    growth: { ref: { moduleSlug: F, metricKey: "forest_cover_change_2021" }, fmt: "wildlife.growth" },
    callout: { value: { ref: { moduleSlug: F, metricKey: "forest_cover_target_pct" }, fmt: "fmt.pct" }, sub: "calloutSub" },
    cells: [
      {
        key: "forest",
        value: { ref: { moduleSlug: F, metricKey: "forest_cover_pct" }, decimals: 1, fmt: "fmt.pct" },
        sub: { ref: { moduleSlug: F, metricKey: "forest_cover_lakh_km2" }, decimals: 2, fmt: "wildlife.fmt.lakhKm2" },
      },
      {
        key: "tree",
        value: { ref: { moduleSlug: F, metricKey: "tree_cover_pct" }, decimals: 2, fmt: "fmt.pct" },
        sub: { text: "sub" },
      },
      {
        key: "topState",
        value: { text: "value" },
        sub: { ref: { moduleSlug: F, metricKey: "top_state_pct" }, decimals: 1, fmt: "wildlife.fmt.shareOfForest" },
      },
      {
        key: "report",
        value: { ref: { moduleSlug: F, metricKey: "isfr_edition" }, fmt: "wildlife.fmt.edition" },
        sub: { ref: { moduleSlug: F, metricKey: "isfr_year" }, year: true, fmt: "wildlife.fmt.everyTwo" },
      },
    ],
  },
  cards: [
    {
      key: "topStates",
      emoji: "🌿",
      href: "/india/wildlife-forests",
      bars: true,
      rows: [
        { key: "mizoram", rank: 1, state: "mizoram", value: { ref: { moduleSlug: F, metricKey: "top_state_mizoram_pct" }, decimals: 1, fmt: "fmt.pct" } },
        { key: "arunachal", rank: 2, state: "arunachal-pradesh", value: { ref: { moduleSlug: F, metricKey: "top_state_arunachal_pct" }, decimals: 1, fmt: "fmt.pct" } },
        { key: "meghalaya", rank: 3, state: "meghalaya", value: { ref: { moduleSlug: F, metricKey: "top_state_meghalaya_pct" }, decimals: 1, fmt: "fmt.pct" } },
        { key: "manipur", rank: 4, state: "manipur", value: { ref: { moduleSlug: F, metricKey: "top_state_manipur_pct" }, decimals: 1, fmt: "fmt.pct" } },
        { key: "nagaland", rank: 5, state: "nagaland", value: { ref: { moduleSlug: F, metricKey: "top_state_nagaland_pct" }, decimals: 1, fmt: "fmt.pct" } },
      ],
    },
    {
      key: "biodiversity",
      emoji: "🐾",
      href: "/india/wildlife-tigers",
      rows: [
        { key: "tigers", emoji: "🐅", value: { ref: { moduleSlug: T, metricKey: "tiger_population_total" } } },
        { key: "elephants", emoji: "🐘", value: { ref: { moduleSlug: F, metricKey: "elephants_count" } } },
        { key: "rhinos", emoji: "🦏", value: { ref: { moduleSlug: F, metricKey: "rhinos_count" } } },
        { key: "reserves", emoji: "🏞️", value: { ref: { moduleSlug: T, metricKey: "tiger_reserves_count" } } },
      ],
    },
  ],
};

export function allWildlifeForestsRefs(): MetricRef[] {
  return specRefs(WILDLIFE_SPEC);
}
