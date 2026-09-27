/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Weather codes → one small set of "kinds" (pure, no DB, no React)
//
// Every weather source speaks its own code:
//   - Open-Meteo sends WMO weather codes (0 = clear … 99 = thunderstorm
//     with hail), https://open-meteo.com/en/docs → "WMO Weather
//     interpretation codes".
//   - OpenWeather sends condition ids (200–232 thunder … 800 clear,
//     804 overcast), https://openweathermap.org/weather-conditions.
//   - Stored readings carry a short English description
//     ("scattered clouds", "moderate rain").
// All three map to one WeatherKind. The page draws one picture per kind
// (src/components/weather/WeatherArt.tsx) and has one plain word per kind
// in en / hi / kn (page_weather → forecast.kind.*).
// ═══════════════════════════════════════════════════════════

export type WeatherKind =
  | "clear"
  | "mostlyClear"
  | "partly"
  | "cloudy"
  | "fog"
  | "haze"
  | "drizzle"
  | "rain"
  | "showers"
  | "heavyRain"
  | "thunder"
  | "snow"
  | "unknown";

export const WEATHER_KINDS: readonly WeatherKind[] = [
  "clear",
  "mostlyClear",
  "partly",
  "cloudy",
  "fog",
  "haze",
  "drizzle",
  "rain",
  "showers",
  "heavyRain",
  "thunder",
  "snow",
  "unknown",
];

/**
 * How much a kind matters to someone planning their day. Used to pick one
 * picture for a day built from several 3-hour slots: a day with one
 * thunderstorm slot is a "thunder" day, not a "sunny" one.
 */
export const KIND_SEVERITY: Record<WeatherKind, number> = {
  unknown: -1,
  clear: 0,
  mostlyClear: 1,
  partly: 2,
  cloudy: 3,
  haze: 4,
  fog: 5,
  drizzle: 6,
  showers: 7,
  rain: 8,
  snow: 8,
  heavyRain: 9,
  thunder: 10,
};

/** Kinds that mean "wet": the rain-drop pictures and the umbrella tip. */
export const WET_KINDS: ReadonlySet<WeatherKind> = new Set<WeatherKind>(["drizzle", "rain", "showers", "heavyRain", "thunder", "snow"]);

/** WMO weather code (Open-Meteo `weather_code`) → kind. */
export function kindFromWmo(code: number | null | undefined): WeatherKind {
  if (code === null || code === undefined || !Number.isFinite(code)) return "unknown";
  if (code === 0) return "clear";
  if (code === 1) return "mostlyClear";
  if (code === 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code === 61 || code === 63 || code === 66) return "rain";
  if (code === 65 || code === 67) return "heavyRain";
  if (code >= 71 && code <= 77) return "snow";
  if (code === 80 || code === 81) return "showers";
  if (code === 82) return "heavyRain";
  if (code === 85 || code === 86) return "snow";
  if (code === 95 || code === 96 || code === 99) return "thunder";
  return "unknown";
}

/** OpenWeather condition id (`weather[0].id`) → kind. */
export function kindFromOwm(id: number | null | undefined): WeatherKind {
  if (id === null || id === undefined || !Number.isFinite(id)) return "unknown";
  if (id >= 200 && id < 300) return "thunder";
  if (id >= 300 && id < 400) return "drizzle";
  if (id === 502 || id === 503 || id === 504 || id === 522) return "heavyRain";
  if (id === 520 || id === 521 || id === 531) return "showers";
  if (id >= 500 && id < 600) return "rain";
  if (id >= 600 && id < 700) return "snow";
  if (id === 701 || id === 741) return "fog";
  if (id === 771 || id === 781) return "thunder"; // squall, tornado
  if (id >= 700 && id < 800) return "haze"; // smoke, haze, dust, sand, ash
  if (id === 800) return "clear";
  if (id === 801) return "mostlyClear";
  if (id === 802) return "partly";
  if (id === 803 || id === 804) return "cloudy";
  return "unknown";
}

/**
 * A stored reading's English description ("scattered clouds", "moderate
 * rain", "clear sky") → kind. Order matters: "thunderstorm with rain" is
 * thunder, "heavy intensity rain" is heavy rain, "light rain" is rain.
 */
export function kindFromText(text: string | null | undefined): WeatherKind {
  const c = (text ?? "").toLowerCase().trim();
  if (!c) return "unknown";
  if (/thunder|storm|squall|tornado/.test(c)) return "thunder";
  if (/drizzle/.test(c)) return "drizzle";
  if (/snow|sleet/.test(c)) return "snow";
  if (/(heavy|extreme|violent|very heavy).*rain|rain.*(heavy|extreme|violent)/.test(c)) return "heavyRain";
  if (/shower/.test(c)) return "showers";
  if (/rain/.test(c)) return "rain";
  if (/mist|fog/.test(c)) return "fog";
  if (/haze|smoke|dust|sand|ash/.test(c)) return "haze";
  if (/overcast|broken/.test(c)) return "cloudy";
  if (/scattered|partly/.test(c)) return "partly";
  if (/few clouds|mainly clear|mostly clear|mostly sunny/.test(c)) return "mostlyClear";
  if (/cloud/.test(c)) return "cloudy";
  if (/clear|sun/.test(c)) return "clear";
  return "unknown";
}

/** The kind that matters most among several (see KIND_SEVERITY). */
export function worstKind(kinds: readonly WeatherKind[]): WeatherKind {
  let out: WeatherKind = "unknown";
  for (const k of kinds) if (KIND_SEVERITY[k] > KIND_SEVERITY[out]) out = k;
  return out;
}

/** True for kinds whose picture changes at night (sun → moon). */
export function hasNightPicture(kind: WeatherKind): boolean {
  return kind === "clear" || kind === "mostlyClear" || kind === "partly";
}
