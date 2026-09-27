/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Farm & Soil — Design v3 module page (CONCEPT-v3 §5)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useSoil() → { soil: village soil-health reports, advisories:
//  weekly KVK / ICAR crop advisories }. Every advisory shows its week
//  ("w/o 12 Sep") and every soil report its test date, so nothing on
//  this page looks newer than it is.
"use client";
import { use } from "react";
import { Leaf } from "lucide-react";
import { useSoil } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  Section,
  Card,
  Pill,
  LoadingShell,
  ErrorBlock,
  AsOfText,
} from "@/components/district/ui";
import type { Tone } from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";
import { ModulePage, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

// pH bands (unchanged): below 6 acidic, above 7.5 alkaline, else neutral.
const PH_LABEL = (ph: number) => ph < 6 ? "Acidic" : ph > 7.5 ? "Alkaline" : "Neutral";
const PH_COLOR = (ph: number) => ph < 6 ? "var(--ftp-danger)" : ph > 7.5 ? "var(--ftp-warn)" : "var(--ftp-live-text)";

// Advisory category → Pill tone.
const CAT_TONE: Record<string, Tone> = {
  pest: "danger", weather: "brand", fertilizer: "live", crop: "features", irrigation: "brand",
};

/** Small labelled value inside a soil card. */
function SoilFigure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="ftp-label">{label}</div>
      {children}
    </div>
  );
}

function FarmPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useSoil(district, state);

  const soilData = data?.data?.soil ?? [];
  const advisories = data?.data?.advisories ?? [];
  const activeAdvisories = advisories.filter((a) => a.active);

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

      <AIInsightCard module="farm" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && soilData.length === 0 && advisories.length === 0 && (
        <NoDataCard module="farm" district={district} state={state} />
      )}

      {!isLoading && activeAdvisories.length > 0 && (
        <Section title="Active advisories">
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {activeAdvisories.map((a) => (
              <Card key={a.id} as="li" padding={14}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Pill tone={CAT_TONE[a.category.toLowerCase()] ?? "neutral"}>{a.category.toUpperCase()}</Pill>
                    <span className="ftp-title">{a.crop}</span>
                    {a.cropLocal && <span lang="und" style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>{a.cropLocal}</span>}
                  </div>
                  <span className="ftp-num" style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", flexShrink: 0 }}>
                    w/o {new Date(a.weekOf).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
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
        <Section title={<>Soil health reports <span className="ftp-num" style={{ color: "var(--ftp-text-2)" }}>({soilData.length} villages)</span></>}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {soilData.map((s) => (
              <Card key={s.id} as="article">
                <h3 className="ftp-title" style={{ marginBottom: 10 }}>{s.villageName ?? "Unknown Village"}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                  {s.pH !== null && s.pH !== undefined && (
                    <SoilFigure label="pH">
                      <div className="ftp-num" style={{ fontSize: 15, lineHeight: "22px", color: PH_COLOR(s.pH) }}>{s.pH.toFixed(1)}</div>
                      <div style={{ fontSize: 11, lineHeight: "16px", color: PH_COLOR(s.pH) }}>{PH_LABEL(s.pH)}</div>
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
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginBottom: 10 }}>
                    {[
                      { label: "N", value: s.nitrogen },
                      { label: "P", value: s.phosphorus },
                      { label: "K", value: s.potassium },
                    ].filter((n) => n.value).map(({ label, value }) => (
                      <SoilFigure key={label} label={label}>
                        <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>{value}</div>
                      </SoilFigure>
                    ))}
                  </div>
                )}
                {s.recommendation && (
                  <div style={{ paddingTop: 10, borderTop: "1px solid var(--ftp-border)" }}>
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
