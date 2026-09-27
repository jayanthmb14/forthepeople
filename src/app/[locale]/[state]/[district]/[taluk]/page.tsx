/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Taluk overview — Design v3 "Civic Ledger"
// ═══════════════════════════════════════════════════════════════════════
//
//  PageHeader (taluk name + local-script name, back to the district) →
//  StatStrip (villages, population, area) → "View data for this taluk"
//  module links (Lucide icons) → village list as link cards.
//  The labels ("Taluk", "Villages", …) still come from the state config,
//  so a state that calls them "Tehsil" or "Zone" reads correctly.
//
"use client";
import { use } from "react";
import Link from "next/link";
import {
  MapPin, Users, Home, ChevronRight, ArrowLeft,
  Wheat, Waves, GraduationCap, Building, Droplets, LayoutDashboard,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTaluks, useOverview } from "@/hooks/useRealtimeData";
import { getStateConfig } from "@/lib/constants/state-config";
import { PageHeader, StatStrip, StatTile, Section, Card, LoadingShell } from "@/components/district/ui";

// Taluk overview page — shows taluk stats + village list
export default function TalukPage({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string; taluk: string }>;
}) {
  const { locale, state, district, taluk: talukSlug } = use(params);
  const districtBase = `/${locale}/${state}/${district}`;
  const stateConfig = getStateConfig(state);
  const subUnit = stateConfig?.subDistrictUnit ?? "Taluk";
  const villageLabel = stateConfig?.villageLabel ?? "Villages";
  const showVillages = stateConfig?.showVillages !== false;
  const gramPanchayatApplicable = stateConfig?.gramPanchayatApplicable !== false;
  const jjmApplicable = stateConfig?.jjmApplicable !== false;
  const { data: taluksData } = useTaluks(district, state);
  const { data: overviewData } = useOverview(district, state);

  const talukData = (taluksData?.data ?? []).find((t) => t.slug === talukSlug);
  const districtName = overviewData?.data?.name ?? district;
  // Data date of the taluk records, when the API reports one.
  const asOf = taluksData?.meta?.lastUpdated ?? null;

  const pageStyle: React.CSSProperties = { maxWidth: "var(--ftp-reading-max)", margin: 0, paddingTop: 24, paddingBottom: 48 };

  if (!talukData) {
    return (
      <div className="ftp-container" style={pageStyle}>
        <Link
          href={districtBase}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 13, color: "var(--ftp-text-2)", textDecoration: "none" }}
        >
          <ArrowLeft size={14} aria-hidden /> Back to {districtName}
        </Link>
        <h1 className="ftp-h2" style={{ margin: "4px 0 16px" }}>Loading {subUnit.toLowerCase()}…</h1>
        <LoadingShell rows={3} />
      </div>
    );
  }

  const villages = talukData.villages;
  const hasVillages = showVillages && villages.length > 0;
  // Prefer taluk.population from DB (seeded zone population); fall back to sum of villages.
  const villageSum = villages.reduce((s, v) => s + (v.population ?? 0), 0);
  const talukPopulation = talukData.population ?? (villageSum > 0 ? villageSum : null);

  const moduleLinks: Array<{ label: string; href: string; icon: LucideIcon }> = [
    { label: "Crop Prices", href: `${districtBase}/crops?taluk=${talukSlug}`, icon: Wheat },
    { label: "Water & Dams", href: `${districtBase}/water?taluk=${talukSlug}`, icon: Waves },
    { label: "Schools", href: `${districtBase}/schools?taluk=${talukSlug}`, icon: GraduationCap },
  ];
  if (gramPanchayatApplicable) {
    moduleLinks.push({ label: "Gram Panchayats", href: `${districtBase}/gram-panchayat?taluk=${talukSlug}`, icon: Building });
  }
  if (jjmApplicable) {
    moduleLinks.push({ label: "JJM Coverage", href: `${districtBase}/jjm?taluk=${talukSlug}`, icon: Droplets });
  }
  moduleLinks.push({ label: "Overview", href: districtBase, icon: LayoutDashboard });

  const metaLine = hasVillages
    ? `Part of ${districtName} District · ${villages.length} ${villageLabel.toLowerCase()}`
    : `Part of ${districtName} District · Urban zone`;

  const tileCount = (showVillages ? 1 : 0) + 1 + (talukData.area != null ? 1 : 0);

  return (
    <div className="ftp-container" style={pageStyle}>
      <PageHeader
        icon={MapPin}
        title={`${talukData.name} ${subUnit}`}
        titleLocal={talukData.nameLocal ?? undefined}
        description={metaLine}
        backHref={districtBase}
        backLabel={`Back to ${districtName}`}
        accent="blue"
        freshness={asOf ? { asOf } : undefined}
      />

      {/* Stats */}
      <StatStrip cols={Math.max(2, tileCount) as 2 | 3}>
        {showVillages && <StatTile icon={Home} label={villageLabel} value={talukData._count.villages} />}
        <StatTile
          icon={Users}
          label="Population"
          value={talukPopulation != null ? talukPopulation.toLocaleString("en-IN") : "—"}
          asOf={asOf}
        />
        {talukData.area != null && (
          <StatTile icon={MapPin} label="Area" value={talukData.area.toLocaleString("en-IN")} unit="km²" />
        )}
      </StatStrip>

      {/* District module links, filtered to this taluk */}
      <Section title={`View data for this ${subUnit.toLowerCase()}`}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(160px, 100%), 1fr))", gap: 8 }}>
          {moduleLinks.map(({ label, href, icon: Icon }) => (
            <Card key={label} href={href} padding={0}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px", minHeight: 48 }}>
                <Icon size={16} aria-hidden style={{ color: "var(--ftp-text-2)", flexShrink: 0 }} />
                <span style={{ fontSize: 13, lineHeight: "20px", fontWeight: 500, color: "var(--ftp-text)" }}>{label}</span>
                <ChevronRight size={14} aria-hidden style={{ color: "var(--ftp-text-2)", marginLeft: "auto", flexShrink: 0 }} />
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Village list — only for districts where villages are meaningful */}
      {hasVillages && (
        <Section
          title={
            <>
              {villageLabel} in {talukData.name}{" "}
              <span className="ftp-num" style={{ color: "var(--ftp-text-2)", fontWeight: 400 }}>({villages.length})</span>
            </>
          }
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))", gap: 8 }}>
            {villages.map((v) => (
              <Card key={v.id} href={`/${locale}/${state}/${district}/${talukSlug}/${v.id}`} padding={0}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 14px", minHeight: 48 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, lineHeight: "20px", fontWeight: 500, color: "var(--ftp-text)" }}>{v.name}</div>
                    {v.nameLocal && (
                      <div lang="und" style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{v.nameLocal}</div>
                    )}
                    {v.population && (
                      <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                        <span className="ftp-num" style={{ fontWeight: 400 }}>{v.population.toLocaleString("en-IN")}</span> pop
                      </div>
                    )}
                  </div>
                  <ChevronRight size={14} aria-hidden style={{ color: "var(--ftp-text-2)", flexShrink: 0 }} />
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
