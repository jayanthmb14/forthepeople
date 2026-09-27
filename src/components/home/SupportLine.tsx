/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  SupportLine — the one quiet "support the project" line on the home page
// ═══════════════════════════════════════════════════════════════════════
//
//  One sentence and one text link, after all the data (supporters are
//  never above the product). No amount here: the support page is the one
//  place that states prices.
//
import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import styles from "./home.module.css";

export default function SupportLine({ locale }: { locale: string }) {
  const t = useTranslations("home");
  return (
    <div className={`ftp-container ${styles.section}`}>
      <aside className={styles.support} aria-label={t("supportLink")}>
        <Heart size={18} aria-hidden className={styles.supportHeart} />
        <p className={styles.supportText}>{t("supportText")}</p>
        <Link href={`/${locale}/support`} className={styles.textLink}>
          {t("supportLink")}
          <ArrowRight size={16} aria-hidden />
        </Link>
      </aside>
    </div>
  );
}
