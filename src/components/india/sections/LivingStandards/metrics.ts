/**
 * "Living standards" band (Section 03) as a BandSpec.
 *
 * Only (moduleSlug, metricKey) pairs and message keys live here; numbers
 * come from IndiaIndicator and words from page_india "living.*".
 */

import { indicatorKey, specRefs, type BandSpec, type MetricRef } from "../band-spec";

export { indicatorKey };
export type { MetricRef };

const H = "health-overview";

export const LIVING_SPEC: BandSpec = {
  group: "living",
  slug: "living-standards",
  tintId: "living",
  titleId: "living-standards-title",
  watermarkClass: "crossWatermark",
  dotsAccent: "#0F6E56",
  directory: [
    { moduleSlug: H, emoji: "💗", featured: true, value: { ref: { moduleSlug: H, metricKey: "life_expectancy_years" }, decimals: 1, fmt: "living.fmt.yrs" } },
    { moduleSlug: "health-pmjay", emoji: "🏥", value: { ref: { moduleSlug: "health-pmjay", metricKey: "cards_issued_crore" }, decimals: 1, fmt: "living.fmt.crCards" } },
    { moduleSlug: "health-immunisation", emoji: "💉", value: { ref: { moduleSlug: "health-immunisation", metricKey: "doses_administered_crore" }, decimals: 1, fmt: "fmt.crore" } },
    { moduleSlug: "education-schools", emoji: "🏫", value: { ref: { moduleSlug: "education-schools", metricKey: "schools_total_lakh" }, decimals: 1, fmt: "living.fmt.lakhSchools" } },
    { moduleSlug: "education-higher", emoji: "🎓", value: { ref: { moduleSlug: "education-higher", metricKey: "higher_ed_enrolment_crore" }, decimals: 1, fmt: "living.fmt.crEnrolled" } },
    { moduleSlug: "education-skills", emoji: "🛠", value: { ref: { moduleSlug: "education-skills", metricKey: "pmkvy_trained_crore" }, decimals: 1, fmt: "living.fmt.crTrained" } },
  ],
  featured: {
    moduleSlug: H,
    emoji: "💗",
    headline: { ref: { moduleSlug: H, metricKey: "life_expectancy_years" }, decimals: 1 },
    growth: { ref: { moduleSlug: H, metricKey: "life_expectancy_change_1990" }, fmt: "living.growth" },
    callout: { value: { ref: { moduleSlug: H, metricKey: "life_expectancy_target_2030" }, fmt: "living.fmt.yrs" }, sub: "calloutSub" },
    cells: [
      { key: "lifeExp", value: { ref: { moduleSlug: H, metricKey: "life_expectancy_years" }, decimals: 1 }, sub: { text: "sub" } },
      { key: "imr", value: { ref: { moduleSlug: H, metricKey: "infant_mortality_rate" }, decimals: 1 }, sub: { text: "sub" } },
      { key: "doctors", value: { ref: { moduleSlug: H, metricKey: "doctors_per_1000" }, decimals: 2 }, sub: { text: "sub" } },
      { key: "uwin", value: { ref: { moduleSlug: "health-immunisation", metricKey: "doses_administered_crore" }, decimals: 1 }, sub: { text: "sub" } },
    ],
  },
  cards: [
    {
      key: "leaders",
      emoji: "🏅",
      href: "/india/health-overview",
      rows: [
        { key: "imr", arrow: "down", note: { state: "kerala" }, value: { ref: { moduleSlug: H, metricKey: "state_leader_kerala_imr" }, fmt: "living.fmt.perK" } },
        { key: "lifeExp", arrow: "up", note: { state: "kerala" }, value: { ref: { moduleSlug: H, metricKey: "state_leader_kerala_life_exp" }, decimals: 1, fmt: "living.fmt.yrs" } },
        { key: "doctors", arrow: "up", note: { state: "delhi" }, value: { ref: { moduleSlug: H, metricKey: "state_leader_delhi_doctors" }, decimals: 2, fmt: "living.fmt.perK" } },
        { key: "vaccination", arrow: "up", note: { state: "manipur" }, value: { ref: { moduleSlug: H, metricKey: "state_leader_manipur_imm_cov" }, fmt: "fmt.pct" } },
        { key: "hospitals", arrow: "up", note: { state: "tamil-nadu" }, value: { ref: { moduleSlug: H, metricKey: "state_leader_tn_hosp_per_1000" }, decimals: 2, fmt: "living.fmt.perK" } },
      ],
    },
    {
      key: "schemes",
      emoji: "🩺",
      href: "/india/health-pmjay",
      rows: [
        { key: "ayushman", value: { ref: { moduleSlug: "health-pmjay", metricKey: "cards_issued_crore" }, fmt: "living.fmt.crCards" } },
        { key: "pmjayHospitals", value: { ref: { moduleSlug: "health-pmjay", metricKey: "empanelled_hospitals_thousands" }, fmt: "living.fmt.kPlus" } },
        { key: "uwin", value: { ref: { moduleSlug: "health-immunisation", metricKey: "doses_administered_crore" }, decimals: 1, fmt: "fmt.crore" } },
        { key: "pmkvy", value: { ref: { moduleSlug: "education-skills", metricKey: "pmkvy_trained_crore" }, decimals: 1, fmt: "fmt.crore" } },
      ],
    },
  ],
};

export function allLivingStandardsRefs(): MetricRef[] {
  return specRefs(LIVING_SPEC);
}
