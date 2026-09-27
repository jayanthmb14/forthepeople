/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Power Outages — Design v3 module page (CONCEPT-v3 §5)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: usePower() → outage notices, newest start time first.
//  An outage with no endTime is "ongoing". We never call it "Live": the
//  notice comes from the DISCOM when it publishes, so each row shows when
//  it started and the stat tiles carry the date of the newest notice.
"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use } from "react";
import { Zap, Clock, MapPin } from "lucide-react";
import { usePower } from "@/hooks/useRealtimeData";
import type { PowerOutage } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  Section,
  Card,
  Pill,
  StatTile,
  StatStrip,
  LoadingShell,
  ErrorBlock,
  EmptyState,
} from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleNews from "@/components/district/ModuleNews";
import { ModulePage, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** One outage row. `ongoing` switches the status pill and the time line. */
function OutageRow({ o, ongoing }: { o: PowerOutage; ongoing: boolean }) {
  return (
    <Card as="li" padding={14}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <MapPin size={14} aria-hidden style={{ color: "var(--ftp-text-2)", flexShrink: 0 }} />
            <span className="ftp-title">{o.area}</span>
            {ongoing ? <Pill tone="warn" dot>Ongoing</Pill> : <Pill tone="live">Resolved</Pill>}
          </div>
          {o.reason && (
            <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", marginTop: 2 }}>Reason: {o.reason}</div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 4, flexWrap: "wrap" }}>
            <Clock size={11} aria-hidden />
            {ongoing ? (
              <>Started: <span className="ftp-num">{formatDate(o.startTime)}</span></>
            ) : (
              <span className="ftp-num">{formatDate(o.startTime)} → {o.endTime ? formatDate(o.endTime) : "—"}</span>
            )}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {!ongoing && o.durationHours ? (
            <>
              <div className="ftp-num" style={{ fontSize: 15, lineHeight: "22px" }}>{o.durationHours.toFixed(1)}h</div>
              <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>duration</div>
            </>
          ) : null}
          {o.affectedHouseholds ? (
            <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 2 }}>
              <span className="ftp-num">{o.affectedHouseholds.toLocaleString("en-IN")}</span> households
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function PowerPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = usePower(district, state);

  const outages = data?.data ?? [];
  const active = outages.filter((o) => !o.endTime);
  const resolved = outages.filter((o) => o.endTime);
  const totalAffected = active.reduce((s, o) => s + (o.affectedHouseholds ?? 0), 0);
  const avgDuration = outages.filter(o => o.durationHours).reduce((s, o) => s + (o.durationHours ?? 0), 0) / (outages.filter(o => o.durationHours).length || 1);
  // Newest notice we hold — the "as of" for every tile on this page.
  const newestNotice = outages[0]?.startTime ?? null;

  const listStyle = { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" as const, gap: 8 };

  return (
    <ModulePage>
      <PageHeader
        icon={Zap}
        title="Power Outages"
        description="Planned and unplanned power cut notifications and history"
        backHref={base}
        accent={getModuleAccent("power")}
      />

      <AIInsightCard module="power" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && outages.length === 0 && (
        <NoDataCard module="power" district={district} state={state} />
      )}

      {!isLoading && outages.length > 0 && (
        <>
          <StatStrip cols={4}>
            <StatTile label="Active outages" value={active.length} icon={Zap} asOf={newestNotice} />
            <StatTile label="Affected households" value={totalAffected.toLocaleString("en-IN")} asOf={newestNotice} />
            <StatTile label="Resolved (30d)" value={resolved.length} asOf={newestNotice} />
            <StatTile label="Avg duration" value={avgDuration.toFixed(1)} unit="h" asOf={newestNotice} />
          </StatStrip>

          {active.length > 0 ? (
            <Section title="Active outages">
              <ul style={listStyle}>
                {active.map((o) => <OutageRow key={o.id} o={o} ongoing />)}
              </ul>
            </Section>
          ) : (
            <div style={{ marginTop: 24 }}>
              <EmptyState title="No active power outages" body="Power supply is normal across all areas" />
            </div>
          )}

          {resolved.length > 0 && (
            <Section title="Recent outage history">
              <ul style={listStyle}>
                {resolved.map((o) => <OutageRow key={o.id} o={o} ongoing={false} />)}
              </ul>
            </Section>
          )}
        </>
      )}

      <ModuleSources module="power" state={state} />
      <ModuleNews district={district} state={state} locale={locale} module="power" />
      <ModuleToolbar
        locale={locale}
        district={district}
        moduleSlug="power"
        moduleLabel="Power Outages"
        shareText={
          outages.length > 0
            ? `Power in ${district}: ${active.length} active outage${active.length === 1 ? "" : "s"}, ${resolved.length} resolved recently`
            : `Power outage data for ${district}`
        }
      />
    </ModulePage>
  );
}

export default function PowerPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Power">
      <PowerPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
