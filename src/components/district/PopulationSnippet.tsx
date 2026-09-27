/**
 * ForThePeople.in — Compact population & demographics snippet for the district
 * overview. Renders nothing when the district has no DemographicProfile, so
 * empty districts don't show a hollow card. Religion row displays the top 3
 * religions *alphabetically* (not ranked by size) with their actual
 * percentages, per the demographic neutrality guideline.
 *
 * Design v3: kit Card + title row, three small mono figures, and the census
 * year as the as-of line (these numbers are from a census, not live).
 *
 * v5.1 "Warm Calm": OverviewCard frame with the drawn family mark; the head
 * count counts up once; literacy is a ring ("70 of every 100 can read and
 * write") and the sex ratio two bars (women vs men per 1,000), so a child
 * can read both without the jargon. No emoji.
 */

"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import type { PopulationProfileResponse } from "@/hooks/useRealtimeData";
import { CountUp } from "@/components/district/ui";
import { useFormat } from "@/i18n/client";
import OverviewCard from "@/components/district/shell/OverviewCard";
import { PeopleMark } from "@/components/district/shell/overview-art";

interface Props {
  district: string;
  state: string;
  base: string;
}

function formatInt(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-IN");
}

function top3Alphabetical(religion: Record<string, number> | null): Array<{
  name: string;
  pct: number;
}> {
  if (!religion) return [];
  const rows = Object.entries(religion)
    .filter(([, v]) => typeof v === "number" && Number.isFinite(v))
    .map(([k, v]) => ({ key: k, pct: v }));
  // Pick the 3 largest …
  const top = rows.sort((a, b) => b.pct - a.pct).slice(0, 3);
  // … then display them in alphabetical order (neutrality — not ranked).
  return top
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((r) => ({
      name: r.key === "NotStated" ? "Not Stated" : r.key,
      pct: r.pct,
    }));
}

/** A thin ring showing a percentage, drawn in once (reduced motion: static). */
function Ring({ pct, size = 64 }: { pct: number; size?: number }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden focusable="false">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--hue-tint)" strokeWidth={stroke} />
      <circle
        className="ftp-draw-path"
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--hue)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - p / 100)}
        style={{ ["--len" as string]: c }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export default function PopulationSnippet({ district, state, base }: Props) {
  const { data } = useQuery<PopulationProfileResponse>({
    queryKey: ["district", district, "population-profile", "snippet"],
    queryFn: () =>
      fetch(
        `/api/data/population/profile?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}`,
      ).then((r) => r.json()),
    staleTime: 10 * 60_000,
  });

  const t = useTranslations("popSnippet");
  const td = useTranslations("page_district-shell.cards.people");
  const f = useFormat();
  const profile = data?.data ?? null;
  if (!profile) return null;

  const religionName = (name: string) => (t.has(`religion.${name}`) ? t(`religion.${name}`) : name);
  // A–Z in the reader's language, so the order is as the label says
  // ("वर्णानुक्रम में" / "ಅಕಾರಾದಿ ಕ್ರಮದಲ್ಲಿ"); Sept 2026 audit: the Hindi list kept
  // the English order and read like a ranking.
  const religions = top3Alphabetical(profile.religion).sort((a, b) =>
    religionName(a.name).localeCompare(religionName(b.name), f.intl),
  );
  const literacy = typeof profile.literacyTotal === "number" ? profile.literacyTotal : null;
  const ratio = typeof profile.sexRatio === "number" && profile.sexRatio > 0 ? profile.sexRatio : null;
  const barMax = ratio ? Math.max(ratio, 1000) : 1000;

  return (
    <OverviewCard
      hue="teal"
      mark={<PeopleMark size={36} />}
      title={t("title")}
      ariaLabel={t("aria")}
      href={`${base}/population`}
      linkText={t("viewAll")}
    >
      {profile.totalPopulation != null && (
        <p className="ftp-ovp-count">
          <span className="ftp-ovp-num"><CountUp value={formatInt(profile.totalPopulation)} /></span>{" "}
          <span className="ftp-ovp-unit">{td("people")}</span>
        </p>
      )}

      {(literacy !== null || ratio !== null) && (
        <div className="ftp-ovp-visuals">
          {literacy !== null && (
            <div className="ftp-ovp-box" role="img" aria-label={td("literacyAria", { pct: f.number(literacy, { maximumFractionDigits: 1 }) })}>
              <span className="ftp-ovp-ring">
                <Ring pct={literacy} />
                <span className="ftp-ovp-ring-num">{f.number(Math.round(literacy))}%</span>
              </span>
              <span className="ftp-ovp-cap">
                <span className="ftp-label">{t("literacy")}</span>
                <span>{td("readWrite", { n: f.number(Math.round(literacy)) })}</span>
              </span>
            </div>
          )}
          {ratio !== null && (
            <div className="ftp-ovp-box" data-kind="ratio">
              <span className="ftp-label">{t("sexRatio")}</span>
              <span className="ftp-ovp-ratio-line">{td("womenPerMen", { n: f.number(ratio) })}</span>
              <span className="ftp-ovp-bars" aria-hidden>
                <span className="ftp-ovp-bar" data-who="women">
                  <span className="ftp-ovp-bar-name">{td("women")}</span>
                  <span className="ftp-ovp-bar-track"><span className="ftp-grow-x" style={{ width: `${(ratio / barMax) * 100}%` }} /></span>
                  <span className="ftp-num">{f.number(ratio)}</span>
                </span>
                <span className="ftp-ovp-bar" data-who="men">
                  <span className="ftp-ovp-bar-name">{td("men")}</span>
                  <span className="ftp-ovp-bar-track"><span className="ftp-grow-x" style={{ width: `${(1000 / barMax) * 100}%` }} /></span>
                  <span className="ftp-num">{f.number(1000)}</span>
                </span>
              </span>
            </div>
          )}
        </div>
      )}

      {religions.length > 0 && (
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "12px 0 0", fontSize: 13 }}>
          {t("religionLabel")}{" "}
          {religions.map((r, i) => (
            <span key={r.name}>
              {i > 0 && " · "}
              <span style={{ color: "var(--ftp-text)" }}>{religionName(r.name)}</span>{" "}
              <span className="ftp-num">{r.pct.toFixed(1)}%</span>
            </span>
          ))}
        </p>
      )}

      {profile.year && (
        <p className="ftp-ovc-foot">{t("asOf", { year: profile.year })}</p>
      )}
    </OverviewCard>
  );
}
