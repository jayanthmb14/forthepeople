/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — District Overview Dashboard
// Shows full dashboard for active districts, preview for locked
// ═══════════════════════════════════════════════════════════
export const revalidate = 300; // ISR: revalidate every 5 minutes

import { notFound } from "next/navigation";
import { getDistrict, getState, shownSubUnits } from "@/lib/constants/districts";
import OverviewClient from "./OverviewClient";
import LockedDistrictPreview from "@/components/district/LockedDistrictPreview";

export default async function DistrictPage({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string }>;
}) {
  const { locale, state: stateSlug, district: districtSlug } = await params;

  const stateData = getState(stateSlug);
  const districtData = getDistrict(stateSlug, districtSlug);
  if (!districtData || !stateData) notFound();
  // Only the sub-district units checked against the district portal (Sept 2026 audit).
  const subUnits = shownSubUnits(stateSlug, districtData);

  // Locked district → show preview page
  if (!districtData.active) {
    return (
      <LockedDistrictPreview
        locale={locale}
        stateSlug={stateSlug}
        districtSlug={districtSlug}
        stateName={stateData.name}
        districtName={districtData.name}
        districtNameLocal={districtData.nameLocal}
        tagline={districtData.tagline}
        population={districtData.population}
        area={districtData.area}
        talukCount={subUnits.count ?? undefined}
        literacy={districtData.literacy}
      />
    );
  }

  // Active district → full dashboard
  return (
    <OverviewClient
      locale={locale}
      stateSlug={stateSlug}
      districtSlug={districtSlug}
      districtData={{
        name: districtData.name,
        nameLocal: districtData.nameLocal,
        tagline: districtData.tagline,
        population: districtData.population,
        area: districtData.area,
        talukCount: subUnits.count ?? undefined,
        villageCount: districtData.villageCount,
        literacy: districtData.literacy,
        sexRatio: districtData.sexRatio,
        active: districtData.active,
        badges: districtData.badges,
        taluks: subUnits.taluks.map((t) => ({
          slug: t.slug,
          name: t.name,
          nameLocal: t.nameLocal,
          tagline: t.tagline,
        })),
        taluksWithoutPage: subUnits.missing,
      }}
      stateName={stateData.name}
    />
  );
}
