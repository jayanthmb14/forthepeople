/**
 * "Culture and heritage" band (Section 10) as a BandSpec.
 * Numbers from IndiaIndicator (inscription years are shown as years, not
 * grouped numbers; the site count in the link reads its stored row instead
 * of a typed "43"); words from page_india "culture.*".
 */

import { indicatorKey, specRefs, type BandSpec, type MetricRef } from "../band-spec";

export { indicatorKey };
export type { MetricRef };

const H = "tourism-heritage";

export const CULTURE_SPEC: BandSpec = {
  group: "culture",
  slug: "culture",
  tintId: "culture",
  titleId: "culture-title",
  watermarkClass: "theaterWatermark",
  dotsAccent: "#993556",
  staticDirectory: true,
  directory: [
    { moduleSlug: H, emoji: "🏛", featured: true, value: { ref: { moduleSlug: H, metricKey: "asi_monuments_count" }, fmt: "culture.fmt.monuments" } },
    { moduleSlug: "tourism-overview", emoji: "✈", value: { ref: { moduleSlug: "tourism-overview", metricKey: "international_arrivals_lakh" }, fmt: "culture.fmt.lakhArrivals" } },
    { moduleSlug: "sports-olympics", emoji: "🏅", value: { ref: { moduleSlug: "sports-olympics", metricKey: "olympic_medals_total" }, fmt: "culture.fmt.medals" } },
    { moduleSlug: "sports-khelo-india", emoji: "🏆", value: { ref: { moduleSlug: "sports-khelo-india", metricKey: "khelo_athletes_thousand" }, fmt: "culture.fmt.kAthletes" } },
    { moduleSlug: "tourism-gi-tags", emoji: "🏷", value: { ref: { moduleSlug: "tourism-gi-tags", metricKey: "gi_tags_count" }, fmt: "fmt.plus" } },
  ],
  featured: {
    moduleSlug: H,
    emoji: "🏛",
    headline: { ref: { moduleSlug: H, metricKey: "asi_monuments_count" } },
    growth: { ref: { moduleSlug: H, metricKey: "unesco_sites_count" }, fmt: "culture.growth" },
    callout: { label: "calloutLabel", value: { ref: { moduleSlug: H, metricKey: "global_rank_unesco" }, rank: true }, sub: "calloutSub" },
    cells: [
      { key: "unesco", value: { ref: { moduleSlug: H, metricKey: "unesco_sites_count" } }, sub: { text: "sub" } },
      { key: "asi", value: { ref: { moduleSlug: H, metricKey: "asi_monuments_count" } }, sub: { text: "sub" } },
      { key: "tourism", value: { ref: { moduleSlug: "tourism-overview", metricKey: "international_arrivals_lakh" } }, sub: { text: "sub" } },
      { key: "source", value: { text: "value" }, sub: { text: "sub" } },
    ],
  },
  cards: [
    {
      key: "heritage",
      emoji: "🏛",
      href: "/india/tourism-heritage",
      linkValue: { ref: { moduleSlug: H, metricKey: "unesco_sites_count" } },
      rows: [
        { key: "taj", note: { state: "uttar-pradesh" }, value: { ref: { moduleSlug: H, metricKey: "unesco_taj_mahal_year" }, year: true } },
        { key: "ajanta", note: { state: "maharashtra" }, value: { ref: { moduleSlug: H, metricKey: "unesco_ajanta_year" }, year: true } },
        { key: "khajuraho", note: { state: "madhya-pradesh" }, value: { ref: { moduleSlug: H, metricKey: "unesco_khajuraho_year" }, year: true } },
        { key: "hampi", note: { state: "karnataka" }, value: { ref: { moduleSlug: H, metricKey: "unesco_hampi_year" }, year: true } },
        { key: "sundarbans", note: { state: "west-bengal" }, value: { ref: { moduleSlug: H, metricKey: "unesco_sundarbans_year" }, year: true } },
      ],
    },
    {
      key: "output",
      emoji: "🎭",
      href: "/india/category/culture",
      rows: [
        { key: "films", value: { ref: { moduleSlug: H, metricKey: "bollywood_films_per_year" }, fmt: "culture.fmt.filmsYear" } },
        { key: "giTags", value: { ref: { moduleSlug: "tourism-gi-tags", metricKey: "gi_tags_count" }, fmt: "fmt.plus" } },
        { key: "languages", value: { ref: { moduleSlug: H, metricKey: "scheduled_languages_count" }, fmt: "culture.fmt.scheduled" } },
        { key: "museums", value: { ref: { moduleSlug: H, metricKey: "museums_count" }, fmt: "fmt.plus" } },
      ],
    },
  ],
};

export function allCultureRefs(): MetricRef[] {
  return specRefs(CULTURE_SPEC);
}
