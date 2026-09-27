"use client";

// Source line at the bottom of every Population chart card:
//   [Source name ↗] [Reference year 2011] [age pill] [licence] [Retrieved 23 Apr 2026] [Boundary …]
// Design v4: separate small items with space between them (no middle-dot
// string). A hairline border separates it from the chart above. The source
// name is a pill-style link like the kit's SourcePill, composed here because
// SourcePill never wraps and long Census source names must wrap at 375 px
// instead of scrolling sideways. Words: page_population.source.*; the
// retrieval date follows the page language.
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormat } from "@/i18n/client";
import DataAgeChip from "./DataAgeChip";

interface DataSourceCardProps {
  source: string;
  sourceUrl?: string;
  license?: string;
  referenceYear: number;
  retrievedAt: Date;
  boundaryVintage?: string;
}

/** The source name as a bordered pill that may wrap onto two lines. */
const SOURCE_PILL: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "3px 10px",
  borderRadius: 12,
  border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
  background: "var(--ftp-surface)",
  color: "var(--ftp-text)",
  fontWeight: 600,
  textDecoration: "none",
  overflowWrap: "anywhere",
};

export default function DataSourceCard({
  source,
  sourceUrl,
  license,
  referenceYear,
  retrievedAt,
  boundaryVintage,
}: DataSourceCardProps) {
  const t = useTranslations("page_population.source");
  const f = useFormat();
  const num = (c: React.ReactNode) => <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{c}</span>;
  return (
    <div
      style={{
        borderTop: "1px solid var(--ftp-border)",
        paddingTop: 10,
        marginTop: 12,
        fontSize: 11,
        lineHeight: "16px",
        color: "var(--ftp-text-2)",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "6px 12px",
      }}
    >
      <span className="sr-only">{t("sr")}</span>
      {sourceUrl ? (
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" style={SOURCE_PILL}>
          {source}
          <ExternalLink size={11} aria-hidden style={{ flexShrink: 0, color: "var(--hue)" }} />
        </a>
      ) : (
        <span style={SOURCE_PILL}>{source}</span>
      )}
      <span>{t.rich("referenceYear", { year: String(referenceYear), n: num })}</span>
      <DataAgeChip referenceYear={referenceYear} />
      {license && <span title={t("licence", { licence: license })}>{license}</span>}
      <span suppressHydrationWarning>
        {t.rich("retrieved", {
          date: f.date(retrievedAt, { day: "numeric", month: "short", year: "numeric" }),
          n: (c) => <span className="ftp-num">{c}</span>,
        })}
      </span>
      {boundaryVintage && <span>{t("boundary", { v: boundaryVintage })}</span>}
    </div>
  );
}
