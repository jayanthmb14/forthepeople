"use client";

// Source line at the bottom of every Population chart card:
//   Source name ↗ · Ref year 2011 · [age pill] · licence · Retrieved 2026-04-23 · Boundary …
// Design v3: no nested tinted box — a hairline border separates it from
// the chart above. The source name is a mono link like the kit's
// SourcePill, composed inline because SourcePill never wraps and long
// Census source names must wrap at 375 px instead of scrolling sideways.
import { Database, ExternalLink } from "lucide-react";
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

/** Middle-dot separator between items. */
function Dot() {
  return <span aria-hidden style={{ color: "var(--ftp-border-strong)" }}>·</span>;
}

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
        gap: 6,
      }}
    >
      <Database size={14} aria-hidden style={{ flexShrink: 0 }} />
      <span className="sr-only">Source:</span>
      {sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ftp-num"
          style={{ color: "var(--ftp-text)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, overflowWrap: "anywhere" }}
        >
          {source}
          <ExternalLink size={11} aria-hidden style={{ flexShrink: 0 }} />
        </a>
      ) : (
        <span className="ftp-num" style={{ color: "var(--ftp-text)", overflowWrap: "anywhere" }}>{source}</span>
      )}
      <Dot />
      <span>
        Ref year <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{referenceYear}</span>
      </span>
      <DataAgeChip referenceYear={referenceYear} />
      {license && (
        <>
          <Dot />
          <span title={`Licence: ${license}`}>{license}</span>
        </>
      )}
      <Dot />
      <span>
        Retrieved <span className="ftp-num" suppressHydrationWarning>{formatDate(retrievedAt)}</span>
      </span>
      {boundaryVintage && (
        <>
          <Dot />
          <span>Boundary: {boundaryVintage}</span>
        </>
      )}
    </div>
  );
}
