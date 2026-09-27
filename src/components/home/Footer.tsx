/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Footer — site-wide footer (Design v3)
// ═══════════════════════════════════════════════════════════════════════
//
//    About · Privacy · Disclaimer · Contribute · Features · Feedback · Support   [IG] [GitHub]
//    ─────────────────────────────────────────────────────────────────────────────
//    Independent · Not a government website · NDSAP · Article 19(1)(a) ·
//    Built by Jayanth M B · Refreshed 3h ago
//
//  "Refreshed" is the real age of the newest record on the platform
//  (GET /api/data/homepage-stats → mostRecentAt), formatted by the shared
//  honest timeAgoLabel(): "Xm/Xh/Xd ago", never "Live". It is fetched ONCE
//  when the page loads — no polling. Until it answers (or if it fails) the
//  "Refreshed" part is simply left out.
//
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Github, Instagram } from "lucide-react";
import { timeAgoLabel, type TimeAgoResult } from "@/lib/utils/timeAgo";
import { formatIST } from "@/components/district/ui";
import styles from "./chrome.module.css";

export interface FooterProps {
  locale: string;
}

export default function Footer({ locale }: FooterProps) {
  const [updated, setUpdated] = useState<TimeAgoResult & { at: string | null }>({
    label: "—",
    isStale: true,
    isLive: false,
    at: null,
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/data/homepage-stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { mostRecentAt?: string | null } | null) => {
        if (!cancelled && data) {
          setUpdated({ ...timeAgoLabel(data.mostRecentAt ?? null), at: data.mostRecentAt ?? null });
        }
      })
      .catch(() => {
        /* leave "Refreshed" out */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const links: { href: string; label: string }[] = [
    { href: `/${locale}/about`, label: "About" },
    { href: `/${locale}/privacy`, label: "Privacy" },
    { href: `/${locale}/disclaimer`, label: "Disclaimer" },
    { href: `/${locale}/contribute`, label: "Contribute" },
    { href: `/${locale}/features`, label: "Features" },
    { href: `/${locale}/feedback`, label: "Feedback" },
    { href: `/${locale}/support`, label: "Support" },
  ];

  return (
    <footer role="contentinfo" className={styles.footer}>
      <div className={`ftp-container ${styles.footerRow}`}>
        <nav aria-label="Footer">
          <ul className={styles.footerLinks}>
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.footerIcons}>
          <a
            href="https://www.instagram.com/forthepeople_in/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="ForThePeople on Instagram"
            className={styles.footerIcon}
          >
            <Instagram size={18} aria-hidden />
          </a>
          <a
            href="https://github.com/jayanthmb14/forthepeople"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="ForThePeople on GitHub"
            className={styles.footerIcon}
          >
            <Github size={18} aria-hidden />
          </a>
        </div>
      </div>
      <div className="ftp-container">
        <p className={styles.footerLine} style={{ margin: 0 }}>
          Independent · Not a government website · NDSAP · Article 19(1)(a) · Built by Jayanth M B
          {updated.label !== "—" && (
            <>
              {" · "}
              <span title={updated.at ? `Newest record: ${formatIST(updated.at)}` : undefined}>
                Refreshed <span className="ftp-num">{updated.label}</span>
              </span>
            </>
          )}
        </p>
      </div>
    </footer>
  );
}
