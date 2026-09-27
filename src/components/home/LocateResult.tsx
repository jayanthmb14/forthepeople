/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  LocateResult — the ONE place a "Use my location" result is shown
// ═══════════════════════════════════════════════════════════════════════
//
//  floating (home hero)   a card that pops up at the bottom of the screen.
//                         Non-modal: the page stays usable. × or Escape
//                         closes it; focus moves to its heading.
//  inline (district finder in the header)  the same card inside the sheet.
//
//  What it says:
//    live district       "You are in Mandya, Karnataka" + Open Mandya's dashboards
//    not live yet        "Kanpur is not live yet" + Vote for Kanpur + the
//                        nearest live district and its distance
//    location blocked    how to switch location on for this site, and a
//                        button to choose from the list instead
//    other errors        one plain sentence + Try again / choose from list
//
"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, LocateFixed, X } from "lucide-react";
import { getDistrict } from "@/lib/constants/districts";
import { usePlaceText } from "@/i18n/client";
import { districtNameIn, placeNamePair } from "@/i18n/place-name";
import type { LocateStatus } from "./useLocate";
import DistrictLandmark, { hasLandmark } from "./DistrictLandmark";
import s from "./finder.module.css";

export interface LocateResultProps {
  status: LocateStatus;
  floating?: boolean;
  onClose: () => void;
  onRetry: () => void;
  /** "Choose your district from the list" (focus a search box, open the finder…). */
  onChooseInstead?: () => void;
  /** Called when the visitor follows a link in the card. */
  onNavigate?: () => void;
}

export default function LocateResult({ status, floating = false, onClose, onRetry, onChooseInstead, onNavigate }: LocateResultProps) {
  const t = useTranslations("locate");
  const tp = useTranslations("popup");
  const locale = useLocale();
  const place = usePlaceText();
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Floating card: focus its heading and let Escape close it.
  useEffect(() => {
    if (!floating) return;
    headingRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [floating, onClose, status.kind]);

  if (status.kind === "idle" || status.kind === "locating") return null;

  let body: React.ReactNode;
  if (status.kind === "found-live" || status.kind === "found-coming") {
    const d = status.district;
    const reg = d ? getDistrict(d.stateSlug, d.slug) : undefined;
    const pair = d ? placeNamePair({ name: d.name, nameLocal: reg?.nameLocal, names: reg?.names }, locale) : null;
    const title = pair ? pair.primary : place.state(status.kind === "found-coming" ? status.stateSlug : "", status.kind === "found-coming" ? status.stateName : "");
    const stateLabel = d ? place.state(d.stateSlug, d.stateName) : "";
    body = (
      <>
        <div className={s.resultHead}>
          <span className={s.resultBadge} aria-hidden>
            {d && hasLandmark(d.slug) ? <DistrictLandmark slug={d.slug} size={30} /> : <LocateFixed size={22} />}
          </span>
          <div style={{ minWidth: 0 }}>
            <p className={s.resultEyebrow}>{tp("youAreIn")}</p>
            <h2 ref={headingRef} tabIndex={-1} className={s.resultTitle}>
              <span lang={pair?.primaryLang}>{title}</span>
              {pair?.secondary && (
                <span className={s.resultLocal} lang={pair.secondaryLang}>
                  {pair.secondary}
                </span>
              )}
            </h2>
            {stateLabel && <p className={s.resultState}>{stateLabel}</p>}
          </div>
        </div>
        {status.kind === "found-live" && d ? (
          <>
            {reg?.tagline && <p className={s.resultTag}>{place.label(reg.tagline)}</p>}
            <div className={s.resultActions}>
              <Link href={`/${locale}/${d.stateSlug}/${d.slug}`} className={s.btnPrimary} onClick={onNavigate}>
                {tp("open", { name: title })}
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          </>
        ) : status.kind === "found-coming" ? (
          <>
            <p className={s.resultBody}>{d ? tp("notLive", { name: title }) : tp("stateNotLive", { state: title })}</p>
            <div className={s.resultActions}>
              {d && (
                <Link href={`/${locale}/vote-district?d=${d.slug}`} className={s.btnPrimary} onClick={onNavigate}>
                  {tp("vote", { name: title })}
                </Link>
              )}
              {status.nearestLive && (
                <Link
                  href={`/${locale}/${status.nearestLive.stateSlug}/${status.nearestLive.slug}`}
                  className={s.btnOutline}
                  onClick={onNavigate}
                >
                  {tp("nearest", { name: districtNameIn(locale, status.nearestLive), km: status.nearestLive.km })}
                </Link>
              )}
            </div>
          </>
        ) : null}
      </>
    );
  } else {
    const denied = status.kind === "denied";
    body = (
      <>
        <div className={s.resultHead}>
          <span className={`${s.resultBadge} ${s.resultBadgeWarn}`} aria-hidden>
            <LocateFixed size={22} />
          </span>
          <h2 ref={headingRef} tabIndex={-1} className={s.resultTitle}>
            {denied ? t("deniedTitle") : t("errorTitle")}
          </h2>
        </div>
        {denied ? (
          <>
            <p className={s.resultBody}>{t("deniedSteps")}</p>
            <p className={s.resultNote}>{t("deniedIphone")}</p>
          </>
        ) : (
          <p className={s.resultBody}>{t(status.message)}</p>
        )}
        <div className={s.resultActions}>
          {onChooseInstead && (
            <button type="button" className={s.btnPrimary} onClick={onChooseInstead}>
              {t("chooseInstead")}
            </button>
          )}
          <button type="button" className={s.btnOutline} onClick={onRetry}>
            {t("tryAgain")}
          </button>
        </div>
      </>
    );
  }

  const card = (
    <section
      className={`${s.result} ${floating ? s.resultFloating : ""}`}
      aria-live="polite"
      {...(floating ? { role: "dialog", "aria-modal": false, "aria-label": t("yourDistrict") } : {})}
    >
      <button type="button" onClick={onClose} className={s.resultClose} aria-label={tp("close")}>
        <X size={18} aria-hidden />
      </button>
      {body}
      <p className={s.resultPrivacy}>{t("privacy")}</p>
    </section>
  );

  return floating ? <div className={s.resultWrap}>{card}</div> : card;
}
