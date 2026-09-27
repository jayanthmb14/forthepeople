/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  IndiaGlance — "Explore all of India", the second big thing on home
// ═══════════════════════════════════════════════════════════════════════
//
//   ┌─ pastel band ──────────────────────────────────────────────────────┐
//   │                                   ┌────────────┐ ┌────────────┐    │
//   │ Explore all of India              │ (map) 28+8 │ │ (hall) 543 │    │
//   │ Parliament, the Union Budget, …   │ States and │ │ Lok Sabha  │    │
//   │ [ Explore all of India → ]        │ UTs · MHA  │ │ seats · …  │    │
//   │                                   ├────────────┤ ├────────────┤    │
//   │                                   │ (abc) 22   │ │ (ruler)    │    │
//   │                                   │ languages  │ │ 32.9 lakh  │    │
//   │                                   └────────────┘ └────────────┘    │
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
import CountUp from "./CountUp";
import type { IndiaFigure } from "./home-types";
import styles from "./home.module.css";

const LOOK: Record<IndiaFigure["id"], { hue: string; icon: React.ReactNode }> = {
  states: { hue: "blue", icon: <MapIcon size={20} aria-hidden /> },
  seats: { hue: "violet", icon: <Landmark size={20} aria-hidden /> },
  languages: { hue: "teal", icon: <Languages size={20} aria-hidden /> },
  area: { hue: "amber", icon: <Ruler size={20} aria-hidden /> },
};

export default function IndiaGlance({ locale, figures }: { locale: string; figures: IndiaFigure[] }) {
  const t = useTranslations("page_home");
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(intlLocale(locale), { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

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
    <section aria-labelledby="home-india" className={`ftp-container ${styles.section} ${styles.sectionFirst}`}>
      <div className={styles.india}>
        <span className={styles.indiaDecor} aria-hidden />
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
              <div key={f.id} className={`${styles.figure} ftp-hue-${LOOK[f.id].hue}`}>
                <dt className={styles.figureLabel}>
                  <span className={styles.figureIcon}>{LOOK[f.id].icon}</span>
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
