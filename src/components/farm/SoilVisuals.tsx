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
//    advisoryEmoji   one emoji per advisory category (pest → 🐛 …)
//
//  The neutral band and the dots use the page hue; the acidic and
//  alkaline bands keep the semantic danger / warning tints, matching the
//  pH colours on the soil cards.
"use client";

import React from "react";

/** Same bands as the soil cards: below 6 acidic, above 7.5 alkaline, else neutral. */
export const PH_ACIDIC_BELOW = 6;
export const PH_ALKALINE_ABOVE = 7.5;

/** Advisory category → emoji (one per chip). */
export function advisoryEmoji(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("pest") || c.includes("disease")) return "🐛";
  if (c.includes("weather") || c.includes("rain")) return "🌦️";
  if (c.includes("fertili") || c.includes("nutrient")) return "🧪";
  if (c.includes("irrigat") || c.includes("water")) return "💧";
  if (c.includes("crop") || c.includes("sow")) return "🌱";
  return "📢";
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
    { label: "Acidic", width: acidicW, bg: "var(--ftp-danger-tint)", fg: "var(--ftp-danger)", count: acidic },
    { label: "Neutral", width: neutralW, bg: "var(--hue-tint)", fg: "var(--hue-deep)", count: neutral },
    { label: "Alkaline", width: alkalineW, bg: "var(--ftp-warn-tint)", fg: "var(--ftp-warn)", count: alkaline },
  ];

  return (
    <figure style={{ margin: 0, width: "100%" }}>
      <div
        role="img"
        aria-label={`Soil pH of ${readings.length} villages: ${acidic} acidic, ${neutral} neutral, ${alkaline} alkaline`}
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
            <span key={b.label} style={{ width: `${b.width}%`, background: b.bg }} />
          ))}
        </div>
        <div aria-hidden style={{ position: "relative", height: 16, marginTop: 4, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
          {[SCALE_MIN, PH_ACIDIC_BELOW, PH_ALKALINE_ABOVE, SCALE_MAX].map((t, i, all) => (
            <span
              key={t}
              className="ftp-num"
              style={{
                position: "absolute",
                left: `${pctOf(t)}%`,
                transform: i === 0 ? "none" : i === all.length - 1 ? "translateX(-100%)" : "translateX(-50%)",
                fontWeight: 500,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", marginTop: 8 }}>
        {bands.map((b) => (
          <div key={b.label} style={{ width: `${b.width}%`, minWidth: 0, textAlign: "center" }}>
            <div style={{ fontSize: 12, lineHeight: "16px", fontWeight: 600, color: b.fg }}>{b.label}</div>
            <div className="ftp-num" style={{ fontSize: 15, lineHeight: "22px", color: "var(--ftp-text)" }}>{b.count}</div>
          </div>
        ))}
      </div>
      <figcaption style={{ marginTop: 8, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
        Each dot is one village&apos;s soil test, placed by its pH.
      </figcaption>
    </figure>
  );
}
