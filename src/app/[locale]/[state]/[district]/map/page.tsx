/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
*/

// ═══════════════════════════════════════════════════════════════════════
//  District Map — Design v4 "Rang" module page (docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  PageHeader → StatStrip of emoji tiles (taluks, villages, area,
//  population) → an "In simple words" line with the same counts → the
//  interactive taluk map (each taluk in its own hue) when our boundary
//  file covers every taluk, otherwise an honest note + a card grid →
//  "How the land is shared": a ring of each taluk's area (only when every
//  taluk has an area on record) with a table view → the list of taluks
//  with village counts, each with a bar for its share of the district's
//  villages → SourcesFooter → Toolbar.
//
//  Map behaviour (click a taluk to open it) is unchanged; only the chrome
//  around it uses the v4 kit and the page hue.
//
//  i18n: interface text is in page_map (en + kn); the sub-district word
//  (Taluk / Mandal / Tehsil…) comes from the shared subUnitOne / subUnits
//  namespaces. Taluk and village names are data.
//
"use client";
import { use, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Map, ChevronRight, Share2 } from "lucide-react";
import { useTaluks, useOverview } from "@/hooks/useRealtimeData";
import {
  PageHeader, StatStrip, StatTile, Section, Card, LoadingShell,
  SourcesFooter, Toolbar, ToolbarButton,
} from "@/components/district/ui";
import { ChartCard, Explainer } from "@/components/district/visuals";
import { OTHER_SHADE, ShareDonut, type DonutSlice } from "@/components/community/CommunityVisuals";
import { useDistrictName } from "@/components/community/usePlaceName";
import TalukMap from "@/components/map/TalukMap";
import { getStateConfig } from "@/lib/constants/state-config";
import { useFormat } from "@/i18n/client";

type TalukCard = {
  slug: string;
  name: string;
  nameLocal?: string | null;
  population?: number | null;
  area?: number | null;
  villageCount: number;
};

interface GeoJSONCollection {
  type?: string;
  features?: Array<{ type?: string; properties?: Record<string, unknown>; geometry?: unknown }>;
}

type Coverage =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "partial"; features: number }
  | { status: "full" };

/** Up to this many taluks get their own slice in the land ring. */
const MAX_LAND_SLICES = 6;

function DistrictMapArea({
  locale,
  state,
  district,
  talukList,
  unitsWord,
  unitWord,
}: {
  locale: string;
  state: string;
  district: string;
  talukList: TalukCard[];
  /** Plural sub-district word for sentences ("taluks", "zones"). */
  unitsWord: string;
  /** Singular sub-district word for the map hint ("taluk", "zone"). */
  unitWord: string;
}) {
  const t = useTranslations("page_map");
  const f = useFormat();
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
        if (!geo || !Array.isArray(geo.features)) {
          setCoverage({ status: "missing" });
          return;
        }
        const count = geo.features.length;
        if (count === 0) {
          setCoverage({ status: "missing" });
        } else if (talukList.length > 0 && count < talukList.length) {
          setCoverage({ status: "partial", features: count });
        } else {
          setCoverage({ status: "full" });
        }
      })
      .catch(() => {
        if (!cancelled) setCoverage({ status: "missing" });
      });
    return () => {
      cancelled = true;
    };
  }, [district, talukList.length]);

  if (coverage.status === "loading") return <LoadingShell rows={2} />;

  // Render the interactive map only when the GeoJSON covers every DB taluk.
  if (coverage.status === "full") {
    const mapTaluks = talukList.map((tk) => ({
      slug: tk.slug,
      name: tk.name,
      population: tk.population ?? undefined,
      villageCount: tk.villageCount,
    }));
    return (
      <Card tinted padding={12}>
        <TalukMap locale={locale} state={state} district={district} taluks={mapTaluks} unitLabel={unitWord} />
      </Card>
    );
  }

  // Fallback: an honest one-line note, then a card grid covering every DB taluk.
  const headline =
    coverage.status === "partial"
      ? t("coveragePartial", { n: f.number(coverage.features), total: f.number(talukList.length), units: unitsWord })
      : t("coverageMissing");

  return (
    <>
      <p
        style={{
          display: "flex", alignItems: "center", gap: 10, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)",
          margin: "0 0 12px", padding: "10px 14px", borderRadius: "var(--ftp-radius-card)",
          background: "var(--hue-tint)", border: "1px dashed color-mix(in srgb, var(--hue) 30%, var(--ftp-border))",
        }}
      >
        <span className="ftp-emoji" aria-hidden style={{ fontSize: 18 }}>🧭</span>
        <span>{headline}</span>
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))",
          gap: 12,
        }}
      >
        {talukList.map((tk) => (
          <Card key={tk.slug} href={`/${locale}/${state}/${district}/${tk.slug}`} padding={14}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 32, height: 32, fontSize: 16, borderRadius: 10 }}>📍</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="ftp-display" style={{ fontSize: 15, lineHeight: "20px", fontWeight: 650, color: "var(--hue-deep)" }}>{tk.name}</div>
                {tk.nameLocal && (
                  <div lang="und" style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", marginTop: 2 }}>
                    {tk.nameLocal}
                  </div>
                )}
                {(tk.population != null || tk.area != null) && (
                  <div className="ftp-num" style={{ fontSize: 12, lineHeight: "16px", fontWeight: 400, color: "var(--ftp-text-2)", marginTop: 6, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {tk.population != null && <span>{t("people", { n: f.number(tk.population) })}</span>}
                    {tk.area != null && <span>{t("areaKm", { n: f.number(tk.area) })}</span>}
                  </div>
                )}
              </div>
              <ChevronRight size={16} aria-hidden style={{ color: "var(--hue)", flexShrink: 0, marginTop: 2 }} />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

/** Share button: the phone's share sheet when available, else copy the link. */
function SharePageButton() {
  const tf = useTranslations("pageFooter");
  const [copied, setCopied] = useState(false);
  function share() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: document.title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => {});
    }
  }
  return <ToolbarButton icon={Share2} onClick={share}>{copied ? tf("copied") : tf("share")}</ToolbarButton>;
}

export default function MapPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_map");
  const tOne = useTranslations("subUnitOne");
  const tMany = useTranslations("subUnits");
  const f = useFormat();
  const base = `/${locale}/${state}/${district}`;
  const stateConfig = getStateConfig(state);
  const subUnit = stateConfig?.subDistrictUnit ?? "Taluk";
  const subUnitPlural = stateConfig?.subDistrictUnitPlural ?? "Taluks";
  const hideVillages = stateConfig?.showVillages === false;
  const { data: taluksData, isLoading: taluksLoading } = useTaluks(district, state);
  const { data: overviewData, isLoading: overviewLoading } = useOverview(district, state);

  const taluks = taluksData?.data ?? [];
  const overview = overviewData?.data;
  const isLoading = taluksLoading || overviewLoading;
  // Data date of the overview record (area / population), when the API has one.
  const overviewAsOf = overviewData?.meta?.lastUpdated ?? null;
  const placeName = useDistrictName(state, district, overview?.name);

  // The sub-district words in the page language. Sentences use lower case
  // (no effect on scripts without case).
  const unitOne = tOne.has(subUnit) ? tOne(subUnit) : subUnit;
  const unitMany = tMany.has(subUnitPlural) ? tMany(subUnitPlural) : subUnitPlural;
  const lower = (s: string) => s.toLocaleLowerCase(locale);
  const unitWord = hideVillages ? lower(t("zone")) : lower(unitOne);
  const unitsWord = hideVillages ? t("zonesWord", { n: taluks.length }) : lower(taluks.length === 1 ? unitOne : unitMany);

  const talukList: TalukCard[] = taluks.map((tk) => ({
    slug: tk.slug,
    name: tk.name,
    nameLocal: tk.nameLocal ?? null,
    population: tk.population ?? null,
    area: tk.area ?? null,
    villageCount: tk._count.villages,
  }));

  const mapSectionLabel = hideVillages ? t("mapSectionUrban") : t("mapSection", { unit: unitOne });
  const listSectionLabel = t("listSection", { units: unitMany });

  // StatStrip wants 2–4 tiles; count the ones we will render.
  const tileCount = 1 + (hideVillages ? 0 : 1) + (overview?.area ? 1 : 0) + (overview?.population ? 1 : 0);

  // The plain-words line: the same counts as the tiles, nothing else.
  const totalVillages = taluks.reduce((s, tk) => s + tk._count.villages, 0);
  const withVillages = !hideVillages && totalVillages > 0;
  const withArea = Boolean(overview?.area);
  const simpleKey = withVillages ? (withArea ? "simpleVillagesArea" : "simpleVillages") : withArea ? "simpleArea" : "simple";
  const bold = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;

  // The land ring: every taluk's area, biggest first. Only when ALL taluks
  // have an area, so the shares add up to the whole district.
  const allHaveArea = talukList.length >= 2 && talukList.every((tk) => typeof tk.area === "number" && tk.area > 0);
  const byArea = allHaveArea ? [...talukList].sort((a, b) => (b.area ?? 0) - (a.area ?? 0)) : [];
  const landTotal = byArea.reduce((s, tk) => s + (tk.area ?? 0), 0);
  const ownSlices = byArea.length > MAX_LAND_SLICES ? byArea.slice(0, MAX_LAND_SLICES - 1) : byArea;
  const restArea = byArea.slice(ownSlices.length).reduce((s, tk) => s + (tk.area ?? 0), 0);
  const landSlices: DonutSlice[] = [
    ...ownSlices.map((tk) => ({ key: tk.slug, label: tk.name, value: tk.area ?? 0 })),
    ...(restArea > 0 ? [{ key: "__other", label: t("landOther", { units: lower(unitMany) }), value: restArea, color: OTHER_SHADE }] : []),
  ];
  const biggest = byArea[0];
  const biggestShare = biggest && landTotal > 0
    ? f.number((biggest.area ?? 0) / landTotal, { style: "percent", maximumFractionDigits: 0 })
    : "";

  return (
    <div className="ftp-container" style={{ maxWidth: "var(--ftp-reading-max)", margin: 0, paddingTop: 24, paddingBottom: 48 }}>
      <PageHeader
        icon={Map}
        title={t("title")}
        description={hideVillages ? t("descriptionUrban") : t("descriptionRural", { unit: lower(unitOne) })}
        backHref={base}
        accent="blue"
        source={{ label: t("sourceLabel") }}
      />
      {isLoading && <LoadingShell rows={4} />}

      {!isLoading && (
        <>
          <StatStrip cols={Math.min(4, Math.max(2, tileCount)) as 2 | 3 | 4}>
            <StatTile emoji="🗺️" label={hideVillages ? t("zones") : unitMany} value={f.number(taluks.length)} />
            {!hideVillages && (
              <StatTile emoji="🏡" label={t("villages")} value={f.number(totalVillages)} />
            )}
            {overview?.area && (
              <StatTile emoji="📐" label={t("area")} value={f.number(overview.area)} unit="km²" asOf={overviewAsOf} />
            )}
            {overview?.population && (
              <StatTile
                emoji="👥"
                label={t("population")}
                value={f.number(overview.population / 100_000, { maximumFractionDigits: 1 })}
                unit={t("lakh")}
                asOf={overviewAsOf}
              />
            )}
          </StatStrip>

          {taluks.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Explainer emoji="🗺️">
                {t.rich(simpleKey, {
                  place: placeName,
                  n: f.number(taluks.length),
                  units: unitsWord,
                  villages: f.number(totalVillages),
                  area: f.number(overview?.area ?? 0),
                  b: bold,
                })}
              </Explainer>
            </div>
          )}

          {/* Map or card-grid fallback */}
          <Section title={mapSectionLabel} emoji="🧭">
            <DistrictMapArea
              locale={locale}
              state={state}
              district={district}
              talukList={talukList}
              unitsWord={unitsWord}
              unitWord={unitWord}
            />
          </Section>

          {/* How the land is shared (area per taluk). */}
          {allHaveArea && biggest && (
            <div style={{ marginTop: 20 }}>
              <ChartCard
                title={t("landTitle")}
                emoji="📐"
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
          )}

          {/* List with village counts for rural districts */}
          {!hideVillages && (
            <Section title={listSectionLabel} emoji="🏘️">
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {taluks.map((tk) => (
                  <li key={tk.id}>
                    <Card href={`/${locale}/${state}/${district}/${tk.slug}`} padding={0}>
                      <div style={{ padding: "12px 16px", minHeight: 56 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                            <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 32, height: 32, fontSize: 16, borderRadius: 10 }}>🏘️</span>
                            <div style={{ minWidth: 0 }}>
                              <div className="ftp-display" style={{ fontSize: 15, lineHeight: "20px", fontWeight: 650, color: "var(--ftp-text)" }}>{tk.name}</div>
                              {tk.nameLocal && (
                                <div lang="und" style={{ fontSize: 13, lineHeight: "20px", color: "var(--hue-deep)" }}>{tk.nameLocal}</div>
                              )}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            <span style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
                              {t.rich("villagesCount", {
                                count: f.number(tk._count.villages),
                                n: tk._count.villages,
                                num: (c) => <span className="ftp-num" style={{ color: "var(--hue-deep)", fontSize: 15 }}>{c}</span>,
                              })}
                            </span>
                            <ChevronRight size={16} aria-hidden style={{ color: "var(--hue)" }} />
                          </div>
                        </div>
                        {/* This taluk's share of the district's villages (same counts as above). */}
                        {totalVillages > 0 && (
                          <div
                            aria-hidden
                            title={t("villageShare", { n: f.number(tk._count.villages), total: f.number(totalVillages) })}
                            style={{ marginTop: 8, height: 6, borderRadius: 999, overflow: "hidden", background: "color-mix(in srgb, var(--hue-tint) 70%, var(--ftp-surface-2))" }}
                          >
                            <div
                              className="ftp-grow-x"
                              style={{
                                height: "100%",
                                width: `${Math.max(2, Math.round((tk._count.villages / totalVillages) * 100))}%`,
                                borderRadius: 999,
                                background: "linear-gradient(90deg, var(--hue-pop), var(--hue))",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </>
      )}

      {/* The taluk shapes (public/geo/<district>-taluks.json) are approximate
          boxes, NOT OpenStreetMap boundaries — the old credit here was wrong.
          Credit the real source once scripts/build-mandya-taluks.mjs (or
          DataMeet) produces surveyed polygons. */}
      <SourcesFooter
        sources={[
          { name: t("sourceShapes", { unit: unitWord }) },
        ]}
      />
      <Toolbar>
        <SharePageButton />
      </Toolbar>
    </div>
  );
}
