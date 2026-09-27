/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  HomeMap — the clickable India map beside the home hero
// ═══════════════════════════════════════════════════════════════════════
//
//   ┌ India, live ─────────────────────── [+][−][⟲] ┐
//   │   (states open their page; pins = live districts)│
//   │        ◉ Lucknow                                 │
//   │   ◉ Pune       ┌──────────────────────────────┐  │
//   │                │ (art) Mandya ಮಂಡ್ಯ · Karnataka │  │
//   │   ◉◉◉          │ People        19.4 lakh (…)   │  │
//   │                │ Being built   17 projects     │  │
//   │                │ Report card   C+ · Apr 2026   │  │
//   │                │ Newest data   today, 4:30 pm  │  │
//   │                │ [Open Mandya →]               │  │
//   │                └──────────────────────────────┘  │
//   └ ◉ live district (tap for facts) ▢ state (opens its page) ┘
//
//  Behaviour (zoom, taps, pins) lives in map/DrillDownMap; this file adds
//  the words and the district card. The card's facts come from the server
//  (home-data.ts → loadMapStats) and follow the district pages' own rules,
//  so the number here is the number one tap away. A fact we do not have is
//  left out; an old report card says it is old.
//
//  Loaded in the browser only (react-simple-maps needs `window`).
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Award, Clock3, HardHat, Users } from "lucide-react";
import DrillDownMap, { type DrillDownLabels, type MapPin } from "@/components/map/DrillDownMap";
import { getDistrict } from "@/lib/constants/districts";
import { useFormat, usePlaceText } from "@/i18n/client";
import { placeName, placeNamePair } from "@/i18n/place-name";
import { NUMBER_LOCALE } from "@/i18n/languages";
import DistrictLandmark, { hasLandmark } from "./DistrictLandmark";
import type { HomeDistrict, MapDistrictStat } from "./home-types";
import styles from "./home.module.css";

/** 19,40,428 → "19.4 lakh"; 1,27,65,000 → "1.28 crore" (message keys carry the words). */
function peopleWords(n: number, t: ReturnType<typeof useTranslations>) {
  if (n >= 1e7) return t("map.crore", { n: (n / 1e7).toLocaleString(NUMBER_LOCALE, { maximumFractionDigits: 2 }) });
  if (n >= 1e5) return t("map.lakh", { n: (n / 1e5).toLocaleString(NUMBER_LOCALE, { maximumFractionDigits: 1 }) });
  return n.toLocaleString(NUMBER_LOCALE);
}

function DistrictCard({ pin, locale, stat, district }: { pin: MapPin; locale: string; stat: MapDistrictStat | undefined; district: HomeDistrict | undefined }) {
  const t = useTranslations("page_home");
  const f = useFormat();
  const place = usePlaceText();
  const reg = getDistrict(pin.stateSlug, pin.slug);
  const names = placeNamePair({ name: pin.name, nameLocal: reg?.nameLocal ?? district?.nameLocal ?? null, names: reg?.names }, locale);
  const shortName = reg ? placeName(reg, locale) : pin.name;

  const rows: Array<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = [];
  if (stat?.population) {
    const p = stat.population;
    rows.push({
      icon: <Users size={15} aria-hidden />,
      label: t("map.people"),
      value: (
        <>
          {peopleWords(p.value, t)}
          <span className={styles.cardNote}>{p.estimate ? t("map.estimate") : p.dataset ?? ""}</span>
        </>
      ),
    });
  }
  if (stat?.building !== null && stat?.building !== undefined) {
    rows.push({ icon: <HardHat size={15} aria-hidden />, label: t("map.building"), value: t("map.projects", { n: stat.building }) });
  }
  if (stat?.grade) {
    const g = stat.grade;
    rows.push({
      icon: <Award size={15} aria-hidden />,
      label: t("map.grade"),
      value: (
        <>
          <span className={styles.cardGrade}>{g.grade}</span>
          <span className={styles.cardNote}>{f.date(g.date, { month: "short", year: "numeric" })}</span>
          {g.expired && <span className={styles.cardOld}>{t("map.old")}</span>}
        </>
      ),
    });
  }
  if (stat?.newest) {
    rows.push({ icon: <Clock3 size={15} aria-hidden />, label: t("map.newest"), value: f.ago(stat.newest) });
  }

  return (
    <div className={`${styles.card} ftp-hue-${pin.hue}`}>
      <div className={styles.cardHead}>
        <span className={styles.cardArt} aria-hidden>
          {hasLandmark(pin.slug) ? <DistrictLandmark slug={pin.slug} size={26} /> : <span className={styles.cardDot} />}
        </span>
        <span className={styles.cardTitle}>
          <span className={styles.cardName}>
            <span lang={names.primaryLang}>{names.primary}</span>
            {names.secondary && (
              <span lang={names.secondaryLang} className={styles.cardLocal}>
                {names.secondary}
              </span>
            )}
          </span>
          <span className={styles.cardState}>{place.state(pin.stateSlug, pin.stateName)}</span>
        </span>
      </div>
      {rows.length > 0 ? (
        <dl className={styles.cardRows}>
          {rows.map((r) => (
            <div key={r.label} className={styles.cardRow}>
              <dt>
                {r.icon}
                {r.label}
              </dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className={styles.cardEmpty}>{t("map.noFacts")}</p>
      )}
      <Link href={`/${locale}/${pin.stateSlug}/${pin.slug}`} className={styles.cardOpen}>
        {t("map.open", { name: shortName })}
        <ArrowRight size={16} aria-hidden />
      </Link>
    </div>
  );
}

export default function HomeMap({ locale, districts, stats }: { locale: string; districts: HomeDistrict[]; stats: Record<string, MapDistrictStat> }) {
  const t = useTranslations("page_home");
  const place = usePlaceText();

  const labels: DrillDownLabels = {
    map: t("map.aria"),
    zoomIn: t("map.zoomIn"),
    zoomOut: t("map.zoomOut"),
    reset: t("map.reset"),
    close: t("map.close"),
    pin: (p) => {
      const reg = getDistrict(p.stateSlug, p.slug);
      return t("map.pinLabel", { name: reg ? placeName(reg, locale) : p.name, state: place.state(p.stateSlug, p.stateName) });
    },
    stateName: (slug, fallback) => place.state(slug, fallback),
    stateHint: (n) => (n > 0 ? t("map.stateLive", { n }) : t("map.stateNone")),
    stateOpen: (name) => t("map.stateOpen", { name }),
  };

  return (
    <figure className={styles.map}>
      <div className={styles.mapHead}>
        <span className={styles.mapTitle}>{t("map.title")}</span>
        <span className={styles.mapHint}>{t("map.hint")}</span>
      </div>
      <DrillDownMap
        locale={locale}
        labels={labels}
        renderCard={(pin) => (
          <DistrictCard pin={pin} locale={locale} stat={stats[pin.key]} district={districts.find((d) => d.slug === pin.slug && d.stateSlug === pin.stateSlug)} />
        )}
      />
      <figcaption className={styles.mapLegend}>
        <span className={styles.legendItem}>
          <span className={`${styles.legendSwatch} ${styles.legendLive}`} aria-hidden />
          {t("map.legendLive")}
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendSwatch} ${styles.legendLand}`} aria-hidden />
          {t("map.legendState")}
        </span>
      </figcaption>
    </figure>
  );
}
