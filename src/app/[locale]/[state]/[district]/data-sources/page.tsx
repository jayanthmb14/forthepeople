/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Data Sources page — Design v4 "Rang" module recipe (see the finance page):
//   PageHeader → AI summary → StatStrip of emoji tiles → picture (how many
//   tracked feeds are fresh right now, from /api/data/freshness) → data
//   pledge → one card per module source, its emoji chip in that module's
//   own hue → sources.

"use client";
import { use } from "react";
import type React from "react";
import { Database, Clock } from "lucide-react";
import {
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  Pill,
  FreshnessPill,
  SourcePill,
} from "@/components/district/ui";
import { Explainer, Gauge, Pictogram } from "@/components/district/visuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import { useFreshness, type FreshnessKey } from "@/hooks/useFreshness";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { getModuleMeta, hueClass } from "@/lib/design/hues";

// State-specific source overrides
const STATE_SOURCES: Record<string, { rainfall: string; dam: string; budget: string; rti: string; transport: string; transportUrl: string | null; sugar: { source: string } | null; leaders: string }> = {
  karnataka: { rainfall: "Karnataka State Natural Disaster Monitoring Centre", dam: "Karnataka Water Resources Department", budget: "Karnataka Finance Dept / Comptroller Accounts", rti: "CIC / Karnataka Information Commission", transport: "KSRTC / IRCTC", transportUrl: "https://ksrtc.in", sugar: { source: "Karnataka Sugar Directorate" }, leaders: "Lok Sabha / Vidhan Soudha / DC Office" },
  telangana: { rainfall: "Telangana State Development Planning Society", dam: "Telangana Irrigation Department", budget: "Telangana Finance Dept", rti: "CIC / Telangana Information Commission", transport: "TSRTC / IRCTC", transportUrl: "https://tsrtconline.in", sugar: null, leaders: "Lok Sabha / Telangana Legislature / Collectorate" },
  delhi: { rainfall: "IMD Delhi", dam: "Delhi Jal Board", budget: "Delhi Finance Dept", rti: "CIC / Delhi Information Commission", transport: "DTC / DMRC / IRCTC", transportUrl: "https://dtc.delhi.gov.in", sugar: null, leaders: "Lok Sabha / Delhi Assembly / DC Office" },
  maharashtra: { rainfall: "IMD Mumbai / MSDMA", dam: "Maharashtra Water Resources Department", budget: "Maharashtra Finance Dept", rti: "CIC / Maharashtra Information Commission", transport: "MSRTC / IRCTC", transportUrl: "https://msrtc.maharashtra.gov.in", sugar: null, leaders: "Lok Sabha / Vidhan Sabha / DC Office" },
  "west-bengal": { rainfall: "IMD Kolkata", dam: "West Bengal Irrigation Department", budget: "West Bengal Finance Dept", rti: "CIC / WB Information Commission", transport: "SBSTC / IRCTC", transportUrl: null, sugar: null, leaders: "Lok Sabha / WB Assembly / DM Office" },
  "tamil-nadu": { rainfall: "IMD Chennai / TNSDMA", dam: "Tamil Nadu PWD (WRD)", budget: "Tamil Nadu Finance Dept", rti: "CIC / TN Information Commission", transport: "TNSTC / IRCTC", transportUrl: "https://tnstc.in", sugar: null, leaders: "Lok Sabha / TN Assembly / DC Office" },
};

function getDataSources(stateSlug: string) {
  const s = STATE_SOURCES[stateSlug] ?? STATE_SOURCES.karnataka;
  const sources = [
    { module: "Crop Prices", source: "agmarknet.gov.in", frequency: "Daily", type: "API", status: "live", url: "https://agmarknet.gov.in" },
    { module: "Weather", source: "IMD / OpenWeather", frequency: "Hourly", type: "API", status: "live", url: "https://mausam.imd.gov.in" },
    { module: "Rainfall", source: s.rainfall, frequency: "Daily", type: "API", status: "live", url: null },
    { module: "Dam Levels", source: s.dam, frequency: "Daily", type: "Collected", status: "live", url: null },
    { module: "Schemes", source: "MyScheme.gov.in", frequency: "Weekly", type: "API", status: "static", url: "https://myscheme.gov.in" },
    { module: "Elections", source: "Election Commission of India", frequency: "Post-election", type: "Static", status: "static", url: "https://eci.gov.in" },
    { module: "Budget & Revenue", source: s.budget, frequency: "Quarterly", type: "PDF Parse", status: "static", url: null },
    { module: "Infrastructure", source: "News articles (Google News RSS, regional media) + government press releases", frequency: "Hourly (news cron)", type: "RSS", status: "live", url: null },
    { module: "Schools", source: "UDISE+ (MoE)", frequency: "Annual", type: "API", status: "static", url: "https://udiseplus.gov.in" },
    { module: "Jal Jeevan Mission", source: "JJM National Dashboard", frequency: "Weekly", type: "API", status: "live", url: "https://ejalshakti.gov.in/jjmreport" },
    { module: "Housing", source: "AwaasSoft (PMAY)", frequency: "Monthly", type: "API", status: "live", url: "https://pmayg.nic.in" },
    { module: "Courts", source: "NJDG (National Judicial Data Grid)", frequency: "Weekly", type: "API", status: "static", url: "https://njdg.ecourts.gov.in" },
    { module: "Police / Crime", source: "NCRB Annual Report", frequency: "Annual", type: "PDF Parse", status: "static", url: "https://ncrb.gov.in" },
    { module: "RTI", source: s.rti, frequency: "Annual", type: "Collected", status: "static", url: null },
    { module: "Transport", source: s.transport, frequency: "Monthly", type: "API", status: "static", url: s.transportUrl },
    { module: "Panchayats", source: "ePanchayat / PRIASoft", frequency: "Monthly", type: "API", status: "static", url: "https://egramswaraj.gov.in" },
    { module: "Population", source: "Census of India 2011", frequency: "Decennial", type: "Static", status: "static", url: "https://censusindia.gov.in" },
    { module: "News", source: "RSS Feeds / Local Media", frequency: "Hourly", type: "RSS", status: "live", url: null },
    { module: "Leaders", source: s.leaders, frequency: "On-change", type: "Manual", status: "static", url: null },
  ];
  // Only add Sugar Factories for states that have them
  if (s.sugar) {
    sources.push({ module: "Sugar Factories", source: s.sugar.source, frequency: "Seasonal", type: "Collected", status: "static", url: null });
  }
  return sources;
}

// ── Presentation helpers ────────────────────────────────────────────────

/** Page wrapper: the v3 container (24 px sides, 16 on phones) at reading width. */
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
 * Row name → the sidebar module it feeds. The slug gives the row its
 * module's emoji and hue; `emoji` overrides the registry where two rows
 * share a module (rainfall and weather) or the registry emoji is generic.
 */
const ROW_MODULE: Record<string, { slug: string; emoji?: string }> = {
  "Crop Prices": { slug: "crops" },
  Weather: { slug: "weather" },
  Rainfall: { slug: "weather", emoji: "🌧️" },
  "Dam Levels": { slug: "water" },
  Schemes: { slug: "schemes" },
  Elections: { slug: "elections", emoji: "🗳️" },
  "Budget & Revenue": { slug: "finance" },
  Infrastructure: { slug: "infrastructure" },
  Schools: { slug: "schools" },
  "Jal Jeevan Mission": { slug: "jjm" },
  Housing: { slug: "housing" },
  Courts: { slug: "courts" },
  "Police / Crime": { slug: "police" },
  RTI: { slug: "rti" },
  Transport: { slug: "transport" },
  Panchayats: { slug: "gram-panchayat" },
  Population: { slug: "population" },
  News: { slug: "news" },
  Leaders: { slug: "leadership" },
  "Sugar Factories": { slug: "industries" },
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

/** "live" rows are automatic feeds; "static" rows are refreshed periodically. */
function feedLabel(status: string): { text: string; auto: boolean } {
  return status === "live" ? { text: "Automatic feed", auto: true } : { text: "Periodic update", auto: false };
}

/** The "Automatic feed" pill in the page hue (tint background, deep text). */
const HUE_PILL: React.CSSProperties = { background: "var(--hue-tint)", color: "var(--hue-deep)" };

export default function DataSourcesPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;

  const DATA_SOURCES = getDataSources(state);
  const liveCount = DATA_SOURCES.filter((s) => s.status === "live").length;
  const apiCount = DATA_SOURCES.filter((s) => s.type === "API").length;

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
        title="Data Sources"
        description="Transparency: every data point's source, method, and update frequency"
        backHref={base}
        accent={getModuleAccent("data-sources")}
        freshness={fresh.checkedAt ? { asOf: fresh.checkedAt } : undefined}
      />
      <AIInsightCard module="data-sources" district={district} />

      <StatStrip cols={4}>
        <StatTile emoji="🗂️" label="Data modules" value={DATA_SOURCES.length} sub="Listed on this page" />
        <StatTile emoji="⚙️" label="Automatic feeds" value={liveCount} sub="Refreshed by our pipeline" />
        <StatTile emoji="🏛️" label="Official APIs" value={apiCount} sub="Government endpoints" />
        <StatTile
          emoji="✅"
          label="Feeds fresh now"
          value={summary ? `${summary.green}/${trackedFeeds}` : "—"}
          sub={summary ? "Inside their expected refresh window" : fresh.loading ? "Checking…" : "Freshness check unavailable"}
          asOf={fresh.checkedAt}
        />
      </StatStrip>

      {/* The picture: one antenna per feed we check for this district, lit
          when that feed is inside its refresh window; plus a dial. Same
          numbers as the "Feeds fresh now" tile. */}
      {summary && freshPct !== null && (
        <div className="ftp-picture-row" style={{ marginTop: 16 }}>
          <Card tinted padding={18}>
            <Explainer title="In simple words" emoji="📡">
              We check <strong>{trackedFeeds}</strong> automatic {trackedFeeds === 1 ? "feed" : "feeds"} for this district.
              Right now <strong>{summary.green}</strong> of them {summary.green === 1 ? "is" : "are"} up to date
              {summary.green < trackedFeeds ? "; the others are late or have not reported yet." : "."}
            </Explainer>
            <Pictogram
              filled={summary.green}
              total={trackedFeeds}
              emoji="📡"
              label={`${summary.green} of ${trackedFeeds} feeds are inside their expected refresh window.`}
            />
          </Card>
          <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Gauge value={freshPct} label="Feeds fresh now" caption="Share of checked feeds that are up to date" />
          </Card>
        </div>
      )}

      {/* Data pledge */}
      <Section title="Our data pledge" emoji="🤝">
        <Card tinted>
          <p className="ftp-body">
            All data on ForThePeople.in is sourced exclusively from government portals, official APIs, and publicly available documents.
            We never fabricate data. Each module clearly links to its source. Live modules auto-refresh every 60 seconds.
          </p>
        </Card>
      </Section>

      <Section title="Module data sources" emoji="🔗">
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {DATA_SOURCES.map((ds) => {
            const feed = feedLabel(ds.status);
            const key = FRESHNESS_KEY_FOR_ROW[ds.module];
            const freshness = key ? fresh.modules[key] : undefined;
            const look = rowLook(ds.module);
            return (
              <Card as="li" key={ds.module} padding={12}>
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
                        <h3 className="ftp-title">{ds.module}</h3>
                        <Pill style={feed.auto ? HUE_PILL : undefined}>{feed.text}</Pill>
                        <Pill>{ds.type}</Pill>
                      </div>
                      <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>
                        Source: <span style={{ color: "var(--ftp-text)" }}>{ds.source}</span>
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {/* A real date when we track this feed; otherwise the published cadence. */}
                    {freshness?.asOf ? (
                      <FreshnessPill asOf={freshness.asOf} status={freshness.status} />
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                        <Clock size={12} aria-hidden /> {ds.frequency}
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
