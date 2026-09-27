/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Health — Design v4 "Rang" module page (docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  Mostly reference content (helplines, schemes, the kinds of hospitals a
//  district has) plus the sanctioned-vs-filled staffing numbers, which
//  carry their own "as of" date. Phone numbers are real tel: links with
//  44 px tap targets on phones.
//
//  Picture: the staffing section draws ten health workers with the filled
//  share lit, plus a dial, from the real sanctioned and working counts.
//  With no staffing rows nothing is drawn (the rest is reference text).
"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import { getStateConfig } from "@/lib/constants/state-config";
import ModuleNews from "@/components/district/ModuleNews";
import { use } from "react";
import { Heart, ExternalLink } from "lucide-react";
import { PageHeader, Section, Card, ToolbarButton } from "@/components/district/ui";
import StaffingSection from "@/components/district/daily-services/StaffingSection";
import { ModulePage, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

// Static health helplines for India — national numbers only.
// `urgent` marks the life-safety numbers, shown in the danger colour.
const HELPLINES = [
  { name: "National Emergency", number: "112", urgent: true, emoji: "🆘" },
  { name: "Ambulance", number: "108", urgent: true, emoji: "🚑" },
  { name: "iCALL (Mental Health)", number: "9152987821", emoji: "💬" },
  { name: "Anti-Poison (AIIMS)", number: "1800-116-117", emoji: "🧪" },
  { name: "Ayushman Bharat", number: "14555", emoji: "🪪" },
  { name: "National Health Helpline", number: "1800-180-1104", emoji: "📞" },
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
    { type: "Government District Hospital", emoji: "🏥", description: "Primary referral hospital with emergency, OPD, and specialty services" },
    { type: healthSubLabel, emoji: "🏨", description: `Secondary care hospitals at ${subUnit.toLowerCase()} level` },
    { type: "PHC (Primary Health Centres)", emoji: "🩺", description: "Primary care centers covering ~30,000 population" },
    { type: "Sub-Health Centres", emoji: "🏡", description: "Basic health services at village level" },
    { type: "Private Hospitals", emoji: "🏢", description: "Empanelled under Ayushman Bharat Yojana" },
  ];
}

/** Small emoji chip used on helpline cards and facility rows. */
function EmojiChip({ emoji, size = 36 }: { emoji: string; size?: number }) {
  return (
    <span
      className="ftp-icon-chip ftp-emoji"
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size / 2), borderRadius: Math.round(size / 3) }}
    >
      {emoji}
    </span>
  );
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

      {/* Sanctioned vs. filled staffing, with the page's picture
          (renders nothing when there is no data). */}
      <StaffingSection
        module="health"
        roleLabel="Healthcare staff"
        district={district}
        state={state}
        emoji="🩺"
        personEmoji="🧑‍⚕️"
        picture
      />

      {/* Emergency helplines — each card is a tel: link. */}
      <Section title="Emergency helplines" emoji="🚑">
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
                background: h.urgent
                  ? "linear-gradient(135deg, color-mix(in srgb, var(--hue) 8%, #fff) 0%, #fff 72%)"
                  : "var(--ftp-surface)",
                border: h.urgent
                  ? "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))"
                  : "1px solid var(--ftp-border)",
                borderRadius: "var(--ftp-radius-card)",
                boxShadow: "var(--ftp-shadow-1)",
                textDecoration: "none",
              }}
            >
              <EmojiChip emoji={h.emoji} />
              <div style={{ minWidth: 0 }}>
                <div className="ftp-num" style={{ fontSize: 18, lineHeight: "24px", color: h.urgent ? "var(--ftp-danger)" : "var(--hue-deep)" }}>
                  {h.number}
                </div>
                <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{h.name}</div>
              </div>
            </a>
          ))}
        </div>
      </Section>

      {/* Health schemes — national + state-specific. */}
      <Section title="Government health schemes" emoji="🛡️">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {schemes.map((s) => (
            <Card key={s.name} as="article">
              <h3 className="ftp-title" style={{ fontWeight: 600 }}>{s.name}</h3>
              <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "4px 0 0" }}>{s.desc}</p>
              {s.url && (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, minHeight: 32, marginTop: 8, fontSize: 13, fontWeight: 600, color: "var(--hue-deep)", textDecoration: "none" }}
                >
                  Learn more <ExternalLink size={12} aria-hidden />
                </a>
              )}
            </Card>
          ))}
        </div>
      </Section>

      {/* The kinds of facilities a district has (reference). */}
      <Section title="Healthcare infrastructure" emoji="🏥">
        <Card padding={0}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {getHospitalTypes(state).map((h, i) => (
              <li
                key={h.type}
                style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", borderTop: i === 0 ? "none" : "1px solid var(--ftp-border)" }}
              >
                <EmojiChip emoji={h.emoji} size={32} />
                <div style={{ minWidth: 0 }}>
                  <div className="ftp-title" style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600 }}>{h.type}</div>
                  <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{h.description}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      {/* Find a hospital on the NHM portal. */}
      <Card tinted style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <EmojiChip emoji="📍" />
          <div style={{ minWidth: 0 }}>
            <div className="ftp-title" style={{ fontWeight: 600 }}>Find the nearest hospital</div>
            <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>View hospitals on the NHM portal</div>
          </div>
        </div>
        <ToolbarButton icon={ExternalLink} href="https://nhm.gov.in" external>
          NHM portal
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
