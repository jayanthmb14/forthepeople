/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Crop prices — small v4 pictures used only by the crops page
// ═══════════════════════════════════════════════════════════════════════
//
//    cropEmoji(name)  one emoji for a commodity name ("Tomato" → 🍅)
//    PriceRange       a bar from the cheapest to the dearest lot of the
//                     day, with the crop emoji standing on the typical
//                     (modal) price
//
//  Both take their colour from the page hue (--hue / --hue-pop /
//  --hue-deep), so they follow the crops module colour automatically.
"use client";

import React from "react";

/** Commodity-name patterns → emoji. First match wins, so specific names come first. */
const CROP_EMOJI: Array<[RegExp, string]> = [
  [/sweet ?potato/, "🍠"],
  [/tomato/, "🍅"],
  [/onion/, "🧅"],
  [/potato/, "🥔"],
  [/banana/, "🍌"],
  [/coconut|copra/, "🥥"],
  [/mango/, "🥭"],
  [/maize|corn/, "🌽"],
  [/chil+i|capsicum/, "🌶️"],
  [/garlic/, "🧄"],
  [/carrot/, "🥕"],
  [/brinjal|egg ?plant/, "🍆"],
  [/cucumber|gherkin/, "🥒"],
  [/grape/, "🍇"],
  [/pine ?apple/, "🍍"],
  [/water ?melon/, "🍉"],
  [/apple/, "🍎"],
  [/lemon|\blime\b/, "🍋"],
  [/orange|mosambi/, "🍊"],
  [/cauliflower|broccoli/, "🥦"],
  [/cabbage|lettuce|spinach|methi|coriander|leaf|leaves|greens/, "🥬"],
  [/ground ?nut|peanut/, "🥜"],
  [/beans|peas|gram|\bdal\b|lentil|\btur\b|arhar|moong|urad|masur|pulse|cowpea|rajma/, "🫘"],
  [/coffee/, "☕"],
  [/\btea\b/, "🍵"],
  [/mushroom/, "🍄"],
  [/flower|marigold|jasmine|\brose\b|chrysanthemum/, "🌼"],
  [/milk/, "🥛"],
  [/\begg\b/, "🥚"],
  [/fish/, "🐟"],
  [/honey/, "🍯"],
  [/rice|paddy|wheat|jowar|bajra|ragi|millet|barley|sorghum/, "🌾"],
];

/** One emoji for a commodity name. Unknown produce gets a basket. */
export function cropEmoji(name: string | null | undefined): string {
  const n = (name ?? "").toLowerCase();
  for (const [re, emoji] of CROP_EMOJI) if (re.test(n)) return emoji;
  return "🧺";
}

/**
 * PriceRange — the day's price spread for one crop, as a picture:
 * a coloured bar from the cheapest lot (left) to the dearest (right), with
 * the crop emoji and a marker on the typical (modal) price.
 *
 * @prop min / modal / max  Prices already converted to the display unit.
 * @prop unitLabel          "/kg" or "/q", shown after each price.
 * @prop emoji              The crop emoji that stands on the typical price.
 */
export function PriceRange({
  min,
  modal,
  max,
  unitLabel,
  emoji,
}: {
  min: number;
  modal: number;
  max: number;
  unitLabel: string;
  emoji: string;
}) {
  const span = max - min;
  // Where the typical price sits between cheapest and dearest (0–100),
  // kept a little inside the ends so the emoji never spills off the bar.
  const raw = span > 0 ? ((modal - min) / span) * 100 : 50;
  const pos = Math.max(6, Math.min(94, raw));
  const rupees = (v: number) => `₹${v.toLocaleString("en-IN")}`;
  const figures: Array<{ label: string; value: number; align: "left" | "center" | "right"; strong?: boolean }> = [
    { label: "Cheapest", value: min, align: "left" },
    { label: "Typical", value: modal, align: "center", strong: true },
    { label: "Dearest", value: max, align: "right" },
  ];
  return (
    <figure style={{ margin: 0 }}>
      <div
        role="img"
        aria-label={`Cheapest ${rupees(min)}${unitLabel}, typical ${rupees(modal)}${unitLabel}, dearest ${rupees(max)}${unitLabel}`}
        style={{ position: "relative", paddingTop: 34 }}
      >
        <span
          aria-hidden
          className="ftp-emoji"
          style={{ position: "absolute", top: 0, left: `${pos}%`, transform: "translateX(-50%)", fontSize: 26 }}
        >
          {emoji}
        </span>
        <div aria-hidden style={{ height: 14, borderRadius: "var(--ftp-radius-pill)", background: "var(--hue-tint)", overflow: "hidden" }}>
          <div
            className="ftp-grow-x"
            style={{ height: "100%", borderRadius: "var(--ftp-radius-pill)", background: "linear-gradient(90deg, var(--hue-pop), var(--hue))" }}
          />
        </div>
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 29,
            left: `${pos}%`,
            width: 4,
            height: 24,
            borderRadius: 2,
            background: "var(--hue-deep)",
            transform: "translateX(-50%)",
            boxShadow: "0 0 0 2px #fff",
          }}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginTop: 14 }}>
        {figures.map((f) => (
          <div key={f.label} style={{ textAlign: f.align, minWidth: 0 }}>
            <div style={{ fontSize: 12, lineHeight: "16px", fontWeight: 600, color: "var(--ftp-text-2)" }}>{f.label}</div>
            <div className="ftp-num" style={{ fontSize: 17, lineHeight: "24px", color: f.strong ? "var(--hue-deep)" : "var(--ftp-text)" }}>
              {rupees(f.value)}
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ftp-text-2)" }}>{unitLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}
