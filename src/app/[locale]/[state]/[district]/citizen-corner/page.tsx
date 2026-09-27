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
//  simple words" about this month's tips with a pictogram of the urgent
//  ones, beside a big tap-to-call 112 card) → a row of helpline groups
//  (what the numbers are for, each a shortcut into the Helplines tab) →
//  three tabs (AI tips, with a ring of the tips' topics · Helplines, grouped
//  · Your rights) → SourcesFooter → Toolbar (Share, Compare).
//
//  Tips come from /api/ai/citizen-tips (generated weekly). Each tip card
//  shows a Lucide icon for its category in a hue chip, a category Pill and
//  an urgency Pill (semantic colours). Helplines are real tel: links with
//  44 px+ touch targets.
//
//  Language: interface text, helpline names and the rights come from the
//  "page_citizen-corner" namespace. Tip titles and descriptions are AI
//  output and are shown as written; known tip categories are translated.
//
"use client";
import { use, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
import { ChartCard, Explainer, Pictogram } from "@/components/district/visuals";
import { HueDonut } from "@/components/district/civic/HueDonut";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleNews from "@/components/district/ModuleNews";
import { useFormat, useModuleText } from "@/i18n/client";
import { getModuleSources, getStateConfig } from "@/lib/constants/state-config";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

type T = ReturnType<typeof useTranslations>;

// Urgency → Pill tone (colour appears only as the pill's text/dot).
const URGENCY_TONE: Record<string, Tone> = { now: "danger", soon: "warn", general: "neutral" };

// Tip category → Lucide icon (replaces the emoji the AI returns in `icon`).
const CAT_ICONS: Record<string, LucideIcon> = {
  Agriculture: Wheat, Health: HeartPulse, Finance: PiggyBank, Water: Droplets,
  Rights: Scale, Safety: ShieldCheck, Education: GraduationCap, Environment: Leaf,
};
// …and emoji for the topics ring legend.
const CAT_EMOJI: Record<string, string> = {
  agriculture: "🌾", health: "🩺", finance: "💰", water: "💧",
  rights: "⚖️", safety: "🛡️", education: "🎓", environment: "🌳",
};

type HelplineKind = "emergency" | "care" | "complaints" | "farmers";
const KINDS: Array<{ id: HelplineKind; emoji: string }> = [
  { id: "emergency", emoji: "🚨" },
  { id: "care", emoji: "🛡️" },
  { id: "complaints", emoji: "📢" },
  { id: "farmers", emoji: "🌾" },
];

/** Helplines: the name is a message key (helplines.<key>). */
const HELPLINES: { key: string; number: string; icon: LucideIcon; kind: HelplineKind }[] = [
  { key: "police", number: "100", icon: Siren, kind: "emergency" },
  { key: "fire", number: "101", icon: Flame, kind: "emergency" },
  { key: "ambulance", number: "108", icon: Ambulance, kind: "emergency" },
  { key: "national", number: "112", icon: PhoneCall, kind: "emergency" },
  { key: "road", number: "1073", icon: Car, kind: "emergency" },
  { key: "women", number: "1091", icon: UserRound, kind: "care" },
  { key: "child", number: "1098", icon: Baby, kind: "care" },
  { key: "senior", number: "14567", icon: HeartHandshake, kind: "care" },
  { key: "cyber", number: "1930", icon: Laptop, kind: "complaints" },
  { key: "corruption", number: "1064", icon: Scale, kind: "complaints" },
  { key: "consumer", number: "1800-11-4000", icon: ShoppingCart, kind: "complaints" },
  { key: "pmkisan", number: "155261", icon: Wheat, kind: "farmers" },
];

/** Source names and update frequencies from getModuleSources() that have a translation. */
const SOURCE_KEY: Record<string, string> = { "District Administration": "districtAdministration", "Citizen feedback": "citizenFeedback" };
const FREQ_KEY: Record<string, string> = { Weekly: "weekly" };

function getRights(stateSlug: string, t: T): { id: string; right: string; desc: string; icon: LucideIcon }[] {
  const sc = getStateConfig(stateSlug);
  const isUrban = sc ? !sc.gramPanchayatApplicable : false;
  const local = isUrban
    ? sc?.municipalBody
      ? { id: "ward", right: t("rights.wardBody.title"), desc: t("rights.wardBody.desc", { body: sc.municipalBody }), icon: Landmark }
      : { id: "ward", right: t("rights.ward.title"), desc: t("rights.ward.desc"), icon: Landmark }
    : { id: "gramSabha", right: t("rights.gramSabha.title"), desc: t("rights.gramSabha.desc"), icon: Landmark };
  return [
    { id: "rti", right: t("rights.rti.title"), desc: t("rights.rti.desc"), icon: FileText },
    { id: "food", right: t("rights.food.title"), desc: t("rights.food.desc"), icon: Wheat },
    { id: "education", right: t("rights.education.title"), desc: t("rights.education.desc"), icon: BookOpen },
    { id: "mgnrega", right: t("rights.mgnrega.title"), desc: t("rights.mgnrega.desc"), icon: Shovel },
    local,
    { id: "consumer", right: t("rights.consumer.title"), desc: t("rights.consumer.desc"), icon: Scale },
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
  const t = useTranslations("page_citizen-corner");
  const [copied, setCopied] = useState(false);
  function share() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: document.title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => {});
    }
  }
  return <ToolbarButton icon={Share2} onClick={share}>{copied ? t("linkCopied") : t("share")}</ToolbarButton>;
}

/** The big tap-to-call card for 112 (right half of the picture row). */
function EmergencyCallCard({ number }: { number: string }) {
  const t = useTranslations("page_citizen-corner");
  const name = t("emergencyName");
  return (
    <a
      href={`tel:${number}`}
      className="ftp-card-link"
      aria-label={t("callAria", { name, number })}
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
        {number}
      </span>
      <span style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600 }}>{name}</span>
      <span style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{t("emergencyLine")}</span>
    </a>
  );
}

/**
 * Second picture: the helplines counted by what they are for. Every tile
 * is a shortcut that opens the Helplines tab at that group.
 */
function HelplineKinds({ onPick }: { onPick: (kind: HelplineKind) => void }) {
  const t = useTranslations("page_citizen-corner");
  const f = useFormat();
  return (
    <Card tinted padding={18} style={{ marginTop: 16 }}>
      <p className="ftp-display" style={{ margin: 0, fontSize: 17, lineHeight: "22px", fontWeight: 600, color: "var(--ftp-text)" }}>
        {t("kindsTitle", { n: HELPLINES.length })}
      </p>
      <p style={{ margin: "2px 0 12px", fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{t("kindsLead")}</p>
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(170px, 100%), 1fr))",
          gap: 10,
        }}
      >
        {KINDS.map((k) => {
          const n = HELPLINES.filter((h) => h.kind === k.id).length;
          const label = t(`kinds.${k.id}`);
          return (
            <li key={k.id}>
              <button
                type="button"
                onClick={() => onPick(k.id)}
                aria-label={t("kindsAria", { label, n })}
                className="ftp-card-link"
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: 44,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid color-mix(in srgb, var(--hue) 20%, var(--ftp-border))",
                  background: "#fff",
                  cursor: "pointer",
                  textAlign: "left",
                  font: "inherit",
                  color: "var(--ftp-text)",
                }}
              >
                <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 40, height: 40, fontSize: 20, borderRadius: 12 }}>
                  {k.emoji}
                </span>
                <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span className="ftp-bignum" style={{ fontSize: 24, lineHeight: 1, color: "var(--hue-deep)" }}>{f.number(n)}</span>
                  <span style={{ marginTop: 2, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{label}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/** The tips' topics as a ring (hidden with fewer than two tips). */
function TopicsRing({ tips, period }: { tips: CitizenTip[]; period: string | null }) {
  const t = useTranslations("page_citizen-corner");
  const f = useFormat();
  if (tips.length < 2) return null;
  const counts = new Map<string, number>();
  for (const tip of tips) counts.set(tip.category, (counts.get(tip.category) ?? 0) + 1);
  const topic = (cat: string) => {
    const k = cat.toLowerCase();
    return t.has(`categories.${k}`) ? t(`categories.${k}`) : cat;
  };
  const slices = [...counts.entries()]
    .map(([cat, value]) => ({ key: cat, label: topic(cat), value, emoji: CAT_EMOJI[cat.toLowerCase()] ?? "💡" }))
    .sort((a, b) => b.value - a.value);
  const total = tips.length;
  const top = slices[0];
  const tied = slices.filter((s) => s.value === top.value).length;
  const simple =
    tied === slices.length && slices.length > 1
      ? t("topicsEven", { n: f.number(top.value) })
      : tied > 1
        ? t("topicsTied", { count: f.number(tied), n: f.number(top.value) })
        : t.rich("topicsTop", { topic: top.label, n: f.number(top.value), total: f.number(total), b: (c) => <strong>{c}</strong> });
  const summary = slices.map((s) => `${s.label}: ${f.number(s.value)}`).join(", ");
  return (
    <div style={{ marginBottom: 16 }}>
      <ChartCard
        title={t("topicsTitle")}
        emoji="🧭"
        units={t("topicsUnits")}
        simple={simple}
        asOfPeriod={period ?? undefined}
        table={slices.map((s) => ({ label: s.label, value: f.number(s.value) }))}
      >
        <HueDonut
          slices={slices}
          centerValue={f.number(total)}
          centerLabel={t("topicsCenter", { n: total })}
          ariaLabel={t("topicsAria", { summary })}
          otherLabel={t("topicsOther")}
        />
      </ChartCard>
    </div>
  );
}

export default function CitizenCornerPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_citizen-corner");
  const mt = useModuleText();
  const f = useFormat();
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
    { id: "ai-tips", label: t("tabTips"), icon: Sparkles },
    { id: "helplines", label: t("tabHelplines"), icon: Phone },
    { id: "rights", label: t("tabRights"), icon: Scale },
  ];

  // Mid-month date so the IST month is right in every time zone.
  const tipsPeriod =
    tipsMonth && tipsYear ? f.date(Date.UTC(tipsYear, tipsMonth - 1, 15), { month: "long", year: "numeric" }) : null;
  const nowCount = tips.filter((tip) => tip.urgency === "now").length;
  // Pictogram: one symbol per tip when there are few; otherwise out of 10.
  const perTip = tips.length <= 12;
  const emergency = HELPLINES.find((h) => h.number === "112");
  const b = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;
  const categoryLabel = (cat: string) => {
    const k = cat.toLowerCase();
    return t.has(`categories.${k}`) ? t(`categories.${k}`) : cat;
  };

  return (
    <div className="ftp-container" style={{ maxWidth: "var(--ftp-reading-max)", margin: 0, paddingTop: 24, paddingBottom: 48 }}>
      <PageHeader
        icon={Users}
        title={mt.label("citizen-corner")}
        description={t("description")}
        backHref={base}
        accent={getModuleAccent("citizen-corner")}
        source={{ label: t("sourceNames.districtAdministration") }}
      />
      <AIInsightCard module="citizen-corner" district={district} />

      <StatStrip cols={3}>
        <StatTile
          emoji="💡"
          label={t("tileTips")}
          value={tipsLoading ? "—" : f.number(tips.length)}
          sub={tipsPeriod ? t("tileTipsFor", { period: tipsPeriod }) : t("tileTipsWeekly")}
        />
        <StatTile
          emoji="⏰"
          label={t("tileNow")}
          value={tipsLoading ? "—" : f.number(nowCount)}
          sub={t("tileNowSub")}
        />
        <StatTile emoji="📞" label={t("tileHelplines")} value={f.number(HELPLINES.length)} sub={t("tileHelplinesSub")} />
      </StatStrip>

      {/* The picture: this month's tips in one plain sentence with the urgent
          ones lit as alarm clocks, beside a big tap-to-call 112. Drawn after
          the tips have loaded so the row does not jump. */}
      {!tipsLoading && (
        tips.length > 0 ? (
          <div className="ftp-picture-row" style={{ marginTop: 16 }}>
            <Card tinted padding={18}>
              <Explainer emoji="💡">
                {t.rich("simple", { hasPeriod: tipsPeriod ? "yes" : "no", period: tipsPeriod ?? "", n: tips.length, b })}
                {nowCount > 0 && <> {t.rich("simpleNow", { n: nowCount, b })}</>}
              </Explainer>
              {nowCount > 0 && (
                <Pictogram
                  total={perTip ? tips.length : 10}
                  filled={perTip ? nowCount : (nowCount / tips.length) * 10}
                  emoji="⏰"
                  label={
                    perTip
                      ? t("pictogramPerTip", { now: nowCount, total: tips.length })
                      : t("pictogramOutOf10", { n: Math.round((nowCount / tips.length) * 10) })
                  }
                />
              )}
            </Card>
            {emergency && <EmergencyCallCard number={emergency.number} />}
          </div>
        ) : (
          emergency && (
            <div style={{ marginTop: 16, maxWidth: 360 }}>
              <EmergencyCallCard number={emergency.number} />
            </div>
          )
        )
      )}

      {/* Second picture: what the helplines are for, as shortcuts. */}
      <HelplineKinds
        onPick={(kind) => {
          setTab("helplines");
          // Two frames: the tab panel renders, then its group is scrolled to.
          requestAnimationFrame(() =>
            requestAnimationFrame(() => document.getElementById(`helplines-${kind}`)?.scrollIntoView({ block: "start" }))
          );
        }}
      />

      {/* Tab switcher — real tabs, 44 px tall, hue underline on the active one */}
      <div
        role="tablist"
        aria-label={t("tabsLabel")}
        style={{ display: "flex", gap: 4, margin: "24px 0 20px", borderBottom: "1px solid var(--ftp-border)", overflowX: "auto" }}
      >
        {TABS.map((tb) => {
          const active = tab === tb.id;
          return (
            <button
              key={tb.id}
              id={`cc-tab-${tb.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`cc-panel-${tb.id}`}
              onClick={() => setTab(tb.id)}
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
              <tb.icon size={16} aria-hidden />
              {tb.label}
            </button>
          );
        })}
      </div>

      {/* ── AI Tips ─────────────────────────────────────── */}
      {tab === "ai-tips" && (
        <div role="tabpanel" id="cc-panel-ai-tips" aria-labelledby="cc-tab-ai-tips">
          {tipsLoading && <LoadingShell rows={4} />}

          {!tipsLoading && tips.length === 0 && (
            <EmptyState
              emoji="💡"
              title={t("emptyTitle")}
              body={nextRefreshDays != null ? t("emptyNext", { n: nextRefreshDays }) : t("emptyNextWeek")}
              action={<Pill tone="warn" icon={RefreshCw}>{t("emptyPill")}</Pill>}
            />
          )}

          {!tipsLoading && tips.length > 0 && (
            <>
              {tipsPeriod && (
                <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Pill tone="features" icon={Sparkles}>{t("tipsFor", { period: tipsPeriod })}</Pill>
                  <span style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{t("updatedWeekly")}</span>
                </div>
              )}

              <TopicsRing tips={tips} period={tipsPeriod} />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: 12 }}>
                {tips.map((tip, i) => (
                  <Card key={i} as="article" tinted={tip.urgency === "now"}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                      <IconSquare icon={CAT_ICONS[tip.category] ?? Lightbulb} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                          <Pill>{categoryLabel(tip.category)}</Pill>
                          <Pill tone={URGENCY_TONE[tip.urgency] ?? "neutral"} dot>
                            {t.has(`urgency.${tip.urgency}`) ? t(`urgency.${tip.urgency}`) : tip.urgency}
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
                {t("tipsNote")}
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Helplines ───────────────────────────────────── */}
      {tab === "helplines" && (
        <div role="tabpanel" id="cc-panel-helplines" aria-labelledby="cc-tab-helplines">
          <Section title={t("helplinesTitle")} emoji="☎️">
            {KINDS.map((k) => (
              <div key={k.id} id={`helplines-${k.id}`} style={{ marginBottom: 16 }}>
                <h3 className="ftp-title" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, margin: "0 0 8px" }}>
                  <span className="ftp-emoji" aria-hidden>{k.emoji}</span>
                  {t(`kinds.${k.id}`)}
                </h3>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(160px, 100%), 1fr))", gap: 8 }}>
                  {HELPLINES.filter((h) => h.kind === k.id).map((h) => {
                    const name = t(`helplines.${h.key}`);
                    return (
                      <li key={h.number}>
                        <a
                          href={`tel:${h.number}`}
                          className="ftp-card-link"
                          aria-label={t("callAria", { name, number: h.number })}
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
                            <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{name}</div>
                          </div>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </Section>
        </div>
      )}

      {/* ── Rights ──────────────────────────────────────── */}
      {tab === "rights" && (
        <div role="tabpanel" id="cc-panel-rights" aria-labelledby="cc-tab-rights">
          <Section title={t("rightsTitle")} emoji="⚖️">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))", gap: 12 }}>
              {getRights(state, t).map((r) => (
                <Card key={r.id}>
                  <IconSquare icon={r.icon} />
                  <h3 className="ftp-title" style={{ fontSize: 15, lineHeight: "21px", fontWeight: 600, margin: "10px 0 4px" }}>{r.right}</h3>
                  <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{r.desc}</p>
                </Card>
              ))}
            </div>
          </Section>
        </div>
      )}

      <SourcesFooter
        sources={sources.sources.map((name) => ({
          name: SOURCE_KEY[name] ? t(`sourceNames.${SOURCE_KEY[name]}`) : name,
          frequency: FREQ_KEY[sources.frequency] ? t(`freq.${FREQ_KEY[sources.frequency]}`) : sources.frequency,
        }))}
      />
      {/* Related news (renders nothing when no article is tagged for this module) */}
      <ModuleNews district={district} state={state} locale={locale} module="citizen-corner" />
      <Toolbar label={t("toolbar")}>
        <SharePageButton />
        <ToolbarButton icon={GitCompare} href={`/${locale}/compare?module=citizen-corner&a=${district}`}>
          {t("compare")}
        </ToolbarButton>
      </Toolbar>
    </div>
  );
}
