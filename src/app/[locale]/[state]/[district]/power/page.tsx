/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Power Outages — Design v4 "Rang" module page (docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: usePower() → the 30 newest outage notices, newest start first.
//  An outage with no endTime is "ongoing". We never call it "Live": the
//  notice comes from the DISCOM when it publishes, so each row shows when
//  it started and the stat tiles carry the date of the newest notice.
//
//  Pictures (built only from the notices on this page):
//    1. one light bulb per notice (or ten, scaled, when there are many);
//       a lit bulb is a cut that has ended;
//    2. the longest cuts that have ended, as ranked bars in hours, drawn
//       only when two or more cuts have a published length.
//
//  Text: every sentence comes from the "page_power" messages; dates and
//  numbers go through useFormat(). Area names and reasons are data from
//  the notices and stay as published.
"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use } from "react";
import { useTranslations } from "next-intl";
import { Zap, Clock } from "lucide-react";
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
  AsOfText,
} from "@/components/district/ui";
import { ChartCard, Explainer, Pictogram } from "@/components/district/visuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleNews from "@/components/district/ModuleNews";
import { ModulePage, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { RankBars } from "@/components/district/daily-services/BreakdownVisuals";
import { useDistrictName } from "@/components/district/daily-services/district-name";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { useFormat, useModuleText } from "@/i18n/client";

/** Up to this many notices, the picture shows one bulb per notice. */
const ONE_BULB_EACH_MAX = 12;

/** How many of the longest cuts the ranked bars show. */
const LONGEST_SHOWN = 5;

const DATE_TIME: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" };

/** One outage row. `ongoing` switches the status pill and the time line. */
function OutageRow({ o, ongoing }: { o: PowerOutage; ongoing: boolean }) {
  const t = useTranslations("page_power");
  const f = useFormat();
  const when = (iso: string) => f.date(iso, DATE_TIME);
  return (
    <Card as="li" padding={14}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0 }}>
          <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 36, height: 36, fontSize: 18, borderRadius: 12 }}>
            {ongoing ? "🔌" : "💡"}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span className="ftp-title">{o.area}</span>
              {ongoing ? <Pill tone="warn" dot>{t("row.ongoing")}</Pill> : <Pill tone="live">{t("row.resolved")}</Pill>}
            </div>
            {o.reason && (
              <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ftp-text-2)", marginTop: 2 }}>{t("row.reason", { reason: o.reason })}</div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)", marginTop: 4, flexWrap: "wrap" }}>
              <Clock size={12} aria-hidden />
              <span className="ftp-num" suppressHydrationWarning>
                {ongoing
                  ? t("row.started", { time: when(o.startTime) })
                  : t("row.span", { start: when(o.startTime), end: o.endTime ? when(o.endTime) : "—" })}
              </span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "end", flexShrink: 0 }}>
          {!ongoing && o.durationHours ? (
            <>
              <div className="ftp-num" style={{ fontSize: 16, lineHeight: "22px", color: "var(--hue-deep)" }}>
                {t("row.hours", { h: f.number(o.durationHours, { maximumFractionDigits: 1 }) })}
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)" }}>{t("row.duration")}</div>
            </>
          ) : null}
          {o.affectedHouseholds ? (
            <div style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)", marginTop: 2 }}>
              {t("row.households", { count: o.affectedHouseholds, n: f.number(o.affectedHouseholds) })}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function PowerPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_power");
  const f = useFormat();
  const mt = useModuleText();
  const districtName = useDistrictName(state, district);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = usePower(district, state);

  const outages = data?.data ?? [];
  const active = outages.filter((o) => !o.endTime);
  const resolved = outages.filter((o) => o.endTime);
  const totalAffected = active.reduce((s, o) => s + (o.affectedHouseholds ?? 0), 0);
  // Ongoing cuts whose notices give no household count: show "—", not a fake 0.
  const activeHouseholdsUnknown = active.length > 0 && !active.some((o) => o.affectedHouseholds);
  const withDuration = outages.filter((o) => o.durationHours);
  const avgDuration = withDuration.reduce((s, o) => s + (o.durationHours ?? 0), 0) / (withDuration.length || 1);
  // Newest notice we hold — the "as of" for every tile on this page.
  const newestNotice = outages[0]?.startTime ?? null;

  // Picture 1: one bulb per notice when there are few, else ten scaled.
  const oneEach = outages.length <= ONE_BULB_EACH_MAX;
  const bulbsTotal = oneEach ? outages.length : 10;
  const bulbsLit = oneEach ? resolved.length : (resolved.length / Math.max(1, outages.length)) * 10;
  const bulbsLabel = oneEach
    ? t("picture.bulbsEach", { ended: resolved.length, total: outages.length })
    : t("picture.bulbsScaled", { n: Math.round(bulbsLit) });

  // Picture 2: the longest cuts that have ended (published length only).
  const hours = (h: number) => f.number(h, { maximumFractionDigits: 1 });
  const longest = resolved
    .filter((o) => (o.durationHours ?? 0) > 0)
    .sort((a, b) => (b.durationHours ?? 0) - (a.durationHours ?? 0))
    .slice(0, LONGEST_SHOWN)
    .map((o) => ({
      key: o.id,
      label: o.area,
      sub: f.date(o.startTime, { day: "numeric", month: "short", year: "numeric" }),
      value: o.durationHours ?? 0,
      display: t("row.hours", { h: hours(o.durationHours ?? 0) }),
    }));

  const listStyle = { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" as const, gap: 8 };
  const bNum = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;
  const b = (c: React.ReactNode) => <strong>{c}</strong>;

  return (
    <ModulePage>
      <PageHeader
        icon={Zap}
        title={t("title")}
        description={t("description")}
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
            <StatTile emoji="🔌" label={t("tiles.active")} value={f.number(active.length)} asOf={newestNotice} />
            <StatTile
              emoji="🏠"
              label={t("tiles.households")}
              value={activeHouseholdsUnknown ? "—" : f.number(totalAffected)}
              sub={activeHouseholdsUnknown ? t("tiles.householdsUnknown") : undefined}
              asOf={newestNotice}
            />
            <StatTile
              emoji="✅"
              label={t("tiles.resolved")}
              value={f.number(resolved.length)}
              sub={t("tiles.resolvedSub", { n: f.number(outages.length) })}
              asOf={newestNotice}
            />
            <StatTile
              emoji="⏱️"
              label={t("tiles.avg")}
              value={withDuration.length > 0 ? hours(avgDuration) : "—"}
              unit={withDuration.length > 0 ? t("tiles.hoursUnit") : undefined}
              sub={withDuration.length > 0 ? undefined : t("tiles.avgNone")}
              asOf={newestNotice}
            />
          </StatStrip>

          {/* Picture 1: lit bulbs are cuts that have ended. */}
          <Card tinted padding={18} style={{ marginTop: 16 }}>
            <Explainer emoji="💡">
              {t.rich("picture.simple", { total: outages.length, ended: resolved.length, ongoing: active.length, b: bNum })}
            </Explainer>
            <Pictogram filled={bulbsLit} total={bulbsTotal} emoji="💡" label={bulbsLabel} />
            <div style={{ marginTop: 8 }}>
              <AsOfText asOf={newestNotice} prefix={t("picture.newest")} />
            </div>
          </Card>

          {/* Picture 2: the longest cuts, only with two or more lengths. */}
          {longest.length >= 2 && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title={t("longest.title")}
                emoji="⏳"
                units={t("longest.units")}
                simple={t.rich("longest.simple", { area: longest[0].label, hours: hours(longest[0].value), b })}
                asOf={newestNotice}
                table={longest.map((l) => ({ label: `${l.label}, ${l.sub}`, value: l.display }))}
              >
                <RankBars items={longest} ariaLabel={t("longest.aria")} />
              </ChartCard>
            </div>
          )}

          {active.length > 0 ? (
            <Section title={t("sections.active")} emoji="🔌">
              <ul style={listStyle}>
                {active.map((o) => <OutageRow key={o.id} o={o} ongoing />)}
              </ul>
            </Section>
          ) : (
            <div style={{ marginTop: 24 }}>
              <EmptyState emoji="💡" title={t("empty.title")} body={t("empty.body")} />
            </div>
          )}

          {resolved.length > 0 && (
            <Section title={t("sections.history")} emoji="🗓️">
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
        moduleLabel={mt.label("power")}
        shareText={
          outages.length > 0
            ? t("share.withData", { district: districtName, active: active.length, resolved: resolved.length })
            : t("share.noData", { district: districtName })
        }
      />
    </ModulePage>
  );
}

export default function PowerPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("power")}>
      <PowerPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
