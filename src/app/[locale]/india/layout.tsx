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

export default function IndiaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        margin: "0 auto",
        width: "100%",
        maxWidth: "min(96vw, 1600px)",
      }}
    >
      {children}
    </div>
  );
}
