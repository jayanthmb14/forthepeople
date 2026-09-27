/**
 * /[locale]/india layout — responsive container.
 *
 * Wraps every India route (/, /category/<slug>, /<moduleSlug>, /updates).
 * v4.1: capped at the kit's 1320 px frame (docs/LAYOUT.md) instead of
 * 1600 px, so the sticky breadcrumb lines up with the page content and
 * wide screens do not stretch the bands. Each page puts its content in
 * the kit's ModulePage frame (phone 16 px, tablet 20 px, laptop/PC 28 px
 * side gutters).
 *
 * Inner pages can still apply tighter `max-width: 72ch` (`.ftp-prose`) on
 * text-heavy blocks so line lengths stay readable.
 */

import * as React from "react";

export default function IndiaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        margin: "0 auto",
        width: "100%",
        maxWidth: 1320,
      }}
    >
      {children}
    </div>
  );
}
