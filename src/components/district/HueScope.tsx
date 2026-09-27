/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// HueScope — wraps the district shell (sidebar + main) in the hue of the
// module that is open, e.g. /…/mandya/weather → .ftp-hue-sky. Every kit
// component inside reads --hue / --hue-deep / --hue-pop / --hue-tint, so
// a module page is coloured end to end without per-page wiring.
"use client";

import { usePathname } from "next/navigation";
import { hueClass, moduleFromPath } from "@/lib/design/hues";

export default function HueScope({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const pathname = usePathname();
  const slug = moduleFromPath(pathname);
  return (
    <div className={[hueClass(slug), className].filter(Boolean).join(" ")} data-module={slug} style={style}>
      {children}
    </div>
  );
}
