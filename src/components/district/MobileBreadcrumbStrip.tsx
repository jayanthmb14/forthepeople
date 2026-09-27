/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Session M1 Phase H: mobile-only sticky breadcrumb strip on district
 * pages. The desktop breadcrumb lives inside HeaderBar; that header is
 * hidden on mobile, so this wrapper mounts a fresh DistrictBreadcrumb
 * with the same data (sourced from INDIA_STATES) and lets it open
 * dropdowns as bottom sheets.
 *
 * CSS in mobile.css hides this strip at viewport ≥ 768px.
 *
 * Design v3: the strip is the "where am I" row (India › State › District
 * › Taluk, each opening a bottom sheet to switch). The "All modules"
 * button moved to the 44 px module bar (MobileDistrictChrome), so the
 * old hamburger here is gone. Colours are tokens, set inline so they win
 * over the older mobile.css values.
 */

"use client";

import { usePathname } from "next/navigation";
import {
  INDIA_STATES,
  getState,
  getDistrict,
} from "@/lib/constants/districts";
import { getStateConfig } from "@/lib/constants/state-config";
import DistrictBreadcrumb from "./DistrictBreadcrumb";

// Module-scope helpers — outside the component so React Compiler doesn't
// see them as memoization candidates with mutable dependencies.
function buildPeerStates() {
  const decorated = INDIA_STATES.map((s) => ({
    slug: s.slug,
    name: s.name,
    nameLocal: s.nameLocal,
    isLive: s.districts.some((d) => d.active),
  }));
  decorated.sort((a, b) => {
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return decorated;
}

function buildPeerDistricts(stateData: ReturnType<typeof getState>) {
  const decorated = (stateData?.districts ?? []).map((d) => ({
    slug: d.slug,
    name: d.name,
    nameLocal: d.nameLocal,
    isLive: d.active === true,
  }));
  decorated.sort((a, b) => {
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return decorated;
}

function buildTaluks(districtData: ReturnType<typeof getDistrict>) {
  return (districtData?.taluks ?? []).map((t) => ({
    slug: t.slug,
    name: t.name,
    nameLocal: t.nameLocal,
  }));
}

export function MobileBreadcrumbStrip({ locale }: { locale: string }) {
  const pathname = usePathname() ?? "";
  const parts = pathname.split("/").filter(Boolean);
  const stateSlug = parts[1];
  const districtSlug = parts[2];
  const talukSlug = parts[3];

  const stateData = stateSlug ? getState(stateSlug) : undefined;
  const districtData =
    stateSlug && districtSlug ? getDistrict(stateSlug, districtSlug) : undefined;
  const talukData = talukSlug
    ? districtData?.taluks.find((t) => t.slug === talukSlug)
    : undefined;

  // React Compiler handles memoization of these calls automatically.
  const peerLiveStates = buildPeerStates();
  const peerLiveDistricts = buildPeerDistricts(stateData);
  const taluks = buildTaluks(districtData);

  if (!stateData || !districtData) return null;

  return (
    <div
      className="ftp-m-breadcrumb-strip"
      style={{
        background: "var(--ftp-bg)",
        borderBottom: "1px solid var(--ftp-border)",
        padding: "0 8px",
        minHeight: 44,
      }}
    >
      <DistrictBreadcrumb
        compact
        locale={locale}
        stateSlug={stateSlug!}
        stateName={stateData.name}
        districtSlug={districtSlug!}
        districtName={districtData.name}
        peerLiveStates={peerLiveStates}
        peerLiveDistricts={peerLiveDistricts}
        taluks={taluks}
        currentTalukSlug={talukData?.slug}
        currentTalukName={talukData?.name}
        subdivisionLabel={
          getStateConfig(stateSlug!)?.subDistrictUnit ?? "Sub-district"
        }
      />
    </div>
  );
}
