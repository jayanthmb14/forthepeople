/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// StaffingWidget — sanctioned vs. filled posts for one module
// Used on the Police page (Health and Schools use
// daily-services/StaffingSection). Reads the same staffing rows the
// Exams page shows (/api/data/exams).
//
// Design v4 "Rang": a Card in the page hue. One bar for all posts
// together, then one row per role with a ring of the share filled.
// Semantic colour only when it carries a warning: more than 30 % empty
// → danger. Every number in tabular figures; the data date ("As of …")
// and the official source are always shown.
//
// i18n: text is page_exams.widget (en / kn / hi); numbers and percentages
// go through useFormat(). Role and department names are data.
// ═══════════════════════════════════════════════════════════
"use client";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDistrictData } from "@/hooks/useDistrictData";
import { useFormat } from "@/i18n/client";
import { Card, SectionHeader, ProgressBar, AsOfText } from "@/components/district/ui";
import { RingMeter } from "@/components/community/CommunityVisuals";

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
  stateExams: unknown[];
  districtExams: unknown[];
  summary: unknown;
}

interface StaffingWidgetProps {
  module: "health" | "police" | "schools";
  /** The role in the page language, e.g. "Police force". */
  roleLabel: string;
  district: string;
  state: string;
  /** DEPRECATED (v2 hex colour). Accepted so callers keep compiling; the page hue is used. */
  accentColor?: string;
}

const MODULE_EMOJI: Record<StaffingWidgetProps["module"], string> = {
  health: "🩺",
  police: "👮",
  schools: "👩‍🏫",
};

/** More than 30 % of posts empty is a shortage. */
const SHORTAGE_PCT = 30;

export default function StaffingWidget({ module, roleLabel, district, state }: StaffingWidgetProps) {
  const t = useTranslations("page_exams.widget");
  const f = useFormat();
  const { data: apiResponse, isLoading } = useDistrictData<StaffingResponse>("exams", district, state);
  const rows = (apiResponse?.data?.staffing ?? []).filter((s) => s.module === module);

  if (isLoading || rows.length === 0) return null;

  const pctText = (p: number) => f.number(p / 100, { style: "percent", maximumFractionDigits: 0 });
  const sanctioned = rows.reduce((s, r) => s + r.sanctionedPosts, 0);
  const working = rows.reduce((s, r) => s + r.workingStrength, 0);
  const vacant = rows.reduce((s, r) => s + r.vacantPosts, 0);
  const filledPct = sanctioned > 0 ? Math.round((working / sanctioned) * 100) : 0;
  const shortage = 100 - filledPct > SHORTAGE_PCT;
  const asOf = rows.reduce<string | null>((max, r) => (!max || r.asOfDate > max ? r.asOfDate : max), null);
  const source = rows.find((r) => r.sourceUrl)?.sourceUrl ?? null;

  return (
    <section style={{ marginBottom: 20 }}>
      <SectionHeader as="h3" emoji={MODULE_EMOJI[module]} title={t("title", { role: roleLabel })} action={<AsOfText asOf={asOf} />} />
      <Card tinted>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", fontSize: 14, lineHeight: "20px", marginBottom: 6 }}>
          <span style={{ fontWeight: 650, color: "var(--ftp-text)" }}>{t("overall")}</span>
          <span className="ftp-num" style={{ color: shortage ? "var(--ftp-danger)" : "var(--hue-deep)" }}>
            {t("filledEmpty", { filled: pctText(filledPct), empty: pctText(100 - filledPct) })}
          </span>
        </div>
        <ProgressBar pct={filledPct} tone={shortage ? "danger" : "brand"} height={10} />
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: 6, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
          <span className="ftp-num">{t("counts", { working: f.number(working), sanctioned: f.number(sanctioned) })}</span>
          {shortage && (
            <span style={{ color: "var(--ftp-danger)", fontWeight: 600 }}>
              <span className="ftp-emoji" aria-hidden>⚠️ </span>
              {t("shortage", { n: vacant, count: f.number(vacant) })}
            </span>
          )}
        </div>

        <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))" }}>
          {rows.map((s) => {
            const pct = s.sanctionedPosts > 0 ? Math.round((s.workingStrength / s.sanctionedPosts) * 100) : 0;
            const short = 100 - pct > SHORTAGE_PCT;
            return (
              <li
                key={s.id}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, borderRadius: "var(--ftp-radius-tile)", background: "#fff", border: "1px solid var(--ftp-border)" }}
              >
                <RingMeter
                  pct={pct}
                  size={54}
                  color={short ? "var(--ftp-danger)" : "var(--hue)"}
                  ariaLabel={t("rowAria", { role: s.roleName, pct: pctText(pct) })}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)" }}>{s.roleName}</div>
                  <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{s.department}</div>
                  <div className="ftp-num" style={{ fontSize: 12, lineHeight: "16px", color: short ? "var(--ftp-danger)" : "var(--ftp-text-2)", marginTop: 2 }}>
                    {t("rowCounts", { working: f.number(s.workingStrength), vacant: f.number(s.vacantPosts) })}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {source && (
          <a
            href={source.startsWith("http") ? source : `https://${source}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, minHeight: 32, marginTop: 8, fontSize: 12, fontWeight: 600, color: "var(--hue-deep)", textDecoration: "none" }}
          >
            {t("source")} <ExternalLink size={12} aria-hidden />
          </a>
        )}
      </Card>
    </section>
  );
}
