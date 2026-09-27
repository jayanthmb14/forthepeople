/**
 * SuperCategoryHero — hero for /[locale]/india/category/<slug>.
 *
 * File 45 §4 Level 2, Design v4: a hue band with the category emoji, the
 * module count, title and tagline; a status ring (how many of the modules
 * are live — counted from the registry, the same numbers the left rail
 * and the footer note use); and up to three headline figures.
 *
 * Honesty (Sep 2026): the KPI tiles used to print each module's registry
 * `headlineMetric.mockValue` with a "Published" chip. They now show real
 * IndiaIndicator rows only (date + source on each tile) and disappear when
 * no module in the category has one.
 *
 * Server component; strings arrive translated from the page.
 */

import * as React from "react";
import { StatTile, StatStrip } from "@/components/district/ui";
import type { HeroTile } from "@/components/india/module-page/ModuleHero";

export interface SuperCategoryHeroProps {
  emoji: string;
  title: string;
  tagline: string;
  countLabel: string;
  counts: { total: number; live: number; soon: number };
  ring: { label: string; live: string; legendLive: string; legendSoon: string };
  figuresTitle: string;
  tiles: HeroTile[];
}

export function SuperCategoryHero({ emoji, title, tagline, countLabel, counts, ring, figuresTitle, tiles }: SuperCategoryHeroProps) {
  const size = 132;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const livePct = counts.total > 0 ? counts.live / counts.total : 0;

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "var(--ftp-radius-card)",
        border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
        background:
          "radial-gradient(110% 90% at 100% 0%, color-mix(in srgb, var(--hue-pop) 32%, transparent) 0%, transparent 55%), linear-gradient(135deg, var(--hue-tint) 0%, #fff 72%)",
        boxShadow: "var(--ftp-shadow-1)",
        padding: "clamp(18px, 3vw, 28px)",
        marginBottom: "1.5rem",
      }}
    >
      <span aria-hidden className="ftp-emoji" style={{ position: "absolute", right: -18, bottom: -36, fontSize: 170, opacity: 0.08, transform: "rotate(-10deg)", pointerEvents: "none" }}>
        {emoji}
      </span>

      <div className="sc-hero-grid" style={{ position: "relative" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 52, height: 52, fontSize: 28, borderRadius: 16, background: "#fff", boxShadow: "var(--ftp-shadow-1)" }}>
              {emoji}
            </span>
            <span
              style={{
                display: "inline-flex",
                padding: "3px 10px",
                borderRadius: 999,
                background: "#fff",
                border: "1px solid color-mix(in srgb, var(--hue) 28%, var(--ftp-border))",
                color: "var(--hue-deep)",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {countLabel}
            </span>
          </div>
          <h1 className="ftp-display" style={{ fontSize: "clamp(28px, 4.2vw, 40px)", fontWeight: 650, margin: "0 0 8px", lineHeight: 1.12 }}>
            {title}
          </h1>
          <p style={{ fontSize: 15, lineHeight: "24px", color: "var(--ftp-text-2)", margin: 0, maxWidth: 680 }}>{tagline}</p>
        </div>

        <figure style={{ margin: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div className="ftp-pop" role="img" aria-label={ring.label} style={{ position: "relative", width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="color-mix(in srgb, var(--hue) 16%, #fff)" strokeWidth={stroke} />
              <circle
                className="ftp-draw-path"
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="var(--hue)"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c * (1 - livePct)}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ ["--len" as string]: c }}
              />
            </svg>
            <span style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span className="ftp-bignum" style={{ fontSize: 30, lineHeight: "32px", color: "var(--hue-deep)" }}>
                {counts.live}/{counts.total}
              </span>
              <span style={{ fontSize: 12, color: "var(--ftp-text-2)" }}>{ring.live}</span>
            </span>
          </div>
          <figcaption style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--ftp-text-2)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span aria-hidden style={{ width: 10, height: 10, borderRadius: 3, background: "var(--hue)" }} />
              {ring.legendLive} {counts.live}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span aria-hidden style={{ width: 10, height: 10, borderRadius: 3, background: "color-mix(in srgb, var(--hue) 16%, #fff)", border: "1px solid color-mix(in srgb, var(--hue) 30%, #fff)" }} />
              {ring.legendSoon} {counts.soon}
            </span>
          </figcaption>
        </figure>
      </div>

      {tiles.length > 0 && (
        <div style={{ position: "relative", marginTop: 20 }}>
          <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "var(--hue-deep)" }}>{figuresTitle}</p>
          <StatStrip cols={tiles.length >= 3 ? 3 : 2}>
            {tiles.map((k) => (
              <StatTile key={k.key} label={k.label} value={k.value} unit={k.unit || undefined} emoji={k.emoji} asOf={k.asOf} source={k.source} />
            ))}
          </StatStrip>
        </div>
      )}

      <style>{`
        .sc-hero-grid { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 24px; align-items: center; }
        @media (max-width: 640px) { .sc-hero-grid { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
    </section>
  );
}

export default SuperCategoryHero;
