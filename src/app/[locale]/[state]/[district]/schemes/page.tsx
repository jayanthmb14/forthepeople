/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Government Schemes — "What can I get, and how do I apply?"
// ═══════════════════════════════════════════════════════════════════════
//  The answer in one line: "Mandya has 8 government schemes listed here;
//  5 can be applied for online. Tap any scheme to see what you get."
//  Page recipe (docs/LAYOUT.md):
//    ModulePage → PageHeader → Explainer → 4 StatTiles (listed, apply
//    online, all-India, state) → the picture: how a scheme reaches you
//    (HowItWorks) → filters (where it runs, kind of help) → scheme cards
//    in .ftp-grid; each card shows a one-line "what you get", where it
//    runs and who it is for; tapping it opens a DetailSheet with
//    everything (benefit, who can get it, where it runs + other districts
//    that list it, the usual steps and documents, how to apply, source and
//    date) → charts (kinds of help, reach) → AI insight → sources → news.
//  Data: useSchemes() + /api/data/scheme-coverage (other districts that
//  list the same scheme). Words live in "page_schemes"; scheme names and
//  eligibility text stay as published. The usual steps and documents are
//  shown as "usually" with a pointer to the official site.
"use client";

import { use, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ExternalLink, ScrollText } from "lucide-react";
import { useSchemes, type Scheme } from "@/hooks/useRealtimeData";
import { useDistrictData } from "@/hooks/useDistrictData";
import {
  ModulePage,
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Chips,
  LoadingShell,
  ErrorBlock,
  EmptyState,
  SourcesFooter,
} from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import { ChartCard, ChartGradients, Explainer, HowItWorks, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import { DetailSheet, DetailList } from "@/components/district/DetailSheet";
import { getModuleSources } from "@/lib/constants/state-config";
import { hueClass } from "@/lib/design/hues";
import ModuleNews from "@/components/district/ModuleNews";
import { useDistrictName, useFormat, useModuleText, usePlaceText } from "@/i18n/client";
import { TopBarList } from "@/components/money/visuals";
import { useMoney, useSourceText } from "@/components/money/useMoney";
import MoneyToolbar, { NotOfficialNote, downloadCsv } from "@/components/money/MoneyToolbar";
import { CardHead, HueTag, SheetHighlight, SheetLink, SheetSection, TagRow, TapCard, hostOf, safeUrl, sourceParts } from "@/components/money/TapCard";
import knDict from "@/dictionaries/kn.json";
import {
  AUD_EMOJI,
  KIND_EMOJI,
  LEVEL_EMOJI,
  audiences,
  catKey,
  docsFor,
  levelKey,
  schemeKey,
  schemeKind,
  splitEligibility,
  stepsFor,
  type LevelKey,
  type SchemeKind,
} from "./scheme-kinds";

/** Official websites for the sources named by getModuleSources("schemes"). */
const SOURCE_URLS: Record<string, string> = {
  "MyScheme.gov.in": "https://www.myscheme.gov.in",
};

/** A scheme row as the API sends it (the hook type plus the timestamp). */
type SchemeRow = Scheme & { updatedAt?: string | null };

/** Other live districts that list the same scheme (/api/data/scheme-coverage). */
type Coverage = Record<string, { districts: Array<{ slug: string; name: string; stateSlug: string; stateName: string }> }>;

/** The newest `updatedAt` among the rows. */
function latestUpdatedAt(rows: SchemeRow[]): string | null {
  let best: string | null = null;
  for (const r of rows) if (r.updatedAt && (!best || r.updatedAt > best)) best = r.updatedAt;
  return best;
}

const num = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;
const b = (c: React.ReactNode) => <strong>{c}</strong>;

/** Everything the page and the sheet need about one scheme, worked out once. */
type SchemeView = {
  s: SchemeRow;
  kind: SchemeKind;
  level: LevelKey | null;
  who: string | null;
  what: string | null;
  aud: ReturnType<typeof audiences>;
  apply: string | null;
};

function describe(s: SchemeRow): SchemeView {
  const kind = schemeKind(s.category, s.name);
  const { who, what } = splitEligibility(s.eligibility);
  return {
    s,
    kind,
    level: levelKey(s.level),
    who,
    what,
    aud: audiences(who ?? s.eligibility),
    apply: safeUrl(s.applyUrl),
  };
}

function SchemesPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_schemes");
  const f = useFormat();
  const m = useMoney();
  const st = useSourceText();
  const mt = useModuleText();
  const place = usePlaceText();
  const districtName = useDistrictName(state, district);
  const stateName = place.state(state, state.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useSchemes(district, state);
  const { data: coverageData } = useDistrictData<Coverage>("scheme-coverage", district, state);
  const coverage = coverageData?.data ?? {};

  const [kindFilter, setKindFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  // Stable, so the open sheet does not re-run its focus effect on every render.
  const closeSheet = useCallback(() => setOpenId(null), []);

  const schemes = useMemo(() => (data?.data ?? []) as SchemeRow[], [data]);
  const views = useMemo(() => schemes.map(describe), [schemes]);
  const asOf = latestUpdatedAt(schemes);

  // Counts for the tiles, the explainer and the filters.
  const withLink = views.filter((v) => v.apply).length;
  const levelCount = { central: 0, state: 0, local: 0 } as Record<LevelKey, number>;
  for (const v of views) if (v.level) levelCount[v.level] += 1;
  const knownLevels = (["central", "state", "local"] as const).filter((k) => levelCount[k] > 0);
  const kindCount = new Map<SchemeKind, number>();
  for (const v of views) kindCount.set(v.kind, (kindCount.get(v.kind) ?? 0) + 1);
  const kinds = [...kindCount.entries()].sort((a, b2) => b2[1] - a[1]);
  const biggestAmount = Math.max(0, ...schemes.map((s) => s.amount ?? 0));

  const filtered = views.filter(
    (v) => (kindFilter === "all" || v.kind === kindFilter) && (levelFilter === "all" || v.level === levelFilter),
  );
  const open = openId ? views.find((v) => v.s.id === openId) ?? null : null;

  // Chart rows: schemes per kind of help, largest first.
  const kindChart = kinds.map(([k, n]) => {
    const name = t(`kind.${k}`);
    return { name, label: name.length > 22 ? name.slice(0, 21) + "…" : name, count: n };
  });
  // Schemes that reach the most people (only rows with a beneficiary count).
  const reach = schemes
    .filter((s) => typeof s.beneficiaryCount === "number" && s.beneficiaryCount > 0)
    .sort((a, b2) => (b2.beneficiaryCount ?? 0) - (a.beneficiaryCount ?? 0));

  const src = getModuleSources("schemes", state);
  // The module's own name (same as the sidebar), in the reader's language.
  const title = mt.label("schemes");
  // Local-script title: the module name in the state's language (Kannada
  // only for now). PageHeader hides it when it is already the title.
  const titleLocal = state === "karnataka" ? knDict.moduleNames.schemes : undefined;
  const levelLabel = (k: LevelKey) => t(`level.${k}`, { state: stateName, district: districtName });

  const onCsv = () =>
    downloadCsv(
      `${district}-schemes.csv`,
      schemes.map((s) => ({
        name: s.name,
        category: s.category,
        level: s.level ?? "",
        eligibility: s.eligibility ?? "",
        benefit_amount_inr: s.amount ?? "",
        beneficiaries: s.beneficiaryCount ?? "",
        apply_url: s.applyUrl ?? "",
        source: s.source ?? "",
      })),
    );

  return (
    <ModulePage>
      <PageHeader
        icon={ScrollText}
        title={title}
        titleLocal={titleLocal}
        description={t("description")}
        backHref={base}
        freshness={asOf ? { asOf } : undefined}
        source={{ label: "MyScheme", href: SOURCE_URLS["MyScheme.gov.in"] }}
      />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && schemes.length === 0 && <EmptyState emoji="📋" title={t("empty.title")} body={t("empty.body")} />}

      {!isLoading && schemes.length > 0 && (
        <>
          {/* 1. The answer in one sentence. */}
          <Explainer emoji="📋">
            {t.rich("explainer", { district: districtName, total: schemes.length, withLink, num })} {t("explainerTap")}
          </Explainer>

          {/* 2. Four big numbers. */}
          <StatStrip cols={4}>
            <StatTile emoji="📋" label={t("tiles.listed")} value={m.num(schemes.length)} asOf={asOf} />
            <StatTile emoji="🔗" label={t("tiles.withLink")} value={m.num(withLink)} sub={t("tiles.ofTotal", { n: m.num(schemes.length) })} />
            {knownLevels.length > 0 ? (
              <>
                <StatTile emoji="🇮🇳" label={t("tiles.allIndia")} value={m.num(levelCount.central)} sub={t("tiles.allIndiaSub")} />
                <StatTile emoji="🏛️" label={t("tiles.state")} value={m.num(levelCount.state)} sub={t("tiles.stateSub", { state: stateName })} />
              </>
            ) : (
              <>
                <StatTile emoji="🗂️" label={t("tiles.categories")} value={m.num(kinds.length)} />
                <StatTile emoji="💰" label={t("tiles.biggest")} value={biggestAmount > 0 ? m.short(biggestAmount, 1) : "—"} countUp={false} />
              </>
            )}
          </StatStrip>

          {/* 3. The picture: how a scheme reaches a family. */}
          <div style={{ marginTop: 20 }}>
            <HowItWorks
              title={t("how.title")}
              steps={[
                { emoji: "📝", title: t("how.apply"), body: t("how.applyBody") },
                { emoji: "🔎", title: t("how.check"), body: t("how.checkBody") },
                { emoji: "✅", title: t("how.approved"), body: t("how.approvedBody") },
                { emoji: "💰", title: t("how.benefit"), body: t("how.benefitBody") },
              ]}
            />
          </div>

          {/* 4. The list: every scheme as a card; tap for everything. */}
          <Section title={t("list.title")} emoji="🤲">
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              {knownLevels.length >= 2 && (
                <div>
                  <div className="ftp-label" style={{ marginBottom: 6 }}>{t("list.where")}</div>
                  <Chips
                    label={t("list.whereAria")}
                    value={levelFilter}
                    onChange={setLevelFilter}
                    items={[
                      { value: "all", label: t("list.all"), count: schemes.length },
                      ...knownLevels.map((k) => ({ value: k, label: `${LEVEL_EMOJI[k]} ${levelLabel(k)}`, count: levelCount[k] })),
                    ]}
                  />
                </div>
              )}
              {kinds.length >= 2 && (
                <div>
                  <div className="ftp-label" style={{ marginBottom: 6 }}>{t("list.kind")}</div>
                  <Chips
                    label={t("list.kindAria")}
                    value={kindFilter}
                    onChange={setKindFilter}
                    items={[
                      { value: "all", label: t("list.all"), count: schemes.length },
                      ...kinds.map(([k, n]) => ({ value: k, label: `${KIND_EMOJI[k]} ${t(`kind.${k}`)}`, count: n })),
                    ]}
                  />
                </div>
              )}
            </div>

            {filtered.length === 0 ? (
              <EmptyState emoji="🔍" title={t("list.noMatch")} body={t("list.noMatchBody")} />
            ) : (
              <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "290px" } as React.CSSProperties}>
                {filtered.map((v) => (
                  <SchemeCard key={v.s.id} v={v} levelLabel={levelLabel} onOpen={() => setOpenId(v.s.id)} />
                ))}
              </div>
            )}
          </Section>

          {/* 5. Charts, each with a one-line takeaway. */}
          {(kindChart.length >= 2 || reach.length >= 2) && (
            <div className="ftp-grid" style={{ marginTop: 28, ["--ftp-grid-min" as string]: "340px" } as React.CSSProperties}>
              {kindChart.length >= 2 && (
                <ChartCard
                  title={t("byKind.title")}
                  emoji="📊"
                  units={t("byKind.units")}
                  simple={t.rich("byKind.simple", { name: kindChart[0].name, n: kindChart[0].count, total: schemes.length, b })}
                  source={{ label: "MyScheme", href: SOURCE_URLS["MyScheme.gov.in"] }}
                  asOf={asOf}
                  table={kindChart.map((r) => ({ label: r.name, value: m.num(r.count) }))}
                >
                  <ResponsiveContainer width="100%" height={Math.max(160, kindChart.length * 36 + 40)}>
                    <BarChart data={kindChart} layout="vertical" margin={{ top: 5, right: 16, bottom: 8, left: 0 }}>
                      <ChartGradients />
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" horizontal={false} />
                      <XAxis type="number" tick={CHART_AXIS} allowDecimals={false} tickFormatter={(x) => m.num(Number(x))} />
                      <YAxis type="category" dataKey="label" tick={CHART_AXIS} width={130} interval={0} />
                      <Tooltip
                        formatter={(x) => [m.num(Number(x)), t("byKind.legend")]}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ""}
                        contentStyle={chartTooltipStyle}
                        cursor={{ fill: "var(--hue-tint)" }}
                      />
                      <Bar dataKey="count" fill="url(#ftpHueFillH)" radius={[0, 6, 6, 0]} name={t("byKind.legend")} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
              {reach.length >= 2 && (
                <ChartCard
                  title={t("reach.title")}
                  emoji="👥"
                  units={t("reach.units")}
                  simple={t.rich("reach.simple", { name: reach[0].name, n: m.num(reach[0].beneficiaryCount ?? 0), b })}
                  source={{ label: "MyScheme", href: SOURCE_URLS["MyScheme.gov.in"] }}
                  asOf={asOf}
                  table={reach.slice(0, 5).map((s) => ({ label: s.name, value: m.num(s.beneficiaryCount ?? 0) }))}
                >
                  <TopBarList
                    rows={reach.map((s) => ({
                      key: s.id,
                      label: s.name,
                      sub: t(`kind.${schemeKind(s.category, s.name)}`),
                      emoji: KIND_EMOJI[schemeKind(s.category, s.name)],
                      value: s.beneficiaryCount ?? 0,
                      display: m.num(s.beneficiaryCount ?? 0),
                    }))}
                  />
                </ChartCard>
              )}
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 24 }}>
        <AIInsightCard module="schemes" district={district} />
      </div>

      {/* Plain summary for search engines and screen readers. */}
      <p className="ftp-body ftp-prose" style={{ color: "var(--ftp-text-2)", marginTop: 24 }}>
        {t("summary", { district: districtName })}
      </p>

      <SourcesFooter sources={src.sources.map((name) => ({ name: st.name(name), url: SOURCE_URLS[name], frequency: st.freq(src.frequency) }))} />
      <NotOfficialNote />

      <ModuleNews district={district} state={state} locale={locale} module="schemes" />

      <MoneyToolbar
        shareTitle={title}
        onCsv={onCsv}
        csvDisabled={schemes.length === 0}
        compareHref={`/${locale}/compare?module=schemes&a=${district}`}
      />

      <DetailSheet
        open={!!open}
        onClose={closeSheet}
        title={open?.s.name ?? ""}
        subtitle={open ? [t(`kind.${open.kind}`), open.level ? t(`runBy.${open.level}`) : null].filter(Boolean).join(" · ") : undefined}
        emoji={open ? KIND_EMOJI[open.kind] : undefined}
        hueClassName={hueClass("schemes")}
        footer={
          open && (open.apply || sourceParts(open.s.source).url) ? (
            <>
              {open.apply && (
                <SheetLink href={open.apply} primary icon={<ExternalLink size={16} aria-hidden />}>
                  {t("sheet.apply")}
                </SheetLink>
              )}
              {sourceParts(open.s.source).url && sourceParts(open.s.source).url !== open.apply && (
                <SheetLink href={sourceParts(open.s.source).url!}>{t("sheet.openSource")}</SheetLink>
              )}
            </>
          ) : undefined
        }
      >
        {open && (
          <SchemeSheet
            v={open}
            coverage={coverage[schemeKey(open.s.name)]?.districts ?? []}
            locale={locale}
            districtName={districtName}
            stateName={stateName}
            updated={open.s.updatedAt ? f.date(open.s.updatedAt, { day: "numeric", month: "short", year: "numeric" }) : null}
          />
        )}
      </DetailSheet>
    </ModulePage>
  );
}

/** "₹6,000 for farmers" — the translated one-liner; the published words when there is no amount. */
function useWhatYouGet() {
  const t = useTranslations("page_schemes");
  const m = useMoney();
  return (v: SchemeView): { text: string; lang?: string } => {
    if (v.s.amount && v.s.amount > 0) return { text: t(`get.${v.kind}`, { amount: m.rupees(v.s.amount) }) };
    if (v.what) return { text: v.what, lang: "en" };
    return { text: t(`getText.${v.kind}`) };
  };
}

function SchemeCard({ v, levelLabel, onOpen }: { v: SchemeView; levelLabel: (k: LevelKey) => string; onOpen: () => void }) {
  const t = useTranslations("page_schemes");
  const get = useWhatYouGet()(v);
  const shownAud = v.aud.slice(0, 3);
  return (
    <TapCard onOpen={onOpen} ariaLabel={t("list.cardAria", { name: v.s.name })} more={t("list.more")}>
      <CardHead emoji={KIND_EMOJI[v.kind]} title={v.s.name} titleLocal={v.s.nameLocal} />
      <span
        lang={get.lang}
        style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 15, lineHeight: "22px", fontWeight: 650, color: "var(--hue-deep)" }}
      >
        <span className="ftp-emoji" aria-hidden>🎁</span>
        <span style={{ minWidth: 0 }}>{get.text}</span>
      </span>
      <TagRow>
        {v.level && <HueTag emoji={LEVEL_EMOJI[v.level]}>{levelLabel(v.level)}</HueTag>}
        {shownAud.map((a) => (
          <HueTag key={a} outline emoji={AUD_EMOJI[a]}>
            {t(`aud.${a}`)}
          </HueTag>
        ))}
        {v.aud.length > shownAud.length && <HueTag outline>{t("list.moreWho", { n: v.aud.length - shownAud.length })}</HueTag>}
        {v.apply && <HueTag emoji="🔗">{t("list.applyOnline")}</HueTag>}
      </TagRow>
    </TapCard>
  );
}

function SchemeSheet({
  v,
  coverage,
  locale,
  districtName,
  stateName,
  updated,
}: {
  v: SchemeView;
  coverage: Coverage[string]["districts"];
  locale: string;
  districtName: string;
  stateName: string;
  updated: string | null;
}) {
  const t = useTranslations("page_schemes");
  const f = useFormat();
  const m = useMoney();
  const place = usePlaceText();
  const get = useWhatYouGet()(v);
  const s = v.s;
  const src = sourceParts(s.source);
  const site = hostOf(v.apply);
  // The category word as published, translated when the language has it.
  const category = f.locale !== "en" && t.has(`cat.${catKey(s.category)}`) ? t(`cat.${catKey(s.category)}`) : s.category;
  const where = v.level
    ? t(`where.${v.level}`, { state: stateName, district: districtName })
    : t("where.unknown");

  return (
    <>
      <SheetHighlight emoji="🎁" label={t("sheet.whatYouGet")} lang={get.lang}>
        {get.text}
      </SheetHighlight>
      {v.what && get.lang !== "en" && (
        <p lang="en" className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: -6 }}>
          {t("sheet.officialWords", { text: v.what })}
        </p>
      )}

      <SheetSection emoji="👥" title={t("sheet.who")}>
        {v.aud.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <TagRow>
              {v.aud.map((a) => (
                <HueTag key={a} emoji={AUD_EMOJI[a]}>
                  {t(`aud.${a}`)}
                </HueTag>
              ))}
            </TagRow>
          </div>
        )}
        {s.eligibility ? (
          <p className="ftp-body" style={{ fontSize: 14, lineHeight: "21px" }}>
            <span style={{ color: "var(--ftp-text-2)" }}>{t("sheet.whoNote")} </span>
            <span lang="en">{v.who ?? s.eligibility}</span>
          </p>
        ) : (
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{t("sheet.whoMissing")}</p>
        )}
      </SheetSection>

      <SheetSection emoji={v.level ? LEVEL_EMOJI[v.level] : "📍"} title={t("sheet.where")}>
        <p className="ftp-body" style={{ fontSize: 14, lineHeight: "21px" }}>{where}</p>
        {coverage.length > 0 && (
          <>
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 6 }}>{t("where.alsoListed", { n: coverage.length })}</p>
            <ul style={{ listStyle: "none", margin: "6px 0 0", padding: 0, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {coverage.slice(0, 12).map((d) => (
                <li key={d.slug}>
                  <Link
                    href={`/${locale}/${d.stateSlug}/${d.slug}/schemes`}
                    className="ftp-chip"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "0 10px",
                      borderRadius: 999,
                      border: "1px solid color-mix(in srgb, var(--hue) 30%, var(--ftp-border))",
                      color: "var(--hue-deep)",
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    {t("where.place", { district: d.name, state: place.state(d.stateSlug, d.stateName) })}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </SheetSection>

      <SheetSection emoji="🪜" title={t("sheet.how")}>
        <HowItWorks steps={stepsFor(v.kind, s.name).map((st) => ({ emoji: st.emoji, title: t(`step.${st.key}`) }))} />
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 8 }}>{t("sheet.howNote")}</p>
      </SheetSection>

      <SheetSection emoji="📄" title={t("sheet.docs")}>
        <ul style={{ margin: 0, paddingInlineStart: 20, fontSize: 14, lineHeight: "22px" }}>
          {docsFor(v.kind).map((d) => (
            <li key={d}>{t(`doc.${d}`)}</li>
          ))}
        </ul>
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 6 }}>{t("sheet.docsNote")}</p>
      </SheetSection>

      <SheetSection emoji="🧾" title={t("sheet.facts")}>
        <DetailList
          rows={[
            { emoji: "💰", label: t("sheet.benefit"), value: s.amount && s.amount > 0 ? m.rupees(s.amount) : null },
            { emoji: "👥", label: t("sheet.people"), value: s.beneficiaryCount ? m.num(s.beneficiaryCount) : null },
            { emoji: "🗂️", label: t("sheet.category"), value: category },
            { emoji: "🏛️", label: t("sheet.runBy"), value: v.level ? t(`runBy.${v.level}`) : s.level || null },
            { emoji: "📝", label: t("sheet.howApply"), value: site ? t("sheet.applyOnlineAt", { site }) : t("sheet.applyOffice") },
            {
              emoji: "🔗",
              label: t("sheet.source"),
              value: src.name ? (
                src.url ? (
                  <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--hue-deep)", fontWeight: 600 }}>
                    {src.name}
                  </a>
                ) : (
                  src.name
                )
              ) : (
                t("sheet.sourceNone")
              ),
            },
            { emoji: "🕒", label: t("sheet.updated"), value: updated },
          ]}
        />
      </SheetSection>

      <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{t("sheet.check")}</p>
    </>
  );
}

export default function SchemesPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("schemes")}>
      <SchemesPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
