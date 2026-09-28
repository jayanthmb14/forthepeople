/**
 * "Infrastructure" band (Section 07) as a BandSpec.
 * Numbers from IndiaIndicator; words from page_india "infra.*". (The old
 * "Top state: MH, wheat NH leader" cell was a copy-paste slip; it now
 * reads "Maharashtra, most national highways".)
 */

import { indicatorKey, specRefs, type BandSpec, type MetricRef } from "../band-spec";

export { indicatorKey };
export type { MetricRef };

const R = "infra-roads";

export const INFRA_SPEC: BandSpec = {
  group: "infra",
  slug: "infrastructure",
  tintId: "infra",
  titleId: "infrastructure-title",
  watermarkClass: "buildingWatermark",
  dotsAccent: "#5F5E5A",
  directory: [
    { moduleSlug: R, featured: true, value: { ref: { moduleSlug: R, metricKey: "nh_length_km" }, fmt: "fmt.km" } },
    { moduleSlug: "infra-railways", value: { ref: { moduleSlug: "infra-railways", metricKey: "route_km" }, fmt: "fmt.km" } },
    { moduleSlug: "infra-aviation", value: { ref: { moduleSlug: "infra-aviation", metricKey: "airports_operational_count" }, fmt: "infra.fmt.airports" } },
    { moduleSlug: "infra-telecom", value: { ref: { moduleSlug: "infra-telecom", metricKey: "subscribers_crore" }, fmt: "fmt.crore" } },
    { moduleSlug: "infra-ports", value: { ref: { moduleSlug: "infra-ports", metricKey: "major_ports_count" }, fmt: "infra.fmt.majorPorts" } },
    { moduleSlug: "infra-smart-cities", value: { ref: { moduleSlug: "infra-smart-cities", metricKey: "cities_count" }, fmt: "infra.fmt.cities" } },
  ],
  featured: {
    moduleSlug: R,
    headline: { ref: { moduleSlug: R, metricKey: "nh_length_km" } },
    growth: { ref: { moduleSlug: R, metricKey: "nh_change_yoy_km" }, fmt: "infra.growth" },
    callout: { value: { ref: { moduleSlug: R, metricKey: "nh_target_km_2027" }, fmt: "fmt.km" }, sub: "calloutSub" },
    cells: [
      { key: "nh", value: { ref: { moduleSlug: R, metricKey: "nh_length_km" } }, sub: { text: "sub" } },
      { key: "expressway", value: { ref: { moduleSlug: R, metricKey: "expressway_km" } }, sub: { text: "sub" } },
      { key: "topState", value: { text: "value" }, sub: { text: "sub" } },
      { key: "year", value: { ref: { moduleSlug: R, metricKey: "data_year" }, year: true }, sub: { text: "sub" } },
    ],
  },
  cards: [
    {
      key: "topStates",
      glyph: "medal",
      href: "/india/infra-roads",
      bars: true,
      rows: [
        { key: "mh", rank: 1, state: "maharashtra", value: { ref: { moduleSlug: R, metricKey: "top_state_mh_nh_km" }, fmt: "fmt.km" } },
        { key: "up", rank: 2, state: "uttar-pradesh", value: { ref: { moduleSlug: R, metricKey: "top_state_up_nh_km" }, fmt: "fmt.km" } },
        { key: "rj", rank: 3, state: "rajasthan", value: { ref: { moduleSlug: R, metricKey: "top_state_rj_nh_km" }, fmt: "fmt.km" } },
        { key: "mp", rank: 4, state: "madhya-pradesh", value: { ref: { moduleSlug: R, metricKey: "top_state_mp_nh_km" }, fmt: "fmt.km" } },
        { key: "ka", rank: 5, state: "karnataka", value: { ref: { moduleSlug: R, metricKey: "top_state_ka_nh_km" }, fmt: "fmt.km" } },
      ],
    },
    {
      key: "flagship",
      glyph: "construction",
      href: "/india/category/infrastructure",
      rows: [
        { key: "bharatmala", value: { ref: { moduleSlug: R, metricKey: "bharatmala_nh_km" }, fmt: "infra.fmt.kmNh" } },
        { key: "sagarmala", value: { ref: { moduleSlug: R, metricKey: "sagarmala_ports_count" }, fmt: "infra.fmt.majorPorts" } },
        { key: "udan", value: { ref: { moduleSlug: R, metricKey: "udan_airports_count" }, fmt: "infra.fmt.airportsPlus" } },
        { key: "gatishakti", value: { ref: { moduleSlug: R, metricKey: "gatishakti_projects_count" }, fmt: "infra.fmt.projectsPlus" } },
      ],
    },
  ],
};

export function allInfrastructureRefs(): MetricRef[] {
  return specRefs(INFRA_SPEC);
}
