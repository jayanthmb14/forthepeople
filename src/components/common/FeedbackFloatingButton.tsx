/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// The floating "Report issue" pill on every district page. This file only
// works out which module the visitor is on (so the report carries context);
// the pill itself (Lucide Flag icon, 44 px, token colours, no shadow) and
// the form it opens are drawn by FeedbackModal with `floating` set.
import { usePathname } from "next/navigation";
import FeedbackModal from "./FeedbackModal";

interface Props {
  stateSlug: string;
  districtSlug: string;
}

// Extracts the module from a district URL like /en/karnataka/mandya/crops
function getModuleFromPath(pathname: string, districtSlug: string): string | undefined {
  const parts = pathname.split("/");
  const idx = parts.indexOf(districtSlug);
  if (idx !== -1 && parts[idx + 1]) {
    return parts[idx + 1];
  }
  return undefined;
}

export default function FeedbackFloatingButton({ stateSlug, districtSlug }: Props) {
  const pathname = usePathname();
  const moduleName = getModuleFromPath(pathname, districtSlug);

  return (
    <FeedbackModal
      floating
      districtSlug={districtSlug}
      stateSlug={stateSlug}
      module={moduleName}
    />
  );
}
