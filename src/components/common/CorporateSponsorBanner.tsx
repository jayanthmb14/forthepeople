/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

interface Props {
  districtName: string;
  population?: number | null;
}

function formatPop(pop: number | null | undefined): string {
  if (!pop || pop <= 0) return "every citizen";
  if (pop >= 10_000_000) return `${(pop / 10_000_000).toFixed(1)} crore citizens`;
  if (pop >= 100_000) return `${(pop / 100_000).toFixed(1)} lakh citizens`;
  return `${pop.toLocaleString("en-IN")} citizens`;
}

export default function CorporateSponsorBanner({ districtName, population }: Props) {
  const popText = formatPop(population);
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)",
        border: "2px dashed #93C5FD",
        borderRadius: 16,
        padding: "22px 24px",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#1E40AF",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span>🏢</span>
        <span>Sponsor This District</span>
      </div>

      <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 6, lineHeight: 1.4 }}>
        Want to showcase your business to {districtName}&apos;s citizens?
      </div>
      <div style={{ fontSize: 13, color: "#4B4B4B", lineHeight: 1.7, marginBottom: 14 }}>
        Display your brand banner on this page and support free government data for{" "}
        <strong style={{ color: "#1A1A1A" }}>{popText}</strong>.
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <a
          href="mailto:support@forthepeople.in?subject=Corporate%20Sponsorship%20Enquiry"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 16px",
            background: "#2563EB",
            color: "#fff",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          📧 support@forthepeople.in
        </a>
        <a
          href="https://www.instagram.com/forthepeople_in/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 16px",
            background: "#fff",
            color: "#1E40AF",
            border: "1px solid #BFDBFE",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          📱 @forthepeople_in
        </a>
      </div>

      <div style={{ fontSize: 11, color: "#6B6B6B", lineHeight: 1.6 }}>
        Open to all Indian businesses — private, public, or startups.<br />
        Pricing discussed individually based on district reach and duration.
      </div>
    </div>
  );
}
