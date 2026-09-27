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
//  the same most-severe-first order as the list — then a ring of the kinds
//  of alert (weather, water, power…). Accents come from the page hue (rose
//  for alerts); severity pills keep their semantic colours. With no active
//  alert the page shows one honest empty state and no zero tiles.
//
//  Text: every word comes from the "page_alerts" messages. Alert titles,
//  descriptions and places are data and stay as published; alert kinds
//  are free text, so known ones (water_supply, power_cut…) get a plain
//  translated name (types.*) and the rest are shown as written.
"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleNews from "@/components/district/ModuleNews";
import { use } from "react";
import { useTranslations } from "next-intl";
import { Bell, CalendarDays, MapPin } from "lucide-react";
import { useAlerts } from "@/hooks/useRealtimeData";
import { useFormat, useModuleText } from "@/i18n/client";
import { scriptLang } from "@/lib/utils/script-lang";
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
  type Tone,
} from "@/components/district/ui";
import { ChartCard, Explainer } from "@/components/district/visuals";
import { ModulePage, ModuleSummary, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { HueDonut, MUTED_SHADE, type DonutSegment } from "@/components/district/daily-services/HueCharts";
import { useDistrictName } from "@/components/district/daily-services/useDistrictName";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

/** Pill colours taken from the page hue instead of the neutral grey. */
const HUE_PILL: React.CSSProperties = { background: "var(--hue-tint)", color: "var(--hue-deep)" };

/** Severity → semantic pill tone (same mapping as the kit's SeverityBadge). */
const SEVERITY_TONE: Record<string, Tone> = { critical: "danger", high: "warn", medium: "brand", low: "live", info: "neutral" };

/** How many kinds the ring names before "Other kinds". */
const TOP_KINDS = 5;

const bold = (c: React.ReactNode) => <strong>{c}</strong>;

/** "water_supply" / "Water Supply" → "water_supply" (the types.* key shape). */
const typeKey = (raw: string) => raw.trim().toLowerCase().replace(/[\s-]+/g, "_");

/** "water_supply" → "Water supply" for kinds with no translation (sentence case). */
const sentenceCase = (raw: string) => {
  const s = raw.replace(/[_-]+/g, " ").trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

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
  { key: "critical", emoji: "🚨" },
  { key: "high", emoji: "⚠️" },
  { key: "other", emoji: "🔔" },
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
  const t = useTranslations("page_alerts");
  const f = useFormat();
  const mt = useModuleText();
  const districtName = useDistrictName(state, district);
  const { data, isLoading, error } = useAlerts(district, state);

  const n = (v: number) => f.number(v);
  const pct = (share: number) => f.number(share, { style: "percent", maximumFractionDigits: 0 });
  const typeLabel = (raw: string) => (t.has(`types.${typeKey(raw)}`) ? t(`types.${typeKey(raw)}`) : sentenceCase(raw));
  const severityLabel = (s: string) => (t.has(`severity.${s.toLowerCase()}`) ? t(`severity.${s.toLowerCase()}`) : s);
  const shortDate = (iso: string) => f.date(iso, { day: "2-digit", month: "short" });
  const dateRange = (start?: string | null, end?: string | null) => {
    if (!start) return null;
    return end ? t("list.range", { start: shortDate(start), end: shortDate(end) }) : t("list.from", { start: shortDate(start) });
  };

  const alerts = data?.data ?? [];
  const critical = alerts.filter((a) => a.severity === "critical").length;
  const high = alerts.filter((a) => a.severity === "high").length;

  // Alerts per kind, biggest first.
  const byType = Object.entries(
    alerts.reduce((acc: Record<string, number>, a) => {
      acc[a.type] = (acc[a.type] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const otherKinds = byType.slice(TOP_KINDS).reduce((s, [, c]) => s + c, 0);
  const kindSegments: DonutSegment[] = [
    ...byType.slice(0, TOP_KINDS).map(([type, count]) => ({ key: type, label: typeLabel(type), value: count, display: n(count), emoji: alertTypeEmoji(type) })),
    ...(otherKinds > 0 ? [{ key: "__other", label: t("kinds.other"), value: otherKinds, display: n(otherKinds), emoji: "📢", color: MUTED_SHADE }] : []),
  ];

  // Newest alert posted (ISO strings sort correctly as text).
  const newest = alerts.reduce<string | null>((m, a) => (!m || a.createdAt > m ? a.createdAt : m), null);

  return (
    <ModulePage>
      <PageHeader
        icon={Bell}
        title={mt.label("alerts")}
        description={t("description")}
        backHref={base}
        accent={getModuleAccent("alerts")}
        freshness={newest ? { asOf: newest } : undefined}
      />

      <ModuleSummary>{t("summary", { district: districtName })}</ModuleSummary>

      <AIInsightCard module="alerts" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && alerts.length === 0 && (
        <div style={{ marginTop: 8 }}>
          <EmptyState emoji="🔕" title={t("empty.title")} body={t("empty.body")} />
        </div>
      )}

      {!isLoading && !error && alerts.length > 0 && (
        <>
          <StatStrip cols={4}>
            <StatTile emoji="🔔" label={t("tiles.active")} value={n(alerts.length)} asOf={newest} />
            <StatTile emoji="🚨" label={t("tiles.critical")} value={n(critical)} asOf={newest} />
            <StatTile emoji="⚠️" label={t("tiles.high")} value={n(high)} asOf={newest} />
            <StatTile emoji="🗂️" label={t("tiles.types")} value={n(byType.length)} asOf={newest} />
          </StatStrip>

          {/* The picture: one symbol per active alert, most severe first,
              with the same counts as the tiles above in one sentence. */}
          <Card tinted padding={18} style={{ marginTop: 16 }}>
            <Explainer emoji="📢">
              {t.rich("explainer", { total: alerts.length, district: districtName, b: bold })}{" "}
              {critical + high > 0 ? t.rich("explainerSevere", { critical, high, b: bold }) : t("explainerCalm")}
            </Explainer>
            <figure style={{ margin: 0 }}>
              <div
                role="img"
                aria-label={t("symbols.aria", { total: n(alerts.length), critical: n(critical), high: n(high), other: n(alerts.length - critical - high) })}
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
                  <span className="ftp-num" style={{ fontSize: 13, color: "var(--hue-deep)", marginInlineStart: 4 }}>
                    {t("symbols.more", { n: n(alerts.length - MAX_SYMBOLS) })}
                  </span>
                )}
              </div>
              <figcaption style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
                <span>{t("symbols.each")}</span>
                {SEVERITY_SYMBOLS.map((s) => (
                  <span key={s.key} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <span className="ftp-emoji" aria-hidden>
                      {s.emoji}
                    </span>
                    {t(`symbols.${s.key}`)}
                  </span>
                ))}
              </figcaption>
            </figure>
          </Card>

          {/* Kinds of alert as a ring; needs two alerts of two kinds to say anything. */}
          {byType.length > 1 && (
            <div style={{ marginTop: 16 }}>
              <ChartCard
                title={t("kinds.title")}
                emoji="🗂️"
                units={t("kinds.units")}
                simple={t.rich("kinds.simple", { type: typeLabel(byType[0][0]), n: n(byType[0][1]), total: n(alerts.length), b: bold })}
                asOf={newest}
                table={kindSegments.map((s) => ({ label: s.label, value: s.display }))}
              >
                <HueDonut
                  segments={kindSegments}
                  center={n(alerts.length)}
                  centerSub={t("tiles.active")}
                  ariaLabel={t("kinds.aria", { total: n(alerts.length) })}
                  percentOf={pct}
                />
              </ChartCard>
            </div>
          )}

          <Section title={t("list.title")} emoji="📢">
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {alerts.map((a) => {
                const range = dateRange(a.startDate, a.endDate);
                return (
                  <Card key={a.id} as="li">
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 40, height: 40, fontSize: 20, borderRadius: 12 }}>
                        {alertTypeEmoji(a.type)}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                          <Pill tone={SEVERITY_TONE[a.severity.toLowerCase()] ?? "neutral"}>{severityLabel(a.severity)}</Pill>
                          <Pill style={HUE_PILL}>{typeLabel(a.type)}</Pill>
                          {range && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                              <CalendarDays size={12} aria-hidden style={{ color: "var(--hue)" }} /> {range}
                            </span>
                          )}
                        </div>
                        <h3 className="ftp-title">{a.title}</h3>
                        {a.titleLocal && (
                          <div lang={scriptLang(a.titleLocal)} style={{ fontSize: 13, lineHeight: "20px", color: "var(--hue-deep)" }}>
                            {a.titleLocal}
                          </div>
                        )}
                        <p className="ftp-body" style={{ margin: "4px 0 0", fontSize: 14, lineHeight: "21px" }}>{a.description}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
                          {a.location && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                              <MapPin size={12} aria-hidden style={{ color: "var(--hue)" }} /> {a.location}
                            </span>
                          )}
                          <AsOfText asOf={a.createdAt} prefix="Published" />
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

      <ModuleSources module="alerts" state={state} />
      <ModuleNews district={district} state={state} locale={locale} module="alerts" />
      <ModuleToolbar
        locale={locale}
        district={district}
        moduleSlug="alerts"
        moduleLabel={mt.label("alerts")}
        shareText={
          alerts.length > 0
            ? t("share", { district: districtName, total: n(alerts.length), critical: n(critical), high: n(high) })
            : t("shareEmpty", { district: districtName })
        }
      />
    </ModulePage>
  );
}

export default function AlertsPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("alerts")}>
      <AlertsPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
