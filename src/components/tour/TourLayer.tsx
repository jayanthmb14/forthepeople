/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  TourLayer — the "New here?" card and the step-by-step tour
// ═══════════════════════════════════════════════════════════════════════
//
//  Loaded lazily by TourMount (next/dynamic, browser only).
//
//  The offer (non-modal: it never takes focus, the page stays usable)
//
//    ┌─────────────────────────────────────────┐   bottom-left on PCs,
//    │ (◎) New here? Take a 30-second tour  ✕ │   a bottom card on phones
//    │ See government data for your district — │   (above the round
//    │ every number shows its source and date. │   "Report a problem" flag)
//    │ [Show me]  No thanks                    │
//    └─────────────────────────────────────────┘
//
//  The tour (modal): the page is dimmed (35 %) except a rounded cut-out
//  around the step's element; a small white card sits next to it (above,
//  below or beside; docked at the bottom — or top — on phones):
//
//    ┌─────────────────────────────────────────┐
//    │ Step 2 of 5  ● ● ○ ○ ○                ✕ │
//    │ Your district data                      │
//    │ How many districts are live, …          │
//    │ Skip tour                 [Back] [Next] │
//    └─────────────────────────────────────────┘
//
//  Leaving: "Skip tour", ✕ and Escape end it on every step (stored as
//  "skipped"); the last step's "Done — start exploring" stores "done".
//  Arrow keys go back / next. Clicking the dimmed page does nothing, so a
//  stray tap never throws the visitor out. Focus moves into the card, is
//  kept there while the tour runs (the page behind is `inert`) and goes
//  back to where it was afterwards.
//
//  What is stored and why: src/lib/tour/memory.ts. The contract with other
//  pop-ups (<html data-ftp-tour="active">): src/lib/tour/coordination.ts.
"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { Compass, X } from "lucide-react";
import { markTourActive } from "@/lib/tour/coordination";
import {
  TOUR_ACCEPTED_KEY,
  TOUR_FIRST_SESSION_KEY,
  saveTourOutcome,
  setSessionFlag,
  type TourKind,
} from "@/lib/tour/memory";
import { PHONE_MAX_WIDTH, placeCard, scrollDelta, spotlightRect, type CardPosition, type Rect } from "@/lib/tour/placement";
import type { TourStep } from "@/lib/tour/steps";
import { findTarget, isPinned, prefersReducedMotion, safeStorage, stepsOnPage, stickyTop } from "./dom";
import type { TourView } from "./TourMount";
import s from "./tour.module.css";

interface Props {
  view: TourView;
  onChange: (next: TourView | null) => void;
}

export default function TourLayer({ view, onChange }: Props) {
  const locale = useLocale();

  // <html data-ftp-tour="active"> while the card or the tour is on screen.
  useEffect(() => {
    markTourActive(true);
    return () => markTourActive(false);
  }, []);

  const content =
    view.mode === "offer" ? (
      <TourOffer
        kind={view.kind}
        onAccept={() => {
          setSessionFlag(safeStorage("session"), TOUR_ACCEPTED_KEY);
          onChange({ ...view, mode: "tour" });
        }}
        onDismiss={() => onChange(null)}
      />
    ) : (
      <TourSteps
        kind={view.kind}
        onEnd={(outcome) => {
          saveTourOutcome(safeStorage("local"), view.kind, outcome);
          onChange(null);
        }}
      />
    );

  // Outside the page's root, so the page can be made inert under the tour.
  return createPortal(
    <div lang={locale} className={s.layer}>
      {content}
    </div>,
    document.body,
  );
}

// ── The offer ──────────────────────────────────────────────────────────

function TourOffer({ kind, onAccept, onDismiss }: { kind: TourKind; onAccept: () => void; onDismiss: () => void }) {
  const t = useTranslations("page_tour.offer");
  const titleId = useId();
  // Filled one tick after the live region exists, so screen readers
  // announce it (politely: it never interrupts or takes focus).
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Shown = remembered: "No thanks", ✕, or simply leaving all mean the
    // card never comes back by itself (memory.ts). The session flag tells
    // other cards that a tour was offered in this session.
    saveTourOutcome(safeStorage("local"), kind, "offered-dismissed");
    setSessionFlag(safeStorage("session"), TOUR_FIRST_SESSION_KEY);
    const id = window.setTimeout(() => setReady(true), 30);
    return () => window.clearTimeout(id);
  }, [kind]);

  return (
    <section
      className={s.offer}
      aria-live="polite"
      aria-labelledby={ready ? titleId : undefined}
      aria-label={ready ? undefined : t("aria")}
      data-ready={ready ? "true" : undefined}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onDismiss();
        }
      }}
    >
      {ready && (
        <>
          <div className={s.offerHead}>
            <span className={s.offerIcon} aria-hidden>
              <Compass size={18} />
            </span>
            <p id={titleId} className={s.offerTitle}>
              {t("title")}
            </p>
            <button type="button" className={s.x} onClick={onDismiss} aria-label={t("close")}>
              <X size={18} aria-hidden />
            </button>
          </div>
          <p className={s.offerBody}>{kind === "home" ? t("bodyHome") : t("bodyDistrict")}</p>
          <div className={s.offerActions}>
            <button type="button" className={s.primary} onClick={onAccept}>
              {t("show")}
            </button>
            <button type="button" className={s.quiet} onClick={onDismiss}>
              {t("noThanks")}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

// ── The tour ───────────────────────────────────────────────────────────

interface Layout {
  spot: Rect | null;
  card: CardPosition | null;
}

const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

function TourSteps({ kind, onEnd }: { kind: TourKind; onEnd: (outcome: "done" | "skipped") => void }) {
  const t = useTranslations("page_tour");
  const uid = useId();
  const ids = { title: `${uid}-t`, body: `${uid}-b`, keys: `${uid}-k` };
  // The steps whose element is on this page, fixed when the tour starts.
  const [steps] = useState<TourStep[]>(() => stepsOnPage(kind));
  const [index, setIndex] = useState(0);
  const [layout, setLayout] = useState<Layout>({ spot: null, card: null });
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const targetRef = useRef<HTMLElement | null>(null);

  const step = steps[index] as TourStep | undefined;
  const last = index === steps.length - 1;

  // The parent hands a new onEnd on every render: keep the latest in a ref
  // so the step effects below run once per step, not once per render.
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);
  const finish = useCallback((outcome: "done" | "skipped") => onEndRef.current(outcome), []);
  // The nearest step in that direction whose element is still on the page
  // (a section can go away while the tour runs); -1 when there is none.
  const seek = useCallback(
    (from: number, dir: 1 | -1) => {
      for (let i = from + dir; i >= 0 && i < steps.length; i += dir) if (findTarget(steps[i].target)) return i;
      return -1;
    },
    [steps],
  );
  const next = useCallback(() => {
    const i = seek(index, 1);
    if (i < 0) finish("done");
    else setIndex(i);
  }, [seek, index, finish]);
  const back = useCallback(() => {
    const i = seek(index, -1);
    if (i >= 0) setIndex(i);
  }, [seek, index]);

  // Nothing to show (the page changed under us): end quietly.
  useEffect(() => {
    if (steps.length === 0) finish("skipped");
  }, [steps.length, finish]);

  // Where the spotlight and the card go, from the target's current box.
  const measure = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const el = targetRef.current;
    const box = el && el.isConnected ? el.getBoundingClientRect() : null;
    const spot = box ? spotlightRect({ top: box.top, left: box.left, width: box.width, height: box.height }, { width: vw, height: vh }) : null;
    const card = cardRef.current;
    const size = card ? { width: card.offsetWidth, height: card.offsetHeight } : { width: 0, height: 0 };
    setLayout({ spot, card: card ? placeCard(spot, size, { width: vw, height: vh }) : null });
  }, []);

  // Each step: find the element, bring it into view, focus the card.
  useLayoutEffect(() => {
    if (!step) return;
    const el = findTarget(step.target);
    targetRef.current = el;
    // (If it went away since the tour started, the card docks and the
    // page is dimmed; Next / Back skip steps that are gone.)
    if (el && !isPinned(el)) {
      const box = el.getBoundingClientRect();
      const phone = window.innerWidth <= PHONE_MAX_WIDTH;
      const bottomReserve = phone ? (cardRef.current?.offsetHeight ?? 200) + 24 : 0;
      const by = scrollDelta({ top: box.top, left: box.left, width: box.width, height: box.height }, window.innerHeight, stickyTop(), bottomReserve);
      if (by !== 0) window.scrollBy({ top: by, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
    measure();
    titleRef.current?.focus({ preventScroll: true });
  }, [step, measure]);

  // Follow the element while the page scrolls, resizes or reflows.
  useEffect(() => {
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    window.addEventListener("resize", schedule);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    if (targetRef.current) ro?.observe(targetRef.current);
    if (cardRef.current) ro?.observe(cardRef.current);
    // A smooth scroll can end between events: one late check.
    const late = window.setTimeout(schedule, 700);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      ro?.disconnect();
      window.clearTimeout(late);
    };
  }, [index, measure]);

  // Modal while it runs: the page behind is inert; focus comes back after.
  useEffect(() => {
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.querySelector<HTMLElement>(".ftp-locale-root");
    const wasInert = root?.hasAttribute("inert") ?? false;
    root?.setAttribute("inert", "");
    return () => {
      if (root && !wasInert) root.removeAttribute("inert");
      if (before && before.isConnected) before.focus({ preventScroll: true });
    };
  }, []);

  // Keys: Escape = skip, arrows = back / next, Tab stays in the card.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        finish("skipped");
        return;
      }
      const rtl = document.documentElement.dir === "rtl";
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const forward = (e.key === "ArrowRight") !== rtl;
        if (forward) next();
        else back();
        return;
      }
      if (e.key !== "Tab" || !cardRef.current) return;
      const items = Array.from(cardRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement;
      if (!cardRef.current.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && (active === first || active === titleRef.current)) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && active === lastItem) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [finish, next, back]);

  if (!step) return null;
  const { spot, card } = layout;

  return (
    <>
      {/* Catches every click on the dimmed page and does nothing with it. */}
      <div className={s.blocker} aria-hidden onClick={(e) => e.preventDefault()} />
      {spot ? (
        <div className={s.spot} aria-hidden style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }} />
      ) : (
        <div className={s.dim} aria-hidden />
      )}

      <div
        ref={cardRef}
        className={s.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ids.title}
        aria-describedby={`${ids.body} ${ids.keys}`}
        data-placement={card?.placement}
        style={
          card
            ? { top: card.top, left: card.left, width: card.width }
            : { top: 0, left: 0, visibility: "hidden" }
        }
      >
        <div className={s.cardHead}>
          <span className={s.count}>{t("card.step", { n: index + 1, total: steps.length })}</span>
          <span className={s.dots} aria-hidden>
            {steps.map((x, i) => (
              <span key={x.id} className={s.dot} data-state={i === index ? "now" : i < index ? "done" : undefined} />
            ))}
          </span>
          <button type="button" className={s.x} onClick={() => finish("skipped")} aria-label={t("card.close")}>
            <X size={18} aria-hidden />
          </button>
        </div>

        <div key={step.id} className={s.cardBody}>
          <h2 id={ids.title} ref={titleRef} tabIndex={-1} className={s.cardTitle}>
            {t(`${kind}.${step.id}.title`)}
          </h2>
          <p id={ids.body} className={s.cardText}>
            {t(`${kind}.${step.id}.body`)}
          </p>
        </div>
        <p id={ids.keys} className="sr-only">
          {t("card.keys")}
        </p>

        <div className={s.cardFoot}>
          <button type="button" className={s.skip} onClick={() => finish("skipped")}>
            {t("card.skip")}
          </button>
          <span className={s.nav}>
            {index > 0 && (
              <button type="button" className={s.quiet} onClick={back}>
                {t("card.back")}
              </button>
            )}
            <button type="button" className={s.primary} onClick={next}>
              {last ? t("card.done") : t("card.next")}
            </button>
          </span>
        </div>
      </div>
    </>
  );
}
