/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// The "Where the data comes from" list on the About page. It must name the
// sources our data really comes from, and only those:
//   - read by a scheduled collector (vercel.json crons): AGMARKNET (crops),
//     the Karnataka Water Resources Department (dams), OpenWeatherMap and
//     Open-Meteo (weather, forecast), NJDG (courts), the JJM dashboard,
//     UDISE+ (schools), NREGASoft (MGNREGA), NDMA SACHET (alerts), the state
//     GePNIC e-procurement portals (tenders), PPAC / BPCL (fuel), Google News;
//   - read live when a page asks: IBJA and Yahoo Finance (/prices);
//   - typed in by hand with the source linked: ECI results, myScheme.
// Sept 2026 review: removed eGramSwaraj / PFMS (nothing reads them; budgets
// have no collector and panchayat figures come from NREGASoft) and
// PMAY-G / PMAY-U (no collector). Earlier removals: India-WRIS, IMD, the
// National Scholarship Portal. Names are proper nouns; each `key` has a
// one-line description `src_<key>` in page_about.json (en, hi, kn).

export interface AboutSource {
  name: string;
  key: string;
  emoji: string;
  /** The source's own site; omitted when the name covers several portals. */
  url?: string;
}

export const ABOUT_DATA_SOURCES: AboutSource[] = [
  { name: "AGMARKNET", key: "agmarknet", emoji: "🌾", url: "https://agmarknet.gov.in" },
  { name: "Karnataka Water Resources Department", key: "kwrd", emoji: "💧", url: "https://water.karnataka.gov.in" },
  { name: "OpenWeatherMap", key: "owm", emoji: "🌦️", url: "https://openweathermap.org" },
  { name: "Open-Meteo", key: "openmeteo", emoji: "🌤️", url: "https://open-meteo.com" },
  { name: "NDMA SACHET", key: "sachet", emoji: "🚨", url: "https://sachet.ndma.gov.in" },
  { name: "NJDG", key: "njdg", emoji: "⚖️", url: "https://njdg.ecourts.gov.in" },
  { name: "Jal Jeevan Mission dashboard", key: "jjm", emoji: "🚰", url: "https://ejalshakti.gov.in/jjmreport/JJMIndia.aspx" },
  { name: "UDISE+", key: "udise", emoji: "🎓", url: "https://udiseplus.gov.in" },
  { name: "NREGASoft (MGNREGA)", key: "nrega", emoji: "🏘️", url: "https://nrega.dord.gov.in" },
  { name: "GePNIC e-procurement portals", key: "tenders", emoji: "📑" },
  { name: "Election Commission of India", key: "eci", emoji: "🗳️", url: "https://eci.gov.in" },
  { name: "myScheme", key: "myscheme", emoji: "🎒", url: "https://www.myscheme.gov.in" },
  { name: "IBJA", key: "ibja", emoji: "🪙", url: "https://www.ibjarates.com" },
  { name: "PPAC / BPCL", key: "fuel", emoji: "⛽", url: "https://ppac.gov.in" },
  { name: "Yahoo Finance", key: "yahoo", emoji: "📈", url: "https://finance.yahoo.com" },
  { name: "Google News", key: "news", emoji: "📰", url: "https://news.google.com" },
];
