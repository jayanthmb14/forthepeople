/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Leaders & officers — module page (v4.1, docs/LAYOUT.md recipe)
// ═══════════════════════════════════════════════════════════════════════
//  The question: "Who runs my district, and who is above whom?"
//  The answer, in one sentence: "N people run <district>, from the
//  President down to your town; M of them are the MP and MLAs you vote for."
//
//  ModulePage → PageHeader → Explainer (real counts) → 4 StatTiles → the
//  picture: LeaderLadder ("who is above whom", country → state → your MP
//  and MLAs → district officers → city) with tappable names → one list of
//  person cards per level (ftp-grid; tapping a card opens LeaderSheet with
//  the job in plain words, party, area, since when, office contact when
//  stored, how the record was checked, and the latest news that names the
//  person) → party ring + notes → next election → sources → news → toolbar.
//
//  Data: /api/data/leaders (rows guessed from news are never served),
//  grouped by the Leader.tier column; nothing about who sits where is
//  hard-coded. Text: "page_leadership" namespace. Names, roles, parties
//  and constituencies are records and are shown as stored (the local-script
//  role replaces the English one when it is in the reader's language).
"use client";

import { use, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeftRight, ChevronRight, Download, Share2, Users } from "lucide-react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleNews from "@/components/district/ModuleNews";
import { useLeaders } from "@/hooks/useRealtimeData";
import type { Leader } from "@/hooks/useRealtimeData";
import {
  Card,
  EmptyState,
  ErrorBlock,
  LoadingShell,
  ModulePage,
  PageHeader,
  Section,
  SourcesFooter,
  StatStrip,
  StatTile,
  Toolbar,
  ToolbarButton,
} from "@/components/district/ui";
import { ChartCard, Explainer } from "@/components/district/visuals";
import { HueDonut } from "@/components/district/civic/HueDonut";
import { LeaderLadder } from "@/components/district/civic/LeaderLadder";
import { LeaderSheet } from "@/components/district/civic/LeaderSheet";
import { LeaderAvatar, isPlaceholderName, orderTiers, roleText, tierMeta } from "@/components/district/civic/leader-shared";
import { daysUntil, findActiveElection, findNextElection, type ElectionEvent } from "@/components/district/ElectionSection";
import { getModuleSources } from "@/lib/constants/state-config";
import { getPartyColor } from "@/lib/constants/party-colors";
import { hueClass } from "@/lib/design/hues";
import { useDistrictName, useFormat, useModuleText } from "@/i18n/client";
import { scriptLang } from "@/lib/utils/script-lang";
import knDict from "@/dictionaries/kn.json";

/** Official websites for the sources named by getModuleSources("leadership"). */
const SOURCE_URLS: Record<string, string> = {
  "Election Commission of India (ECI)": "https://eci.gov.in",
};
const ECI = { label: "ECI", href: SOURCE_URLS["Election Commission of India (ECI)"] };
/** Source names and update frequencies from getModuleSources() that have a translation. */
const SOURCE_KEY: Record<string, string> = { "District Administration": "districtAdministration" };
const FREQ_KEY: Record<string, string> = { "When the source publishes": "whenPublished" };

/** Cards within a level: President before PM, Governor before CM, MP before MLAs. */
const ROLE_ORDER: RegExp[] = [
  /^president\b/i,
  /^prime minister/i,
  /^governor/i,
  /^chief minister/i,
  /^deputy chief minister/i,
  /\bunion minister\b|\bmp\b|member of parliament/i,
  /^district collector|deputy commissioner/i,
  /^superintendent of police|commissioner of police/i,
  /^ceo/i,
  /^mla\b|member of legislative/i,
  /^mayor/i,
  /^municipal commissioner/i,
];
function rank(role: string): number {
  for (let i = 0; i < ROLE_ORDER.length; i++) if (ROLE_ORDER[i].test(role)) return i;
  return ROLE_ORDER.length + 1;
}

/** A name that is only a role ("Prime Minister") is not a person. */
const ROLE_WORDS = /^(prime minister|president|governor|chief minister|minister|mla|mp|speaker|collector|commissioner|mayor|judge|officer|secretary|chairman|director)/i;

/** Turn rows into a CSV file and start a download in the browser. */
function downloadCsv(filename: string, rows: Array<Record<string, string | number | null | undefined>>) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** One person, as a big tappable card. The whole card opens the detail sheet. */
function LeaderCard({ l, emoji, onOpen }: { l: Leader; emoji: string; onOpen: (l: Leader) => void }) {
  const t = useTranslations("page_leadership");
  const f = useFormat();
  const role = roleText(l, f.locale);
  const placeholder = isPlaceholderName(l.name);
  return (
    <button
      type="button"
      onClick={() => onOpen(l)}
      className="ftp-card-link"
      aria-haspopup="dialog"
      aria-label={t("card.openAria", { name: l.name, role: role.text })}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        width: "100%",
        minHeight: 44,
        padding: 14,
        textAlign: "left",
        font: "inherit",
        color: "var(--ftp-text)",
        cursor: "pointer",
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
        boxShadow: "var(--ftp-shadow-1)",
      }}
    >
      <span style={{ position: "relative", flexShrink: 0 }}>
        <LeaderAvatar name={l.name} photoUrl={l.photoUrl} />
        <span
          className="ftp-icon-chip ftp-emoji"
          aria-hidden
          style={{ position: "absolute", right: -4, bottom: -4, width: 24, height: 24, fontSize: 13, borderRadius: 8, border: "2px solid var(--ftp-surface)" }}
        >
          {emoji}
        </span>
      </span>
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          className="ftp-title"
          style={{ fontWeight: 650, color: placeholder ? "var(--ftp-text-2)" : "var(--ftp-text)", fontStyle: placeholder ? "italic" : "normal" }}
        >
          {l.name}
        </span>
        {l.nameLocal && !placeholder && l.nameLocal !== l.name && (
          <span lang={scriptLang(l.nameLocal)} style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
            {l.nameLocal}
          </span>
        )}
        <span lang={role.lang} style={{ fontSize: 14, lineHeight: "20px", color: "var(--ftp-text)" }}>
          {role.text}
        </span>
        {l.constituency && (
          <span style={{ fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)" }}>
            <span aria-hidden>📍 </span>
            {l.constituency}
          </span>
        )}
        <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
          {l.party ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "2px 10px",
                borderRadius: 999,
                border: "1px solid var(--ftp-border)",
                fontSize: 12,
                lineHeight: "18px",
                color: "var(--ftp-text)",
              }}
            >
              {/* Party colour appears only as this dot. */}
              <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: getPartyColor(l.party).border, flexShrink: 0 }} />
              {l.party}
            </span>
          ) : (
            <span />
          )}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 12, lineHeight: "18px", fontWeight: 600, color: "var(--hue-deep)" }}>
            {t("card.details")}
            <ChevronRight size={14} aria-hidden />
          </span>
        </span>
      </span>
    </button>
  );
}

/**
 * Chart: the elected representatives (MP and MLAs) by party, as last
 * reported. Drawn only with at least two representatives and at least
 * one party recorded; a ring of one person says nothing.
 */
function PartyRing({ reps, asOf }: { reps: Leader[]; asOf: string | null }) {
  const t = useTranslations("page_leadership");
  const f = useFormat();
  if (reps.length < 2) return null;
  const counts = new Map<string, number>();
  for (const l of reps) {
    const party = l.party?.trim() || "";
    counts.set(party, (counts.get(party) ?? 0) + 1);
  }
  const slices = [...counts.entries()]
    .map(([party, value]) => ({
      key: party || "__none",
      label: party || t("partyNone"),
      value,
      marker: party ? <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: getPartyColor(party).border }} /> : undefined,
    }))
    .sort((a, b) => b.value - a.value);
  const parties = slices.filter((s) => s.key !== "__none").length;
  if (parties === 0) return null;
  const summary = slices.map((s) => `${s.label}: ${f.number(s.value)}`).join(", ");
  return (
    <ChartCard
      title={t("partyTitle")}
      emoji="🎗️"
      units={t("partyUnits")}
      simple={t("partySimple", { n: f.number(reps.length), parties })}
      asOf={asOf}
      source={ECI}
      table={slices.map((s) => ({ label: s.label, value: f.number(s.value) }))}
    >
      <HueDonut
        slices={slices}
        centerValue={f.number(reps.length)}
        centerLabel={t("partyCenter")}
        ariaLabel={t("partyAria", { summary })}
        otherLabel={t("partyOther")}
      />
    </ChartCard>
  );
}

/** "Next election: … in 42 days", a link to the Elections page (dates + how to vote live there). */
function NextElectionCard({ event, href }: { event: ElectionEvent; href: string }) {
  const t = useTranslations("page_leadership");
  const f = useFormat();
  const target = event.pollingDate ?? event.nextExpected;
  if (!target) return null;
  const days = daysUntil(target) ?? 0;
  const when = event.pollingDate
    ? t("next.inDays", { n: Math.max(0, days) })
    : t("next.about", { date: f.date(target, { month: "long", year: "numeric" }) });
  return (
    <div className={hueClass("elections")} style={{ marginTop: 24 }}>
      <Card href={href} tinted padding={16}>
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 44, height: 44, fontSize: 22, borderRadius: 13 }}>
            🗳️
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 12, lineHeight: "16px", fontWeight: 700, color: "var(--hue-deep)" }}>{t("next.title")}</span>
            <span style={{ display: "block", fontSize: 15, lineHeight: "22px", fontWeight: 600, color: "var(--ftp-text)" }}>
              {event.label} · <span className="ftp-num">{when}</span>
            </span>
            <span style={{ display: "block", fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{t("next.link")}</span>
          </span>
          <ChevronRight size={18} aria-hidden style={{ color: "var(--hue)" }} />
        </span>
      </Card>
    </div>
  );
}

function LeadershipPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_leadership");
  const mt = useModuleText();
  const f = useFormat();
  const districtName = useDistrictName(state, district);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useLeaders(district, state);
  const leaders: Leader[] = data?.data ?? [];
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [selected, setSelected] = useState<Leader | null>(null);
  const closeSheet = useCallback(() => setSelected(null), []);

  const { data: electionsData } = useQuery<{ data: ElectionEvent[] }>({
    queryKey: ["elections", state],
    queryFn: () => fetch(`/api/data/election-events?state=${state}`).then((r) => r.json()),
    staleTime: 5 * 60_000,
  });
  const liveElection = findActiveElection(electionsData?.data);
  const nextElection = findNextElection(electionsData?.data, state);

  // One card per person: drop role-only names and repeats within a level
  // ("Narendra Modi / Prime Minister" vs "… / Prime Minister of India").
  const people = leaders
    .filter((l) => !ROLE_WORDS.test(l.name.trim()) || (l.name.includes(" ") && l.name.split(/\s+/).length > 2))
    .filter((l, i, arr) => arr.findIndex((x) => x.name.toLowerCase() === l.name.toLowerCase() && x.tier === l.tier) === i);

  const byTier = people.reduce((acc: Record<number, Leader[]>, l) => {
    (acc[l.tier] ??= []).push(l);
    return acc;
  }, {});
  const tiers = orderTiers(Object.keys(byTier).map(Number));
  for (const tier of tiers) byTier[tier].sort((a, b) => rank(a.role) - rank(b.role) || a.name.localeCompare(b.name));

  // Freshness = the most recent "last verified" date across everyone listed.
  const asOf = leaders.reduce<string | null>(
    (best, l) => (l.lastVerifiedAt && (!best || l.lastVerifiedAt > best) ? l.lastVerifiedAt : best),
    null,
  );
  const src = getModuleSources("leadership", state);
  const titleLocal = state === "karnataka" ? knDict.modules.leadership : undefined;
  const electedCount = byTier[4]?.length ?? 0;
  // The party ring needs two or more MPs/MLAs and at least one party on record.
  const hasPartyRing = electedCount >= 2 && (byTier[4] ?? []).some((l) => l.party?.trim());
  const officerCount = byTier[3]?.length ?? 0;
  const b = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;
  const resultDate =
    liveElection?.resultDate && !Number.isNaN(new Date(liveElection.resultDate).getTime())
      ? f.date(liveElection.resultDate, { day: "numeric", month: "long", year: "numeric" })
      : null;

  const jumpTo = (tier: number) =>
    document.getElementById(`level-${tier}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const onShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: mt.label("leadership"), url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareNote(t("linkCopied"));
        setTimeout(() => setShareNote(null), 2000);
      }
    } catch {
      /* The visitor closed the share sheet — nothing to do. */
    }
  };

  const onCsv = () =>
    downloadCsv(
      `${district}-leadership.csv`,
      people.map((l) => ({
        level: tierMeta(l.tier, t).label,
        name: l.name,
        role: l.role,
        party: l.party ?? "",
        constituency: l.constituency ?? "",
        since: l.since ?? "",
        last_verified: l.lastVerifiedAt ?? "",
      })),
    );

  return (
    <ModulePage>
      <PageHeader
        icon={Users}
        title={mt.label("leadership")}
        titleLocal={titleLocal}
        description={t("description")}
        backHref={base}
        freshness={asOf ? { asOf } : undefined}
        source={ECI}
      />

      {people.length > 0 && (
        <Explainer emoji="🧭">
          {t.rich("simple", { n: people.length, levels: tiers.length, name: districtName, b })}
          {electedCount > 0 && <> {t.rich("simpleElected", { n: electedCount, b })}</>}
          {officerCount > 0 && <> {t.rich("simpleOfficers", { n: officerCount, b })}</>}
        </Explainer>
      )}

      {liveElection && (
        <div role="alert" style={{ marginBottom: 16 }}>
          <Card padding={14}>
            <p className="ftp-body" style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "var(--ftp-text)", fontSize: 14, lineHeight: "21px" }}>
              <AlertTriangle size={16} aria-hidden style={{ color: "var(--ftp-danger)", flexShrink: 0, marginTop: 2 }} />
              <span>
                {t.rich(resultDate ? "electionAlertDate" : "electionAlert", {
                  label: liveElection.label,
                  date: resultDate ?? "",
                  b: (c) => <span style={{ fontWeight: 600, color: "var(--ftp-danger)" }}>{c}</span>,
                })}
              </span>
            </p>
          </Card>
        </div>
      )}

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && people.length === 0 && <EmptyState emoji="👥" title={t("emptyTitle")} body={t("emptyBody")} />}

      {people.length > 0 && (
        <>
          <StatStrip cols={4}>
            <StatTile emoji="👥" label={t("tilePeople")} value={f.number(people.length)} asOf={asOf} />
            <StatTile emoji="🗳️" label={t("tileElected")} value={f.number(electedCount)} sub={t("tileElectedSub")} />
            <StatTile emoji="🏢" label={t("tileOfficers")} value={f.number(officerCount)} sub={t("tileOfficersSub")} />
            <StatTile emoji="🪜" label={t("tileLevels")} value={f.number(tiers.length)} sub={t("tileLevelsSub")} />
          </StatStrip>

          {/* The picture: who is above whom. Names in it open the same sheet as the cards. */}
          <div style={{ marginTop: 16 }}>
            <Card tinted padding={18}>
              <LeaderLadder tiers={tiers} byTier={byTier} onPick={setSelected} onJump={jumpTo} />
            </Card>
          </div>
        </>
      )}

      <div style={{ marginTop: 16 }}>
        <AIInsightCard module="leaders" district={district} />
      </div>

      {/* The main list: one section per level, in the same order as the picture. */}
      {tiers.map((tier) => {
        const meta = tierMeta(tier, t);
        return (
          <section key={tier} id={`level-${tier}`} style={{ scrollMarginTop: 80 }}>
            <Section title={meta.label} emoji={meta.emoji}>
              {meta.hint && (
                <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "-6px 0 12px", fontSize: 14, lineHeight: "21px" }}>
                  {meta.hint}
                </p>
              )}
              <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "260px" } as React.CSSProperties}>
                {byTier[tier].map((l) => (
                  <LeaderCard key={l.id} l={l} emoji={meta.emoji} onOpen={setSelected} />
                ))}
              </div>
            </Section>
          </section>
        );
      })}

      {/* Chart + the notes that explain it, side by side on wide screens. */}
      {people.length > 0 && (
        <div className={hasPartyRing ? "ftp-picture-row" : undefined} style={{ marginTop: 28 }}>
          {hasPartyRing && <PartyRing reps={byTier[4] ?? []} asOf={asOf} />}
          <Card>
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", fontSize: 14, lineHeight: "21px" }}>
              <span aria-hidden>ℹ️ </span>
              {t("topNote")}
            </p>
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 12 }}>
              {t.rich("noteParties", { b: (c) => <span style={{ fontWeight: 600, color: "var(--hue-deep)" }}>{c}</span> })}
            </p>
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 12 }}>
              {t.rich("noteOfficers", { b: (c) => <span style={{ fontWeight: 600, color: "var(--hue-deep)" }}>{c}</span> })}
            </p>
          </Card>
        </div>
      )}

      {nextElection && <NextElectionCard event={nextElection} href={`${base}/elections`} />}

      <SourcesFooter
        sources={src.sources.map((name) => ({
          name: SOURCE_KEY[name] ? t(`sourceNames.${SOURCE_KEY[name]}`) : name,
          url: SOURCE_URLS[name],
          frequency: FREQ_KEY[src.frequency] ? t(`freq.${FREQ_KEY[src.frequency]}`) : src.frequency,
        }))}
      />
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", fontSize: 11, lineHeight: "16px", marginTop: 8 }}>
        {t("notOfficial")}
      </p>

      <ModuleNews district={district} state={state} locale={locale} module="leaders" />

      <Toolbar label={t("toolbar")}>
        <ToolbarButton icon={Download} onClick={onCsv} disabled={people.length === 0}>
          {t("downloadCsv")}
        </ToolbarButton>
        <ToolbarButton icon={Share2} onClick={onShare}>
          {shareNote ?? t("share")}
        </ToolbarButton>
        <ToolbarButton icon={ArrowLeftRight} href={`/${locale}/compare?module=leadership&a=${district}`}>
          {t("compare")}
        </ToolbarButton>
      </Toolbar>

      <LeaderSheet leader={selected} onClose={closeSheet} district={district} state={state} />
    </ModulePage>
  );
}

export default function LeadershipPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("leadership")}>
      <LeadershipPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
