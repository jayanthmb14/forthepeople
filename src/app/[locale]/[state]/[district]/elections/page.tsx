/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Elections — module page (v4.1, docs/LAYOUT.md recipe)
// ═══════════════════════════════════════════════════════════════════════
//  The question: "When do I vote next, and how?"
//  The answer, in one sentence: "The next election for Mandya voters is
//  the Lok Sabha election, in 42 days (or 'about May 2028')."
//
//  ModulePage → PageHeader → Explainer (from the calendar) → 4 StatTiles
//  → the picture: a CountdownBar to the next election → "How voting
//  works" in 4 picture steps (register → check your name → find your
//  booth → vote) → the "results are being checked" notice → the election
//  calendar (tappable cards → DetailSheet with every date) → past results
//  (withheld today) → polling booths as cards (tap → details + directions)
//  → AI note → sources → news → toolbar.
//
//  Data: /api/data/election-events (calendar) and /api/data/elections
//  (booths; results are WITHHELD by the API until re-checked against ECI,
//  and the notice says so). Text: "page_elections" namespace. Dates and
//  numbers go through useFormat().
"use client";

import { use, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, CalendarDays, Download, ExternalLink, History, Hourglass, MapPin, Phone, School, Search, Share2, Vote } from "lucide-react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleNews from "@/components/district/ModuleNews";
import { useElections } from "@/hooks/useRealtimeData";
import type { PollingBooth } from "@/hooks/useRealtimeData";
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
  Toolbar,
  ToolbarButton,
} from "@/components/district/ui";
import { CountdownBar, Explainer, HowItWorks } from "@/components/district/visuals";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import ElectionSection, {
  ELECTORAL_SEARCH_URL,
  daysUntil,
  findNextElection,
  type ElectionEvent,
} from "@/components/district/ElectionSection";
import { ElectionResults } from "@/components/district/civic/ElectionResults";
import { hueClass } from "@/lib/design/hues";
import { useDistrictName, useFormat, useModuleText } from "@/i18n/client";
import knDict from "@/dictionaries/kn.json";

const ECI = { label: "ECI", href: "https://eci.gov.in" };
/** Official ECI services named in "How voting works". */
const VOTERS_PORTAL_URL = "https://voters.eci.gov.in/";
/** The Election Commission's national voter helpline. */
const VOTER_HELPLINE = "1950";
/** Booths shown before "Show all". */
const BOOTHS_FIRST = 12;

type Booth = PollingBooth & { taluk?: string | null; latitude?: number | null; longitude?: number | null };

function mapsUrl(b: Booth, districtName: string): string {
  if (typeof b.latitude === "number" && typeof b.longitude === "number") {
    return `https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([b.name, b.location, districtName].filter(Boolean).join(", "))}`;
}

/** A rich-text tag renderer for an official link inside a sentence. */
function extLink(href: string) {
  return function ExtLink(c: React.ReactNode) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--hue-deep)", fontWeight: 600 }}>
        {c}
      </a>
    );
  };
}

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

/** A link styled as a 44 px sheet action. */
function ActionLink({ href, icon: Icon, children, primary }: { href: string; icon: typeof Phone; children: React.ReactNode; primary?: boolean }) {
  const external = /^https?:/.test(href);
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      style={{
        flex: "1 1 150px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 44,
        padding: "0 16px",
        borderRadius: 12,
        border: `1px solid ${primary ? "var(--hue)" : "var(--ftp-border)"}`,
        background: primary ? "var(--hue)" : "var(--ftp-surface)",
        color: primary ? "#fff" : "var(--ftp-text)",
        fontSize: 15,
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      <Icon size={18} aria-hidden />
      {children}
    </a>
  );
}

/** The picture: time left until the next election, filled from the last one. */
function NextElectionCountdown({ e }: { e: ElectionEvent }) {
  const t = useTranslations("page_elections");
  const f = useFormat();
  const target = (e.pollingDate ?? e.nextExpected)!;
  const days = Math.max(0, daysUntil(target) ?? 0);
  // The wait starts at the last election; without one, one full term back.
  const start = e.lastHeld ?? new Date(new Date(target).getTime() - (e.termYears || 5) * 365.25 * 86_400_000).toISOString();
  const label = e.pollingDate
    ? days === 0
      ? t("countdown.today", { label: e.label })
      : t("countdown.days", { label: e.label, n: days })
    : t("countdown.about", { label: e.label, date: f.date(target, { month: "long", year: "numeric" }) });
  const sub = e.lastHeld
    ? e.pollingDate
      ? t("countdown.subDate", { last: f.date(e.lastHeld, { month: "long", year: "numeric" }), date: f.date(e.pollingDate, { day: "numeric", month: "long", year: "numeric" }) })
      : t("countdown.subExpected", { last: f.date(e.lastHeld, { month: "long", year: "numeric" }) })
    : e.pollingDate
      ? t("countdown.subDateOnly", { date: f.date(e.pollingDate, { day: "numeric", month: "long", year: "numeric" }) })
      : t("countdown.subNoLast");
  return (
    <Card padding={18}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <span className="ftp-icon-chip" aria-hidden style={{ width: 40, height: 40, borderRadius: 12 }}>
          <Vote size={20} />
        </span>
        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
          <CountdownBar start={start} target={target} label={label} sub={sub} />
        </div>
      </div>
    </Card>
  );
}

function BoothSheet({ booth, onClose, districtName }: { booth: Booth | null; onClose: () => void; districtName: string }) {
  const t = useTranslations("page_elections");
  const f = useFormat();
  if (!booth) return null;
  const hasPoint = typeof booth.latitude === "number" && typeof booth.longitude === "number";
  return (
    <DetailSheet
      open
      onClose={onClose}
      title={booth.name}
      subtitle={t("booth.number", { n: booth.boothNumber })}
      hueClassName={hueClass("elections")}
      footer={
        <>
          <ActionLink href={mapsUrl(booth, districtName)} icon={MapPin} primary>
            {hasPoint ? t("booth.directions") : t("booth.findOnMap")}
          </ActionLink>
          <ActionLink href={ELECTORAL_SEARCH_URL} icon={Search}>
            {t("booth.checkName")}
          </ActionLink>
        </>
      }
    >
      <DetailList
        rows={[
          { label: t("colBoothNo"), value: <span className="ftp-num">{booth.boothNumber}</span> },
          { label: t("colLocation"), value: booth.location },
          { label: t("colConstituency"), value: booth.constituency },
          { label: t("booth.taluk"), value: booth.taluk ?? null },
          { label: t("colVoters"), value: booth.totalVoters != null ? <span className="ftp-num">{f.number(booth.totalVoters)}</span> : null },
        ]}
      />
      <p style={{ margin: 0, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{t("booth.hint")}</p>
    </DetailSheet>
  );
}

function ElectionsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_elections");
  const mt = useModuleText();
  const f = useFormat();
  const districtName = useDistrictName(state, district);
  const { data, isLoading, error } = useElections(district, state);
  const { data: calendar, isLoading: calendarLoading } = useQuery<{ data: ElectionEvent[] }>({
    queryKey: ["elections", state],
    queryFn: () => fetch(`/api/data/election-events?state=${state}`).then((r) => r.json()),
    staleTime: 5 * 60_000,
  });
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [booth, setBooth] = useState<Booth | null>(null);
  const closeBooth = useCallback(() => setBooth(null), []);
  const [showAllBooths, setShowAllBooths] = useState(false);

  const results = data?.data?.results ?? [];
  // The API holds results back until they are checked against ECI.
  const withheld = Boolean((data?.data as { resultsWithheld?: boolean } | undefined)?.resultsWithheld);
  const booths = (data?.data?.booths ?? []) as Booth[];
  const events = (calendar?.data ?? []).filter((e) => !e.district || e.district === district);
  const next = findNextElection(events, state, district);
  const nextDays = next ? daysUntil(next.pollingDate ?? next.nextExpected) : null;
  const ahead = events.filter((e) => {
    const d = daysUntil(e.pollingDate ?? e.nextExpected);
    return d != null && d >= 0;
  }).length;
  // The most recent election held: the latest past polling date or "last
  // held". Shown as a year only: the national Lok Sabha row's lastHeld is its
  // counting day (4 Jun 2024) and polling ran in phases on different days per
  // seat, so no single stored day is "your" voting day (Sept 2026 audit).
  const lastHeld = events
    .flatMap((e) => [e.lastHeld, e.pollingDate].filter((d): d is string => Boolean(d) && (daysUntil(d) ?? 1) < 0))
    .sort()
    .pop();

  const titleLocal = state === "karnataka" ? knDict.modules.elections : undefined;
  const b = (c: React.ReactNode) => <strong>{c}</strong>;

  const nextWhen = next
    ? next.pollingDate
      ? nextDays === 0
        ? t("when.today")
        : t("when.inDays", { n: nextDays ?? 0 })
      : t("when.about", { date: f.date(next.nextExpected!, { month: "long", year: "numeric" }) })
    : "";

  const onShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: mt.label("elections"), url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareNote(t("linkCopied"));
        setTimeout(() => setShareNote(null), 2000);
      }
    } catch {
      /* The visitor closed the share sheet — nothing to do. */
    }
  };

  // CSV = the calendar on screen (results are withheld; booths have their own sheet).
  const onCsv = () =>
    downloadCsv(
      `${district}-elections.csv`,
      events.map((e) => ({
        election: e.label,
        type: e.type,
        polling_date: e.pollingDate ?? "",
        result_date: e.resultDate ?? "",
        last_held: e.lastHeld ?? "",
        next_expected: e.nextExpected ?? "",
        seats: e.totalSeats ?? "",
        body: e.body,
        source: e.source ?? "",
      })),
    );

  const shownBooths = showAllBooths ? booths : booths.slice(0, BOOTHS_FIRST);

  return (
    <ModulePage>
      <PageHeader
        icon={Vote}
        title={mt.label("elections")}
        titleLocal={titleLocal}
        description={t("description")}
        source={ECI}
      />

      {!calendarLoading && (
        <Explainer>
          {next ? t.rich("simpleNext", { name: districtName, label: next.label, when: nextWhen, b }) : t("simpleNone", { name: districtName })}
          {withheld && <> {t("simpleWithheld")}</>}
        </Explainer>
      )}

      <StatStrip cols={4}>
        <StatTile
          icon={Hourglass}
          label={t("tileNext")}
          value={next ? (next.pollingDate ? f.number(Math.max(0, nextDays ?? 0)) : f.date(next.nextExpected!, { month: "short", year: "numeric" })) : "—"}
          unit={next?.pollingDate ? t("tileDays") : undefined}
          sub={next ? next.label : t("tileNextNone")}
          countUp={Boolean(next?.pollingDate)}
        />
        <StatTile icon={CalendarDays} label={t("tileAhead")} value={calendarLoading ? "—" : f.number(ahead)} sub={t("tileAheadSub")} />
        <StatTile
          icon={History}
          label={t("tileLast")}
          value={lastHeld ? f.date(lastHeld, { year: "numeric" }) : "—"}
          sub={t("tileLastSub")}
          countUp={false}
        />
        <StatTile icon={School} label={t("tileBooths")} value={isLoading ? "—" : f.number(booths.length)} sub={t("tileBoothsSub")} />
      </StatStrip>

      {/* The picture: how long until the next vote. */}
      {next && (
        <div style={{ marginTop: 16 }}>
          <NextElectionCountdown e={next} />
        </div>
      )}

      {/* How voting works, in 4 picture steps, with the official links. */}
      <div style={{ marginTop: 16 }}>
        <Card padding={18}>
          <HowItWorks
            title={t("how.title")}
            steps={[
              { emoji: "", title: t("how.register"), body: t.rich("how.registerBody", { link: extLink(VOTERS_PORTAL_URL) }) },
              { emoji: "", title: t("how.check"), body: t.rich("how.checkBody", { link: extLink(ELECTORAL_SEARCH_URL) }) },
              { emoji: "", title: t("how.booth"), body: t("how.boothBody") },
              { emoji: "", title: t("how.vote"), body: t("how.voteBody") },
            ]}
          />
          <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: "21px", color: "var(--ftp-text)" }}>
            {t.rich("how.helpline", {
              call: (c) => (
                <a href={`tel:${VOTER_HELPLINE}`} className="ftp-num" style={{ color: "var(--hue-deep)", fontWeight: 700 }}>
                  {c}
                </a>
              ),
              number: VOTER_HELPLINE,
            })}
          </p>
        </Card>
      </div>

      {/* Results: withheld on purpose until every number is checked against ECI. */}
      {withheld && (
        <div style={{ marginTop: 16 }}>
          <EmptyState title={t("withheldTitle")} body={t("withheldBody")} />
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        {calendarLoading ? <LoadingShell rows={3} /> : <ElectionSection events={events} />}
      </div>

      {isLoading && <LoadingShell rows={3} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && !withheld && <ElectionResults results={results} />}
      {!isLoading && !error && !withheld && results.length === 0 && booths.length === 0 && (
        <div style={{ marginTop: 16 }}>
          <EmptyState title={t("emptyTitle")} body={t("emptyBody")} />
        </div>
      )}

      {booths.length > 0 && (
        <Section title={t("boothsTitle", { n: f.number(booths.length) })}>
          <p className="ftp-body" style={{ margin: "-6px 0 12px", color: "var(--ftp-text-2)", fontSize: 14, lineHeight: "21px" }}>
            {t("booth.lead")}
          </p>
          <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "240px" } as React.CSSProperties}>
            {shownBooths.map((bth) => (
              <button
                key={bth.id}
                type="button"
                onClick={() => setBooth(bth)}
                className="ftp-card-link"
                aria-haspopup="dialog"
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
                <span
                  className="ftp-icon-chip ftp-num"
                  aria-hidden
                  style={{ minWidth: 44, height: 44, padding: "0 6px", borderRadius: 12, fontSize: 15, fontWeight: 700, color: "var(--hue-deep)" }}
                >
                  {bth.boothNumber}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="ftp-title" style={{ display: "block", fontWeight: 600 }}>
                    {bth.name}
                  </span>
                  <span style={{ display: "block", fontSize: 13, lineHeight: "19px", color: "var(--ftp-text-2)" }}>{bth.location}</span>
                  <span style={{ display: "block", fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)", marginTop: 2 }}>
                    {bth.constituency}
                    {bth.totalVoters != null && (
                      <>
                        {" · "}
                        {t("booth.voters", { n: f.number(bth.totalVoters) })}
                      </>
                    )}
                  </span>
                </span>
              </button>
            ))}
          </div>
          {booths.length > BOOTHS_FIRST && (
            <div style={{ marginTop: 12 }}>
              <ToolbarButton onClick={() => setShowAllBooths((v) => !v)}>
                {showAllBooths ? t("booth.showFewer") : t("booth.showAll", { n: booths.length })}
              </ToolbarButton>
            </div>
          )}
        </Section>
      )}

      <div style={{ marginTop: 16 }}>
        <AIInsightCard module="elections" district={district} />
      </div>

      <Toolbar label={t("toolbar")}>
        <ToolbarButton icon={Download} onClick={onCsv} disabled={events.length === 0}>
          {t("downloadCsv")}
        </ToolbarButton>
        <ToolbarButton icon={Share2} onClick={onShare}>
          {shareNote ?? t("share")}
        </ToolbarButton>
        <ToolbarButton icon={ExternalLink} href={ELECTORAL_SEARCH_URL} external>
          {t("checkNameButton")}
        </ToolbarButton>
        <ToolbarButton icon={ArrowLeftRight} href={`/${locale}/compare?module=elections&a=${district}`}>
          {t("compare")}
        </ToolbarButton>
      </Toolbar>

      <ModuleNews district={district} state={state} locale={locale} module="elections" />

      <BoothSheet booth={booth} onClose={closeBooth} districtName={districtName} />
    </ModulePage>
  );
}

export default function ElectionsPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("elections")}>
      <ElectionsPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
