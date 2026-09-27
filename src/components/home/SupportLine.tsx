/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  SupportLine — the one quiet "please support" line above the footer
// ═══════════════════════════════════════════════════════════════════════
//
//  A support-tint card with one sentence and one link. ₹99 is the entry
//  monthly tier on /support (keep the two in step if pricing changes).
//
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import styles from "./home.module.css";

export default function SupportLine({ locale }: { locale: string }) {
  const t = useTranslations("home");
  const tf = useTranslations("footer2");
  return (
    <div className="ftp-container">
      <aside className={styles.supportLine} aria-label={tf("supportProject")}>
        <span className={`${styles.supportEmoji} ftp-emoji`} aria-hidden>
          🪔
        </span>
        <p className={styles.supportText}>
          <strong>{t("supportStrong")}</strong> {t("supportBody", { amount: "₹99" })}
        </p>
        <Link href={`/${locale}/support`} className={styles.supportLink}>
          {t("becomeSupporter")}
          <ArrowRight size={14} aria-hidden />
        </Link>
      </aside>
    </div>
  );
}
