/**
 * SourcesCard — source list with freshness dots + discrepancy disclosure
 * + a link to the public update log. Authenticity moves #2, #3, #6, #7
 * (file 45 §6).
 *
 * The "source sync history" link used to point at /en/india/data-sources,
 * a route that does not exist (and ignored the page language). It now
 * opens the India update log in the reader's language.
 */

import * as React from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import type { IndiaModuleDef } from "@/lib/india/india-modules";
import { SourceHealthDot, type ScraperCadence } from "@/components/india/primitives/SourceHealthDot";
import { SourcePill } from "@/components/india/primitives/SourcePill";
import { INDIA_SOURCES } from "@/lib/india/india-sources";
import { domainOf } from "@/components/india/format";
import { Glyph } from "@/components/graphics";

export interface SourcesCardProps {
  module: IndiaModuleDef;
  locale: string;
  expectedCadence?: ScraperCadence;
  className?: string;
}

interface ConflictingSource {
  source: string;
  url: string;
  value: number | string;
  asOfDate?: string;
}

export async function SourcesCard({ module, locale, expectedCadence = "annual", className }: SourcesCardProps) {
  const t = await getTranslations({ locale, namespace: "page_india-module" });

  // If any indicator on this module records disagreeing sources, say so.
  let conflicts: ConflictingSource[] | null = null;
  try {
    const indicators = await prisma.indiaIndicator.findMany({
      where: { moduleSlug: module.slug },
      select: { conflictingSources: true },
    });
    const any = indicators.find((i) => i.conflictingSources && Array.isArray(i.conflictingSources));
    conflicts = (any?.conflictingSources ?? null) as ConflictingSource[] | null;
  } catch {
    conflicts = null;
  }

  return (
    <section
      className={className}
      style={{
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
        boxShadow: "var(--ftp-shadow-1)",
        padding: "18px 20px",
        marginTop: "1.5rem",
      }}
    >
      <h2 className="ftp-h2" style={{ fontSize: 20, lineHeight: "26px", display: "flex", alignItems: "center", gap: 10, margin: "0 0 8px" }}>
        <span className="ftp-icon-chip" aria-hidden style={{ width: 32, height: 32, borderRadius: 10 }}>
          <Glyph name="book" size={19} />
        </span>
        {t("data.sources")}
      </h2>

      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {module.sources.map((s, i) => {
          const meta = INDIA_SOURCES[s.sourceKey];
          const name = meta?.name ?? s.sourceKey;
          const url = meta?.url ?? "";
          return (
            <li
              key={s.sourceKey}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                borderTop: i === 0 ? "none" : "1px solid var(--ftp-border)",
                fontSize: 13,
                flexWrap: "wrap",
              }}
            >
              <SourceHealthDot
                locale={locale}
                scraperKey={module.scraperKeys[i] ?? `${module.slug}-no-source-sync`}
                expectedCadence={expectedCadence}
                size="medium"
              />
              <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--ftp-text)" }}>{name}</div>
                <div style={{ color: "var(--ftp-text-2)", marginTop: 2, fontSize: 12 }}>
                  {t("data.cadenceLine", { refresh: t(`sources.refresh.${s.refresh}`), type: t(`sources.type.${s.type}`) })}
                </div>
              </div>
              <SourcePill domain={url ? domainOf(url) : s.sourceKey} url={url || undefined} variant="gov" />
            </li>
          );
        })}
      </ul>

      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid var(--ftp-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 12,
          color: "var(--ftp-text-2)",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span>
          {t("data.differ")}{" "}
          <span style={{ fontWeight: 600, color: conflicts && conflicts.length > 0 ? "#B91C1C" : "#15803D" }}>
            {conflicts && conflicts.length > 0 ? t("data.differYes", { n: conflicts.length }) : t("data.differNo")}
          </span>
        </span>
        <Link href={`/${locale}/india/updates`} style={{ color: "var(--hue-deep)", fontWeight: 600 }}>
          {t("data.updateLog")}
        </Link>
      </div>
    </section>
  );
}

export default SourcesCard;
