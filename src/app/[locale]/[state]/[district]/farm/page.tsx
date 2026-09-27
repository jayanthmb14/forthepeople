/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Farm & Soil — Design v4 "Rang" module page (docs/DESIGN-SYSTEM.md §4)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useSoil() → { soil: village soil-health reports, advisories:
//  weekly KVK / ICAR crop advisories }. Every advisory shows its week
//  ("Week of 12 Sep") and every soil report its test date, so nothing on
//  this page looks newer than it is. For that reason the header carries
//  no "Updated" pill: the fetch time would read newer than the data.
//
//  Page order: header → summary → AI insight → emoji StatTiles → picture
//  row (soil pH in plain words + a pH strip with one dot per village) →
//  active advisories → soil cards → sources → news → toolbar.
"use client";
import { use } from "react";
import { Leaf } from "lucide-react";
import { useSoil } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  Section,
  Card,
  Pill,
  StatStrip,
  StatTile,
  LoadingShell,
  ErrorBlock,
  EmptyState,
  AsOfText,
} from "@/components/district/ui";
import { Explainer, Pictogram } from "@/components/district/visuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";
import { ModulePage, ModuleSummary, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { PhScale, advisoryEmoji, PH_ACIDIC_BELOW, PH_ALKALINE_ABOVE } from "@/components/farm/SoilVisuals";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { getDistrict } from "@/lib/constants/districts";

// pH bands (unchanged): below 6 acidic, above 7.5 alkaline, else neutral.
const PH_LABEL = (ph: number) => ph < PH_ACIDIC_BELOW ? "Acidic" : ph > PH_ALKALINE_ABOVE ? "Alkaline" : "Neutral";
const PH_COLOR = (ph: number) => ph < PH_ACIDIC_BELOW ? "var(--ftp-danger)" : ph > PH_ALKALINE_ABOVE ? "var(--ftp-warn)" : "var(--ftp-live-text)";

/** "12 Sep" — the first day of an advisory's week. */
function weekDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

/** "Week of 12 Sep" for an advisory's week. */
function weekLabel(iso: string): string {
  return `Week of ${weekDate(iso)}`;
}

/** "Pest" from "pest" / "PEST" — category chips are sentence case. */
function sentenceCase(s: string): string {
  const t = s.trim().toLowerCase();
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

/** Small labelled value inside a soil card. */
function SoilFigure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="ftp-label">{label}</div>
      {children}
    </div>
  );
}

/** Category chip for an advisory: pest warnings keep the danger tone, the rest wear the page hue. */
function CategoryChip({ category }: { category: string }) {
  const emoji = advisoryEmoji(category);
  const label = sentenceCase(category);
  if (category.toLowerCase().includes("pest")) {
    return (
      <Pill tone="danger">
        <span className="ftp-emoji" aria-hidden>{emoji}</span>
        {label}
      </Pill>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 24,
        padding: "0 9px",
        borderRadius: "var(--ftp-radius-pill)",
        background: "var(--hue-tint)",
        color: "var(--hue-deep)",
        fontSize: 12,
        lineHeight: "16px",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      <span className="ftp-emoji" aria-hidden>{emoji}</span>
      {label}
    </span>
  );
}

function FarmPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const districtName = getDistrict(state, district)?.name ?? district.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const { data, isLoading, error } = useSoil(district, state);

  const soilData = data?.data?.soil ?? [];
  const advisories = data?.data?.advisories ?? [];
  const activeAdvisories = advisories.filter((a) => a.active);

  // Soil pH figures for the tiles and the picture — only villages whose
  // report has a pH reading count.
  const phReadings = soilData.flatMap((s) => (s.pH !== null && s.pH !== undefined ? [{ id: s.id, ph: s.pH }] : []));
  const acidicCount = phReadings.filter((r) => r.ph < PH_ACIDIC_BELOW).length;
  const alkalineCount = phReadings.filter((r) => r.ph > PH_ALKALINE_ABOVE).length;
  const neutralCount = phReadings.length - acidicCount - alkalineCount;
  const avgPh = phReadings.length > 0 ? phReadings.reduce((s, r) => s + r.ph, 0) / phReadings.length : null;
  const latestTest = soilData.reduce<string | null>((best, s) => (s.testedAt && (!best || s.testedAt > best) ? s.testedAt : best), null);
  const latestWeek = activeAdvisories.reduce<string | null>((best, a) => (!best || a.weekOf > best ? a.weekOf : best), null);

  const neutralPicture =
    phReadings.length <= 12
      ? { filled: neutralCount, total: phReadings.length, label: `${neutralCount} of ${phReadings.length} villages have neutral soil.` }
      : {
          filled: (neutralCount / phReadings.length) * 10,
          total: 10,
          label: `About ${Math.round((neutralCount / phReadings.length) * 10)} of every 10 villages have neutral soil.`,
        };

  return (
    <ModulePage>
      <PageHeader
        icon={Leaf}
        title="Farm & Soil"
        description="Soil health reports and agri advisory for farmers"
        backHref={base}
        accent={getModuleAccent("farm")}
        source={{ label: "Soil Health Card", href: "https://soilhealth.dac.gov.in" }}
      />

      {/* Plain-language summary — also what search engines and AI crawlers read. */}
      <ModuleSummary>
        This page shows soil health test results for villages in this district from the Soil Health Card portal, and
        weekly crop advisories from the local Krishi Vigyan Kendra (KVK) and ICAR. Each advisory shows the week it is
        for, and each soil report shows the date the soil was tested.
      </ModuleSummary>

      <AIInsightCard module="farm" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && soilData.length === 0 && advisories.length === 0 && (
        <div style={{ marginBottom: 20 }}>
          <EmptyState
            emoji="🌱"
            title={`No soil reports or crop advisories for ${districtName} yet.`}
            body="Soil health records and weekly advisories from the local Krishi Vigyan Kendra (KVK) and ICAR will show here once we receive them."
            action={
              <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: 0 }}>
                Data is sourced from official government portals under India&apos;s Open Data Policy (NDSAP).
              </p>
            }
          />
        </div>
      )}

      {!isLoading && (soilData.length > 0 || advisories.length > 0) && (
        <div style={{ marginBottom: 8 }}>
          <StatStrip>
            {advisories.length > 0 && (
              <StatTile
                emoji="📢"
                label="Active advisories"
                value={activeAdvisories.length}
                sub={latestWeek ? `Newest is for the week of ${weekDate(latestWeek)}` : "None active right now"}
              />
            )}
            {soilData.length > 0 && (
              <StatTile emoji="🧪" label="Villages with soil tests" value={soilData.length} asOf={latestTest} />
            )}
            {avgPh !== null && (
              <StatTile
                emoji="⚖️"
                label="Average soil pH"
                value={avgPh.toFixed(1)}
                sub={`${PH_LABEL(avgPh)} on average, from ${phReadings.length} ${phReadings.length === 1 ? "village" : "villages"}`}
                countUp={false}
              />
            )}
            {phReadings.length > 0 && (
              <StatTile
                emoji="🌱"
                label="Villages with neutral soil"
                value={`${neutralCount}/${phReadings.length}`}
                sub={`pH between ${PH_ACIDIC_BELOW} and ${PH_ALKALINE_ABOVE}`}
                countUp={false}
              />
            )}
          </StatStrip>
        </div>
      )}

      {/* The picture: soil pH in one plain sentence, a row of village
          sprouts lit for neutral soil, and every village as a dot on a pH
          strip. Needs at least two villages with a pH reading. */}
      {!isLoading && phReadings.length >= 2 && (
        <div className="ftp-picture-row" style={{ marginTop: 16 }}>
          <Card tinted padding={18}>
            <Explainer title="In simple words" emoji="🧪">
              Soil pH was measured in <strong>{phReadings.length}</strong> villages. In <strong>{neutralCount}</strong> of them the soil
              is neutral (pH {PH_ACIDIC_BELOW} to {PH_ALKALINE_ABOVE}), which most crops grow well in.{" "}
              {acidicCount > 0 && (
                <>
                  <strong>{acidicCount}</strong> {acidicCount === 1 ? "has" : "have"} acidic soil
                  {alkalineCount > 0 ? " and " : "."}
                </>
              )}
              {alkalineCount > 0 && (
                <>
                  <strong>{alkalineCount}</strong> {alkalineCount === 1 ? "has" : "have"} alkaline soil.
                </>
              )}
            </Explainer>
            <Pictogram filled={neutralPicture.filled} total={neutralPicture.total} emoji="🌱" label={neutralPicture.label} size={24} />
          </Card>
          <Card tinted padding={18} style={{ display: "flex", alignItems: "center" }}>
            <PhScale readings={phReadings} />
          </Card>
        </div>
      )}

      {!isLoading && activeAdvisories.length > 0 && (
        <Section title="Active advisories" emoji="📢">
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {activeAdvisories.map((a) => (
              <Card key={a.id} as="li" padding={14}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <CategoryChip category={a.category} />
                    <span className="ftp-title">{a.crop}</span>
                    {a.cropLocal && <span lang="und" style={{ fontSize: 13, color: "var(--hue-deep)" }}>{a.cropLocal}</span>}
                  </div>
                  <span className="ftp-num" style={{ fontSize: 12, lineHeight: "16px", fontWeight: 500, color: "var(--ftp-text-2)", flexShrink: 0 }}>
                    {weekLabel(a.weekOf)}
                  </span>
                </div>
                <p className="ftp-body" style={{ margin: 0 }}>{a.advisory}</p>
                {a.advisoryLocal && (
                  <p lang="und" className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "6px 0 0" }}>{a.advisoryLocal}</p>
                )}
              </Card>
            ))}
          </ul>
        </Section>
      )}

      {!isLoading && soilData.length > 0 && (
        <Section
          emoji="🧪"
          title={<>Soil health reports <span className="ftp-num" style={{ color: "var(--ftp-text-2)" }}>({soilData.length} villages)</span></>}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {soilData.map((s) => (
              <Card key={s.id} as="article">
                <h3 className="ftp-title" style={{ marginBottom: 10 }}>{s.villageName ?? "Village not named"}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                  {s.pH !== null && s.pH !== undefined && (
                    <SoilFigure label="pH">
                      <div className="ftp-num" style={{ fontSize: 17, lineHeight: "24px", color: PH_COLOR(s.pH) }}>{s.pH.toFixed(1)}</div>
                      <div style={{ fontSize: 12, lineHeight: "16px", color: PH_COLOR(s.pH) }}>{PH_LABEL(s.pH)}</div>
                    </SoilFigure>
                  )}
                  {s.organicCarbon && (
                    <SoilFigure label="Organic carbon">
                      <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>{s.organicCarbon}</div>
                    </SoilFigure>
                  )}
                </div>
                {/* Nitrogen / Phosphorus / Potassium levels as reported. */}
                {(s.nitrogen || s.phosphorus || s.potassium) && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {[
                      { label: "Nitrogen", value: s.nitrogen },
                      { label: "Phosphorus", value: s.phosphorus },
                      { label: "Potassium", value: s.potassium },
                    ].filter((n) => n.value).map(({ label, value }) => (
                      <span
                        key={label}
                        style={{
                          display: "inline-flex",
                          alignItems: "baseline",
                          gap: 4,
                          padding: "3px 9px",
                          borderRadius: "var(--ftp-radius-pill)",
                          background: "var(--hue-tint)",
                          fontSize: 12,
                          lineHeight: "18px",
                        }}
                      >
                        <span style={{ color: "var(--ftp-text-2)", fontWeight: 600 }}>{label}</span>
                        <span style={{ color: "var(--hue-deep)", fontWeight: 600 }}>{value}</span>
                      </span>
                    ))}
                  </div>
                )}
                {s.recommendation && (
                  <div style={{ paddingTop: 10, borderTop: "1px solid color-mix(in srgb, var(--hue) 18%, var(--ftp-border))" }}>
                    <div className="ftp-label" style={{ marginBottom: 2 }}>Recommendation</div>
                    <p className="ftp-body" style={{ margin: 0 }}>{s.recommendation}</p>
                  </div>
                )}
                {s.testedAt && (
                  <div style={{ marginTop: 8 }}>
                    <AsOfText asOf={s.testedAt} prefix="Tested" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </Section>
      )}

      <ModuleSources module="farm" state={state} />
      <ModuleNews district={district} state={state} locale={locale} module="farm" />
      <ModuleToolbar
        locale={locale}
        district={district}
        moduleSlug="farm"
        moduleLabel="Farm & Soil"
        shareText={`Farm advisories and soil health for ${district}: ${activeAdvisories.length} active advisories, ${soilData.length} village soil reports`}
      />
    </ModulePage>
  );
}

export default function FarmPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Farm & Soil">
      <FarmPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
