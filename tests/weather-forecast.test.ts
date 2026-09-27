/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Weather forecast mapping (src/lib/weather/codes.ts + forecast.ts):
// weather code → kind, units, parsers, the second-source check, and which
// "right now" the page shows. The fixtures are trimmed REAL replies for
// Mandya (12.524 N, 76.897 E) fetched on 27 Sep 2026 around 22:30 IST.
import { describe, expect, it } from "vitest";
import { KIND_SEVERITY, WEATHER_KINDS, hasNightPicture, kindFromOwm, kindFromText, kindFromWmo, worstKind } from "@/lib/weather/codes";
import {
  addDays,
  chooseCurrent,
  compareForecasts,
  compass,
  dayKind,
  dayOffset,
  dayTip,
  istDate,
  msToKmh,
  openMeteoForecastUrl,
  openWeatherForecastUrl,
  parseOpenMeteoForecast,
  parseOpenWeatherForecast,
  popToPercent,
  rainBand,
  todayOf,
  tomorrowOf,
  upcomingDays,
  weekRange,
  wholeDays,
  type ForecastDay,
  type SourceForecast,
} from "@/lib/weather/forecast";

const OPEN_METEO_MANDYA = {
  latitude: 12.54833,
  longitude: 76.898735,
  utc_offset_seconds: 19800,
  timezone: "Asia/Kolkata",
  current: {
    time: 1790526600,
    interval: 900,
    temperature_2m: 24.6,
    relative_humidity_2m: 71,
    apparent_temperature: 25.9,
    weather_code: 1,
    wind_speed_10m: 13.7,
    wind_direction_10m: 252,
    is_day: 0,
  },
  daily: {
    time: [1790447400, 1790533800, 1790620200],
    weather_code: [53, 55, 80],
    temperature_2m_max: [30.3, 31.2, 29.8],
    temperature_2m_min: [19.9, 21, 21],
    precipitation_probability_max: [65, 94, 82],
    precipitation_sum: [1.9, 5.6, 8.4],
    wind_speed_10m_max: [14, 15.1, 7],
    wind_direction_10m_dominant: [277, 244, 277],
    sunrise: [1790469693, 1790556093, 1790642493],
    sunset: [1790513114, 1790599473, 1790685831],
    uv_index_max: [9.05, 8.35, 7.35],
  },
};

// OpenWeather 5-day / 3-hour: the first 9 slots (one on 27 Sep IST, eight on 28 Sep IST).
const OPENWEATHER_MANDYA = {
  cod: "200",
  cnt: 9,
  list: [
    { dt: 1790532000, main: { temp: 27.38, temp_min: 27.38, temp_max: 27.38 }, weather: [{ id: 804 }], wind: { speed: 1.94, deg: 242 }, pop: 0 },
    { dt: 1790542800, main: { temp: 26.65, temp_min: 25.18, temp_max: 26.65 }, weather: [{ id: 803 }], wind: { speed: 1.83, deg: 248 }, pop: 0 },
    { dt: 1790553600, main: { temp: 24.69, temp_min: 23.35, temp_max: 24.69 }, weather: [{ id: 802 }], wind: { speed: 1.43, deg: 252 }, pop: 0 },
    { dt: 1790564400, main: { temp: 27.21, temp_min: 27.21, temp_max: 27.21 }, weather: [{ id: 800 }], wind: { speed: 1.37, deg: 336 }, pop: 0 },
    { dt: 1790575200, main: { temp: 31.81, temp_min: 31.81, temp_max: 31.81 }, weather: [{ id: 800 }], wind: { speed: 0.45, deg: 40 }, pop: 0 },
    { dt: 1790586000, main: { temp: 30.34, temp_min: 30.34, temp_max: 30.34 }, weather: [{ id: 803 }], wind: { speed: 1.89, deg: 307 }, pop: 0 },
    { dt: 1790596800, main: { temp: 29.07, temp_min: 29.07, temp_max: 29.07 }, weather: [{ id: 803 }], wind: { speed: 2.83, deg: 290 }, pop: 0 },
    { dt: 1790607600, main: { temp: 26.95, temp_min: 26.95, temp_max: 26.95 }, weather: [{ id: 500 }], wind: { speed: 2.46, deg: 201 }, pop: 0.34, rain: { "3h": 0.26 } },
    { dt: 1790618400, main: { temp: 24.52, temp_min: 24.52, temp_max: 24.52 }, weather: [{ id: 500 }], wind: { speed: 2.6, deg: 251 }, pop: 0.45, rain: { "3h": 0.28 } },
  ],
};

/** 27 Sep 2026, 22:30 IST. */
const NOW = Date.parse("2026-09-27T17:00:00Z");

function day(date: string, over: Partial<ForecastDay> = {}): ForecastDay {
  return {
    date,
    kind: "clear",
    code: 0,
    tMax: 30,
    tMin: 20,
    rainChance: 10,
    rainMm: 0,
    windMaxKmh: 10,
    windDir: "N",
    sunrise: null,
    sunset: null,
    uvMax: null,
    ...over,
  };
}

describe("weather codes → kind", () => {
  it("maps every WMO code group", () => {
    expect(kindFromWmo(0)).toBe("clear");
    expect(kindFromWmo(1)).toBe("mostlyClear");
    expect(kindFromWmo(2)).toBe("partly");
    expect(kindFromWmo(3)).toBe("cloudy");
    expect(kindFromWmo(45)).toBe("fog");
    expect(kindFromWmo(48)).toBe("fog");
    for (const c of [51, 53, 55, 56, 57]) expect(kindFromWmo(c)).toBe("drizzle");
    expect(kindFromWmo(61)).toBe("rain");
    expect(kindFromWmo(63)).toBe("rain");
    expect(kindFromWmo(65)).toBe("heavyRain");
    expect(kindFromWmo(80)).toBe("showers");
    expect(kindFromWmo(81)).toBe("showers");
    expect(kindFromWmo(82)).toBe("heavyRain");
    for (const c of [71, 73, 75, 77, 85, 86]) expect(kindFromWmo(c)).toBe("snow");
    for (const c of [95, 96, 99]) expect(kindFromWmo(c)).toBe("thunder");
  });

  it("treats missing or unknown WMO codes as unknown, never as clear", () => {
    expect(kindFromWmo(null)).toBe("unknown");
    expect(kindFromWmo(undefined)).toBe("unknown");
    expect(kindFromWmo(Number.NaN)).toBe("unknown");
    expect(kindFromWmo(4)).toBe("unknown");
    expect(kindFromWmo(100)).toBe("unknown");
  });

  it("maps OpenWeather condition ids", () => {
    expect(kindFromOwm(211)).toBe("thunder");
    expect(kindFromOwm(301)).toBe("drizzle");
    expect(kindFromOwm(500)).toBe("rain");
    expect(kindFromOwm(501)).toBe("rain");
    expect(kindFromOwm(502)).toBe("heavyRain");
    expect(kindFromOwm(522)).toBe("heavyRain");
    expect(kindFromOwm(521)).toBe("showers");
    expect(kindFromOwm(601)).toBe("snow");
    expect(kindFromOwm(701)).toBe("fog");
    expect(kindFromOwm(741)).toBe("fog");
    expect(kindFromOwm(721)).toBe("haze");
    expect(kindFromOwm(761)).toBe("haze");
    expect(kindFromOwm(781)).toBe("thunder");
    expect(kindFromOwm(800)).toBe("clear");
    expect(kindFromOwm(801)).toBe("mostlyClear");
    expect(kindFromOwm(802)).toBe("partly");
    expect(kindFromOwm(803)).toBe("cloudy");
    expect(kindFromOwm(804)).toBe("cloudy");
    expect(kindFromOwm(null)).toBe("unknown");
    expect(kindFromOwm(999)).toBe("unknown");
  });

  it("reads stored descriptions from both collectors", () => {
    // OpenWeather descriptions
    expect(kindFromText("clear sky")).toBe("clear");
    expect(kindFromText("few clouds")).toBe("mostlyClear");
    expect(kindFromText("scattered clouds")).toBe("partly");
    expect(kindFromText("broken clouds")).toBe("cloudy");
    expect(kindFromText("overcast clouds")).toBe("cloudy");
    expect(kindFromText("light rain")).toBe("rain");
    expect(kindFromText("heavy intensity rain")).toBe("heavyRain");
    expect(kindFromText("light intensity shower rain")).toBe("showers");
    expect(kindFromText("thunderstorm with light rain")).toBe("thunder");
    expect(kindFromText("light intensity drizzle")).toBe("drizzle");
    expect(kindFromText("mist")).toBe("fog");
    expect(kindFromText("haze")).toBe("haze");
    expect(kindFromText("smoke")).toBe("haze");
    // Open-Meteo descriptions (src/scraper/lib/weather-sources.ts wmoDescription)
    expect(kindFromText("mainly clear")).toBe("mostlyClear");
    expect(kindFromText("partly cloudy")).toBe("partly");
    expect(kindFromText("rain showers")).toBe("showers");
    expect(kindFromText("thunderstorm with hail")).toBe("thunder");
    expect(kindFromText("")).toBe("unknown");
    expect(kindFromText(null)).toBe("unknown");
    expect(kindFromText("volcanic sky")).toBe("unknown");
  });

  it("picks the kind that matters most for a day", () => {
    expect(worstKind(["clear", "cloudy", "rain", "partly"])).toBe("rain");
    expect(worstKind(["rain", "thunder"])).toBe("thunder");
    expect(worstKind(["unknown", "clear"])).toBe("clear");
    expect(worstKind([])).toBe("unknown");
  });

  it("has a severity for every kind, and night pictures only for sky kinds", () => {
    for (const k of WEATHER_KINDS) expect(typeof KIND_SEVERITY[k]).toBe("number");
    expect(hasNightPicture("clear")).toBe(true);
    expect(hasNightPicture("partly")).toBe(true);
    expect(hasNightPicture("rain")).toBe(false);
  });
});

describe("units", () => {
  it("converts wind m/s → km/h and rejects negatives", () => {
    expect(msToKmh(1.94)).toBe(7);
    expect(msToKmh(2.83)).toBe(10.2);
    expect(msToKmh(0)).toBe(0);
    expect(msToKmh(-1)).toBeNull();
    expect(msToKmh(null)).toBeNull();
  });

  it("turns OpenWeather pop (0–1) into a whole percent", () => {
    expect(popToPercent(0)).toBe(0);
    expect(popToPercent(0.45)).toBe(45);
    expect(popToPercent(1)).toBe(100);
    expect(popToPercent(1.2)).toBeNull();
    expect(popToPercent(-0.1)).toBeNull();
    expect(popToPercent(undefined)).toBeNull();
  });

  it("names wind directions", () => {
    expect(compass(0)).toBe("N");
    expect(compass(242)).toBe("WSW");
    expect(compass(359)).toBe("N");
    expect(compass(-90)).toBe("W");
    expect(compass(null)).toBeNull();
  });

  it("reads India dates across midnight", () => {
    expect(istDate(Date.parse("2026-09-27T18:29:00Z"))).toBe("2026-09-27"); // 23:59 IST
    expect(istDate(Date.parse("2026-09-27T18:31:00Z"))).toBe("2026-09-28"); // 00:01 IST
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("parseOpenMeteoForecast", () => {
  const f = parseOpenMeteoForecast(OPEN_METEO_MANDYA)!;

  it("keeps India calendar dates and the daily values as sent", () => {
    expect(f.source).toBe("open-meteo");
    expect(f.days.map((d) => d.date)).toEqual(["2026-09-27", "2026-09-28", "2026-09-29"]);
    const tomorrow = f.days[1];
    expect(tomorrow).toMatchObject({ kind: "drizzle", code: 55, tMax: 31.2, tMin: 21, rainChance: 94, rainMm: 5.6, windMaxKmh: 15.1, windDir: "WSW", uvMax: 8.4 });
    // Sunrise 28 Sep 06:11 IST = 00:41 UTC.
    expect(tomorrow.sunrise).toBe("2026-09-28T00:41:33.000Z");
    expect(f.days[2].kind).toBe("showers");
  });

  it("keeps the source's own time for the current value, with units as sent", () => {
    expect(f.current).toEqual({
      time: "2026-09-27T16:30:00.000Z",
      temperature: 24.6,
      feelsLike: 25.9,
      humidity: 71,
      windKmh: 13.7,
      windDir: "WSW",
      kind: "mostlyClear",
      code: 1,
      isDay: false,
    });
  });

  it("turns impossible values into null instead of showing them", () => {
    const broken = parseOpenMeteoForecast({
      utc_offset_seconds: 19800,
      daily: {
        time: [1790447400, 1790533800],
        weather_code: [0, 3],
        temperature_2m_max: [99, 20],
        temperature_2m_min: [19, 25], // min above max → both dropped
        precipitation_probability_max: [150, 40],
        precipitation_sum: [-2, 3],
      },
    })!;
    expect(broken.days[0]).toMatchObject({ tMax: null, tMin: 19, rainChance: null, rainMm: null });
    expect(broken.days[1]).toMatchObject({ tMax: null, tMin: null, rainChance: 40, rainMm: 3 });
    expect(broken.current).toBeNull();
  });

  it("returns null for a reply with nothing usable", () => {
    expect(parseOpenMeteoForecast(null)).toBeNull();
    expect(parseOpenMeteoForecast({ error: true, reason: "bad" })).toBeNull();
    expect(parseOpenMeteoForecast({ current: { temperature_2m: 20 } })).toBeNull();
  });

  it("asks for the fields the page shows, in km/h and India time", () => {
    const url = openMeteoForecastUrl(12.524, 76.897);
    expect(url).toContain("latitude=12.524&longitude=76.897");
    expect(url).toContain("wind_speed_unit=kmh");
    expect(url).toContain("timezone=Asia%2FKolkata");
    for (const field of ["temperature_2m_max", "temperature_2m_min", "precipitation_probability_max", "precipitation_sum", "weather_code", "wind_speed_10m_max"]) {
      expect(url).toContain(field);
    }
  });
});

describe("parseOpenWeatherForecast", () => {
  const f = parseOpenWeatherForecast(OPENWEATHER_MANDYA)!;

  it("groups 3-hour slots into India days", () => {
    expect(f.source).toBe("openweather");
    expect(f.current).toBeNull();
    expect(f.days.map((d) => [d.date, d.slots])).toEqual([
      ["2026-09-27", 1],
      ["2026-09-28", 8],
    ]);
  });

  it("adds up a day: max/min of slots, highest chance of rain, rain summed, km/h", () => {
    const d = f.days[1];
    expect(d.tMax).toBe(31.8);
    expect(d.tMin).toBeCloseTo(23.4, 5);
    expect(d.rainChance).toBe(45);
    expect(d.rainMm).toBe(0.54);
    expect(d.windMaxKmh).toBe(10.2);
    expect(d.windDir).toBe("WNW");
    expect(d.kind).toBe("rain");
    expect(d.code).toBe(500);
  });

  it("says no rain (0 mm) when slots carry chances but no rain field", () => {
    expect(f.days[0].rainMm).toBe(0);
  });

  it("returns null without a slot list", () => {
    expect(parseOpenWeatherForecast({ cod: "401", message: "Invalid API key" })).toBeNull();
    expect(parseOpenWeatherForecast({ list: [] })).toBeNull();
  });

  it("puts the key only in the query string, encoded", () => {
    expect(openWeatherForecastUrl(12.524, 76.897, "a b")).toBe(
      "https://api.openweathermap.org/data/2.5/forecast?lat=12.524&lon=76.897&units=metric&appid=a%20b",
    );
  });
});

describe("second-source check", () => {
  it("compares only full days, within 3 °C", () => {
    const main = parseOpenMeteoForecast(OPEN_METEO_MANDYA);
    const other = parseOpenWeatherForecast(OPENWEATHER_MANDYA);
    const checks = compareForecasts(main, other);
    // 27 Sep has one OpenWeather slot (a part day) → not compared.
    expect(checks).toEqual([{ date: "2026-09-28", tMaxDiff: 0.6, tMinDiff: 2.4, agree: true }]);
  });

  it("flags a day where the sources differ by more than 3 °C", () => {
    const a: SourceForecast = { source: "open-meteo", current: null, days: [day("2026-09-28", { tMax: 30, tMin: 20 })] };
    const b: SourceForecast = { source: "openweather", current: null, days: [day("2026-09-28", { tMax: 34.5, tMin: 20.5, slots: 8 })] };
    expect(compareForecasts(a, b)).toEqual([{ date: "2026-09-28", tMaxDiff: 4.5, tMinDiff: 0.5, agree: false }]);
    expect(compareForecasts(a, null)).toEqual([]);
  });
});

describe("days and choices", () => {
  const days = ["2026-09-26", "2026-09-27", "2026-09-28", "2026-09-29"].map((d) => day(d));

  it("finds today and tomorrow in India time", () => {
    expect(todayOf(days, NOW)?.date).toBe("2026-09-27");
    expect(tomorrowOf(days, NOW)?.date).toBe("2026-09-28");
    // 00:30 IST on the 28th: "tomorrow" is now the 29th.
    const after = Date.parse("2026-09-27T19:00:00Z");
    expect(tomorrowOf(days, after)?.date).toBe("2026-09-29");
    expect(dayOffset("2026-09-29", NOW)).toBe(2);
    expect(dayOffset("2026-09-27", NOW)).toBe(0);
  });

  it("keeps only whole days (OpenWeather part days would show an evening 'high')", () => {
    const f = parseOpenWeatherForecast(OPENWEATHER_MANDYA)!;
    expect(wholeDays(f.days).map((d) => d.date)).toEqual(["2026-09-28"]);
    expect(wholeDays(days)).toHaveLength(4); // Open-Meteo days carry no slot count
  });

  it("drops days already past and caps the strip", () => {
    expect(upcomingDays(days, NOW).map((d) => d.date)).toEqual(["2026-09-27", "2026-09-28", "2026-09-29"]);
    expect(upcomingDays(days, NOW, 2)).toHaveLength(2);
  });

  it("prefers a fresh stored reading, else the live value, else the old one", () => {
    const live = { time: "2026-09-27T16:30:00Z" };
    expect(chooseCurrent("2026-09-27T16:00:00Z", live, NOW)).toBe("stored"); // 1 h old
    expect(chooseCurrent("2026-04-20T09:00:00Z", live, NOW)).toBe("live"); // 160 days old
    expect(chooseCurrent(null, live, NOW)).toBe("live");
    expect(chooseCurrent("2026-04-20T09:00:00Z", null, NOW)).toBe("storedOld");
    expect(chooseCurrent(null, null, NOW)).toBe("none");
    // A live value older than the stored one never wins.
    expect(chooseCurrent("2026-09-27T12:00:00Z", { time: "2026-09-27T11:00:00Z" }, NOW)).toBe("storedOld");
  });

  it("puts rain chance into words", () => {
    expect(rainBand(0)).toBe("unlikely");
    expect(rainBand(19)).toBe("unlikely");
    expect(rainBand(20)).toBe("possible");
    expect(rainBand(50)).toBe("likely");
    expect(rainBand(80)).toBe("veryLikely");
    expect(rainBand(null)).toBeNull();
  });

  it("gives at most one tip, most urgent first", () => {
    expect(dayTip(day("d", { kind: "thunder", rainChance: 90 }))).toBe("storm");
    expect(dayTip(day("d", { kind: "rain", rainMm: 70 }))).toBe("heavyRain");
    expect(dayTip(day("d", { kind: "drizzle", rainChance: 94 }))).toBe("umbrella");
    expect(dayTip(day("d", { tMax: 41 }))).toBe("heat");
    expect(dayTip(day("d", { windMaxKmh: 45 }))).toBe("wind");
    expect(dayTip(day("d", { tMin: 8 }))).toBe("cold");
    expect(dayTip(day("d"))).toBeNull();
    expect(dayTip(null)).toBeNull();
  });

  it("gives the week's temperature range for the bars", () => {
    expect(weekRange([day("a", { tMin: 19.9, tMax: 30.3 }), day("b", { tMin: 21, tMax: 31.2 })])).toEqual({ lo: 19.9, hi: 31.2 });
    expect(weekRange([day("a", { tMin: null, tMax: null })])).toBeNull();
  });
});

describe("dayKind (Sept 2026 audit: 'Light drizzle' next to 'Rain unlikely')", () => {
  it("reads a drizzle / rain / showers day as cloudy when rain is unlikely", () => {
    expect(dayKind("drizzle", 8)).toBe("cloudy");
    expect(dayKind("drizzle", 0)).toBe("cloudy");
    expect(dayKind("showers", 19)).toBe("cloudy");
  });

  it("keeps the wet word when rain is possible, and when the chance is unknown", () => {
    expect(dayKind("drizzle", 20)).toBe("drizzle");
    expect(dayKind("rain", 65)).toBe("rain");
    expect(dayKind("drizzle", null)).toBe("drizzle");
  });

  it("never hides a thunderstorm or heavy rain", () => {
    expect(dayKind("thunder", 5)).toBe("thunder");
    expect(dayKind("heavyRain", 5)).toBe("heavyRain");
    expect(dayKind("clear", 5)).toBe("clear");
  });

  it("applies to parsed Open-Meteo days", () => {
    const f = parseOpenMeteoForecast({
      utc_offset_seconds: 19800,
      daily: {
        time: [1790620200],
        weather_code: [51],
        temperature_2m_max: [31],
        temperature_2m_min: [22],
        precipitation_probability_max: [8],
        precipitation_sum: [0.5],
      },
    });
    expect(f?.days[0]?.kind).toBe("cloudy");
    expect(f?.days[0]?.code).toBe(51);
    expect(f?.days[0]?.rainChance).toBe(8);
  });
});

