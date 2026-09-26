/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Rule-Based Insight Templates
// Zero Gemini calls — covers 80%+ of common data patterns
// ═══════════════════════════════════════════════════════════

export const INSIGHT_TEMPLATES = {
  water: {
    high: (dam: string, pct: number) =>
      `${dam} storage is healthy at ${pct}%. No irrigation concerns expected this season.`,
    medium: (dam: string, pct: number) =>
      `${dam} at ${pct}% capacity — moderate levels. Water conservation advisories may follow if inflow doesn't improve.`,
    low: (dam: string, pct: number) =>
      `⚠️ ${dam} critically low at ${pct}%. Irrigation rationing likely. Farmers should plan water usage carefully.`,
    none: () =>
      "Dam levels data is being refreshed. Check back shortly for current reservoir status.",
  },

  finance: {
    good: (dept: string, spentPct: number) =>
      `${dept} has utilised ${spentPct}% of allocated budget — on track for the fiscal year.`,
    warning: (dept: string, lapsedPct: number) =>
      `⚠️ ${dept} has ${lapsedPct}% funds lapsed (unspent). Citizens can file RTI to ask why.`,
    critical: (dept: string, lapsedAmt: string) =>
      `🔴 ${dept}: ₹${lapsedAmt} crore of public funds went unspent and lapsed. This money could have funded local projects.`,
    none: () =>
      "Budget utilisation data is being updated for the current fiscal year.",
  },

  crops: {
    rising: (crop: string, pct: number, price: number) =>
      `${crop} prices up ${pct.toFixed(1)}% this week at ₹${price.toLocaleString("en-IN")}/quintal. Farmers may benefit from selling now.`,
    falling: (crop: string, pct: number, price: number) =>
      `${crop} prices down ${pct.toFixed(1)}% to ₹${price.toLocaleString("en-IN")}/quintal. Consider holding stock if storage is available.`,
    stable: (crop: string, price: number) =>
      `${crop} prices stable around ₹${price.toLocaleString("en-IN")}/quintal — near the MSP support level.`,
    none: () =>
      "Crop price data is refreshing from AGMARKNET. Usually updates within 15 minutes.",
  },

  weather: {
    normal: (district: string, temp: number) =>
      `${district}: ${temp}°C — typical for this time of year. No extreme weather advisories active.`,
    hot: (district: string, temp: number) =>
      `🌡️ ${district}: ${temp}°C — above normal. Stay hydrated, avoid outdoor work between 11 AM and 3 PM.`,
    cold: (district: string, temp: number) =>
      `❄️ ${district}: ${temp}°C — cooler than usual. Light frost risk for sensitive crops tonight.`,
    rain: (district: string, rainfall: number) =>
      `🌧️ ${district}: ${rainfall}mm rainfall recorded. Check dam levels and local alert advisories.`,
    none: () =>
      "Weather data is updating. Powered by IMD observations.",
  },

  schools: {
    good: (district: string, passPct: number) =>
      `${district} schools averaged ${passPct.toFixed(1)}% pass rate — above state average.`,
    concern: (district: string, passPct: number, stateAvg: number) =>
      `${district} pass rate at ${passPct.toFixed(1)}% — below state average of ${stateAvg}%. Focused interventions needed.`,
    none: () =>
      "School performance data is updated annually from UDISE+ portal.",
  },

  leadership: {
    filled: (count: number, total: number) =>
      `${count} of ${total} official positions are filled in this district. Click any name for contact details.`,
    vacancies: (vacancies: number) =>
      `⚠️ ${vacancies} officer position${vacancies > 1 ? "s are" : " is"} currently vacant. RTI can be filed to know the reason.`,
    none: () =>
      "Leadership data is sourced from official government notifications.",
  },

  infrastructure: {
    onTrack: (count: number) =>
      `${count} infrastructure project${count > 1 ? "s are" : " is"} currently on track for timely completion.`,
    delayed: (count: number) =>
      `⚠️ ${count} project${count > 1 ? "s are" : " is"} behind schedule. Delays affect public funds utilisation.`,
    none: () =>
      "Infrastructure project data is sourced from PMIS and district reports.",
  },

  elections: {
    recent: (year: number, turnout: number) =>
      `${year} elections saw ${turnout.toFixed(1)}% voter turnout — ${turnout > 70 ? "strong citizen participation" : "below average participation"}.`,
    none: () =>
      "Election data is sourced from the Election Commission of India.",
  },

  jjm: {
    good: (district: string, pct: number) =>
      `${district}: ${pct.toFixed(1)}% households have tap water connections under Jal Jeevan Mission.`,
    poor: (district: string, pct: number) =>
      `${district}: Only ${pct.toFixed(1)}% households have tap connections. JJM work is in progress.`,
    none: () =>
      "Jal Jeevan Mission data is updated from eJalShakti portal.",
  },

  housing: {
    good: (schemeName: string, completionPct: number) =>
      `${schemeName}: ${completionPct.toFixed(1)}% of sanctioned houses are completed this year.`,
    slow: (schemeName: string, completionPct: number) =>
      `⚠️ ${schemeName}: Only ${completionPct.toFixed(1)}% completion rate. Many beneficiaries are still waiting.`,
    none: () =>
      "Housing scheme data is sourced from PMAY portal.",
  },
};

// ── Helper: pick insight level based on value ────────────────────────────────

export function damInsightLevel(storagePct: number): "high" | "medium" | "low" {
  if (storagePct >= 70) return "high";
  if (storagePct >= 35) return "medium";
  return "low";
}

export function weatherInsightLevel(temp: number, rainfall: number): "hot" | "cold" | "rain" | "normal" {
  if (rainfall > 5) return "rain";
  if (temp >= 38) return "hot";
  if (temp <= 12) return "cold";
  return "normal";
}

export function cropInsightLevel(changePct: number): "rising" | "falling" | "stable" {
  if (changePct > 3) return "rising";
  if (changePct < -3) return "falling";
  return "stable";
}
