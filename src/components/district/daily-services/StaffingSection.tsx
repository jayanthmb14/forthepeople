/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  StaffingSection — "Are the posts filled?" (Layout v4.1)
// ═══════════════════════════════════════════════════════════════════════
//
//  Used by the Hospitals & health and Schools pages. Same data and rules
//  as src/components/district/StaffingWidget.tsx (police and exams still
//  use that one):
//
//   • Data: the "exams" module response carries a `staffing` array; we
//     keep only rows for this module (health / schools). useStaffing()
//     gives the page the totals for its own tiles, so the section itself
//     has no tiles (no number is shown twice).
//   • Shortage rule: more than 30 % of posts empty → "shortage", shown in
//     the danger colour as text and as the bar fill.
//   • Renders nothing while loading or when there are no rows: a page
//     never shows a fake zero.
//   • The section: one plain sentence → (optional) ten people with the
//     filled share lit + a dial → "where the empty posts are" bars → one
//     card per role; tapping a card opens a DetailSheet with that role's
//     sanctioned / working / empty posts, the date and the official source.
//
//  Text comes from the "page_staffing" messages (en/kn/hi). Role and
//  department names are data and stay as published.
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { User } from "lucide-react";
import { useDistrictData } from "@/hooks/useDistrictData";
import { useFormat } from "@/i18n/client";
import { Section, Card, AsOfText, SourcePill } from "@/components/district/ui";
import { ChartCard, Explainer, Gauge } from "@/components/district/visuals";
import { IconPictogram } from "@/components/district/page-kit";
import { DetailSheet, DetailList } from "@/components/district/DetailSheet";
import { RankBars } from "@/components/district/daily-services/BreakdownVisuals";
import { TapCard, CardBar, ActionLink, SheetNote } from "@/components/services-1/kit";
import { hueClass } from "@/lib/design/hues";

export interface StaffingRecord {
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

/** Empty share above which we call it a shortage (same as before). */
export const SHORTAGE_VACANT_PCT = 30;

/** How many roles the "where the empty posts are" bars show. */
const GAPS_SHOWN = 5;

/** Staffing rows and totals for one module; `rows` is empty while loading. */
export function useStaffing(module: "health" | "schools", district: string, state: string) {
  const { data, isLoading } = useDistrictData<StaffingResponse>("exams", district, state);
  const rows = (data?.data?.staffing ?? []).filter((s) => s.module === module);
  const sanctioned = rows.reduce((s, r) => s + r.sanctionedPosts, 0);
  const working = rows.reduce((s, r) => s + r.workingStrength, 0);
  const vacant = rows.reduce((s, r) => s + r.vacantPosts, 0);
  const filledPct = sanctioned > 0 ? Math.round((working / sanctioned) * 100) : 0;
  return {
    isLoading,
    rows,
    sanctioned,
    working,
    vacant,
    filledPct,
    shortage: sanctioned > 0 && 100 - filledPct > SHORTAGE_VACANT_PCT,
    asOf: rows[0]?.asOfDate ?? null,
    sourceUrl: rows[0]?.sourceUrl ?? null,
  };
}

export default function StaffingSection({
  module,
  district,
  state,
  picture = false,
}: {
  module: "health" | "schools";
  district: string;
  state: string;
  /** Draw the ten-people picture and the dial. */
  picture?: boolean;
}) {
  const t = useTranslations("page_staffing");
  const f = useFormat();
  const s = useStaffing(module, district, state);
  const [openId, setOpenId] = useState<string | null>(null);

  if (s.isLoading || s.rows.length === 0) return null;

  const pct = (n: number) => f.number(n / 100, { style: "percent", maximumFractionDigits: 0 });
  const filledOfTen = Math.min(10, (s.working / Math.max(1, s.sanctioned)) * 10);
  const rowFilled = (r: StaffingRecord) => (r.sanctionedPosts > 0 ? Math.round((r.workingStrength / r.sanctionedPosts) * 100) : 0);
  const rowShort = (r: StaffingRecord) => 100 - rowFilled(r) > SHORTAGE_VACANT_PCT;
  const bNum = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;
  const b = (c: React.ReactNode) => <strong>{c}</strong>;

  // Roles with the most empty posts.
  const gaps = s.rows
    .filter((r) => r.vacantPosts > 0)
    .sort((a, c) => c.vacantPosts - a.vacantPosts)
    .slice(0, GAPS_SHOWN)
    .map((r) => ({ key: r.id, label: r.roleName, sub: r.department, value: r.vacantPosts }));

  // Emptiest roles first, so the gaps are the first thing a visitor sees.
  const roles = [...s.rows].sort((a, c) => rowFilled(a) - rowFilled(c));
  const open = s.rows.find((r) => r.id === openId) ?? null;

  return (
    <Section
      title={t(`${module}.title`)}
      action={
        <>
          <AsOfText asOf={s.asOf} />
          {s.sourceUrl && <SourcePill label={t("official")} href={s.sourceUrl} />}
        </>
      }
    >
      <Explainer>
        {t.rich(`${module}.simple`, { sanctioned: f.number(s.sanctioned), working: f.number(s.working), b: bNum })}
        {s.shortage && <> {t("shortage", { pct: pct(100 - s.filledPct) })}</>}
      </Explainer>

      {/* The picture: ten people, the filled share lit, and a dial. */}
      {picture && s.sanctioned > 0 && (
        <div className="ftp-picture-row" style={{ marginBottom: 16 }}>
          <Card tinted padding={18}>
            <IconPictogram icon={User} filled={filledOfTen} label={t("pictogram", { n: f.number(Math.round(filledOfTen)) })} />
          </Card>
          <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Gauge value={s.filledPct} label={t("gauge")} caption={t("gaugeCaption")} />
          </Card>
        </div>
      )}

      {/* Where the empty posts are: two or more roles with empty posts. */}
      {gaps.length >= 2 && (
        <div style={{ marginBottom: 16 }}>
          <ChartCard
            title={t("gaps.title")}
            units={t("gaps.units")}
            simple={t.rich("gaps.simple", { role: gaps[0].label, n: f.number(gaps[0].value), b })}
            asOf={s.asOf}
            table={gaps.map((g) => ({ label: `${g.label}, ${g.sub}`, value: f.number(g.value) }))}
          >
            <RankBars items={gaps} ariaLabel={t("gaps.aria")} />
          </ChartCard>
        </div>
      )}

      {/* One card per role; tap for everything about it. */}
      <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "260px" }}>
        {roles.map((r) => {
          const filled = rowFilled(r);
          const short = rowShort(r);
          return (
            <TapCard
              key={r.id}
              title={r.roleName}
              subtitle={r.department}
              aside={
                <span className="ftp-num" style={{ fontSize: 15, color: short ? "var(--ftp-danger)" : "var(--hue-deep)" }}>
                  {t("row.filled", { pct: pct(filled) })}
                </span>
              }
              hint={t("open")}
              onOpen={() => setOpenId(r.id)}
            >
              <CardBar pct={filled} color={short ? "var(--ftp-danger)" : undefined} />
              <span style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: 6, fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)" }}>
                <span className="ftp-num">{t("row.workingVacant", { working: f.number(r.workingStrength), vacant: f.number(r.vacantPosts) })}</span>
                {short && <span style={{ color: "var(--ftp-danger)", fontWeight: 600 }}>{t("row.shortage")}</span>}
              </span>
            </TapCard>
          );
        })}
      </div>

      <DetailSheet
        open={open !== null}
        onClose={() => setOpenId(null)}
        hueClassName={hueClass(module)}
        title={open?.roleName ?? ""}
        subtitle={open?.department}
        footer={
          open?.sourceUrl ? (
            <ActionLink href={open.sourceUrl} primary newTab>
              {t("sheet.source")}
            </ActionLink>
          ) : undefined
        }
      >
        {open && (
          <>
            <SheetNote>
              {t.rich("sheet.note", {
                role: open.roleName,
                sanctioned: f.number(open.sanctionedPosts),
                working: f.number(open.workingStrength),
                vacant: f.number(open.vacantPosts),
                b: bNum,
              })}
            </SheetNote>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Gauge value={rowFilled(open)} label={t("gauge")} caption={t("gaugeCaption")} size={160} />
            </div>
            <DetailList
              rows={[
                { label: t("sheet.department"), value: open.department },
                { label: t("sheet.sanctioned"), value: f.number(open.sanctionedPosts) },
                { label: t("sheet.working"), value: f.number(open.workingStrength) },
                { label: t("sheet.vacant"), value: f.number(open.vacantPosts) },
                {
                  label: t("sheet.filled"),
                  value: (
                    <span style={{ color: rowShort(open) ? "var(--ftp-danger)" : undefined }}>
                      {pct(rowFilled(open))}
                      {rowShort(open) ? ` · ${t("row.shortage")}` : ""}
                    </span>
                  ),
                },
                { label: t("sheet.asOf"), value: f.date(open.asOfDate, { day: "numeric", month: "short", year: "numeric" }) },
              ]}
            />
          </>
        )}
      </DetailSheet>
    </Section>
  );
}
