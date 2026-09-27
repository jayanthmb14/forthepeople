/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Gram Panchayat module page — Design v4 "Rang" module recipe
// (docs/DESIGN-SYSTEM.md §4):
//   PageHeader → summary → AI insight → emoji StatStrip → picture row
//   (funds in plain words + coins + a "funds used" dial) → searchable
//   panchayat cards → honest EmptyState (urban districts get the municipal
//   body instead) → sources + Share/Compare. Data: usePanchayats().

"use client";
import type React from "react";
import { use, useState } from "react";
import { Building2, Search } from "lucide-react";
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
import { Explainer, Gauge, Pictogram } from "@/components/district/visuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import { getStateConfig } from "@/lib/constants/state-config";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { getDistrict } from "@/lib/constants/districts";

/** Page wrapper: the v3 container (24 px sides, 16 on phones) at reading width. */
const PAGE_STYLE: React.CSSProperties = { paddingTop: 24, paddingBottom: 32, maxWidth: "var(--ftp-reading-max)" };

/** Rupees → "₹12.3L" (1 lakh = ₹1,00,000). Amounts are stored in rupees. */
const lakh = (rupees: number) => `₹${(rupees / 100000).toFixed(1)}L`;

/** A small label + number pair inside a panchayat card. */
function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="ftp-label">{label}</div>
      <div className="ftp-num" style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>{value}</div>
    </div>
  );
}

/** A card naming who governs an urban district (municipal body, water board). */
function GovernedByCard({ emoji, label, name, body }: { emoji: string; label: string; name: string; body: string }) {
  return (
    <Card tinted>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 28, height: 28, fontSize: 16, borderRadius: 9 }}>
          {emoji}
        </span>
        <span className="ftp-label">{label}</span>
      </div>
      <div className="ftp-title">{name}</div>
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 4 }}>{body}</p>
    </Card>
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
  // Which figures were reported at all — a missing figure shows "—", never a fake zero.
  const hasRoadData = gps.some((g) => g.roadConnected != null);
  const hasMgnregaData = gps.some((g) => g.mgnregaWorks != null);

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

      {/* Plain-language summary — also what search engines and AI crawlers read. */}
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "0 0 16px", maxWidth: 720 }}>
        This page shows village-level data for the gram panchayats in this district: population, households, drinking
        water coverage, road connectivity, MGNREGA works, and the funds each panchayat received and used, from
        eGramSwaraj and NREGA.nic.in. Amounts are shown in lakh rupees (1 lakh = ₹1,00,000).
      </p>

      <AIInsightCard module="gram-panchayat" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {/* No rows: urban district with a municipal body → who governs instead. */}
      {!isLoading && !error && gps.length === 0 && isUrbanDistrict && sc?.municipalBody && (
        <>
          <EmptyState
            emoji="🏙️"
            title="Municipal governance"
            body={`${districtName} is a fully urban district governed by a Municipal Corporation. Gram Panchayat and MGNREGA data applies only to rural areas.`}
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))", gap: 12, marginTop: 12 }}>
            <GovernedByCard
              emoji="🏛️"
              label="Municipal body"
              name={sc.municipalBody}
              body={`Responsible for urban governance, civic amenities, and infrastructure in ${districtName}`}
            />
            {sc.waterBoard && (
              <GovernedByCard emoji="🚰" label="Water supply" name={sc.waterBoard} body="Municipal water supply and sewerage management" />
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
            emoji="🏙️"
            title="Not applicable for urban districts"
            body={`${districtName} is a fully urban district governed by a Municipal Corporation. Gram Panchayat and MGNREGA data applies only to rural areas.`}
          />
        ) : (
          <EmptyState
            emoji="🏘️"
            title={`No panchayat data yet for ${districtName}.`}
            body="We are collecting village-level MGNREGA works and fund utilisation data from eGramSwaraj."
          />
        )
      )}

      {!isLoading && gps.length > 0 && (
        <>
          <StatStrip cols={3}>
            <StatTile emoji="🏘️" label="Gram Panchayats" value={gps.length} />
            <StatTile emoji="👥" label="Population" value={totalPop > 0 ? `${(totalPop / 1000).toFixed(0)}` : "—"} unit={totalPop > 0 ? "K" : undefined} />
            <StatTile emoji="🏠" label="Households" value={totalHH > 0 ? `${(totalHH / 1000).toFixed(0)}` : "—"} unit={totalHH > 0 ? "K" : undefined} />
            <StatTile emoji="🛣️" label="Road connected" value={hasRoadData ? `${roadConnected}/${gps.length}` : "—"} countUp={false} />
            <StatTile emoji="🛠️" label="MGNREGA works" value={hasMgnregaData ? totalMgnrega.toLocaleString("en-IN") : "—"} />
            <StatTile
              emoji="💰"
              label="Fund utilisation"
              value={totalFunds > 0 ? (totalUtilized > 0 ? overallUtilPct.toFixed(0) : "Pending") : "—"}
              unit={totalFunds > 0 && totalUtilized > 0 ? "%" : undefined}
            />
          </StatStrip>

          {/* Funds overview — the picture: one plain sentence, ten coins lit
              for the share used, and a dial. Same totals as the tile above. */}
          {totalFunds > 0 && (
            <Section title="Funds given and used" emoji="💰">
              {totalUtilized > 0 ? (
                <div className="ftp-picture-row">
                  <Card tinted padding={18}>
                    <Explainer title="In simple words" emoji="🪙">
                      Out of every <strong>₹100</strong> given to the {gps.length} gram panchayats, about{" "}
                      <strong>₹{Math.round(overallUtilPct)}</strong> has been used.
                      {hasRoadData && (
                        <>
                          {" "}
                          <strong>{roadConnected}</strong> of {gps.length} panchayats are marked as connected by road.
                        </>
                      )}
                    </Explainer>
                    <Pictogram
                      filled={overallUtilPct / 10}
                      emoji="💰"
                      label={`About ${Math.round(overallUtilPct / 10)} of every 10 rupees given have been used.`}
                    />
                  </Card>
                  <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Gauge
                      value={overallUtilPct}
                      label="Funds used"
                      caption={`${lakh(totalUtilized)} used of ${lakh(totalFunds)} given`}
                    />
                  </Card>
                </div>
              ) : (
                <Card tinted>
                  <p className="ftp-body" style={{ margin: 0 }}>
                    <span className="ftp-num" style={{ color: "var(--hue-deep)" }}>{lakh(totalFunds)}</span> is listed as given to the{" "}
                    {gps.length} gram panchayats. No spending has been reported yet, so we cannot show how much was used.
                  </p>
                </Card>
              )}
            </Section>
          )}

          <Section title="All panchayats" emoji="🏘️">
            {/* Search — 44 px tall so it is easy to tap on phones. */}
            <label style={{ position: "relative", display: "block", marginBottom: 16 }}>
              <span className="sr-only">Search gram panchayat</span>
              <Search size={16} aria-hidden style={{ position: "absolute", left: 12, top: 14, color: "var(--hue)" }} />
              <input
                type="search"
                placeholder="Search by panchayat name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 44,
                  padding: "0 14px 0 36px",
                  borderRadius: "var(--ftp-radius-tile)",
                  border: "1px solid color-mix(in srgb, var(--hue) 28%, var(--ftp-border))",
                  fontSize: 14,
                  fontFamily: "var(--ftp-font-sans)",
                  background: "var(--ftp-surface)",
                  color: "var(--ftp-text)",
                  boxSizing: "border-box",
                }}
              />
            </label>

            {filtered.length === 0 && <EmptyState emoji="🔍" title={`No panchayat matches "${search}".`} />}

            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))", gap: 12 }}>
              {filtered.map((g) => {
                const utilPct = g.totalFunds && g.fundsUtilized ? (g.fundsUtilized / g.totalFunds) * 100 : 0;
                return (
                  <Card as="li" key={g.id} padding={14}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <h3 className="ftp-title">{g.name}</h3>
                        {g.nameLocal && <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--hue-deep)", fontFamily: "var(--font-regional)" }}>{g.nameLocal}</div>}
                      </div>
                      {/* Only when we actually know — unknown is not "No road". */}
                      {g.roadConnected != null && (
                        <Pill tone={g.roadConnected ? "live" : "danger"} dot>
                          {g.roadConnected ? "Road connected" : "No road"}
                        </Pill>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                      {g.population ? <MiniStat label="Population" value={g.population.toLocaleString("en-IN")} /> : null}
                      {g.households ? <MiniStat label="Households" value={g.households.toLocaleString("en-IN")} /> : null}
                      {g.waterCoverage !== null && g.waterCoverage !== undefined && <MiniStat label="Water coverage" value={`${g.waterCoverage.toFixed(0)}%`} />}
                      {g.mgnregaWorks !== null && g.mgnregaWorks !== undefined && <MiniStat label="MGNREGA works" value={g.mgnregaWorks} />}
                    </div>
                    {g.totalFunds ? (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", marginBottom: 4 }}>
                          <span style={{ fontWeight: 600 }}>Funds</span>
                          <span className="ftp-num" style={{ color: "var(--hue-deep)" }}>{utilPct.toFixed(0)}% used</span>
                        </div>
                        <ProgressBar pct={utilPct} />
                        <div className="ftp-num" style={{ fontSize: 12, lineHeight: "16px", fontWeight: 500, color: "var(--ftp-text-2)", marginTop: 4 }}>
                          {lakh(g.fundsUtilized ?? 0)} used of {lakh(g.totalFunds)}
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
