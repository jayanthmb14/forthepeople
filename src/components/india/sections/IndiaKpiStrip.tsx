/**
 * IndiaKpiStrip — five KPI tiles under the hero (file 48 §4.7.4).
 *
 * Each tile has its own accent, an emoji chip, a number that counts up
 * once (and is correct in the server HTML), one line of context and the
 * source with its year. These are reference facts with a named source and
 * year, typed here on purpose; the district count comes from the registry
 * (getPlatformFacts) — never typed by hand (it used to say "780").
 *
 * i18n (Sep 2026): labels, units and lines from page_india "kpi.*";
 * numbers formatted in the page language by CountUpNumber.
 *
 * Sync server component (useTranslations).
 */

import * as React from "react";
import { useTranslations } from "next-intl";
import { CountUpNumber } from "@/components/india/primitives/CountUpNumber";
import { getPlatformFacts } from "@/lib/platform-facts";
import { INDIA_NS } from "../i18n";

type Accent = "blue" | "forest-green" | "amber" | "indigo" | "pink";

interface KpiTileSpec {
  id: "population" | "area" | "gdp" | "states" | "languages";
  emoji: string;
  value?: number;
  decimals?: number;
  /** Two numbers shown as "{a} + {b}" (states + union territories). */
  pair?: [number, number];
  accent: Accent;
  numColor: string;
}

const ACCENT_RGB: Record<Accent, string> = {
  blue: "24, 95, 165",
  "forest-green": "90, 143, 46",
  amber: "186, 117, 23",
  indigo: "83, 74, 183",
  pink: "153, 53, 86",
};

/** Reference values (source and year are in the messages, kpi.<id>.source). */
/**
 * Reference facts also used by the page's "In simple words" line (one copy).
 * Checked 27 Sep 2026 (docs/DATA-FIXES-2026-09.md): population 1.46 bn is
 * UN WPP 2024's mid-2025 estimate (1,463,865,525); GDP 3.92 trillion USD is
 * IMF WEO April 2026 for FY 2025-26.
 */
export const INDIA_REFERENCE = { populationBillion: 1.46, states: 28, uts: 8 } as const;

const KPI_TILES: KpiTileSpec[] = [
  { id: "population", emoji: "👥", value: INDIA_REFERENCE.populationBillion, decimals: 2, accent: "blue", numColor: "#082F58" },
  { id: "area", emoji: "🗺️", value: 3.29, decimals: 2, accent: "forest-green", numColor: "#27500A" },
  { id: "gdp", emoji: "💹", value: 3.92, decimals: 1, accent: "amber", numColor: "#633806" },
  { id: "states", emoji: "🏛️", pair: [INDIA_REFERENCE.states, INDIA_REFERENCE.uts], accent: "indigo", numColor: "#26215C" },
  { id: "languages", emoji: "🗣️", value: 22, decimals: 0, accent: "pink", numColor: "#4D182A" },
];

const numStyle = (color: string): React.CSSProperties => ({
  fontFamily: "var(--ftp-font-display)",
  fontSize: "26px",
  fontWeight: 650,
  fontVariantNumeric: "tabular-nums lining-nums",
  letterSpacing: "-0.02em",
  lineHeight: 1,
  color,
});

export function IndiaKpiStrip() {
  const t = useTranslations(`${INDIA_NS}.kpi`);
  const { totalIndiaDistricts } = getPlatformFacts();

  return (
    <section aria-label={t("aria")} style={{ padding: 0 }}>
      <ul
        className="india-hero-kpi-strip"
        style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "8px" }}
      >
        {KPI_TILES.map((tile) => {
          const rgb = ACCENT_RGB[tile.accent];
          const meta = tile.id === "states" ? t("states.meta", { n: totalIndiaDistricts }) : t(`${tile.id}.meta`);
          return (
            <li
              key={tile.id}
              style={{
                border: `1px solid rgba(${rgb}, 0.22)`,
                background: `linear-gradient(135deg, rgba(${rgb}, 0.10) 0%, rgba(${rgb}, 0.02) 100%)`,
                borderRadius: "var(--ftp-radius-tile)",
                padding: "11px 13px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                minWidth: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  className="ftp-emoji"
                  aria-hidden
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 9,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    background: `rgba(${rgb}, 0.14)`,
                    flexShrink: 0,
                  }}
                >
                  {tile.emoji}
                </span>
                <span style={{ fontSize: "12px", lineHeight: "16px", color: "var(--ftp-text-2)", fontWeight: 600 }}>{t(`${tile.id}.label`)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "5px", flexWrap: "wrap", marginTop: 2 }}>
                {tile.pair ? (
                  <span style={numStyle(tile.numColor)}>{t("states.value", { a: tile.pair[0], b: tile.pair[1] })}</span>
                ) : (
                  <>
                    {tile.id === "gdp" ? <span style={numStyle(tile.numColor)}>$</span> : null}
                    <CountUpNumber target={tile.value ?? 0} decimals={tile.decimals} inlineStyle={numStyle(tile.numColor)} />
                    <span style={{ fontSize: "12px", color: "var(--ftp-text-2)" }}>{t(`${tile.id}.unit`)}</span>
                  </>
                )}
              </div>
              <div style={{ fontSize: "12px", lineHeight: "16px", color: "var(--ftp-text-2)" }}>{meta}</div>
              <span
                style={{
                  fontSize: "12px",
                  lineHeight: "15px",
                  padding: "1px 7px",
                  background: "rgba(255,255,255,0.7)",
                  border: `1px solid rgba(${rgb}, 0.18)`,
                  color: "var(--ftp-text-2)",
                  borderRadius: 999,
                  display: "inline-block",
                  marginTop: "4px",
                  width: "fit-content",
                }}
              >
                {t(`${tile.id}.source`)}
              </span>
            </li>
          );
        })}
      </ul>

      <div
        style={{
          borderTop: "0.5px solid var(--color-border-tertiary)",
          borderBottom: "0.5px solid var(--color-border-tertiary)",
          padding: "8px 4px",
          marginTop: "1rem",
          display: "flex",
          justifyContent: "space-between",
          gap: "4px 16px",
          flexWrap: "wrap",
          fontSize: "12px",
          color: "var(--color-text-secondary)",
        }}
      >
        {/* Nothing says "Live" unless the data is under 30 minutes old; these
            are yearly releases, each with its source on the tile. */}
        <span>{t("footLeft")}</span>
        <span style={{ color: "var(--color-text-tertiary)" }}>{t("footRight")}</span>
      </div>

      <style>{`
        /* v4.1: tablets get 3 per row (5 squeezed the numbers), phones 2. */
        @media (min-width: 640px) and (max-width: 1023px) {
          .india-hero-kpi-strip { grid-template-columns: repeat(6, minmax(0, 1fr)) !important; }
          .india-hero-kpi-strip > * { grid-column: span 2; }
          .india-hero-kpi-strip > :nth-child(n + 4) { grid-column: span 3; }
        }
        @media (max-width: 639px) {
          .india-hero-kpi-strip { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .india-hero-kpi-strip > :nth-child(5) { grid-column: span 2; }
        }
      `}</style>
    </section>
  );
}

export default IndiaKpiStrip;
