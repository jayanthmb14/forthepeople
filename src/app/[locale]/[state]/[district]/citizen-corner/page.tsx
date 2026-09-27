/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Citizen Corner — Design v4 "Rang" module page (docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  PageHeader → AI summary → StatStrip of emoji tiles → the picture ("In
//  simple words" about this week's tips with a pictogram of the urgent
//  ones, beside a big tap-to-call 112 card) → three tabs (AI tips ·
//  Helplines · Your rights) → SourcesFooter → Toolbar (Share, Compare).
//
//  Tips come from /api/ai/citizen-tips (generated weekly). Each tip card
//  shows a Lucide icon for its category in a hue chip, a category Pill and
//  an urgency Pill (semantic colours). Helplines are real tel: links with
//  44 px+ touch targets.
//
"use client";
import { use, useState, useEffect } from "react";
import {
  Users, Sparkles, Phone, Scale, RefreshCw, Share2, GitCompare,
  Siren, Flame, Ambulance, PhoneCall, UserRound, Baby, HeartHandshake, Laptop, Car, ShoppingCart, Wheat,
  FileText, BookOpen, Shovel, Landmark, HeartPulse, PiggyBank, Droplets, ShieldCheck, GraduationCap, Leaf, Lightbulb,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  PageHeader, Section, Card, Pill, StatStrip, StatTile, LoadingShell, EmptyState,
  SourcesFooter, Toolbar, ToolbarButton,
} from "@/components/district/ui";
import type { Tone } from "@/components/district/ui";
import { Explainer, Pictogram } from "@/components/district/visuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleNews from "@/components/district/ModuleNews";
import { getModuleSources, getStateConfig } from "@/lib/constants/state-config";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// Urgency → label + Pill tone (colour appears only as the pill's text/dot).
const URGENCY_LABEL: Record<string, string> = { now: "Do now", soon: "This month", general: "Good to know" };
const URGENCY_TONE: Record<string, Tone> = { now: "danger", soon: "warn", general: "neutral" };

// Tip category → Lucide icon (replaces the emoji the AI returns in `icon`).
const CAT_ICONS: Record<string, LucideIcon> = {
  Agriculture: Wheat, Health: HeartPulse, Finance: PiggyBank, Water: Droplets,
  Rights: Scale, Safety: ShieldCheck, Education: GraduationCap, Environment: Leaf,
};

const HELPLINES: { name: string; number: string; icon: LucideIcon }[] = [
  { name: "Police Emergency", number: "100", icon: Siren },
  { name: "Fire", number: "101", icon: Flame },
  { name: "Ambulance", number: "108", icon: Ambulance },
  { name: "National Emergency", number: "112", icon: PhoneCall },
  { name: "Women Helpline", number: "1091", icon: UserRound },
  { name: "Child Helpline", number: "1098", icon: Baby },
  { name: "Senior Citizen", number: "14567", icon: HeartHandshake },
  { name: "Cyber Crime", number: "1930", icon: Laptop },
  { name: "Anti-Corruption", number: "1064", icon: Scale },
  { name: "Road Accident", number: "1073", icon: Car },
  { name: "Consumer Helpline", number: "1800-11-4000", icon: ShoppingCart },
  { name: "PM KISAN Helpline", number: "155261", icon: Wheat },
];

/** The one number for any emergency — shown big in the picture row. */
const EMERGENCY = HELPLINES.find((h) => h.number === "112");

function getRights(stateSlug: string): { right: string; desc: string; icon: LucideIcon }[] {
  const sc = getStateConfig(stateSlug);
  const isUrban = sc ? !sc.gramPanchayatApplicable : false;
  return [
    { right: "Right to Information (RTI)", desc: "Any citizen can request government documents within 30 days. Fee: ₹10.", icon: FileText },
    { right: "Right to Food", desc: "BPL families entitled to subsidised grain under NFSA at Rs 2–3/kg.", icon: Wheat },
    { right: "Right to Education", desc: "Free & compulsory education for children 6–14 years under RTE Act.", icon: BookOpen },
    { right: "MGNREGA", desc: "100 days of guaranteed wage employment per rural household per year.", icon: Shovel },
    isUrban
      ? { right: "Ward Committee", desc: `Participate in your ward committee meetings. Held quarterly by your municipal corporation${sc?.municipalBody ? ` (${sc.municipalBody})` : ""}.`, icon: Landmark }
      : { right: "Gram Sabha", desc: "Attend your village's Gram Sabha meetings — held quarterly.", icon: Landmark },
    { right: "Consumer Rights", desc: "File consumer complaint online at consumerhelpline.gov.in.", icon: Scale },
  ];
}

interface CitizenTip {
  category: string;
  /** Emoji from the AI pipeline — kept in the data; cards show a Lucide icon per category. */
  icon: string;
  title: string;
  description: string;
  urgency: "now" | "soon" | "general";
}

type Tab = "ai-tips" | "helplines" | "rights";

/** 36 px icon chip in the page hue (tint background, hue icon). */
function IconSquare({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span aria-hidden className="ftp-icon-chip" style={{ width: 36, height: 36, borderRadius: 11 }}>
      <Icon size={18} />
    </span>
  );
}

/** Soft hue wash used by the helpline tiles and the 112 card (same as Card tinted). */
const TINTED_SURFACE: React.CSSProperties = {
  background: "linear-gradient(135deg, color-mix(in srgb, var(--hue) 7%, #fff) 0%, #fff 70%)",
  border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
  borderRadius: "var(--ftp-radius-card)",
  boxShadow: "var(--ftp-shadow-1)",
};

/** Share button: the phone's share sheet when available, else copy the link. */
function SharePageButton() {
  const [copied, setCopied] = useState(false);
  function share() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: document.title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => {});
    }
  }
  return <ToolbarButton icon={Share2} onClick={share}>{copied ? "Link copied" : "Share"}</ToolbarButton>;
}

/** The big tap-to-call card for 112 (right half of the picture row). */
function EmergencyCallCard({ helpline }: { helpline: { name: string; number: string } }) {
  return (
    <a
      href={`tel:${helpline.number}`}
      className="ftp-card-link"
      aria-label={`Call ${helpline.name}: ${helpline.number}`}
      style={{
        ...TINTED_SURFACE,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: 18,
        textAlign: "center",
        textDecoration: "none",
        color: "var(--ftp-text)",
      }}
    >
      <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 56, height: 56, fontSize: 28, borderRadius: 18 }}>
        🚨
      </span>
      <span className="ftp-bignum" style={{ fontSize: 48, lineHeight: 1, color: "var(--hue-deep)", marginTop: 4 }}>
        {helpline.number}
      </span>
      <span style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600 }}>{helpline.name}</span>
      <span style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>One number for any emergency. Tap to call.</span>
    </a>
  );
}

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
  const sources = getModuleSources("citizen-corner", state);

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

  const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
    { id: "ai-tips", label: "AI tips", icon: Sparkles },
    { id: "helplines", label: "Helplines", icon: Phone },
    { id: "rights", label: "Your rights", icon: Scale },
  ];

  const tipsPeriod = tipsMonth && tipsYear ? `${MONTHS[tipsMonth - 1]} ${tipsYear}` : null;
  const nowCount = tips.filter((t) => t.urgency === "now").length;
  // Pictogram: one symbol per tip when there are few; otherwise out of 10.
  const perTip = tips.length <= 12;

  return (
    <div className="ftp-container" style={{ maxWidth: "var(--ftp-reading-max)", margin: 0, paddingTop: 24, paddingBottom: 48 }}>
      <PageHeader
        icon={Users}
        title="Citizen Corner"
        description="AI-powered civic tips, rights, and emergency helplines"
        backHref={base}
        accent={getModuleAccent("citizen-corner")}
        source={{ label: "District Administration" }}
      />
      <AIInsightCard module="citizen-corner" district={district} />

      <StatStrip cols={3}>
        <StatTile
          emoji="💡"
          label="Civic tips"
          value={tipsLoading ? "—" : tips.length}
          sub={tipsPeriod ? `For ${tipsPeriod}` : "Generated weekly"}
        />
        <StatTile
          emoji="⏰"
          label="Do now"
          value={tipsLoading ? "—" : nowCount}
          sub="Urgent tips"
        />
        <StatTile emoji="📞" label="Helplines" value={HELPLINES.length} sub="Tap a number to call" />
      </StatStrip>

      {/* The picture: this week's tips in one plain sentence with the urgent
          ones lit as alarm clocks, beside a big tap-to-call 112. Drawn after
          the tips have loaded so the row does not jump. */}
      {!tipsLoading && (
        tips.length > 0 ? (
          <div className="ftp-picture-row" style={{ marginTop: 16 }}>
            <Card tinted padding={18}>
              <Explainer title="In simple words" emoji="💡">
                {tipsPeriod ? <>For {tipsPeriod}, there</> : "There"} {tips.length === 1 ? "is" : "are"}{" "}
                <strong className="ftp-num">{tips.length}</strong> civic {tips.length === 1 ? "tip" : "tips"} for your district.
                {nowCount > 0 && (
                  <>
                    {" "}<strong className="ftp-num">{nowCount}</strong> of them {nowCount === 1 ? "is something" : "are things"} to do now.
                  </>
                )}
              </Explainer>
              {nowCount > 0 && (
                <Pictogram
                  total={perTip ? tips.length : 10}
                  filled={perTip ? nowCount : (nowCount / tips.length) * 10}
                  emoji="⏰"
                  label={
                    perTip
                      ? `${nowCount} of these ${tips.length} tips are marked "Do now".`
                      : `About ${Math.round((nowCount / tips.length) * 10)} of every 10 tips are marked "Do now".`
                  }
                />
              )}
            </Card>
            {EMERGENCY && <EmergencyCallCard helpline={EMERGENCY} />}
          </div>
        ) : (
          EMERGENCY && (
            <div style={{ marginTop: 16, maxWidth: 360 }}>
              <EmergencyCallCard helpline={EMERGENCY} />
            </div>
          )
        )
      )}

      {/* Tab switcher — real tabs, 44 px tall, hue underline on the active one */}
      <div
        role="tablist"
        aria-label="Citizen Corner sections"
        style={{ display: "flex", gap: 4, margin: "24px 0 20px", borderBottom: "1px solid var(--ftp-border)", overflowX: "auto" }}
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                minHeight: 44,
                padding: "0 14px",
                fontFamily: "var(--ftp-font-sans)",
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                cursor: "pointer",
                background: active ? "color-mix(in srgb, var(--hue-tint) 70%, transparent)" : "transparent",
                border: "none",
                borderRadius: "10px 10px 0 0",
                borderBottom: active ? "3px solid var(--hue)" : "3px solid transparent",
                color: active ? "var(--hue-deep)" : "var(--ftp-text-2)",
                marginBottom: -1,
                whiteSpace: "nowrap",
              }}
            >
              <t.icon size={16} aria-hidden />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── AI Tips ─────────────────────────────────────── */}
      {tab === "ai-tips" && (
        <div role="tabpanel" aria-label="AI Tips">
          {tipsLoading && <LoadingShell rows={4} />}

          {!tipsLoading && tips.length === 0 && (
            <EmptyState
              emoji="💡"
              title="Citizen tips are generated every week"
              body={
                nextRefreshDays != null
                  ? `Next tips will be available in ${nextRefreshDays === 1 ? "1 day" : nextRefreshDays + " days"}.`
                  : "New tips will be generated automatically next week."
              }
              action={<Pill tone="warn" icon={RefreshCw}>Auto-generated every Sunday</Pill>}
            />
          )}

          {!tipsLoading && tips.length > 0 && (
            <>
              {tipsPeriod && (
                <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Pill tone="features" icon={Sparkles}>AI-generated tips for {tipsPeriod}</Pill>
                  <span style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>Updated weekly</span>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: 12 }}>
                {tips.map((tip, i) => (
                  <Card key={i} as="article" tinted={tip.urgency === "now"}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                      <IconSquare icon={CAT_ICONS[tip.category] ?? Lightbulb} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                          <Pill>{tip.category}</Pill>
                          <Pill tone={URGENCY_TONE[tip.urgency] ?? "neutral"} dot>
                            {URGENCY_LABEL[tip.urgency] ?? tip.urgency}
                          </Pill>
                        </div>
                        <h3 className="ftp-title" style={{ fontSize: 15, lineHeight: "21px", fontWeight: 600 }}>{tip.title}</h3>
                      </div>
                    </div>
                    <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{tip.description}</p>
                  </Card>
                ))}
              </div>

              <p style={{ marginTop: 16, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                Tips are AI-generated and should be verified with official sources.
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Helplines ───────────────────────────────────── */}
      {tab === "helplines" && (
        <div role="tabpanel" aria-label="Helplines">
          <Section title="Emergency & important helplines" emoji="☎️">
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(160px, 100%), 1fr))", gap: 8 }}>
              {HELPLINES.map((h) => (
                <li key={h.number}>
                  <a
                    href={`tel:${h.number}`}
                    className="ftp-card-link"
                    aria-label={`Call ${h.name}: ${h.number}`}
                    style={{
                      ...TINTED_SURFACE,
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", minHeight: 56,
                      textDecoration: "none",
                    }}
                  >
                    <span aria-hidden className="ftp-icon-chip" style={{ width: 32, height: 32, borderRadius: 10 }}>
                      <h.icon size={16} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div className="ftp-num" style={{ fontSize: 16, lineHeight: "22px", color: "var(--hue-deep)" }}>{h.number}</div>
                      <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{h.name}</div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      )}

      {/* ── Rights ──────────────────────────────────────── */}
      {tab === "rights" && (
        <div role="tabpanel" aria-label="Your Rights">
          <Section title="Know your rights" emoji="⚖️">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))", gap: 12 }}>
              {getRights(state).map((r) => (
                <Card key={r.right}>
                  <IconSquare icon={r.icon} />
                  <h3 className="ftp-title" style={{ fontSize: 15, lineHeight: "21px", fontWeight: 600, margin: "10px 0 4px" }}>{r.right}</h3>
                  <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{r.desc}</p>
                </Card>
              ))}
            </div>
          </Section>
        </div>
      )}

      <SourcesFooter sources={sources.sources.map((name) => ({ name, frequency: sources.frequency }))} />
      {/* Related news (renders nothing when no article is tagged for this module) */}
      <ModuleNews district={district} state={state} locale={locale} module="citizen-corner" />
      <Toolbar>
        <SharePageButton />
        <ToolbarButton icon={GitCompare} href={`/${locale}/compare?module=citizen-corner&a=${district}`}>
          Compare with another district
        </ToolbarButton>
      </Toolbar>
    </div>
  );
}
