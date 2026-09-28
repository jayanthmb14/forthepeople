/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// OverviewCard — the frame of the four summary cards on the district
// overview (leaders, people, projects, money), v5.2 "White Calm":
//
//   ┌──────────────────────────────────────────────┐  ← 2 px hue rule on top
//   │ [drawn mark]  District leaders     View all → │
//   │ …body…                                        │
//   └──────────────────────────────────────────────┘
//
// A white card with a thin rule of the card's hue along the top, a drawn
// picture (overview-art.tsx) on the module tint, the title in the text
// colour, and "View all" as a small link to the module. `tone="gold"`
// uses the gold accent for the rule and the mark instead of the hue.
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
