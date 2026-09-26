/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { use } from "react";
import { Database, ExternalLink, Clock } from "lucide-react";
import { ModuleHeader, SectionLabel } from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import { getModuleSources } from "@/lib/constants/state-config";

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

const statusStyle = (status: string) => status === "live"
  ? { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0", text: "LIVE" }
  : { bg: "#F9F9F7", color: "#6B6B6B", border: "#E8E8E4", text: "STATIC" };

const typeColor: Record<string, string> = {
  "API": "#2563EB", "Collected": "#7C3AED", "Aggregated": "#7C3AED",
  "PDF Parse": "#D97706", "Static": "#6B7280", "RSS": "#0891B2", "Manual": "#9B9B9B",
};

export default function DataSourcesPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;

  const DATA_SOURCES = getDataSources(state);
  const liveCount = DATA_SOURCES.filter((s) => s.status === "live").length;
  const apiCount = DATA_SOURCES.filter((s) => s.type === "API").length;

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={Database} title="Data Sources" description="Transparency: every data point's source, method, and update frequency" backHref={base} />
      {(() => { const _src = getModuleSources("data-sources", state); return <DataSourceBanner moduleName="data-sources" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="data-sources" district={district} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
        <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono)", color: "#16A34A" }}>{liveCount}</div>
          <div style={{ fontSize: 12, color: "#9B9B9B" }}>Live Sources</div>
        </div>
        <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono)", color: "#2563EB" }}>{apiCount}</div>
          <div style={{ fontSize: 12, color: "#9B9B9B" }}>Official APIs</div>
        </div>
        <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono)", color: "#1A1A1A" }}>{DATA_SOURCES.length}</div>
          <div style={{ fontSize: 12, color: "#9B9B9B" }}>Data Modules</div>
        </div>
      </div>

      {/* Mission statement */}
      <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1E40AF", marginBottom: 4 }}>Our Data Pledge</div>
        <div style={{ fontSize: 13, color: "#1D4ED8", lineHeight: 1.6 }}>
          All data on ForThePeople.in is sourced exclusively from government portals, official APIs, and publicly available documents.
          We never fabricate data. Each module clearly links to its source. Live modules auto-refresh every 60 seconds.
        </div>
      </div>

      <SectionLabel>Module Data Sources</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {DATA_SOURCES.map((ds) => {
          const ss = statusStyle(ds.status);
          const tc = typeColor[ds.type] ?? "#6B7280";
          return (
            <div key={ds.module} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{ds.module}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 8, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>
                      {ss.text}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 8, background: `${tc}15`, color: tc }}>
                      {ds.type}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#6B6B6B" }}>
                    Source: <span style={{ fontWeight: 500 }}>{ds.source}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#9B9B9B" }}>
                    <Clock size={10} /> {ds.frequency}
                  </div>
                  {ds.url && (
                    <a href={ds.url} target="_blank" rel="noopener noreferrer" style={{
                      display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#2563EB", textDecoration: "none",
                    }}>
                      Source <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
