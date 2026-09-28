/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// "Take the tour" — a quiet link-style button in the footer (and the slim
// footer on district pages). Starts the tour for the page you are on (home
// or a live district page), whatever you chose before. Renders nothing on
// pages without a tour, so it can sit in any list.
"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { requestTour } from "@/lib/tour/coordination";
import { tourKindForPath } from "@/lib/tour/route";
import s from "./tour.module.css";

export default function TourReplayButton({ before, className }: { before?: ReactNode; className?: string }) {
  const t = useTranslations("page_tour");
  const pathname = usePathname();
  if (!tourKindForPath(pathname)) return null;
  return (
    <li className={className}>
      {before}
      <button type="button" className={s.replay} onClick={requestTour} aria-haspopup="dialog">
        {t("replay")}
      </button>
    </li>
  );
}
