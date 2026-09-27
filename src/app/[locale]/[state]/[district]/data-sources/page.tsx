/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Where our data comes from — docs/LAYOUT.md page recipe
// ═══════════════════════════════════════════════════════════════════════
//  The question: "Can I trust these numbers? Where does each one come
//  from, and is it up to date?"
//
//    PageHeader → Explainer (how many sources; how many live feeds are up
//    to date right now) → 4 StatTiles → ONE picture: a traffic light for
//    every feed we check automatically (green = up to date, amber = a bit
//    late, red = late, grey = not reported), with what each colour means
//    → source cards with a freshness stripe; tapping one opens a
//    DetailSheet (what it feeds, the source, how it reaches us, how often
//    it updates, freshness now; Open the source / Open the page)
//    → "how our data arrives" ring beside the data pledge → sources.
//
//  The list comes from the state registry (src/lib/constants/state-config.ts,
//  the single source of truth): the sources every district shares plus the
//  state's own. Freshness comes from /api/data/freshness (useFreshness);
//  only the feeds it reports get a colour — every other source shows its
//  published refresh cadence instead (we never invent a date).
//  Words: src/dictionaries/<locale>/page_data-sources.json; official source
//  names stay as published.
"use client";

import type React from "react";
import { use, useCallback, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Database } from "lucide-react";
import { ModulePage, PageHeader, StatStrip, StatTile, Section, Card, FreshnessPill } from "@/components/district/ui";
import { ChartCard, Explainer } from "@/components/district/visuals";
import { DetailSheet, DetailList } from "@/components/district/DetailSheet";
import { ShareRing } from "@/components/accountability/AccountabilityVisuals";
import { AccountabilityFooter, CardChip, CardList, ChartRow, SheetAction, SheetNote, TapCard, useCadence } from "@/components/accountability/AccountabilityKit";
import AIInsightCard from "@/components/common/AIInsightCard";
import { useFreshness, type FreshnessKey, type FreshnessStatus } from "@/hooks/useFreshness";
import { getStateConfig, UNIVERSAL_DATA_SOURCES, type DataSourceEntry } from "@/lib/constants/state-config";
import { getModuleMeta, hueClass, HUE_HEX, type Hue } from "@/lib/design/hues";
import { useDistrictName, useFormat, useModuleText } from "@/i18n/client";

/** The sources every district shares, then the state's own. */
function getDataSources(stateSlug: string): DataSourceEntry[] {
  return [...UNIVERSAL_DATA_SOURCES, ...(getStateConfig(stateSlug)?.dataSources ?? [])];
}

/** Registry rows that have a freshness feed in /api/data/freshness. */
const FRESHNESS_KEY_FOR_ROW: Record<string, FreshnessKey> = {
  "Crop Prices": "crops",
  Weather: "weather",
  "Dam Levels": "dam",
  News: "news",
};

/** The feeds the freshness check reports, in the order of the traffic lights. */
const FEEDS: Array<{ key: FreshnessKey; emoji: string }> = [
  { key: "weather", emoji: "🌦️" },
  { key: "crops", emoji: "🌾" },
  { key: "dam", emoji: "🌊" },
  { key: "news", emoji: "📰" },
  { key: "aiInsights", emoji: "🤖" },
];

/**
 * Registry row name → its message key and the sidebar module it feeds. The
 * slug gives the row its module's emoji, hue and page link; `emoji`
 * overrides the registry where two rows share a module.
 */
const ROW_MODULE: Record<string, { key: string; slug: string; emoji?: string }> = {
  "Crop Prices": { key: "cropPrices", slug: "crops" },
  Weather: { key: "weather", slug: "weather" },
  Rainfall: { key: "rainfall", slug: "weather", emoji: "🌧️" },
  "Dam Levels": { key: "damLevels", slug: "water" },
  "Power Outages": { key: "powerOutages", slug: "power" },
  Schemes: { key: "schemes", slug: "schemes" },
  Elections: { key: "elections", slug: "elections", emoji: "🗳️" },
  "Budget & Revenue": { key: "budget", slug: "finance" },
  Infrastructure: { key: "infrastructure", slug: "infrastructure" },
  Schools: { key: "schools", slug: "schools" },
  "Jal Jeevan Mission": { key: "jjm", slug: "jjm" },
  Housing: { key: "housing", slug: "housing" },
  Courts: { key: "courts", slug: "courts" },
  "Police / Crime": { key: "police", slug: "police" },
  RTI: { key: "rti", slug: "rti" },
  Transport: { key: "transport", slug: "transport" },
  Panchayats: { key: "panchayats", slug: "gram-panchayat" },
  Population: { key: "population", slug: "population" },
  News: { key: "news", slug: "news" },
  Leaders: { key: "leaders", slug: "leadership" },
  "Famous Personalities": { key: "famous", slug: "famous-personalities" },
  Offices: { key: "offices", slug: "offices" },
  "Government Exams": { key: "exams", slug: "exams" },
  "Sugar Factories": { key: "sugar", slug: "industries", emoji: "🏭" },
};

/** How a source reaches us → message key. */
const TYPE_KEY: Record<DataSourceEntry["type"], string> = {
  API: "api",
  Collected: "collected",
  Aggregated: "aggregated",
  Static: "static",
  RSS: "rss",
};

/** Each kind gets its own hue in the ring so the slices read apart. */
const TYPE_HUE: Record<DataSourceEntry["type"], Hue> = {
  API: "blue",
  Collected: "amber",
  Aggregated: "violet",
  Static: "teal",
  RSS: "rose",
};

/** Traffic-light colours (the kit's semantic tones). */
const LIGHT: Record<FreshnessStatus, { color: string; tint: string; emoji: string }> = {
  green: { color: "var(--ftp-live)", tint: "var(--ftp-live-tint)", emoji: "🟢" },
  amber: { color: "var(--ftp-warn)", tint: "var(--ftp-warn-tint)", emoji: "🟡" },
  red: { color: "var(--ftp-danger)", tint: "var(--ftp-danger-tint)", emoji: "🔴" },
  unknown: { color: "var(--ftp-border-strong)", tint: "var(--ftp-surface-2)", emoji: "⚪" },
};

/** Short label for a link: its host name. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

export default function DataSourcesPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_data-sources");
  const f = useFormat();
  const mt = useModuleText();
  const cadence = useCadence();
  const districtName = useDistrictName(state, district);
  const base = `/${locale}/${state}/${district}`;
  const num = (n: number) => f.number(n);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  // Stable, so the sheet's focus handling does not re-run on every render.
  const closeSheet = useCallback(() => setOpenIdx(null), []);

  const sources = getDataSources(state);
  const liveCount = sources.filter((s) => s.status === "live").length;
  const apiCount = sources.filter((s) => s.type === "API").length;

  const rowName = (moduleName: string) => {
    const key = ROW_MODULE[moduleName]?.key;
    return key && t.has(`rows.${key}`) ? t(`rows.${key}`) : moduleName;
  };
  const rowEmoji = (moduleName: string) => {
    const m = ROW_MODULE[moduleName];
    return m ? m.emoji ?? getModuleMeta(m.slug)?.emoji ?? "🔗" : "🔗";
  };

  // One cached request: how old is each automatic feed for this district?
  const fresh = useFreshness(state, district);
  const summary = fresh.summary;
  const tracked = summary ? summary.green + summary.amber + summary.red + summary.unknown : 0;
  const statusLabel = (s: FreshnessStatus) => t(`light.${s}`);

  // How the data arrives: each source has exactly one kind, so a ring is honest.
  const byType = (Object.keys(TYPE_KEY) as DataSourceEntry["type"][])
    .map((type) => ({ type, count: sources.filter((s) => s.type === type).length }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);
  const topType = byType[0];

  // Sources whose feed we check come first, late ones before fresh ones.
  const order: Record<FreshnessStatus, number> = { red: 0, amber: 1, unknown: 2, green: 3 };
  const rows = sources
    .map((ds, i) => {
      const key = FRESHNESS_KEY_FOR_ROW[ds.module];
      return { ds, i, freshness: key ? fresh.modules[key] : undefined };
    })
    .sort((a, b) => {
      const fa = a.freshness ? order[a.freshness.status] : 9;
      const fb = b.freshness ? order[b.freshness.status] : 9;
      return fa - fb || a.i - b.i;
    });
  const open = openIdx !== null ? rows.find((r) => r.i === openIdx) ?? null : null;
  const openSlug = open ? ROW_MODULE[open.ds.module]?.slug : undefined;

  return (
    <ModulePage>
      <PageHeader
        icon={Database}
        title={mt.label("data-sources")}
        description={mt.description("data-sources")}
        backHref={base}
        freshness={fresh.checkedAt ? { asOf: fresh.checkedAt } : undefined}
      />

      <Explainer emoji="🔎">
        {t.rich("explain", { n: sources.length, district: districtName, b: bold })}{" "}
        {summary && tracked > 0 ? t.rich("explainFresh", { tracked, fresh: summary.green, b: bold }) : null}{" "}
        {t("explainDates")}
      </Explainer>

      <StatStrip>
        <StatTile emoji="🗂️" label={t("tileModules")} value={num(sources.length)} sub={t("tileModulesSub")} />
        <StatTile emoji="⚙️" label={t("tileAuto")} value={num(liveCount)} sub={t("tileAutoSub")} />
        <StatTile emoji="🏛️" label={t("tileApi")} value={num(apiCount)} sub={t("tileApiSub")} />
        <StatTile
          emoji="✅"
          label={t("tileFresh")}
          value={summary ? t("nOfTotal", { n: num(summary.green), total: num(tracked) }) : "—"}
          sub={summary ? t("tileFreshSub") : fresh.loading ? t("checking") : t("checkUnavailable")}
          asOf={fresh.checkedAt}
          countUp={false}
        />
      </StatStrip>

      {/* ONE picture: a traffic light for every feed we check automatically. */}
      <Card tinted padding={18} style={{ marginTop: 16 }}>
        <h2 className="ftp-display" style={{ margin: "0 0 4px", fontSize: 18, lineHeight: 1.35, fontWeight: 650 }}>
          {t("lightsTitle")}
        </h2>
        <p className="ftp-body" style={{ margin: "0 0 14px", color: "var(--ftp-text-2)", fontSize: 14 }}>
          {t("lightsHint")}
        </p>
        <ul className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "170px", listStyle: "none", margin: 0, padding: 0, gap: 10 } as React.CSSProperties}>
          {FEEDS.map((feed) => {
            const m = fresh.modules[feed.key];
            const status: FreshnessStatus = m?.status ?? "unknown";
            const light = LIGHT[status];
            return (
              <li
                key={feed.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: light.tint,
                  border: `2px solid ${light.color}`,
                  minWidth: 0,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: light.color,
                    boxShadow: status === "unknown" ? "none" : `0 0 0 5px color-mix(in srgb, ${light.color} 22%, transparent)`,
                    flexShrink: 0,
                  }}
                />
                <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span style={{ fontSize: 15, lineHeight: "20px", fontWeight: 700 }}>
                    <span className="ftp-emoji" aria-hidden>
                      {feed.emoji}{" "}
                    </span>
                    {t(`feeds.${feed.key}`)}
                  </span>
                  <span style={{ fontSize: 13, lineHeight: "18px", color: "var(--ftp-text-2)" }} suppressHydrationWarning>
                    {statusLabel(status)}
                    {m?.asOf ? ` · ${f.ago(m.asOf)}` : ""}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <p style={{ margin: "14px 0 0", display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, lineHeight: 1.5, color: "var(--ftp-text-2)" }}>
          {(["green", "amber", "red", "unknown"] as const).map((s) => (
            <span key={s}>
              <span className="ftp-emoji" aria-hidden>
                {LIGHT[s].emoji}{" "}
              </span>
              {t(`lightMeaning.${s}`)}
            </span>
          ))}
        </p>
      </Card>

      <AIInsightCard module="data-sources" district={district} />

      {/* Every source as a card; tap for the details. */}
      <Section title={t("listTitle")} emoji="🔗">
        <p className="ftp-body" style={{ margin: "-6px 0 12px", color: "var(--ftp-text-2)" }}>
          {t("listHint")}
        </p>
        <CardList label={t("listTitle")}>
          {rows.map(({ ds, i, freshness }) => {
            const slug = ROW_MODULE[ds.module]?.slug;
            return (
              <TapCard
                key={`${ds.module}-${ds.source}`}
                emoji={rowEmoji(ds.module)}
                title={rowName(ds.module)}
                sub={<span lang="en">{ds.source}</span>}
                hueClassName={slug ? hueClass(slug) : undefined}
                accent={freshness ? LIGHT[freshness.status].color : undefined}
                onOpen={() => setOpenIdx(i)}
              >
                {freshness?.asOf ? (
                  <FreshnessPill asOf={freshness.asOf} status={freshness.status} />
                ) : (
                  <CardChip emoji="🔄">{cadence(ds.frequency)}</CardChip>
                )}
              </TapCard>
            );
          })}
        </CardList>
      </Section>

      {/* How the data arrives, beside our promise. */}
      <ChartRow>
        {byType.length > 1 && topType && (
          <ChartCard
            title={t("ringTitle")}
            emoji="🧩"
            units={t("ringUnits")}
            simple={t.rich("ringSimple", { kind: t(`type.${TYPE_KEY[topType.type]}`), n: topType.count, total: sources.length, b: bold })}
            table={byType.map((x) => ({ label: t(`type.${TYPE_KEY[x.type]}`), value: num(x.count) }))}
          >
            <ShareRing
              ariaLabel={t("ringAria", { total: sources.length })}
              centerValue={num(sources.length)}
              centerLabel={t("ringCenter", { n: sources.length })}
              formatShare={(share) => f.number(share, { style: "percent", maximumFractionDigits: 0 })}
              slices={byType.map((x) => ({
                key: x.type,
                label: t(`type.${TYPE_KEY[x.type]}`),
                value: x.count,
                display: num(x.count),
                color: HUE_HEX[TYPE_HUE[x.type]].hue,
              }))}
            />
          </ChartCard>
        )}
        <Card tinted padding={18}>
          <h2 className="ftp-display" style={{ margin: "0 0 10px", fontSize: 18, lineHeight: 1.35, fontWeight: 650 }}>
            <span className="ftp-emoji" aria-hidden>
              🤝{" "}
            </span>
            {t("pledgeTitle")}
          </h2>
          <ul style={{ margin: 0, paddingInlineStart: 20, display: "flex", flexDirection: "column", gap: 8, fontSize: 15, lineHeight: 1.6 }}>
            <li>{t("pledge1")}</li>
            <li>{t("pledge2")}</li>
            <li>{t("pledge3")}</li>
            <li>{t("pledge4")}</li>
          </ul>
          <Link
            href={`${base}/update-log`}
            style={{ display: "inline-flex", alignItems: "center", minHeight: 44, marginTop: 8, fontSize: 14, fontWeight: 700, color: "var(--hue-deep)", textDecoration: "none" }}
          >
            {t("updateLogLink")} →
          </Link>
        </Card>
      </ChartRow>

      <div style={{ marginTop: 28 }}>
        <AccountabilityFooter moduleSlug="data-sources" locale={locale} state={state} district={district} showCompare={false} />
      </div>

      {/* Everything about one source. */}
      <DetailSheet
        open={open !== null}
        onClose={closeSheet}
        title={open ? rowName(open.ds.module) : ""}
        subtitle={open ? <span lang="en">{open.ds.source}</span> : undefined}
        emoji={open ? rowEmoji(open.ds.module) : "🔗"}
        hueClassName={openSlug ? hueClass(openSlug) : hueClass("data-sources")}
        footer={
          open ? (
            <>
              {open.ds.url && (
                <SheetAction href={open.ds.url} emoji="🌐" external>
                  {t("openSource")}
                </SheetAction>
              )}
              {openSlug && (
                <SheetAction href={`${base}/${openSlug}`} emoji={getModuleMeta(openSlug)?.emoji ?? "📄"} quiet={Boolean(open.ds.url)}>
                  {t("openPage", { page: mt.label(openSlug) })}
                </SheetAction>
              )}
            </>
          ) : null
        }
      >
        {open && (
          <>
            <DetailList
              rows={[
                { emoji: "📄", label: t("rowUsedOn"), value: openSlug ? mt.label(openSlug) : null },
                { emoji: "🏛️", label: t("rowSource"), value: open.ds.source, lang: "en" },
                { emoji: "🚚", label: t("rowType"), value: t(`type.${TYPE_KEY[open.ds.type]}`) },
                { emoji: "🔄", label: t("rowCadence"), value: cadence(open.ds.frequency) },
                { emoji: "⚙️", label: t("rowMode"), value: open.ds.status === "live" ? t("autoFeed") : t("periodic") },
                {
                  emoji: open.freshness ? LIGHT[open.freshness.status].emoji : "⚪",
                  label: t("rowFresh"),
                  value: open.freshness ? (
                    <span suppressHydrationWarning>
                      {statusLabel(open.freshness.status)}
                      {open.freshness.asOf ? ` · ${f.ago(open.freshness.asOf)}` : ""}
                    </span>
                  ) : (
                    t("notChecked")
                  ),
                },
                { emoji: "🔗", label: t("rowLink"), value: open.ds.url ? hostOf(open.ds.url) : null },
              ]}
            />
            <SheetNote emoji="📅">{t("sheetNote")}</SheetNote>
          </>
        )}
      </DetailSheet>
    </ModulePage>
  );
}
