"use client";

// Male vs female literacy as a "dumbbell": two dots on a 0–100 % track with
// a line between them showing the gap. Dot colours are the Okabe-Ito male /
// female pair from ../types (colour-blind safe); the track, line and text
// use design tokens.
import { SEX_COLORS, type ProfileLike } from "../types";
import { ChartEmpty, ChartNote } from "../chartKit";

interface Props {
  literacyTotal?: number | null;
  literacyMale?: number | null;
  literacyFemale?: number | null;
  stateRef?: number | null;
  nationalRef?: number | null;
}

export function canRenderLiteracyDumbbell(profile: ProfileLike | null | undefined): boolean {
  return (
    typeof profile?.literacyMale === "number" &&
    typeof profile?.literacyFemale === "number"
  );
}

/** Legend entry: 10 px dot + label + mono value. */
function Key({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span aria-hidden style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
      {label}
      <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{value.toFixed(1)}%</span>
    </span>
  );
}

export default function LiteracyDumbbell({
  literacyTotal,
  literacyMale,
  literacyFemale,
  stateRef,
  nationalRef,
}: Props) {
  if (typeof literacyMale !== "number" || typeof literacyFemale !== "number") {
    return <ChartEmpty message="The literacy breakdown is not available for this district yet." />;
  }

  const min = Math.min(literacyMale, literacyFemale);
  const max = Math.max(literacyMale, literacyFemale);

  // One dot on the track, positioned at `pct` percent.
  const dot = (pct: number, color: string, label: string) => (
    <div
      title={`${label} ${pct.toFixed(1)}%`}
      style={{
        position: "absolute",
        top: 5,
        left: `calc(${pct}% - 8px)`,
        width: 16,
        height: 16,
        background: color,
        borderRadius: "50%",
        border: "2px solid var(--ftp-surface)",
      }}
    />
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", margin: "4px 0 8px", fontSize: 11, color: "var(--ftp-text-2)" }}>
        <Key color={SEX_COLORS.male} label="Male" value={literacyMale} />
        <Key color={SEX_COLORS.female} label="Female" value={literacyFemale} />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          alignItems: "center",
          gap: 12,
          margin: "10px 0",
        }}
      >
        <div
          role="img"
          aria-label={`Literacy: male ${literacyMale.toFixed(1)} percent, female ${literacyFemale.toFixed(1)} percent`}
          style={{ position: "relative", height: 26, background: "var(--ftp-surface-2)", borderRadius: 4 }}
        >
          <div
            style={{
              position: "absolute",
              top: 11,
              left: `${min}%`,
              width: `${max - min}%`,
              height: 4,
              background: "var(--ftp-border-strong)",
              borderRadius: 2,
            }}
          />
          {dot(literacyMale, SEX_COLORS.male, "Male")}
          {dot(literacyFemale, SEX_COLORS.female, "Female")}
        </div>
        <div className="ftp-num" style={{ fontSize: 11, color: "var(--ftp-text-2)", textAlign: "right", whiteSpace: "nowrap" }}>
          Gap {(literacyMale - literacyFemale).toFixed(1)} pp
        </div>
      </div>
      {typeof literacyTotal === "number" && (
        <ChartNote>
          District total:{" "}
          <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{literacyTotal.toFixed(2)}%</span>
          {typeof stateRef === "number" && <> · State: <span className="ftp-num">{stateRef.toFixed(2)}%</span></>}
          {typeof nationalRef === "number" && <> · India: <span className="ftp-num">{nationalRef.toFixed(2)}%</span></>}
        </ChartNote>
      )}
    </div>
  );
}
