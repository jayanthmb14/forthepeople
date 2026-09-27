/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Consolidated sources panel on the module deep-dive page. Lists every
 * source the module cites with type + refresh + URL.
 */

import Link from "next/link";
import type { IndiaModuleDef } from "@/lib/india/india-modules";
import { INDIA_DESIGN } from "@/lib/india/india-design";
import { INDIA_SOURCES } from "@/lib/india/india-sources";
import { IndiaSectionTitle } from "./v4";

interface Props {
  module: IndiaModuleDef;
}

export default function ModuleSourcePanel({ module }: Props) {
  return (
    <section
      style={{
        padding: "28px 16px",
        borderBottom: `1px solid ${INDIA_DESIGN.border}`,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <IndiaSectionTitle emoji="📚">Sources for {module.title}</IndiaSectionTitle>
        <div
          style={{
            background: INDIA_DESIGN.bgCard,
            border: `1px solid ${INDIA_DESIGN.border}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {module.sources.map((s, idx) => {
            const src = INDIA_SOURCES[s.sourceKey];
            if (!src) return null;
            return (
              <div
                key={s.sourceKey}
                style={{
                  padding: "12px 16px",
                  borderTop: idx === 0 ? "none" : `1px solid ${INDIA_DESIGN.border}`,
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 2fr) 100px 100px",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div>
                  <Link
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: INDIA_DESIGN.accentBlue,
                      textDecoration: "none",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    {src.name}
                  </Link>
                  {src.blurb ? (
                    <div
                      style={{
                        fontSize: 11,
                        color: INDIA_DESIGN.textFaint,
                        marginTop: 2,
                        lineHeight: 1.4,
                      }}
                    >
                      {src.blurb}
                    </div>
                  ) : null}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: INDIA_DESIGN.textMuted,
                    fontFamily: "var(--ftp-font-sans)",
                  }}
                >
                  {s.type}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: INDIA_DESIGN.textMuted,
                  }}
                >
                  {s.refresh}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
