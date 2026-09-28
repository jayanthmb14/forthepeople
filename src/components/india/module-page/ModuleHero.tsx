/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Module deep-dive hero: category and status chips, the title, the plain
 * description, the module picture (photo when the registry has one,
 * otherwise a Lucide icon on a hue tile, with the module's drawn glyph in
 * the corner), the "In simple words" line and the latest published
 * figures as StatTiles.
 *
 * Honesty (Sep 2026): the old headline tile printed the registry's
 * `headlineMetric.mockValue` as if it were published. Tiles now come only
 * from IndiaIndicator rows, each with its date and source. A module with
 * no rows shows one honest sentence instead of a number.
 *
 * v4.1: each tile opens a DetailSheet (FigureTiles) with the figure's
 * date, the value before it, the change, the kind of figure and the
 * source link.
 *
 * Server component. Every string arrives translated from ModulePage.
 */

import type { IndiaModuleDef } from "@/lib/india/india-modules";
import { CATEGORY_ACCENT } from "@/lib/india/india-design";
import { EmptyState } from "@/components/district/ui";
import { Explainer } from "@/components/district/visuals";
import { Glyph } from "@/components/graphics";
import { FigureTiles, type FigureDetail } from "../FigureSheet";
import ModuleHeroIcon from "./ModuleHeroIcon";
import { indiaModuleGlyph } from "../glyphs";

/** A plain figure tile (value + date + source) without a detail sheet. */
export interface HeroTile {
  key: string;
  label: string;
  value: string;
  unit?: string;
  emoji: string;
  asOf: string;
  source: { label: string; href?: string };
}

interface Props {
  module: IndiaModuleDef;
  title: string;
  description: string;
  categoryLabel: string;
  statusLabel: string;
  isLive: boolean;
  figures: FigureDetail[];
  figuresTitle: string;
  /** "Tap a figure to see its date, source and the figure before it." */
  tapHint: string;
  /** One plain sentence built from the real figures. */
  simple: string;
  /** Hue class for the detail sheet (it opens outside the page's hue scope). */
  hueClassName: string;
  empty: { title: string; body: string };
}

export default function ModuleHero({
  module,
  title,
  description,
  categoryLabel,
  statusLabel,
  isLive,
  figures,
  figuresTitle,
  tapHint,
  simple,
  hueClassName,
  empty,
}: Props) {
  const accent = CATEGORY_ACCENT[module.category];
  // The module's glyph, coloured by the page's category hue (v5.1: was the registry emoji).
  const glyph = indiaModuleGlyph(module.slug, module.category).glyph;
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "var(--ftp-radius-card)",
        border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
        background:
          "radial-gradient(120% 90% at 100% 0%, color-mix(in srgb, var(--hue-pop) 30%, transparent) 0%, transparent 55%), linear-gradient(135deg, var(--hue-tint) 0%, #fff 70%)",
        boxShadow: "var(--ftp-shadow-1)",
        padding: "clamp(18px, 3vw, 28px)",
      }}
    >
      <div className="india-module-hero-grid">
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            <span className="india-chip">
              <Glyph name={glyph} size={16} />
              {categoryLabel}
            </span>
            <span className={isLive ? "india-chip india-chip-live" : "india-chip india-chip-soon"}>{statusLabel}</span>
          </div>
          <h1 className="ftp-display" style={{ fontSize: "clamp(28px, 4.2vw, 40px)", lineHeight: 1.12, fontWeight: 650, margin: "0 0 8px", color: "var(--ftp-text)" }}>
            {title}
          </h1>
          <p className="ftp-prose" style={{ fontSize: 15, lineHeight: "24px", color: "var(--ftp-text-2)", margin: 0 }}>
            {description}
          </p>
        </div>
        <div className="india-module-hero-art" aria-hidden>
          {module.heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={module.heroImage.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 20 }} />
          ) : (
            <>
              <Glyph name={glyph} size={30} className="india-module-hero-emoji" />
              <ModuleHeroIcon slug={module.slug} accent={accent} size={72} />
            </>
          )}
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <Explainer>{simple}</Explainer>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "4px 12px", flexWrap: "wrap", margin: "0 0 10px" }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 650, color: "var(--hue-deep)" }}>{figuresTitle}</p>
          {figures.length > 0 ? <p style={{ margin: 0, fontSize: 13, color: "var(--ftp-text-2)" }}>{tapHint}</p> : null}
        </div>
        {figures.length > 0 ? (
          <FigureTiles figures={figures} hueClassName={hueClassName} />
        ) : (
          <EmptyState emoji="🗂️" title={empty.title} body={empty.body} />
        )}
      </div>

      <style>{`
        .india-module-hero-grid { display: grid; grid-template-columns: minmax(0, 1fr) 168px; gap: 24px; align-items: center; }
        .india-module-hero-art {
          position: relative; width: 168px; aspect-ratio: 1 / 1; border-radius: 24px;
          display: flex; align-items: center; justify-content: center;
          background: radial-gradient(circle at 30% 25%, #fff 0%, var(--hue-tint) 70%);
          border: 1px solid color-mix(in srgb, var(--hue) 25%, var(--ftp-border));
          box-shadow: var(--ftp-shadow-1);
        }
        .india-module-hero-emoji { position: absolute; top: 10px; right: 12px; }
        .india-chip {
          display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px 3px 8px; border-radius: 999px;
          background: #fff; border: 1px solid color-mix(in srgb, var(--hue) 28%, var(--ftp-border));
          color: var(--hue-deep); font-size: 12px; line-height: 18px; font-weight: 600;
        }
        .india-chip-live { background: var(--ftp-live-tint); border-color: color-mix(in srgb, var(--ftp-live) 35%, #fff); color: var(--ftp-live-text); }
        .india-chip-soon { background: var(--ftp-warn-tint); border-color: color-mix(in srgb, var(--ftp-warn) 35%, #fff); color: var(--ftp-warn); }
        @media (max-width: 639px) {
          .india-module-hero-grid { grid-template-columns: minmax(0, 1fr); }
          .india-module-hero-art { display: none; }
        }
      `}</style>
    </section>
  );
}
