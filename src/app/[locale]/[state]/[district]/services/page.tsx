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
//  category chips + guides → sources → news → toolbar. Colours come from
//  the page hue (teal for services), set by HueScope in the layout.
"use client";
import { use, useState } from "react";
import { Briefcase, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useServices } from "@/hooks/useRealtimeData";
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
import { Explainer, Pictogram } from "@/components/district/visuals";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";
import { ModulePage, ModuleSummary, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

/** Pill colours taken from the page hue instead of the neutral grey. */
const HUE_PILL: React.CSSProperties = { background: "var(--hue-tint)", color: "var(--hue-deep)" };

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

function ServicesPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useServices(district, state);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const services = data?.data ?? [];
  const active = services.filter((s) => s.active);
  const categories = Array.from(new Set(active.map((s) => s.category)));
  const filtered = filter === "all" ? active : active.filter((s) => s.category === filter);
  // How many guides link to an official online application.
  const onlineCount = active.filter((s) => Boolean(s.onlineUrl)).length;

  return (
    <ModulePage>
      <PageHeader
        icon={Briefcase}
        title="Citizen Services"
        description="Step-by-step guides for government services, documents needed, fees, and timelines"
        backHref={base}
        accent={getModuleAccent("services")}
      />

      <ModuleSummary>
        Step-by-step guides for common government services in this district: which office handles each one, which
        documents to carry, the fee, how long it usually takes, and where you can apply online.
      </ModuleSummary>

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && active.length === 0 && <NoDataCard module="services" district={district} state={state} />}

      {!isLoading && active.length > 0 && (
        <>
          <StatStrip cols={3}>
            <StatTile emoji="📋" label="Service guides" value={active.length.toLocaleString("en-IN")} sub="Step-by-step how-tos" />
            <StatTile emoji="🗂️" label="Categories" value={categories.length.toLocaleString("en-IN")} sub="Kinds of service covered" />
            <StatTile emoji="💻" label="Apply online" value={onlineCount.toLocaleString("en-IN")} sub="Guides with an official link" />
          </StatStrip>

          {/* The picture: 10 laptops, lit for the share of guides that can be
              started online. Same counts as the tiles above. */}
          <Card tinted padding={18} style={{ marginTop: 16 }}>
            <Explainer title="In simple words" emoji="🧭">
              {onlineCount > 0 ? (
                <>
                  We have <strong>{active.length}</strong> guides for this district. <strong>{onlineCount}</strong> of them
                  have a link where you can apply online; for the rest you visit the office named in the guide.
                </>
              ) : (
                <>
                  We have <strong>{active.length}</strong> guides for this district. None of them has an online application
                  link yet, so each one names the office to visit.
                </>
              )}
            </Explainer>
            <Pictogram
              filled={(onlineCount / active.length) * 10}
              emoji="💻"
              label={
                onlineCount === 0
                  ? "None of the guides can be started online yet."
                  : Math.round((onlineCount / active.length) * 10) === 0
                    ? "Fewer than 1 in every 10 guides can be started online."
                    : `About ${Math.round((onlineCount / active.length) * 10)} of every 10 guides can be started online.`
              }
            />
          </Card>

          <Section title="Service guides" emoji="📋">
            <div style={{ marginBottom: 12 }}>
              <Chips
                label="Service category"
                value={filter}
                onChange={setFilter}
                items={[
                  { value: "all", label: "All", count: active.length },
                  ...categories.map((c) => ({ value: c, label: c, count: active.filter((s) => s.category === c).length })),
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
                        textAlign: "left",
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
                            <span lang="und" style={{ display: "block", fontSize: 13, lineHeight: "20px", color: "var(--hue-deep)" }}>{s.serviceNameLocal}</span>
                          )}
                        </span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 1, minWidth: 0, maxWidth: "45%", justifyContent: "flex-end" }}>
                        <Pill style={{ ...HUE_PILL, whiteSpace: "normal", height: "auto", minHeight: 24, padding: "3px 10px", textAlign: "right" }}>{s.office}</Pill>
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
                              <DetailBlock label="Fee" emoji="💰">
                                <div style={{ fontSize: 14, lineHeight: "21px", color: "var(--ftp-text)" }}>{s.fees}</div>
                              </DetailBlock>
                            )}
                            {s.timeline && (
                              <DetailBlock label="Timeline" emoji="⏱️">
                                <div style={{ fontSize: 14, lineHeight: "21px", color: "var(--ftp-text)" }}>{s.timeline}</div>
                              </DetailBlock>
                            )}
                          </div>
                        )}

                        {s.documentsNeeded.length > 0 && (
                          <DetailBlock label="Documents needed" emoji="📄">
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
                          <DetailBlock label="Steps" emoji="👣">
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
                                    {i + 1}
                                  </span>
                                  <span className="ftp-body" style={{ fontSize: 14, lineHeight: "21px", paddingTop: 1 }}>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </DetailBlock>
                        )}

                        {s.tips && (
                          <DetailBlock label="Tip" emoji="💡">
                            <p className="ftp-body" style={{ margin: 0, fontSize: 14, lineHeight: "21px" }}>{s.tips}</p>
                          </DetailBlock>
                        )}

                        {s.onlineUrl && (
                          <div style={{ marginTop: 16 }}>
                            <PrimaryButton icon={ExternalLink} href={s.onlineUrl} external>
                              Apply online
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
        moduleLabel="Citizen Services"
        shareText={`How to get government services in ${district}: ${active.length} step-by-step guides`}
      />
    </ModulePage>
  );
}

export default function ServicesPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Citizen Services">
      <ServicesPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
