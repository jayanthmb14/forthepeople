/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Where our data comes from — docs/LAYOUT.md page recipe
// ═══════════════════════════════════════════════════════════════════════
//  The question: "Where does each dataset come from, how does it reach
//  the site, and how old is the newest part of it?"
//
//    PageHeader → Explainer (how many kinds of data, how many arrive
//    automatically, how many are current) → 4 StatTiles → ONE picture: a
//    bar split by how the data reaches us → the datasets in three lists
//    (collected automatically · entered by hand or found in the news ·
//    fixed publications), each row with its source, how it reaches us and
//    the date of the newest data; old data says "N days old" plainly →
//    datasets not available for this district yet → our promise → Share.
//    Tapping a row opens a DetailSheet (source, how it reaches us, newest
//    data, rows we hold, what "current" means for it; Open the source,
//    Open the page, See its changes).
//
//  Truth comes from two places, never from hopeful labels:
//    • how each dataset reaches us: src/lib/constants/dataset-collection.ts
//      (a dataset is "automatic" only when a vercel.json cron collects it;
//      tests/dataset-collection.test.ts enforces that);
//    • rows and newest date per district: GET /api/data/dataset-dates.
//  Source names are the publishers' own names (English, lang="en").
//  Words: src/dictionaries/<locale>/page_data-sources.json.
"use client";

import type React from "react";
import { use, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ChevronRight, Database } from "lucide-react";
import { Card, EmptyState, ErrorBlock, LoadingShell, ModulePage, PageHeader, Section, StatStrip, StatTile } from "@/components/district/ui";
import { Explainer } from "@/components/district/visuals";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import { SheetAction } from "@/components/accountability/AccountabilityKit";
import { PageActions, ageInDays, isOlderThan, useClientNow } from "@/components/district/page-kit";
import {
  DATASETS,
  collectionFor,
  type Collection,
  type DatasetDate,
  type DatasetDatesPayload,
  type DatasetInfo,
} from "@/lib/constants/dataset-collection";
import { getModuleSources } from "@/lib/constants/state-config";
import { hueClass } from "@/lib/design/hues";
import { useDistrictName, useFormat, useModuleText } from "@/i18n/client";

/** Where a dataset's source names come from when the registry key differs from the page slug. */
const SOURCE_MODULE: Record<string, string> = { dams: "water", soil: "farm", budget: "budget" };
/** Publisher names for datasets whose page lists more sources than this dataset uses. */
const OWN_SOURCES: Record<string, string[]> = {
  weather: ["OpenWeatherMap"],
  rainfall: ["India Meteorological Department (IMD)", "State rain monitoring centres (e.g. KSNDMC)"],
};

/** Datasets whose period is a fiscal year ("2024-25"). */
const FISCAL_KEYS = new Set(["budget", "housing"]);
/** A fiscal year's figures count as current for a year after it ends. */
const FY_GRACE_HOURS = 365 * 24;
/** Source names shown on a row before "+N" (the sheet lists them all). */
const ROW_SOURCES = 2;

/** The three lists, in order, and which kinds of collection each holds. */
const GROUPS: Array<{ id: "auto" | "hand" | "published"; kinds: Collection[] }> = [
  { id: "auto", kinds: ["auto"] },
  { id: "hand", kinds: ["hand", "news"] },
  { id: "published", kinds: ["published"] },
];

/** Colours of the "how it reaches us" bar (semantic, not module hues). */
const KIND_COLOR: Record<Collection, string> = {
  auto: "var(--ftp-brand)",
  news: "color-mix(in srgb, var(--ftp-brand) 55%, #fff)",
  hand: "color-mix(in srgb, var(--ftp-brand) 32%, #fff)",
  published: "var(--ftp-border-strong)",
};

type Status = "current" | "old" | "noDate" | "period" | "checked";

interface Row {
  info: DatasetInfo;
  kind: Collection;
  date: DatasetDate;
  status: Status;
  days: number;
}

const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

/** Short label for a link: its host name. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function DataSourcesPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_data-sources");
  const f = useFormat();
  const mt = useModuleText();
  const districtName = useDistrictName(state, district);
  const base = `/${locale}/${state}/${district}`;
  const num = (n: number) => f.number(n);
  const now = useClientNow();
  const [openKey, setOpenKey] = useState<string | null>(null);
  // Stable, so the sheet's focus handling does not re-run on every render.
  const closeSheet = useCallback(() => setOpenKey(null), []);

  const { data, isLoading, error } = useQuery<DatasetDatesPayload>({
    queryKey: ["dataset-dates", district],
    queryFn: async () => {
      const res = await fetch(`/api/data/dataset-dates?district=${encodeURIComponent(district)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    staleTime: 5 * 60_000,
  });

  const rows: Row[] = useMemo(() => {
    // Ages need the reader's clock, known only after hydration.
    if (!data || !now) return [];
    return DATASETS.map((info) => {
      const date = data.datasets[info.key] ?? { rows: 0, newest: null, period: null };
      const kind = collectionFor(info, district);
      let days = ageInDays(date.newest, now);
      let status: Status;
      // A budget for a fiscal year that ended more than a year ago is old,
      // however recently we entered it ("2024-25" ends on 31 March 2025).
      const fy = FISCAL_KEYS.has(info.key) && date.period ? /^(\d{4})-\d{2}$/.exec(date.period) : null;
      const fyEnd = fy ? new Date(Date.UTC(Number(fy[1]) + 1, 2, 31)).toISOString() : null;
      if (fyEnd && isOlderThan(fyEnd, FY_GRACE_HOURS, now)) {
        status = "old";
        days = ageInDays(fyEnd, now);
      } else if (info.dateKind === "none") status = "noDate";
      else if (info.dateKind === "period") status = info.maxAgeHours && isOlderThan(date.newest, info.maxAgeHours, now) ? "old" : "period";
      else if (!date.newest) status = "noDate";
      else if (info.maxAgeHours && isOlderThan(date.newest, info.maxAgeHours, now)) status = "old";
      else status = info.dateKind === "checked" ? "checked" : "current";
      return { info, kind, date, status, days };
    });
  }, [data, district, now]);

  /** Data and the clock are both in: statuses and counts are real. */
  const ready = rows.length > 0;
  const withData = rows.filter((r) => r.date.rows > 0);
  const missing = rows.filter((r) => r.date.rows === 0);
  const autoRows = withData.filter((r) => r.kind === "auto");
  const autoCurrent = autoRows.filter((r) => r.status === "current").length;
  const oldCount = withData.filter((r) => r.status === "old").length;
  const byKind = (["auto", "news", "hand", "published"] as Collection[])
    .map((k) => ({ kind: k, n: withData.filter((r) => r.kind === k).length }))
    .filter((x) => x.n > 0);

  const name = (key: string) => t(`datasets.${key}`);
  const sourcesOf = (r: Row): string[] =>
    OWN_SOURCES[r.info.key] ?? (r.info.slug || SOURCE_MODULE[r.info.key] ? getModuleSources(SOURCE_MODULE[r.info.key] ?? (r.info.slug as string), state).sources : []);
  const howLine = (r: Row) => (r.kind === "auto" && r.info.every ? t("how.autoEvery", { every: t(`every.${r.info.every}`) }) : t(`how.${r.kind}`));
  const dayText = (iso: string) => f.date(iso, { day: "numeric", month: "short", year: "numeric" });
  /** Rainfall "2024-12" → "December 2024"; budget/housing "2024-25" → "FY 2024-25"; other periods as published. */
  const periodText = (key: string, p: string) => {
    const ym = /^(\d{4})-(\d{2})$/.exec(p);
    if (key === "rainfall" && ym) return f.date(Date.UTC(Number(ym[1]), Number(ym[2]) - 1, 15), { month: "long", year: "numeric" });
    if (FISCAL_KEYS.has(key)) return t("fiscalYear", { fy: p });
    return p;
  };
  const dateLine = (r: Row): string => {
    if (r.info.dateKind === "none") return t("date.none");
    if (r.info.dateKind === "period") return r.date.period ? t("date.period", { period: periodText(r.info.key, r.date.period) }) : t("date.none");
    if (!r.date.newest) return t("date.none");
    return r.info.dateKind === "checked" ? t("date.checked", { date: dayText(r.date.newest) }) : t("date.reading", { date: dayText(r.date.newest) });
  };
  const statusChip = (r: Row): { text: string; tone: "live" | "warn" | "neutral" } | null => {
    if (!now) return null;
    if (r.status === "current") return { text: t("status.current"), tone: "live" };
    if (r.status === "old") return { text: t("status.old", { n: r.days }), tone: "warn" };
    if (r.status === "noDate") return { text: t("status.noDate"), tone: "neutral" };
    return null;
  };

  const open = openKey ? rows.find((r) => r.info.key === openKey) ?? null : null;

  return (
    <ModulePage>
      <PageHeader
        icon={Database}
        title={mt.label("data-sources")}
        description={mt.description("data-sources")}
        backHref={base}
        freshness={data ? { asOf: data.checkedAt } : undefined}
      />

      {ready && (
        <Explainer>
          {t.rich("explain", { n: withData.length, auto: autoRows.length, district: districtName, b: bold })}{" "}
          {autoRows.length > 0 ? t.rich("explainCurrent", { current: autoCurrent, auto: autoRows.length, b: bold }) : null}
        </Explainer>
      )}

      {(isLoading || (data && !ready)) && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {ready && (
        <>
          <StatStrip>
            <StatTile label={t("tileKinds")} value={num(withData.length)} sub={t("tileKindsSub", { district: districtName })} />
            <StatTile label={t("tileAuto")} value={num(autoRows.length)} sub={t("tileAutoSub")} />
            <StatTile label={t("tileCurrent")} value={t("nOfTotal", { n: num(autoCurrent), total: num(autoRows.length) })} sub={t("tileCurrentSub")} countUp={false} />
            <StatTile label={t("tileOld")} value={num(oldCount)} sub={t("tileOldSub")} />
          </StatStrip>

          {/* ONE picture: how the data reaches us, one bar split by kind. */}
          {withData.length > 0 && (
            <Card padding={18} style={{ marginTop: 16 }}>
              <h2 style={{ margin: "0 0 12px", fontSize: 17, lineHeight: 1.35, fontWeight: 650 }}>{t("barTitle")}</h2>
              <div
                role="img"
                aria-label={byKind.map((x) => `${t(`kind.${x.kind}`)}: ${x.n}`).join(", ")}
                style={{ display: "flex", height: 16, borderRadius: 999, overflow: "hidden", background: "var(--ftp-surface-2)" }}
              >
                {byKind.map((x) => (
                  <span key={x.kind} style={{ width: `${(x.n / withData.length) * 100}%`, background: KIND_COLOR[x.kind] }} />
                ))}
              </div>
              <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))" }}>
                {byKind.map((x) => (
                  <li key={x.kind} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, lineHeight: "19px" }}>
                    <span aria-hidden style={{ width: 12, height: 12, marginTop: 3, borderRadius: 4, background: KIND_COLOR[x.kind], flexShrink: 0 }} />
                    <span>
                      <strong className="ftp-num">{num(x.n)}</strong> {t(`kind.${x.kind}`)}
                      <span style={{ display: "block", color: "var(--ftp-text-2)" }}>{t(`kindHint.${x.kind}`)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {GROUPS.map((g) => {
            const list = withData.filter((r) => g.kinds.includes(r.kind));
            if (list.length === 0) return null;
            return (
              <Section key={g.id} title={t(`group.${g.id}`)}>
                <p className="ftp-body" style={{ margin: "-6px 0 12px", color: "var(--ftp-text-2)", fontSize: 14, lineHeight: "21px" }}>
                  {t(`groupHint.${g.id}`)}
                </p>
                <Card padding={0}>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {list.map((r, i) => {
                      const chip = statusChip(r);
                      const src = sourcesOf(r);
                      return (
                        <li key={r.info.key} className={hueClass(r.info.slug ?? "data-sources")}>
                          <button
                            type="button"
                            aria-haspopup="dialog"
                            onClick={() => setOpenKey(r.info.key)}
                            className="ftp-card-link"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              width: "100%",
                              minHeight: 64,
                              padding: "12px 16px",
                              border: 0,
                              borderTop: i === 0 ? 0 : "1px solid var(--ftp-border)",
                              borderRadius: 0,
                              background: "transparent",
                              font: "inherit",
                              color: "var(--ftp-text)",
                              textAlign: "start",
                              cursor: "pointer",
                            }}
                          >
                            <span aria-hidden style={{ width: 10, height: 10, borderRadius: 999, background: "var(--hue)", flexShrink: 0, alignSelf: "flex-start", marginTop: 6 }} />
                            <span style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 15, lineHeight: "21px", fontWeight: 600 }}>{name(r.info.key)}</span>
                                {chip && <StatusChip tone={chip.tone}>{chip.text}</StatusChip>}
                              </span>
                              {src.length > 0 && (
                                <span lang="en" style={{ display: "block", fontSize: 13, lineHeight: "19px", color: "var(--ftp-text-2)", overflowWrap: "anywhere" }}>
                                  {src.slice(0, ROW_SOURCES).join(" · ")}
                                  {src.length > ROW_SOURCES ? ` +${src.length - ROW_SOURCES}` : ""}
                                </span>
                              )}
                              <span style={{ display: "block", fontSize: 13, lineHeight: "19px", color: "var(--ftp-text-2)" }} suppressHydrationWarning>
                                {howLine(r)} · {dateLine(r)}
                              </span>
                            </span>
                            <ChevronRight size={16} aria-hidden style={{ color: "var(--ftp-text-2)", flexShrink: 0 }} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </Section>
            );
          })}

          {/* Datasets we have nothing for yet in this district — said once, not as empty rows. */}
          {missing.length > 0 && (
            <Section title={t("missingTitle", { district: districtName })}>
              <p className="ftp-body" style={{ margin: "-6px 0 10px", color: "var(--ftp-text-2)", fontSize: 14, lineHeight: "21px" }}>
                {t("missingHint")}
              </p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: "22px" }}>{missing.map((r) => name(r.info.key)).join(" · ")}</p>
            </Section>
          )}

          {withData.length === 0 && <EmptyState title={t("emptyTitle")} body={t("emptyBody", { district: districtName })} />}
        </>
      )}

      {/* Our promise, in four plain lines. */}
      <Card padding={18} style={{ marginTop: 28 }}>
        <h2 style={{ margin: "0 0 10px", fontSize: 17, lineHeight: 1.35, fontWeight: 650 }}>{t("pledgeTitle")}</h2>
        <ul className="ftp-prose" style={{ margin: 0, paddingInlineStart: 20, display: "flex", flexDirection: "column", gap: 6, fontSize: 15, lineHeight: 1.6 }}>
          <li>{t("pledge1")}</li>
          <li>{t("pledge2")}</li>
          <li>{t("pledge3")}</li>
          <li>{t("pledge4")}</li>
        </ul>
        <Link
          href={`${base}/update-log`}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, minHeight: 44, marginTop: 6, fontSize: 14, fontWeight: 600, color: "var(--hue-deep)", textDecoration: "none" }}
        >
          {t("updateLogLink")}
          <ChevronRight size={16} aria-hidden />
        </Link>
      </Card>

      <div style={{ marginTop: 28 }}>
        <PageActions locale={locale} district={district} moduleSlug="data-sources" compare={false} />
      </div>

      {/* Everything about one dataset. */}
      <DetailSheet
        open={open !== null}
        onClose={closeSheet}
        title={open ? name(open.info.key) : ""}
        subtitle={open ? howLine(open) : undefined}
        hueClassName={hueClass(open?.info.slug ?? "data-sources")}
        footer={
          open ? (
            <>
              {open.info.url && (
                <SheetAction href={open.info.url} external>
                  {t("openSource")}
                </SheetAction>
              )}
              {open.info.slug && (
                <SheetAction href={`${base}/${open.info.slug}`} quiet={Boolean(open.info.url)}>
                  {t("openPage", { page: mt.label(open.info.slug) })}
                </SheetAction>
              )}
            </>
          ) : null
        }
      >
        {open && (
          <>
            <DetailList
              rows={[
                { label: t("rowSource"), value: sourcesOf(open).join(" · ") || (open.info.key === "aiSummaries" ? t("aiSource") : null), lang: sourcesOf(open).length ? "en" : undefined },
                { label: t("rowHow"), value: howLine(open) },
                { label: t("rowNewest"), value: <span suppressHydrationWarning>{dateLine(open)}</span> },
                {
                  label: t("rowAge"),
                  value:
                    open.date.newest && open.info.dateKind !== "period" && now ? (
                      <span suppressHydrationWarning>{t("daysAgo", { n: open.days })}</span>
                    ) : null,
                },
                { label: t("rowExpect"), value: open.info.maxAgeHours ? t("expectWithin", { n: Math.round(open.info.maxAgeHours / 24) }) : t("expectEvent") },
                { label: t("rowRows"), value: num(open.date.rows) },
                { label: t("rowLink"), value: open.info.url ? hostOf(open.info.url) : null, lang: "en" },
                ...(open.info.key === "alerts" && open.date.active !== undefined ? [{ label: t("rowActive"), value: num(open.date.active) }] : []),
              ]}
            />
            <p className="ftp-prose" style={{ margin: "14px 0 0", fontSize: 14, lineHeight: "21px", color: "var(--ftp-text)" }}>
              {open.status === "old" ? t("sheetOld", { n: open.days }) : t(`sheetKind.${open.kind}`)}
            </p>
            {open.info.slug && (
              <Link
                href={`${base}/update-log?module=${encodeURIComponent(open.info.slug)}`}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, minHeight: 44, marginTop: 4, fontSize: 14, fontWeight: 600, color: "var(--hue-deep)", textDecoration: "none" }}
              >
                {t("seeChanges")}
                <ChevronRight size={16} aria-hidden />
              </Link>
            )}
          </>
        )}
      </DetailSheet>
    </ModulePage>
  );
}

/** A small status chip: green "Current", amber "160 days old", grey "No date". */
function StatusChip({ tone, children }: { tone: "live" | "warn" | "neutral"; children: React.ReactNode }) {
  const color = tone === "live" ? "var(--ftp-live-text)" : tone === "warn" ? "var(--ftp-warn)" : "var(--ftp-text-2)";
  const bg = tone === "live" ? "var(--ftp-live-tint)" : tone === "warn" ? "var(--ftp-warn-tint)" : "var(--ftp-surface-2)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "1px 8px", borderRadius: 999, background: bg, color, fontSize: 12, lineHeight: "18px", fontWeight: 600, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}
