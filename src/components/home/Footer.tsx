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
import { Github, Instagram, Users } from "lucide-react";
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

  const groups: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: "Explore",
      links: [
        { href: `/${locale}/india`, label: "India dashboard" },
        { href: `/${locale}/vote-district`, label: "Vote for a district" },
        { href: `/${locale}/compare`, label: "Compare districts" },
      ],
    },
    {
      title: "Get involved",
      links: [
        { href: `/${locale}/contribute`, label: "Contribute" },
        { href: `/${locale}/features`, label: "Vote on features" },
        { href: `/${locale}/feedback`, label: "Feedback" },
        { href: `/${locale}/support`, label: "Support the project" },
      ],
    },
    {
      title: "About",
      links: [
        { href: `/${locale}/about`, label: "About" },
        { href: `/${locale}/privacy`, label: "Privacy" },
        { href: `/${locale}/disclaimer`, label: "Disclaimer" },
      ],
    },
  ];

  return (
    <footer role="contentinfo" className={styles.footerV4}>
      <div className={`ftp-container ${styles.footerGrid}`}>
        <div className={styles.footerBrand}>
          <Link href={`/${locale}`} className={styles.footerLogo} aria-label="ForThePeople.in home">
            <span className={styles.logoTile} aria-hidden>
              <Users size={17} strokeWidth={2.4} />
            </span>
            ForThePeople<span className={styles.footerIn}>.in</span>
          </Link>
          <p className={styles.footerTagline}>Your district. Your data. Your right.</p>
          <p className={styles.footerNote}>
            An independent citizen project. Not a government website. Data from official portals under NDSAP;
            always verify at the source.
          </p>
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
        <nav aria-label="Footer" className={styles.footerCols}>
          {groups.map((g) => (
            <div key={g.title}>
              <p className={styles.footerColTitle}>{g.title}</p>
              <ul className={styles.footerColList}>
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className={`ftp-container ${styles.footerBottom}`}>
        <span>
          Built by Jayanth M B in Mandya <span className="ftp-emoji" aria-hidden>🇮🇳</span>
        </span>
        <span>Free expression under Article 19(1)(a)</span>
        {updated.label !== "—" && (
          <span title={updated.at ? `Newest record: ${formatIST(updated.at)}` : undefined}>
            Data refreshed <span className="ftp-num">{updated.label}</span>
          </span>
        )}
      </div>
    </footer>
  );
}
