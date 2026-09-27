/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Farm & Soil — small v4 pictures used only by the farm page
// ═══════════════════════════════════════════════════════════════════════
//
//    PhScale         every village's soil pH as a dot on a coloured
//                    acidic / neutral / alkaline strip
//    NutrientBars    nitrogen, phosphorus and potassium: one bar each,
//                    split into villages rated low / medium / high
//    advisoryTopic   an advisory category → a topic key (pest, weather…)
//    advisoryEmoji   one emoji per advisory topic (pest → 🐛 …)
//    nutrientLevel   "Low" / "medium" / "HIGH" → low | medium | high
//
//  The neutral band, the dots and the nutrient bars use the page hue; the
//  acidic and alkaline bands keep the semantic danger / warning tints,
//  matching the pH colours on the soil cards. Words come from the
//  "page_farm" messages.
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useFormat } from "@/i18n/client";

/** Same bands as the soil cards: below 6 acidic, above 7.5 alkaline, else neutral. */
export const PH_ACIDIC_BELOW = 6;
export const PH_ALKALINE_ABOVE = 7.5;

/** pH → band key used by the messages (phBand.acidic …). */
export function phBand(ph: number): "acidic" | "neutral" | "alkaline" {
  return ph < PH_ACIDIC_BELOW ? "acidic" : ph > PH_ALKALINE_ABOVE ? "alkaline" : "neutral";
}

export type AdvisoryTopic = "pest" | "weather" | "nutrients" | "water" | "sowing";

/**
 * Advisory category (free text from the KVK feed) → a topic key the page
 * can translate. Unknown categories return null and are shown as sent.
 */
export function advisoryTopic(category: string): AdvisoryTopic | null {
  const c = category.toLowerCase();
  if (c.includes("pest") || c.includes("disease")) return "pest";
  if (c.includes("weather") || c.includes("rain")) return "weather";
  if (c.includes("fertili") || c.includes("nutrient")) return "nutrients";
  if (c.includes("irrigat") || c.includes("water")) return "water";
  if (c.includes("crop") || c.includes("sow")) return "sowing";
  return null;
}

const TOPIC_EMOJI: Record<AdvisoryTopic, string> = {
  pest: "🐛",
  weather: "🌦️",
  nutrients: "🧪",
  water: "💧",
  sowing: "🌱",
};

/** Advisory category → emoji (one per chip). */
export function advisoryEmoji(category: string): string {
  const topic = advisoryTopic(category);
  return topic ? TOPIC_EMOJI[topic] : "📢";
}

export type NutrientLevel = "low" | "medium" | "high";

/** A soil-card rating ("Low", "Medium", "High") → a level key, or null if it is something else. */
export function nutrientLevel(value: string | null | undefined): NutrientLevel | null {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "low") return "low";
  if (v === "medium" || v === "moderate") return "medium";
  if (v === "high") return "high";
  return null;
}

// The strip runs from pH 4 to 9, which covers almost every farm soil.
// Readings outside it are pinned to the nearest end (their real value is
// still on the village card).
const SCALE_MIN = 4;
const SCALE_MAX = 9;
const pctOf = (ph: number) => ((Math.max(SCALE_MIN, Math.min(SCALE_MAX, ph)) - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;

/**
 * PhScale — one dot per village soil test on a pH strip. Dots that land
 * on the same spot stack upwards, so a tall pile means many villages
 * share that pH.
 */
export function PhScale({ readings }: { readings: Array<{ id: string; ph: number }> }) {
  const t = useTranslations("page_farm");
  const f = useFormat();
  const acidic = readings.filter((r) => r.ph < PH_ACIDIC_BELOW).length;
  const alkaline = readings.filter((r) => r.ph > PH_ALKALINE_ABOVE).length;
  const neutral = readings.length - acidic - alkaline;

  // Stack dots in 0.25-pH bins.
  const bins = new Map<number, number>();
  const dots = readings.map((r) => {
    const bin = Math.round(Math.max(SCALE_MIN, Math.min(SCALE_MAX, r.ph)) * 4) / 4;
    const idx = bins.get(bin) ?? 0;
    bins.set(bin, idx + 1);
    return { id: r.id, left: pctOf(bin), idx };
  });
  const tallest = Math.max(1, ...Array.from(bins.values()));
  const step = Math.min(10, 80 / tallest);
  const pileHeight = Math.ceil(step * (tallest - 1) + 10);

  const acidicW = pctOf(PH_ACIDIC_BELOW);
  const neutralW = pctOf(PH_ALKALINE_ABOVE) - acidicW;
  const alkalineW = 100 - acidicW - neutralW;

  const bands = [
    { key: "acidic", width: acidicW, bg: "var(--ftp-danger-tint)", fg: "var(--ftp-danger)", count: acidic },
    { key: "neutral", width: neutralW, bg: "var(--hue-tint)", fg: "var(--hue-deep)", count: neutral },
    { key: "alkaline", width: alkalineW, bg: "var(--ftp-warn-tint)", fg: "var(--ftp-warn)", count: alkaline },
  ];

  return (
    <figure style={{ margin: 0, width: "100%" }}>
      <div
        role="img"
        aria-label={t("phScaleAria", { total: readings.length, acidic, neutral, alkaline })}
        dir="ltr"
        style={{ position: "relative", paddingTop: pileHeight + 4 }}
      >
        {dots.map((d) => (
          <span
            key={d.id}
            aria-hidden
            className="ftp-pop"
            style={{
              position: "absolute",
              left: `${d.left}%`,
              bottom: 24 + d.idx * step,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--hue-deep)",
              border: "1.5px solid #fff",
              // Centre on the pH with a margin, not a transform: the
              // ftp-pop entrance animates `transform` and would undo it.
              marginLeft: -5,
              boxSizing: "border-box",
              ["--i" as string]: Math.min(d.idx, 8),
            }}
          />
        ))}
        <div aria-hidden style={{ display: "flex", height: 18, borderRadius: "var(--ftp-radius-pill)", overflow: "hidden" }}>
          {bands.map((b) => (
            <span key={b.key} style={{ width: `${b.width}%`, background: b.bg }} />
          ))}
        </div>
        <div aria-hidden style={{ position: "relative", height: 16, marginTop: 4, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
          {[SCALE_MIN, PH_ACIDIC_BELOW, PH_ALKALINE_ABOVE, SCALE_MAX].map((tick, i, all) => (
            <span
              key={tick}
              className="ftp-num"
              style={{
                position: "absolute",
                left: `${pctOf(tick)}%`,
                transform: i === 0 ? "none" : i === all.length - 1 ? "translateX(-100%)" : "translateX(-50%)",
                fontWeight: 500,
              }}
            >
              {f.number(tick)}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", marginTop: 8 }} dir="ltr">
        {bands.map((b) => (
          <div key={b.key} style={{ width: `${b.width}%`, minWidth: 0, textAlign: "center" }}>
            <div style={{ fontSize: 12, lineHeight: "16px", fontWeight: 600, color: b.fg }}>{t(`phBand.${b.key}`)}</div>
            <div className="ftp-num" style={{ fontSize: 15, lineHeight: "22px", color: "var(--ftp-text)" }}>
              {f.number(b.count)}
            </div>
          </div>
        ))}
      </div>
      <figcaption style={{ marginTop: 8, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{t("phScaleCaption")}</figcaption>
    </figure>
  );
}

export interface NutrientRow {
  key: "nitrogen" | "phosphorus" | "potassium";
  low: number;
  medium: number;
  high: number;
}

/** Level → fill: light for low, the hue for medium, deep for high. */
export const NUTRIENT_FILL: Record<NutrientLevel, string> = {
  low: "var(--hue-pop)",
  medium: "var(--hue)",
  high: "var(--hue-deep)",
};

const NUTRIENT_EMOJI: Record<NutrientRow["key"], string> = {
  nitrogen: "🍃",
  phosphorus: "🌸",
  potassium: "🍌",
};

/**
 * NutrientBars — one bar per nutrient, split by how many villages were
 * rated low, medium and high. Each bar is the villages that have a rating
 * for that nutrient; segment counts are written on the bar when there is
 * room and are always in the table view.
 */
export function NutrientBars({ rows }: { rows: NutrientRow[] }) {
  const t = useTranslations("page_farm");
  const f = useFormat();
  const levels: NutrientLevel[] = ["low", "medium", "high"];
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
      {rows.map((row, ri) => {
        const total = row.low + row.medium + row.high;
        return (
          <li key={row.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              className="ftp-icon-chip ftp-emoji"
              aria-hidden
              style={{
                width: 34,
                height: 34,
                fontSize: 18,
                borderRadius: 11,
                background: "#fff",
                border: "1px solid color-mix(in srgb, var(--hue) 22%, transparent)",
              }}
            >
              {NUTRIENT_EMOJI[row.key]}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 5 }}>
                <span style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)" }}>{t(`nutrient.${row.key}`)}</span>
                <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{t("nutrientVillages", { n: total })}</span>
              </div>
              <div
                role="img"
                aria-label={t("nutrientAria", { nutrient: t(`nutrient.${row.key}`), low: row.low, medium: row.medium, high: row.high })}
                dir="ltr"
                style={{ display: "flex", height: 22, borderRadius: 8, overflow: "hidden", background: "var(--hue-tint)", gap: 2 }}
              >
                {levels.map((lv, li) =>
                  row[lv] > 0 ? (
                    <span
                      key={lv}
                      aria-hidden
                      className="ftp-grow-x"
                      style={{
                        width: `${(row[lv] / total) * 100}%`,
                        background: NUTRIENT_FILL[lv],
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: lv === "low" ? "var(--hue-deep)" : "#fff",
                        ["--i" as string]: ri * 3 + li,
                      }}
                    >
                      {row[lv] / total >= 0.12 ? f.number(row[lv]) : ""}
                    </span>
                  ) : null,
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
