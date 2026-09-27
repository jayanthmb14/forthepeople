/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  LiveDistrictsCard — Design v5: the live districts as calm, equal cards
// ═══════════════════════════════════════════════════════════════════════
//
//   Live districts
//   Tap a district to see its dashboards.
//   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
//   │ (landmark)   │ │              │ │              │ │ Is your      │
//   │ Mandya ಮಂಡ್ಯ  │ │  …           │ │  …           │ │ district     │
//   │ Karnataka    │ │              │ │              │ │ next? Vote → │
//   │ Sugar Capital│ │              │ │              │ │              │
//   └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
//
//  Every card looks the same (white, thin border, pastel landmark chip):
//  the district's landmark picture is its only identity mark. Newest
//  launch first; a small "New" tag for 30 days after going live.
//  The vote card carries no vote counts (they are not de-duplicated).
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, MapPin } from "lucide-react";
import { DISTRICT_META } from "@/lib/data/district-meta";
import { getDistrict } from "@/lib/constants/districts";
import { ageInDays } from "@/lib/utils/timeAgo";
import { usePlaceText } from "@/i18n/client";
import { placeNamePair } from "@/i18n/place-name";
import DistrictLandmark, { hasLandmark } from "./DistrictLandmark";
import styles from "./home.module.css";

/** A district counts as "New" for this many days after it goes live. */
const NEW_BADGE_DAYS = 30;

export interface HomeDistrict {
  slug: string;
  name: string;
  nameLocal: string | null;
  tagline: string | null;
  stateSlug: string;
  stateName: string;
  goLiveDate: string | null;
}

export default function LiveDistrictsCard({ locale, districts }: { locale: string; districts: HomeDistrict[] }) {
  const t = useTranslations("home");
  const place = usePlaceText();

  // Newest launch first; districts without a date go last.
  const sorted = [...districts].sort((a, b) => {
    const ax = a.goLiveDate ? new Date(a.goLiveDate).getTime() : 0;
    const bx = b.goLiveDate ? new Date(b.goLiveDate).getTime() : 0;
    return bx - ax || a.name.localeCompare(b.name);
  });

  return (
    <section aria-labelledby="home-live-districts" className={`ftp-container ${styles.section}`}>
      <div className={styles.sectionHead}>
        <h2 id="home-live-districts" className={styles.h2}>
          {t("liveDistricts")}
        </h2>
        <p className={styles.sectionNote}>{t("liveIntro")}</p>
      </div>

      <ul className={styles.districtGrid}>
        {sorted.map((d) => {
          const reg = getDistrict(d.stateSlug, d.slug);
          const meta = DISTRICT_META[d.slug];
          // A local name equal to the English one (e.g. "Pune" stored in the
          // nameLocal column) adds nothing; fall through to the registry.
          const local = [d.nameLocal, reg?.nameLocal, meta?.nativeScript].find((x) => x && x !== d.name) ?? null;
          const tagline = d.tagline ?? meta?.tagline ?? null;
          const age = ageInDays(d.goLiveDate);
          const isNew = age !== null && age <= NEW_BADGE_DAYS;
          // The name in the page language leads (मंड्या on /hi, ಮಂಡ್ಯ on
          // /kn) with English beside it; on /en the local script sits beside.
          const names = placeNamePair({ name: d.name, nameLocal: local, names: reg?.names }, locale);
          return (
            <li key={d.slug}>
              <Link href={`/${locale}/${d.stateSlug}/${d.slug}`} className={styles.districtCard}>
                <span className={styles.districtTop}>
                  <span className={styles.districtArt} aria-hidden>
                    {hasLandmark(d.slug) ? <DistrictLandmark slug={d.slug} size={28} /> : <MapPin size={20} />}
                  </span>
                  {isNew && <span className={styles.newTag}>{t("new")}</span>}
                </span>
                <span className={styles.districtName}>
                  <span lang={names.primaryLang}>{names.primary}</span>
                  {names.secondary && (
                    <span lang={names.secondaryLang} className={styles.districtLocal}>
                      {names.secondary}
                    </span>
                  )}
                </span>
                <span className={styles.districtState}>{place.state(d.stateSlug, d.stateName)}</span>
                {tagline && <span className={styles.districtTag}>{place.label(tagline)}</span>}
              </Link>
            </li>
          );
        })}

        <li>
          <Link href={`/${locale}/vote-district`} className={`${styles.districtCard} ${styles.voteCard}`}>
            <span className={styles.voteTitle}>{t("voteTitle")}</span>
            <span className={styles.voteBody}>{t("voteBody")}</span>
            <span className={styles.voteLink}>
              {t("voteLink")}
              <ArrowRight size={16} aria-hidden />
            </span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
