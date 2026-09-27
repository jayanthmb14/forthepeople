/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// The two slots the district layout wraps around every page (v5):
//   ShellTop     above the page — the stale-data notice for the open module
//   ShellBottom  below the page — the verification panel (#verify)
// The overview renders its own versions in its own order (name first,
// sponsors last), so both slots stay empty there.
//
// v5.1: the glance tiles (MP, people, projects, budget, next election) live
// on the overview only. On a module page they read as that page's numbers —
// "Budget ₹2,239 crore" above the Budget page's own figures confused people.
"use client";

import { usePathname } from "next/navigation";
import { districtRoute } from "./path";
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
