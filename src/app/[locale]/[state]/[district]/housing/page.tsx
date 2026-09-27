/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Housing schemes — "What housing help can I get, and are the houses
//  actually being built?"  (docs/LAYOUT.md recipe)
// ═══════════════════════════════════════════════════════════════════════
//
//  The answer: "In Mandya, 5,310 of the 6,100 houses planned in FY 2024-25
//  are finished, and 590 more are being built."
//
//  Order: PageHeader → Explainer (the answer) → 4 tiles → the picture
//  (10 houses, N finished + where the planned houses are now) → one card
//  per scheme (what you get, where it runs, built vs sanctioned) — tap a
//  card for everything: who can get it, the steps, the money, the source
//  and the apply / check-your-name link → housing schemes listed for the
//  district without progress numbers → how a scheme reaches you → link to
//  Govt schemes → charts → AI insight → news → sources.
//
//  Data: useHousing() (HousingScheme: counts + money per scheme per
//  fiscal year) and useSchemes() (the district's scheme list; rows about
//  housing give the published amount, eligibility, level and apply link).
//  housing-kinds.ts explains how the two are matched. Money is stored in
//  whole rupees and turned into crores only for display. Every word is in
//  page_housing (en / kn / hi); scheme names and eligibility are data and
//  stay as published.
"use client";

import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { Home } from "lucide-react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleNews from "@/components/district/ModuleNews";
import { useHousing, useSchemes } from "@/hooks/useRealtimeData";
import type { HousingScheme, Scheme } from "@/hooks/useRealtimeData";
import { useDistrictName, useFormat, useModuleText, usePlaceText } from "@/i18n/client";
import { Card, ErrorBlock, LoadingShell, ModulePage, PageHeader, ProgressBar, Section, StatStrip, StatTile } from "@/components/district/ui";
import { ChartCard, Explainer, HowItWorks, Pictogram } from "@/components/district/visuals";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import { HueDonut, MUTED_SHADE, ProgressRing, type DonutSegment } from "@/components/district/daily-services/HueCharts";
import {
  ActionLink,
  Chip,
  LinkCard,
  MetaLine,
  PageEnd,
  SheetBlock,
  SheetNote,
  SheetSmall,
  StageBar,
  TapCard,
  dataLang,
  extUrl,
  firstUrl,
  hostOf,
  type Stage,
} from "@/components/services-2/kit";
import { downloadCSV, todayISO } from "@/lib/csv";
import {
  FAMILY_EMOJI,
  FAMILY_SITE,
  STEP_EMOJI,
  WHERE_EMOJI,
  brandOf,
  familyOf,
  isHousingScheme,
  stepsOf,
  whereOfFamily,
  whereOfLevel,
  type Family,
  type Where,
} from "./housing-kinds";

const AWAASSOFT = { label: "AwaasSoft", href: "https://pmayg.nic.in" };

const bold = (c: React.ReactNode) => <strong>{c}</strong>;

/** The API sends every column; the shared type does not list updatedAt. */
type HousingRow = HousingScheme & { updatedAt?: string | null };
type SchemeRow = Scheme & { updatedAt?: string | null };

/** One housing scheme on the page, with what we could match about it. */
interface Item {
  id: string;
  name: string;
  nameLocal?: string | null;
  family: Family;
  where: Where | null;
  /** The district's scheme-list row for the same scheme, when there is one. */
  info: SchemeRow | null;
  /** The progress row (counts + money), when there is one. */
  row: HousingRow | null;
  applyUrl: string | null;
}

/** Where the houses are now: finished · being built · sanctioned, not started · not yet sanctioned. */
function stagesOf(
  r: { targetHouses: number; sanctioned: number; completed: number; inProgress: number },
  label: (k: string) => string,
  n: (v: number) => string,
): Stage[] {
  const waiting = Math.max(0, r.sanctioned - r.completed - r.inProgress);
  const notSanctioned = Math.max(0, r.targetHouses - Math.max(r.sanctioned, r.completed + r.inProgress));
  return [
    { key: "done", label: label("done"), value: r.completed, display: n(r.completed), color: "var(--hue)" },
    { key: "building", label: label("building"), value: r.inProgress, display: n(r.inProgress), color: "var(--hue-pop)" },
    { key: "waiting", label: label("waiting"), value: waiting, display: n(waiting), color: "color-mix(in srgb, var(--hue-pop) 35%, #fff)" },
    { key: "notSanctioned", label: label("notSanctioned"), value: notSanctioned, display: n(notSanctioned), color: MUTED_SHADE },
  ];
}

/**
 * The money ring's segments, or null when the funds cannot be drawn
 * honestly: only schemes that report an allocation count, spending must be
 * reported for all of them (a missing figure is not a zero), and released
 * is shown only when complete and consistent.
 */
function fundsBreakdown(rows: HousingRow[]) {
  const withFunds = rows.filter((h) => (h.fundsAllocated ?? 0) > 0);
  if (withFunds.length === 0) return null;
  if (withFunds.some((h) => h.fundsSpent === null || h.fundsSpent === undefined)) return null;
  const alloc = withFunds.reduce((s, h) => s + (h.fundsAllocated ?? 0), 0);
  const spent = withFunds.reduce((s, h) => s + (h.fundsSpent ?? 0), 0);
  if (spent > alloc) return null;
  const releasedKnown = withFunds.every((h) => h.fundsReleased !== null && h.fundsReleased !== undefined);
  const released = withFunds.reduce((s, h) => s + (h.fundsReleased ?? 0), 0);
  const withReleased = releasedKnown && spent <= released && released <= alloc;
  return { alloc, spent, released: withReleased ? released : null };
}

/** The newest updatedAt among rows (ISO strings sort as text). */
function newest(rows: Array<{ updatedAt?: string | null }>): string | null {
  return rows.reduce<string | null>((m, r) => (r.updatedAt && (!m || r.updatedAt > m) ? r.updatedAt : m), null);
}

function HousingPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const t = useTranslations("page_housing");
  const f = useFormat();
  const mt = useModuleText();
  const place = usePlaceText();
  const districtName = useDistrictName(state, district);
  const stateName = place.state(state, state);
  const { data, isLoading, error } = useHousing(district, state);
  const { data: schemeData } = useSchemes(district, state);
  const [openId, setOpenId] = useState<string | null>(null);

  const n = (v: number) => f.number(v);
  const pct = (share: number, digits = 0) => f.number(share, { style: "percent", maximumFractionDigits: digits });
  const rupees = (v: number) => f.number(v, { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const crore = (v: number) => t("crore", { n: f.number(v / 10_000_000, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) });
  const fy = (year: string) => t("fy", { year });
  const stageLabel = (k: string) => t(`stage.${k}`);
  const whereText = (w: Where) => (w === "india" ? t("where.india") : w === "state" ? t("where.state", { state: stateName }) : t("where.local", { district: districtName }));

  const rows: HousingRow[] = data?.data ?? [];
  const housingInfo: SchemeRow[] = ((schemeData?.data ?? []) as SchemeRow[]).filter((s) => s.active && isHousingScheme(s.category, s.name));

  // Each progress row, matched to the scheme list by brand ("pmayg", "rgrhcl" …).
  const usedInfo = new Set<string>();
  const items: Item[] = rows.map((r) => {
    const family = familyOf(r.schemeName);
    const brand = brandOf(r.schemeName);
    const info = brand ? housingInfo.find((s) => brandOf(s.name) === brand) ?? null : null;
    if (info) usedInfo.add(info.id);
    return {
      id: r.id,
      name: r.schemeName,
      family,
      where: whereOfLevel(info?.level) ?? whereOfFamily(family),
      info,
      row: r,
      applyUrl: extUrl(info?.applyUrl) ?? FAMILY_SITE[family] ?? null,
    };
  });
  // Housing schemes the district lists but with no progress numbers.
  const extra: Item[] = housingInfo
    .filter((s) => !usedInfo.has(s.id))
    .map((s) => {
      const family = familyOf(s.name);
      return {
        id: `info-${s.id}`,
        name: s.name,
        nameLocal: s.nameLocal,
        family,
        where: whereOfLevel(s.level) ?? whereOfFamily(family),
        info: s,
        row: null,
        applyUrl: extUrl(s.applyUrl) ?? FAMILY_SITE[family] ?? null,
      };
    });
  const open = [...items, ...extra].find((x) => x.id === openId) ?? null;

  // Totals across the progress rows.
  const total = rows.reduce(
    (a, h) => ({
      targetHouses: a.targetHouses + h.targetHouses,
      sanctioned: a.sanctioned + h.sanctioned,
      completed: a.completed + h.completed,
      inProgress: a.inProgress + h.inProgress,
    }),
    { targetHouses: 0, sanctioned: 0, completed: 0, inProgress: 0 },
  );
  const doneShare = total.targetHouses > 0 ? total.completed / total.targetHouses : 0;

  // "FY 2024-25" or "FY 2023-24 to 2024-25".
  const years = Array.from(new Set(rows.map((h) => h.fiscalYear))).sort();
  const fyLabel = years.length === 0 ? undefined : years.length === 1 ? fy(years[0]) : t("fyRange", { from: years[0], to: years[years.length - 1] });
  const updated = newest(rows);

  const answer =
    rows.length === 0
      ? t("answerNoRows", { district: districtName })
      : total.completed === 0 && total.inProgress === 0 && total.sanctioned === 0
        ? t.rich("answerNotStarted", { district: districtName, target: n(total.targetHouses), fy: fyLabel ?? "", b: bold })
        : t.rich("answer", { district: districtName, done: n(total.completed), target: n(total.targetHouses), building: n(total.inProgress), fy: fyLabel ?? "", b: bold });

  // Money: set aside → released → spent, from the schemes that report it.
  const funds = fundsBreakdown(rows);
  const fundSegments: DonutSegment[] = funds
    ? funds.released !== null
      ? [
          { key: "spent", label: t("funds.spent"), value: funds.spent, display: crore(funds.spent), emoji: "✅", color: "var(--hue-deep)" },
          { key: "released", label: t("funds.releasedUnspent"), value: funds.released - funds.spent, display: crore(funds.released - funds.spent), emoji: "📤", color: "var(--hue-pop)" },
          { key: "held", label: t("funds.notReleased"), value: funds.alloc - funds.released, display: crore(funds.alloc - funds.released), emoji: "⏳", color: MUTED_SHADE },
        ]
      : [
          { key: "spent", label: t("funds.spent"), value: funds.spent, display: crore(funds.spent), emoji: "✅", color: "var(--hue-deep)" },
          { key: "left", label: t("funds.notSpent"), value: funds.alloc - funds.spent, display: crore(funds.alloc - funds.spent), emoji: "⏳", color: MUTED_SHADE },
        ]
    : [];

  // Common-scale bars: each scheme's bar is as long as its target.
  const maxTarget = Math.max(0, ...rows.map((r) => Math.max(r.targetHouses, r.sanctioned)));
  const biggest = [...rows].sort((a, b) => b.completed - a.completed)[0];

  function handleCsv() {
    downloadCSV(
      rows.map((r) => ({
        Scheme: r.schemeName,
        "Financial year": r.fiscalYear,
        "Houses planned": r.targetHouses,
        Sanctioned: r.sanctioned,
        Finished: r.completed,
        "Being built": r.inProgress,
        "Funds set aside (Rs)": r.fundsAllocated ?? "",
        "Funds released (Rs)": r.fundsReleased ?? "",
        "Funds spent (Rs)": r.fundsSpent ?? "",
        Source: r.source,
      })),
      `forthepeople_${district}_housing_${todayISO()}.csv`,
    );
  }

  /** One card: a progress row or a listed scheme. */
  const renderCard = (it: Item, i: number) => {
    const r = it.row;
    const donePct = r && r.targetHouses > 0 ? (r.completed / r.targetHouses) * 100 : null;
    return (
      <TapCard
        key={it.id}
        emoji={FAMILY_EMOJI[it.family]}
        title={it.name}
        titleLang={dataLang(it.name, locale)}
        subtitle={t(`family.${it.family}.what`)}
        hint={t("card.hint")}
        onOpen={() => setOpenId(it.id)}
        aside={
          donePct !== null ? (
            <ProgressRing pct={donePct} size={56} i={i} label={t("card.ringAria", { pct: pct(donePct / 100) })}>
              <span className="ftp-bignum" style={{ fontSize: 14, color: "var(--hue-deep)" }}>
                {pct(donePct / 100)}
              </span>
            </ProgressRing>
          ) : undefined
        }
      >
        <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {it.where && <Chip emoji={WHERE_EMOJI[it.where]}>{whereText(it.where)}</Chip>}
          {r && <Chip emoji="📅">{fy(r.fiscalYear)}</Chip>}
          {!r && it.info?.amount ? <Chip emoji="💰">{t("card.amount", { amount: rupees(it.info.amount) })}</Chip> : null}
        </span>
        {r ? (
          <>
            <MetaLine emoji="🏗️">
              {r.sanctioned > 0
                ? t.rich("card.progress", { done: n(r.completed), sanctioned: n(r.sanctioned), b: bold })
                : t.rich("card.progressPlanned", { target: n(r.targetHouses), b: bold })}
            </MetaLine>
            <StageBar
              stages={stagesOf(r, stageLabel, n)}
              legend={false}
              height={10}
              ariaLabel={t("card.barAria", { done: n(r.completed), building: n(r.inProgress), target: n(r.targetHouses) })}
            />
          </>
        ) : it.info?.eligibility ? (
          <MetaLine emoji="👪" lang={dataLang(it.info.eligibility, locale)}>
            {it.info.eligibility}
          </MetaLine>
        ) : null}
      </TapCard>
    );
  };

  return (
    <ModulePage>
      <PageHeader
        icon={Home}
        title={mt.label("housing")}
        description={t("description")}
        backHref={base}
        source={AWAASSOFT}
        freshness={updated ? { asOf: updated, thresholdHours: 24 * 35 } : undefined}
      />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && rows.length === 0 && extra.length === 0 && <NoDataCard module="housing" district={district} state={state} />}

      {!isLoading && !error && (rows.length > 0 || extra.length > 0) && (
        <>
          {/* 2. The answer in one sentence. */}
          <Explainer emoji="🏠">{answer}</Explainer>

          {rows.length > 0 && (
            <>
              {/* 3. Four big numbers. */}
              <StatStrip cols={4}>
                <StatTile emoji="🎯" label={t("tiles.target")} value={n(total.targetHouses)} sub={fyLabel} />
                <StatTile emoji="✅" label={t("tiles.sanctioned")} value={n(total.sanctioned)} sub={fyLabel} />
                <StatTile emoji="🏠" label={t("tiles.completed")} value={n(total.completed)} sub={fyLabel} />
                <StatTile emoji="🏗️" label={t("tiles.inProgress")} value={n(total.inProgress)} sub={fyLabel} />
              </StatStrip>

              {/* 4. The picture: 10 houses, lit for the share finished, and
                  where all the planned houses are now. Same totals as above. */}
              {total.targetHouses > 0 && (
                <div className="ftp-picture-row" style={{ marginTop: 16 }}>
                  <Card tinted padding={18}>
                    <p className="ftp-label" style={{ margin: "0 0 10px", color: "var(--hue-deep)" }}>
                      {t("picture.title")}
                    </p>
                    <Pictogram
                      filled={doneShare * 10}
                      emoji="🏠"
                      label={total.completed === 0 ? t("pictogramNone") : t("pictogram", { n: Math.round(Math.min(10, doneShare * 10)) })}
                    />
                  </Card>
                  <Card tinted padding={18}>
                    <p className="ftp-label" style={{ margin: "0 0 12px", color: "var(--hue-deep)" }}>
                      {t("picture.stagesTitle", { target: n(total.targetHouses) })}
                    </p>
                    <StageBar
                      stages={stagesOf(total, stageLabel, n)}
                      height={18}
                      ariaLabel={t("card.barAria", { done: n(total.completed), building: n(total.inProgress), target: n(total.targetHouses) })}
                    />
                  </Card>
                </div>
              )}
            </>
          )}

          {/* 5. One card per scheme; tap for everything. */}
          {items.length > 0 && (
            <Section title={t("list.title", { district: districtName })} emoji="📋">
              <div className="ftp-grid">{items.map(renderCard)}</div>
            </Section>
          )}

          {extra.length > 0 && (
            <Section title={t("more.title")} emoji="🗂️">
              <p className="ftp-body ftp-prose" style={{ color: "var(--ftp-text-2)", margin: "-6px 0 12px" }}>
                {t("more.body")}
              </p>
              <div className="ftp-grid">{extra.map(renderCard)}</div>
            </Section>
          )}

          {/* How a housing scheme reaches you. */}
          <Section title={t("how.title")} emoji="🧭">
            <HowItWorks
              steps={stepsOf("pmayu").map((k) => ({ emoji: STEP_EMOJI[k], title: t(`how.${k}.title`), body: t(`how.${k}.body`) }))}
            />
            <p className="ftp-body ftp-prose" style={{ color: "var(--ftp-text-2)", margin: "10px 0 0" }}>
              {t("how.pmaygNote")}
            </p>
          </Section>

          <div style={{ marginTop: 20 }}>
            <LinkCard href={`${base}/schemes`} emoji="📋" title={t("otherSchemes.title")} body={t("otherSchemes.body")} />
          </div>

          {/* 6. Charts, each with a one-line takeaway. */}
          {(rows.length > 1 || fundSegments.length > 0) && (
            <Section title={t("charts.title")} emoji="📊">
              <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "340px" }}>
                {rows.length > 1 && biggest && (
                  <ChartCard
                    title={t("chart.title")}
                    emoji="🏗️"
                    units={t("chart.units")}
                    simple={t.rich("chart.simple", { scheme: biggest.schemeName, done: n(biggest.completed), target: n(biggest.targetHouses), b: bold })}
                    source={AWAASSOFT}
                    asOfPeriod={fyLabel}
                    table={rows.map((r) => ({
                      label: t("chart.schemeYear", { scheme: r.schemeName, fy: fy(r.fiscalYear) }),
                      value: t("chart.tableRow", { done: n(r.completed), building: n(r.inProgress), target: n(r.targetHouses) }),
                    }))}
                  >
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                      {rows.map((r) => (
                        <li key={r.id} style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, lineHeight: "18px", marginBottom: 4 }}>
                            <span lang={dataLang(r.schemeName, locale)} style={{ minWidth: 0, overflowWrap: "anywhere", color: "var(--ftp-text)" }}>
                              {r.schemeName}
                            </span>
                            <span className="ftp-num" style={{ whiteSpace: "nowrap", color: "var(--hue-deep)" }}>
                              {t("chart.barValue", { done: n(r.completed), target: n(r.targetHouses) })}
                            </span>
                          </div>
                          <div style={{ width: `${maxTarget > 0 ? Math.max(8, (Math.max(r.targetHouses, r.sanctioned) / maxTarget) * 100) : 100}%` }}>
                            <StageBar
                              stages={stagesOf(r, stageLabel, n)}
                              legend={false}
                              height={12}
                              ariaLabel={t("card.barAria", { done: n(r.completed), building: n(r.inProgress), target: n(r.targetHouses) })}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 12, fontSize: 12, color: "var(--ftp-text-2)" }}>
                      {stagesOf(total, stageLabel, n).map((s) => (
                        <span key={s.key} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <span aria-hidden style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
                          {s.label}
                        </span>
                      ))}
                    </div>
                  </ChartCard>
                )}
                {funds && fundSegments.length > 0 && (
                  <ChartCard
                    title={t("funds.title")}
                    emoji="💰"
                    units={t("funds.units")}
                    simple={
                      funds.released !== null
                        ? t.rich("funds.simpleReleased", { alloc: crore(funds.alloc), released: crore(funds.released), spent: crore(funds.spent), b: bold })
                        : t.rich("funds.simpleSpent", { alloc: crore(funds.alloc), spent: crore(funds.spent), b: bold })
                    }
                    source={AWAASSOFT}
                    asOfPeriod={fyLabel}
                    table={fundSegments.map((s) => ({ label: s.label, value: s.display }))}
                  >
                    <HueDonut
                      segments={fundSegments}
                      center={pct(funds.spent / funds.alloc)}
                      centerSub={t("funds.centerSub")}
                      ariaLabel={t("funds.aria", { spent: crore(funds.spent), alloc: crore(funds.alloc) })}
                      percentOf={(s) => pct(s)}
                    />
                  </ChartCard>
                )}
              </div>
            </Section>
          )}

          <div style={{ marginTop: 20 }}>
            <AIInsightCard module="housing" district={district} />
          </div>
        </>
      )}

      <ModuleNews district={district} state={state} locale={locale} module="housing" />
      <PageEnd
        ns="page_housing"
        sourceModule="housing"
        moduleSlug="housing"
        state={state}
        district={district}
        locale={locale}
        districtName={districtName}
        about={t("summary", { district: districtName })}
        shareText={
          rows.length > 0
            ? t("share", { district: districtName, done: n(total.completed), target: n(total.targetHouses), pct: pct(doneShare, 1) })
            : t("shareEmpty", { district: districtName })
        }
        onCsv={rows.length > 0 ? handleCsv : undefined}
      />

      {/* Everything about one scheme. */}
      <DetailSheet
        open={!!open}
        onClose={() => setOpenId(null)}
        title={open?.name ?? ""}
        titleLang={open ? dataLang(open.name, locale) : undefined}
        subtitle={open?.row ? t("sheet.sub", { district: districtName, fy: fy(open.row.fiscalYear) }) : open ? t("sheet.subListed", { district: districtName }) : undefined}
        emoji={open ? FAMILY_EMOJI[open.family] : undefined}
        footer={
          open && (
            <>
              {open.applyUrl && (
                <ActionLink href={open.applyUrl} emoji={open.family === "pmayg" ? "🔎" : "📝"} primary newTab>
                  {open.family === "pmayg" ? t("sheet.checkName") : t("sheet.apply")}
                </ActionLink>
              )}
              {open.family === "pmayg" || open.family === "state" ? (
                <ActionLink href={`${base}/gram-panchayat`} emoji="🏘️" internal>
                  {t("sheet.panchayat")}
                </ActionLink>
              ) : (
                <ActionLink href={`${base}/offices`} emoji="🏢" internal>
                  {t("sheet.offices")}
                </ActionLink>
              )}
            </>
          )
        }
      >
        {open && (
          <>
            <SheetNote emoji="🎁">{t(`family.${open.family}.what`)}</SheetNote>
            <DetailList
              rows={[
                { emoji: "🗺️", label: t("sheet.where"), value: open.where ? whereText(open.where) : null },
                {
                  emoji: "🏛️",
                  label: t("sheet.by"),
                  value: open.family === "pmayg" || open.family === "pmayu" || open.family === "city" ? t(`family.${open.family}.by`) : open.family === "state" ? t("family.state.by", { state: stateName }) : null,
                },
                {
                  emoji: "👪",
                  label: t("sheet.who"),
                  value: open.info?.eligibility ?? t(`family.${open.family}.who`),
                  lang: open.info?.eligibility ? dataLang(open.info.eligibility, locale) : undefined,
                },
                { emoji: "💰", label: t("sheet.amount"), value: open.info?.amount ? t("sheet.amountValue", { amount: rupees(open.info.amount) }) : null },
                { emoji: "📅", label: t("sheet.year"), value: open.row ? fy(open.row.fiscalYear) : null },
              ]}
            />

            {open.row && (
              <SheetBlock emoji="🏗️" title={t("sheet.progress")}>
                <StageBar
                  stages={stagesOf(open.row, stageLabel, n)}
                  ariaLabel={t("card.barAria", { done: n(open.row.completed), building: n(open.row.inProgress), target: n(open.row.targetHouses) })}
                />
                <DetailList
                  rows={[
                    { emoji: "🎯", label: t("tiles.target"), value: n(open.row.targetHouses) },
                    { emoji: "✅", label: t("tiles.sanctioned"), value: n(open.row.sanctioned) },
                    { emoji: "🏠", label: t("tiles.completed"), value: n(open.row.completed) },
                    { emoji: "🏗️", label: t("tiles.inProgress"), value: n(open.row.inProgress) },
                  ]}
                />
              </SheetBlock>
            )}

            {open.row && (open.row.fundsAllocated ?? 0) > 0 && (
              <SheetBlock emoji="💰" title={t("sheet.money")}>
                <DetailList
                  rows={[
                    { label: t("details.allocated"), value: crore(open.row.fundsAllocated ?? 0) },
                    { label: t("details.released"), value: open.row.fundsReleased !== null && open.row.fundsReleased !== undefined ? crore(open.row.fundsReleased) : t("sheet.notReported") },
                    { label: t("details.spent"), value: open.row.fundsSpent !== null && open.row.fundsSpent !== undefined ? crore(open.row.fundsSpent) : t("sheet.notReported") },
                  ]}
                />
                {open.row.fundsSpent !== null && open.row.fundsSpent !== undefined && (
                  <ProgressBar label={t("details.fundsUsed")} pct={((open.row.fundsSpent ?? 0) / (open.row.fundsAllocated ?? 1)) * 100} />
                )}
              </SheetBlock>
            )}

            <SheetBlock emoji="🧭" title={t("sheet.steps")}>
              <HowItWorks steps={stepsOf(open.family).map((k) => ({ emoji: STEP_EMOJI[k], title: t(`how.${k}.title`) }))} />
            </SheetBlock>

            <SheetBlock emoji="📝" title={t("sheet.howApply")}>
              <p className="ftp-body" style={{ margin: 0, fontSize: 14, lineHeight: "21px" }}>
                {t(`family.${open.family}.apply`)}
              </p>
            </SheetBlock>

            <SheetSmall>
              {open.row
                ? t("sheet.sourceRow", { source: open.row.source.split(" | ")[0] })
                : open.info?.source
                  ? t("sheet.sourceList", { source: open.info.source })
                  : t("sheet.sourceListNone")}
              {(() => {
                const link = open.row ? firstUrl(open.row.source) : null;
                return link ? (
                  <>
                    {" · "}
                    <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: "var(--hue-deep)" }}>
                      {hostOf(link)}
                    </a>
                  </>
                ) : null;
              })()}
              {(open.row?.updatedAt ?? open.info?.updatedAt) && (
                <>
                  {" · "}
                  <span suppressHydrationWarning>{t("sheet.updated", { date: f.date((open.row?.updatedAt ?? open.info?.updatedAt) as string, { day: "numeric", month: "short", year: "numeric" }) })}</span>
                </>
              )}
            </SheetSmall>
          </>
        )}
      </DetailSheet>
    </ModulePage>
  );
}

export default function HousingPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("housing")}>
      <HousingPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
