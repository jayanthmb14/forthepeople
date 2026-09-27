/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  IndiaGlance — the "India at a glance" band on the home page
// ═══════════════════════════════════════════════════════════════════════
//
//   India at a glance                         People        1.43 billion
//   The India dashboard puts the country's    UN Population Prospects · as of …
//   big numbers in one place…                 Size of the economy  $4.1 trillion
//   [Explore all of India →]                  IMF · as of …   (up to 4 figures)
//
//  Figures come from the IndiaIndicator table (the same rows the India
//  dashboard shows), passed in by the home page. Each one names its
//  source (linked when the row has a URL) and its date. A figure whose
//  row is missing is left out; nothing is typed here.
//
//  Server component (no client JS).
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { NUMBER_LOCALE, intlLocale } from "@/i18n/languages";
import styles from "./home.module.css";

export interface GlanceFigure {
  /** Message key under "home" for the label, e.g. "figPopulation". */
  labelKey: string;
  /** Message key under "home" for the value, e.g. "figPopulationValue". */
  valueKey: string;
  values: Record<string, number>;
  source: string;
  sourceUrl: string | null;
  asOf: string;
}

export default function IndiaGlance({ locale, figures }: { locale: string; figures: GlanceFigure[] }) {
  const t = useTranslations("home");
  const num = (n: number) => n.toLocaleString(NUMBER_LOCALE, { maximumFractionDigits: 2 });
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(intlLocale(locale), { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

  return (
    <section aria-labelledby="home-india" className={`ftp-container ${styles.section}`}>
      <div className={styles.india}>
        <div className={styles.indiaText}>
          <h2 id="home-india" className={styles.h2}>
            {t("indiaTitle")}
          </h2>
          <p className={styles.indiaBody}>{t("indiaBody")}</p>
          <Link href={`/${locale}/india`} className={styles.btnPrimary}>
            {t("exploreIndia")}
            <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
        {figures.length > 0 && (
          <dl className={styles.indiaFigures}>
            {figures.map((f) => (
              <div key={f.labelKey} className={styles.figure}>
                <dt className={styles.figureLabel}>{t(f.labelKey)}</dt>
                <dd className={styles.figureValue}>
                  {t(f.valueKey, Object.fromEntries(Object.entries(f.values).map(([k, v]) => [k, num(v)])))}
                </dd>
                <dd className={styles.figureSource}>
                  {f.sourceUrl ? (
                    <a href={f.sourceUrl} target="_blank" rel="noopener noreferrer">
                      {f.source}
                    </a>
                  ) : (
                    f.source
                  )}
                  {" · "}
                  {t("figAsOf", { date: date(f.asOf) })}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
