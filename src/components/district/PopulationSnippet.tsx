/**
 * ForThePeople.in — Compact population & demographics snippet for the district
 * overview. Renders nothing when the district has no DemographicProfile, so
 * empty districts don't show a hollow card. Religion row displays the top 3
 * religions *alphabetically* (not ranked by size) with their actual
 * percentages, per the demographic neutrality guideline.
 *
 * Design v3: kit Card + title row, three small mono figures, and the census
 * year as the as-of line (these numbers are from a census, not live).
 */

"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import type { PopulationProfileResponse } from "@/hooks/useRealtimeData";
import { Card } from "@/components/district/ui";

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

/** Label above a mono figure. */
function Figure({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="ftp-label">{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
        <span className="ftp-num" style={{ fontSize: 17, lineHeight: "24px", color: "var(--ftp-text)" }}>{value}</span>
        {unit && <span style={{ fontSize: 11, color: "var(--ftp-text-2)" }}>{unit}</span>}
      </div>
    </div>
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
  const profile = data?.data ?? null;
  if (!profile) return null;

  const religions = top3Alphabetical(profile.religion);

  return (
    <Card as="section" aria-label={t("aria")} className="ftp-hue-teal" tinted>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 32, height: 32, fontSize: 17, borderRadius: 10 }}>📈</span>
          <h3 className="ftp-title ftp-display" style={{ fontSize: 16, fontWeight: 650, color: "var(--hue-deep)" }}>{t("title")}</h3>
        </span>
        <Link href={`${base}/population`} style={{ fontSize: 13, fontWeight: 600, color: "var(--hue-deep)", textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}>
          {t("viewAll")}
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginBottom: 10 }}>
        <Figure label={t("population")} value={formatInt(profile.totalPopulation)} />
        {typeof profile.sexRatio === "number" && <Figure label={t("sexRatio")} value={String(profile.sexRatio)} unit={t("perThousand")} />}
        {typeof profile.literacyTotal === "number" && <Figure label={t("literacy")} value={profile.literacyTotal.toFixed(1)} unit="%" />}
      </div>

      {religions.length > 0 && (
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>
          {t("religionLabel")}{" "}
          {religions.map((r, i) => (
            <span key={r.name}>
              {i > 0 && " · "}
              <span style={{ color: "var(--ftp-text)" }}>{t.has(`religion.${r.name}`) ? t(`religion.${r.name}`) : r.name}</span>{" "}
              <span className="ftp-num">{r.pct.toFixed(1)}%</span>
            </span>
          ))}
        </p>
      )}

      {profile.year && (
        <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: "8px 0 0" }}>
          {t("asOf", { year: profile.year })}
        </p>
      )}
    </Card>
  );
}
