/**
 * SourcesCard — source list with freshness dots + discrepancy disclosure
 * + source-sync history link. Authenticity moves #2, #3, #6, #7 (file 45 §6).
 */

import * as React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import type { IndiaModuleDef } from "@/lib/india/india-modules";
import {
  SourceHealthDot,
  type ScraperCadence,
} from "@/components/india/primitives/SourceHealthDot";
import { SourcePill } from "@/components/india/primitives/SourcePill";
import { INDIA_SOURCES } from "@/lib/india/india-sources";

export interface SourcesCardProps {
  module: IndiaModuleDef;
  expectedCadence?: ScraperCadence;
  className?: string;
}

interface ConflictingSource {
  source: string;
  url: string;
  value: number | string;
  asOfDate?: string;
}

export async function SourcesCard({
  module,
  expectedCadence = "annual",
  className,
}: SourcesCardProps) {
  // Pull conflictingSources from any indicator on this module — if any has
  // discrepancies, surface them on the card footer.
  const indicators = await prisma.indiaIndicator.findMany({
    where: { moduleSlug: module.slug },
    select: { conflictingSources: true },
  });
  const anyConflict = indicators.find(
    (i) => i.conflictingSources && Array.isArray(i.conflictingSources),
  );
  const conflicts = (anyConflict?.conflictingSources ?? null) as ConflictingSource[] | null;

  return (
    <section
      className={className}
      style={{
        background: "var(--color-surface)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "18px 22px",
        marginTop: "1.5rem",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--ftp-font-display)",
          fontSize: "20px",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          margin: "0 0 12px",
        }}
      >
        Sources
      </h2>

      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {module.sources.map((s, i) => {
          const meta = INDIA_SOURCES[s.sourceKey];
          const name = meta?.name ?? s.sourceKey;
          const url = meta?.url ?? "";
          const domain = url
            ? (() => {
                try {
                  return new URL(url).hostname.replace(/^www\./, "");
                } catch {
                  return s.sourceKey;
                }
              })()
            : s.sourceKey;

          return (
            <li
              key={s.sourceKey}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 0",
                borderTop: i === 0 ? "none" : "0.5px solid var(--color-border-tertiary)",
                fontSize: "12px",
              }}
            >
              <SourceHealthDot
                scraperKey={module.scraperKeys[i] ?? `${module.slug}-no-source-sync`}
                expectedCadence={expectedCadence}
                size="medium"
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{name}</div>
                <div style={{ color: "var(--color-text-tertiary)", marginTop: "2px" }}>
                  {s.refresh} cadence · {s.type}
                </div>
              </div>
              <SourcePill domain={domain} url={url || undefined} variant="gov" />
            </li>
          );
        })}
      </ul>

      <div
        style={{
          marginTop: "12px",
          paddingTop: "12px",
          borderTop: "0.5px solid var(--color-border-tertiary)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "11px",
          color: "var(--color-text-tertiary)",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <span>
          Sources differ?{" "}
          <span style={{ color: conflicts && conflicts.length > 0 ? "#A32D2D" : "#16A34A" }}>
            {conflicts && conflicts.length > 0
              ? `${conflicts.length} sources differ`
              : "No discrepancies"}
          </span>
        </span>
        <Link
          href="/en/india/data-sources"
          style={{ color: "var(--color-text-info)" }}
        >
          Source sync history ›
        </Link>
      </div>
    </section>
  );
}

export default SourcesCard;
