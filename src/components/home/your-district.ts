/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Pure rules for the home page's "Your district" cards (YourDistrict.tsx),
// unit-tested in tests/home.test.ts. Each picker returns null when there
// is nothing honest to show; the card then says "Not available right now"
// — never a made-up value.

import type { Leader, NewsItem, WeatherReading } from "@/hooks/useRealtimeData";
import { isCollectorRole } from "@/lib/leader-roles";
import { kindFromText, type WeatherKind } from "@/lib/weather/codes";
import { chooseCurrent, type ForecastCurrent } from "@/lib/weather/forecast";

/** The newest shown story: its headline, who published it and when. */
export function pickHeadline(rows: ReadonlyArray<Partial<NewsItem> & { title?: string | null }> | null | undefined) {
  for (const r of rows ?? []) {
    const title = (r.headline ?? r.title ?? "").trim();
    if (!title || !r.publishedAt) continue;
    const source = (r.publisher ?? r.source ?? "").trim();
    return { title, source: source || null, publishedAt: r.publishedAt };
  }
  return null;
}

/**
 * The district head (Collector / Deputy Commissioner / District Magistrate —
 * src/lib/leader-roles.ts, the same rule as the overview's leaders card).
 * Placeholder names ("[Verify at …]") do not count. `more` = other people
 * holding the same post (Mumbai has two Collectors).
 */
export function pickDistrictHead(rows: ReadonlyArray<Leader> | null | undefined) {
  const heads = (rows ?? []).filter((l) => isCollectorRole(l.role) && l.name.trim().length > 0 && !l.name.trim().startsWith("["));
  if (heads.length === 0) return null;
  return { leader: heads[0], more: heads.length - 1 };
}

/** What the weather card shows as "now". */
export interface WeatherNow {
  temp: number;
  kind: WeatherKind;
  night: boolean;
  /** The time the value applies to (ISO). */
  time: string;
  /** Who measured or forecast it. */
  source: string;
}

const hourIST = (iso: string) => new Date(new Date(iso).getTime() + 330 * 60_000).getUTCHours();

/**
 * The same rule as the district overview's weather tile (TodayWeatherTile →
 * chooseCurrent): our stored reading while it is at most 3 hours old, else
 * the forecast service's current value, else nothing — an old reading is
 * never shown as today's weather.
 */
export function pickWeatherNow(
  latest: WeatherReading | null | undefined,
  live: Pick<ForecastCurrent, "time" | "temperature" | "kind" | "isDay"> | null | undefined,
  liveSource: string | null,
  nowMs: number,
): WeatherNow | null {
  const choice = chooseCurrent(latest?.recordedAt, live ?? null, nowMs);
  if (choice === "live" && live && liveSource) {
    return { temp: live.temperature, kind: live.kind, night: live.isDay === false, time: live.time, source: liveSource };
  }
  if (choice === "stored" && latest && typeof latest.temperature === "number") {
    const h = hourIST(latest.recordedAt);
    return { temp: latest.temperature, kind: kindFromText(latest.conditions), night: h < 6 || h >= 19, time: latest.recordedAt, source: latest.source };
  }
  return null;
}
