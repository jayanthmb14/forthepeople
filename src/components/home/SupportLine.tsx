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
import styles from "./home.module.css";

export default function SupportLine({ locale }: { locale: string }) {
  return (
    <div className="ftp-container">
      <aside className={styles.supportLine} aria-label="Support ForThePeople.in">
        <span className={`${styles.supportEmoji} ftp-emoji`} aria-hidden>
          🪔
        </span>
        <p className={styles.supportText}>
          <strong>Keep a district&apos;s data free.</strong>{" "}
          <span className="ftp-num">₹99</span> a month pays for one district&apos;s servers and data feeds.
        </p>
        <Link href={`/${locale}/support`} className={styles.supportLink}>
          Become a supporter
          <ArrowRight size={14} aria-hidden />
        </Link>
      </aside>
    </div>
  );
}
