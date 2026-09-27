"use client";

// Male vs female literacy as a "dumbbell": two dots on a 0–100 % track with
// a line between them showing the gap. Dot colours are the Okabe-Ito male /
// female pair from ../types (colour-blind safe); the track and the gap line
// use the page hue (Design v4).
import { useTranslations } from "next-intl";
import { useFormat } from "@/i18n/client";
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

/** Legend entry: 10 px dot + label + tabular value (already formatted). */
function Key({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span aria-hidden style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
      {label}
      <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{value}</span>
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
  const t = useTranslations("page_population");
  const f = useFormat();
  const pct = (v: number, d = 1) => f.number(v / 100, { style: "percent", minimumFractionDigits: d, maximumFractionDigits: d });
  if (typeof literacyMale !== "number" || typeof literacyFemale !== "number") {
    return <ChartEmpty message={t("literacyEmpty")} />;
  }

  const min = Math.min(literacyMale, literacyFemale);
  const max = Math.max(literacyMale, literacyFemale);

  // One dot on the track, positioned at `at` percent.
  const dot = (at: number, color: string, label: string) => (
    <div
      title={`${label} ${pct(at)}`}
      className="ftp-pop"
      style={{
        position: "absolute",
        top: 4,
        left: `calc(${at}% - 9px)`,
        width: 18,
        height: 18,
        background: color,
        borderRadius: "50%",
        border: "3px solid var(--ftp-surface)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
      }}
    />
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", margin: "4px 0 8px", fontSize: 12, color: "var(--ftp-text-2)" }}>
        <Key color={SEX_COLORS.male} label={t("male")} value={pct(literacyMale)} />
        <Key color={SEX_COLORS.female} label={t("female")} value={pct(literacyFemale)} />
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
          aria-label={t("literacyAria", { m: pct(literacyMale), w: pct(literacyFemale) })}
          style={{ position: "relative", height: 26, background: "var(--hue-tint)", borderRadius: 999 }}
        >
          <div
            style={{
              position: "absolute",
              top: 11,
              left: `${min}%`,
              width: `${max - min}%`,
              height: 4,
              background: "var(--hue)",
              borderRadius: 2,
            }}
          />
          {dot(literacyMale, SEX_COLORS.male, t("male"))}
          {dot(literacyFemale, SEX_COLORS.female, t("female"))}
        </div>
        <div className="ftp-num" style={{ fontSize: 12, color: "var(--hue-deep)", textAlign: "right", whiteSpace: "nowrap" }}>
          {t("gap", { gap: f.number(literacyMale - literacyFemale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })}
        </div>
      </div>
      {typeof literacyTotal === "number" && (
        <ChartNote>
          <span style={{ display: "inline-flex", gap: 12, flexWrap: "wrap" }}>
            <span>
              {t.rich("districtTotalNote", { v: pct(literacyTotal, 2), n: (c) => <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{c}</span> })}
            </span>
            {typeof stateRef === "number" && (
              <span>{t.rich("stateRef", { v: pct(stateRef, 2), n: (c) => <span className="ftp-num">{c}</span> })}</span>
            )}
            {typeof nationalRef === "number" && (
              <span>{t.rich("indiaRef", { v: pct(nationalRef, 2), n: (c) => <span className="ftp-num">{c}</span> })}</span>
            )}
          </span>
        </ChartNote>
      )}
    </div>
  );
}
