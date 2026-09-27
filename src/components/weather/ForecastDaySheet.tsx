/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Everything about one forecast day, in the page's DetailSheet (bottom
// sheet on phones, right panel on laptops): sky, warmest / coolest, chance
// and amount of rain, strongest wind, sun strength, sunrise / sunset, what
// the second source says, one tip, the source and when we fetched it.
"use client";

import { CloudRain, Droplet, SunMedium, Sunrise, Sunset, Thermometer, ThermometerSun, Wind } from "lucide-react";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import { SheetSmall } from "@/components/services-2/kit";
import { dayTip, type DayCheck, type ForecastDay, type ForecastSourceKey } from "@/lib/weather/forecast";
import { CheckLine, SourceLine, TipLine } from "./ForecastCards";
import { WeatherArt } from "./WeatherArt";
import { useWeatherText } from "./useWeatherText";

export function ForecastDaySheet({
  day,
  now,
  source,
  fetchedAt,
  check,
  checkDay,
  checkSource,
  onClose,
}: {
  day: ForecastDay | null;
  now: number;
  source: ForecastSourceKey;
  fetchedAt: string;
  check?: DayCheck | null;
  checkDay?: ForecastDay | null;
  checkSource?: ForecastSourceKey | null;
  onClose: () => void;
}) {
  const w = useWeatherText();
  const { t } = w;
  const name = day ? w.dayName(day.date, now, "long") : "";
  const dateLong = day ? w.dateLong(day.date) : "";
  const title = day ? (name === t("forecast.today") || name === t("forecast.tomorrow") ? `${name} · ${dateLong}` : dateLong) : "";

  return (
    <DetailSheet
      open={Boolean(day)}
      onClose={onClose}
      title={title}
      subtitle={day ? w.kindLabel(day.kind) : undefined}
      hueClassName="ftp-hue-sky"
      media={day ? <WeatherArt kind={day.kind} size={48} /> : undefined}
    >
      {day && (
        <>
          <DetailList
            rows={[
              { icon: ThermometerSun, label: t("forecast.sheet.max"), value: day.tMax !== null ? w.deg(day.tMax) : null },
              { icon: Thermometer, label: t("forecast.sheet.min"), value: day.tMin !== null ? w.deg(day.tMin) : null },
              { icon: Droplet, label: t("forecast.sheet.chance"), value: day.rainChance !== null ? `${w.pct(day.rainChance)} · ${w.band(day.rainChance)}` : null },
              { icon: CloudRain, label: t("forecast.sheet.amount"), value: day.rainMm !== null ? w.mm(day.rainMm) : null },
              {
                icon: Wind,
                label: t("forecast.sheet.wind"),
                value: day.windMaxKmh !== null ? `${w.kmh(day.windMaxKmh)}${day.windDir ? ` · ${day.windDir}` : ""}` : null,
              },
              { icon: SunMedium, label: t("forecast.uv"), value: w.uv(day.uvMax) },
              { icon: Sunrise, label: t("forecast.sunrise"), value: day.sunrise ? w.time(day.sunrise) : null },
              { icon: Sunset, label: t("forecast.sunset"), value: day.sunset ? w.time(day.sunset) : null },
              {
                label: checkSource ? t("forecast.sheet.second", { source: w.sourceOf(checkSource).label }) : "",
                value:
                  checkDay && checkSource
                    ? checkDay.rainChance !== null
                      ? t("forecast.sheet.secondValue", { max: w.deg(checkDay.tMax), min: w.deg(checkDay.tMin), chance: w.pct(checkDay.rainChance) })
                      : t("forecast.sheet.secondValueNoChance", { max: w.deg(checkDay.tMax), min: w.deg(checkDay.tMin) })
                    : null,
              },
            ]}
          />
          <TipLine tip={dayTip(day)} />
          <CheckLine check={check} checkDay={checkDay} checkSource={checkSource} />
          <SourceLine source={source} fetchedAt={fetchedAt} />
          <SheetSmall>{t("forecast.sheet.note")}</SheetSmall>
        </>
      )}
    </DetailSheet>
  );
}
