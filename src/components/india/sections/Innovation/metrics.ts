/**
 * "Innovation and industry" band (Section 09) as a BandSpec.
 * Numbers from IndiaIndicator; words from page_india "innov.*". The old
 * "Top sector: IT" cell had no source; it now shows the startups added in
 * a year (a stored row).
 */

import { indicatorKey, specRefs, type BandSpec, type MetricRef } from "../band-spec";

export { indicatorKey };
export type { MetricRef };

const S = "science-startups";
const D = "science-digital";

export const INNOV_SPEC: BandSpec = {
  group: "innov",
  slug: "innovation",
  tintId: "innovation",
  titleId: "innovation-title",
  watermarkClass: "rocketWatermark",
  dotsAccent: "#993C1D",
  directory: [
    { moduleSlug: S, featured: true, value: { ref: { moduleSlug: S, metricKey: "dpiit_recognised_lakh" }, decimals: 1, fmt: "fmt.lakh" } },
    { moduleSlug: "science-isro", value: { ref: { moduleSlug: "science-isro", metricKey: "satellites_launched_count" }, fmt: "innov.fmt.satellites" } },
    { moduleSlug: D, value: { ref: { moduleSlug: D, metricKey: "upi_txn_per_month_billion" }, fmt: "innov.fmt.upi" } },
    { moduleSlug: "science-rd", value: { ref: { moduleSlug: "science-rd", metricKey: "rd_pct_gdp" }, decimals: 2, fmt: "fmt.pct" } },
    { moduleSlug: "trade-overview", value: { ref: { moduleSlug: "trade-overview", metricKey: "exports_annual_lakh_cr" }, fmt: "fmt.inrLakhCr" } },
    { moduleSlug: "trade-fdi", value: { ref: { moduleSlug: "trade-fdi", metricKey: "fdi_equity_inflow_billion_usd" }, fmt: "fmt.usdB" } },
    { moduleSlug: "trade-diaspora", value: { ref: { moduleSlug: "trade-diaspora", metricKey: "remittances_annual_billion_usd" }, fmt: "fmt.usdB" } },
  ],
  featured: {
    moduleSlug: S,
    headline: { ref: { moduleSlug: S, metricKey: "dpiit_recognised_lakh" }, decimals: 1 },
    growth: { ref: { moduleSlug: S, metricKey: "change_yoy_lakh" }, decimals: 1, fmt: "innov.growth" },
    callout: { label: "calloutLabel", value: { ref: { moduleSlug: S, metricKey: "unicorns_count" }, fmt: "fmt.plus" }, sub: "calloutSub" },
    cells: [
      { key: "dpiit", value: { ref: { moduleSlug: S, metricKey: "dpiit_recognised_lakh" }, decimals: 1 }, sub: { text: "sub" } },
      { key: "unicorns", value: { ref: { moduleSlug: S, metricKey: "unicorns_count" } }, sub: { text: "sub" } },
      { key: "added", value: { ref: { moduleSlug: S, metricKey: "change_yoy_lakh" }, decimals: 1 }, sub: { text: "sub" } },
      { key: "source", value: { text: "value" }, sub: { text: "sub" } },
    ],
  },
  cards: [
    {
      key: "hubs",
      glyph: "medal",
      href: "/india/science-startups",
      bars: true,
      rows: [
        // DPIIT-recognised startups by state (PIB, 17 Apr 2026): Maharashtra 38.7k (#1), Karnataka 22.6k (#2),
        // Delhi 21.1k (#4), Tamil Nadu 14.8k (rank not stated), Telangana 12.5k (#7) — docs/DATA-FIXES-2026-09.md.
        { key: "mh", rank: 1, state: "maharashtra", note: { text: "mumbai" }, value: { ref: { moduleSlug: S, metricKey: "top_state_mh_startups_thousand" }, fmt: "innov.fmt.thousand" } },
        { key: "ka", rank: 2, state: "karnataka", note: { text: "bengaluru" }, value: { ref: { moduleSlug: S, metricKey: "top_state_ka_startups_thousand" }, fmt: "innov.fmt.thousand" } },
        { key: "dl", rank: 4, state: "delhi", value: { ref: { moduleSlug: S, metricKey: "top_state_dl_startups_thousand" }, fmt: "innov.fmt.thousand" } },
        { key: "tn", state: "tamil-nadu", note: { text: "chennai" }, value: { ref: { moduleSlug: S, metricKey: "top_state_tn_startups_thousand" }, fmt: "innov.fmt.thousand" } },
        { key: "tg", rank: 7, state: "telangana", note: { text: "hyderabad" }, value: { ref: { moduleSlug: S, metricKey: "top_state_tg_startups_thousand" }, fmt: "innov.fmt.thousand" } },
      ],
    },
    {
      key: "digital",
      glyph: "phone",
      href: "/india/science-digital",
      rows: [
        { key: "upi", value: { ref: { moduleSlug: D, metricKey: "upi_txn_per_month_billion" }, fmt: "innov.fmt.upiRow" } },
        { key: "aadhaar", value: { ref: { moduleSlug: D, metricKey: "aadhaar_enrolled_crore" }, fmt: "fmt.crore" } },
        { key: "digilocker", value: { ref: { moduleSlug: D, metricKey: "digilocker_users_crore" }, fmt: "innov.fmt.crUsers" } },
        { key: "fastag", value: { ref: { moduleSlug: D, metricKey: "fastag_active_crore" }, fmt: "innov.fmt.crActive" } },
        { key: "isro", value: { ref: { moduleSlug: "science-isro", metricKey: "satellites_launched_count" }, fmt: "innov.fmt.launched" } },
      ],
    },
  ],
};

export function allInnovationRefs(): MetricRef[] {
  return specRefs(INNOV_SPEC);
}
