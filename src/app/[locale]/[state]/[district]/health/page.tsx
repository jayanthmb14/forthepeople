/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Health — Design v3 module page (CONCEPT-v3 §5)
// ═══════════════════════════════════════════════════════════════════════
//
//  Mostly reference content (helplines, schemes, the kinds of hospitals a
//  district has) plus the sanctioned-vs-filled staffing numbers, which
//  carry their own "as of" date. Phone numbers are real tel: links with
//  44 px tap targets on phones.
"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import { getStateConfig } from "@/lib/constants/state-config";
import ModuleNews from "@/components/district/ModuleNews";
import { use } from "react";
import { Heart, Phone, ExternalLink } from "lucide-react";
import { PageHeader, Section, Card, ToolbarButton } from "@/components/district/ui";
import StaffingSection from "@/components/district/daily-services/StaffingSection";
import { ModulePage, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

// Static health helplines for India — national numbers only.
// `urgent` marks the life-safety numbers, shown in the danger colour.
const HELPLINES = [
  { name: "National Emergency", number: "112", urgent: true },
  { name: "Ambulance", number: "108", urgent: true },
  { name: "iCALL (Mental Health)", number: "9152987821" },
  { name: "Anti-Poison (AIIMS)", number: "1800-116-117" },
  { name: "Ayushman Bharat", number: "14555" },
  { name: "National Health Helpline", number: "1800-180-1104" },
];

// State-specific health schemes — always show national + state schemes
const STATE_HEALTH_SCHEMES: Record<string, Array<{ name: string; desc: string; url: string | null }>> = {
  karnataka: [
    { name: "Arogya Karnataka", desc: "State health assurance scheme for Karnataka residents", url: "https://arogyakarnataka.gov.in" },
  ],
  telangana: [
    { name: "Aarogyasri", desc: "₹5 lakh health coverage for BPL families, covering 2,500+ procedures at 1,100+ empanelled hospitals", url: "https://aarogyasri.telangana.gov.in" },
  ],
  "tamil-nadu": [
    { name: "CMCHIS", desc: "Chief Minister's Comprehensive Health Insurance Scheme — cashless treatment up to ₹5 lakh", url: null },
  ],
  delhi: [
    { name: "Delhi Arogya Kosh", desc: "Financial assistance for treatment of serious illnesses for Delhi residents", url: null },
  ],
  maharashtra: [
    { name: "MJPJAY", desc: "Mahatma Jyotiba Phule Jan Arogya Yojana — cashless treatment for BPL families", url: null },
  ],
  "west-bengal": [
    { name: "Swasthya Sathi", desc: "Universal health coverage for all families in West Bengal — ₹5 lakh per family", url: null },
  ],
  "uttar-pradesh": [
    { name: "Ayushman Bharat UP", desc: "Health coverage for BPL families in UP — ₹5 lakh per family, extended state coverage", url: null },
  ],
};

const NATIONAL_SCHEMES = [
  { name: "Ayushman Bharat PM-JAY", desc: "₹5 lakh health coverage per family per year", url: "https://pmjay.gov.in" },
  { name: "Janani Suraksha Yojana", desc: "Cash incentive for institutional deliveries", url: null },
  { name: "RBSK", desc: "Rashtriya Bal Swasthya Karyakram for children", url: null },
];

function getHospitalTypes(stateSlug: string) {
  const config = getStateConfig(stateSlug);
  const healthSubLabel = config?.healthSubLabel ?? "Taluk Hospitals";
  const subUnit = config?.subDistrictUnit ?? "Taluk";
  return [
    { type: "Government District Hospital", description: "Primary referral hospital with emergency, OPD, and specialty services" },
    { type: healthSubLabel, description: `Secondary care hospitals at ${subUnit.toLowerCase()} level` },
    { type: "PHC (Primary Health Centres)", description: "Primary care centers covering ~30,000 population" },
    { type: "Sub-Health Centres", description: "Basic health services at village level" },
    { type: "Private Hospitals", description: "Empanelled under Ayushman Bharat Yojana" },
  ];
}

function HealthPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const schemes = [...NATIONAL_SCHEMES, ...(STATE_HEALTH_SCHEMES[state] ?? [])];

  return (
    <ModulePage>
      <PageHeader
        icon={Heart}
        title="Health"
        description="Emergency helplines, hospitals, and health schemes"
        backHref={base}
        accent={getModuleAccent("health")}
      />

      <AIInsightCard module="health" district={district} />

      {/* Sanctioned vs. filled staffing (renders nothing when there is no data). */}
      <StaffingSection module="health" roleLabel="Healthcare staff" district={district} state={state} />

      {/* Emergency helplines — each card is a tel: link. */}
      <Section title="Emergency helplines">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {HELPLINES.map((h) => (
            <a
              key={h.name}
              href={`tel:${h.number}`}
              className="ftp-card-link"
              aria-label={`Call ${h.name}: ${h.number}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                minHeight: 44,
                padding: "12px 14px",
                background: "var(--ftp-surface)",
                border: "1px solid var(--ftp-border)",
                borderRadius: "var(--ftp-radius-card)",
                textDecoration: "none",
              }}
            >
              <Phone size={18} aria-hidden style={{ color: h.urgent ? "var(--ftp-danger)" : "var(--ftp-text-2)", flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div className="ftp-num" style={{ fontSize: 18, lineHeight: "24px", color: h.urgent ? "var(--ftp-danger)" : "var(--ftp-text)" }}>
                  {h.number}
                </div>
                <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{h.name}</div>
              </div>
            </a>
          ))}
        </div>
      </Section>

      {/* Health schemes — national + state-specific. */}
      <Section title="Government health schemes">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {schemes.map((s) => (
            <Card key={s.name} as="article">
              <h3 className="ftp-title">{s.name}</h3>
              <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "4px 0 0" }}>{s.desc}</p>
              {s.url && (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, minHeight: 32, marginTop: 8, fontSize: 13, color: "var(--ftp-brand)", textDecoration: "none" }}
                >
                  Learn more <ExternalLink size={12} aria-hidden />
                </a>
              )}
            </Card>
          ))}
        </div>
      </Section>

      {/* The kinds of facilities a district has (reference). */}
      <Section title="Healthcare infrastructure">
        <Card padding={0}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {getHospitalTypes(state).map((h, i) => (
              <li key={h.type} style={{ padding: "12px 16px", borderTop: i === 0 ? "none" : "1px solid var(--ftp-border)" }}>
                <div className="ftp-title" style={{ fontSize: 13, lineHeight: "20px" }}>{h.type}</div>
                <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{h.description}</div>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      {/* Find a hospital on the NHM portal. */}
      <Card style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div className="ftp-title">Find nearest hospital</div>
          <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>View hospitals on NHM portal</div>
        </div>
        <ToolbarButton icon={ExternalLink} href="https://nhm.gov.in" external>
          NHM Portal
        </ToolbarButton>
      </Card>

      <ModuleSources module="health" state={state} />
      <ModuleNews district={district} state={state} locale={locale} module="health" />
      <ModuleToolbar
        locale={locale}
        district={district}
        moduleSlug="health"
        moduleLabel="Health"
        shareText={`Health helplines and schemes for ${district}: Emergency 112, Ambulance 108`}
      />
    </ModulePage>
  );
}

export default function HealthPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Health">
      <HealthPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
