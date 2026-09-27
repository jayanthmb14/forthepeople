/**
 * RelevantNewsSection — file 45 §5 standard pattern.
 *
 * Phase 4: queries IndiaModuleNews; if empty, returns null (hide entire
 * section, per file 45 §10 empty-state rule). Phase 5 will populate via
 * ingestion pipeline.
 */

import * as React from "react";
import { prisma } from "@/lib/db";
import { SourcePill, type SourcePillVariant } from "@/components/india/primitives/SourcePill";

export interface RelevantNewsSectionProps {
  moduleSlug: string;
  isSensitiveModule?: boolean;
  className?: string;
}

function pillVariant(sourceTier: string): SourcePillVariant {
  if (sourceTier === "tier_1_government") return "gov";
  if (sourceTier === "tier_2_major") return "major-outlet";
  return "specialist";
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export async function RelevantNewsSection({
  moduleSlug,
  className,
}: RelevantNewsSectionProps) {
  const news = await prisma.indiaModuleNews.findMany({
    where: { moduleSlug, status: "active" },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  if (news.length === 0) {
    return null;
  }

  return (
    <section className={className} style={{ marginTop: "2rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "12px" }}>
        <h2
          style={{
            fontFamily: "var(--ftp-font-display)",
            fontSize: "20px",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          📰 Relevant news
        </h2>
        <span
          style={{
            fontSize: "11px",
            background: "rgba(60, 52, 137, 0.10)",
            color: "#3C3489",
            padding: "1px 6px",
            borderRadius: "3px",
            fontWeight: 600,
          }}
        >
          AI summaries
        </span>
      </div>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "12px" }}>
        {news.map((n) => (
          <li
            key={n.id}
            style={{
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-md)",
              padding: "14px 16px",
              background: "var(--color-surface)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <SourcePill domain={domainOf(n.sourceUrl) || n.source} variant={pillVariant(n.sourceTier)} />
              <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                {new Date(n.publishedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <h3 style={{ fontSize: "14px", fontWeight: 500, margin: "0 0 4px", lineHeight: 1.4 }}>
              {n.headline}
            </h3>
            <p
              style={{
                fontSize: "12px",
                color: "var(--color-text-secondary)",
                lineHeight: 1.5,
                margin: "0 0 8px",
              }}
            >
              {n.summary}
            </p>
            <a
              href={n.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "12px", color: "var(--color-text-info)", fontWeight: 500 }}
            >
              Read original at {domainOf(n.sourceUrl)}
            </a>
          </li>
        ))}
      </ul>

      <div
        style={{
          marginTop: "12px",
          padding: "10px 12px",
          fontSize: "11px",
          color: "var(--color-text-tertiary)",
          background: "rgba(60, 52, 137, 0.05)",
          borderLeft: "3px solid #3C3489",
          borderRadius: "var(--border-radius-md)",
        }}
      >
        About these summaries. AI-generated for quick context. Not the original article.
        Follow source links to read full reporting. ForThePeople is not the author of the
        original news.
      </div>
    </section>
  );
}

export default RelevantNewsSection;
