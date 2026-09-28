/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════════════════
//  SupportNudge — a small, once-in-a-while "Sorry to interrupt" card
// ═══════════════════════════════════════════════════════════════════════
//
//  PC / tablet   a 360 px white card in the bottom-LEFT corner (the
//                "Report a problem" button owns the bottom-right).
//  Phone         a card across the bottom, sitting above the 44 px round
//                report button and the safe area.
//
//  Not a modal: no backdrop, no scroll lock, and it never takes the focus.
//  A polite live region tells screen-reader users it appeared; Escape, ✕
//  and "Maybe later" close it. When and whether it appears is decided by
//  decideNudge() in nudge-logic.ts (active time, snoozes, routes, a paid
//  flag, open dialogs, the first-visit tour); storage lives in
//  nudge-store.ts. Loaded lazily by SupportNudgeMount after the page is up.
//
//  Development only: `?nudge=1` shows it at once (ignored in production).

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Heart, X } from "lucide-react";
import { NUMBER_LOCALE } from "@/i18n/languages";
import {
  addActiveTime,
  decideNudge,
  isNudgeRouteBlocked,
  onNudgeDismissed,
  onNudgeShown,
  onNudgeSupportClicked,
  TOUR_FIRST_SESSION_KEY,
  tourBusyFrom,
} from "./nudge-logic";
import { readNudgeSession, readNudgeState, writeNudgeSession, writeNudgeState } from "./nudge-store";
import s from "./nudge.module.css";

/** How often the active-time counter is saved and the rules re-checked. */
const TICK_MS = 5_000;

/** Another dialog, sheet or pop-up on screen (checked cheaply). */
function otherDialogOpen(): boolean {
  try {
    if (document.body.style.overflow === "hidden") return true;
    const found = document.querySelectorAll<HTMLElement>(
      '[aria-modal="true"], dialog[open], [role="dialog"]:not([data-ftp-nudge]), [role="alertdialog"]',
    );
    return Array.from(found).some((el) => el.getClientRects().length > 0);
  } catch {
    return true;
  }
}

/** The first-visit tour is on screen, or was offered this session. */
function tourBusy(): boolean {
  let htmlTour: string | undefined;
  let firstSession: string | null = null;
  try {
    htmlTour = document.documentElement.dataset.ftpTour;
  } catch {
    htmlTour = undefined;
  }
  try {
    firstSession = window.sessionStorage.getItem(TOUR_FIRST_SESSION_KEY);
  } catch {
    firstSession = null;
  }
  return tourBusyFrom(htmlTour, firstSession);
}

export default function SupportNudge({ monthlyFrom, onceFrom }: { monthlyFrom: number | null; onceFrom: number | null }) {
  const t = useTranslations("page_support-nudge");
  const locale = useLocale();
  const pathname = usePathname() ?? "";
  const [visible, setVisible] = useState(false);
  const [announce, setAnnounce] = useState("");
  const titleId = useId();
  const bodyId = useId();

  // Latest route, read inside timers without re-creating them.
  const pathRef = useRef(pathname);
  // True until the visitor moves to another page of this visit.
  const firstViewRef = useRef(false);
  const firstPathRef = useRef<string | null>(null);
  const visibleRef = useRef(false);

  useEffect(() => {
    pathRef.current = pathname;
    if (firstPathRef.current === null) firstPathRef.current = pathname;
    else if (pathname !== firstPathRef.current) firstViewRef.current = false;
    // Moved onto /support (or another quiet page) while it is open: hide it.
    if (visibleRef.current && isNudgeRouteBlocked(pathname)) {
      visibleRef.current = false;
      setVisible(false);
    }
  }, [pathname]);

  const show = useCallback(
    (persist: boolean) => {
      visibleRef.current = true;
      setVisible(true);
      setAnnounce(t("announce"));
      if (!persist) return;
      const now = Date.now();
      const state = readNudgeState();
      if (state) writeNudgeState(onNudgeShown(state, now));
      const session = readNudgeSession();
      if (session) writeNudgeSession({ ...session, shown: true });
    },
    [t],
  );

  // Count active time and check the rules every few seconds.
  useEffect(() => {
    // Development preview: `?nudge=1` shows the card at once, stores nothing.
    if (process.env.NODE_ENV !== "production") {
      try {
        if (new URLSearchParams(window.location.search).get("nudge") === "1") {
          const id = window.setTimeout(() => show(false), 600);
          return () => window.clearTimeout(id);
        }
      } catch {
        /* ignore */
      }
    }

    // First page of this browser session? Remember when the visit began.
    let session = readNudgeSession();
    if (!session) {
      if (!writeNudgeSession({ arrivedAt: Date.now(), shown: false })) return; // storage blocked: never show
      session = readNudgeSession();
      firstViewRef.current = true;
    }
    if (!session || !readNudgeState()) return;

    let last = document.visibilityState === "visible" ? performance.now() : null;
    let stopped = false;

    const flush = () => {
      if (last === null) return true;
      const nowPerf = performance.now();
      const delta = nowPerf - last;
      last = nowPerf;
      const state = readNudgeState();
      if (!state) return false;
      if (state.paid) return false;
      return writeNudgeState(addActiveTime(state, delta));
    };

    const check = () => {
      if (stopped || visibleRef.current) return;
      if (document.visibilityState !== "visible") return;
      if (!flush()) {
        stopped = true;
        return;
      }
      const decision = decideNudge({
        state: readNudgeState(),
        session: readNudgeSession(),
        now: Date.now(),
        pathname: pathRef.current,
        firstPageView: firstViewRef.current,
        otherDialogOpen: otherDialogOpen(),
        tourBusy: tourBusy(),
      });
      if (decision.show) show(true);
      else if (decision.reason === "paid" || decision.reason === "storage" || decision.reason === "shown-this-session") stopped = true;
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        last = performance.now();
      } else {
        flush();
        last = null;
      }
    };
    const onHide = () => {
      flush();
      last = null;
    };

    const id = window.setInterval(check, TICK_MS);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
      flush();
    };
  }, [show]);

  const hide = useCallback(() => {
    visibleRef.current = false;
    setVisible(false);
    setAnnounce("");
  }, []);

  const dismiss = useCallback(() => {
    const state = readNudgeState();
    if (state) writeNudgeState(onNudgeDismissed(state, Date.now()));
    hide();
  }, [hide]);

  const supportClicked = useCallback(() => {
    const state = readNudgeState();
    if (state) writeNudgeState(onNudgeSupportClicked(state, Date.now()));
    hide();
  }, [hide]);

  // While open: Escape closes (unless another dialog owns the Escape key),
  // and the card steps aside if the first-visit tour starts.
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (otherDialogOpen()) return;
      dismiss();
    };
    document.addEventListener("keydown", onKey);
    let observer: MutationObserver | null = null;
    try {
      observer = new MutationObserver(() => {
        if (tourBusyFrom(document.documentElement.dataset.ftpTour, null)) hide();
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-ftp-tour"] });
    } catch {
      observer = null;
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      observer?.disconnect();
    };
  }, [visible, dismiss, hide]);

  const nf = new Intl.NumberFormat(NUMBER_LOCALE);
  const inr = (n: number) => `₹${nf.format(n)}`;
  const priceLine = monthlyFrom !== null && onceFrom !== null ? t("price", { monthly: inr(monthlyFrom), once: inr(onceFrom) }) : null;

  return (
    <>
      <div className="sr-only" aria-live="polite" role="status">
        {announce}
      </div>
      {visible && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          aria-describedby={bodyId}
          data-ftp-nudge=""
          className={s.card}
        >
          <button type="button" className={s.close} aria-label={t("close")} onClick={dismiss}>
            <X size={18} aria-hidden />
          </button>
          <div className={s.head}>
            <span className={s.heart} aria-hidden>
              <Heart size={18} />
            </span>
            <h2 id={titleId} className={s.title}>
              {t("title")}
            </h2>
          </div>
          <div id={bodyId}>
            <p className={s.body}>{t("body")}</p>
            {priceLine && <p className={s.price}>{priceLine}</p>}
          </div>
          <div className={s.actions}>
            <Link href={`/${locale}/support`} className={s.primary} onClick={supportClicked}>
              <Heart size={16} aria-hidden className={s.primaryHeart} />
              {t("support")}
            </Link>
            <button type="button" className={s.secondary} onClick={dismiss}>
              {t("later")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
