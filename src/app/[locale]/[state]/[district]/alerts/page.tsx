/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Local Alerts — Design v4 "Rang" module page (docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useAlerts() → active alerts, most severe first, then newest.
//  The old unconditional "Live" tag is gone: the header pill and the stat
//  tiles use the newest alert's createdAt, and every alert shows when it
//  was posted. Severity is shown as a Pill (colour as text on a tint),
//  never as a coloured stripe or box.
//
//  v4 look: emoji StatTiles, then the picture — an "In simple words" line
//  and one symbol per active alert (🚨 critical, ⚠️ high, 🔔 the rest), in
//  the same most-severe-first order as the list. Accents come from the
//  page hue (rose for alerts); severity pills keep their semantic colours.
"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleNews from "@/components/district/ModuleNews";
import { use } from "react";
import { Bell, CalendarDays, MapPin } from "lucide-react";
import { useAlerts } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  Section,
  Card,
  Pill,
  StatTile,
  StatStrip,
  SeverityBadge,
  LoadingShell,
  ErrorBlock,
  EmptyState,
  AsOfText,
} from "@/components/district/ui";
import { Explainer } from "@/components/district/visuals";
import { ModulePage, ModuleSummary, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

function formatDateRange(start?: string | null, end?: string | null) {
  if (!start) return null;
  const s = new Date(start).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  if (!end) return `From ${s}`;
  const e = new Date(end).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  return `${s} – ${e}`;
}

// "water_supply" → "Water Supply" for display
const formatTypeLabel = (raw: string) =>
  raw.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Pill colours taken from the page hue instead of the neutral grey. */
const HUE_PILL: React.CSSProperties = { background: "var(--hue-tint)", color: "var(--hue-deep)" };

/** One emoji per alert, from its free-text type; 📢 when nothing matches. */
function alertTypeEmoji(type: string): string {
  const t = type.toLowerCase();
  if (/flood|cyclone/.test(t)) return "🌊";
  if (/rain|storm|thunder|weather|heat|cold/.test(t)) return "⛈️";
  if (/water/.test(t)) return "🚰";
  if (/power|electric/.test(t)) return "🔌";
  if (/traffic|road|transport/.test(t)) return "🚦";
  if (/health|disease|outbreak|dengue|covid/.test(t)) return "🏥";
  if (/fire/.test(t)) return "🔥";
  if (/exam|school/.test(t)) return "🏫";
  return "📢";
}

/**
 * Symbol for one alert in the picture, by severity. Matches exactly the
 * same values the Critical / High priority tiles count, so the picture and
 * the tiles always agree.
 */
const SEVERITY_SYMBOLS = [
  { key: "critical", emoji: "🚨", label: "Critical" },
  { key: "high", emoji: "⚠️", label: "High priority" },
  { key: "other", emoji: "🔔", label: "Other" },
] as const;

function severityEmoji(severity: string): string {
  if (severity === "critical") return SEVERITY_SYMBOLS[0].emoji;
  if (severity === "high") return SEVERITY_SYMBOLS[1].emoji;
  return SEVERITY_SYMBOLS[2].emoji;
}

/** How many alert symbols the picture draws before "+N more". */
const MAX_SYMBOLS = 20;

function AlertsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useAlerts(district, state);

  const alerts = data?.data ?? [];
  const critical = alerts.filter((a) => a.severity === "critical").length;
  const high = alerts.filter((a) => a.severity === "high").length;

  const byType = Object.entries(
    alerts.reduce((acc: Record<string, number>, a) => {
      acc[a.type] = (acc[a.type] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  // Newest alert posted (ISO strings sort correctly as text).
  const newest = alerts.reduce<string | null>((m, a) => (!m || a.createdAt > m ? a.createdAt : m), null);

  return (
    <ModulePage>
      <PageHeader
        icon={Bell}
        title="Local Alerts"
        description="Active alerts and advisories for the district"
        backHref={base}
        accent={getModuleAccent("alerts")}
        freshness={newest ? { asOf: newest } : undefined}
      />

      <ModuleSummary>
        Active alerts and advisories for this district, such as weather warnings, water or power cuts and public
        health notices. Each alert shows how serious it is, where it applies, the dates it covers and when it was
        posted.
      </ModuleSummary>

      <AIInsightCard module="alerts" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && (
        <>
          <StatStrip cols={4}>
            <StatTile emoji="🔔" label="Active alerts" value={alerts.length} asOf={newest} />
            <StatTile emoji="🚨" label="Critical" value={critical} asOf={newest} />
            <StatTile emoji="⚠️" label="High priority" value={high} asOf={newest} />
            <StatTile emoji="🗂️" label="Alert types" value={byType.length} asOf={newest} />
          </StatStrip>

          {alerts.length === 0 ? (
            <div style={{ marginTop: 24 }}>
              <EmptyState
                emoji="🔕"
                title="No active alerts right now."
                body="Advisories from IMD, the district administration and NDMA appear here when they are published."
              />
            </div>
          ) : (
            <>
              {/* The picture: one symbol per active alert, most severe first,
                  with the same counts as the tiles above in one sentence. */}
              <Card tinted padding={18} style={{ marginTop: 16 }}>
                <Explainer title="In simple words" emoji="📢">
                  <strong>{alerts.length}</strong> {alerts.length === 1 ? "alert is" : "alerts are"} active in this district.{" "}
                  {critical + high > 0 ? (
                    <>
                      <strong>{critical}</strong> {critical === 1 ? "is" : "are"} critical and <strong>{high}</strong>{" "}
                      {high === 1 ? "is" : "are"} high priority.
                    </>
                  ) : (
                    <>None of them is critical or high priority.</>
                  )}
                </Explainer>
                <figure style={{ margin: 0 }}>
                  <div
                    role="img"
                    aria-label={`${alerts.length} active alerts: ${critical} critical, ${high} high priority, ${alerts.length - critical - high} other.`}
                    style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}
                  >
                    {alerts.slice(0, MAX_SYMBOLS).map((a, i) => (
                      <span
                        key={a.id}
                        aria-hidden
                        className="ftp-pop"
                        style={{
                          display: "inline-flex",
                          width: 38,
                          height: 38,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 12,
                          background: "var(--hue-tint)",
                          ["--i" as string]: i,
                        }}
                      >
                        <span className="ftp-emoji" style={{ fontSize: 22 }}>
                          {severityEmoji(a.severity)}
                        </span>
                      </span>
                    ))}
                    {alerts.length > MAX_SYMBOLS && (
                      <span className="ftp-num" style={{ fontSize: 13, color: "var(--hue-deep)", marginLeft: 4 }}>
                        +{alerts.length - MAX_SYMBOLS} more
                      </span>
                    )}
                  </div>
                  <figcaption style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
                    <span>Each symbol is one alert.</span>
                    {SEVERITY_SYMBOLS.map((s) => (
                      <span key={s.key} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <span className="ftp-emoji" aria-hidden>
                          {s.emoji}
                        </span>
                        {s.label}
                      </span>
                    ))}
                  </figcaption>
                </figure>
              </Card>

              <Section title="Active alerts" emoji="📢">
                {/* Count per alert type. */}
                {byType.length > 1 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {byType.map(([type, count]) => (
                      <Pill key={type} style={HUE_PILL}>
                        {formatTypeLabel(type)} <span className="ftp-num">({count})</span>
                      </Pill>
                    ))}
                  </div>
                )}

                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {alerts.map((a) => {
                    const dateRange = formatDateRange(a.startDate, a.endDate);
                    return (
                      <Card key={a.id} as="li">
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 40, height: 40, fontSize: 20, borderRadius: 12 }}>
                            {alertTypeEmoji(a.type)}
                          </span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                              <SeverityBadge severity={a.severity} />
                              <Pill style={HUE_PILL}>{formatTypeLabel(a.type)}</Pill>
                              {dateRange && (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                                  <CalendarDays size={12} aria-hidden style={{ color: "var(--hue)" }} /> {dateRange}
                                </span>
                              )}
                            </div>
                            <h3 className="ftp-title">{a.title}</h3>
                            {a.titleLocal && <div lang="und" style={{ fontSize: 13, lineHeight: "20px", color: "var(--hue-deep)" }}>{a.titleLocal}</div>}
                            <p className="ftp-body" style={{ margin: "4px 0 0", fontSize: 14, lineHeight: "21px" }}>{a.description}</p>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
                              {a.location && (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                                  <MapPin size={12} aria-hidden style={{ color: "var(--hue)" }} /> {a.location}
                                </span>
                              )}
                              <AsOfText asOf={a.createdAt} prefix="Posted" />
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </ul>
              </Section>
            </>
          )}
        </>
      )}

      <ModuleSources module="alerts" state={state} />
      <ModuleNews district={district} state={state} locale={locale} module="alerts" />
      <ModuleToolbar
        locale={locale}
        district={district}
        moduleSlug="alerts"
        moduleLabel="Local Alerts"
        shareText={
          alerts.length > 0
            ? `${district} alerts: ${alerts.length} active (${critical} critical, ${high} high priority)`
            : `No active alerts for ${district}`
        }
      />
    </ModulePage>
  );
}

export default function AlertsPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Alerts">
      <AlertsPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
