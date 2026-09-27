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
import { getDistrict, getState } from "@/lib/constants/districts";
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
        talukCount={districtData.talukCount ?? districtData.taluks.length}
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
        // The official count; the list length only when the list is the official one.
        talukCount: districtData.talukCount ?? (districtData.subUnitsUnchecked ? undefined : districtData.taluks.length),
        subUnitsUnchecked: districtData.subUnitsUnchecked ?? false,
        villageCount: districtData.villageCount,
        literacy: districtData.literacy,
        sexRatio: districtData.sexRatio,
        active: districtData.active,
        badges: districtData.badges,
        taluks: districtData.taluks.map((t) => ({
          slug: t.slug,
          name: t.name,
          nameLocal: t.nameLocal,
          tagline: t.tagline,
        })),
      }}
      stateName={stateData.name}
    />
  );
}
