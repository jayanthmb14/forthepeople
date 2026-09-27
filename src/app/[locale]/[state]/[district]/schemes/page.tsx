/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Government Schemes — module page (Design v4 "Rang", docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//  PageHeader → emoji StatStrip → the picture (explainer + a pictogram of
//  schemes with an online apply link) → "who runs these schemes" ring
//  (central / state / local) → schemes-by-category ChartCard → "schemes
//  that reach the most people" list → category Chips → scheme cards →
//  SourcesFooter → ModuleNews → Toolbar.
//  Data still comes from useSchemes(). Every number in the pictures and
//  charts is counted from the same scheme rows as the tiles, and a picture
//  hides itself when the rows do not carry the field it needs. Words live
//  in the "page_schemes" messages; scheme names and eligibility text stay
//  as published.
"use client";

import { use, useState } from "react";
import { useTranslations } from "next-intl";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ExternalLink, ScrollText } from "lucide-react";
import { useSchemes } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  Chips,
  LoadingShell,
  ErrorBlock,
  EmptyState,
  SourcesFooter,
} from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import { ChartCard, ChartGradients, Explainer, Pictogram, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import { getModuleSources } from "@/lib/constants/state-config";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import ModuleNews from "@/components/district/ModuleNews";
import { useFormat, useModuleText } from "@/i18n/client";
import { ShareDonut, TopBarList, type DonutSlice } from "@/components/money/visuals";
import { useMoney, useSourceText } from "@/components/money/useMoney";
import MoneyToolbar, { NotOfficialNote, downloadCsv } from "@/components/money/MoneyToolbar";
import knDict from "@/dictionaries/kn.json";

/** Official websites for the sources named by getModuleSources("schemes"). */
const SOURCE_URLS: Record<string, string> = {
  "MyScheme.gov.in": "https://www.myscheme.gov.in",
};

/** The newest `updatedAt` among the rows (the API sends it with every scheme). */
function latestUpdatedAt(rows: Array<{ updatedAt?: string | null }>): string | null {
  let best: string | null = null;
  for (const r of rows) {
    if (r.updatedAt && (!best || r.updatedAt > best)) best = r.updatedAt;
  }
  return best;
}

/** "Women & Child Development" → "womenandchilddevelopment" (message key). */
function catKey(category: string): string {
  return category.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
}

/** One emoji per kind of scheme, picked from words in the category. */
function categoryEmoji(category: string): string {
  const c = category.toLowerCase();
  if (/insurance|health|medical|hospital/.test(c)) return "🏥";
  if (/hous|shelter|awas/.test(c)) return "🏠";
  if (/educat|school|scholar|student/.test(c)) return "🎓";
  if (/agri|farm|kisan|crop|fisher/.test(c)) return "🌾";
  if (/women|child|girl|mother/.test(c)) return "👩‍👧";
  if (/employ|job|livelihood|skill/.test(c)) return "💼";
  if (/food|nutrition|ration/.test(c)) return "🍚";
  if (/water|sanitation|toilet/.test(c)) return "💧";
  if (/lpg|gas/.test(c)) return "🔥";
  if (/electric|energy|power|solar/.test(c)) return "⚡";
  if (/transport|bus|travel/.test(c)) return "🚌";
  if (/msme|artisan|industry|business/.test(c)) return "🧵";
  if (/financ|saving|bank|loan/.test(c)) return "🏦";
  if (/pension|social|welfare|security|disab|senior/.test(c)) return "🤝";
  if (/urban|city/.test(c)) return "🏙️";
  if (/touris/.test(c)) return "🧳";
  if (/certific|document/.test(c)) return "📄";
  return "📋";
}

/** Scheme level ("Central", "STATE", …) → message key, or null when unknown. */
function levelKey(level: string | null | undefined): "central" | "state" | "local" | null {
  const l = (level ?? "").trim().toLowerCase();
  if (l.startsWith("central") || l === "centre" || l === "center") return "central";
  if (l.startsWith("state")) return "state";
  if (l.startsWith("local") || l.startsWith("district")) return "local";
  return null;
}

const b = (c: React.ReactNode) => <strong>{c}</strong>;
const num = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;

function SchemesPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_schemes");
  const mt = useModuleText();
  const f = useFormat();
  const m = useMoney();
  const st = useSourceText();
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useSchemes(district, state);
  const [filter, setFilter] = useState("all");

  const schemes = data?.data ?? [];
  const categories = ["all", ...Array.from(new Set(schemes.map((s) => s.category)))];
  const filtered = filter === "all" ? schemes : schemes.filter((s) => s.category === filter);

  // Category words are translated when the language has them; anything
  // unknown is shown exactly as the source published it.
  const catLabel = (c: string) => (f.locale !== "en" && t.has(`cat.${catKey(c)}`) ? t(`cat.${catKey(c)}`) : c);
  const levelLabel = (level: string | null | undefined) => {
    const k = levelKey(level);
    return k ? t(`level.${k}`) : level ?? "";
  };

  const asOf = latestUpdatedAt(schemes as Array<{ updatedAt?: string | null }>);
  const withApplyLink = schemes.filter((s) => !!s.applyUrl).length;
  const categoryCount = categories.length - 1;

  // The picture: of every 10 schemes listed, how many have an online apply link.
  const applyOf10 = schemes.length > 0 ? (withApplyLink / schemes.length) * 10 : 0;
  // Chart rows: schemes per category, largest first.
  const categoryChart = categories
    .filter((c) => c !== "all")
    .map((c) => {
      const name = catLabel(c);
      return {
        name,
        label: name.length > 22 ? name.slice(0, 21) + "…" : name,
        count: schemes.filter((s) => s.category === c).length,
      };
    })
    .sort((a, b) => b.count - a.count);

  // Who runs the schemes: central, state or local government. Only rows
  // whose level we recognise are counted; the rest go in "not stated".
  const levelCounts = { central: 0, state: 0, local: 0 };
  let levelUnknown = 0;
  for (const s of schemes) {
    const k = levelKey(s.level);
    if (k) levelCounts[k] += 1;
    else levelUnknown += 1;
  }
  const levelSlices: DonutSlice[] = (["central", "state", "local"] as const)
    .filter((k) => levelCounts[k] > 0)
    .sort((a, b) => levelCounts[b] - levelCounts[a])
    .map((k) => ({ key: k, label: t(`level.${k}`), value: levelCounts[k], display: m.num(levelCounts[k]) }));
  if (levelUnknown > 0) {
    levelSlices.push({ key: "unknown", label: t("levels.unknown"), value: levelUnknown, display: m.num(levelUnknown), other: true });
  }
  const knownLevels = levelSlices.filter((s) => !s.other);
  const knownLevelTotal = knownLevels.reduce((sum, s) => sum + s.value, 0);
  const topLevel = knownLevels[0];

  // Schemes that reach the most people (only rows with a beneficiary count).
  const reach = schemes
    .filter((s) => typeof s.beneficiaryCount === "number" && s.beneficiaryCount > 0)
    .sort((a, b) => (b.beneficiaryCount ?? 0) - (a.beneficiaryCount ?? 0));

  const src = getModuleSources("schemes", state);
  const title = mt.label("schemes");
  // Local-script title: the module name in the state's language (Kannada
  // only for now). PageHeader hides it when it is already the title.
  const titleLocal = state === "karnataka" ? knDict.moduleNames.schemes : undefined;

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
      }))
    );

  return (
    <div className="module-page" style={{ padding: 24, maxWidth: "var(--ftp-reading-max)" }}>
      <PageHeader
        icon={ScrollText}
        accent={getModuleAccent("schemes")}
        title={title}
        titleLocal={titleLocal}
        description={t("description")}
        backHref={base}
        freshness={asOf ? { asOf } : undefined}
        source={{ label: "MyScheme", href: SOURCE_URLS["MyScheme.gov.in"] }}
      />

      <AIInsightCard module="schemes" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && schemes.length === 0 && (
        <EmptyState emoji="📋" title={t("empty.title")} body={t("empty.body")} />
      )}

      {!isLoading && schemes.length > 0 && (
        <>
          <div style={{ marginBottom: 16 }}>
            <StatStrip cols={3}>
              <StatTile emoji="📋" label={t("tiles.listed")} value={m.num(schemes.length)} asOf={asOf} />
              <StatTile emoji="🗂️" label={t("tiles.categories")} value={m.num(categoryCount)} asOf={asOf} />
              <StatTile emoji="🔗" label={t("tiles.withLink")} value={m.num(withApplyLink)} sub={t("tiles.ofTotal", { n: schemes.length })} asOf={asOf} />
            </StatStrip>
          </div>

          {/* The picture: out of every 10 schemes, how many you can apply
              for online from here. Needs at least two schemes. */}
          {schemes.length >= 2 && (
            <Card tinted padding={18}>
              <Explainer>
                {t.rich("explainer", { total: schemes.length, cats: categoryCount, withLink: withApplyLink, num })}
              </Explainer>
              <Pictogram
                filled={applyOf10}
                emoji="📝"
                label={withApplyLink === 0 ? t("pictogramNone") : t("pictogram", { n: Math.round(applyOf10) })}
              />
            </Card>
          )}

          {/* Who runs these schemes — a different question from "what kind".
              Needs at least two schemes with a known level. */}
          {knownLevelTotal >= 2 && levelSlices.length >= 2 && topLevel && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title={t("levels.title")}
                emoji="🏛️"
                units={t("levels.units")}
                simple={t.rich(`levels.simple.${topLevel.key}`, { n: topLevel.value, total: schemes.length, b })}
                source={{ label: "MyScheme", href: SOURCE_URLS["MyScheme.gov.in"] }}
                asOf={asOf}
                table={levelSlices.map((s) => ({ label: s.label, value: `${s.display} (${m.pct(s.value / schemes.length)})` }))}
              >
                <ShareDonut
                  slices={levelSlices}
                  centerValue={m.num(schemes.length)}
                  centerLabel={t("levels.center")}
                  ariaLabel={t("levels.aria", { list: levelSlices.map((s) => `${s.label} ${s.display}`).join(", ") })}
                  formatPct={(p) => m.pct(p)}
                />
              </ChartCard>
            </div>
          )}

          {/* Schemes by category — only when there is more than one category. */}
          {categoryChart.length >= 2 && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title={t("byCategory.title")}
                emoji="📊"
                units={t("byCategory.units")}
                simple={t.rich("byCategory.simple", { name: categoryChart[0].name, n: categoryChart[0].count, total: schemes.length, b })}
                legend={[{ label: t("byCategory.legend"), swatch: "var(--hue)" }]}
                source={{ label: "MyScheme", href: SOURCE_URLS["MyScheme.gov.in"] }}
                asOf={asOf}
                table={categoryChart.map((r) => ({ label: r.name, value: m.num(r.count) }))}
              >
                <ResponsiveContainer width="100%" height={Math.max(160, categoryChart.length * 36 + 40)}>
                  <BarChart data={categoryChart} layout="vertical" margin={{ top: 5, right: 16, bottom: 8, left: 0 }}>
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" horizontal={false} />
                    <XAxis type="number" tick={CHART_AXIS} allowDecimals={false} tickFormatter={(v) => m.num(Number(v))} />
                    <YAxis type="category" dataKey="label" tick={CHART_AXIS} width={150} interval={0} />
                    <Tooltip
                      formatter={(v) => [m.num(Number(v)), t("byCategory.legend")]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ""}
                      contentStyle={chartTooltipStyle}
                      cursor={{ fill: "var(--hue-tint)" }}
                    />
                    <Bar dataKey="count" fill="url(#ftpHueFillH)" radius={[0, 6, 6, 0]} name={t("byCategory.legend")} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          {/* Schemes that reach the most people — only rows with a count. */}
          {reach.length >= 2 && (
            <div style={{ marginTop: 24 }}>
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
                    sub: catLabel(s.category),
                    emoji: categoryEmoji(s.category),
                    value: s.beneficiaryCount ?? 0,
                    display: m.num(s.beneficiaryCount ?? 0),
                  }))}
                />
              </ChartCard>
            </div>
          )}

          <Section title={t("list.title")} emoji="📋">
            <div style={{ marginBottom: 16 }}>
              <Chips
                label={t("list.filterLabel")}
                value={filter}
                onChange={setFilter}
                items={categories.map((c) => ({
                  value: c,
                  label: c === "all" ? t("list.all") : catLabel(c),
                  count: c === "all" ? schemes.length : schemes.filter((s) => s.category === c).length,
                }))}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))", gap: 12 }}>
              {filtered.map((s) => (
                <Card key={s.id} as="article">
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0 }}>
                      <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 36, height: 36, fontSize: 19, borderRadius: 11 }}>
                        {categoryEmoji(s.category)}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <h3 className="ftp-title" style={{ marginBottom: 4 }}>{s.name}</h3>
                        {s.nameLocal && (
                          <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--hue-deep)", fontFamily: "var(--font-regional)", marginBottom: 6 }}>
                            {s.nameLocal}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Category tag in the module hue. */}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        minHeight: 24,
                        padding: "2px 8px",
                        flexShrink: 0,
                        borderRadius: "var(--ftp-radius-pill)",
                        background: "var(--hue-tint)",
                        color: "var(--hue-deep)",
                        fontSize: 11,
                        lineHeight: "16px",
                        fontWeight: 600,
                        maxWidth: "45%",
                        textAlign: "center",
                      }}
                    >
                      {catLabel(s.category)}
                    </span>
                  </div>

                  {s.eligibility && (
                    <div style={{ marginTop: 8 }}>
                      <div className="ftp-label" style={{ marginBottom: 2 }}>{t("card.eligibility")}</div>
                      <div className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{s.eligibility}</div>
                    </div>
                  )}
                  {s.amount && (
                    <div style={{ marginTop: 10, display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <div>
                        <div className="ftp-label">{t("card.benefit")}</div>
                        <div className="ftp-num" style={{ fontSize: 15, lineHeight: "22px", color: "var(--hue-deep)" }}>{m.rupees(s.amount)}</div>
                      </div>
                      {s.beneficiaryCount && (
                        <div>
                          <div className="ftp-label">{t("card.beneficiaries")}</div>
                          <div className="ftp-num" style={{ fontSize: 15, lineHeight: "22px", color: "var(--hue-deep)" }}>{m.num(s.beneficiaryCount)}</div>
                        </div>
                      )}
                    </div>
                  )}
                  {s.level && (
                    <div className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 8 }}>
                      {t("card.level", { level: levelLabel(s.level) })}
                    </div>
                  )}
                  {s.applyUrl ? (
                    // Primary action. `ftp-chip` gives it a 32 px height on
                    // desktop and a 44 px tap target on phones.
                    <a
                      href={s.applyUrl.startsWith("http") ? s.applyUrl : `https://${s.applyUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ftp-chip"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 12,
                        padding: "0 16px",
                        background: "linear-gradient(135deg, var(--hue) 0%, var(--hue-deep) 100%)",
                        color: "#fff",
                        borderRadius: "var(--ftp-radius-pill)",
                        boxShadow: "0 8px 16px -10px color-mix(in srgb, var(--hue) 80%, transparent)",
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      {t("card.apply")} <ExternalLink size={14} aria-hidden />
                    </a>
                  ) : (
                    <div className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 12 }}>
                      {t("card.noLink")}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </Section>
        </>
      )}

      <SourcesFooter sources={src.sources.map((name) => ({ name: st.name(name), url: SOURCE_URLS[name], frequency: st.freq(src.frequency) }))} />
      <NotOfficialNote />

      <ModuleNews district={district} state={state} locale={locale} module="schemes" />

      <MoneyToolbar
        shareTitle={title}
        onCsv={onCsv}
        csvDisabled={schemes.length === 0}
        compareHref={`/${locale}/compare?module=schemes&a=${district}`}
      />
    </div>
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
