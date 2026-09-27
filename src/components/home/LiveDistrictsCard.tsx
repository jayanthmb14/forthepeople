/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  LiveDistrictsCard — the list of live districts (home, cols 8–12)
// ═══════════════════════════════════════════════════════════════════════
//
//    LIVE DISTRICTS   [• 10 live]                          Newest first
//    ───────────────────────────────────────────────────────────────────
//    Mandya ಮಂಡ್ಯ  [NEW]                                          31°C
//    Karnataka · Sugar Capital of Karnataka
//    … up to 10 rows of 56 px; more rows scroll inside the card …
//    ───────────────────────────────────────────────────────────────────
//    Kanpur leads the vote with 47,531 requests · Vote for yours →
//
//  Data:
//    - districts: server-rendered list from the DB (page.tsx), newest first.
//    - temperature: /api/data/homepage-preview. The API returns null weather
//      when the reading is stale, so a temperature only appears when it is
//      recent; hovering it shows the exact "as of" time.
//    - vote leader: /api/district-request (top requested district).
//    - local-script name and tagline: DB first, then the curated
//      DISTRICT_META file as a fallback.
//
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { Pill } from "@/components/district/ui";
import { DISTRICT_META } from "@/lib/data/district-meta";
import { ageInDays, asOfLabel } from "@/lib/utils/timeAgo";
import { usePreview, useTopVotes } from "./home-data";
import styles from "./home.module.css";

/** A district counts as "NEW" for this many days after it goes live. */
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
  const preview = usePreview();
  const { votes, loaded: votesLoaded } = useTopVotes();

  // Newest launch first; districts without a date go last.
  const sorted = useMemo(
    () =>
      [...districts].sort((a, b) => {
        const ax = a.goLiveDate ? new Date(a.goLiveDate).getTime() : 0;
        const bx = b.goLiveDate ? new Date(b.goLiveDate).getTime() : 0;
        return bx - ax;
      }),
    [districts],
  );

  const leader = votes[0];

  return (
    <section className={styles.districtsCard} aria-labelledby="home-live-districts">
      <header className={styles.districtsHead}>
        <h2 id="home-live-districts" className="ftp-label" style={{ margin: 0 }}>
          Live districts
        </h2>
        <Pill tone="live" dot>
          <span className="ftp-num">{sorted.length}</span> live
        </Pill>
        <span className={styles.districtsSort}>Newest first</span>
      </header>

      <ul className={styles.districtsList}>
        {sorted.map((d) => {
          const meta = DISTRICT_META[d.slug];
          const local = d.nameLocal ?? meta?.nativeScript ?? null;
          const tagline = d.tagline ?? meta?.tagline ?? null;
          const age = ageInDays(d.goLiveDate);
          const isNew = age !== null && age <= NEW_BADGE_DAYS;
          const weather = preview[d.slug]?.weather ?? null;
          const temp = weather?.temp ?? null;
          const tempAsOf = asOfLabel(weather?.recordedAt ?? null, { prefix: "Weather as of" });
          return (
            <li key={d.slug}>
              <Link href={`/${locale}/${d.stateSlug}/${d.slug}`} className={styles.districtRow}>
                <span className={styles.districtMain}>
                  <span className={styles.districtLine1}>
                    <span className={styles.districtName}>{d.name}</span>
                    {local && <span className={styles.districtLocal}>{local}</span>}
                    {isNew && <Pill tone="brand">NEW</Pill>}
                  </span>
                  <span className={styles.districtLine2}>
                    {d.stateName}
                    {tagline ? ` · ${tagline}` : ""}
                  </span>
                </span>
                {temp !== null && (
                  <span className={`ftp-num ${styles.districtTemp}`} title={tempAsOf || undefined}>
                    {temp}°C
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <footer className={styles.districtsFoot}>
        <Link href={`/${locale}/vote-district`} className={styles.inlineLink}>
          {votesLoaded && leader ? (
            <span>
              {leader.districtName} leads the vote with{" "}
              <span className="ftp-num">{leader.requestCount.toLocaleString("en-IN")}</span>{" "}
              {leader.requestCount === 1 ? "request" : "requests"} · Vote for yours
            </span>
          ) : (
            <span>Vote for the next district</span>
          )}
          <ArrowRight size={14} aria-hidden />
        </Link>
      </footer>
    </section>
  );
}
