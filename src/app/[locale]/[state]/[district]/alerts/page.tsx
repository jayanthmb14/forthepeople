/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Local Alerts — Design v3 module page (CONCEPT-v3 §5)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useAlerts() → active alerts, most severe first, then newest.
//  The old unconditional "Live" tag is gone: the header pill and the stat
//  tiles use the newest alert's createdAt, and every alert shows when it
//  was posted. Severity is shown as a Pill (colour as text on a tint),
//  never as a coloured stripe or box.
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
import { ModulePage, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
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

      <AIInsightCard module="alerts" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && (
        <>
          <StatStrip cols={4}>
            <StatTile label="Active alerts" value={alerts.length} icon={Bell} asOf={newest} />
            <StatTile label="Critical" value={critical} asOf={newest} />
            <StatTile label="High priority" value={high} asOf={newest} />
            <StatTile label="Alert types" value={byType.length} asOf={newest} />
          </StatStrip>

          {alerts.length === 0 ? (
            <div style={{ marginTop: 24 }}>
              <EmptyState title="No active alerts" body="All clear for the district" />
            </div>
          ) : (
            <Section title="Active alerts">
              {/* Count per alert type. */}
              {byType.length > 1 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {byType.map(([type, count]) => (
                    <Pill key={type}>
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
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                        <SeverityBadge severity={a.severity} />
                        <Pill>{formatTypeLabel(a.type)}</Pill>
                        {dateRange && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                            <CalendarDays size={12} aria-hidden /> {dateRange}
                          </span>
                        )}
                      </div>
                      <h3 className="ftp-title">{a.title}</h3>
                      {a.titleLocal && <div lang="und" style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{a.titleLocal}</div>}
                      <p className="ftp-body" style={{ margin: "4px 0 0" }}>{a.description}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
                        {a.location && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                            <MapPin size={12} aria-hidden /> {a.location}
                          </span>
                        )}
                        <AsOfText asOf={a.createdAt} prefix="Posted" />
                      </div>
                    </Card>
                  );
                })}
              </ul>
            </Section>
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
