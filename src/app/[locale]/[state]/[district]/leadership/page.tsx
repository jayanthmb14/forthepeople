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
//  ModulePage → PageHeader → Explainer (real counts) → 4 StatTiles →
//  "Key people" (Collector / DC, SP or Police Commissioner, the minister in
//  charge, the MP and the MLA for the district headquarters seat) as white
//  cards → the picture: LeaderLadder ("who is above whom") with tappable
//  names → the directory: one white list per level (laptop: a table of
//  name and role · constituency · party; phone: two lines; officers grouped
//  by department) → tapping any card or row opens LeaderSheet (the job in
//  plain words, party, area, since when, office contact when stored, how
//  the record was checked, and the latest news that names the person) →
//  party ring + notes → next election → AI insight → CSV / Share / Compare
//  → news. v5.5 (owner, 28 Sep 2026): "a clean ordered directory", mostly
//  white; no emoji; sources, "not an official website" and the stale note
//  come from the shell.
//
//  Data: /api/data/leaders (rows guessed from news are never served),
//  the source pill names the outlets the rows cite (recordsSource),
//  grouped by the Leader.tier column; nothing about who sits where is
//  hard-coded. Text: "page_leadership" namespace. Names, roles, parties
//  and constituencies are records and are shown as stored (the local-script
//  role replaces the English one when it is in the reader's language).
"use client";

import { use, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Building2, ChevronRight, Info, Layers, Users, Vote } from "lucide-react";
import { KeyPeople, LeaderRows, pickKeyPeople } from "@/components/district/civic/LeaderDirectory";
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
  StatStrip,
  StatTile,
} from "@/components/district/ui";
import MoneyToolbar, { downloadCsv } from "@/components/money/MoneyToolbar";
import { ChartCard, Explainer } from "@/components/district/visuals";
import { HueDonut } from "@/components/district/civic/HueDonut";
import { LeaderLadder } from "@/components/district/civic/LeaderLadder";
import { LeaderSheet } from "@/components/district/civic/LeaderSheet";
import { orderTiers, tierMeta } from "@/components/district/civic/leader-shared";
import { isHeadquartersMla } from "@/lib/leader-roles";
import { COURTS_TIER, ladderTier } from "@/lib/civic/leader-level";
import { daysUntil, findActiveElection, findNextElection, type ElectionEvent } from "@/components/district/ElectionSection";
import { getPartyColor } from "@/lib/constants/party-colors";
import { usePlaceText } from "@/i18n/client";
import { hueClass } from "@/lib/design/hues";
import { useDistrictName, useFormat, useModuleText } from "@/i18n/client";
import { leaderSourceSummary } from "@/lib/government-checks";
import knDict from "@/dictionaries/kn.json";

/**
 * The source pill for the page header and the party chart: the outlets the
 * shown records actually cite (Leader.source), most cited first — e.g.
 * "Wikipedia, IndiaVotes +12". Sept 2026 audit: the pill used to say "ECI"
 * although no record cites the Election Commission. No link: the records
 * cite many pages.
 */
function recordsSource(rows: Leader[]): { label: string } | undefined {
  const outlets = leaderSourceSummary(rows.map((l) => l.source));
  if (outlets.length === 0) return undefined;
  const top = outlets.slice(0, 2).map((o) => o.name).join(", ");
  return { label: outlets.length > 2 ? `${top} +${outlets.length - 2}` : top };
}

/** Cards within a level: President before PM, Governor before CM, MP before MLAs. */
const ROLE_ORDER: RegExp[] = [
  /^president\b/i,
  /^prime minister/i,
  /^governor/i,
  /^chief minister/i,
  /^deputy chief minister/i,
  /^minister in charge of|^minister for/i,
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
      units={t("partyUnits")}
      simple={t("partySimple", { n: f.number(reps.length), parties })}
      asOf={asOf}
      source={recordsSource(reps)}
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
  const place = usePlaceText();
  // The stored label is English ("Karnataka Vidhan Sabha"); other languages
  // name the body from its type ("ಕರ್ನಾಟಕ ವಿಧಾನಸಭೆ").
  const body =
    f.locale === "en"
      ? event.label
      : event.type === "STATE_ASSEMBLY" && event.state
        ? t("next.assembly", { state: place.state(event.state) })
        : event.type === "LOK_SABHA"
          ? t("next.lokSabha")
          : event.label;
  const target = event.pollingDate ?? event.nextExpected;
  if (!target) return null;
  const days = daysUntil(target) ?? 0;
  const when = event.pollingDate
    ? t("next.inDays", { n: Math.max(0, days) })
    : t("next.about", { date: f.date(target, { month: "long", year: "numeric" }) });
  return (
    <div className={hueClass("elections")} style={{ marginTop: 24 }}>
      <Card href={href} padding={16}>
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="ftp-icon-chip" aria-hidden style={{ width: 36, height: 36, borderRadius: 11 }}>
            <Vote size={18} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 12, lineHeight: "16px", fontWeight: 700, color: "var(--hue-deep)" }}>{t("next.title")}</span>
            <span style={{ display: "block", fontSize: 15, lineHeight: "22px", fontWeight: 600, color: "var(--ftp-text)" }}>
              {body} · <span className="ftp-num">{when}</span>
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

  // A judge is listed with the courts whatever tier the record carries.
  const byTier = people.reduce((acc: Record<number, Leader[]>, l) => {
    (acc[ladderTier(l)] ??= []).push(l);
    return acc;
  }, {});
  const tiers = orderTiers(Object.keys(byTier).map(Number));
  // The courts are listed, but they are not a level of government: the
  // picture and the "levels" counts leave them out.
  const govTiers = tiers.filter((x) => x !== COURTS_TIER);
  const govPeople = people.length - (byTier[COURTS_TIER]?.length ?? 0);
  // The MLA for the district headquarters seat comes first among the MLAs.
  const hqFirst = (l: Leader) => (isHeadquartersMla(l, district) ? 0 : 1);
  for (const tier of tiers) byTier[tier].sort((a, b) => rank(a.role) - rank(b.role) || hqFirst(a) - hqFirst(b) || a.name.localeCompare(b.name));

  // Freshness = the most recent "last verified" date across everyone listed.
  const asOf = leaders.reduce<string | null>(
    (best, l) => (l.lastVerifiedAt && (!best || l.lastVerifiedAt > best) ? l.lastVerifiedAt : best),
    null,
  );
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

  const keyPeople = pickKeyPeople(people, district);

  const jumpTo = (tier: number) =>
    document.getElementById(`level-${tier}`)?.scrollIntoView({ behavior: "smooth", block: "start" });


  const onCsv = () =>
    downloadCsv(
      `${district}-leadership.csv`,
      people.map((l) => ({
        level: tierMeta(ladderTier(l), t).label,
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
        freshness={asOf ? { asOf } : undefined}
        source={recordsSource(people)}
      />

      {people.length > 0 && (
        <Explainer>
          {t.rich("simple", { n: govPeople, levels: govTiers.length, name: districtName, b })}
          {electedCount > 0 && <> {t.rich("simpleElected", { n: electedCount, b })}</>}
          {officerCount > 0 && <> {t.rich("simpleOfficers", { n: officerCount, b })}</>}
        </Explainer>
      )}

      {liveElection && (
        <div role="alert" style={{ marginBottom: 16 }}>
          <Card padding={14}>
            <p className="ftp-body" style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "var(--ftp-text)", fontSize: 14, lineHeight: "21px" }}>
              <AlertTriangle size={16} aria-hidden style={{ color: "var(--ftp-warn)", flexShrink: 0, marginTop: 2 }} />
              <span>
                {t.rich(resultDate ? "electionAlertDate" : "electionAlert", {
                  label: liveElection.label,
                  date: resultDate ?? "",
                  b: (c) => <span style={{ fontWeight: 600, color: "var(--ftp-text)" }}>{c}</span>,
                })}
              </span>
            </p>
          </Card>
        </div>
      )}

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && people.length === 0 && <EmptyState title={t("emptyTitle")} body={t("emptyBody")} />}

      {people.length > 0 && (
        <StatStrip cols={4}>
          <StatTile icon={Users} label={t("tilePeople")} value={f.number(people.length)} asOf={asOf} />
          <StatTile icon={Vote} label={t("tileElected")} value={f.number(electedCount)} sub={t("tileElectedSub")} />
          <StatTile icon={Building2} label={t("tileOfficers")} value={f.number(officerCount)} sub={t("tileOfficersSub")} />
          <StatTile icon={Layers} label={t("tileLevels")} value={f.number(govTiers.length)} sub={t("tileLevelsSub")} />
        </StatStrip>
      )}

      {/* Key people: whom most citizens need first. */}
      {keyPeople.length > 0 && (
        <Section title={t("key.title", { name: districtName })}>
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "-6px 0 12px", fontSize: 14, lineHeight: "21px" }}>
            {t("key.lead")}
          </p>
          <KeyPeople people={keyPeople} district={district} onOpen={setSelected} />
        </Section>
      )}

      {/* The picture: who is above whom. Names in it open the same sheet as the rows. */}
      {people.length > 0 && govTiers.length > 1 && (
        <div style={{ marginTop: 28 }}>
          <Card padding={18}>
            <LeaderLadder tiers={govTiers} byTier={byTier} onPick={setSelected} onJump={jumpTo} />
          </Card>
        </div>
      )}

      {/* The directory: one list per level, in the same order as the picture. */}
      {tiers.map((tier) => {
        const meta = tierMeta(tier, t);
        const officers = tier === 3 || tier === 5;
        return (
          <section key={tier} id={`level-${tier}`} style={{ scrollMarginTop: 80 }}>
            <Section title={meta.label}>
              {meta.hint && (
                <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "-6px 0 12px", fontSize: 14, lineHeight: "21px" }}>
                  {meta.hint}
                </p>
              )}
              <LeaderRows
                leaders={byTier[tier]}
                district={district}
                onOpen={setSelected}
                groupByDept={officers}
              />
            </Section>
          </section>
        );
      })}

      {/* Chart + the notes that explain it, side by side on wide screens. */}
      {people.length > 0 && (
        <div className={hasPartyRing ? "ftp-picture-row" : undefined} style={{ marginTop: 28 }}>
          {hasPartyRing && <PartyRing reps={byTier[4] ?? []} asOf={asOf} />}
          <Card>
            <p className="ftp-body" style={{ display: "flex", gap: 8, alignItems: "flex-start", color: "var(--ftp-text-2)", fontSize: 14, lineHeight: "21px" }}>
              <Info size={16} aria-hidden style={{ color: "var(--hue-deep)", flexShrink: 0, marginTop: 2 }} />
              <span>{t("topNote")}</span>
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

      <div style={{ marginTop: 24 }}>
        <AIInsightCard module="leaders" district={district} />
      </div>

      <MoneyToolbar
        shareTitle={mt.label("leadership")}
        onCsv={onCsv}
        csvDisabled={people.length === 0}
        compareHref={`/${locale}/compare?module=leadership&a=${district}`}
      />

      <ModuleNews district={district} state={state} locale={locale} module="leaders" />

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
