/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — a labelled row of filter buttons.
 * Extracted from infrastructure/page.tsx (no behaviour change).
 */



export default function FilterRow({
  label, options, value, onChange,
}: {
  label: string;
  options: Array<{ id: string; label: string; count: number }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 10, color: "#9B9B9B", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </span>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              onClick={() => onChange(o.id)}
              style={{
                padding: "4px 10px", fontSize: 11, fontWeight: 600, borderRadius: 20,
                background: active ? "#2563EB" : "#F5F5F0",
                color: active ? "#FFF" : "#6B6B6B",
                border: active ? "1px solid #2563EB" : "1px solid #E8E8E4",
                cursor: "pointer",
              }}
            >
              {o.label} ({o.count})
            </button>
          );
        })}
      </div>
    </div>
  );
}
