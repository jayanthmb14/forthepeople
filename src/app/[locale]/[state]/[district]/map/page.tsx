/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
*/

// ═══════════════════════════════════════════════════════════════════════
//  District Map — Design v3 "Civic Ledger" module page (CONCEPT-v3 §5)
// ═══════════════════════════════════════════════════════════════════════
//
//  PageHeader (data accent: blue) → StatStrip (taluks, villages, area,
//  population) → the interactive taluk map when our boundary file covers
//  every taluk, otherwise an honest note + a card grid → the list of
//  taluks with village counts → SourcesFooter → Toolbar.
//
//  Map behaviour (click a taluk to open it) is unchanged; only the chrome
//  around it uses the v3 tokens and kit.
//
"use client";
import { use, useState, useEffect } from "react";
import { Map, ChevronRight, Share2 } from "lucide-react";
import { useTaluks, useOverview } from "@/hooks/useRealtimeData";
import {
  PageHeader, StatStrip, StatTile, Section, Card, LoadingShell,
  SourcesFooter, Toolbar, ToolbarButton,
} from "@/components/district/ui";
import TalukMap from "@/components/map/TalukMap";
import { getStateConfig } from "@/lib/constants/state-config";

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

function DistrictMapArea({
  locale,
  state,
  district,
  talukList,
  urbanLabel,
}: {
  locale: string;
  state: string;
  district: string;
  talukList: TalukCard[];
  urbanLabel: boolean;
}) {
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
    const mapTaluks = talukList.map((t) => ({
      slug: t.slug,
      name: t.name,
      population: t.population ?? undefined,
      villageCount: t.villageCount,
    }));
    return (
      <Card>
        <TalukMap locale={locale} state={state} district={district} taluks={mapTaluks} />
      </Card>
    );
  }

  // Fallback: an honest one-line note, then a card grid covering every DB taluk.
  const headline =
    coverage.status === "partial"
      ? `Boundary data covers ${coverage.features} of ${talukList.length} ${urbanLabel ? "zones" : "taluks"} — showing the full list below.`
      : "Boundary data is being prepared — showing the full list below.";

  return (
    <>
      <p style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", margin: "0 0 12px" }}>
        <Map size={16} aria-hidden style={{ flexShrink: 0 }} />
        <span>{headline}</span>
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))",
          gap: 12,
        }}
      >
        {talukList.map((t) => (
          <Card key={t.slug} href={`/${locale}/${state}/${district}/${t.slug}`} padding={14}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="ftp-title" style={{ fontSize: 14, lineHeight: "20px" }}>{t.name}</div>
                {t.nameLocal && (
                  <div lang="und" style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", marginTop: 2 }}>
                    {t.nameLocal}
                  </div>
                )}
                {(t.population != null || t.area != null) && (
                  <div className="ftp-num" style={{ fontSize: 11, lineHeight: "16px", fontWeight: 400, color: "var(--ftp-text-2)", marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {t.population != null && <span>{t.population.toLocaleString("en-IN")} pop</span>}
                    {t.area != null && <span>· {t.area} km²</span>}
                  </div>
                )}
              </div>
              <ChevronRight size={16} aria-hidden style={{ color: "var(--ftp-text-2)", flexShrink: 0, marginTop: 2 }} />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

/** Share button: the phone's share sheet when available, else copy the link. */
function SharePageButton() {
  const [copied, setCopied] = useState(false);
  function share() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: document.title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => {});
    }
  }
  return <ToolbarButton icon={Share2} onClick={share}>{copied ? "Link copied" : "Share"}</ToolbarButton>;
}

export default function MapPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
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

  const talukList: TalukCard[] = taluks.map((t) => ({
    slug: t.slug,
    name: t.name,
    nameLocal: t.nameLocal ?? null,
    population: t.population ?? null,
    area: t.area ?? null,
    villageCount: t._count.villages,
  }));

  const mapSectionLabel = hideVillages ? "Urban zones" : `${subUnit} map`;
  const listSectionLabel = hideVillages
    ? `Zones in ${overview?.name ?? "this district"}`
    : `${subUnitPlural}${hideVillages ? "" : " & villages"}`;

  // StatStrip wants 2–4 tiles; count the ones we will render.
  const tileCount = 1 + (hideVillages ? 0 : 1) + (overview?.area ? 1 : 0) + (overview?.population ? 1 : 0);

  return (
    <div className="ftp-container" style={{ maxWidth: "var(--ftp-reading-max)", margin: 0, paddingTop: 24, paddingBottom: 48 }}>
      <PageHeader
        icon={Map}
        title="District Map"
        description={
          hideVillages
            ? "Browse the urban zones of this district — click any zone to see its data"
            : `Interactive ${subUnit.toLowerCase()} map — click to explore each ${subUnit.toLowerCase()}`
        }
        backHref={base}
        accent="blue"
        source={{ label: "OpenStreetMap", href: "https://www.openstreetmap.org/copyright" }}
      />
      {isLoading && <LoadingShell rows={4} />}

      {!isLoading && (
        <>
          <StatStrip cols={Math.min(4, Math.max(2, tileCount)) as 2 | 3 | 4}>
            <StatTile label={hideVillages ? "Zones" : subUnitPlural} value={taluks.length} icon={Map} />
            {!hideVillages && (
              <StatTile label="Villages" value={taluks.reduce((s, t) => s + t._count.villages, 0).toLocaleString("en-IN")} />
            )}
            {overview?.area && (
              <StatTile label="Area" value={overview.area.toLocaleString("en-IN")} unit="km²" asOf={overviewAsOf} />
            )}
            {overview?.population && (
              <StatTile label="Population" value={(overview.population / 1000000).toFixed(2)} unit="M" asOf={overviewAsOf} />
            )}
          </StatStrip>

          {/* Map or card-grid fallback */}
          <Section title={mapSectionLabel}>
            <DistrictMapArea
              locale={locale}
              state={state}
              district={district}
              talukList={talukList}
              urbanLabel={hideVillages}
            />
          </Section>

          {/* List with village counts for rural districts */}
          {!hideVillages && (
            <Section title={listSectionLabel}>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {taluks.map((t) => (
                  <li key={t.id}>
                    <Card href={`/${locale}/${state}/${district}/${t.slug}`} padding={0}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 16px", minHeight: 56 }}>
                        <div style={{ minWidth: 0 }}>
                          <div className="ftp-title" style={{ fontSize: 14, lineHeight: "20px" }}>{t.name}</div>
                          {t.nameLocal && (
                            <div lang="und" style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{t.nameLocal}</div>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
                            <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{t._count.villages}</span> villages
                          </span>
                          <ChevronRight size={16} aria-hidden style={{ color: "var(--ftp-text-2)" }} />
                        </div>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </>
      )}

      {/* Taluk boundaries are built from OpenStreetMap (scripts/build-mandya-taluks.mjs).
          If a district's boundary file comes from elsewhere, add it here. */}
      <SourcesFooter
        sources={[
          { name: "OpenStreetMap contributors (taluk boundaries)", url: "https://www.openstreetmap.org/copyright", licence: "ODbL" },
        ]}
      />
      <Toolbar>
        <SharePageButton />
      </Toolbar>
    </div>
  );
}
