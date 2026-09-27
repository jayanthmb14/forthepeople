/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Village councils (gram panchayats) — layout v4.1 (docs/LAYOUT.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  The question: "Who runs my village, and what happened to its money?"
//  The answer, in one line: "Mandya has 4 gram panchayats (village
//  councils). Out of every ₹100 given to them, about ₹85 has been used."
//
//    PageHeader → Explainer → 4 StatTiles → picture: ten coin icons, lit
//    for the share of money used, with given / used / not used yet → one
//    card per panchayat, searchable and filterable by taluk (tap →
//    PanchayatSheet: funds dial, drinking water ring, every figure,
//    eGramSwaraj + NREGA links) → AI insight → charts (drinking water ·
//    least of their funds used) → Share / Compare. Urban districts (from
//    the per-district config, so Pune is not treated like Mumbai) get
//    their municipal body instead of an empty page. Sources, the "not an
//    official website" line, "report a mistake" and the "N days old" note
//    live in the district shell (verification panel, stale notice), not
//    here (v5: no repetition, no emoji except the module's own in the
//    header).
//
//  Data: usePanchayats() (every column of the district's GramPanchayat
//  rows — none are sent until a checked source writes them; the seeded
//  rows are hidden by the API — plus `snapshot`, the district's MGNREGA
//  figures from the NREGA collector, shown by MgnregaSnapshot) and
//  useOverview() for taluk names. Amounts are whole rupees and
//  shown in lakh / crore. Every word comes from "page_gram-panchayat";
//  numbers through useFormat(). Panchayat names are data: the local-script
//  name leads when it is in the reader's language.
"use client";

import type React from "react";
import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { Building, Building2, Coins, Droplets, Hammer, Home, Search, Users, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useOverview, usePanchayats } from "@/hooks/useRealtimeData";
import { useFormat, useModuleText } from "@/i18n/client";
import {
  ModulePage,
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  Chips,
  ProgressBar,
  LoadingShell,
  ErrorBlock,
  EmptyState,
} from "@/components/district/ui";
import { ChartCard, Explainer } from "@/components/district/visuals";
import { IconPictogram } from "@/components/district/calm-parts";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { HueBarList, HueDonut, namePair, useDistrictName } from "@/components/land-water/visuals";
import type { DonutSlice } from "@/components/land-water/visuals";
import { fitGrid, Chip, TapCard, TapHint } from "@/components/land-water/cards";
import { EGRAMSWARAJ, PanchayatSheet, type PanchayatRow } from "@/components/land-water/PanchayatSheet";
import MoneyToolbar from "@/components/money/MoneyToolbar";
import MgnregaSnapshot from "@/components/land-water/MgnregaSnapshot";
import type { DistrictSnapshot } from "@/scraper/lib/district-snapshot";
import type { NregaSnapshotData } from "@/scraper/lib/nrega";
import { getStateConfig } from "@/lib/constants/state-config";
import { scriptLang } from "@/lib/utils/script-lang";

/** Bold runs inside translated sentences (<b>…</b> in the messages). */
const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

/** Drinking-water coverage bands for the donut, highest first. */
const WATER_BANDS: Array<{ key: "full" | "most" | "half" | "low"; min: number }> = [
  { key: "full", min: 100 },
  { key: "most", min: 75 },
  { key: "half", min: 50 },
  { key: "low", min: 0 },
];
/** eGramSwaraj publishes monthly; older records count as late (header colour). */
const MAX_AGE_DAYS = 90;
/** The MGNREGA collector runs daily; older than this counts as late. */
const NREGA_MAX_AGE_HOURS = 72;

/** How many panchayats the "used the least" bars show. */
const LEAST_MAX = 5;
/** Show the search box when there are more cards than this. */
const SEARCH_FROM = 8;

/** A card naming who governs an urban district (municipal body, water board). */
function GovernedByCard({ icon: Icon, label, name, body }: { icon: LucideIcon; label: string; name: string; body: string }) {
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span className="ftp-icon-chip" aria-hidden style={{ width: 28, height: 28, borderRadius: 9 }}>
          <Icon size={15} />
        </span>
        <span className="ftp-label">{label}</span>
      </div>
      <div className="ftp-display" style={{ fontSize: 17, lineHeight: "22px", fontWeight: 650 }}>
        {name}
      </div>
      <p style={{ margin: "4px 0 0", fontSize: 14, lineHeight: "21px", color: "var(--ftp-text-2)" }}>{body}</p>
    </Card>
  );
}

function GramPanchayatInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_gram-panchayat");
  const f = useFormat();
  const mt = useModuleText();
  const districtName = useDistrictName(state, district);
  const { data, isLoading, error } = usePanchayats(district, state);
  const { data: overview } = useOverview(district, state);
  const [search, setSearch] = useState("");
  const [talukFilter, setTalukFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  /** Whole rupees → "₹12.3 lakh" or, from 1 crore up, "₹1.2 crore". */
  const money = (rupees: number) =>
    rupees >= 1e7
      ? t("crore", { n: f.number(rupees / 1e7, { maximumFractionDigits: 2 }) })
      : t("lakh", { n: f.number(rupees / 1e5, { maximumFractionDigits: 1 }) });
  const pct = (n: number) => f.number(n / 100, { style: "percent", maximumFractionDigits: 0 });

  const gps = (data?.data ?? []) as PanchayatRow[];
  // The district's MGNREGA figures (NREGA collector), or null.
  const nrega = (data?.snapshot ?? null) as DistrictSnapshot<NregaSnapshotData> | null;
  const shownName = (g: PanchayatRow) => namePair(g.name, g.nameLocal, locale);

  // Taluk names from the district overview (by id), in the reader's script when it matches.
  const taluks = overview?.data?.taluks ?? [];
  const talukName = (id: string | null | undefined) => {
    const tk = id ? taluks.find((x) => x.id === id) : undefined;
    if (!tk) return null;
    return tk.nameLocal && scriptLang(tk.nameLocal) === locale ? tk.nameLocal : tk.name;
  };
  const talukCounts = new Map<string, number>();
  for (const g of gps) if (g.talukId && talukName(g.talukId)) talukCounts.set(g.talukId, (talukCounts.get(g.talukId) ?? 0) + 1);
  const showTalukChips = talukCounts.size >= 2;

  const lastUpdated = gps.reduce<string | null>((best, g) => (g.updatedAt && (!best || g.updatedAt > best) ? g.updatedAt : best), null);
  const totalPop = gps.reduce((s, g) => s + (g.population ?? 0), 0);
  const totalFunds = gps.reduce((s, g) => s + (g.totalFunds ?? 0), 0);
  const totalUtilized = gps.reduce((s, g) => s + (g.fundsUtilized ?? 0), 0);
  const overallUtilPct = totalFunds > 0 ? (totalUtilized / totalFunds) * 100 : 0;
  const totalMgnrega = gps.reduce((s, g) => s + (g.mgnregaWorks ?? 0), 0);
  // Which figures were reported at all — a missing figure is left out, never a fake zero.
  const hasMgnregaData = gps.some((g) => g.mgnregaWorks != null);
  const hasSpend = totalFunds > 0 && totalUtilized > 0;

  // Chart: panchayats grouped by how many homes have drinking water.
  const withWater = gps.filter((g) => g.waterCoverage !== null && g.waterCoverage !== undefined);
  const waterSlices: DonutSlice[] = WATER_BANDS.map((band, i) => {
    const upper = i === 0 ? Infinity : WATER_BANDS[i - 1].min;
    const n = withWater.filter((g) => (g.waterCoverage as number) >= band.min && (g.waterCoverage as number) < upper).length;
    return { key: band.key, label: t(`waterBand.${band.key}`), value: n };
  });
  const showWater = withWater.length >= 3;

  // Chart: the panchayats that have used the smallest share of their funds.
  const ranked = gps
    .filter((g) => (g.totalFunds ?? 0) > 0 && g.fundsUtilized !== null && g.fundsUtilized !== undefined)
    .map((g) => ({ g, used: ((g.fundsUtilized as number) / (g.totalFunds as number)) * 100 }))
    .sort((a, b) => a.used - b.used);
  const showLeast = ranked.length >= 4;
  const least = ranked.slice(0, LEAST_MAX);

  const q = search.trim().toLowerCase();
  const filtered = gps.filter(
    (g) =>
      (talukFilter === "all" || g.talukId === talukFilter) &&
      (!q || g.name.toLowerCase().includes(q) || (g.nameLocal ?? "").toLowerCase().includes(q)),
  );
  const opened = openId ? gps.find((g) => g.id === openId) ?? null : null;

  // Urban districts have no gram panchayats — show who governs instead.
  // Per-district config: Mumbai is fully urban, Pune is not.
  const sc = getStateConfig(state, district);
  const isUrbanDistrict = !!sc && !sc.gramPanchayatApplicable;

  const hasData = !isLoading && !error && gps.length > 0;

  return (
    <ModulePage>
      <PageHeader
        icon={Building}
        title={mt.label("gram-panchayat")}
        description={t("description")}
        freshness={
          lastUpdated
            ? { asOf: lastUpdated, thresholdHours: 24 * MAX_AGE_DAYS }
            : nrega
              ? { asOf: nrega.fetchedAt, thresholdHours: NREGA_MAX_AGE_HOURS }
              : undefined
        }
        source={nrega && gps.length === 0 ? { label: "NREGASoft", href: nrega.sourceUrl } : { label: "eGramSwaraj", href: EGRAMSWARAJ }}
      />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {/* The district's MGNREGA figures, from the NREGA collector. */}
      {!isLoading && !error && nrega && <MgnregaSnapshot snapshot={nrega} districtName={districtName} money={money} />}

      {/* No rows: urban district with a municipal body → who governs instead. */}
      {!isLoading && !error && gps.length === 0 && !nrega && isUrbanDistrict && sc?.municipalBody && (
        <>
          <EmptyState title={t("urbanTitle")} body={t("urbanBody", { district: districtName })} />
          <div style={fitGrid(260, { marginTop: 12 })}>
            <GovernedByCard icon={Building2} label={t("municipalBody")} name={sc.municipalBody} body={t("municipalBodyText", { district: districtName })} />
            {sc.waterBoard && <GovernedByCard icon={Droplets} label={t("waterSupply")} name={sc.waterBoard} body={t("waterSupplyText")} />}
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{t("urbanSource")}</p>
        </>
      )}
      {!isLoading &&
        !error &&
        gps.length === 0 &&
        !nrega &&
        !(isUrbanDistrict && sc?.municipalBody) &&
        (isUrbanDistrict ? (
          <EmptyState title={t("urbanNaTitle")} body={t("urbanBody", { district: districtName })} />
        ) : (
          <EmptyState title={t("emptyTitle", { district: districtName })} body={t("emptyBody")} />
        ))}

      {hasData && (
        <>
          {/* 1 · The answer in plain words. */}
          <Explainer>
            {t.rich("answer", { b: bold, district: districtName, n: gps.length })}{" "}
            {hasSpend
              ? t.rich("answerFunds", { b: bold, used: f.number(Math.round(overallUtilPct)) })
              : totalFunds > 0
                ? t("answerNoSpend")
                : null}{" "}
            {t("tapHint")}
          </Explainer>

          {/* 2 · The big numbers. */}
          <StatStrip>
            <StatTile icon={Home} label={t("tileGps")} value={f.number(gps.length)} asOf={lastUpdated} />
            {totalPop > 0 && <StatTile icon={Users} label={t("tilePopulation")} value={f.number(totalPop)} />}
            {hasMgnregaData && <StatTile icon={Hammer} label={t("tileMgnrega")} value={f.number(totalMgnrega)} />}
            {totalFunds > 0 && (
              <StatTile
                icon={Wallet}
                label={t("tileFunds")}
                value={hasSpend ? f.number(Math.round(overallUtilPct)) : t("pending")}
                unit={hasSpend ? "%" : undefined}
                sub={hasSpend ? t("tileFundsSub", { used: money(totalUtilized), given: money(totalFunds) }) : t("tileFundsGiven", { given: money(totalFunds) })}
              />
            )}
          </StatStrip>

          {/* 3 · The picture: ten coin icons, lit for the share of money used. */}
          {totalFunds > 0 && (
            <Card padding={18} style={{ marginTop: 16 }}>
              <p className="ftp-display" style={{ margin: "0 0 12px", fontSize: 17, lineHeight: "22px", fontWeight: 650 }}>
                {t("moneyTitle")}
              </p>
              {hasSpend ? (
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20 }}>
                  <div style={{ flex: "1 1 300px", minWidth: 0 }}>
                    <IconPictogram filled={overallUtilPct / 10} icon={Coins} label={t("fundsCoins", { n: Math.round(overallUtilPct / 10) })} />
                  </div>
                  <dl style={{ margin: 0, display: "flex", flexWrap: "wrap", gap: "8px 20px", flex: "0 1 auto" }}>
                    {[
                      { key: "given", label: t("moneyGiven"), value: money(totalFunds) },
                      { key: "used", label: t("moneyUsed"), value: money(totalUtilized) },
                      { key: "left", label: t("moneyLeft"), value: money(Math.max(0, totalFunds - totalUtilized)) },
                    ].map((m) => (
                      <div key={m.key} style={{ minWidth: 0 }}>
                        <dt style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{m.label}</dt>
                        <dd className="ftp-bignum" style={{ margin: 0, fontSize: 20, lineHeight: "26px", color: "var(--hue-deep)" }}>
                          {m.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 15, lineHeight: "23px" }}>
                  {t.rich("fundsNoSpend", {
                    amount: money(totalFunds),
                    n: gps.length,
                    num: (c) => (
                      <strong className="ftp-num" style={{ color: "var(--hue-deep)" }}>
                        {c}
                      </strong>
                    ),
                  })}
                </p>
              )}
            </Card>
          )}

          {/* 4 · One card per panchayat. Tap → everything about it. */}
          <Section title={t("allTitle", { n: gps.length })}>
            {(gps.length > SEARCH_FROM || showTalukChips) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
                {gps.length > SEARCH_FROM && (
                  <label style={{ position: "relative", display: "block", maxWidth: 420 }}>
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
                        borderRadius: 12,
                        border: "1px solid color-mix(in srgb, var(--hue) 28%, var(--ftp-border))",
                        fontSize: 15,
                        fontFamily: "var(--ftp-font-sans)",
                        background: "var(--ftp-surface)",
                        color: "var(--ftp-text)",
                        boxSizing: "border-box",
                      }}
                    />
                  </label>
                )}
                {showTalukChips && (
                  <Chips
                    label={t("talukGroup")}
                    value={talukFilter}
                    onChange={setTalukFilter}
                    items={[
                      { value: "all", label: t("talukAll"), count: gps.length },
                      ...Array.from(talukCounts.entries()).map(([id, n]) => ({ value: id, label: talukName(id) as string, count: n })),
                    ]}
                  />
                )}
              </div>
            )}

            {filtered.length === 0 && <EmptyState title={t("noMatch", { q: search })} />}

            <ul className="ftp-grid" style={{ listStyle: "none", margin: 0, padding: 0, ["--ftp-grid-min" as string]: "260px" }}>
              {filtered.map((g) => {
                const n = shownName(g);
                const given = g.totalFunds ?? 0;
                const usedKnown = g.fundsUtilized !== null && g.fundsUtilized !== undefined;
                const utilPct = given > 0 && usedKnown ? ((g.fundsUtilized as number) / given) * 100 : null;
                const tk = talukName(g.talukId);
                return (
                  <li key={g.id}>
                    <TapCard onClick={() => setOpenId(g.id)} label={t("detailsFor", { name: n.primary })}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ minWidth: 0 }}>
                          <h3 lang={n.primaryLang} className="ftp-display" style={{ margin: 0, fontSize: 17, lineHeight: "22px", fontWeight: 650, overflowWrap: "anywhere" }}>
                            {n.primary}
                          </h3>
                          {(n.secondary || tk) && (
                            <div style={{ fontSize: 13, lineHeight: "18px", color: "var(--hue-deep)" }}>
                              {n.secondary && <span lang={n.secondaryLang}>{n.secondary}</span>}
                              {n.secondary && tk ? " · " : null}
                              {tk && t("talukOf", { taluk: tk })}
                            </div>
                          )}
                        </div>
                      </div>

                      {utilPct !== null ? (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, lineHeight: "18px", marginBottom: 5 }}>
                            <span style={{ fontWeight: 600, color: "var(--ftp-text-2)" }}>{t("funds")}</span>
                            <span className="ftp-num" style={{ color: "var(--hue-deep)" }}>
                              {t("fundsUsedPct", { pct: pct(utilPct) })}
                            </span>
                          </div>
                          <ProgressBar pct={utilPct} height={8} />
                          <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 5 }}>
                            {t("leastSub", { spent: money(g.fundsUtilized as number), given: money(given) })}
                          </div>
                        </div>
                      ) : given > 0 ? (
                        <p style={{ margin: 0, fontSize: 13, lineHeight: "18px", color: "var(--ftp-text-2)" }}>{t("fundsNotReported", { given: money(given) })}</p>
                      ) : null}

                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {g.population ? (
                          <Chip tone="quiet">
                            {t("peopleChip", { n: f.number(g.population) })}
                          </Chip>
                        ) : null}
                        {g.waterCoverage !== null && g.waterCoverage !== undefined && (
                          <Chip tone="hue">
                            {t("waterChip", { pct: pct(g.waterCoverage) })}
                          </Chip>
                        )}
                        {/* Only when we actually know — unknown is not "No road". */}
                        {g.roadConnected != null && (
                          <Chip tone={g.roadConnected ? "hue" : "quiet"}>
                            {g.roadConnected ? t("roadYes") : t("roadNo")}
                          </Chip>
                        )}
                        {g.mgnregaWorks != null && (
                          <Chip tone="hue">
                            {t("mgnregaChip", { n: g.mgnregaWorks })}
                          </Chip>
                        )}
                      </div>
                      <TapHint>{t("details")}</TapHint>
                    </TapCard>
                  </li>
                );
              })}
            </ul>
          </Section>

          <div style={{ marginTop: 24 }}>
            <AIInsightCard module="gram-panchayat" district={district} />
          </div>

          {/* 5 · Charts, each with its one-line takeaway. */}
          {(showWater || showLeast) && (
            <div style={fitGrid(340, { marginTop: 8 })}>
              {showWater && (
                <ChartCard
                  title={t("waterTitle")}
                  units={t("waterUnits")}
                  simple={t.rich("waterSimple", { b: bold, n: waterSlices[0].value, total: withWater.length })}
                  source={{ label: "eGramSwaraj", href: EGRAMSWARAJ }}
                  asOf={lastUpdated}
                  table={waterSlices.map((s) => ({ label: s.label, value: f.number(s.value) }))}
                >
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
                </ChartCard>
              )}
              {showLeast && (
                <ChartCard
                  title={t("leastTitle")}
                  units={t("leastUnits")}
                  simple={t.rich("leastSimple", { b: bold, name: shownName(least[0].g).primary, used: pct(least[0].used) })}
                  source={{ label: "eGramSwaraj", href: EGRAMSWARAJ }}
                  asOf={lastUpdated}
                  table={ranked.map(({ g, used }) => ({
                    label: shownName(g).primary,
                    value: t("leastRow", { used: pct(used), spent: money(g.fundsUtilized ?? 0), given: money(g.totalFunds ?? 0) }),
                  }))}
                >
                  <HueBarList
                    max={100}
                    rows={least.map(({ g, used }) => {
                      const n = shownName(g);
                      return {
                        key: g.id,
                        label: n.primary,
                        labelLang: n.primaryLang,
                        value: used,
                        display: pct(used),
                        sub: t("leastSub", { spent: money(g.fundsUtilized ?? 0), given: money(g.totalFunds ?? 0) }),
                      };
                    })}
                    onSelect={(id) => setOpenId(id)}
                    selectAria={(row) => t("detailsFor", { name: row.label })}
                  />
                </ChartCard>
              )}
            </div>
          )}
        </>
      )}

      {/* One row of actions. Sources and "report a mistake" are in the
          district's verification panel at the bottom of the page. */}
      <MoneyToolbar shareTitle={mt.label("gram-panchayat")} compareHref={`/${locale}/compare?module=gram-panchayat&a=${district}`} />

      <PanchayatSheet gp={opened} locale={locale} taluk={opened ? talukName(opened.talukId) : null} money={money} onClose={() => setOpenId(null)} />
    </ModulePage>
  );
}

export default function GramPanchayatPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("gram-panchayat")}>
      <GramPanchayatInner params={params} />
    </ModuleErrorBoundary>
  );
}
