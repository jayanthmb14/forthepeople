"use client";

// Sex ratio (females per 1,000 males) on a flat 700–1,100 scale with
// reference marks at 900, 950 and 1,000 (parity). Design v3: no gradient —
// the track is a flat surface and the marker is the text colour.
import { type ProfileLike } from "../types";
import { ChartEmpty, ChartNote } from "../chartKit";

interface Props {
  sexRatio?: number | null;
  childSexRatio?: number | null;
}

export function canRenderSexRatioGauge(profile: ProfileLike | null | undefined): boolean {
  return typeof profile?.sexRatio === "number";
}

const MIN = 700;
const MAX = 1100;
const MARKS = [900, 950, 1000];

/** Position of a value on the scale, in percent (0–100). */
function toPct(v: number): number {
  const clamped = Math.max(MIN, Math.min(MAX, v));
  return ((clamped - MIN) / (MAX - MIN)) * 100;
}

function Track({ ratio, label }: { ratio: number; label: string }) {
  const pct = toPct(ratio);
  // Scale labels sit exactly under their marks (absolute positions).
  const scaleLabels = [
    { v: MIN, text: String(MIN) },
    ...MARKS.map((m) => ({ v: m, text: m === 1000 ? "1000 parity" : String(m) })),
    { v: MAX, text: String(MAX) },
  ];
  return (
    <div style={{ margin: "12px 0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", fontSize: 11, color: "var(--ftp-text-2)", marginBottom: 6 }}>
        <span>{label}</span>
        <span>
          <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{ratio}</span> females / 1,000 males
        </span>
      </div>
      <div
        role="img"
        aria-label={`${label}: ${ratio} females per 1,000 males`}
        style={{ position: "relative", height: 12, background: "var(--ftp-surface-2)", borderRadius: 6 }}
      >
        {MARKS.map((m) => (
          <div
            key={m}
            title={`${m}`}
            style={{
              position: "absolute",
              top: -2,
              left: `calc(${toPct(m)}% - 0.5px)`,
              width: 1,
              height: 16,
              background: "var(--ftp-border-strong)",
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            top: -3,
            left: `calc(${pct}% - 4px)`,
            width: 8,
            height: 18,
            background: "var(--ftp-text)",
            borderRadius: 2,
          }}
        />
      </div>
      <div aria-hidden style={{ position: "relative", height: 16, marginTop: 4 }}>
        {scaleLabels.map((s, i) => (
          <span
            key={s.v}
            className="ftp-num"
            style={{
              position: "absolute",
              left: `${toPct(s.v)}%`,
              // First label hugs the left edge, last hugs the right, the rest centre on the mark.
              transform: i === 0 ? "none" : i === scaleLabels.length - 1 ? "translateX(-100%)" : "translateX(-50%)",
              fontSize: 10,
              fontWeight: 400,
              color: "var(--ftp-text-2)",
              whiteSpace: "nowrap",
            }}
          >
            {s.text}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SexRatioGauge({ sexRatio, childSexRatio }: Props) {
  if (typeof sexRatio !== "number") {
    return <ChartEmpty message="The sex ratio is not available for this district yet." />;
  }
  return (
    <div>
      <Track ratio={sexRatio} label="Sex ratio (all ages)" />
      {typeof childSexRatio === "number" && (
        <>
          <Track ratio={childSexRatio} label="Child sex ratio (0–6)" />
          <ChartNote>
            * Published in the public interest. See the &quot;Child sex ratio (PCPNDT Act
            context)&quot; section of the disclosure panel.
          </ChartNote>
        </>
      )}
    </div>
  );
}
