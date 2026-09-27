/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// The two slots the district layout wraps around every page (v5):
//   ShellTop     above the page — the glance row (one scrolling line of key
//                facts) and the stale-data notice for the open module
//   ShellBottom  below the page — the verification panel (#verify)
// The overview renders its own versions in its own order (name first,
// sponsors last), so both slots stay empty there.
"use client";

import { usePathname } from "next/navigation";
import { districtRoute } from "./path";
import GlanceRow from "./GlanceRow";
import StaleDataNotice from "./StaleDataNotice";
import VerifyPanel from "./VerifyPanel";

interface Props {
  stateSlug: string;
  districtSlug: string;
}

export function ShellTop({ stateSlug, districtSlug }: Props) {
  const route = districtRoute(usePathname());
  if (route.kind === "overview") return null;
  return (
    <div className="ftp-dshell-strip" data-pos="top">
      <GlanceRow compact stateSlug={stateSlug} districtSlug={districtSlug} />
      <StaleDataNotice stateSlug={stateSlug} districtSlug={districtSlug} />
    </div>
  );
}

export function ShellBottom({ stateSlug, districtSlug }: Props) {
  const route = districtRoute(usePathname());
  if (route.kind === "overview") return null;
  return (
    <div className="ftp-dshell-strip" data-pos="bottom">
      <VerifyPanel stateSlug={stateSlug} districtSlug={districtSlug} />
    </div>
  );
}
