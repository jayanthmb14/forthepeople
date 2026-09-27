/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Citizen Services — Design v3 module page (CONCEPT-v3 §5)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useServices() → how-to guides (documents, fees, timeline, steps).
//  Only active guides are listed. Each guide is an accordion row: a real
//  <button> with aria-expanded that opens the detail below it.
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
  ToolbarButton,
  LoadingShell,
  ErrorBlock,
} from "@/components/district/ui";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";
import { ModulePage, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

/** A labelled block inside an open guide. */
function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div className="ftp-label" style={{ marginBottom: 4 }}>{label}</div>
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

  return (
    <ModulePage>
      <PageHeader
        icon={Briefcase}
        title="Citizen Services"
        description="Step-by-step guides for government services, documents needed, fees, and timelines"
        backHref={base}
        accent={getModuleAccent("services")}
      />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && active.length === 0 && <NoDataCard module="services" district={district} state={state} />}

      {!isLoading && active.length > 0 && (
        <Section title="Service guides">
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
                <Card key={s.id} as="li" padding={0} style={{ overflow: "hidden" }}>
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
                    <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <Briefcase size={16} aria-hidden style={{ color: "var(--ftp-text-2)", flexShrink: 0 }} />
                      <span style={{ minWidth: 0 }}>
                        <span className="ftp-title" style={{ display: "block" }}>{s.serviceName}</span>
                        {s.serviceNameLocal && (
                          <span lang="und" style={{ display: "block", fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{s.serviceNameLocal}</span>
                        )}
                      </span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <Pill>{s.office}</Pill>
                      {isOpen ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
                    </span>
                  </button>

                  {isOpen && (
                    <div id={panelId} style={{ padding: "0 16px 16px", borderTop: "1px solid var(--ftp-border)" }}>
                      {(s.fees || s.timeline) && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                          {s.fees && (
                            <DetailBlock label="Fee">
                              <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>{s.fees}</div>
                            </DetailBlock>
                          )}
                          {s.timeline && (
                            <DetailBlock label="Timeline">
                              <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>{s.timeline}</div>
                            </DetailBlock>
                          )}
                        </div>
                      )}

                      {s.documentsNeeded.length > 0 && (
                        <DetailBlock label="Documents needed">
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {s.documentsNeeded.map((doc, i) => <Pill key={i}>{doc}</Pill>)}
                          </div>
                        </DetailBlock>
                      )}

                      {s.steps.length > 0 && (
                        <DetailBlock label="Steps">
                          <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                            {s.steps.map((step, i) => (
                              <li key={i} className="ftp-body">{step}</li>
                            ))}
                          </ol>
                        </DetailBlock>
                      )}

                      {s.tips && (
                        <DetailBlock label="Tip">
                          <p className="ftp-body" style={{ margin: 0 }}>{s.tips}</p>
                        </DetailBlock>
                      )}

                      {s.onlineUrl && (
                        <div style={{ marginTop: 12 }}>
                          <ToolbarButton icon={ExternalLink} href={s.onlineUrl} external>
                            Apply Online
                          </ToolbarButton>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </ul>
        </Section>
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
