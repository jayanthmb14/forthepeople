/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// OverviewCard — the frame of the four summary cards on the district
// overview (leaders, people, projects, money), v5.1 "Warm Calm":
//
//   ┌──────────────────────────────────────────────┐
//   │ [drawn mark]  District leaders     View all → │  ← pastel wash of the hue
//   │ …body…                                        │
//   └──────────────────────────────────────────────┘
//
// A soft wash of the card's hue at the top fading into white, a drawn
// picture (overview-art.tsx) in a white medallion, the title in the deep
// hue, and "View all" as a small pill link to the module. `tone="gold"`
// paints the money card in the gold accent instead of its hue.
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { hueClass } from "@/lib/design/hues";

export default function OverviewCard({
  hue,
  tone,
  mark,
  title,
  ariaLabel,
  href,
  linkText,
  children,
}: {
  /** Module slug or hue name for the colours. */
  hue: string;
  tone?: "gold";
  mark: React.ReactNode;
  title: string;
  ariaLabel?: string;
  href: string;
  linkText: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`ftp-ovc ${hueClass(hue)}`} data-tone={tone} aria-label={ariaLabel ?? title}>
      <div className="ftp-ovc-head">
        <span className="ftp-ovc-mark" aria-hidden>
          {mark}
        </span>
        <h3 className="ftp-ovc-title">{title}</h3>
        <Link href={href} className="ftp-ovc-more">
          {linkText}
          <ArrowRight size={14} aria-hidden />
        </Link>
      </div>
      {children}
    </section>
  );
}
