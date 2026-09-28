/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  IndiaGlance — "Explore the whole India", a slim band under the dashboard
// ═══════════════════════════════════════════════════════════════════════
//
//   ┌─ white band, thin border ───────────────────────────────────────────┐
//   │ [ Explore the whole India → ]  │ 28 + 8        543        22     32.9 lakh sq km │
//   │ Parliament, the Union Budget…  │ States & UTs  Lok Sabha  Langs  Area            │
//   │                                │ MHA · checked … (source + date under each)      │
//   └─────────────────────────────────────────────────────────────────────┘
//
//  Sits directly under the map and the live districts (the June site had
//  the same "Explore the whole India →" pill near its map). The pill is
//  the band's heading, so the words are not repeated. Four figures that
//  stay true until the Constitution or the map changes, from the
//  IndiaIndicator rows the India dashboard uses (home-data.ts →
//  loadIndiaFigures), each with its source (linked) and the date it was
//  checked. A missing row leaves its figure out; the band and its pill
//  always show. Numbers count up once. Phones: the pill full width, the
//  figures two a row.
//
//  Server component (CountUp is the only client piece).
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { intlLocale } from "@/i18n/languages";
import { formatDate } from "@/i18n/format-date";
import CountUp from "./CountUp";
import type { IndiaFigure } from "./home-types";
import styles from "./home.module.css";

export default function IndiaGlance({ locale, figures }: { locale: string; figures: IndiaFigure[] }) {
  const t = useTranslations("page_home");
  const date = (iso: string) =>
    formatDate(iso, intlLocale(locale), { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

  const value = (f: IndiaFigure) => {
    switch (f.id) {
      case "states":
        return (
          <>
            <CountUp value={f.values.a} />
            <span className={styles.figurePlus}>+</span>
            <CountUp value={f.values.b} />
          </>
        );
      case "area":
        return (
          <>
            <CountUp value={f.values.n} decimals={1} />
            <span className={styles.figureUnit}>{t("india.areaUnit")}</span>
          </>
        );
      default:
        return <CountUp value={f.values.n} />;
    }
  };

  return (
    <section aria-labelledby="home-india" className={`ftp-container ${styles.indiaWrap}`} data-reveal>
      <div className={styles.india}>
        <div className={styles.indiaText}>
          <h2 id="home-india" className={styles.indiaTitle}>
            <Link href={`/${locale}/india`} className={styles.indiaPill}>
              {t("india.cta")}
              <ArrowRight size={17} aria-hidden className={styles.indiaArrow} />
            </Link>
          </h2>
          <p className={styles.indiaBody}>{t("india.body")}</p>
        </div>
        {figures.length > 0 && (
          <dl className={styles.indiaFigures}>
            {figures.map((f) => (
              <div key={f.id} className={styles.figure}>
                <dt className={styles.figureLabel}>{t(`india.fig.${f.id}`)}</dt>
                <dd className={styles.figureValue}>{value(f)}</dd>
                <dd className={styles.figureSource}>
                  {f.sourceUrl ? (
                    <a href={f.sourceUrl} target="_blank" rel="noopener noreferrer">
                      {f.source}
                    </a>
                  ) : (
                    f.source
                  )}
                  {" · "}
                  {t("india.checked", { date: date(f.asOf) })}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
