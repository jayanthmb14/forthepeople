/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Helplines & your rights — module page (v4.1, docs/LAYOUT.md recipe)
// ═══════════════════════════════════════════════════════════════════════
//  The question: "Who do I call, and what are my rights?"
//  The answer, in one sentence: "In any emergency, call 112. Below are 12
//  helplines grouped by what you need, and 6 rights every citizen has."
//
//  ModulePage → PageHeader → Explainer → 4 StatTiles → the picture (what
//  the helplines are for, as 4 shortcut tiles, beside a big tap-to-call
//  112) → helplines grouped by need, as big tap-to-call cards with an "i"
//  button (sheet: when to call, what to say, Call) → rights as picture
//  cards (sheet: what it means, 3 steps to use it, the law, the official
//  website and our related page) → this month's AI civic tips (topics ring
//  + cards) → news → Share / Compare. No tabs: everything is on the page,
//  one scroll away. The civic tips are this page's only AI block (no second
//  AI card); no emoji — the needs and rights use plain Lucide pictures;
//  sources are in the layout's verification panel.
//
//  Tips come from /api/ai/citizen-tips (written weekly by AI, marked so).
//  Text: "page_citizen-corner" namespace; tip titles and descriptions are
//  AI output shown as written; known tip categories are translated.
"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Handshake, PhoneCall, RefreshCw, Sparkles } from "lucide-react";
import {
  Card,
  EmptyState,
  LoadingShell,
  ModulePage,
  PageHeader,
  Pill,
  Section,
  StatStrip,
  StatTile,
} from "@/components/district/ui";
import type { Tone } from "@/components/district/ui";
import { ChartCard, Explainer } from "@/components/district/visuals";
import { HueDonut } from "@/components/district/civic/HueDonut";
import {
  getHelplines,
  type Helpline,
  KINDS,
  HelplineCard,
  HelplineSheet,
  RightCard,
  RightSheet,
  getRights,
  type HelplineKind,
  type Right,
} from "@/components/district/civic/CitizenParts";
import ModuleNews from "@/components/district/ModuleNews";
import { useFormat, useModuleText } from "@/i18n/client";
import { IconChip, PageActions } from "@/components/district/page-kit";

// Urgency → Pill tone (colour appears only as the pill's text/dot).
const URGENCY_TONE: Record<string, Tone> = { now: "danger", soon: "warn", general: "neutral" };

interface CitizenTip {
  category: string;
  /** Emoji from the AI pipeline — kept in the data, not shown. */
  icon: string;
  title: string;
  description: string;
  urgency: "now" | "soon" | "general";
}

/** The big tap-to-call 112 card (right half of the picture row). */
function EmergencyCallCard() {
  const t = useTranslations("page_citizen-corner");
  const name = t("helplines.national.name");
  return (
    <a
      href="tel:112"
      className="ftp-card-link"
      aria-label={t("callAria", { name, number: "112" })}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: 20,
        minHeight: 200,
        textAlign: "center",
        textDecoration: "none",
        color: "var(--hue-deep)",
        borderRadius: "var(--ftp-radius-card)",
        background: "var(--hue-tint)",
        border: "1px solid color-mix(in srgb, var(--hue) 30%, var(--ftp-border))",
        boxShadow: "var(--ftp-shadow-1)",
      }}
    >
      <PhoneCall size={34} strokeWidth={1.75} aria-hidden />
      <span className="ftp-bignum" style={{ fontSize: 64, lineHeight: 1 }}>
        112
      </span>
      <span style={{ fontSize: 16, lineHeight: "22px", fontWeight: 700 }}>{name}</span>
      <span style={{ fontSize: 14, lineHeight: "20px", color: "var(--ftp-text)" }}>{t("emergencyLine")}</span>
    </a>
  );
}

/** The picture: what the helplines are for, as shortcuts to each group. */
function HelplineKinds({ helplines, onPick }: { helplines: Helpline[]; onPick: (kind: HelplineKind) => void }) {
  const t = useTranslations("page_citizen-corner");
  const f = useFormat();
  return (
    <Card tinted padding={18}>
      <p className="ftp-display" style={{ margin: 0, fontSize: 18, lineHeight: "24px", fontWeight: 650, color: "var(--ftp-text)" }}>
        {t("kindsTitle", { n: helplines.length })}
      </p>
      <p style={{ margin: "2px 0 12px", fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{t("kindsLead")}</p>
      <ul className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "170px", gap: 10, listStyle: "none", margin: 0, padding: 0 } as React.CSSProperties}>
        {KINDS.map((k) => {
          const n = helplines.filter((h) => h.kind === k.id).length;
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
                  minHeight: 64,
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
                <IconChip icon={k.icon} size={44} />
                <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span className="ftp-bignum" style={{ fontSize: 24, lineHeight: 1, color: "var(--hue-deep)" }}>
                    {f.number(n)}
                  </span>
                  <span style={{ marginTop: 2, fontSize: 13, lineHeight: "17px", color: "var(--ftp-text)" }}>{label}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/** Chart: the tips' topics as a ring (hidden with fewer than two tips). */
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
    .map(([cat, value]) => ({ key: cat, label: topic(cat), value }))
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
    <ChartCard
      title={t("topicsTitle")}
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
  );
}

export default function CitizenCornerPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_citizen-corner");
  const mt = useModuleText();
  const f = useFormat();
  const base = `/${locale}/${state}/${district}`;
  const [tips, setTips] = useState<CitizenTip[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [tipsMonth, setTipsMonth] = useState<number | null>(null);
  const [tipsYear, setTipsYear] = useState<number | null>(null);
  const [nextRefreshDays, setNextRefreshDays] = useState<number | null>(null);
  const [helpline, setHelpline] = useState<Helpline | null>(null);
  const [right, setRight] = useState<Right | null>(null);
  const closeHelpline = useCallback(() => setHelpline(null), []);
  const closeRight = useCallback(() => setRight(null), []);

  const tipsLoading = loadedFor !== district;
  const rights = getRights(state, district);
  const helplines = getHelplines(state);
  const emergencyCount = helplines.filter((h) => h.kind === "emergency").length;

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

  // Mid-month date so the IST month is right in every time zone.
  const tipsPeriod =
    tipsMonth && tipsYear ? f.date(Date.UTC(tipsYear, tipsMonth - 1, 15), { month: "long", year: "numeric" }) : null;
  const b = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;
  const categoryLabel = (cat: string) => {
    const k = cat.toLowerCase();
    return t.has(`categories.${k}`) ? t(`categories.${k}`) : cat;
  };
  const jumpTo = (kind: HelplineKind) =>
    document.getElementById(`helplines-${kind}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <ModulePage>
      <PageHeader
        icon={Handshake}
        title={mt.label("citizen-corner")}
        description={t("description")}
        backHref={base}
        source={{ label: t("sourceNames.districtAdministration") }}
      />

      <Explainer>{t.rich("simple", { helplines: helplines.length, rights: rights.length, b })}</Explainer>

      <StatStrip cols={4}>
        <StatTile label={t("tileHelplines")} value={f.number(helplines.length)} sub={t("tileHelplinesSub")} />
        <StatTile label={t("tileEmergency")} value={f.number(emergencyCount)} sub={t("tileEmergencySub")} />
        <StatTile label={t("tileRights")} value={f.number(rights.length)} sub={t("tileRightsSub")} />
        <StatTile
          label={t("tileTips")}
          value={tipsLoading ? "—" : f.number(tips.length)}
          sub={tipsPeriod ? t("tileTipsFor", { period: tipsPeriod }) : t("tileTipsWeekly")}
        />
      </StatStrip>

      {/* The picture: what the helplines are for, beside one big number for any emergency. */}
      <div className="ftp-picture-row" style={{ marginTop: 16 }}>
        <HelplineKinds helplines={helplines} onPick={jumpTo} />
        <EmergencyCallCard />
      </div>

      {/* Helplines, grouped by need: tap the card to call, "i" for when to call. */}
      <Section title={t("helplinesTitle")}>
        <p className="ftp-body" style={{ margin: "-6px 0 12px", color: "var(--ftp-text-2)", fontSize: 14, lineHeight: "21px" }}>
          {t("helplinesLead")}
        </p>
        {KINDS.map((k) => (
          <div key={k.id} id={`helplines-${k.id}`} style={{ marginBottom: 20, scrollMarginTop: 80 }}>
            <h3 className="ftp-title" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 650, fontSize: 16, margin: "0 0 10px" }}>
              <k.icon size={18} strokeWidth={1.75} aria-hidden style={{ color: "var(--hue)" }} />
              {t(`kinds.${k.id}`)}
            </h3>
            <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "260px", gap: 12 } as React.CSSProperties}>
              {helplines.filter((h) => h.kind === k.id).map((h) => (
                <HelplineCard key={h.key} h={h} onInfo={() => setHelpline(h)} />
              ))}
            </div>
          </div>
        ))}
      </Section>

      {/* Rights, as picture cards; tap for the plain-language explanation. */}
      <Section title={t("rightsTitle")}>
        <p className="ftp-body" style={{ margin: "-6px 0 12px", color: "var(--ftp-text-2)", fontSize: 14, lineHeight: "21px" }}>
          {t("rightsLead")}
        </p>
        <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "240px" } as React.CSSProperties}>
          {rights.map((r) => (
            <RightCard key={r.id} r={r} onOpen={() => setRight(r)} />
          ))}
        </div>
      </Section>

      {/* This month's civic tips (AI-written, marked so). */}
      <Section title={t("tipsTitle")}>
        {tipsLoading && <LoadingShell rows={3} />}
        {!tipsLoading && tips.length === 0 && (
          <EmptyState
            title={t("emptyTitle")}
            body={nextRefreshDays != null ? t("emptyNext", { n: nextRefreshDays }) : t("emptyNextWeek")}
            action={
              <Pill tone="warn" icon={RefreshCw}>
                {t("emptyPill")}
              </Pill>
            }
          />
        )}
        {!tipsLoading && tips.length > 0 && (
          <>
            <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {tipsPeriod && (
                <Pill tone="features" icon={Sparkles}>
                  {t("tipsFor", { period: tipsPeriod })}
                </Pill>
              )}
              <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{t("updatedWeekly")}</span>
            </div>
            <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "280px" } as React.CSSProperties}>
              {tips.map((tip, i) => (
                <Card key={i} as="article" tinted={tip.urgency === "now"}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                        <Pill>{categoryLabel(tip.category)}</Pill>
                        <Pill tone={URGENCY_TONE[tip.urgency] ?? "neutral"} dot>
                          {t.has(`urgency.${tip.urgency}`) ? t(`urgency.${tip.urgency}`) : tip.urgency}
                        </Pill>
                      </div>
                      <h3 className="ftp-title" style={{ fontSize: 16, lineHeight: "22px", fontWeight: 650 }} lang="en">
                        {tip.title}
                      </h3>
                    </div>
                  </div>
                  <p className="ftp-body" style={{ color: "var(--ftp-text-2)", fontSize: 14, lineHeight: "21px" }} lang="en">
                    {tip.description}
                  </p>
                </Card>
              ))}
            </div>
            {/* The topics ring beside a short note on where the tips come from. */}
            <div className={tips.length >= 2 ? "ftp-picture-row" : undefined} style={{ marginTop: 16 }}>
              <TopicsRing tips={tips} period={tipsPeriod} />
              <Card tinted padding={18}>
                <p className="ftp-display" style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 650 }}>
                  {t("aboutTipsTitle")}
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: "21px", color: "var(--ftp-text-2)" }}>{t("tipsNote")}</p>
              </Card>
            </div>
          </>
        )}
      </Section>

      <ModuleNews district={district} state={state} locale={locale} module="citizen-corner" />
      <div style={{ marginTop: 28 }}>
        <PageActions locale={locale} district={district} moduleSlug="citizen-corner" />
      </div>

      <HelplineSheet h={helpline} onClose={closeHelpline} />
      <RightSheet r={right} onClose={closeRight} base={base} />
    </ModulePage>
  );
}
