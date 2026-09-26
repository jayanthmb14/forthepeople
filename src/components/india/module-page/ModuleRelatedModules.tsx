/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Cross-link card grid: 3-5 related modules at the bottom of every
 * module deep-dive page. Drives internal-link signal for SEO.
 */

import Link from "next/link";
import {
  getIndiaModuleBySlug,
  getModuleRelatedSlugs,
  type IndiaModuleDef,
} from "@/lib/india/india-modules";
import {
  CATEGORY_ACCENT,
  INDIA_DESIGN,
  categoryTint,
} from "@/lib/india/india-design";

interface Props {
  locale: string;
  module: IndiaModuleDef;
}

export default function ModuleRelatedModules({ locale, module }: Props) {
  const slugs = getModuleRelatedSlugs(module);
  const related = slugs
    .map((s) => getIndiaModuleBySlug(s))
    .filter((m): m is IndiaModuleDef => Boolean(m));

  if (related.length === 0) return null;

  return (
    <section
      style={{
        padding: "28px 16px",
        borderBottom: `1px solid ${INDIA_DESIGN.border}`,
        background: INDIA_DESIGN.bgPage,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: INDIA_DESIGN.textFaint,
            marginBottom: 10,
          }}
        >
          Related modules
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
          }}
        >
          {related.map((m) => {
            const accent = CATEGORY_ACCENT[m.category];
            const tint = categoryTint(m.category);
            return (
              <Link
                key={m.slug}
                href={`/${locale}/india/${m.slug}`}
                style={{
                  background: INDIA_DESIGN.bgCard,
                  border: `1px solid ${INDIA_DESIGN.border}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  textDecoration: "none",
                  color: INDIA_DESIGN.textPrimary,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  minHeight: 110,
                  transition: "border-color 120ms ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: tint,
                      border: `1px solid ${accent}33`,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {m.icon}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: INDIA_DESIGN.textPrimary,
                    }}
                  >
                    {m.title}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: INDIA_DESIGN.textMuted,
                    lineHeight: 1.5,
                    flex: 1,
                  }}
                >
                  {m.tagline}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: accent,
                    fontWeight: 600,
                  }}
                >
                  Open dashboard →
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
