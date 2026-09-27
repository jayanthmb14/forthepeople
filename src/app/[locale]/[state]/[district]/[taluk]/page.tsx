/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Taluk overview — Design v4.1 (docs/LAYOUT.md recipe)
// ═══════════════════════════════════════════════════════════════════════
//
//  The question it answers: "How many people live in this taluk, in which
//  villages, and where do I find its data?"
//
//  <ModulePage> frame (full width on phones and tablets, 1320 px on laptops
//  and PCs) in the district's own hue:
//    1. SiteHeader band (taluk name + local-script name, back to district)
//    2. The answer in one sentence (Explainer), from the village rows
//    3. StatStrip of emoji tiles (villages, population, area)
//    4. The pictures, from the same village rows:
//         • the biggest villages as bars (two or more with a population);
//         • a ring of the villages grouped by size (under 500 people, 500
//           to 999 …), only when five or more villages have a population
//           on record and they fall in at least two groups
//    5. "See data for this taluk" module links (registry emoji, module hue)
//    6. The village list as tap cards (.ftp-grid) with a search box when
//       the list is long. Tapping a village opens a DetailSheet with every
//       number we hold for it (people, homes, people per home, rank and
//       share in the taluk, PIN) plus "Open village page" and "View on
//       maps" — the visitor never has to leave to see a village's numbers.
//    7. Sources footer (the district's "Where our data comes from" page)
//
//  The labels ("Taluk", "Villages", …) still come from the state config,
//  so a state that calls them "Tehsil" or "Wards" reads correctly; they are
//  translated through the "subUnitOne" and "page_taluk.labels" messages.
//
"use client";
import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight, ArrowLeft, ExternalLink, MapPin, Search } from "lucide-react";
import { useTaluks, useOverview, type Taluk } from "@/hooks/useRealtimeData";
import { getStateConfig } from "@/lib/constants/state-config";
import { getDistrictHue, getModuleMeta, hueClass } from "@/lib/design/hues";
import { useFormat, useModuleText } from "@/i18n/client";
import { scriptLang } from "@/lib/utils/script-lang";
import {
  Card,
  EmptyState,
  FreshnessPill,
  LoadingShell,
  ModulePage,
  PrimaryButton,
  Section,
  SourcesFooter,
  StatStrip,
  StatTile,
  ToolbarButton,
} from "@/components/district/ui";
import { ChartCard, Explainer } from "@/components/district/visuals";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import SiteHeader from "@/components/site/SiteHeader";
import TapCard from "@/components/site/TapCard";
import { BarList, Donut, type DonutSlice } from "@/components/site/SiteVisuals";

/** How many villages the "biggest villages" picture shows. */
const TOP_VILLAGES = 5;

/** Population groups for the size ring: [min, max) people. */
const SIZE_BANDS: Array<{ min: number; max: number | null; color: string }> = [
  { min: 0, max: 500, color: "color-mix(in srgb, var(--hue) 28%, #fff)" },
  { min: 500, max: 1000, color: "var(--hue-pop)" },
  { min: 1000, max: 2000, color: "color-mix(in srgb, var(--hue) 72%, #fff)" },
  { min: 2000, max: 5000, color: "var(--hue)" },
  { min: 5000, max: null, color: "var(--hue-deep)" },
];

/** The size ring needs at least this many villages with a population. */
const MIN_FOR_SIZES = 5;

/** Show the village search box above this many villages. */
const SEARCH_FROM = 12;

/**
 * A village row as the taluks API sends it. The shared hook types only the
 * fields the old page used; the API returns the whole row (households, PIN,
 * coordinates), which the detail sheet shows when present.
 */
type VillageRow = Taluk["villages"][number] & {
  households?: number | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

// Taluk overview page — shows taluk stats + village list
export default function TalukPage({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string; taluk: string }>;
}) {
  const { locale, state, district, taluk: talukSlug } = use(params);
  const t = useTranslations("page_taluk");
  const tOne = useTranslations("subUnitOne");
  const { number } = useFormat();
  const mt = useModuleText();
  const b = (c: React.ReactNode) => <strong>{c}</strong>;
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const districtBase = `/${locale}/${state}/${district}`;
  const stateConfig = getStateConfig(state);
  const subUnitEn = stateConfig?.subDistrictUnit ?? "Taluk";
  const subUnit = tOne.has(subUnitEn) ? tOne(subUnitEn) : subUnitEn;
  // Mid-sentence form: "this taluk" in English, the word as is elsewhere.
  const subUnitInline = subUnit === subUnitEn ? subUnitEn.toLowerCase() : subUnit;
  const villageLabelEn = stateConfig?.villageLabel ?? "Villages";
  const hasLabel = t.has(`labels.${villageLabelEn}.title`);
  const villageLabel = hasLabel ? t(`labels.${villageLabelEn}.title`) : villageLabelEn;
  const villageInline = hasLabel ? t(`labels.${villageLabelEn}.inline`) : villageLabelEn.toLowerCase();
  const showVillages = stateConfig?.showVillages !== false;
  const gramPanchayatApplicable = stateConfig?.gramPanchayatApplicable !== false;
  const jjmApplicable = stateConfig?.jjmApplicable !== false;
  const { data: taluksData } = useTaluks(district, state);
  const { data: overviewData } = useOverview(district, state);

  const talukData = (taluksData?.data ?? []).find((tk) => tk.slug === talukSlug);
  const districtName = overviewData?.data?.name ?? district;
  // Data date of the taluk records, when the API reports one.
  const asOf = taluksData?.meta?.lastUpdated ?? null;
  const villages = useMemo(() => (talukData?.villages ?? []) as VillageRow[], [talukData]);

  // Villages with a population on record, biggest first (rank + pictures).
  const villagesWithPop = useMemo(
    () =>
      villages
        .filter((v): v is VillageRow & { population: number } => typeof v.population === "number" && v.population > 0)
        .sort((a, b2) => b2.population - a.population),
    [villages],
  );

  const shownVillages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return villages;
    return villages.filter((v) => v.name.toLowerCase().includes(q) || (v.nameLocal ?? "").toLowerCase().includes(q));
  }, [villages, query]);

  // The page wears its district's colour (the same hue as the district card on the home page).
  const hue = `ftp-hue-${getDistrictHue(district)}`;

  if (!talukData) {
    return (
      <div className={hue}>
        <ModulePage>
          <Link
            href={districtBase}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 13, color: "var(--ftp-text-2)", textDecoration: "none" }}
          >
            <ArrowLeft size={14} aria-hidden /> {t("backTo", { name: districtName })}
          </Link>
          <h1 className="ftp-h2" style={{ margin: "4px 0 16px" }}>{t("loading", { unit: subUnitInline })}</h1>
          <LoadingShell rows={3} />
        </ModulePage>
      </div>
    );
  }

  const hasVillages = showVillages && villages.length > 0;
  // Prefer taluk.population from DB (seeded zone population); fall back to sum of villages.
  const villageSum = villages.reduce((s, v) => s + (v.population ?? 0), 0);
  const talukPopulation = talukData.population ?? (villageSum > 0 ? villageSum : null);
  // People on record across the villages: the base for "share of the taluk".
  const peopleOnRecord = talukPopulation && talukPopulation >= villageSum ? talukPopulation : villageSum;

  // Picture 1: the biggest villages that have a population on record.
  const withPopulation = villagesWithPop.length;
  const biggest = hasVillages ? villagesWithPop.slice(0, TOP_VILLAGES) : [];

  // Picture 2: the villages grouped by size — only groups that have villages.
  const bandLabel = (band: (typeof SIZE_BANDS)[number]) =>
    band.min === 0
      ? t("bandUnder", { max: number(band.max ?? 0) })
      : band.max === null
        ? t("bandTop", { min: number(band.min) })
        : t("bandRange", { min: number(band.min), max: number(band.max - 1) });
  const sizeSlices: DonutSlice[] = SIZE_BANDS.map((band, i) => {
    const count = villagesWithPop.filter((v) => v.population >= band.min && (band.max === null || v.population < band.max)).length;
    return { key: `band-${i}`, label: bandLabel(band), value: count, display: number(count), color: band.color };
  }).filter((s) => s.value > 0);
  const showSizes = hasVillages && withPopulation >= MIN_FOR_SIZES && sizeSlices.length >= 2;
  const commonest = [...sizeSlices].sort((a, b2) => b2.value - a.value)[0];

  const moduleSlugs = ["crops", "water", "schools"];
  if (gramPanchayatApplicable) moduleSlugs.push("gram-panchayat");
  if (jjmApplicable) moduleSlugs.push("jjm");
  moduleSlugs.push("overview");
  const moduleLinks = moduleSlugs.map((slug) => ({
    slug,
    label: mt.label(slug),
    href: slug === "overview" ? districtBase : `${districtBase}/${slug}?taluk=${talukSlug}`,
  }));

  const metaLine = hasVillages
    ? t("descVillages", { district: districtName, n: villages.length, label: villageInline })
    : t("descUrban", { district: districtName });

  const tileCount = (showVillages ? 1 : 0) + 1 + (talukData.area != null ? 1 : 0);

  const localLeads = Boolean(talukData.nameLocal && scriptLang(talukData.nameLocal) === locale);

  // The village whose sheet is open.
  const openVillage = openId ? villages.find((v) => v.id === openId) ?? null : null;
  const openRank = openVillage ? villagesWithPop.findIndex((v) => v.id === openVillage.id) : -1;
  const openPop = openVillage?.population && openVillage.population > 0 ? openVillage.population : null;
  const openHomes = openVillage?.households && openVillage.households > 0 ? openVillage.households : null;
  const openShare = openPop && peopleOnRecord > openPop && villagesWithPop.length >= 2 ? (openPop / peopleOnRecord) * 100 : null;
  const hasMap = typeof openVillage?.latitude === "number" && typeof openVillage?.longitude === "number";

  return (
    <div className={hue}>
      <ModulePage>
        <SiteHeader
          emoji="🏘️"
          icon={MapPin}
          // Local-script name leads when it is in the page language
          // (ಶ್ರೀರಂಗಪಟ್ಟಣ ತಾಲೂಕು on /kn/); the English name then sits beside it.
          title={t("title", { name: localLeads ? talukData.nameLocal! : talukData.name, unit: subUnit })}
          titleLocal={localLeads ? talukData.name : (talukData.nameLocal ?? undefined)}
          description={metaLine}
          backHref={districtBase}
          backLabel={t("backTo", { name: districtName })}
        >
          {asOf && <FreshnessPill asOf={asOf} />}
        </SiteHeader>

        {/* 2. The answer in one sentence — only from numbers on record */}
        {hasVillages && (talukPopulation != null || biggest.length > 0) && (
          <Explainer emoji="🏡">
            {talukPopulation != null && (
              <>
                {t.rich("simplePeople", { pop: number(talukPopulation), name: talukData.name, n: villages.length, label: villageInline, b })}{" "}
              </>
            )}
            {biggest.length > 0 &&
              (withPopulation < villages.length
                ? t.rich("simpleBiggestSome", { k: withPopulation, name: biggest[0].name, pop: number(biggest[0].population), b })
                : t.rich("simpleBiggestAll", { name: biggest[0].name, pop: number(biggest[0].population), b }))}
          </Explainer>
        )}

        {/* 3. Stats */}
        <StatStrip cols={Math.max(2, tileCount) as 2 | 3}>
          {showVillages && <StatTile emoji="🏡" label={villageLabel} value={talukData._count.villages} />}
          <StatTile
            emoji="👥"
            label={t("tilePopulation")}
            value={talukPopulation != null ? number(talukPopulation) : "—"}
            asOf={asOf}
          />
          {talukData.area != null && (
            <StatTile emoji="📐" label={t("tileArea")} value={number(talukData.area)} unit={t("unitKm2")} />
          )}
        </StatStrip>

        {/* 4. The pictures — only when at least two villages have a population on record */}
        {biggest.length >= 2 && (
          <div className={showSizes ? "ftp-picture-row" : undefined} style={{ marginTop: 16 }}>
            <ChartCard
              title={t("biggestTitle", { n: biggest.length, label: villageInline })}
              emoji="🏆"
              units={t("biggestUnits")}
              asOf={asOf}
              table={biggest.map((r) => ({ label: r.name, value: number(r.population) }))}
            >
              <BarList
                rows={biggest.map((r) => ({
                  key: r.id,
                  label: r.name,
                  value: r.population,
                  display: t("people", { n: number(r.population) }),
                }))}
              />
            </ChartCard>
            {showSizes && commonest && (
              <ChartCard
                title={t("sizesTitle", { label: villageLabel })}
                emoji="📊"
                units={t("sizesUnits")}
                simple={t.rich("sizesSimple", { count: commonest.value, total: withPopulation, label: villageInline, band: commonest.label, b })}
                asOf={asOf}
                table={sizeSlices.map((s) => ({ label: s.label, value: s.display }))}
              >
                <Donut
                  slices={sizeSlices}
                  label={t("sizesAria", { label: villageLabel, name: talukData.name })}
                  center={number(withPopulation)}
                  centerSub={villageInline}
                />
              </ChartCard>
            )}
          </div>
        )}

        {/* 5. District module links, filtered to this taluk — each in its module colour */}
        <Section title={t("sectionSee", { unit: subUnitInline })} emoji="🔎">
          <div className="ftp-grid" style={{ gap: 10, ["--ftp-grid-min" as string]: "190px" } as React.CSSProperties}>
            {moduleLinks.map(({ slug, label, href }) => (
              <div key={slug} className={hueClass(slug)}>
                <Card tinted href={href} padding={0}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", minHeight: 52 }}>
                    <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 32, height: 32, fontSize: 17, borderRadius: 10 }}>
                      {getModuleMeta(slug)?.emoji ?? "📊"}
                    </span>
                    <span style={{ fontSize: 14, lineHeight: 1.4, fontWeight: 600, color: "var(--ftp-text)" }}>{label}</span>
                    <ChevronRight size={14} aria-hidden style={{ color: "var(--hue)", marginLeft: "auto", flexShrink: 0 }} />
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </Section>

        {/* 6. Village list — tap a village for all its numbers */}
        {hasVillages && (
          <Section
            emoji="🏡"
            title={
              <>
                {t("sectionVillages", { label: villageLabel, name: talukData.name })}{" "}
                <span className="ftp-num" style={{ color: "var(--ftp-text-2)", fontWeight: 400 }}>({number(villages.length)})</span>
              </>
            }
          >
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "-6px 0 12px", fontSize: 14 }}>
              {t("tapHint", { label: villageInline })}
            </p>
            {villages.length > SEARCH_FROM && (
              <label style={{ position: "relative", display: "flex", alignItems: "center", maxWidth: 420, marginBottom: 12 }}>
                <Search size={16} aria-hidden style={{ position: "absolute", insetInlineStart: 12, color: "var(--hue)", pointerEvents: "none" }} />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("searchPlaceholder", { label: villageInline })}
                  aria-label={t("searchPlaceholder", { label: villageInline })}
                  style={{
                    width: "100%",
                    minHeight: 44,
                    padding: "10px 12px",
                    paddingInlineStart: 36,
                    fontSize: 15,
                    fontFamily: "inherit",
                    border: "1px solid color-mix(in srgb, var(--hue) 30%, var(--ftp-border))",
                    borderRadius: "var(--ftp-radius-tile)",
                    background: "var(--ftp-surface)",
                    color: "var(--ftp-text)",
                    boxSizing: "border-box",
                  }}
                />
              </label>
            )}
            {shownVillages.length === 0 ? (
              <EmptyState emoji="🔍" title={t("noMatch", { q: query.trim(), label: villageInline })} />
            ) : (
              <ul className="ftp-grid" style={{ listStyle: "none", margin: 0, padding: 0, gap: 8, ["--ftp-grid-min" as string]: "210px" } as React.CSSProperties}>
                {shownVillages.map((v) => (
                  <li key={v.id}>
                    <TapCard onClick={() => setOpenId(v.id)} label={t("openVillage", { name: v.name })} padding={12}>
                      <span style={{ display: "block", fontSize: 14, lineHeight: 1.4, fontWeight: 600, color: "var(--ftp-text)" }}>{v.name}</span>
                      {v.nameLocal && (
                        <span lang={scriptLang(v.nameLocal) ?? "und"} style={{ display: "block", fontSize: 12, lineHeight: 1.45, color: "var(--hue-deep)" }}>
                          {v.nameLocal}
                        </span>
                      )}
                      {v.population ? (
                        <span className="ftp-num" style={{ display: "block", fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)" }}>
                          {t("people", { n: number(v.population) })}
                        </span>
                      ) : null}
                    </TapCard>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}

        {/* 7. Sources */}
        <SourcesFooter sources={[{ name: mt.label("data-sources"), url: `${districtBase}/data-sources` }]} />
      </ModulePage>

      {/* The village detail sheet */}
      <DetailSheet
        open={!!openVillage}
        onClose={() => setOpenId(null)}
        hueClassName={hue}
        emoji="🏡"
        title={openVillage?.name ?? ""}
        subtitle={openVillage ? t("sheetSub", { taluk: talukData.name, unit: subUnit, district: districtName }) : undefined}
        footer={
          openVillage && (
            <>
              <PrimaryButton href={`${districtBase}/${talukSlug}/${openVillage.id}`}>{t("openPage")}</PrimaryButton>
              {hasMap && (
                <ToolbarButton href={`https://maps.google.com/?q=${openVillage.latitude},${openVillage.longitude}`} external icon={ExternalLink}>
                  {t("viewOnMaps")}
                </ToolbarButton>
              )}
            </>
          )
        }
      >
        {openVillage && (
          <>
            <DetailList
              rows={[
                {
                  emoji: "🔤",
                  label: t("rowLocal"),
                  value: openVillage.nameLocal,
                  lang: openVillage.nameLocal ? scriptLang(openVillage.nameLocal) : undefined,
                },
                { emoji: "👥", label: t("tilePopulation"), value: openPop ? number(openPop) : null },
                { emoji: "🏠", label: t("rowHomes"), value: openHomes ? number(openHomes) : null },
                {
                  emoji: "🧑",
                  label: t("rowPerHome"),
                  value: openPop && openHomes ? number(openPop / openHomes, { maximumFractionDigits: 1 }) : null,
                },
                {
                  emoji: "🏆",
                  label: t("rowRank", { label: villageInline }),
                  value: openRank >= 0 && villagesWithPop.length >= 2 ? t("rankValue", { rank: openRank + 1, total: villagesWithPop.length }) : null,
                },
                {
                  emoji: "🥧",
                  label: t("rowShare", { name: talukData.name }),
                  value: openShare !== null ? `${number(openShare, { maximumFractionDigits: openShare < 10 ? 1 : 0 })}%` : null,
                },
                { emoji: "📮", label: t("rowPin"), value: openVillage.pincode ? <span className="ftp-num">{openVillage.pincode}</span> : null },
              ]}
            />
            {!openPop && !openHomes && !openVillage.pincode && (
              <p className="ftp-body" style={{ color: "var(--ftp-text-2)", fontSize: 14 }}>{t("sheetNoNumbers")}</p>
            )}
            {asOf && <FreshnessPill asOf={asOf} />}
          </>
        )}
      </DetailSheet>
    </div>
  );
}
