"use client";

// Client-side eligibility matcher. CRITICAL: does NOT submit to server.
// Runs pure comparisons against the tender's published eligibility JSON.
// Advocates Act §33 constraint: this is information, not legal advice.

import { useMemo, useState } from "react";
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

  return (
    <div style={{ border: "1px solid #E8E8E4", borderRadius: 10, padding: 16, background: "#FFFFFF" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 12 }}>Can I apply? (client-side check)</div>
      <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 14 }}>
        Your answers never leave this browser. Matching runs against the tender&apos;s published eligibility criteria. Information only — not legal advice.
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <label style={formLabel}>Your annual turnover (last year)</label>
          <select
            value={profile.turnoverBand}
            onChange={(e) => setProfile((p) => ({ ...p, turnoverBand: Number(e.target.value) as UserProfile["turnoverBand"] }))}
            style={formField}
          >
            {TURNOVER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label style={formLabel}>Years in business</label>
          <input
            type="number"
            min={0}
            max={50}
            value={profile.yearsInBusiness}
            onChange={(e) => setProfile((p) => ({ ...p, yearsInBusiness: Math.max(0, parseInt(e.target.value || "0", 10)) }))}
            style={formField}
          />
        </div>
        <div>
          <label style={formLabel}>Registration (select all that apply)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {REG_OPTIONS.map((r) => (
              <button key={r} onClick={() => toggleReg(r)} style={{
                padding: "4px 10px", fontSize: 12, borderRadius: 6,
                border: profile.registrationTypes.includes(r) ? "1px solid #2563EB" : "1px solid #D1D5DB",
                background: profile.registrationTypes.includes(r) ? "#EFF6FF" : "#FFFFFF",
                color: profile.registrationTypes.includes(r) ? "#1D4ED8" : "#374151",
                cursor: "pointer",
              }}>{r}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <label style={checkboxLabel}><input type="checkbox" checked={profile.isMse} onChange={(e) => setProfile((p) => ({ ...p, isMse: e.target.checked }))} /> I&apos;m Udyam-registered (MSE)</label>
          <label style={checkboxLabel}><input type="checkbox" checked={profile.isStartup} onChange={(e) => setProfile((p) => ({ ...p, isStartup: e.target.checked }))} /> I have DPIIT Startup recognition</label>
          <label style={checkboxLabel}><input type="checkbox" checked={profile.hasDsc} onChange={(e) => setProfile((p) => ({ ...p, hasDsc: e.target.checked }))} /> I have a Class-3 DSC</label>
        </div>
      </div>

      <div style={{ marginTop: 20, padding: 14, borderRadius: 8, background: matches.status === "match" ? "#ECFDF5" : matches.status === "borderline" ? "#FFF9F0" : "#FEF2F2", border: "1px solid", borderColor: matches.status === "match" ? "#A7F3D0" : matches.status === "borderline" ? "#FED7AA" : "#FCA5A5" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: matches.status === "match" ? "#047857" : matches.status === "borderline" ? "#B45309" : "#B91C1C", marginBottom: 8 }}>
          {matches.status === "no-criteria" && "Tender does not list structured eligibility. Review the NIT PDF directly."}
          {matches.status === "match" && "✓ You likely match this tender's eligibility."}
          {matches.status === "borderline" && "◑ Borderline match — some criteria not met."}
          {matches.status === "not-match" && "✗ Likely below the threshold for this tender."}
        </div>
        {"passes" in matches && matches.passes && matches.passes.length > 0 && (
          <ul style={{ fontSize: 12, color: "#065F46", margin: "4px 0", paddingLeft: 18 }}>
            {matches.passes.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        )}
        {"issues" in matches && matches.issues && matches.issues.length > 0 && (
          <ul style={{ fontSize: 12, color: "#991B1B", margin: "4px 0", paddingLeft: 18 }}>
            {matches.issues.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        )}
        {(tenderStartupExempt || tenderMseReserved) && (
          <div style={{ fontSize: 11, color: "#4B5563", marginTop: 8, fontStyle: "italic" }}>
            {tenderStartupExempt && "Startup India exemptions apply — EMD waived, turnover/experience relaxed. "}
            {tenderMseReserved && "MSE-reserved — register free at udyamregistration.gov.in."}
          </div>
        )}
      </div>
    </div>
  );
}

const formLabel: React.CSSProperties = { display: "block", fontSize: 11, color: "#6B7280", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 4 };
const formField: React.CSSProperties = { width: "100%", padding: "8px 10px", fontSize: 13, borderRadius: 8, border: "1px solid #D1D5DB", background: "#FFFFFF", color: "#0F172A" };
const checkboxLabel: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151" };
