/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
*/

// ═══════════════════════════════════════════════════════════════════════
//  District map — "How is my district split up, and where are the
//  villages?"  (docs/LAYOUT.md recipe; docs/MODULE-MAP.md "Know your
//  district")
// ═══════════════════════════════════════════════════════════════════════
//
//  ModulePage → PageHeader → Explainer (how many taluks, villages, km²) →
//  StatTiles → ONE picture: the taluk map (each taluk in its own hue; tap a
//  shape to open that taluk's page) beside the taluk cards on laptop/PC,
//  stacked on phones and tablets. When our boundary file does not cover
//  every taluk, an honest note replaces the map and the cards carry on.
//  Each taluk card (name, local name, villages, a bar for its share of the
//  district's villages) opens a DetailSheet: people, area, villages, its
//  share of the district, the village names, and "Open the taluk page".
//  → "How the land is shared" (ring of each taluk's area, only when every
//  taluk has an area on record) → Share (sources: the layout's verification panel).
//
//  i18n: page_map (en / kn / hi); the sub-district word (Taluk / Mandal /
//  Tehsil…) comes from the shared subUnitOne / subUnits namespaces. Taluk
//  and village names are data.
"use client";
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Map as MapIcon } from "lucide-react";
import { useTaluks, useOverview, type Taluk } from "@/hooks/useRealtimeData";
import {
  ModulePage, PageHeader, StatStrip, StatTile, Section, Card, LoadingShell,
  EmptyState,
} from "@/components/district/ui";
import { ChartCard, Explainer } from "@/components/district/visuals";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import { OTHER_SHADE, ShareDonut, type DonutSlice } from "@/components/community/CommunityVisuals";
import { TapCard } from "@/components/community/TapCard";
import { PageActions } from "@/components/district/page-kit";
import TalukMap from "@/components/map/TalukMap";
import { getStateConfig } from "@/lib/constants/state-config";
import { hueClass } from "@/lib/design/hues";
import { useDistrictName, useFormat } from "@/i18n/client";

interface GeoJSONCollection {
  type?: string;
  features?: Array<{ type?: string; properties?: Record<string, unknown>; geometry?: unknown }>;
}

type Coverage = { status: "loading" } | { status: "missing" } | { status: "partial"; features: number } | { status: "full" };

/** Up to this many taluks get their own slice in the land ring. */
const MAX_LAND_SLICES = 6;
/** Village names shown in a taluk's sheet before "and N more". */
const MAX_VILLAGE_NAMES = 60;

/** Does our boundary file (public/geo/<district>-taluks.json) cover every taluk? */
function useCoverage(district: string, talukCount: number): Coverage {
  const [coverage, setCoverage] = useState<Coverage>({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    fetch(`/geo/${district}-taluks.json`)
      .then(async (r) => {
        if (!r.ok) return null;
        const ct = r.headers.get("content-type") ?? "";
        if (!/json/i.test(ct)) return null;
        return (await r.json()) as GeoJSONCollection;
      })
      .then((geo) => {
        if (cancelled) return;
        const count = geo && Array.isArray(geo.features) ? geo.features.length : 0;
        if (count === 0) setCoverage({ status: "missing" });
        else if (talukCount > 0 && count < talukCount) setCoverage({ status: "partial", features: count });
        else setCoverage({ status: "full" });
      })
      .catch(() => {
        if (!cancelled) setCoverage({ status: "missing" });
      });
    return () => {
      cancelled = true;
    };
  }, [district, talukCount]);
  return coverage;
}

/** One taluk as a card; tapping it opens the detail sheet. */
function TalukCard({
  tk,
  totalVillages,
  showVillages,
  onOpen,
}: {
  tk: Taluk;
  totalVillages: number;
  showVillages: boolean;
  onOpen: (tk: Taluk) => void;
}) {
  const t = useTranslations("page_map");
  const f = useFormat();
  const villages = tk._count.villages;
  const share = totalVillages > 0 ? villages / totalVillages : 0;
  return (
    <TapCard
      onOpen={() => onOpen(tk)}
      title={tk.name}
      subtitle={tk.nameLocal ? <span lang="und" style={{ color: "var(--hue-deep)", fontWeight: 600 }}>{tk.nameLocal}</span> : undefined}
      hint={t("details")}
      style={{ gap: 8 }}
    >
      {(showVillages || tk.population != null || tk.area != null) && (
        <div className="ftp-num" style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13, lineHeight: "18px", fontWeight: 500, color: "var(--ftp-text-2)" }}>
          {showVillages && <span>{t("villagesPlain", { n: villages, count: f.number(villages) })}</span>}
          {tk.population != null && <span>{t("people", { n: f.number(tk.population) })}</span>}
          {tk.area != null && <span>{t("areaKm", { n: f.number(tk.area) })}</span>}
        </div>
      )}
      {showVillages && totalVillages > 0 && (
        <div
          aria-hidden
          title={t("villageShare", { n: f.number(villages), total: f.number(totalVillages) })}
          style={{ height: 6, borderRadius: 999, overflow: "hidden", background: "var(--ftp-surface-2)" }}
        >
          <div
            className="ftp-grow-x"
            style={{ height: "100%", width: `${Math.max(2, Math.round(share * 100))}%`, borderRadius: 999, background: "var(--hue)" }}
          />
        </div>
      )}
    </TapCard>
  );
}

/** Everything about one taluk, with a button to its own page. */
function TalukSheet({
  tk,
  href,
  unitWord,
  totalVillages,
  totalArea,
  showVillages,
  asOf,
  onClose,
}: {
  tk: Taluk;
  href: string;
  unitWord: string;
  totalVillages: number;
  totalArea: number;
  showVillages: boolean;
  asOf: string | null;
  onClose: () => void;
}) {
  const t = useTranslations("page_map");
  const f = useFormat();
  const pct = (x: number) => f.number(x, { style: "percent", maximumFractionDigits: 0 });
  const villages = tk._count.villages;
  const names = (tk.villages ?? []).map((v) => v.name).filter(Boolean);
  const shown = names.slice(0, MAX_VILLAGE_NAMES);
  const notRecorded = t("notRecorded");
  return (
    <DetailSheet
      open
      onClose={onClose}
      title={tk.name}
      subtitle={tk.nameLocal ? <span lang="und">{tk.nameLocal}</span> : undefined}
      hueClassName={hueClass("map")}
      footer={
        <Link
          href={href}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            minHeight: 44,
            padding: "0 16px",
            borderRadius: "var(--ftp-radius-tile)",
            background: "var(--hue)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 650,
            textDecoration: "none",
            flex: "1 1 auto",
          }}
        >
          {t("openTaluk", { name: tk.name, unit: unitWord })}
        </Link>
      }
    >
      <DetailList
        rows={[
          { label: t("population"), value: tk.population != null ? <span className="ftp-num">{f.number(tk.population)}</span> : notRecorded },
          {
            label: t("area"),
            value:
              tk.area != null ? (
                <span className="ftp-num">
                  {t("areaKm", { n: f.number(tk.area) })}
                  {totalArea > 0 && <span style={{ color: "var(--ftp-text-2)", fontWeight: 400 }}> · {t("shareOfDistrict", { share: pct(tk.area / totalArea) })}</span>}
                </span>
              ) : (
                notRecorded
              ),
          },
          {
            label: t("villages"),
            value: showVillages ? (
              <span className="ftp-num">
                {f.number(villages)}
                {totalVillages > 0 && <span style={{ color: "var(--ftp-text-2)", fontWeight: 400 }}> · {t("shareOfDistrict", { share: pct(villages / totalVillages) })}</span>}
              </span>
            ) : null,
          },
        ]}
      />
      {asOf && (
        <p style={{ margin: 0, fontSize: 12, color: "var(--ftp-text-2)" }} suppressHydrationWarning>
          {t("figuresAsOf", { date: f.date(asOf, { day: "numeric", month: "short", year: "numeric" }) })}
        </p>
      )}
      {showVillages && shown.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h3 className="ftp-display" style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 650, color: "var(--hue-deep)" }}>
            {t("villageNames", { n: villages, count: f.number(villages) })}
          </h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {shown.map((name, i) => (
              <li
                key={`${name}-${i}`}
                style={{ padding: "4px 10px", borderRadius: 999, background: "var(--hue-tint)", color: "var(--ftp-text)", fontSize: 13, lineHeight: "18px" }}
              >
                {name}
              </li>
            ))}
          </ul>
          {names.length > shown.length && (
            <p style={{ margin: 0, fontSize: 13, color: "var(--ftp-text-2)" }}>{t("moreVillages", { n: names.length - shown.length, count: f.number(names.length - shown.length) })}</p>
          )}
        </section>
      )}
    </DetailSheet>
  );
}

export default function MapPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_map");
  const tOne = useTranslations("subUnitOne");
  const tMany = useTranslations("subUnits");
  const f = useFormat();
  const base = `/${locale}/${state}/${district}`;
  const stateConfig = getStateConfig(state, district);
  const subUnit = stateConfig?.subDistrictUnit ?? "Taluk";
  const subUnitPlural = stateConfig?.subDistrictUnitPlural ?? "Taluks";
  const hideVillages = stateConfig?.showVillages === false;
  const { data: taluksData, isLoading: taluksLoading } = useTaluks(district, state);
  const { data: overviewData, isLoading: overviewLoading } = useOverview(district, state);
  const [selected, setSelected] = useState<Taluk | null>(null);
  const close = useCallback(() => setSelected(null), []);

  const taluks = taluksData?.data ?? [];
  const overview = overviewData?.data;
  const isLoading = taluksLoading || overviewLoading;
  const overviewAsOf = overviewData?.meta?.lastUpdated ?? null;
  const placeName = useDistrictName(state, district, overview?.name);
  const coverage = useCoverage(district, taluks.length);

  // The sub-district words in the page language (lower case inside sentences).
  const unitOne = tOne.has(subUnit) ? tOne(subUnit) : subUnit;
  const unitMany = tMany.has(subUnitPlural) ? tMany(subUnitPlural) : subUnitPlural;
  const lower = (s: string) => s.toLocaleLowerCase(locale);
  const unitWord = hideVillages ? lower(t("zone")) : lower(unitOne);
  const unitsWord = hideVillages ? t("zonesWord", { n: taluks.length }) : lower(taluks.length === 1 ? unitOne : unitMany);

  const totalVillages = taluks.reduce((s, tk) => s + tk._count.villages, 0);
  const withVillages = !hideVillages && totalVillages > 0;
  const withArea = Boolean(overview?.area);
  const simpleKey = withVillages ? (withArea ? "simpleVillagesArea" : "simpleVillages") : withArea ? "simpleArea" : "simple";
  const bold = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;

  // The land ring: only when EVERY taluk has an area, so the shares add up.
  const allHaveArea = taluks.length >= 2 && taluks.every((tk) => typeof tk.area === "number" && tk.area > 0);
  const byArea = allHaveArea ? [...taluks].sort((a, b) => (b.area ?? 0) - (a.area ?? 0)) : [];
  const landTotal = byArea.reduce((s, tk) => s + (tk.area ?? 0), 0);
  const ownSlices = byArea.length > MAX_LAND_SLICES ? byArea.slice(0, MAX_LAND_SLICES - 1) : byArea;
  const restArea = byArea.slice(ownSlices.length).reduce((s, tk) => s + (tk.area ?? 0), 0);
  const landSlices: DonutSlice[] = [
    ...ownSlices.map((tk) => ({ key: tk.slug, label: tk.name, value: tk.area ?? 0 })),
    ...(restArea > 0 ? [{ key: "__other", label: t("landOther", { units: lower(unitMany) }), value: restArea, color: OTHER_SHADE }] : []),
  ];
  const biggest = byArea[0];
  const biggestShare = biggest && landTotal > 0 ? f.number((biggest.area ?? 0) / landTotal, { style: "percent", maximumFractionDigits: 0 }) : "";
  // Area shares in the sheet: only against a total that covers every taluk.
  const sheetAreaTotal = allHaveArea ? landTotal : 0;

  const mapTaluks = taluks.map((tk) => ({ slug: tk.slug, name: tk.name, population: tk.population ?? undefined, villageCount: tk._count.villages }));
  const showMap = coverage.status === "full" && taluks.length > 0;
  const tileCount = 1 + (hideVillages ? 0 : 1) + (overview?.area ? 1 : 0) + (overview?.population ? 1 : 0);

  const cards = (
    <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "230px", gap: 12 }}>
      {taluks.map((tk) => (
        <TalukCard key={tk.id} tk={tk} totalVillages={totalVillages} showVillages={!hideVillages} onOpen={setSelected} />
      ))}
    </div>
  );

  return (
    <ModulePage>
      <PageHeader
        icon={MapIcon}
        title={t("title")}
        description={hideVillages ? t("descriptionUrban") : t("descriptionRural", { unit: lower(unitOne) })}
        backHref={base}
        source={{ label: t("sourceLabel") }}
      />
      {isLoading && <LoadingShell rows={4} />}

      {!isLoading && taluks.length === 0 && <EmptyState title={t("noTaluks", { place: placeName })} body={t("noTaluksBody")} />}

      {!isLoading && taluks.length > 0 && (
        <>
          <Explainer>
            {t.rich(simpleKey, {
              place: placeName,
              n: f.number(taluks.length),
              units: unitsWord,
              villages: f.number(totalVillages),
              area: f.number(overview?.area ?? 0),
              b: bold,
            })}
          </Explainer>

          <StatStrip cols={Math.min(4, Math.max(2, tileCount)) as 2 | 3 | 4}>
            <StatTile label={hideVillages ? t("zones") : unitMany} value={f.number(taluks.length)} />
            {!hideVillages && <StatTile label={t("villages")} value={f.number(totalVillages)} />}
            {overview?.area && <StatTile label={t("area")} value={f.number(overview.area)} unit="km²" asOf={overviewAsOf} />}
            {overview?.population && (
              <StatTile
                label={t("population")}
                value={f.number(overview.population / 100_000, { maximumFractionDigits: 1 })}
                unit={t("lakh")}
                asOf={overviewAsOf}
              />
            )}
          </StatStrip>

          {/* The one picture: the map beside the taluk cards (stacked below 900 px). */}
          <Section title={hideVillages ? t("mapSectionUrban") : t("mapSection", { unit: unitOne })}>
            {coverage.status === "loading" ? (
              <LoadingShell rows={2} />
            ) : showMap ? (
              <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(420px, 100%), 1fr))", alignItems: "start" }}>
                <Card tinted padding={12} style={{ maxWidth: 640, width: "100%", justifySelf: "center" }}>
                  <TalukMap locale={locale} state={state} district={district} taluks={mapTaluks} unitLabel={unitWord} />
                  <p style={{ margin: "8px 4px 0", fontSize: 12, lineHeight: "17px", color: "var(--ftp-text-2)" }}>{t("mapNote", { unit: unitWord })}</p>
                </Card>
                <div>
                  <p style={{ margin: "0 0 10px", fontSize: 14, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{t("cardsHint", { unit: unitWord })}</p>
                  {cards}
                </div>
              </div>
            ) : (
              <>
                <p
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13,
                    lineHeight: "20px",
                    color: "var(--ftp-text)",
                    margin: "0 0 12px",
                    padding: "10px 14px",
                    borderRadius: "var(--ftp-radius-card)",
                    background: "var(--ftp-surface)",
                    border: "1px dashed var(--ftp-border-strong)",
                  }}
                >
                  <span>
                    {coverage.status === "partial"
                      ? t("coveragePartial", { n: f.number(coverage.features), total: f.number(taluks.length), units: unitsWord })
                      : t("coverageMissing")}
                  </span>
                </p>
                {cards}
              </>
            )}
          </Section>

          {allHaveArea && biggest && (
            <Section title={t("chartsTitle")}>
              <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "340px" }}>
                <ChartCard
                  title={t("landTitle")}
                  units={t("landUnits", { unit: unitWord })}
                  simple={t.rich("landSimple", { name: biggest.name, unit: unitWord, share: biggestShare, b: (c) => <strong>{c}</strong> })}
                  table={byArea.map((tk) => ({ label: tk.name, value: t("areaKm", { n: f.number(tk.area ?? 0) }) }))}
                >
                  <ShareDonut
                    slices={landSlices}
                    centerValue={f.number(byArea.length)}
                    centerLabel={unitsWord}
                    formatValue={(v) => t("areaKm", { n: f.number(v) })}
                    ariaLabel={t("landAria", { name: biggest.name, unit: unitWord, share: biggestShare })}
                  />
                </ChartCard>
              </div>
            </Section>
          )}
        </>
      )}

      {/* The taluk shapes (public/geo/<district>-taluks.json) are approximate
          boxes, NOT OpenStreetMap boundaries. Credit the real source once
          surveyed polygons exist. */}
      <div style={{ marginTop: 28 }}>
        <PageActions locale={locale} district={district} moduleSlug="map" compare={false} />
      </div>

      {selected && (
        <TalukSheet
          tk={selected}
          href={`${base}/${selected.slug}`}
          unitWord={unitWord}
          totalVillages={totalVillages}
          totalArea={sheetAreaTotal}
          showVillages={!hideVillages}
          asOf={taluksData?.meta?.lastUpdated ?? null}
          onClose={close}
        />
      )}
    </ModulePage>
  );
}
