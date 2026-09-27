"use client";

// Client-side eligibility matcher. CRITICAL: does NOT submit to server.
// Runs pure comparisons against the tender's published eligibility JSON.
// Advocates Act §33 constraint: this is information, not legal advice.

//
// A kit Card, 44 px form controls, Lucide result icons, semantic colour as
// text only. The matching logic below is unchanged; each result line is a
// message key plus values so it reads right in every language
// (page_tenders.wizard). Registration values stay in English because they
// are matched against the English words the tender publishes; only their
// labels are translated.

import type React from "react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, CircleDashed, XCircle, Info } from "lucide-react";
import { Card } from "@/components/district/ui";
import { useMoney } from "@/components/money/useMoney";

type Eligibility = {
  minAnnualTurnoverInr?: number | null;
  yearsRequired?: number | null;
  similarWorkExp?: string | null;
  registrationTypes?: string[];
  locationRestrictions?: string | null;
  mseEligible?: boolean;
  startupEligible?: boolean;
};

type UserProfile = {
  turnoverBand: 0 | 50_00_000 | 1_00_00_000 | 5_00_00_000 | 10_00_00_000 | 50_00_00_000;
  yearsInBusiness: number;
  registrationTypes: string[];
  isMse: boolean;
  isStartup: boolean;
  hasDsc: boolean;
};

/** Turnover bands; the label key is page_tenders.wizard.turnover.<key>. */
const TURNOVER_OPTIONS: { key: string; value: UserProfile["turnoverBand"] }[] = [
  { key: "under50L", value: 0 },
  { key: "50Lto1Cr", value: 50_00_000 },
  { key: "1to5Cr", value: 1_00_00_000 },
  { key: "5to10Cr", value: 5_00_00_000 },
  { key: "10to50Cr", value: 10_00_00_000 },
  { key: "above50Cr", value: 50_00_00_000 },
];

/** Registration types: English value (matched against the tender) + label key. */
const REG_OPTIONS: { value: string; key: string }[] = [
  { value: "Sole proprietor", key: "sole" },
  { value: "Partnership", key: "partnership" },
  { value: "LLP", key: "llp" },
  { value: "Private Limited", key: "pvtltd" },
  { value: "Class I Contractor", key: "class1" },
  { value: "Class II Contractor", key: "class2" },
  { value: "Class III Contractor", key: "class3" },
  { value: "Railways-approved contractor", key: "railways" },
  { value: "MoD-registered vendor", key: "mod" },
];

/** One result line: a message key under page_tenders.wizard.line and its values. */
type Line = { key: string; values?: Record<string, string | number> };

export default function EligibilityWizard({ eligibility, tenderMseReserved, tenderStartupExempt }: { eligibility: Eligibility | null; tenderMseReserved: boolean; tenderStartupExempt: boolean }) {
  const t = useTranslations("page_tenders");
  const m = useMoney();
  const [profile, setProfile] = useState<UserProfile>({
    turnoverBand: 0,
    yearsInBusiness: 0,
    registrationTypes: [],
    isMse: false,
    isStartup: false,
    hasDsc: false,
  });

  const matches = useMemo(() => {
    if (!eligibility) return { status: "no-criteria" as const };
    const issues: Line[] = [];
    const passes: Line[] = [];

    // Turnover
    if (typeof eligibility.minAnnualTurnoverInr === "number" && eligibility.minAnnualTurnoverInr > 0) {
      const effective = profile.isStartup ? 0 : profile.turnoverBand;
      const need = m.short(eligibility.minAnnualTurnoverInr);
      if (effective < eligibility.minAnnualTurnoverInr) {
        issues.push({
          key: profile.isStartup ? "turnoverLowStartup" : "turnoverLow",
          values: { need, band: m.short(profile.turnoverBand) },
        });
      } else {
        passes.push({ key: profile.isStartup ? "turnoverOkStartup" : "turnoverOk", values: { need } });
      }
    }
    // Years
    if (typeof eligibility.yearsRequired === "number" && eligibility.yearsRequired > 0) {
      if (profile.yearsInBusiness < eligibility.yearsRequired && !profile.isStartup) {
        issues.push({ key: "yearsLow", values: { need: eligibility.yearsRequired, have: profile.yearsInBusiness } });
      } else {
        passes.push({ key: profile.isStartup ? "yearsOkStartup" : "yearsOk", values: { need: eligibility.yearsRequired } });
      }
    }
    // Registration
    if (eligibility.registrationTypes && eligibility.registrationTypes.length > 0) {
      const hasOne = eligibility.registrationTypes.some((r) => profile.registrationTypes.some((p) => r.toLowerCase().includes(p.toLowerCase())));
      if (!hasOne) issues.push({ key: "regRequired", values: { types: eligibility.registrationTypes.join(" / ") } });
      else passes.push({ key: "regOk" });
    }
    // MSE reservation
    if (tenderMseReserved && !profile.isMse) {
      issues.push({ key: "mseReserved" });
    } else if (tenderMseReserved && profile.isMse) {
      passes.push({ key: "mseOk" });
    }
    // DSC
    if (!profile.hasDsc) {
      issues.push({ key: "dscNeeded" });
    } else {
      passes.push({ key: "dscOk" });
    }

    const status = issues.length === 0 ? "match" : (passes.length >= issues.length ? "borderline" : "not-match");
    return { status, issues, passes };
  }, [eligibility, profile, tenderMseReserved, m]);

  const toggleReg = (r: string) => setProfile((p) => ({ ...p, registrationTypes: p.registrationTypes.includes(r) ? p.registrationTypes.filter((x) => x !== r) : [...p.registrationTypes, r] }));


  // Result wording + icon + colour. Semantic colour is used for the icon and
  // heading text only — no tinted result box.
  const RESULT: Record<string, { key: string; icon: typeof CheckCircle2; color: string }> = {
    "no-criteria": { key: "noCriteria", icon: Info, color: "var(--ftp-text-2)" },
    match: { key: "match", icon: CheckCircle2, color: "var(--ftp-live-text)" },
    borderline: { key: "borderline", icon: CircleDashed, color: "var(--ftp-warn)" },
    "not-match": { key: "notMatch", icon: XCircle, color: "var(--ftp-danger)" },
  };
  const result = RESULT[matches.status];
  const ResultIcon = result.icon;

  return (
    <Card>
      <div className="ftp-title" style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
        <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 30, height: 30, fontSize: 16, borderRadius: 10 }}>🧮</span>
        {t("wizard.title")}
      </div>
      <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: "0 0 14px" }}>
        {t("wizard.privacy")}
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <label htmlFor="elig-turnover" className="ftp-label" style={formLabel}>{t("wizard.turnoverLabel")}</label>
          <select
            id="elig-turnover"
            value={profile.turnoverBand}
            onChange={(e) => setProfile((p) => ({ ...p, turnoverBand: Number(e.target.value) as UserProfile["turnoverBand"] }))}
            style={formField}
          >
            {TURNOVER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{t(`wizard.turnover.${o.key}`)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="elig-years" className="ftp-label" style={formLabel}>{t("wizard.yearsLabel")}</label>
          <input
            id="elig-years"
            type="number"
            min={0}
            max={50}
            value={profile.yearsInBusiness}
            onChange={(e) => setProfile((p) => ({ ...p, yearsInBusiness: Math.max(0, parseInt(e.target.value || "0", 10)) }))}
            style={{ ...formField, fontFamily: "var(--ftp-font-mono)" }}
          />
        </div>
        <div>
          <div className="ftp-label" style={formLabel} id="elig-reg">{t("wizard.regLabel")}</div>
          <div role="group" aria-labelledby="elig-reg" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {REG_OPTIONS.map((r) => {
              const on = profile.registrationTypes.includes(r.value);
              return (
                <button
                  key={r.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleReg(r.value)}
                  className="ftp-chip"
                  style={{
                    padding: "0 12px",
                    fontSize: 13,
                    fontFamily: "var(--ftp-font-sans)",
                    borderRadius: "var(--ftp-radius-pill)",
                    border: `1px solid ${on ? "var(--hue)" : "var(--ftp-border)"}`,
                    background: on ? "var(--hue-tint)" : "var(--ftp-surface)",
                    color: on ? "var(--hue-deep)" : "var(--ftp-text)",
                    cursor: "pointer",
                  }}
                >
                  {t(`wizard.reg.${r.key}`)}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <label style={checkboxLabel}><input type="checkbox" checked={profile.isMse} onChange={(e) => setProfile((p) => ({ ...p, isMse: e.target.checked }))} style={{ accentColor: "var(--hue)" }} /> {t("wizard.isMse")}</label>
          <label style={checkboxLabel}><input type="checkbox" checked={profile.isStartup} onChange={(e) => setProfile((p) => ({ ...p, isStartup: e.target.checked }))} style={{ accentColor: "var(--hue)" }} /> {t("wizard.isStartup")}</label>
          <label style={checkboxLabel}><input type="checkbox" checked={profile.hasDsc} onChange={(e) => setProfile((p) => ({ ...p, hasDsc: e.target.checked }))} style={{ accentColor: "var(--hue)" }} /> {t("wizard.hasDsc")}</label>
        </div>
      </div>

      {/* Result — separated by a rule, not a tinted box. */}
      <div role="status" style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid var(--ftp-border)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, lineHeight: "20px", fontWeight: 500, color: result.color, marginBottom: 8 }}>
          <ResultIcon size={16} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{t(`wizard.result.${result.key}`)}</span>
        </div>
        {"passes" in matches && matches.passes && matches.passes.length > 0 && (
          <ul style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-live-text)", margin: "4px 0", paddingLeft: 18 }}>
            {matches.passes.map((p, i) => <li key={i}>{t(`wizard.line.${p.key}`, p.values)}</li>)}
          </ul>
        )}
        {"issues" in matches && matches.issues && matches.issues.length > 0 && (
          <ul style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-danger)", margin: "4px 0", paddingLeft: 18 }}>
            {matches.issues.map((p, i) => <li key={i}>{t(`wizard.line.${p.key}`, p.values)}</li>)}
          </ul>
        )}
        {(tenderStartupExempt || tenderMseReserved) && (
          <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 8 }}>
            {tenderStartupExempt && t("wizard.startupNote")}
            {tenderStartupExempt && tenderMseReserved && " "}
            {tenderMseReserved && t("wizard.mseNote")}
          </div>
        )}
      </div>
    </Card>
  );
}

const formLabel: React.CSSProperties = { display: "block", marginBottom: 4 };
const formField: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  padding: "0 10px",
  fontSize: 13,
  fontFamily: "var(--ftp-font-sans)",
  borderRadius: "var(--ftp-radius-tile)",
  border: "1px solid var(--ftp-border)",
  background: "var(--ftp-surface)",
  color: "var(--ftp-text)",
  boxSizing: "border-box",
};
const checkboxLabel: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 13, color: "var(--ftp-text)", cursor: "pointer" };
