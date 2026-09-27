/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  LiveDistrictsCard — the live districts as small, tight chips
// ═══════════════════════════════════════════════════════════════════════
//
//   Live districts (10)                    ● updated today  ● older
//   ┌─────────────────────────┐ ┌─────────────────────────┐
//   │ (art) Mandya ಮಂಡ್ಯ   [C+]│ │ (art) Pune पुणे      New │ …
//   │       Karnataka · ● today│ │       Maharashtra · ● 2h │
//   └─────────────────────────┘ └─────────────────────────┘
//   ┌ - - - - - - - - - - - - ┐
//   │ Is your district next? →│
//   └ - - - - - - - - - - - - ┘
//
//  The list grows one district at a time, so each chip is one compact
//  row: the landmark picture in the district's hue, the name in the page
//  language with its local-script name, the state, and one status detail:
//    - a dot: green when we collected something for it in the last day,
//      amber when the newest data is older (with how long ago);
//    - the report-card grade, only while that grade is current (an old
//      grade is shown, with its date, on the map card — never as a badge);
//    - "New" for 30 days after the district goes live.
//  Newest launch first. The vote chip carries no vote counts (they are not
//  de-duplicated).
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, MapPin } from "lucide-react";
import { DISTRICT_META } from "@/lib/data/district-meta";
import { getDistrict } from "@/lib/constants/districts";
import { getDistrictHue } from "@/lib/design/hues";
import { ageInDays } from "@/lib/utils/timeAgo";
import { useFormat, usePlaceText } from "@/i18n/client";
import { placeNamePair } from "@/i18n/place-name";
import DistrictLandmark, { hasLandmark } from "./DistrictLandmark";
import { useMinute } from "./home-clock";
import type { HomeDistrict, MapDistrictStat } from "./home-types";
import styles from "./home.module.css";

/** A district counts as "New" for this many days after it goes live. */
const NEW_BADGE_DAYS = 30;
/** Green dot when we collected something for the district within this time. */
const FRESH_MS = 24 * 60 * 60 * 1000;

export default function LiveDistrictsCard({
  locale,
  districts,
  stats,
}: {
  locale: string;
  districts: HomeDistrict[];
  stats: Record<string, MapDistrictStat>;
}) {
  const tp = useTranslations("page_home");
  const t = useTranslations("home");
  const place = usePlaceText();
  const f = useFormat();
  const minute = useMinute();

  // Newest launch first; districts without a date go last.
  const sorted = [...districts].sort((a, b) => {
    const ax = a.goLiveDate ? new Date(a.goLiveDate).getTime() : 0;
    const bx = b.goLiveDate ? new Date(b.goLiveDate).getTime() : 0;
    return bx - ax || a.name.localeCompare(b.name);
  });

  return (
    <section aria-labelledby="home-live-districts" className={`ftp-container ${styles.section}`}>
      <div className={styles.sectionHeadRow}>
        <h2 id="home-live-districts" className={styles.h2}>
          {tp("live.title")} <span className={styles.countPill}>{f.number(districts.length)}</span>
        </h2>
        <p className={styles.liveLegend}>
          <span className={styles.legendDot} data-fresh="true" aria-hidden />
          {tp("live.legendFresh")}
          <span className={styles.legendDot} data-fresh="false" aria-hidden />
          {tp("live.legendOld")}
        </p>
      </div>

      <ul className={styles.chips}>
        {sorted.map((d) => {
          const reg = getDistrict(d.stateSlug, d.slug);
          const meta = DISTRICT_META[d.slug];
          // A local name equal to the English one (e.g. "Pune" stored in the
          // nameLocal column) adds nothing; fall through to the registry.
          const local = [d.nameLocal, reg?.nameLocal, meta?.nativeScript].find((x) => x && x !== d.name) ?? null;
          const names = placeNamePair({ name: d.name, nameLocal: local, names: reg?.names }, locale);
          const stat = stats[`${d.stateSlug}/${d.slug}`];
          const age = ageInDays(d.goLiveDate);
          const isNew = age !== null && age <= NEW_BADGE_DAYS;
          const grade = stat?.grade && !stat.grade.expired ? stat.grade.grade : null;
          const newest = stat?.newest ? new Date(stat.newest) : null;
          const fresh = newest && minute !== null ? minute - newest.getTime() < FRESH_MS : null;
          const stateName = place.state(d.stateSlug, d.stateName);
          return (
            <li key={`${d.stateSlug}/${d.slug}`}>
              <Link href={`/${locale}/${d.stateSlug}/${d.slug}`} className={`${styles.chip} ftp-hue-${getDistrictHue(d.slug)}`}>
                <span className={styles.chipArt} aria-hidden>
                  {hasLandmark(d.slug) ? <DistrictLandmark slug={d.slug} size={24} /> : <MapPin size={18} />}
                </span>
                <span className={styles.chipText}>
                  <span className={styles.chipName}>
                    <span lang={names.primaryLang}>{names.primary}</span>
                    {names.secondary && (
                      <span lang={names.secondaryLang} className={styles.chipLocal}>
                        {names.secondary}
                      </span>
                    )}
                  </span>
                  <span className={styles.chipMeta}>
                    {stateName}
                    {newest && (
                      <>
                        <span className={styles.legendDot} data-fresh={fresh === false ? "false" : "true"} aria-hidden />
                        <span className={styles.chipAgo}>
                          {minute === null ? f.date(newest, { day: "numeric", month: "short" }) : f.ago(newest)}
                        </span>
                      </>
                    )}
                  </span>
                </span>
                {isNew ? (
                  <span className={styles.newTag}>{t("new")}</span>
                ) : grade ? (
                  <span className={styles.chipGrade} title={tp("map.grade")}>
                    {grade}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}

        <li>
          <Link href={`/${locale}/vote-district`} className={`${styles.chip} ${styles.voteChip}`}>
            <span className={styles.chipText}>
              <span className={styles.chipName}>{t("voteTitle")}</span>
              <span className={styles.chipMeta}>{t("voteLink")}</span>
            </span>
            <ArrowRight size={18} aria-hidden className={styles.voteArrow} />
          </Link>
        </li>
      </ul>
    </section>
  );
}
