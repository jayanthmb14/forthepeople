/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Citizen Services — Design v4 "Rang" module page (docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useServices() → how-to guides (documents, fees, timeline, steps).
//  Only active guides are listed. Each guide is an accordion row: a real
//  <button> with aria-expanded that opens the detail below it.
//
//  Order: PageHeader → summary → emoji StatTiles → picture (10 laptops,
//  lit for the share of guides that have an online application link) →
//  two charts (kinds of service as a ring; the documents asked for most as
//  bars) → category chips + guides → sources → news → toolbar. Colours
//  come from the page hue (teal for services), set by HueScope.
//
//  Text: every word comes from the "page_services" messages. Guide names,
//  categories, offices, documents and steps are data and stay as published.
"use client";
import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { Briefcase, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useServices } from "@/hooks/useRealtimeData";
import type { ServiceGuide } from "@/hooks/useRealtimeData";
import { useFormat, useModuleText } from "@/i18n/client";
import { scriptLang } from "@/lib/utils/script-lang";
import {
  PageHeader,
  Section,
  Card,
  Chips,
  Pill,
  PrimaryButton,
  StatStrip,
  StatTile,
  LoadingShell,
  ErrorBlock,
} from "@/components/district/ui";
import { ChartCard, Explainer, Pictogram } from "@/components/district/visuals";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";
import { ModulePage, ModuleSummary, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { BarList, HueDonut, MUTED_SHADE, type DonutSegment } from "@/components/district/daily-services/HueCharts";
import { useDistrictName } from "@/components/district/daily-services/useDistrictName";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

/** Pill colours taken from the page hue instead of the neutral grey. */
const HUE_PILL: React.CSSProperties = { background: "var(--hue-tint)", color: "var(--hue-deep)" };

/** How many categories the ring shows by name before "Other kinds". */
const TOP_CATEGORIES = 5;
/** How many documents the bar list shows. */
const TOP_DOCUMENTS = 5;

const bold = (c: React.ReactNode) => <strong>{c}</strong>;

/**
 * One emoji per guide, picked from its category name. Categories are free
 * text in the database, so this matches on keywords and falls back to 📄.
 */
function categoryEmoji(category: string): string {
  const c = category.toLowerCase();
  if (/certif|caste|income|birth|death|domicile/.test(c)) return "📜";
  if (/land|revenue|property|survey|record/.test(c)) return "🗺️";
  if (/health|hospital|medical/.test(c)) return "🏥";
  if (/educat|school|scholar/.test(c)) return "🎓";
  if (/transport|licen|vehicle|driving/.test(c)) return "🚗";
  if (/water/.test(c)) return "🚰";
  if (/power|electric/.test(c)) return "⚡";
  if (/hous/.test(c)) return "🏠";
  if (/agri|farm/.test(c)) return "🌾";
  if (/police|safety/.test(c)) return "👮";
  if (/pension|welfare|social|ration/.test(c)) return "🤝";
  if (/tax|business|trade|shop/.test(c)) return "🧾";
  return "📄";
}

/**
 * The documents most guides ask for. Each guide counts a document once;
 * names are matched ignoring case and extra spaces, and shown the way
 * they were first written. Only documents asked for by 2+ guides count as
 * "asked for most" (a list of one-offs says nothing).
 */
function topDocuments(guides: ServiceGuide[]): Array<{ key: string; label: string; count: number }> {
  const map = new Map<string, { label: string; count: number }>();
  for (const g of guides) {
    const seen = new Set<string>();
    for (const raw of g.documentsNeeded) {
      const label = raw.replace(/\s+/g, " ").trim();
      const key = label.toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const cur = map.get(key);
      if (cur) cur.count += 1;
      else map.set(key, { label, count: 1 });
    }
  }
  return [...map.entries()]
    .map(([key, v]) => ({ key, ...v }))
    .filter((d) => d.count >= 2)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, TOP_DOCUMENTS);
}

/** A labelled block inside an open guide, with one emoji before the label. */
function DetailBlock({ label, emoji, children }: { label: string; emoji: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div className="ftp-label" style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
        <span className="ftp-emoji" aria-hidden style={{ fontSize: 14 }}>{emoji}</span>
        {label}
      </div>
      {children}
    </div>
  );
}

/** A tiny "👣 4 steps" marker under a guide's name. */
function MetaBit({ emoji, children }: { emoji: string; children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
      <span className="ftp-emoji" aria-hidden style={{ fontSize: 12 }}>{emoji}</span>
      {children}
    </span>
  );
}

function ServicesPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const t = useTranslations("page_services");
  const f = useFormat();
  const mt = useModuleText();
  const districtName = useDistrictName(state, district);
  const { data, isLoading, error } = useServices(district, state);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const n = (v: number) => f.number(v);
  const pct = (share: number) => f.number(share, { style: "percent", maximumFractionDigits: 0 });

  const services = data?.data ?? [];
  const active = services.filter((s) => s.active);
  const filtered = filter === "all" ? active : active.filter((s) => s.category === filter);
  // How many guides link to an official online application.
  const onlineCount = active.filter((s) => Boolean(s.onlineUrl)).length;
  const onlineTenths = active.length > 0 ? (onlineCount / active.length) * 10 : 0;

  // Guides per category, biggest first (also the chip order).
  const categoryCounts = Object.entries(
    active.reduce<Record<string, number>>((acc, s) => {
      acc[s.category] = (acc[s.category] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const categories = categoryCounts.map(([c]) => c);

  // The ring: the top categories by name, the rest folded into "Other kinds".
  const topCats = categoryCounts.slice(0, TOP_CATEGORIES);
  const otherCount = categoryCounts.slice(TOP_CATEGORIES).reduce((s, [, c]) => s + c, 0);
  const catSegments: DonutSegment[] = [
    ...topCats.map(([c, count]) => ({ key: c, label: c, value: count, display: n(count), emoji: categoryEmoji(c) })),
    ...(otherCount > 0 ? [{ key: "__other", label: t("cats.other"), value: otherCount, display: n(otherCount), emoji: "🗂️", color: MUTED_SHADE }] : []),
  ];
  const topCat = categoryCounts[0];

  const docs = topDocuments(active);

  return (
    <ModulePage>
      <PageHeader
        icon={Briefcase}
        title={mt.label("services")}
        description={t("description")}
        backHref={base}
        accent={getModuleAccent("services")}
      />

      <ModuleSummary>{t("summary", { district: districtName })}</ModuleSummary>

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && active.length === 0 && <NoDataCard module="services" district={district} state={state} />}

      {!isLoading && active.length > 0 && (
        <>
          <StatStrip cols={3}>
            <StatTile emoji="📋" label={t("tiles.guides")} value={n(active.length)} sub={t("tiles.guidesSub")} />
            <StatTile emoji="🗂️" label={t("tiles.categories")} value={n(categories.length)} sub={t("tiles.categoriesSub")} />
            <StatTile emoji="💻" label={t("tiles.online")} value={n(onlineCount)} sub={t("tiles.onlineSub")} />
          </StatStrip>

          {/* The picture: 10 laptops, lit for the share of guides that can be
              started online. Same counts as the tiles above. */}
          <Card tinted padding={18} style={{ marginTop: 16 }}>
            <Explainer emoji="🧭">
              {t.rich(onlineCount > 0 ? "explainer" : "explainerNone", {
                total: active.length,
                online: n(onlineCount),
                district: districtName,
                b: bold,
              })}
            </Explainer>
            <Pictogram
              filled={onlineTenths}
              emoji="💻"
              label={onlineCount === 0 ? t("pictogramNone") : t("pictogram", { n: Math.round(onlineTenths) })}
            />
          </Card>

          {/* Two charts: which kinds of service, and which papers to carry.
              Each hides itself when there is not enough to compare. */}
          {(catSegments.length > 1 || docs.length > 0) && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 16, marginTop: 24 }}>
              {catSegments.length > 1 && topCat && (
                <ChartCard
                  title={t("cats.title")}
                  emoji="🗂️"
                  units={t("cats.units")}
                  simple={t.rich("cats.simple", { category: topCat[0], n: n(topCat[1]), total: n(active.length), b: bold })}
                  table={catSegments.map((s) => ({ label: s.label, value: s.display }))}
                >
                  <HueDonut
                    segments={catSegments}
                    center={n(active.length)}
                    centerSub={t("tiles.guides")}
                    ariaLabel={t("cats.aria", { total: active.length })}
                    percentOf={pct}
                  />
                </ChartCard>
              )}
              {docs.length > 0 && (
                <ChartCard
                  title={t("docs.title")}
                  emoji="📄"
                  units={t("docs.units")}
                  simple={t.rich("docs.simple", { doc: docs[0].label, n: n(docs[0].count), total: n(active.length), b: bold })}
                  table={docs.map((d) => ({ label: d.label, value: t("docs.count", { n: n(d.count), total: n(active.length) }) }))}
                >
                  <BarList
                    items={docs.map((d) => ({
                      key: d.key,
                      label: d.label,
                      lang: scriptLang(d.label),
                      value: d.count,
                      display: t("docs.count", { n: n(d.count), total: n(active.length) }),
                      emoji: "📄",
                    }))}
                  />
                </ChartCard>
              )}
            </div>
          )}

          <Section title={t("list.title")} emoji="📋">
            <div style={{ marginBottom: 12 }}>
              <Chips
                label={t("list.chipsLabel")}
                value={filter}
                onChange={setFilter}
                items={[
                  { value: "all", label: t("list.all"), count: active.length },
                  ...categoryCounts.map(([c, count]) => ({ value: c, label: c, count })),
                ]}
              />
            </div>

            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map((s) => {
                const isOpen = expanded === s.id;
                const panelId = `service-${s.id}`;
                return (
                  <Card key={s.id} as="li" padding={0} tinted={isOpen} style={{ overflow: "hidden" }}>
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : s.id)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      style={{
                        width: "100%",
                        minHeight: 44,
                        padding: "12px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "start",
                        fontFamily: "var(--ftp-font-sans)",
                        color: "var(--ftp-text)",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 36, height: 36, fontSize: 18, borderRadius: 11 }}>
                          {categoryEmoji(s.category)}
                        </span>
                        <span style={{ minWidth: 0 }}>
                          <span className="ftp-title" style={{ display: "block" }}>{s.serviceName}</span>
                          {s.serviceNameLocal && (
                            <span lang={scriptLang(s.serviceNameLocal)} style={{ display: "block", fontSize: 13, lineHeight: "20px", color: "var(--hue-deep)" }}>
                              {s.serviceNameLocal}
                            </span>
                          )}
                          {(s.steps.length > 0 || s.documentsNeeded.length > 0 || s.onlineUrl) && (
                            <span style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 2 }}>
                              {s.steps.length > 0 && <MetaBit emoji="👣">{t("list.steps", { n: s.steps.length })}</MetaBit>}
                              {s.documentsNeeded.length > 0 && <MetaBit emoji="📄">{t("list.docs", { n: s.documentsNeeded.length })}</MetaBit>}
                              {s.onlineUrl && <MetaBit emoji="💻">{t("list.online")}</MetaBit>}
                            </span>
                          )}
                        </span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 1, minWidth: 0, maxWidth: "45%", justifyContent: "flex-end" }}>
                        <Pill style={{ ...HUE_PILL, whiteSpace: "normal", height: "auto", minHeight: 24, padding: "3px 10px", textAlign: "end" }}>{s.office}</Pill>
                        {isOpen ? (
                          <ChevronUp size={16} aria-hidden style={{ color: "var(--hue)", flexShrink: 0 }} />
                        ) : (
                          <ChevronDown size={16} aria-hidden style={{ color: "var(--ftp-text-2)", flexShrink: 0 }} />
                        )}
                      </span>
                    </button>

                    {isOpen && (
                      <div id={panelId} style={{ padding: "0 16px 16px", borderTop: "1px solid color-mix(in srgb, var(--hue) 18%, var(--ftp-border))" }}>
                        {(s.fees || s.timeline) && (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                            {s.fees && (
                              <DetailBlock label={t("detail.fee")} emoji="💰">
                                <div style={{ fontSize: 14, lineHeight: "21px", color: "var(--ftp-text)" }}>{s.fees}</div>
                              </DetailBlock>
                            )}
                            {s.timeline && (
                              <DetailBlock label={t("detail.timeline")} emoji="⏱️">
                                <div style={{ fontSize: 14, lineHeight: "21px", color: "var(--ftp-text)" }}>{s.timeline}</div>
                              </DetailBlock>
                            )}
                          </div>
                        )}

                        {s.documentsNeeded.length > 0 && (
                          <DetailBlock label={t("detail.documents")} emoji="📄">
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {s.documentsNeeded.map((doc, i) => (
                                <Pill key={i} style={{ ...HUE_PILL, whiteSpace: "normal", height: "auto", minHeight: 24, padding: "3px 10px" }}>
                                  {doc}
                                </Pill>
                              ))}
                            </div>
                          </DetailBlock>
                        )}

                        {s.steps.length > 0 && (
                          <DetailBlock label={t("detail.steps")} emoji="👣">
                            {/* A real sequence, so numbered markers: hue circles. */}
                            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                              {s.steps.map((step, i) => (
                                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                  <span
                                    aria-hidden
                                    className="ftp-num"
                                    style={{
                                      width: 24,
                                      height: 24,
                                      flexShrink: 0,
                                      borderRadius: "50%",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: 12,
                                      background: "var(--hue)",
                                      color: "#fff",
                                    }}
                                  >
                                    {n(i + 1)}
                                  </span>
                                  <span className="ftp-body" style={{ fontSize: 14, lineHeight: "21px", paddingTop: 1 }}>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </DetailBlock>
                        )}

                        {s.tips && (
                          <DetailBlock label={t("detail.tip")} emoji="💡">
                            <p className="ftp-body" style={{ margin: 0, fontSize: 14, lineHeight: "21px" }}>{s.tips}</p>
                          </DetailBlock>
                        )}

                        {s.onlineUrl && (
                          <div style={{ marginTop: 16 }}>
                            <PrimaryButton icon={ExternalLink} href={s.onlineUrl} external>
                              {t("detail.apply")}
                            </PrimaryButton>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </ul>
          </Section>
        </>
      )}

      <ModuleSources module="services" state={state} />
      <ModuleNews district={district} state={state} locale={locale} module="services" />
      <ModuleToolbar
        locale={locale}
        district={district}
        moduleSlug="services"
        moduleLabel={mt.label("services")}
        shareText={t("share", { district: districtName, n: active.length })}
      />
    </ModulePage>
  );
}

export default function ServicesPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("services")}>
      <ServicesPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
