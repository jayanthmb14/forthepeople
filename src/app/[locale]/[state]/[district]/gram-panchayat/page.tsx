/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Gram Panchayat module page — Design v3 "Civic Ledger" module template:
//   PageHeader → AI summary → StatStrip → fund utilisation → searchable
//   panchayat cards → honest EmptyState (urban districts get the municipal
//   body instead) → sources + Share/Compare. Data: usePanchayats().

"use client";
import type React from "react";
import { use, useState } from "react";
import { Building2, Search, Landmark, Droplets } from "lucide-react";
import { usePanchayats } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  Pill,
  ProgressBar,
  LoadingShell,
  ErrorBlock,
  EmptyState,
} from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import { getStateConfig } from "@/lib/constants/state-config";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { getDistrict } from "@/lib/constants/districts";

/** Page wrapper: the v3 container (24 px sides, 16 on phones) at reading width. */
const PAGE_STYLE: React.CSSProperties = { paddingTop: 24, paddingBottom: 32, maxWidth: "var(--ftp-reading-max)" };

/** A small label + mono value pair inside a panchayat card. */
function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="ftp-label">{label}</div>
      <div className="ftp-num" style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>{value}</div>
    </div>
  );
}

export default function GramPanchayatPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const districtName = getDistrict(state, district)?.name ?? district.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const { data, isLoading, error } = usePanchayats(district, state);
  const [search, setSearch] = useState("");

  const gps = data?.data ?? [];
  const lastUpdated = data?.meta?.lastUpdated ?? null;
  const filtered = search ? gps.filter((g) => g.name.toLowerCase().includes(search.toLowerCase())) : gps;

  const totalPop = gps.reduce((s, g) => s + (g.population ?? 0), 0);
  const totalHH = gps.reduce((s, g) => s + (g.households ?? 0), 0);
  const totalFunds = gps.reduce((s, g) => s + (g.totalFunds ?? 0), 0);
  const totalUtilized = gps.reduce((s, g) => s + (g.fundsUtilized ?? 0), 0);
  const overallUtilPct = totalFunds > 0 ? (totalUtilized / totalFunds) * 100 : 0;
  const roadConnected = gps.filter((g) => g.roadConnected).length;
  const totalMgnrega = gps.reduce((s, g) => s + (g.mgnregaWorks ?? 0), 0);

  // Urban districts have no Gram Panchayats — show who governs instead.
  const sc = getStateConfig(state);
  const isUrbanDistrict = !!sc && !sc.gramPanchayatApplicable;

  return (
    <div className="ftp-container" style={PAGE_STYLE}>
      <PageHeader
        icon={Building2}
        title="Gram Panchayats"
        description="Panchayat-level data on population, water, MGNREGA, and funds"
        backHref={base}
        accent={getModuleAccent("gram-panchayat")}
        freshness={lastUpdated ? { asOf: lastUpdated } : undefined}
        source={{ label: "eGramSwaraj", href: "https://egramswaraj.gov.in" }}
      />
      <AIInsightCard module="gram-panchayat" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {/* No rows: urban district with a municipal body → who governs instead. */}
      {!isLoading && !error && gps.length === 0 && isUrbanDistrict && sc?.municipalBody && (
        <>
          <EmptyState
            title="Municipal Governance"
            body={`${districtName} is a fully urban district governed by a Municipal Corporation. Gram Panchayat and MGNREGA data applies only to rural areas.`}
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))", gap: 12, marginTop: 12 }}>
            <Card>
              <div className="ftp-label" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <Landmark size={13} aria-hidden /> Municipal Body
              </div>
              <div className="ftp-title">{sc.municipalBody}</div>
              <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 4 }}>
                Responsible for urban governance, civic amenities, and infrastructure in {districtName}
              </p>
            </Card>
            {sc.waterBoard && (
              <Card>
                <div className="ftp-label" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Droplets size={13} aria-hidden /> Water Supply
                </div>
                <div className="ftp-title">{sc.waterBoard}</div>
                <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 4 }}>Municipal water supply and sewerage management</p>
              </Card>
            )}
          </div>
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 12 }}>
            Data sourced from District NIC Portal and Municipal Corporation website.
          </p>
        </>
      )}
      {!isLoading && !error && gps.length === 0 && !(isUrbanDistrict && sc?.municipalBody) && (
        isUrbanDistrict ? (
          <EmptyState
            title="Not applicable for urban districts"
            body={`${districtName} is a fully urban district governed by a Municipal Corporation. Gram Panchayat and MGNREGA data applies only to rural areas.`}
          />
        ) : (
          <EmptyState
            title={`No panchayat data yet for ${districtName}.`}
            body="We are collecting village-level MGNREGA works and fund utilisation data from eGramSwaraj."
          />
        )
      )}

      {!isLoading && gps.length > 0 && (
        <>
          <StatStrip cols={3}>
            <StatTile label="Gram Panchayats" value={gps.length} icon={Building2} />
            <StatTile label="Population" value={totalPop > 0 ? `${(totalPop / 1000).toFixed(0)}` : "—"} unit={totalPop > 0 ? "K" : undefined} />
            <StatTile label="Households" value={totalHH > 0 ? `${(totalHH / 1000).toFixed(0)}` : "—"} unit={totalHH > 0 ? "K" : undefined} />
            <StatTile label="Road connected" value={`${roadConnected}/${gps.length}`} />
            <StatTile label="MGNREGA works" value={totalMgnrega.toLocaleString("en-IN")} />
            <StatTile label="Fund utilisation" value={overallUtilPct.toFixed(0)} unit="%" />
          </StatStrip>

          {/* Funds overview */}
          {totalFunds > 0 && (
            <Section title="Overall Fund Utilization">
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                  <span className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>Funds utilised across all panchayats</span>
                  <span className="ftp-num" style={{ fontSize: 15, color: "var(--ftp-text)" }}>{overallUtilPct.toFixed(1)}%</span>
                </div>
                <ProgressBar pct={overallUtilPct} />
                <div className="ftp-num" style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: 6, fontSize: 11, color: "var(--ftp-text-2)" }}>
                  <span>₹{(totalUtilized / 100000).toFixed(1)}L utilized</span>
                  <span>₹{(totalFunds / 100000).toFixed(1)}L allocated</span>
                </div>
              </Card>
            </Section>
          )}

          <Section title="All Panchayats">
            {/* Search — 44 px tall so it is easy to tap on phones. */}
            <label style={{ position: "relative", display: "block", marginBottom: 16 }}>
              <span className="sr-only">Search gram panchayat</span>
              <Search size={16} aria-hidden style={{ position: "absolute", left: 12, top: 14, color: "var(--ftp-text-2)" }} />
              <input
                type="search"
                placeholder="Search gram panchayat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 44,
                  padding: "0 14px 0 36px",
                  borderRadius: "var(--ftp-radius-tile)",
                  border: "1px solid var(--ftp-border)",
                  fontSize: 13,
                  fontFamily: "var(--ftp-font-sans)",
                  background: "var(--ftp-surface)",
                  color: "var(--ftp-text)",
                  boxSizing: "border-box",
                }}
              />
            </label>

            {filtered.length === 0 && <EmptyState title={`No panchayat matches "${search}".`} />}

            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))", gap: 12 }}>
              {filtered.map((g) => {
                const utilPct = g.totalFunds && g.fundsUtilized ? (g.fundsUtilized / g.totalFunds) * 100 : 0;
                return (
                  <Card as="li" key={g.id} padding={14}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <h3 className="ftp-title">{g.name}</h3>
                        {g.nameLocal && <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", fontFamily: "var(--font-regional)" }}>{g.nameLocal}</div>}
                      </div>
                      {/* Only when we actually know — unknown is not "No Road". */}
                      {g.roadConnected != null && (
                        <Pill tone={g.roadConnected ? "live" : "danger"} dot>
                          {g.roadConnected ? "Road connected" : "No Road"}
                        </Pill>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                      {g.population ? <MiniStat label="Population" value={g.population.toLocaleString("en-IN")} /> : null}
                      {g.households ? <MiniStat label="Households" value={g.households.toLocaleString("en-IN")} /> : null}
                      {g.waterCoverage !== null && g.waterCoverage !== undefined && <MiniStat label="Water Coverage" value={`${g.waterCoverage.toFixed(0)}%`} />}
                      {g.mgnregaWorks !== null && g.mgnregaWorks !== undefined && <MiniStat label="MGNREGA Works" value={g.mgnregaWorks} />}
                    </div>
                    {g.totalFunds ? (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginBottom: 4 }}>
                          <span>Funds</span>
                          <span className="ftp-num">{utilPct.toFixed(0)}% utilized</span>
                        </div>
                        <ProgressBar pct={utilPct} />
                        <div className="ftp-num" style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 4 }}>
                          ₹{((g.fundsUtilized ?? 0) / 100000).toFixed(1)}L / ₹{(g.totalFunds / 100000).toFixed(1)}L
                        </div>
                      </div>
                    ) : null}
                  </Card>
                );
              })}
            </ul>
          </Section>
        </>
      )}

      <ModulePageFooter
        moduleSlug="gram-panchayat"
        locale={locale}
        state={state}
        district={district}
        sourceUrls={{ eGramSwaraj: "https://egramswaraj.gov.in", "NREGA.nic.in": "https://nrega.nic.in" }}
      />
    </div>
  );
}
