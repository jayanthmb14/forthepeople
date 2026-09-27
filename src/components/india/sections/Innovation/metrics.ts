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
    { moduleSlug: S, emoji: "🚀", featured: true, value: { ref: { moduleSlug: S, metricKey: "dpiit_recognised_lakh" }, decimals: 1, fmt: "fmt.lakh" } },
    { moduleSlug: "science-isro", emoji: "🛰", value: { ref: { moduleSlug: "science-isro", metricKey: "satellites_launched_count" }, fmt: "innov.fmt.satellites" } },
    { moduleSlug: D, emoji: "📱", value: { ref: { moduleSlug: D, metricKey: "upi_txn_per_month_billion" }, fmt: "innov.fmt.upi" } },
    { moduleSlug: "science-rd", emoji: "🔬", value: { ref: { moduleSlug: "science-rd", metricKey: "rd_pct_gdp" }, decimals: 2, fmt: "fmt.pct" } },
    { moduleSlug: "trade-overview", emoji: "📦", value: { ref: { moduleSlug: "trade-overview", metricKey: "exports_annual_lakh_cr" }, fmt: "fmt.inrLakhCr" } },
    { moduleSlug: "trade-fdi", emoji: "💰", value: { ref: { moduleSlug: "trade-fdi", metricKey: "fdi_equity_inflow_billion_usd" }, fmt: "fmt.usdB" } },
    { moduleSlug: "trade-diaspora", emoji: "🌐", value: { ref: { moduleSlug: "trade-diaspora", metricKey: "remittances_annual_billion_usd" }, fmt: "fmt.usdB" } },
  ],
  featured: {
    moduleSlug: S,
    emoji: "🚀",
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
      emoji: "🚀",
      href: "/india/science-startups",
      bars: true,
      rows: [
        { key: "ka", rank: 1, state: "karnataka", note: { text: "bengaluru" }, value: { ref: { moduleSlug: S, metricKey: "top_state_ka_startups_thousand" }, fmt: "innov.fmt.thousand" } },
        { key: "mh", rank: 2, state: "maharashtra", note: { text: "mumbai" }, value: { ref: { moduleSlug: S, metricKey: "top_state_mh_startups_thousand" }, fmt: "innov.fmt.thousand" } },
        { key: "dl", rank: 3, state: "delhi", value: { ref: { moduleSlug: S, metricKey: "top_state_dl_startups_thousand" }, fmt: "innov.fmt.thousand" } },
        { key: "tn", rank: 4, state: "tamil-nadu", note: { text: "chennai" }, value: { ref: { moduleSlug: S, metricKey: "top_state_tn_startups_thousand" }, fmt: "innov.fmt.thousand" } },
        { key: "tg", rank: 5, state: "telangana", note: { text: "hyderabad" }, value: { ref: { moduleSlug: S, metricKey: "top_state_tg_startups_thousand" }, fmt: "innov.fmt.thousand" } },
      ],
    },
    {
      key: "digital",
      emoji: "🔌",
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
