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
import { ArrowRight, Heart } from "lucide-react";
import styles from "./home.module.css";

export default function SupportLine({ locale }: { locale: string }) {
  return (
    <div className="ftp-container">
      <aside className={styles.supportLine} aria-label="Support ForThePeople.in">
        <Heart size={18} aria-hidden className={styles.supportHeart} />
        <p className={styles.supportText}>
          <span className="ftp-num">₹99</span> a month keeps one district&apos;s data flowing.
        </p>
        <Link href={`/${locale}/support`} className={styles.supportLink}>
          Support
          <ArrowRight size={14} aria-hidden />
        </Link>
      </aside>
    </div>
  );
}
