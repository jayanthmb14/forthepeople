/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  StaffingSection — "Sanctioned vs. filled posts" in Design v4 "Rang"
// ═══════════════════════════════════════════════════════════════════════
//
//  Same data and rules as src/components/district/StaffingWidget.tsx
//  (which the police and exams pages still use), drawn with kit pieces:
//
//   • Data: the "exams" module response carries a `staffing` array; we
//     keep only rows for this module (health / schools).
//   • Danger rule: more than 30 % of posts vacant → "shortage", shown in
//     the danger colour as TEXT and as the bar fill (no red boxes).
//   • Renders nothing while loading or when there are no rows, exactly
//     like the old widget, so a page never shows a fake zero.
//   • `picture` adds the page's picture row: ten people with the filled
//     share lit, plus a dial. Same totals as the tiles; only drawn when
//     sanctioned posts are on record.
//   • "Where the empty posts are": the roles with the most vacant posts
//     as ranked bars, drawn when two or more roles have vacancies.
//
//  Text comes from the "page_staffing" messages (shared by the health and
//  schools pages); role and department names are data and stay as
//  published.
"use client";

import { useTranslations } from "next-intl";
import { useDistrictData } from "@/hooks/useDistrictData";
import { useFormat } from "@/i18n/client";
import { Section, Card, StatTile, StatStrip, ProgressBar, AsOfText, SourcePill } from "@/components/district/ui";
import { ChartCard, Explainer, Gauge, Pictogram } from "@/components/district/visuals";
import { RankBars } from "@/components/district/daily-services/BreakdownVisuals";

interface StaffingRecord {
  id: string;
  module: string;
  department: string;
  roleName: string;
  sanctionedPosts: number;
  workingStrength: number;
  vacantPosts: number;
  asOfDate: string;
  sourceUrl: string | null;
}

interface StaffingResponse {
  staffing: StaffingRecord[];
}

/** Vacancy share above which we call it a shortage (same as before). */
const SHORTAGE_VACANT_PCT = 30;

/** How many roles the "where the empty posts are" bars show. */
const GAPS_SHOWN = 5;

export default function StaffingSection({
  module,
  district,
  state,
  emoji = "🧑‍💼",
  personEmoji = "🧑",
  picture = false,
}: {
  module: "health" | "schools";
  district: string;
  state: string;
  /** Emoji chip before the section heading. */
  emoji?: string;
  /** One person, repeated in the picture and used on the "Working" tile. */
  personEmoji?: string;
  /** Draw the picture row (use it on pages that have no other picture). */
  picture?: boolean;
}) {
  const t = useTranslations("page_staffing");
  const f = useFormat();
  const { data: apiResponse, isLoading } = useDistrictData<StaffingResponse>("exams", district, state);
  const rows = (apiResponse?.data?.staffing ?? []).filter((s) => s.module === module);

  if (isLoading || rows.length === 0) return null;

  const pct = (n: number) => f.number(n / 100, { style: "percent", maximumFractionDigits: 0 });
  const totalSanctioned = rows.reduce((s, r) => s + r.sanctionedPosts, 0);
  const totalWorking = rows.reduce((s, r) => s + r.workingStrength, 0);
  const totalVacant = rows.reduce((s, r) => s + r.vacantPosts, 0);
  const filledPct = totalSanctioned > 0 ? Math.round((totalWorking / totalSanctioned) * 100) : 0;
  const vacantPct = 100 - filledPct;
  const shortage = vacantPct > SHORTAGE_VACANT_PCT;
  const asOf = rows[0]?.asOfDate;
  const sourceUrl = rows[0]?.sourceUrl;
  const filledOfTen = Math.min(10, (totalWorking / Math.max(1, totalSanctioned)) * 10);

  // Roles with the most empty posts.
  const gaps = rows
    .filter((r) => r.vacantPosts > 0)
    .sort((a, b) => b.vacantPosts - a.vacantPosts)
    .slice(0, GAPS_SHOWN)
    .map((r) => ({ key: r.id, label: r.roleName, sub: r.department, value: r.vacantPosts }));

  const bNum = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;
  const b = (c: React.ReactNode) => <strong>{c}</strong>;

  return (
    <Section
      title={t(`${module}.title`)}
      emoji={emoji}
      action={
        <>
          <AsOfText asOf={asOf} />
          {sourceUrl && <SourcePill label={t("official")} href={sourceUrl} />}
        </>
      }
    >
      <StatStrip cols={3}>
        <StatTile emoji="✅" label={t("tiles.fillRate")} value={filledPct} unit="%" sub={t("tiles.vacantSub", { pct: pct(vacantPct) })} asOf={asOf} />
        <StatTile
          emoji={personEmoji}
          label={t("tiles.working")}
          value={f.number(totalWorking)}
          sub={t("tiles.workingSub", { n: f.number(totalSanctioned) })}
          asOf={asOf}
        />
        <StatTile emoji="🪑" label={t("tiles.vacant")} value={f.number(totalVacant)} sub={shortage ? t("tiles.shortage") : undefined} asOf={asOf} />
      </StatStrip>

      {/* The picture: ten people, the filled share lit, and a dial. */}
      {picture && totalSanctioned > 0 && (
        <div className="ftp-picture-row" style={{ marginTop: 16 }}>
          <Card tinted padding={18}>
            <Explainer emoji="💡">
              {t.rich(`${module}.simple`, { sanctioned: f.number(totalSanctioned), working: f.number(totalWorking), b: bNum })}
            </Explainer>
            <Pictogram filled={filledOfTen} emoji={personEmoji} label={t("pictogram", { n: Math.round(filledOfTen) })} />
          </Card>
          <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Gauge value={filledPct} label={t("gauge")} caption={t("gaugeCaption")} />
          </Card>
        </div>
      )}

      {/* Where the empty posts are: two or more roles with vacancies. */}
      {gaps.length >= 2 && (
        <div style={{ marginTop: 16 }}>
          <ChartCard
            title={t("gaps.title")}
            emoji="🪑"
            units={t("gaps.units")}
            simple={t.rich("gaps.simple", { role: gaps[0].label, n: f.number(gaps[0].value), b })}
            asOf={asOf}
            table={gaps.map((g) => ({ label: `${g.label}, ${g.sub}`, value: f.number(g.value) }))}
          >
            <RankBars items={gaps} ariaLabel={t("gaps.aria")} />
          </ChartCard>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        {rows.map((s) => {
          const rowFilled = s.sanctionedPosts > 0 ? Math.round((s.workingStrength / s.sanctionedPosts) * 100) : 0;
          const rowVacant = 100 - rowFilled;
          const danger = rowVacant > SHORTAGE_VACANT_PCT;
          const tone = danger ? "danger" : rowFilled >= 70 ? "live" : "warn";
          return (
            <Card key={s.id} padding={14}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0 }}>
                  <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 32, height: 32, fontSize: 16, borderRadius: 10 }}>
                    {personEmoji}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="ftp-title">{s.roleName}</div>
                    <div style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)" }}>{s.department}</div>
                  </div>
                </div>
                <span className="ftp-num" style={{ fontSize: 13, color: danger ? "var(--ftp-danger)" : "var(--hue-deep)", flexShrink: 0 }}>
                  {t("row.filled", { pct: pct(rowFilled) })}
                </span>
              </div>
              <ProgressBar pct={rowFilled} tone={tone} />
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: 6, fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)" }}>
                <span className="ftp-num">
                  {t("row.workingVacant", { working: f.number(s.workingStrength), vacant: f.number(s.vacantPosts) })}
                </span>
                {danger && <span style={{ color: "var(--ftp-danger)" }}>{t("row.shortage", { pct: pct(rowVacant) })}</span>}
              </div>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
