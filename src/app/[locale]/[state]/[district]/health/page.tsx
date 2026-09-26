/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources, getStateConfig } from "@/lib/constants/state-config";
import StaffingWidget from "@/components/district/StaffingWidget";
import ModuleNews from "@/components/district/ModuleNews";
import { use } from "react";
import { Heart, Phone, ExternalLink } from "lucide-react";
import { ModuleHeader, SectionLabel } from "@/components/district/ui";

// Static health helplines for India — national numbers only
const HELPLINES = [
  { name: "National Emergency", number: "112", color: "#DC2626" },
  { name: "Ambulance", number: "108", color: "#DC2626" },
  { name: "iCALL (Mental Health)", number: "9152987821", color: "#7C3AED" },
  { name: "Anti-Poison (AIIMS)", number: "1800-116-117", color: "#D97706" },
  { name: "Ayushman Bharat", number: "14555", color: "#16A34A" },
  { name: "National Health Helpline", number: "1800-180-1104", color: "#2563EB" },
];

// State-specific health schemes — always show national + state schemes
const STATE_HEALTH_SCHEMES: Record<string, Array<{ name: string; desc: string; color: string; url: string | null }>> = {
  karnataka: [
    { name: "Arogya Karnataka", desc: "State health assurance scheme for Karnataka residents", color: "#2563EB", url: "https://arogyakarnataka.gov.in" },
  ],
  telangana: [
    { name: "Aarogyasri", desc: "₹5 lakh health coverage for BPL families, covering 2,500+ procedures at 1,100+ empanelled hospitals", color: "#2563EB", url: "https://aarogyasri.telangana.gov.in" },
  ],
  "tamil-nadu": [
    { name: "CMCHIS", desc: "Chief Minister's Comprehensive Health Insurance Scheme — cashless treatment up to ₹5 lakh", color: "#2563EB", url: null },
  ],
  delhi: [
    { name: "Delhi Arogya Kosh", desc: "Financial assistance for treatment of serious illnesses for Delhi residents", color: "#2563EB", url: null },
  ],
  maharashtra: [
    { name: "MJPJAY", desc: "Mahatma Jyotiba Phule Jan Arogya Yojana — cashless treatment for BPL families", color: "#2563EB", url: null },
  ],
  "west-bengal": [
    { name: "Swasthya Sathi", desc: "Universal health coverage for all families in West Bengal — ₹5 lakh per family", color: "#2563EB", url: null },
  ],
  "uttar-pradesh": [
    { name: "Ayushman Bharat UP", desc: "Health coverage for BPL families in UP — ₹5 lakh per family, extended state coverage", color: "#2563EB", url: null },
  ],
};

const NATIONAL_SCHEMES = [
  { name: "Ayushman Bharat PM-JAY", desc: "₹5 lakh health coverage per family per year", color: "#16A34A", url: "https://pmjay.gov.in" },
  { name: "Janani Suraksha Yojana", desc: "Cash incentive for institutional deliveries", color: "#D97706", url: null },
  { name: "RBSK", desc: "Rashtriya Bal Swasthya Karyakram for children", color: "#7C3AED", url: null },
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

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={Heart} title="Health" description="Emergency helplines, hospitals, and health schemes" backHref={base} />
      {(() => { const _src = getModuleSources("health", state); return <DataSourceBanner moduleName="health" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="health" district={district} />

      {/* Sanctioned vs. Filled staffing widget */}
      <StaffingWidget
        module="health"
        roleLabel="Healthcare Staff"
        district={district}
        state={state}
        accentColor="#DC2626"
      />

      {/* Emergency Helplines */}
      <SectionLabel>Emergency Helplines</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 24 }}>
        {HELPLINES.map((h) => (
          <a key={h.name} href={`tel:${h.number}`} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
            background: "#FFF", border: `1px solid ${h.color}30`, borderRadius: 12,
            textDecoration: "none",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${h.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Phone size={18} style={{ color: h.color }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", color: h.color }}>{h.number}</div>
              <div style={{ fontSize: 11, color: "#6B6B6B" }}>{h.name}</div>
            </div>
          </a>
        ))}
      </div>

      {/* Health schemes — national + state-specific */}
      <SectionLabel>Government Health Schemes</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10, marginBottom: 24 }}>
        {[...NATIONAL_SCHEMES, ...(STATE_HEALTH_SCHEMES[state] ?? [])].map((s) => (
          <div key={s.name} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: 4 }}>{s.name}</div>
              <Heart size={16} style={{ color: s.color, flexShrink: 0 }} />
            </div>
            <div style={{ fontSize: 13, color: "#6B6B6B", marginBottom: 10 }}>{s.desc}</div>
            {s.url && (
              <a href={s.url} target="_blank" rel="noopener noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: s.color, textDecoration: "none", fontWeight: 600,
              }}>
                Learn More <ExternalLink size={11} />
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Hospital types */}
      <SectionLabel>Healthcare Infrastructure</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {getHospitalTypes(state).map((h) => (
          <div key={h.type} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#DC2626", flexShrink: 0, marginTop: 5 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{h.type}</div>
              <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>{h.description}</div>
            </div>
          </div>
        ))}
      </div>

      <ModuleNews district={district} state={state} locale={locale} module="health" />

      {/* Find hospital */}
      <div style={{ marginTop: 24, background: "linear-gradient(135deg, #FFF5F5, #FFF)", border: "1px solid #FECACA", borderRadius: 12, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>Find nearest hospital</div>
          <div style={{ fontSize: 12, color: "#6B6B6B" }}>View hospitals on NHM portal</div>
        </div>
        <a href="https://nhm.gov.in" target="_blank" rel="noopener noreferrer" style={{
          display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 14px",
          background: "#DC2626", color: "#FFF", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none",
        }}>
          NHM Portal <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}

export default function HealthPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Health">
      <HealthPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
