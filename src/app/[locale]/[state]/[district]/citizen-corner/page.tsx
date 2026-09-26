/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { use, useState, useEffect } from "react";
import { Users } from "lucide-react";
import { ModuleHeader, SectionLabel, LoadingShell } from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources, getStateConfig } from "@/lib/constants/state-config";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const URGENCY_LABEL: Record<string, string> = { now: "Do Now", soon: "This Month", general: "Good to Know" };
const URGENCY_COLOR: Record<string, string> = { now: "#DC2626", soon: "#D97706", general: "#6B7280" };

const CAT_COLORS: Record<string, string> = {
  Agriculture: "#16A34A", Health: "#DC2626", Finance: "#2563EB", Water: "#0891B2",
  Rights: "#7C3AED", Safety: "#B45309", Education: "#D97706", Environment: "#059669",
};

const HELPLINES = [
  { name: "Police Emergency", number: "100", icon: "🚔" },
  { name: "Fire", number: "101", icon: "🔥" },
  { name: "Ambulance", number: "108", icon: "🚑" },
  { name: "National Emergency", number: "112", icon: "📞" },
  { name: "Women Helpline", number: "1091", icon: "👩" },
  { name: "Child Helpline", number: "1098", icon: "👶" },
  { name: "Senior Citizen", number: "14567", icon: "🧓" },
  { name: "Cyber Crime", number: "1930", icon: "💻" },
  { name: "Anti-Corruption", number: "1064", icon: "⚖️" },
  { name: "Road Accident", number: "1073", icon: "🚗" },
  { name: "Consumer Helpline", number: "1800-11-4000", icon: "🛒" },
  { name: "PM KISAN Helpline", number: "155261", icon: "🌾" },
];

function getRights(stateSlug: string) {
  const sc = getStateConfig(stateSlug);
  const isUrban = sc ? !sc.gramPanchayatApplicable : false;
  return [
    { right: "Right to Information (RTI)", desc: "Any citizen can request government documents within 30 days. Fee: ₹10.", icon: "📄" },
    { right: "Right to Food", desc: "BPL families entitled to subsidised grain under NFSA at Rs 2–3/kg.", icon: "🌾" },
    { right: "Right to Education", desc: "Free & compulsory education for children 6–14 years under RTE Act.", icon: "📚" },
    { right: "MGNREGA", desc: "100 days of guaranteed wage employment per rural household per year.", icon: "⛏️" },
    isUrban
      ? { right: "Ward Committee", desc: `Participate in your ward committee meetings. Held quarterly by your municipal corporation${sc?.municipalBody ? ` (${sc.municipalBody})` : ""}.`, icon: "🏛️" }
      : { right: "Gram Sabha", desc: "Attend your village's Gram Sabha meetings — held quarterly.", icon: "🏛️" },
    { right: "Consumer Rights", desc: "File consumer complaint online at consumerhelpline.gov.in.", icon: "⚖️" },
  ];
}

interface CitizenTip {
  category: string;
  icon: string;
  title: string;
  description: string;
  urgency: "now" | "soon" | "general";
}

type Tab = "ai-tips" | "helplines" | "rights";

export default function CitizenCornerPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const [tab, setTab] = useState<Tab>("ai-tips");
  const [tips, setTips] = useState<CitizenTip[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [tipsMonth, setTipsMonth] = useState<number | null>(null);
  const [tipsYear, setTipsYear] = useState<number | null>(null);
  const [nextRefreshDays, setNextRefreshDays] = useState<number | null>(null);

  const tipsLoading = loadedFor !== district;

  useEffect(() => {
    fetch(`/api/ai/citizen-tips?district=${district}&state=${state}`)
      .then((r) => r.json())
      .then((json) => {
        setTips(json.tips ?? []);
        setTipsMonth(json.month ?? null);
        setTipsYear(json.year ?? null);
        setNextRefreshDays(json.nextRefreshDays ?? null);
        setLoadedFor(district);
      })
      .catch(() => setLoadedFor(district));
  }, [district, state]);

  const TABS: { id: Tab; label: string; emoji: string }[] = [
    { id: "ai-tips", label: "AI Tips", emoji: "🧠" },
    { id: "helplines", label: "Helplines", emoji: "📞" },
    { id: "rights", label: "Your Rights", emoji: "⚖️" },
  ];

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={Users} title="Citizen Corner" description="AI-powered civic tips, rights, and emergency helplines" backHref={base} />
      {(() => { const _src = getModuleSources("citizen-corner", state); return <DataSourceBanner moduleName="citizen-corner" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="citizen-corner" district={district} />

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid #E8E8E4", paddingBottom: 0 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              background: "transparent",
              border: "none",
              borderBottom: tab === t.id ? "2px solid #2563EB" : "2px solid transparent",
              color: tab === t.id ? "#2563EB" : "#6B6B6B",
              marginBottom: -1,
            }}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* ── AI Tips ─────────────────────────────────────── */}
      {tab === "ai-tips" && (
        <>
          {tipsLoading && <LoadingShell rows={4} />}

          {!tipsLoading && tips.length === 0 && (
            <div style={{
              padding: "32px 24px", textAlign: "center",
              background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 16,
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", marginBottom: 6 }}>
                Citizen Tips generate weekly
              </div>
              <div style={{ fontSize: 13, color: "#6B6B6B", lineHeight: 1.6, maxWidth: 300, margin: "0 auto 16px" }}>
                {nextRefreshDays != null
                  ? `Next tips will be available in ${nextRefreshDays === 1 ? "1 day" : nextRefreshDays + " days"}.`
                  : "New tips will be generated automatically next week."}
              </div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 20,
                padding: "4px 12px", fontSize: 11, color: "#D97706", fontWeight: 600,
              }}>
                🔄 Auto-generated every Sunday
              </div>
            </div>
          )}

          {!tipsLoading && tips.length > 0 && (
            <>
              {tipsMonth && tipsYear && (
                <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 20,
                    padding: "4px 12px", fontSize: 12, color: "#2563EB", fontWeight: 600,
                  }}>
                    🧠 AI-generated tips for {MONTHS[tipsMonth - 1]} {tipsYear}
                  </div>
                  <span style={{ fontSize: 11, color: "#9B9B9B" }}>Updated weekly</span>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {tips.map((tip, i) => {
                  const catColor = CAT_COLORS[tip.category] ?? "#6B7280";
                  const urgColor = URGENCY_COLOR[tip.urgency] ?? "#6B7280";
                  return (
                    <div
                      key={i}
                      style={{
                        background: "#FFF",
                        border: "1px solid #E8E8E4",
                        borderLeft: `4px solid ${catColor}`,
                        borderRadius: 12,
                        padding: "14px 16px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{tip.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                              color: catColor, background: `${catColor}15`, padding: "2px 7px", borderRadius: 20,
                            }}>
                              {tip.category}
                            </span>
                            <span style={{
                              fontSize: 10, fontWeight: 600, color: urgColor, background: `${urgColor}10`,
                              padding: "2px 7px", borderRadius: 20,
                            }}>
                              {URGENCY_LABEL[tip.urgency] ?? tip.urgency}
                            </span>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.3 }}>{tip.title}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: "#4B4B4B", lineHeight: 1.6 }}>{tip.description}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 16, padding: "10px 14px", background: "#F5F5F0", borderRadius: 8, fontSize: 11, color: "#9B9B9B" }}>
                Powered by Gemini 2.5 Flash · Tips are AI-generated and should be verified with official sources.
              </div>
            </>
          )}
        </>
      )}

      {/* ── Helplines ───────────────────────────────────── */}
      {tab === "helplines" && (
        <>
          <SectionLabel>Emergency & Important Helplines</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
            {HELPLINES.map((h) => (
              <a key={h.number} href={`tel:${h.number}`} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 10, textDecoration: "none",
              }}>
                <span style={{ fontSize: 20 }}>{h.icon}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#1A1A1A" }}>{h.number}</div>
                  <div style={{ fontSize: 11, color: "#9B9B9B" }}>{h.name}</div>
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      {/* ── Rights ──────────────────────────────────────── */}
      {tab === "rights" && (
        <>
          <SectionLabel>Know Your Rights</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {getRights(state).map((r) => (
              <div key={r.right} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{r.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginBottom: 4 }}>{r.right}</div>
                <div style={{ fontSize: 12, color: "#6B6B6B", lineHeight: 1.5 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
