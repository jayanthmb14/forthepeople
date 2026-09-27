/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Weather parsers + range checks (src/scraper/lib/weather-sources.ts).
// The Open-Meteo sample below is a real reply for Mandya (27 Sep 2026).
import { describe, expect, it } from "vitest";
import {
  OPEN_METEO_SOURCE,
  OPENWEATHER_SOURCE,
  openMeteoUrl,
  parseOpenMeteo,
  parseOpenWeather,
  weatherProblems,
  windDirection,
  wmoDescription,
} from "@/scraper/lib/weather-sources";

const OPEN_METEO_MANDYA = {
  latitude: 12.54833,
  longitude: 76.898735,
  current: {
    time: 1790520300,
    interval: 900,
    temperature_2m: 25.6,
    relative_humidity_2m: 68,
    apparent_temperature: 28.7,
    weather_code: 0,
    pressure_msl: 1010.4,
    wind_speed_10m: 2.7,
    wind_direction_10m: 176,
    visibility: 24120.0,
  },
  minutely_15: { time: [1790516700, 1790517600, 1790518500, 1790519400], precipitation: [0.0, 0.2, 0.1, 0.0] },
};

describe("parseOpenMeteo", () => {
  it("maps the reply to a reading with the source's own time", () => {
    const r = parseOpenMeteo(OPEN_METEO_MANDYA)!;
    expect(r.temperature).toBe(25.6);
    expect(r.feelsLike).toBe(28.7);
    expect(r.humidity).toBe(68);
    expect(r.windSpeed).toBe(2.7); // km/h as requested
    expect(r.windDir).toBe("S");
    expect(r.conditions).toBe("clear sky");
    expect(r.rainfall).toBe(0.3); // last four 15-minute values = last hour
    expect(r.pressure).toBe(1010.4);
    expect(r.visibility).toBe(24.1);
    expect(r.source).toBe(OPEN_METEO_SOURCE);
    expect(r.recordedAt.toISOString()).toBe(new Date(1790520300 * 1000).toISOString());
  });

  it("leaves rain unknown when the four quarter-hours are not all there", () => {
    const r = parseOpenMeteo({ ...OPEN_METEO_MANDYA, minutely_15: { precipitation: [0.1, null] } })!;
    expect(r.rainfall).toBeNull();
  });

  it("returns null without a temperature or a time", () => {
    expect(parseOpenMeteo({ current: { time: 1790520300 } })).toBeNull();
    expect(parseOpenMeteo({ current: { temperature_2m: 20 } })).toBeNull();
    expect(parseOpenMeteo(null)).toBeNull();
  });

  it("asks for km/h wind and the last hour of 15-minute rain", () => {
    const url = openMeteoUrl(12.524, 76.897);
    expect(url).toContain("latitude=12.524&longitude=76.897");
    expect(url).toContain("wind_speed_unit=kmh");
    expect(url).toContain("past_minutely_15=4");
  });
});

describe("parseOpenWeather", () => {
  it("keeps OpenWeather's units and uses dt as the reading time", () => {
    const r = parseOpenWeather({
      dt: 1790520000,
      main: { temp: 27.1, feels_like: 28, humidity: 70, pressure: 1009 },
      wind: { speed: 3.1, deg: 250 },
      weather: [{ description: "scattered clouds" }],
      visibility: 10000,
      rain: { "1h": 0.4 },
    })!;
    expect(r.source).toBe(OPENWEATHER_SOURCE);
    expect(r.windSpeed).toBe(3.1);
    expect(r.windDir).toBe("WSW");
    expect(r.visibility).toBe(10);
    expect(r.rainfall).toBe(0.4);
    expect(r.recordedAt.getTime()).toBe(1790520000 * 1000);
  });

  it("returns null when the reply has no time", () => {
    expect(parseOpenWeather({ main: { temp: 20 } })).toBeNull();
  });
});

describe("weatherProblems", () => {
  const now = 1790520300 * 1000;
  const good = parseOpenMeteo(OPEN_METEO_MANDYA)!;

  it("passes a normal reading", () => {
    expect(weatherProblems(good, now)).toEqual([]);
  });

  it("rejects impossible values and old or future readings", () => {
    expect(weatherProblems({ ...good, temperature: 61 }, now)[0]).toMatch(/temperature/);
    expect(weatherProblems({ ...good, humidity: 140 }, now)[0]).toMatch(/humidity/);
    expect(weatherProblems({ ...good, pressure: 500 }, now)[0]).toMatch(/pressure/);
    expect(weatherProblems({ ...good, recordedAt: new Date(now - 7 * 3600_000) }, now)[0]).toMatch(/7 h old/);
    expect(weatherProblems({ ...good, recordedAt: new Date(now + 3600_000) }, now)[0]).toMatch(/future/);
  });
});

describe("small helpers", () => {
  it("names wind directions and WMO codes", () => {
    expect(windDirection(0)).toBe("N");
    expect(windDirection(359)).toBe("N");
    expect(windDirection(90)).toBe("E");
    expect(windDirection(null)).toBeNull();
    expect(wmoDescription(95)).toBe("thunderstorm");
    expect(wmoDescription(63)).toBe("moderate rain");
    expect(wmoDescription(1234)).toBeNull();
  });
});
