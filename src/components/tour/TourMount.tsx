/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  TourMount — decides when the first-visit tour appears
// ═══════════════════════════════════════════════════════════════════════
//
//  Mounted once in src/app/[locale]/layout.tsx. It draws nothing itself:
//  the card and the tour (TourLayer) load lazily, in the browser, only
//  when one of them is needed, so the first paint is untouched.
//
//  Auto-offer (the "New here?" card), on the home page and live district
//  pages only (src/lib/tour/route.ts):
//    1. nothing is stored for this tour and storage works
//       (shouldAutoOffer, src/lib/tour/memory.ts);
//    2. ~2.5 s after the page settles, and only while nothing else is
//       open (the home intro, a dialog or sheet, a locked scroll, a tab in
//       the background) — it keeps checking for 30 s, then gives up for
//       this page view;
//    3. at least two of the tour's targets are on the page.
//  The card and the tour hide when the visitor moves to another kind of
//  page; a running tour ends on any change of address.
//
//  Replay: "Take the tour" (footer, phone menu) calls requestTour() —
//  the tour for the current page starts, whatever was stored.
"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { TOUR_START_EVENT, isTourActive } from "@/lib/tour/coordination";
import {
  TOUR_ACCEPTED_KEY,
  TOUR_FIRST_SESSION_KEY,
  readSessionFlag,
  readTourMemory,
  shouldAutoOffer,
  type TourKind,
} from "@/lib/tour/memory";
import { tourKindForPath } from "@/lib/tour/route";
import { MIN_TOUR_STEPS } from "@/lib/tour/steps";
import { pageIsBusy, safeStorage, stepsOnPage } from "./dom";

const TourLayer = dynamic(() => import("./TourLayer"), { ssr: false });

export interface TourView {
  mode: "offer" | "tour";
  kind: TourKind;
  /** Address the view was opened on (a tour ends when it changes). */
  path: string;
}

const SETTLE_MS = 2500;
const RETRY_MS = 1200;
const GIVE_UP_MS = 30_000;

function belongsTo(view: TourView, pathname: string): boolean {
  return view.mode === "offer" ? view.kind === tourKindForPath(pathname) : view.path === pathname;
}

export default function TourMount() {
  const pathname = usePathname() ?? "";
  const kind = tourKindForPath(pathname);
  const [view, setView] = useState<TourView | null>(null);

  // Replay from the footer / menu: the tour for the page we are on now.
  useEffect(() => {
    const onStart = () => {
      const path = window.location.pathname;
      const k = tourKindForPath(path);
      if (k) setView({ mode: "tour", kind: k, path });
    };
    window.addEventListener(TOUR_START_EVENT, onStart);
    return () => window.removeEventListener(TOUR_START_EVENT, onStart);
  }, []);

  // The first-visit offer.
  useEffect(() => {
    if (!kind) return;
    const { ok, memory } = readTourMemory(safeStorage("local"));
    const session = safeStorage("session");
    const offer = shouldAutoOffer({
      kind,
      memory,
      storageOk: ok,
      offeredThisSession: readSessionFlag(session, TOUR_FIRST_SESSION_KEY),
      acceptedThisSession: readSessionFlag(session, TOUR_ACCEPTED_KEY),
    });
    if (!offer) return;

    const started = Date.now();
    let timer = 0;
    const attempt = () => {
      if (Date.now() - started > GIVE_UP_MS) return;
      if (pageIsBusy() || isTourActive()) {
        timer = window.setTimeout(attempt, RETRY_MS);
        return;
      }
      if (stepsOnPage(kind).length < MIN_TOUR_STEPS) return;
      setView((v) => v ?? { mode: "offer", kind, path: window.location.pathname });
    };
    timer = window.setTimeout(attempt, SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [kind]);

  // Another kind of page: the card goes (and does not come back when the
  // visitor returns). A tour belongs to one address.
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    if (view && !belongsTo(view, pathname)) setView(null);
  }

  if (!view || !belongsTo(view, pathname)) return null;

  return <TourLayer key={`${view.mode}:${view.path}`} view={view} onChange={setView} />;
}
