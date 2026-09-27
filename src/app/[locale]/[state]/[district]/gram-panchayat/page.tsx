/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Gram Panchayat module page — Design v4 "Rang" module recipe
// (docs/DESIGN-SYSTEM.md §4):
//   PageHeader → summary → AI insight → emoji StatStrip → picture row
//   (funds in plain words + coins + a "funds used" dial) → second picture
//   row (drinking-water coverage bands, and the panchayats that have used
//   the least of their funds) → searchable panchayat cards → honest
//   EmptyState (urban districts get the municipal body instead) → sources
//   + Share/Compare. Data: usePanchayats().
//
//   Every word comes from the "page_gram-panchayat" messages; numbers go
//   through useFormat(). Panchayat names are data: the local-script name
//   leads when it is in the reader's language.

"use client";
import type React from "react";
import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { Building2, Search } from "lucide-react";
import { usePanchayats } from "@/hooks/useRealtimeData";
import type { GramPanchayat } from "@/hooks/useRealtimeData";
import { useFormat, useModuleText } from "@/i18n/client";
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
import { ChartCard, Explainer, Gauge, Pictogram } from "@/components/district/visuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import { HueBarList, HueDonut, MiniRing, namePair, useDistrictName } from "@/components/land-water/visuals";
import type { DonutSlice } from "@/components/land-water/visuals";
import { getStateConfig } from "@/lib/constants/state-config";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

/** Page wrapper: the v3 container (24 px sides, 16 on phones) at reading width. */
const PAGE_STYLE: React.CSSProperties = { paddingTop: 24, paddingBottom: 32, maxWidth: "var(--ftp-reading-max)" };

/** Bold runs inside translated sentences (<b>…</b> in the messages). */
const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

/** Drinking-water coverage bands for the donut, highest first. */
const WATER_BANDS: Array<{ key: "full" | "most" | "half" | "low"; min: number; emoji: string }> = [
  { key: "full", min: 100, emoji: "🚰" },
  { key: "most", min: 75, emoji: "💧" },
  { key: "half", min: 50, emoji: "🪣" },
  { key: "low", min: 0, emoji: "🏜️" },
];

/** How many panchayats the "used the least" bars show. */
const LEAST_MAX = 5;

/** A small label + number pair inside a panchayat card. */
function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="ftp-label">{label}</div>
      <div className="ftp-num" style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>
        {value}
      </div>
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
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 4 }}>
        {body}
      </p>
    </Card>
  );
}

export default function GramPanchayatPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_gram-panchayat");
  const f = useFormat();
  const mt = useModuleText();
  const base = `/${locale}/${state}/${district}`;
  const districtName = useDistrictName(state, district);
  const { data, isLoading, error } = usePanchayats(district, state);
  const [search, setSearch] = useState("");

  /** Rupees → "₹12.3L" / "₹12.3 ಲಕ್ಷ" (1 lakh = ₹1,00,000). Amounts are stored in rupees. */
  const lakh = (rupees: number) => t("lakh", { n: f.number(rupees / 100000, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) });
  const pct = (n: number) => f.number(n / 100, { style: "percent", maximumFractionDigits: 0 });
  const shownName = (g: GramPanchayat) => namePair(g.name, g.nameLocal, locale);

  const gps = data?.data ?? [];
  const lastUpdated = data?.meta?.lastUpdated ?? null;
  const q = search.trim().toLowerCase();
  const filtered = q ? gps.filter((g) => g.name.toLowerCase().includes(q) || (g.nameLocal ?? "").toLowerCase().includes(q)) : gps;

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

  // Picture 2a: panchayats grouped by how many homes have drinking water.
  const withWater = gps.filter((g) => g.waterCoverage !== null && g.waterCoverage !== undefined);
  const waterSlices: DonutSlice[] = WATER_BANDS.map((band, i) => {
    const upper = i === 0 ? Infinity : WATER_BANDS[i - 1].min;
    const n = withWater.filter((g) => (g.waterCoverage as number) >= band.min && (g.waterCoverage as number) < upper).length;
    return { key: band.key, label: t(`waterBand.${band.key}`), value: n, emoji: band.emoji };
  });
  const showWater = withWater.length >= 3;
  const fullWater = waterSlices[0].value;

  // Picture 2b: the panchayats that have used the smallest share of their
  // funds. Only panchayats with both figures reported are ranked.
  const ranked = gps
    .filter((g) => (g.totalFunds ?? 0) > 0 && g.fundsUtilized !== null && g.fundsUtilized !== undefined)
    .map((g) => ({ g, used: ((g.fundsUtilized as number) / (g.totalFunds as number)) * 100 }))
    .sort((a, b) => a.used - b.used);
  const showLeast = ranked.length >= 4;
  const least = ranked.slice(0, LEAST_MAX);

  // Urban districts have no Gram Panchayats — show who governs instead.
  const sc = getStateConfig(state);
  const isUrbanDistrict = !!sc && !sc.gramPanchayatApplicable;

  return (
    <div className="ftp-container" style={PAGE_STYLE}>
      <PageHeader
        icon={Building2}
        title={mt.label("gram-panchayat")}
        description={t("description")}
        backHref={base}
        accent={getModuleAccent("gram-panchayat")}
        freshness={lastUpdated ? { asOf: lastUpdated } : undefined}
        source={{ label: "eGramSwaraj", href: "https://egramswaraj.gov.in" }}
      />

      {/* Plain-language summary — also what search engines and AI crawlers read. */}
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "0 0 16px", maxWidth: 720 }}>
        {t("summary")}
      </p>

      <AIInsightCard module="gram-panchayat" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {/* No rows: urban district with a municipal body → who governs instead. */}
      {!isLoading && !error && gps.length === 0 && isUrbanDistrict && sc?.municipalBody && (
        <>
          <EmptyState emoji="🏙️" title={t("urbanTitle")} body={t("urbanBody", { district: districtName })} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))", gap: 12, marginTop: 12 }}>
            <GovernedByCard
              emoji="🏛️"
              label={t("municipalBody")}
              name={sc.municipalBody}
              body={t("municipalBodyText", { district: districtName })}
            />
            {sc.waterBoard && <GovernedByCard emoji="🚰" label={t("waterSupply")} name={sc.waterBoard} body={t("waterSupplyText")} />}
          </div>
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 12 }}>
            {t("urbanSource")}
          </p>
        </>
      )}
      {!isLoading &&
        !error &&
        gps.length === 0 &&
        !(isUrbanDistrict && sc?.municipalBody) &&
        (isUrbanDistrict ? (
          <EmptyState emoji="🏙️" title={t("urbanNaTitle")} body={t("urbanBody", { district: districtName })} />
        ) : (
          <EmptyState emoji="🏘️" title={t("emptyTitle", { district: districtName })} body={t("emptyBody")} />
        ))}

      {!isLoading && gps.length > 0 && (
        <>
          <StatStrip cols={3}>
            <StatTile emoji="🏘️" label={t("tileGps")} value={f.number(gps.length)} />
            <StatTile emoji="👥" label={t("tilePopulation")} value={totalPop > 0 ? f.number(totalPop) : "—"} />
            <StatTile emoji="🏠" label={t("tileHouseholds")} value={totalHH > 0 ? f.number(totalHH) : "—"} />
            <StatTile
              emoji="🛣️"
              label={t("tileRoad")}
              value={hasRoadData ? `${f.number(roadConnected)}/${f.number(gps.length)}` : "—"}
              countUp={false}
            />
            <StatTile emoji="🛠️" label={t("tileMgnrega")} value={hasMgnregaData ? f.number(totalMgnrega) : "—"} />
            <StatTile
              emoji="💰"
              label={t("tileFunds")}
              value={totalFunds > 0 ? (totalUtilized > 0 ? f.number(Math.round(overallUtilPct)) : t("pending")) : "—"}
              unit={totalFunds > 0 && totalUtilized > 0 ? "%" : undefined}
            />
          </StatStrip>

          {/* Funds overview — the picture: one plain sentence, ten coins lit
              for the share used, and a dial. Same totals as the tile above. */}
          {totalFunds > 0 && (
            <Section title={t("fundsTitle")} emoji="💰">
              {totalUtilized > 0 ? (
                <div className="ftp-picture-row">
                  <Card tinted padding={18}>
                    <Explainer emoji="🪙">
                      {t.rich("fundsExplainer", { b: bold, n: gps.length, used: f.number(Math.round(overallUtilPct)) })}
                      {hasRoadData && <> {t.rich("fundsRoad", { b: bold, n: roadConnected, total: gps.length })}</>}
                    </Explainer>
                    <Pictogram filled={overallUtilPct / 10} emoji="💰" label={t("fundsCoins", { n: Math.round(overallUtilPct / 10) })} />
                  </Card>
                  <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Gauge
                      value={overallUtilPct}
                      label={t("gaugeLabel")}
                      caption={t("gaugeCaption", { used: lakh(totalUtilized), given: lakh(totalFunds) })}
                    />
                  </Card>
                </div>
              ) : (
                <Card tinted>
                  <p className="ftp-body" style={{ margin: 0 }}>
                    {t.rich("fundsNoSpend", {
                      amount: lakh(totalFunds),
                      n: gps.length,
                      num: (c) => (
                        <span className="ftp-num" style={{ color: "var(--hue-deep)" }}>
                          {c}
                        </span>
                      ),
                    })}
                  </p>
                </Card>
              )}
            </Section>
          )}

          {/* Second picture row: drinking water at home, and the panchayats
              that have used the smallest share of their funds. */}
          {(showWater || showLeast) && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
                gap: 12,
                marginTop: 20,
              }}
            >
              {showWater && (
                <ChartCard
                  title={t("waterTitle")}
                  emoji="🚰"
                  units={t("waterUnits")}
                  simple={t.rich("waterSimple", { b: bold, n: fullWater, total: withWater.length })}
                  source={{ label: "eGramSwaraj", href: "https://egramswaraj.gov.in" }}
                  asOf={lastUpdated}
                  table={waterSlices.map((s) => ({ label: s.label, value: f.number(s.value) }))}
                >
                  <div style={{ marginTop: 14 }}>
                    <HueDonut
                      slices={waterSlices}
                      centerValue={f.number(withWater.length)}
                      centerLabel={t("waterCenter", { n: withWater.length })}
                      ariaLabel={t("waterAria", {
                        list: new Intl.ListFormat(f.intl, { style: "long", type: "conjunction" }).format(
                          waterSlices.map((s) => t("waterAriaItem", { band: s.label, n: s.value })),
                        ),
                      })}
                    />
                  </div>
                </ChartCard>
              )}
              {showLeast && (
                <ChartCard
                  title={t("leastTitle")}
                  emoji="🔍"
                  units={t("leastUnits")}
                  simple={t.rich("leastSimple", { b: bold, name: shownName(least[0].g).primary, used: pct(least[0].used) })}
                  source={{ label: "eGramSwaraj", href: "https://egramswaraj.gov.in" }}
                  asOf={lastUpdated}
                  table={ranked.map(({ g, used }) => ({
                    label: shownName(g).primary,
                    value: t("leastRow", { used: pct(used), spent: lakh(g.fundsUtilized ?? 0), given: lakh(g.totalFunds ?? 0) }),
                  }))}
                >
                  <div style={{ marginTop: 12 }}>
                    <HueBarList
                      max={100}
                      rows={least.map(({ g, used }) => {
                        const n = shownName(g);
                        return {
                          key: g.id,
                          label: n.primary,
                          labelLang: n.primaryLang,
                          emoji: "🏘️",
                          value: used,
                          display: pct(used),
                          sub: t("leastSub", { spent: lakh(g.fundsUtilized ?? 0), given: lakh(g.totalFunds ?? 0) }),
                        };
                      })}
                    />
                  </div>
                </ChartCard>
              )}
            </div>
          )}

          <Section title={t("allTitle")} emoji="🏘️">
            {/* Search — 44 px tall so it is easy to tap on phones. */}
            <label style={{ position: "relative", display: "block", marginBottom: 16 }}>
              <span className="sr-only">{t("searchLabel")}</span>
              <Search size={16} aria-hidden style={{ position: "absolute", insetInlineStart: 12, top: 14, color: "var(--hue)" }} />
              <input
                type="search"
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 44,
                  paddingBlock: 0,
                  paddingInline: "36px 14px",
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

            {filtered.length === 0 && <EmptyState emoji="🔍" title={t("noMatch", { q: search })} />}

            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))",
                gap: 12,
              }}
            >
              {filtered.map((g) => {
                const utilPct = g.totalFunds && g.fundsUtilized ? (g.fundsUtilized / g.totalFunds) * 100 : 0;
                const n = shownName(g);
                const hasWater = g.waterCoverage !== null && g.waterCoverage !== undefined;
                return (
                  <Card as="li" key={g.id} padding={14}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", minWidth: 0 }}>
                        <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 32, height: 32, fontSize: 17, borderRadius: 10 }}>
                          🏘️
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <h3 className="ftp-title" lang={n.primaryLang}>
                            {n.primary}
                          </h3>
                          {n.secondary && (
                            <div lang={n.secondaryLang} style={{ fontSize: 13, lineHeight: "20px", color: "var(--hue-deep)" }}>
                              {n.secondary}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Only when we actually know — unknown is not "No road". */}
                      {g.roadConnected != null && (
                        <Pill tone={g.roadConnected ? "live" : "danger"} dot>
                          {g.roadConnected ? t("roadYes") : t("roadNo")}
                        </Pill>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                      {hasWater && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <MiniRing pct={g.waterCoverage as number} label={t("waterRingAria", { pct: pct(g.waterCoverage as number) })} />
                          <span className="ftp-label" style={{ maxWidth: 80 }}>
                            {t("waterCoverage")}
                          </span>
                        </div>
                      )}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flex: 1, minWidth: 0 }}>
                        {g.population ? <MiniStat label={t("population")} value={f.number(g.population)} /> : null}
                        {g.households ? <MiniStat label={t("households")} value={f.number(g.households)} /> : null}
                        {g.mgnregaWorks !== null && g.mgnregaWorks !== undefined && (
                          <MiniStat label={t("mgnregaWorks")} value={f.number(g.mgnregaWorks)} />
                        )}
                      </div>
                    </div>
                    {g.totalFunds && (g.fundsUtilized === null || g.fundsUtilized === undefined) ? (
                      // Funds given but no spending figure: say so, never draw a 0 % bar.
                      <p style={{ margin: 0, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                        {t("fundsNotReported", { given: lakh(g.totalFunds) })}
                      </p>
                    ) : g.totalFunds ? (
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 12,
                            lineHeight: "16px",
                            color: "var(--ftp-text-2)",
                            marginBottom: 4,
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{t("funds")}</span>
                          <span className="ftp-num" style={{ color: "var(--hue-deep)" }}>
                            {t("fundsUsedPct", { pct: pct(utilPct) })}
                          </span>
                        </div>
                        <ProgressBar pct={utilPct} />
                        <div className="ftp-num" style={{ fontSize: 12, lineHeight: "16px", fontWeight: 500, color: "var(--ftp-text-2)", marginTop: 4 }}>
                          {t("leastSub", { spent: lakh(g.fundsUtilized ?? 0), given: lakh(g.totalFunds) })}
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
