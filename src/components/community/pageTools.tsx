/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Small helpers shared by the "Know your district" pages (news, exams,
// famous people, map, population, contributors):
//   SharePageButton  the phone's share sheet, else copy the link
//   useNow           one "now" per page load, so every countdown on the
//                    page agrees and render stays pure
//   withScheme       make sure a stored URL has https:// before linking
//   cleanText        tidy HTML entities that news feeds leave in text
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Share2 } from "lucide-react";
import { ToolbarButton } from "@/components/district/ui";

/** Share button: the phone's share sheet when available, else copy the link. */
export function SharePageButton() {
  const tf = useTranslations("pageFooter");
  const [copied, setCopied] = useState(false);
  function share() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: document.title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => {});
    }
  }
  return (
    <ToolbarButton icon={Share2} onClick={share}>
      {copied ? tf("copied") : tf("share")}
    </ToolbarButton>
  );
}

/** Milliseconds since 1970 when this page was first drawn (stable across re-renders). */
export function useNow(): number {
  const [now] = useState(currentTime);
  return now;
}

function currentTime(): number {
  return Date.now();
}

/** Make sure a stored URL has a scheme before we link to it. */
export function withScheme(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** News feeds sometimes leave HTML entities in text; tidy them up. */
export function cleanText(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Whole days from `now` to `date` (0 = later today, negative = past). */
export function daysFrom(now: number, date: string | Date): number {
  const ms = new Date(date).getTime() - now;
  return Math.ceil(ms / 86_400_000);
}
