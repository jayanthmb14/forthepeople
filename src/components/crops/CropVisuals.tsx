/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Crop prices — small v4 pictures used only by the crops page
// ═══════════════════════════════════════════════════════════════════════
//
//    PriceRange       a bar from the cheapest to the dearest lot of the
//                     day, with a marker on the typical (modal) price
//    MoveSplit        one bar split into crops that went up / stayed /
//                     went down since their previous market day
//    PriceMoves       the biggest price changes since each crop's previous
//                     market day, as bars that go right (up) or left (down)
//                     from a middle line
//
//  All take their colour from the page hue (--hue / --hue-pop /
//  --hue-deep), so they follow the crops module colour automatically.
//  Words come from the "page_crops" messages; numbers from useFormat().
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useFormat } from "@/i18n/client";

/**
 * PriceRange — the day's price spread for one crop, as a picture:
 * a coloured bar from the cheapest lot (left) to the dearest (right), with
 * a marker on the typical (modal) price.
 *
 * @prop min / modal / max  Prices already converted to the display unit.
 * @prop unit               "kg" or "quintal" (picks the "/kg" or "/q" suffix).
 */
export function PriceRange({
  min,
  modal,
  max,
  unit,
}: {
  min: number;
  modal: number;
  max: number;
  unit: "kg" | "quintal";
}) {
  const t = useTranslations("page_crops");
  const f = useFormat();
  const span = max - min;
  // Where the typical price sits between cheapest and dearest (0–100),
  // kept a little inside the ends so the marker never spills off the bar.
  const raw = span > 0 ? ((modal - min) / span) * 100 : 50;
  const pos = Math.max(6, Math.min(94, raw));
  const rupees = (v: number) => f.number(v, { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const perUnit = (v: number) => t("pricePer", { price: rupees(v), unit });
  const figures: Array<{ key: string; label: string; value: number; align: "start" | "center" | "end"; strong?: boolean }> = [
    { key: "min", label: t("rangeCheapest"), value: min, align: "start" },
    { key: "modal", label: t("rangeTypical"), value: modal, align: "center", strong: true },
    { key: "max", label: t("rangeDearest"), value: max, align: "end" },
  ];
  return (
    <figure style={{ margin: 0 }}>
      <div
        role="img"
        aria-label={t("rangeAria", { min: perUnit(min), modal: perUnit(modal), max: perUnit(max) })}
        dir="ltr"
        style={{ position: "relative", paddingTop: 10 }}
      >
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
            top: 5,
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
        {figures.map((fig) => (
          <div key={fig.key} style={{ textAlign: fig.align, minWidth: 0 }}>
            <div style={{ fontSize: 12, lineHeight: "16px", fontWeight: 600, color: "var(--ftp-text-2)" }}>{fig.label}</div>
            <div className="ftp-num" style={{ fontSize: 17, lineHeight: "24px", color: fig.strong ? "var(--hue-deep)" : "var(--ftp-text)" }}>
              {rupees(fig.value)}
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ftp-text-2)" }}>{t("unitShort", { unit })}</span>
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}

export interface PriceMove {
  key: string;
  crop: string;
  /** Change in per cent: positive = dearer, negative = cheaper. */
  pct: number;
  /** "₹38/kg to ₹42/kg, since 12 Sep", already formatted and translated. */
  sub: string;
}

/**
 * PriceMoves — one row per crop: a middle line, a bar to the right when
 * the price went up and to the left when it went down, sized by the %
 * change (the biggest change fills its half). Up bars wear the deep hue,
 * down bars the light hue, and the sign is also written as ▲ / ▼ (and
 * spoken as "up" / "down"), so the picture never relies on colour alone.
 */
export function PriceMoves({ moves }: { moves: PriceMove[] }) {
  const t = useTranslations("page_crops");
  const f = useFormat();
  const biggest = Math.max(0, ...moves.map((m) => Math.abs(m.pct)));
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
      {moves.map((m, i) => {
        const up = m.pct > 0;
        const half = biggest > 0 ? (Math.abs(m.pct) / biggest) * 50 : 0;
        const pctText = f.number(Math.abs(m.pct) / 100, { style: "percent", maximumFractionDigits: 1 });
        return (
          <li key={m.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)", overflowWrap: "anywhere" }}>{m.crop}</span>
                <span
                  className="ftp-num"
                  style={{ fontSize: 14, lineHeight: "20px", whiteSpace: "nowrap", color: up ? "var(--hue-deep)" : "var(--ftp-text-2)" }}
                >
                  <span aria-hidden>{up ? "▲ " : "▼ "}</span>
                  <span className="sr-only">{up ? t("movesUp") : t("movesDown")} </span>
                  {pctText}
                </span>
              </div>
              <div
                aria-hidden
                dir="ltr"
                style={{ position: "relative", height: 10, marginTop: 5, borderRadius: "var(--ftp-radius-pill)", background: "var(--hue-tint)" }}
              >
                <span
                  className="ftp-grow-x"
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: up ? "50%" : `${50 - half}%`,
                    width: `${Math.max(1.5, half)}%`,
                    borderRadius: "var(--ftp-radius-pill)",
                    background: up
                      ? "linear-gradient(90deg, var(--hue), var(--hue-deep))"
                      : "linear-gradient(90deg, var(--hue-pop), color-mix(in srgb, var(--hue-pop) 55%, #fff))",
                    transformOrigin: up ? "left center" : "right center",
                    ["--i" as string]: i,
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: -3,
                    bottom: -3,
                    left: "50%",
                    width: 2,
                    marginLeft: -1,
                    borderRadius: 1,
                    background: "var(--ftp-border-strong)",
                  }}
                />
              </div>
              <div style={{ marginTop: 4, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{m.sub}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}


/**
 * MoveSplit — one bar split into the crops that went up, stayed the same
 * and went down since their previous market day, with the three counts
 * underneath (a Lucide arrow, the number, the words), so it never relies
 * on colour alone.
 */
export function MoveSplit({
  up,
  same,
  down,
  labels,
  ariaLabel,
}: {
  up: number;
  same: number;
  down: number;
  labels: { up: string; same: string; down: string };
  ariaLabel: string;
}) {
  const f = useFormat();
  const total = up + same + down;
  const parts = [
    { key: "up", n: up, label: labels.up, Icon: TrendingUp, fill: "var(--hue)" },
    { key: "same", n: same, label: labels.same, Icon: Minus, fill: "var(--hue-pop)" },
    { key: "down", n: down, label: labels.down, Icon: TrendingDown, fill: "color-mix(in srgb, var(--hue-pop) 45%, var(--ftp-surface))" },
  ];
  return (
    <figure style={{ margin: 0 }}>
      <div role="img" aria-label={ariaLabel} dir="ltr" style={{ display: "flex", height: 16, borderRadius: 999, overflow: "hidden", background: "var(--ftp-surface-2)" }}>
        {total > 0 && parts.map((p) => (p.n > 0 ? <span key={p.key} style={{ width: `${(p.n / total) * 100}%`, background: p.fill }} /> : null))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginTop: 12 }}>
        {parts.map((p) => (
          <div key={p.key} style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <p.Icon size={16} aria-hidden style={{ color: "var(--hue-deep)" }} />
              <span className="ftp-num" style={{ fontSize: 20, lineHeight: "26px", color: "var(--hue-deep)" }}>
                {f.number(p.n)}
              </span>
            </div>
            <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{p.label}</div>
          </div>
        ))}
      </div>
    </figure>
  );
}
