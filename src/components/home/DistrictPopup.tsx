/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// DistrictPopup — the card that pops up after "Go to my location".
//
//   Live district  → landmark, name (local script first when it matches the
//                    UI language), state, tagline, today's quick facts, and
//                    "Open <district>" / "Remember my district".
//   Not live yet   → "You are in X. Not live yet", how many people asked,
//                    "Vote for X" and the nearest live district.
//
// It is a non-modal card (the page stays usable), announced politely,
// closable with the × button or Escape. Nothing about the location leaves
// the browser: this only shows what YourDistrictStrip already worked out.
"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, X } from "lucide-react";
import { DISTRICT_ICONS } from "@/components/district/icons";
import { getDistrict } from "@/lib/constants/districts";
import { getDistrictHue } from "@/lib/design/hues";
import { scriptLang } from "@/lib/utils/script-lang";
import { usePlaceText, useFormat } from "@/i18n/client";

export interface PopupDistrict {
  slug: string;
  stateSlug: string;
  name: string;
  stateName: string;
  active: boolean;
}

export default function DistrictPopup({
  district,
  stateOnly,
  asked,
  nearestLive,
  extras,
  onClose,
}: {
  district: PopupDistrict | null;
  /** When only the state is known. */
  stateOnly?: { name: string; slug: string };
  asked?: number;
  nearestLive?: { name: string; slug: string; stateSlug: string; km: number } | null;
  extras?: React.ReactNode;
  onClose: () => void;
}) {
  const t = useTranslations("popup");
  const locale = useLocale();
  const place = usePlaceText();
  const f = useFormat();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const reg = district ? getDistrict(district.stateSlug, district.slug) : undefined;
  const local = reg?.nameLocal && reg.nameLocal !== district?.name ? reg.nameLocal : null;
  const localFirst = Boolean(local && scriptLang(local) === locale);
  const title = district ? (localFirst ? (local as string) : district.name) : stateOnly ? place.state(stateOnly.slug, stateOnly.name) : "";
  const stateLabel = district ? place.state(district.stateSlug, district.stateName) : "";
  const Icon = district ? DISTRICT_ICONS[district.slug] : undefined;
  const hue = district ? getDistrictHue(district.slug) : "blue";

  return (
    <div className="ftp-popup-wrap">
      <section
        role="dialog"
        aria-modal="false"
        aria-labelledby="ftp-popup-title"
        className={`ftp-popup ftp-pop ftp-hue-${hue}`}
      >
        <button type="button" onClick={onClose} className="ftp-popup-close" aria-label={t("close")}>
          <X size={18} aria-hidden />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="ftp-popup-badge" aria-hidden>
            {Icon ? <Icon size={34} /> : <span className="ftp-emoji" style={{ fontSize: 28 }}>📍</span>}
          </span>
          <div style={{ minWidth: 0 }}>
            <p className="ftp-popup-eyebrow">{district?.active ? t("youAreIn") : t("youAreInNotLive")}</p>
            <h2 id="ftp-popup-title" ref={headingRef} tabIndex={-1} className="ftp-popup-title">
              <span lang={localFirst ? scriptLang(title) : undefined}>{title}</span>
              {district && local && (
                <span className="ftp-popup-local" lang={localFirst ? "en" : scriptLang(local)}>
                  {localFirst ? district.name : local}
                </span>
              )}
            </h2>
            {stateLabel && <p className="ftp-popup-state">{stateLabel}</p>}
          </div>
        </div>

        {district?.active ? (
          <>
            {reg?.tagline && <p className="ftp-popup-tag">{place.label(reg.tagline)}</p>}
            {extras && <div className="ftp-popup-extras">{extras}</div>}
            <Link href={`/${locale}/${district.stateSlug}/${district.slug}`} className="ftp-popup-cta">
              {t("open", { name: title })}
              <ArrowRight size={16} aria-hidden />
            </Link>
          </>
        ) : (
          <>
            <p className="ftp-popup-body">
              {district ? t("notLive", { name: title }) : t("stateNotLive", { state: title })}
              {asked !== undefined && asked > 0 && <> {t("asked", { count: f.number(asked) })}</>}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {district && (
                <Link href={`/${locale}/vote-district?d=${district.slug}`} className="ftp-popup-cta">
                  <span className="ftp-emoji" aria-hidden>🗳️</span> {t("vote", { name: title })}
                </Link>
              )}
              {nearestLive && (
                <Link href={`/${locale}/${nearestLive.stateSlug}/${nearestLive.slug}`} className="ftp-popup-secondary">
                  {t("nearest", { name: nearestLive.name, km: nearestLive.km })}
                </Link>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
