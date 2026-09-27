/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Taluk overview — Design v4 "Rang"
// ═══════════════════════════════════════════════════════════════════════
//
//  SiteHeader band in the district's own hue (taluk name + local-script
//  name, back to the district) → StatStrip of emoji tiles (villages,
//  population, area) → the pictures, both from the village rows:
//     • an "In simple words" line and the biggest villages as bars;
//     • a ring of the villages grouped by size (under 500 people, 500 to
//       999 …), only when five or more villages have a population on record
//       and they fall in at least two groups;
//  → "See data for this taluk" module links (registry emoji, each in its
//  module hue, translated module names) → village list as link cards.
//  The labels ("Taluk", "Villages", …) still come from the state config,
//  so a state that calls them "Tehsil" or "Wards" reads correctly; they are
//  translated through the "subUnitOne" and "page_taluk.labels" messages.
//
"use client";
import { use } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight, ArrowLeft, MapPin } from "lucide-react";
import { useTaluks, useOverview } from "@/hooks/useRealtimeData";
import { getStateConfig } from "@/lib/constants/state-config";
import { getDistrictHue, getModuleMeta, hueClass } from "@/lib/design/hues";
import { useFormat, useModuleText } from "@/i18n/client";
import { scriptLang } from "@/lib/utils/script-lang";
import { StatStrip, StatTile, Section, Card, LoadingShell, FreshnessPill } from "@/components/district/ui";
import { ChartCard, Explainer } from "@/components/district/visuals";
import SiteHeader from "@/components/site/SiteHeader";
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

  // The page wears its district's colour (the same hue as the district card on the home page).
  const pageClass = `ftp-container ftp-hue-${getDistrictHue(district)}`;
  const pageStyle: React.CSSProperties = { maxWidth: "var(--ftp-reading-max)", margin: 0, paddingTop: 24, paddingBottom: 48 };

  if (!talukData) {
    return (
      <div className={pageClass} style={pageStyle}>
        <Link
          href={districtBase}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 13, color: "var(--ftp-text-2)", textDecoration: "none" }}
        >
          <ArrowLeft size={14} aria-hidden /> {t("backTo", { name: districtName })}
        </Link>
        <h1 className="ftp-h2" style={{ margin: "4px 0 16px" }}>{t("loading", { unit: subUnitInline })}</h1>
        <LoadingShell rows={3} />
      </div>
    );
  }

  const villages = talukData.villages;
  const hasVillages = showVillages && villages.length > 0;
  // Prefer taluk.population from DB (seeded zone population); fall back to sum of villages.
  const villageSum = villages.reduce((s, v) => s + (v.population ?? 0), 0);
  const talukPopulation = talukData.population ?? (villageSum > 0 ? villageSum : null);

  // Picture 1: the biggest villages that have a population on record.
  const villagesWithPop = villages.filter(
    (v): v is typeof v & { population: number } => typeof v.population === "number" && v.population > 0,
  );
  const withPopulation = villagesWithPop.length;
  const biggest = hasVillages
    ? [...villagesWithPop]
        .sort((a, b2) => b2.population - a.population)
        .slice(0, TOP_VILLAGES)
        .map((v) => ({ name: v.name, population: v.population }))
    : [];

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

  return (
    <div className={pageClass} style={pageStyle}>
      <SiteHeader
        emoji="🏘️"
        icon={MapPin}
        title={t("title", { name: talukData.name, unit: subUnit })}
        titleLocal={talukData.nameLocal ?? undefined}
        description={metaLine}
        backHref={districtBase}
        backLabel={t("backTo", { name: districtName })}
      >
        {asOf && <FreshnessPill asOf={asOf} />}
      </SiteHeader>

      {/* Stats */}
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

      {/* The pictures — only when at least two villages have a population on record */}
      {biggest.length >= 2 && (
        <div className={showSizes ? "ftp-picture-row" : undefined} style={{ marginTop: 16 }}>
          <Card tinted padding={18}>
            <Explainer emoji="🏡">
              {talukPopulation != null && (
                <>
                  {t.rich("simplePeople", { pop: number(talukPopulation), name: talukData.name, n: villages.length, label: villageInline, b })}{" "}
                </>
              )}
              {withPopulation < villages.length
                ? t.rich("simpleBiggestSome", { k: withPopulation, name: biggest[0].name, pop: number(biggest[0].population), b })
                : t.rich("simpleBiggestAll", { name: biggest[0].name, pop: number(biggest[0].population), b })}
            </Explainer>
            <p className="ftp-label" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <span className="ftp-emoji" aria-hidden>🏆</span>
              {t("biggestTitle", { n: biggest.length, label: villageInline })}
            </p>
            <BarList
              rows={biggest.map((r) => ({
                key: r.name,
                label: r.name,
                value: r.population,
                display: t("people", { n: number(r.population) }),
              }))}
            />
          </Card>
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

      {/* District module links, filtered to this taluk — each in its module colour */}
      <Section title={t("sectionSee", { unit: subUnitInline })} emoji="🔎">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(170px, 100%), 1fr))", gap: 10 }}>
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

      {/* Village list — only for districts where villages are meaningful */}
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))", gap: 8 }}>
            {villages.map((v) => (
              <Card key={v.id} href={`/${locale}/${state}/${district}/${talukSlug}/${v.id}`} padding={0}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 14px", minHeight: 48 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, lineHeight: 1.4, fontWeight: 600, color: "var(--ftp-text)" }}>{v.name}</div>
                    {v.nameLocal && (
                      <div lang={scriptLang(v.nameLocal) ?? "und"} style={{ fontSize: 12, lineHeight: 1.45, color: "var(--hue-deep)" }}>{v.nameLocal}</div>
                    )}
                    {v.population ? (
                      <div className="ftp-num" style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)" }}>
                        {t("people", { n: number(v.population) })}
                      </div>
                    ) : null}
                  </div>
                  <ChevronRight size={14} aria-hidden style={{ color: "var(--hue)", flexShrink: 0 }} />
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
