/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  SupportBand — the support ask, with a few real supporters' names
// ═══════════════════════════════════════════════════════════════════════
//
//   ┌ white card ──────────────────────────────────────────────────────┐
//   │ (heart)  Free for everyone. Citizens like you keep it running.   │
//   │          (★ Name · Founding Builder) (Name · Mandya) (Name) …    │
//   │          [ Support the project ]   See all supporters →          │
//   └──────────────────────────────────────────────────────────────────┘
//
//  Always the last section: supporters come after the data, never above
//  it (BLUEPRINT §11). Names come from the existing public supporters API
//  (/api/data/contributors — public fields only; anonymous supporters stay
//  anonymous and are not listed here), Founding Builder first. No amounts
//  and no counts here: the support page is the one place for those. If the
//  names cannot be loaded, the band shows without them.
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Heart, Star } from "lucide-react";
import { getDistrict, getState } from "@/lib/constants/districts";
import { placeName } from "@/i18n/place-name";
import { usePlaceText } from "@/i18n/client";
import { pickSupporters, type PublicSupporter } from "./home-picks";
import styles from "./home.module.css";

interface AllResponse {
  subscribers?: PublicSupporter[];
  oneTime?: PublicSupporter[];
}

/** How many names the band lists. */
const SHOWN = 6;

export default function SupportBand({ locale }: { locale: string }) {
  const t = useTranslations("page_home");
  const place = usePlaceText();
  const [people, setPeople] = useState<PublicSupporter[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/data/contributors?limit=20")
      .then((r) => (r.ok ? (r.json() as Promise<AllResponse>) : null))
      .then((data) => {
        if (!cancelled) setPeople(data ? pickSupporters(data, SHOWN) : []);
      })
      .catch(() => {
        if (!cancelled) setPeople([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** "Mandya" / "Karnataka" / the tier, in the page language. */
  const where = (s: PublicSupporter): string | null => {
    if (s.tier === "founder") return t("support.founder");
    if (s.districtSlug && s.stateSlug) {
      const d = getDistrict(s.stateSlug, s.districtSlug);
      if (d) return placeName(d, locale);
    }
    if (s.stateSlug) {
      const st = getState(s.stateSlug);
      return place.state(s.stateSlug, st?.name ?? s.stateName ?? s.stateSlug);
    }
    return s.isRecurring ? t("support.monthly") : null;
  };

  return (
    <section aria-labelledby="home-support" className={`ftp-container ${styles.section}`}>
      <div className={styles.supportBand}>
        <span className={styles.supportArt} aria-hidden>
          <Heart size={26} strokeWidth={2.2} />
        </span>
        <div className={styles.supportBody}>
          <h2 id="home-support" className={styles.supportTitle}>
            {t("support.title")}
          </h2>
          <p className={styles.supportText}>{t("support.body")}</p>

          {people === null ? (
            <ul className={styles.supporters} aria-hidden>
              {[0, 1, 2].map((i) => (
                <li key={i} className={`${styles.supporter} ${styles.supporterLoading}`} />
              ))}
            </ul>
          ) : people.length > 0 ? (
            <ul className={styles.supporters} aria-label={t("support.namesLabel")}>
              {people.map((s) => {
                const w = where(s);
                return (
                  <li key={s.id} className={styles.supporter} data-founder={s.tier === "founder" ? "true" : undefined}>
                    {s.tier === "founder" && <Star size={13} aria-hidden className={styles.supporterStar} />}
                    <span className={styles.supporterName}>{s.name}</span>
                    {w && <span className={styles.supporterWhere}>{w}</span>}
                  </li>
                );
              })}
            </ul>
          ) : null}

          <div className={styles.supportActions}>
            <Link href={`/${locale}/support`} className={styles.supportBtn}>
              <Heart size={17} aria-hidden />
              {t("support.cta")}
            </Link>
            <Link href={`/${locale}/contributors`} className={styles.textLink}>
              {t("support.all")}
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
