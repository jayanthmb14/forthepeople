/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Sub-features queued for this module's deep-dive page. Each item
 * gets a "Vote to prioritise" link that prefills the main /en/india
 * suggestion form with the feature title.
 */

import Link from "next/link";
import {
  getModuleComingSoonFeatures,
  type IndiaModuleDef,
} from "@/lib/india/india-modules";
import { CATEGORY_ACCENT, INDIA_DESIGN, categoryTint } from "@/lib/india/india-design";

interface Props {
  locale: string;
  module: IndiaModuleDef;
}

export default function ModuleComingSoonRail({ locale, module }: Props) {
  const features = getModuleComingSoonFeatures(module);
  if (features.length === 0) return null;
  const accent = CATEGORY_ACCENT[module.category];
  const tint = categoryTint(module.category);

  return (
    <section
      style={{
        padding: "28px 16px",
        borderBottom: `1px solid ${INDIA_DESIGN.border}`,
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
          Coming soon — {module.title}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 10,
          }}
        >
          {features.map((feature) => (
            <div
              key={feature}
              style={{
                background: INDIA_DESIGN.bgCard,
                border: `1px dashed ${INDIA_DESIGN.border}`,
                borderRadius: 10,
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: accent,
                  background: tint,
                  border: `1px solid ${accent}33`,
                  borderRadius: 999,
                  padding: "2px 8px",
                  alignSelf: "flex-start",
                }}
              >
                Sub-feature
              </span>
              <div
                style={{
                  fontSize: 13,
                  color: INDIA_DESIGN.textPrimary,
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                {feature}
              </div>
              <Link
                href={`/${locale}/india#india-vote`}
                data-prefill={`${module.title}: ${feature}`}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: INDIA_DESIGN.accentBlue,
                  textDecoration: "none",
                  marginTop: 2,
                  alignSelf: "flex-start",
                }}
              >
                Vote to prioritise →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
