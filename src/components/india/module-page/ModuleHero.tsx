/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Module deep-dive hero: SVG illustration (Phase 2.5d sets the real
 * SVG library; this phase falls back to a Lucide icon with a
 * data-testid="module-hero-svg-fallback" attribute so Jayanth can
 * grep + swap later) + title + tagline + 3-6 headline KPI cards.
 *
 * MOCK DATA — replace in Session C1 (the 6 KPI cards are seeded from
 * mock-state-data; production reads from IndiaIndicator).
 */

import type { IndiaModuleDef } from "@/lib/india/india-modules";
import { CATEGORY_ACCENT, INDIA_DESIGN, categoryTint } from "@/lib/india/india-design";
import ModuleHeroIcon from "./ModuleHeroIcon";

interface Props {
  module: IndiaModuleDef;
}

interface KpiSeed {
  label: string;
  value: string;
  unit?: string;
}

function deriveHeadlineKpis(module: IndiaModuleDef): KpiSeed[] {
  // Module-aware: read headlineMetric off the registry. The registry is
  // the contract — if a module declares its own headline KPI, it shows
  // exactly that, never a category-fallback (which is how the tigers page
  // ended up showing "Forest Cover" instead of tiger population).
  const m = module.headlineMetric;
  if (!m) return [];
  return [
    {
      label: m.label,
      value: m.mockValue.toLocaleString("en-IN", { maximumFractionDigits: 2 }),
      unit: m.mockUnit,
    },
  ];
}

export default function ModuleHero({ module }: Props) {
  const accent = CATEGORY_ACCENT[module.category];
  const tint = categoryTint(module.category);
  const kpis = deriveHeadlineKpis(module);

  return (
    <section
      style={{
        padding: "32px 16px 24px",
        borderBottom: `1px solid ${INDIA_DESIGN.border}`,
        background: INDIA_DESIGN.bgPage,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 240px",
          gap: 32,
          alignItems: "center",
        }}
        className="india-module-hero-grid"
      >
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: "capitalize",
              color: accent,
              marginBottom: 6,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 10px",
              borderRadius: 999,
              background: tint,
              border: `1px solid ${accent}33`,
            }}
          >
            <span aria-hidden="true">{module.icon}</span>
            {module.category}
          </div>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: INDIA_DESIGN.textPrimary,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              margin: "8px 0 6px",
              fontFamily: INDIA_DESIGN.fontDisplay,
            }}
          >
            {module.title}
          </h1>
          <p
            style={{
              fontSize: 15,
              color: INDIA_DESIGN.textSecondary,
              lineHeight: 1.55,
              margin: "0 0 18px",
              maxWidth: 580,
            }}
          >
            {module.description}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10,
            }}
          >
            {kpis.map((k) => (
              <div
                key={k.label}
                style={{
                  background: INDIA_DESIGN.bgCard,
                  border: `1px solid ${INDIA_DESIGN.border}`,
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: INDIA_DESIGN.textMuted,
                  }}
                >
                  {k.label}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 650,
                    color: "var(--hue-deep)",
                    fontFamily: INDIA_DESIGN.fontDisplay,
                    fontVariantNumeric: "tabular-nums lining-nums",
                    letterSpacing: "-0.02em",
                    marginTop: 2,
                  }}
                >
                  {k.value}
                  {k.unit ? (
                    <span
                      style={{
                        fontSize: 11,
                        color: INDIA_DESIGN.textMuted,
                        marginLeft: 3,
                      }}
                    >
                      {k.unit}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <ModuleHeroSvg module={module} accent={accent} tint={tint} />
      </div>

      <style>{`
        @media (max-width: 900px) {
          .india-module-hero-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

function ModuleHeroSvg({
  module,
  accent,
  tint,
}: {
  module: IndiaModuleDef;
  accent: string;
  tint: string;
}) {
  // Photograph wins when set (Wikimedia CC, PIB-released, etc.); otherwise
  // a Lucide icon picked by module.slug — no more cartoon-dog SVG library.
  if (module.heroImage) {
    return (
      <div
        style={{
          background: tint,
          border: `1px solid ${accent}33`,
          borderRadius: 16,
          overflow: "hidden",
          aspectRatio: "1 / 1",
          maxWidth: 240,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={module.heroImage.url}
          alt={module.heroImage.alt}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  }
  return (
    <div
      style={{
        background: tint,
        border: `1px solid ${accent}33`,
        borderRadius: 16,
        padding: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        aspectRatio: "1 / 1",
        maxWidth: 240,
      }}
    >
      <ModuleHeroIcon slug={module.slug} accent={accent} size={96} />
    </div>
  );
}
