"use client";

// Client-side eligibility matcher. CRITICAL: does NOT submit to server.
// Runs pure comparisons against the tender's published eligibility JSON.
// Advocates Act §33 constraint: this is information, not legal advice.

//
// Design v3: a kit Card, 44 px form controls, Lucide result icons, semantic
// colour as text only. The matching logic below is unchanged.

import type React from "react";
import { useMemo, useState } from "react";
import { CheckCircle2, CircleDashed, XCircle, Info } from "lucide-react";
import { Card } from "@/components/district/ui";
import { formatInr } from "@/lib/tenders/format";

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

const TURNOVER_OPTIONS: { label: string; value: UserProfile["turnoverBand"] }[] = [
  { label: "Under ₹50 L", value: 0 },
  { label: "₹50 L – ₹1 Cr", value: 50_00_000 },
  { label: "₹1 Cr – ₹5 Cr", value: 1_00_00_000 },
  { label: "₹5 Cr – ₹10 Cr", value: 5_00_00_000 },
  { label: "₹10 Cr – ₹50 Cr", value: 10_00_00_000 },
  { label: "Above ₹50 Cr", value: 50_00_00_000 },
];

const REG_OPTIONS = [
  "Sole proprietor",
  "Partnership",
  "LLP",
  "Private Limited",
  "Class I Contractor",
  "Class II Contractor",
  "Class III Contractor",
  "Railways-approved contractor",
  "MoD-registered vendor",
];

export default function EligibilityWizard({ eligibility, tenderMseReserved, tenderStartupExempt }: { eligibility: Eligibility | null; tenderMseReserved: boolean; tenderStartupExempt: boolean }) {
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
    const issues: string[] = [];
    const passes: string[] = [];

    // Turnover
    if (typeof eligibility.minAnnualTurnoverInr === "number" && eligibility.minAnnualTurnoverInr > 0) {
      const effective = profile.isStartup ? 0 : profile.turnoverBand;
      if (effective < eligibility.minAnnualTurnoverInr) {
        issues.push(`Requires turnover ${formatInr(eligibility.minAnnualTurnoverInr)} — your band covers up to ${formatInr(profile.turnoverBand)}${profile.isStartup ? " (Startup India waiver may apply)" : ""}`);
      } else {
        passes.push(`Turnover ≥ ${formatInr(eligibility.minAnnualTurnoverInr)}${profile.isStartup ? " (waived under Startup India)" : ""}`);
      }
    }
    // Years
    if (typeof eligibility.yearsRequired === "number" && eligibility.yearsRequired > 0) {
      if (profile.yearsInBusiness < eligibility.yearsRequired && !profile.isStartup) {
        issues.push(`${eligibility.yearsRequired}+ years in business required — you have ${profile.yearsInBusiness}`);
      } else {
        passes.push(`${eligibility.yearsRequired}+ years experience${profile.isStartup ? " (Startup India waiver)" : ""}`);
      }
    }
    // Registration
    if (eligibility.registrationTypes && eligibility.registrationTypes.length > 0) {
      const hasOne = eligibility.registrationTypes.some((r) => profile.registrationTypes.some((p) => r.toLowerCase().includes(p.toLowerCase())));
      if (!hasOne) issues.push(`Required: ${eligibility.registrationTypes.join(" / ")}`);
      else passes.push(`Registration type accepted`);
    }
    // MSE reservation
    if (tenderMseReserved && !profile.isMse) {
      issues.push(`This tender is reserved for MSE bidders. Register free on Udyam portal to qualify.`);
    } else if (tenderMseReserved && profile.isMse) {
      passes.push("MSE-reserved tender — you qualify and are EMD-exempt");
    }
    // DSC
    if (!profile.hasDsc) {
      issues.push("Class-3 DSC required before bidding (₹1,200–2,500, 2–3 days)");
    } else {
      passes.push("DSC ready");
    }

    const status = issues.length === 0 ? "match" : (passes.length >= issues.length ? "borderline" : "not-match");
    return { status, issues, passes };
  }, [eligibility, profile, tenderMseReserved]);

  const toggleReg = (r: string) => setProfile((p) => ({ ...p, registrationTypes: p.registrationTypes.includes(r) ? p.registrationTypes.filter((x) => x !== r) : [...p.registrationTypes, r] }));


  // Result wording + icon + colour. Semantic colour is used for the icon and
  // heading text only — no tinted result box (v3 rule).
  const RESULT: Record<string, { text: string; icon: typeof CheckCircle2; color: string }> = {
    "no-criteria": { text: "Tender does not list structured eligibility. Review the NIT PDF directly.", icon: Info, color: "var(--ftp-text-2)" },
    match: { text: "You likely match this tender's eligibility.", icon: CheckCircle2, color: "var(--ftp-live-text)" },
    borderline: { text: "Borderline match — some criteria not met.", icon: CircleDashed, color: "var(--ftp-warn)" },
    "not-match": { text: "Likely below the threshold for this tender.", icon: XCircle, color: "var(--ftp-danger)" },
  };
  const result = RESULT[matches.status];
  const ResultIcon = result.icon;

  return (
    <Card>
      <div className="ftp-title" style={{ marginBottom: 4 }}>Can I apply? (client-side check)</div>
      <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: "0 0 14px" }}>
        Your answers never leave this browser. Matching runs against the tender&apos;s published eligibility criteria. Information only — not legal advice.
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <label htmlFor="elig-turnover" className="ftp-label" style={formLabel}>Your annual turnover (last year)</label>
          <select
            id="elig-turnover"
            value={profile.turnoverBand}
            onChange={(e) => setProfile((p) => ({ ...p, turnoverBand: Number(e.target.value) as UserProfile["turnoverBand"] }))}
            style={formField}
          >
            {TURNOVER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="elig-years" className="ftp-label" style={formLabel}>Years in business</label>
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
          <div className="ftp-label" style={formLabel} id="elig-reg">Registration (select all that apply)</div>
          <div role="group" aria-labelledby="elig-reg" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {REG_OPTIONS.map((r) => {
              const on = profile.registrationTypes.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleReg(r)}
                  className="ftp-chip"
                  style={{
                    padding: "0 12px",
                    fontSize: 13,
                    fontFamily: "var(--ftp-font-sans)",
                    borderRadius: "var(--ftp-radius-pill)",
                    border: `1px solid ${on ? "var(--ftp-brand)" : "var(--ftp-border)"}`,
                    background: on ? "var(--ftp-brand-tint)" : "var(--ftp-surface)",
                    color: on ? "var(--ftp-brand-deep)" : "var(--ftp-text)",
                    cursor: "pointer",
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <label style={checkboxLabel}><input type="checkbox" checked={profile.isMse} onChange={(e) => setProfile((p) => ({ ...p, isMse: e.target.checked }))} /> I&apos;m Udyam-registered (MSE)</label>
          <label style={checkboxLabel}><input type="checkbox" checked={profile.isStartup} onChange={(e) => setProfile((p) => ({ ...p, isStartup: e.target.checked }))} /> I have DPIIT Startup recognition</label>
          <label style={checkboxLabel}><input type="checkbox" checked={profile.hasDsc} onChange={(e) => setProfile((p) => ({ ...p, hasDsc: e.target.checked }))} /> I have a Class-3 DSC</label>
        </div>
      </div>

      {/* Result — separated by a rule, not a tinted box. */}
      <div role="status" style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid var(--ftp-border)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, lineHeight: "20px", fontWeight: 500, color: result.color, marginBottom: 8 }}>
          <ResultIcon size={16} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{result.text}</span>
        </div>
        {"passes" in matches && matches.passes && matches.passes.length > 0 && (
          <ul style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-live-text)", margin: "4px 0", paddingLeft: 18 }}>
            {matches.passes.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        )}
        {"issues" in matches && matches.issues && matches.issues.length > 0 && (
          <ul style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-danger)", margin: "4px 0", paddingLeft: 18 }}>
            {matches.issues.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        )}
        {(tenderStartupExempt || tenderMseReserved) && (
          <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 8 }}>
            {tenderStartupExempt && "Startup India exemptions apply — EMD waived, turnover/experience relaxed. "}
            {tenderMseReserved && "MSE-reserved — register free at udyamregistration.gov.in."}
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
