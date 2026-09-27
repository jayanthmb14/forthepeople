/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  LiveDistrictsCard — Design v4: a colourful grid of live districts
// ═══════════════════════════════════════════════════════════════════════
//
//   🏙️ Live districts   ● 10 live                       Newest first
//   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
//   │ [landmark] ☀31°│ │ …            │ │ …            │ │ …            │
//   │ Mandya ಮಂಡ್ಯ   │ │              │ │              │ │              │
//   │ Karnataka     │ │              │ │              │ │              │
//   │ Sugar Capital │ │              │ │              │ │              │
//   │ Open  →       │ │              │ │              │ │              │
//   └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
//   ┌─────────────── 🗳️ Vote for the next district (spans 2) ──────────┐
//
//  Each district owns a hue (its landmark's colour story) so the grid
//  reads as colourful but orderly. Weather is shown only when the API
//  returned a fresh reading (the API drops stale ones).
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { Pill } from "@/components/district/ui";
import { weatherEmoji } from "@/components/district/visuals";
import { getDistrictIcon } from "@/components/district/icons";
import { DISTRICT_META } from "@/lib/data/district-meta";
import { getDistrictHue } from "@/lib/design/hues";
import { scriptLang } from "@/lib/utils/script-lang";
import { getDistrict } from "@/lib/constants/districts";
import { ageInDays, asOfLabel } from "@/lib/utils/timeAgo";
import { usePreview, useTopVotes } from "./home-data";
import { useTranslations } from "next-intl";
import { useFormat } from "@/i18n/client";
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
  const t = useTranslations("home");
  const f = useFormat();
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
    <section aria-labelledby="home-live-districts" className="ftp-container">
      <header className={styles.gridHead}>
        <span className="ftp-icon-chip ftp-emoji ftp-hue-blue" aria-hidden style={{ width: 38, height: 38, fontSize: 20 }}>
          🏙️
        </span>
        <h2 id="home-live-districts" className="ftp-h2">
          {t("liveDistricts")}
        </h2>
        <Pill tone="live" dot pulse>
          {t("liveCount", { n: sorted.length })}
        </Pill>
        <span className={styles.gridHeadNote}>{t("newestFirst")}</span>
      </header>

      <ul className={styles.districtGrid}>
        {sorted.map((d, i) => {
          const meta = DISTRICT_META[d.slug];
          // A local name equal to the English one (e.g. "Pune" stored in the
          // nameLocal column) adds nothing; fall through to the registry script.
          const dbLocal = d.nameLocal && d.nameLocal !== d.name ? d.nameLocal : null;
          const registryLocal = getDistrict(d.stateSlug, d.slug)?.nameLocal;
          const regLocal = registryLocal && registryLocal !== d.name ? registryLocal : null;
          const metaLocal = meta?.nativeScript && meta.nativeScript !== d.name ? meta.nativeScript : null;
          const local = dbLocal ?? regLocal ?? metaLocal;
          const tagline = d.tagline ?? meta?.tagline ?? null;
          const age = ageInDays(d.goLiveDate);
          const isNew = age !== null && age <= NEW_BADGE_DAYS;
          const weather = preview[d.slug]?.weather ?? null;
          const temp = weather?.temp ?? null;
          const tempAsOf = asOfLabel(weather?.recordedAt ?? null, { prefix: "Weather as of" });
          const Icon = getDistrictIcon(d.slug);
          const hue = getDistrictHue(d.slug);
          // In a UI language that matches the district's own script, lead
          // with the local name (ಮಂಡ್ಯ on /kn) and show English beside it.
          const localFirst = Boolean(local && scriptLang(local) === locale);
          const primary = localFirst ? (local as string) : d.name;
          const secondary = localFirst ? d.name : local;
          return (
            <li key={d.slug} className={`ftp-hue-${hue} ftp-rise`} style={{ ["--i" as string]: i }}>
              <Link href={`/${locale}/${d.stateSlug}/${d.slug}`} className={`${styles.districtTile} ftp-card-link`}>
                <span className={styles.districtTileTop}>
                  <span className={styles.districtArt} aria-hidden>
                    {Icon ? <Icon size={30} /> : <span className="ftp-emoji" style={{ fontSize: 24 }}>📍</span>}
                  </span>
                  {isNew && <Pill tone="brand">{t("new")}</Pill>}
                  {temp !== null && (
                    <span className={styles.districtWeather} title={tempAsOf || undefined}>
                      <span className="ftp-emoji" aria-hidden>{weatherEmoji(weather?.conditions)}</span>
                      <span className="ftp-num">{Math.round(temp)}°</span>
                      {tempAsOf && <span className="sr-only">{tempAsOf}</span>}
                    </span>
                  )}
                </span>
                <span className={styles.districtTileName}>
                  <span lang={localFirst ? scriptLang(primary) : undefined}>{primary}</span>
                  {secondary && (
                    <span lang={localFirst ? "en" : scriptLang(secondary)} className={styles.districtTileLocal}>
                      {secondary}
                    </span>
                  )}
                </span>
                <span className={styles.districtTileState}>{d.stateName}</span>
                {tagline && <span className={styles.districtTileTag}>{tagline}</span>}
              </Link>
            </li>
          );
        })}

        {/* Vote card: spans two columns so the grid ends on a full row. */}
        <li className={`${styles.voteTile} ftp-hue-yellow ftp-rise`} style={{ ["--i" as string]: sorted.length }}>
          <Link href={`/${locale}/vote-district`} className={`${styles.voteTileLink} ftp-card-link`}>
            <span className="ftp-emoji" aria-hidden style={{ fontSize: 34 }}>🗳️</span>
            <span style={{ minWidth: 0 }}>
              <span className={styles.voteTileTitle}>{t("voteTitle")}</span>
              <span className={styles.voteTileBody}>
                {votesLoaded && leader
                  ? t("voteLeader", { name: leader.districtName, count: f.number(leader.requestCount) })
                  : t("voteDefault")}
              </span>
            </span>
            <ArrowRight size={18} aria-hidden style={{ marginLeft: "auto", flexShrink: 0 }} />
          </Link>
        </li>
      </ul>
    </section>
  );
}
