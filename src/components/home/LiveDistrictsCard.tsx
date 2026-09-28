/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  LiveDistrictsCard — the live districts, as a list beside the map
// ═══════════════════════════════════════════════════════════════════════
//
//   ┌ Live districts (10)       ● new data in the last day  ● older ┐
//   │ (art) Pune पुणे                                     New     │
//   │       Maharashtra · ● 2 h ago                              │
//   │ ─────────────────────────────────────────────────────────── │
//   │ (art) Mandya ಮಂಡ್ಯ                                  C+      │
//   │       Karnataka · ● 10 h ago                               │
//   │ …                                                          │
//   │ ┌ - - - - - - - - - - - - - - - - - - - - - - - - - - - ┐  │
//   │ │ Is your district next? · Vote for your district     → │  │
//   │ └ - - - - - - - - - - - - - - - - - - - - - - - - - - - ┘  │
//   └────────────────────────────────────────────────────────────┘
//
//  The first dashboard's "districts beside the map", in the new look: a
//  white panel, one plain row per district (divider lines, no coloured
//  cards). Beside the map on laptops (the list scrolls inside the panel
//  when it is longer than the map); under the map on tablets (two
//  columns) and phones. Each row: the landmark picture (the district's
//  one touch of colour), the name in the page language with its
//  local-script name, the state, and one status detail:
//    - a dot: green when we collected something for it in the last day,
//      amber when the newest data is older (with how long ago);
//    - the report-card grade, only while that grade is current (an old
//      grade is shown, with its date, on the map card — never as a badge);
//    - "New" for 30 days after the district goes live.
//  Newest launch first. The vote row carries no vote counts (they are not
//  de-duplicated).
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, ChevronRight, MapPin } from "lucide-react";
import { DISTRICT_META } from "@/lib/data/district-meta";
import { getDistrict } from "@/lib/constants/districts";
import { getDistrictHue } from "@/lib/design/hues";
import { ageInDays } from "@/lib/utils/timeAgo";
import { useFormat, usePlaceText } from "@/i18n/client";
import { placeNamePair } from "@/i18n/place-name";
import DistrictLandmark, { hasLandmark } from "./DistrictLandmark";
import { useMinute } from "./home-clock";
import { agoShort } from "./home-format";
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
    <section aria-labelledby="home-live-districts" className={styles.live}>
      <div className={styles.liveHead}>
        <h2 id="home-live-districts" className={styles.liveTitle}>
          {tp("live.title")} <span className={styles.countPill}>{f.number(districts.length)}</span>
        </h2>
        <p className={styles.liveLegend}>
          <span className={styles.legendDot} data-fresh="true" aria-hidden />
          {tp("live.legendFresh")}
          <span className={styles.legendDot} data-fresh="false" aria-hidden />
          {tp("live.legendOld")}
        </p>
      </div>

      <ul className={styles.liveList}>
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
              <Link href={`/${locale}/${d.stateSlug}/${d.slug}`} className={`${styles.row} ftp-hue-${getDistrictHue(d.slug)}`}>
                <span className={styles.rowArt} aria-hidden>
                  {hasLandmark(d.slug) ? <DistrictLandmark slug={d.slug} size={26} /> : <MapPin size={18} />}
                </span>
                <span className={styles.rowText}>
                  <span className={styles.rowName}>
                    <span lang={names.primaryLang}>{names.primary}</span>
                    {names.secondary && (
                      <span lang={names.secondaryLang} className={styles.rowLocal}>
                        {names.secondary}
                      </span>
                    )}
                  </span>
                  <span className={styles.rowMeta}>
                    {stateName}
                    {newest && (
                      <>
                        <span className={styles.legendDot} data-fresh={fresh === false ? "false" : "true"} aria-hidden />
                        <span className={styles.rowAgo}>
                          {minute === null ? f.date(newest, { day: "numeric", month: "short" }) : agoShort(newest, minute, locale)}
                        </span>
                      </>
                    )}
                  </span>
                </span>
                {isNew ? (
                  <span className={styles.newTag}>{t("new")}</span>
                ) : grade ? (
                  <span className={styles.rowGrade} title={tp("map.grade")}>
                    {grade}
                  </span>
                ) : null}
                <ChevronRight size={16} aria-hidden className={styles.rowChevron} />
              </Link>
            </li>
          );
        })}
      </ul>

      <Link href={`/${locale}/vote-district`} className={styles.voteRow}>
        <span className={styles.rowText}>
          <span className={styles.voteTitle}>{t("voteTitle")}</span>
          <span className={styles.voteLink}>{t("voteLink")}</span>
        </span>
        <ArrowRight size={18} aria-hidden className={styles.voteArrow} />
      </Link>
    </section>
  );
}
