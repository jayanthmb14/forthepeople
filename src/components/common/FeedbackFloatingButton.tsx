/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
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
