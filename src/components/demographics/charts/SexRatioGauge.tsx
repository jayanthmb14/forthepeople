"use client";

// Sex ratio (females per 1,000 males) on a 700–1,100 scale with reference
// marks at 900, 950 and 1,000 (equal numbers). Design v4: the track is a
// soft hue tint, the marker is a hue-deep pin, the value is a big number.
// Words come from page_population; numbers follow the page language.
import { useTranslations } from "next-intl";
import { useFormat } from "@/i18n/client";
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
  const t = useTranslations("page_population");
  const f = useFormat();
  const pct = toPct(ratio);
  // Scale labels sit exactly under their marks (absolute positions).
  const scaleLabels = [
    { v: MIN, text: f.number(MIN) },
    ...MARKS.map((m) => ({ v: m, text: m === 1000 ? t("equalMark", { v: f.number(m) }) : f.number(m) })),
    { v: MAX, text: f.number(MAX) },
  ];
  return (
    <div style={{ margin: "12px 0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap", fontSize: 12, color: "var(--ftp-text-2)", marginBottom: 8 }}>
        <span style={{ fontWeight: 600, color: "var(--ftp-text)" }}>{label}</span>
        <span>
          <span className="ftp-bignum" style={{ fontSize: 22, color: "var(--hue-deep)" }}>{f.number(ratio)}</span> {t("perThousand")}
        </span>
      </div>
      <div
        role="img"
        aria-label={t("gaugeAria", { label, ratio: f.number(ratio) })}
        style={{ position: "relative", height: 12, background: "var(--hue-tint)", borderRadius: 6 }}
      >
        {MARKS.map((m) => (
          <div
            key={m}
            title={f.number(m)}
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
            top: -4,
            left: `calc(${pct}% - 5px)`,
            width: 10,
            height: 20,
            background: "var(--hue-deep)",
            border: "2px solid var(--ftp-surface)",
            borderRadius: 4,
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
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
  const t = useTranslations("page_population");
  if (typeof sexRatio !== "number") {
    return <ChartEmpty message={t("sexRatioEmpty")} />;
  }
  return (
    <div>
      <Track ratio={sexRatio} label={t("sexRatioAll")} />
      {typeof childSexRatio === "number" && (
        <>
          <Track ratio={childSexRatio} label={t("sexRatioChild")} />
          <ChartNote>{t("childNote")}</ChartNote>
        </>
      )}
    </div>
  );
}
