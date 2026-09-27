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
//  population, area) → the picture: an "In simple words" line and the
//  biggest villages as bars, both from the village rows → "See data for
//  this taluk" module links (registry emoji, each in its module hue) →
//  village list as link cards.
//  The labels ("Taluk", "Villages", …) still come from the state config,
//  so a state that calls them "Tehsil" or "Zone" reads correctly.
//
"use client";
import { use } from "react";
import Link from "next/link";
import { ChevronRight, ArrowLeft, MapPin } from "lucide-react";
import { useTaluks, useOverview } from "@/hooks/useRealtimeData";
import { getStateConfig } from "@/lib/constants/state-config";
import { getDistrictHue, getModuleMeta, hueClass } from "@/lib/design/hues";
import { StatStrip, StatTile, Section, Card, LoadingShell, FreshnessPill } from "@/components/district/ui";
import { Explainer } from "@/components/district/visuals";
import SiteHeader from "@/components/site/SiteHeader";

/** How many villages the "biggest villages" picture shows. */
const TOP_VILLAGES = 5;

/**
 * The biggest villages as horizontal bars, each sized against the largest
 * one. The number sits beside the bar, so the picture is only decoration
 * for screen readers (the list carries the facts).
 */
function VillageBars({ rows }: { rows: Array<{ name: string; population: number }> }) {
  const max = rows[0]?.population ?? 0;
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((r, i) => (
        <li key={r.name}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, lineHeight: "20px" }}>
            <span style={{ color: "var(--ftp-text)", fontWeight: 500, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {r.name}
            </span>
            <span className="ftp-num" style={{ color: "var(--hue-deep)", whiteSpace: "nowrap" }}>
              {r.population.toLocaleString("en-IN")} people
            </span>
          </div>
          <div
            aria-hidden
            style={{ marginTop: 4, height: 10, borderRadius: "var(--ftp-radius-pill)", background: "color-mix(in srgb, var(--hue-tint) 70%, var(--ftp-surface-2))", overflow: "hidden" }}
          >
            <div
              className="ftp-grow-x"
              style={{
                width: `${max > 0 ? Math.max(2, Math.round((r.population / max) * 100)) : 0}%`,
                height: "100%",
                borderRadius: "var(--ftp-radius-pill)",
                background: "linear-gradient(90deg, var(--hue-pop), var(--hue))",
                ["--i" as string]: i,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

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

  // The picture: the biggest villages that have a population on record.
  const villagesWithPop = villages.filter(
    (v): v is typeof v & { population: number } => typeof v.population === "number" && v.population > 0,
  );
  const withPopulation = villagesWithPop.length;
  const biggest = hasVillages
    ? [...villagesWithPop]
        .sort((a, b) => b.population - a.population)
        .slice(0, TOP_VILLAGES)
        .map((v) => ({ name: v.name, population: v.population }))
    : [];

  const moduleLinks: Array<{ slug: string; label: string; href: string }> = [
    { slug: "crops", label: "Crop prices", href: `${districtBase}/crops?taluk=${talukSlug}` },
    { slug: "water", label: "Water & dams", href: `${districtBase}/water?taluk=${talukSlug}` },
    { slug: "schools", label: "Schools", href: `${districtBase}/schools?taluk=${talukSlug}` },
  ];
  if (gramPanchayatApplicable) {
    moduleLinks.push({ slug: "gram-panchayat", label: "Gram Panchayats", href: `${districtBase}/gram-panchayat?taluk=${talukSlug}` });
  }
  if (jjmApplicable) {
    moduleLinks.push({ slug: "jjm", label: "JJM coverage", href: `${districtBase}/jjm?taluk=${talukSlug}` });
  }
  moduleLinks.push({ slug: "overview", label: "Overview", href: districtBase });

  const metaLine = hasVillages
    ? `Part of ${districtName} district, with ${villages.length} ${villageLabel.toLowerCase()}.`
    : `Part of ${districtName} district. An urban zone.`;

  const tileCount = (showVillages ? 1 : 0) + 1 + (talukData.area != null ? 1 : 0);

  return (
    <div className={pageClass} style={pageStyle}>
      <SiteHeader
        emoji="🏘️"
        icon={MapPin}
        title={`${talukData.name} ${subUnit}`}
        titleLocal={talukData.nameLocal ?? undefined}
        description={metaLine}
        backHref={districtBase}
        backLabel={`Back to ${districtName}`}
      >
        {asOf && <FreshnessPill asOf={asOf} />}
      </SiteHeader>

      {/* Stats */}
      <StatStrip cols={Math.max(2, tileCount) as 2 | 3}>
        {showVillages && <StatTile emoji="🏡" label={villageLabel} value={talukData._count.villages} />}
        <StatTile
          emoji="👥"
          label="Population"
          value={talukPopulation != null ? talukPopulation.toLocaleString("en-IN") : "—"}
          asOf={asOf}
        />
        {talukData.area != null && (
          <StatTile emoji="📐" label="Area" value={talukData.area.toLocaleString("en-IN")} unit="km²" />
        )}
      </StatStrip>

      {/* The picture — only when at least two villages have a population on record */}
      {biggest.length >= 2 && (
        <Card tinted padding={18} style={{ marginTop: 16 }}>
          <Explainer title="In simple words" emoji="🏡">
            {talukPopulation != null ? (
              <>
                About <strong>{talukPopulation.toLocaleString("en-IN")}</strong> people live in {talukData.name}, across{" "}
                <strong>{villages.length}</strong> {villageLabel.toLowerCase()}.{" "}
              </>
            ) : null}
            {withPopulation < villages.length
              ? `Of the ${withPopulation} with a population on record, the biggest is `
              : "The biggest is "}
            <strong>{biggest[0].name}</strong>, with <strong>{biggest[0].population.toLocaleString("en-IN")}</strong> people.
          </Explainer>
          <p className="ftp-label" style={{ marginBottom: 10 }}>
            The {biggest.length} biggest {villageLabel.toLowerCase()} by people
          </p>
          <VillageBars rows={biggest} />
        </Card>
      )}

      {/* District module links, filtered to this taluk — each in its module colour */}
      <Section title={`See data for this ${subUnit.toLowerCase()}`} emoji="🔎">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(170px, 100%), 1fr))", gap: 10 }}>
          {moduleLinks.map(({ slug, label, href }) => (
            <div key={label} className={hueClass(slug)}>
              <Card tinted href={href} padding={0}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", minHeight: 52 }}>
                  <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 32, height: 32, fontSize: 17, borderRadius: 10 }}>
                    {getModuleMeta(slug)?.emoji ?? "📊"}
                  </span>
                  <span style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)" }}>{label}</span>
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
                    <div style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)" }}>{v.name}</div>
                    {v.nameLocal && (
                      <div lang="und" style={{ fontSize: 12, lineHeight: "16px", color: "var(--hue-deep)" }}>{v.nameLocal}</div>
                    )}
                    {v.population && (
                      <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                        <span className="ftp-num">{v.population.toLocaleString("en-IN")}</span> people
                      </div>
                    )}
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
