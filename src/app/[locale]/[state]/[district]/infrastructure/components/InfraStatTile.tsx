/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — small stat tile used in the stats row.
 * Extracted from infrastructure/page.tsx (no behaviour change).
 */



export default function StatTile({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontSize: 10, color: "#9B9B9B", marginBottom: 4, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-mono)", color: color ?? "#1A1A1A" }}>{value}</div>
    </div>
  );
}
