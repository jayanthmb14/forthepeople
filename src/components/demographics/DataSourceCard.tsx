"use client";

// Source line at the bottom of every Population chart card:
//   [Source name ↗] [Reference year 2011] [age pill] [licence] [Retrieved 2026-04-23] [Boundary …]
// Design v4: separate small items with space between them (no middle-dot
// string). A hairline border separates it from the chart above. The source
// name is a pill-style link like the kit's SourcePill, composed here because
// SourcePill never wraps and long Census source names must wrap at 375 px
// instead of scrolling sideways.
import { ExternalLink } from "lucide-react";
import DataAgeChip from "./DataAgeChip";

interface DataSourceCardProps {
  source: string;
  sourceUrl?: string;
  license?: string;
  referenceYear: number;
  retrievedAt: Date;
  boundaryVintage?: string;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
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
      <span className="sr-only">Source:</span>
      {sourceUrl ? (
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" style={SOURCE_PILL}>
          {source}
          <ExternalLink size={11} aria-hidden style={{ flexShrink: 0, color: "var(--hue)" }} />
        </a>
      ) : (
        <span style={SOURCE_PILL}>{source}</span>
      )}
      <span>
        Reference year <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{referenceYear}</span>
      </span>
      <DataAgeChip referenceYear={referenceYear} />
      {license && <span title={`Licence: ${license}`}>{license}</span>}
      <span>
        Retrieved <span className="ftp-num" suppressHydrationWarning>{formatDate(retrievedAt)}</span>
      </span>
      {boundaryVintage && <span>Boundary: {boundaryVintage}</span>}
    </div>
  );
}
