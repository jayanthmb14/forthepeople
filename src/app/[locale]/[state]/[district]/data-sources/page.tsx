/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Data Sources page — Design v4 "Rang" module recipe (see the finance page):
//   PageHeader → AI summary → StatStrip of emoji tiles → picture (how many
//   tracked feeds are fresh right now, from /api/data/freshness) → "how our
//   data arrives" ring (sources by kind) → data pledge → one card per
//   module source, its emoji chip in that module's own hue → sources.
//
// The list comes from the state registry (src/lib/constants/state-config.ts,
// the single source of truth): the sources every district shares plus the
// state's own. Unknown states get the shared list only — never another
// state's sources. Every word on the page comes from
// src/dictionaries/<locale>/page_data-sources.json; official source names
// stay as published.

"use client";
import { use } from "react";
import type React from "react";
import { useTranslations } from "next-intl";
import { Database, Clock } from "lucide-react";
import { PageHeader, StatStrip, StatTile, Section, Card, Pill, FreshnessPill, SourcePill } from "@/components/district/ui";
import { ChartCard, Explainer, Gauge, Pictogram } from "@/components/district/visuals";
import { ShareRing } from "@/components/accountability/AccountabilityVisuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import { useFreshness, type FreshnessKey } from "@/hooks/useFreshness";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { getStateConfig, UNIVERSAL_DATA_SOURCES, type DataSourceEntry } from "@/lib/constants/state-config";
import { getModuleMeta, hueClass, HUE_HEX, type Hue } from "@/lib/design/hues";
import { useFormat, useModuleText } from "@/i18n/client";

/** The sources every district shares, then the state's own. */
function getDataSources(stateSlug: string): DataSourceEntry[] {
  return [...UNIVERSAL_DATA_SOURCES, ...(getStateConfig(stateSlug)?.dataSources ?? [])];
}

// ── Presentation helpers ────────────────────────────────────────────────

/** Page wrapper: the container (24 px sides, 16 on phones) at reading width. */
const PAGE_STYLE: React.CSSProperties = { paddingTop: 24, paddingBottom: 32, maxWidth: "var(--ftp-reading-max)" };

/**
 * Which rows on this page have a freshness feed in /api/data/freshness.
 * Only these get a FreshnessPill with a real date; every other source shows
 * its published refresh cadence instead (we never invent a date).
 */
const FRESHNESS_KEY_FOR_ROW: Record<string, FreshnessKey> = {
  "Crop Prices": "crops",
  Weather: "weather",
  "Dam Levels": "dam",
  News: "news",
};

/**
 * Registry row name → its message key and the sidebar module it feeds. The
 * slug gives the row its module's emoji and hue; `emoji` overrides the
 * registry where two rows share a module (rainfall and weather) or the
 * registry emoji is generic. Rows not listed keep their registry name.
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

/** Registry cadence text → message key. Unknown text is shown as published. */
const FREQ_KEY: Record<string, string> = {
  "Every 30 minutes": "every30min",
  "Every 6 hours": "every6h",
  Daily: "daily",
  "Daily (market days)": "dailyMarket",
  Weekly: "weekly",
  Monthly: "monthly",
  Quarterly: "quarterly",
  Seasonal: "seasonal",
  Annual: "annual",
  "Post-election": "postElection",
  "On-change": "onChange",
  "As announced": "asAnnounced",
  "When the source publishes": "whenPublished",
  Static: "static",
};

/** How a source reaches us → message key and ring order. */
const TYPE_KEY: Record<DataSourceEntry["type"], string> = {
  API: "api",
  Collected: "collected",
  Aggregated: "aggregated",
  Static: "static",
  RSS: "rss",
};

/** Each kind of source gets its own hue in the ring, so the slices read
    apart at a glance (the legend names them). */
const TYPE_HUE: Record<DataSourceEntry["type"], Hue> = {
  API: "blue",
  Collected: "amber",
  Aggregated: "violet",
  Static: "teal",
  RSS: "rose",
};

/** Emoji + hue class for a row; unknown rows keep the page's own look. */
function rowLook(moduleName: string): { emoji: string; hue?: string } {
  const m = ROW_MODULE[moduleName];
  if (!m) return { emoji: "🔗" };
  return { emoji: m.emoji ?? getModuleMeta(m.slug)?.emoji ?? "🔗", hue: hueClass(m.slug) };
}

/** Short, readable label for a SourcePill: the link's host name. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** The "Automatic feed" pill in the page hue (tint background, deep text). */
const HUE_PILL: React.CSSProperties = { background: "var(--hue-tint)", color: "var(--hue-deep)" };

export default function DataSourcesPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_data-sources");
  const f = useFormat();
  const mt = useModuleText();
  const base = `/${locale}/${state}/${district}`;
  const num = (n: number) => f.number(n);

  const DATA_SOURCES = getDataSources(state);
  const liveCount = DATA_SOURCES.filter((s) => s.status === "live").length;
  const apiCount = DATA_SOURCES.filter((s) => s.type === "API").length;

  const rowName = (moduleName: string) => {
    const key = ROW_MODULE[moduleName]?.key;
    return key && t.has(`rows.${key}`) ? t(`rows.${key}`) : moduleName;
  };
  const cadence = (freq: string) => {
    if (FREQ_KEY[freq]) return t(`freq.${FREQ_KEY[freq]}`);
    if (/^census/i.test(freq)) return t("freq.censusMix");
    return freq;
  };

  // How the data arrives: each source has exactly one kind, so the parts
  // add up to the whole list and a ring is honest here.
  const byType = (Object.keys(TYPE_KEY) as DataSourceEntry["type"][])
    .map((type) => ({ type, count: DATA_SOURCES.filter((s) => s.type === type).length }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);
  const topType = byType[0];

  // One cached request: "how old is each automatic feed for this district?"
  // This page is the district's honest freshness dashboard.
  const fresh = useFreshness(state, district);
  const summary = fresh.summary;
  const trackedFeeds = summary ? summary.green + summary.amber + summary.red + summary.unknown : 0;
  // Share of tracked feeds inside their refresh window — the picture below.
  const freshPct = summary && trackedFeeds > 0 ? (summary.green / trackedFeeds) * 100 : null;

  return (
    <div className="ftp-container" style={PAGE_STYLE}>
      <PageHeader
        icon={Database}
        title={mt.label("data-sources")}
        description={mt.description("data-sources")}
        backHref={base}
        accent={getModuleAccent("data-sources")}
        freshness={fresh.checkedAt ? { asOf: fresh.checkedAt } : undefined}
      />
      <AIInsightCard module="data-sources" district={district} />

      <StatStrip cols={4}>
        <StatTile emoji="🗂️" label={t("tileModules")} value={num(DATA_SOURCES.length)} sub={t("tileModulesSub")} />
        <StatTile emoji="⚙️" label={t("tileAuto")} value={num(liveCount)} sub={t("tileAutoSub")} />
        <StatTile emoji="🏛️" label={t("tileApi")} value={num(apiCount)} sub={t("tileApiSub")} />
        <StatTile
          emoji="✅"
          label={t("tileFresh")}
          value={summary ? t("nOfTotal", { n: num(summary.green), total: num(trackedFeeds) }) : "—"}
          sub={summary ? t("tileFreshSub") : fresh.loading ? t("checking") : t("checkUnavailable")}
          asOf={fresh.checkedAt}
          countUp={false}
        />
      </StatStrip>

      {/* The picture: one antenna per feed we check for this district, lit
          when that feed is inside its refresh window; plus a dial. Same
          numbers as the "Feeds fresh now" tile. */}
      {summary && freshPct !== null && (
        <div className="ftp-picture-row" style={{ marginTop: 16 }}>
          <Card tinted padding={18}>
            <Explainer emoji="📡">
              {summary.green < trackedFeeds
                ? t.rich("explainSome", { n: trackedFeeds, fresh: summary.green, b: (c) => <strong>{c}</strong> })
                : t.rich("explainAll", { n: trackedFeeds, b: (c) => <strong>{c}</strong> })}
            </Explainer>
            <Pictogram
              filled={summary.green}
              total={trackedFeeds}
              emoji="📡"
              label={t("pictoLabel", { fresh: num(summary.green), n: num(trackedFeeds) })}
            />
          </Card>
          <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Gauge value={freshPct} label={t("tileFresh")} caption={t("gaugeCaption")} />
          </Card>
        </div>
      )}

      {/* How the data arrives — sources grouped by kind. */}
      {byType.length > 1 && topType && (
        <div style={{ marginTop: 24 }}>
          <ChartCard
            title={t("ringTitle")}
            emoji="🧩"
            units={t("ringUnits")}
            simple={t.rich("ringSimple", {
              kind: t(`type.${TYPE_KEY[topType.type]}`),
              n: topType.count,
              total: DATA_SOURCES.length,
              b: (c) => <strong>{c}</strong>,
            })}
            table={byType.map((x) => ({ label: t(`type.${TYPE_KEY[x.type]}`), value: num(x.count) }))}
          >
            <ShareRing
              ariaLabel={t("ringAria", { total: DATA_SOURCES.length })}
              centerValue={num(DATA_SOURCES.length)}
              centerLabel={t("ringCenter", { n: DATA_SOURCES.length })}
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
        </div>
      )}

      {/* Data pledge */}
      <Section title={t("pledgeTitle")} emoji="🤝">
        <Card tinted>
          <p className="ftp-body">{t("pledgeBody")}</p>
        </Card>
      </Section>

      <Section title={t("listTitle")} emoji="🔗">
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {DATA_SOURCES.map((ds) => {
            const auto = ds.status === "live";
            const key = FRESHNESS_KEY_FOR_ROW[ds.module];
            const freshness = key ? fresh.modules[key] : undefined;
            const look = rowLook(ds.module);
            return (
              <Card as="li" key={`${ds.module}-${ds.source}`} padding={12}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 220px", minWidth: 0, display: "flex", gap: 12, alignItems: "flex-start" }}>
                    {/* The module's own emoji, tinted in that module's hue. */}
                    <span className={look.hue} style={{ display: "inline-flex", flexShrink: 0 }}>
                      <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 36, height: 36, fontSize: 18, borderRadius: 11 }}>
                        {look.emoji}
                      </span>
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <h3 className="ftp-title">{rowName(ds.module)}</h3>
                        <Pill style={auto ? HUE_PILL : undefined}>{auto ? t("autoFeed") : t("periodic")}</Pill>
                        {/* Same colour as this kind's slice in the ring above. */}
                        <Pill style={{ background: HUE_HEX[TYPE_HUE[ds.type]].tint, color: HUE_HEX[TYPE_HUE[ds.type]].deep }}>
                          {t(`type.${TYPE_KEY[ds.type]}`)}
                        </Pill>
                      </div>
                      <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>
                        {t.rich("sourceLine", {
                          source: ds.source,
                          s: (c) => (
                            <span lang="en" style={{ color: "var(--ftp-text)" }}>
                              {c}
                            </span>
                          ),
                        })}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {/* A real date when we track this feed; otherwise the published cadence. */}
                    {freshness?.asOf ? (
                      <FreshnessPill asOf={freshness.asOf} status={freshness.status} />
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                        <Clock size={12} aria-hidden /> {cadence(ds.frequency)}
                      </span>
                    )}
                    {ds.url && <SourcePill label={hostOf(ds.url)} href={ds.url} />}
                  </div>
                </div>
              </Card>
            );
          })}
        </ul>
      </Section>

      <ModulePageFooter moduleSlug="data-sources" locale={locale} state={state} district={district} showCompare={false} />
    </div>
  );
}
