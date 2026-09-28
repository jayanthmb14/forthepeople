/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  IndiaGlance — "Explore all of India", the second big thing on home
// ═══════════════════════════════════════════════════════════════════════
//
//   ┌─ white card, thin border ──────────────────────────────────────────┐
//   │                               (map) States and UTs  (hall) Lok Sabha │
//   │ Explore all of India          28 + 8                543              │
//   │ Parliament, the Union Budget… MHA · checked …       Lok Sabha Sectt. │
//   │ [ Explore all of India → ]    ──────────────────────────────────────  │
//   │                               (abc) Languages       (ruler) Area     │
//   │                               22                    32.9 lakh sq km  │
//   └────────────────────────────────────────────────────────────────────┘
//
//  Four figures that stay true until the Constitution or the map changes,
//  from the IndiaIndicator rows the India dashboard uses (home-data.ts →
//  loadIndiaFigures), each with its source (linked) and the date it was
//  checked. A missing row leaves its tile out; the band and its button
//  always show. Numbers count up once.
//
//  Server component (CountUp is the only client piece).
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Landmark, Languages, Map as MapIcon, Ruler } from "lucide-react";
import { intlLocale } from "@/i18n/languages";
import { formatDate } from "@/i18n/format-date";
import CountUp from "./CountUp";
import type { IndiaFigure } from "./home-types";
import styles from "./home.module.css";

/** A small grey picture beside each figure's label (the numbers carry the blue). */
const ICON: Record<IndiaFigure["id"], React.ReactNode> = {
  states: <MapIcon size={16} aria-hidden />,
  seats: <Landmark size={16} aria-hidden />,
  languages: <Languages size={16} aria-hidden />,
  area: <Ruler size={16} aria-hidden />,
};

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
    <section aria-labelledby="home-india" className={`ftp-container ${styles.section}`} data-tour="home-india">
      <div className={styles.india}>
        <div className={styles.indiaText}>
          <h2 id="home-india" className={styles.indiaTitle}>
            {t("india.title")}
          </h2>
          <p className={styles.indiaBody}>{t("india.body")}</p>
          <Link href={`/${locale}/india`} className={`${styles.btnPrimary} ${styles.indiaCta}`}>
            {t("india.cta")}
            <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
        {figures.length > 0 && (
          <dl className={styles.indiaFigures}>
            {figures.map((f) => (
              <div key={f.id} className={styles.figure}>
                <dt className={styles.figureLabel}>
                  <span className={styles.figureIcon}>{ICON[f.id]}</span>
                  {t(`india.fig.${f.id}`)}
                </dt>
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
