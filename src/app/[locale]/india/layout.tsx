/**
 * /[locale]/india layout — fluid responsive container.
 *
 * Wraps every India route (/, /category/<slug>, /<moduleSlug>, /updates)
 * with a max-width container that grows with the viewport up to 1600px.
 * Per file 47 §4.6.2: replaces the per-page max-w-1180px clamp.
 *
 * Inner pages can still apply tighter `max-width: 70ch` on text-heavy
 * sections (paragraph prose, taglines) so line lengths stay readable.
 */

import * as React from "react";
import { ScrollProgressBar } from "@/components/india/primitives/ScrollProgressBar";

export default function IndiaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Fixed 2px gradient progress bar at top:0 — scoped to /en/india
          and its sub-routes via this layout file (doesn't appear on /en
          homepage or district pages). Phase C 2026-05-21. */}
      <ScrollProgressBar />
      <div
        style={{
          margin: "0 auto",
          width: "100%",
          maxWidth: "min(96vw, 1600px)",
        }}
      >
        {children}
      </div>
    </>
  );
}
