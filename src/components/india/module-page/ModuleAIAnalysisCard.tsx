/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * "What this data says" — the AI-authored narrative summary.
 *
 * Phase 2.5c renders MOCK ANALYSIS from mock-ai-analysis.ts. Session C1
 * replaces this with a Prisma read against IndiaAnalysis (the schema
 * model added this phase). The card UI stays identical.
 */

import Link from "next/link";
import { INDIA_DESIGN } from "@/lib/india/india-design";
import { INDIA_SOURCES } from "@/lib/india/india-sources";
import { formatAsOfDate } from "@/lib/india/india-formatters";
import { type MockAnalysis } from "@/lib/india/mock-ai-analysis";

interface Props {
  analysis: MockAnalysis;
}

export default function ModuleAIAnalysisCard({ analysis }: Props) {
  return (
    <section
      style={{
        padding: "28px 16px",
        background: INDIA_DESIGN.bgPage,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            background: INDIA_DESIGN.bgCard,
            border: `1px solid ${INDIA_DESIGN.border}`,
            borderRadius: 14,
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              fontWeight: 600,
              color: INDIA_DESIGN.textMuted,
            }}
          >
            <span aria-hidden="true">🧠</span>
            What this data says
            <span
              style={{
                marginLeft: 6,
                padding: "1px 6px",
                background: INDIA_DESIGN.amberStrip,
                color: "#92400E",
                borderRadius: 4,
                fontSize: 9,
              }}
            >
              MOCK
            </span>
          </div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: INDIA_DESIGN.textPrimary,
              margin: 0,
              lineHeight: 1.35,
              fontFamily: INDIA_DESIGN.fontDisplay,
            }}
          >
            {analysis.headline}
          </h2>
          <p
            style={{
              fontSize: 14,
              color: INDIA_DESIGN.textSecondary,
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            {analysis.body}
          </p>
          <div
            style={{
              fontSize: 11,
              color: INDIA_DESIGN.textFaint,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
              borderTop: `1px solid ${INDIA_DESIGN.border}`,
              paddingTop: 8,
              marginTop: 4,
            }}
          >
            <span>
              Authored by <strong style={{ color: INDIA_DESIGN.textMuted }}>{analysis.authoredBy}</strong>
            </span>
            <span>·</span>
            <span>Based on data as of {formatAsOfDate(analysis.asOfDate)}</span>
            {analysis.sources.length > 0 ? (
              <>
                <span>·</span>
                <span>Sources:</span>
                {analysis.sources.slice(0, 4).map((sk, i) => {
                  const src = INDIA_SOURCES[sk];
                  if (!src) return null;
                  return (
                    <span key={sk}>
                      <Link
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: INDIA_DESIGN.accentBlue,
                          textDecoration: "none",
                        }}
                      >
                        {src.name.replace(/^Ministry of /, "M/o ")}
                      </Link>
                      {i < Math.min(analysis.sources.length, 4) - 1 ? (
                        <span style={{ color: INDIA_DESIGN.textFaint }}> · </span>
                      ) : null}
                    </span>
                  );
                })}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
