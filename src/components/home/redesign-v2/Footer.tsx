/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Session 13 v8 Phase L (Fix #15) — single-line footer.
 *
 * One warning row + one main row that holds:
 *   [links]   [brand IG + project GitHub]   [Built by Jayanth M B · Updated ...]
 *
 * Personal Instagram (@jayanth_m_b) removed — only the brand
 * @forthepeople_in IG and the project GitHub remain. Mobile wraps
 * gracefully into stacked rows.
 *
 * Audit 2026-09 (finding 3.11): the footer used to say "Updated Live" for a
 * 13-hour-old timestamp while the stat tile above said "13h ago". It now
 * prints "Refreshed <real age>" from the shared timeAgoLabel formatter, and
 * fetches once on mount instead of polling every 60 s.
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Github, Instagram } from "lucide-react";
import { timeAgoLabel, type TimeAgoResult } from "@/lib/utils/timeAgo";

export interface FooterProps {
  locale: string;
}

export default function Footer({ locale }: FooterProps) {
  const [updated, setUpdated] = useState<TimeAgoResult>({
    label: "—",
    isStale: false,
    isLive: false,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/data/homepage-stats");
        if (!res.ok) return;
        const data = (await res.json()) as { mostRecentAt?: string | null };
        if (!cancelled) {
          setUpdated(timeAgoLabel(data.mostRecentAt ?? null));
        }
      } catch {
        /* ignore */
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer
      role="contentinfo"
      className="ftp-footer"
      style={{
        background: "#FFFFFF",
        marginTop: 32,
      }}
    >
      <style>{`
        /* Session 16 v10 Phase K (Fix #12): blue accent + yellow band + bordered hover pills */
        .ftp-footer {
          border-top: 2px solid #2563EB;
        }
        .ftp-footer-warning {
          font-size: 11px;
          color: #713F12;
          background: #FFFBEB;
          border-bottom: 1px solid #FDE68A;
          text-align: center;
          padding: 8px 24px;
          letter-spacing: 0.02em;
        }
        .ftp-footer-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          font-size: 12px;
          color: #6B7280;
        }
        .ftp-footer-links {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
        }
        .ftp-footer-links a {
          padding: 4px 10px;
          border-radius: 6px;
          color: #6B7280;
          text-decoration: none;
          transition: background 150ms ease, color 150ms ease;
        }
        .ftp-footer-links a:hover {
          background: #F0F7FF;
          color: #2563EB;
        }
        .ftp-footer-links span.sep { color: #D1D5DB; padding: 0 2px; }
        .ftp-footer-social {
          display: inline-flex;
          gap: 6px;
        }
        .ftp-footer-social a {
          color: #6B7280;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px; height: 32px;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 6px;
          transition: background 150ms ease, color 150ms ease, border-color 150ms ease, transform 150ms ease;
        }
        .ftp-footer-social a:hover {
          background: #F0F7FF;
          border-color: #2563EB;
          color: #2563EB;
          transform: translateY(-2px);
        }
        .ftp-footer-social a.brand-ig:hover {
          background: linear-gradient(135deg, #F58529, #DD2A7B, #8134AF);
          border-color: #DD2A7B;
          color: #FFFFFF;
        }
        .ftp-footer-icon { width: 18px; height: 18px; }
        .ftp-footer-built {
          font-size: 11px;
          color: #9B9B9B;
        }
        @media (max-width: 767px) {
          .ftp-footer-main {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 14px 16px;
          }
          .ftp-footer-links { justify-content: center; }
          .ftp-footer-social { justify-content: center; }
          .ftp-footer-built { text-align: center; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ftp-footer-social a { transition: none; }
          .ftp-footer-social a:hover { transform: none; }
        }
      `}</style>

      <div className="ftp-footer-warning">
        ⚠ Independent · NOT an official government website · NDSAP · Article 19(1)(a)
      </div>

      <div className="ftp-footer-main">
        <div className="ftp-footer-links">
          <Link href={`/${locale}/about`}>About</Link>
          <span className="sep">·</span>
          <Link href={`/${locale}/privacy`}>Privacy</Link>
          <span className="sep">·</span>
          <Link href={`/${locale}/disclaimer`}>Disclaimer</Link>
          <span className="sep">·</span>
          <Link href={`/${locale}/contribute`}>Contribute</Link>
          <span className="sep">·</span>
          <Link href={`/${locale}/features`}>Features</Link>
          <span className="sep">·</span>
          <Link href={`/${locale}/feedback`}>Feedback</Link>
        </div>

        <div className="ftp-footer-social">
          <a
            href="https://www.instagram.com/forthepeople_in/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="ForThePeople on Instagram"
            className="brand-ig"
          >
            <Instagram className="ftp-footer-icon" aria-hidden="true" />
          </a>
          <a
            href="https://github.com/jayanthmb14/forthepeople"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="ForThePeople on GitHub"
          >
            <Github className="ftp-footer-icon" aria-hidden="true" />
          </a>
        </div>

        <div className="ftp-footer-built">
          Built by Jayanth M B
          {/* "—" until the stats request answers (or when it fails). */}
          {updated.label !== "—" && <> · Refreshed {updated.label}</>}
        </div>
      </div>
    </footer>
  );
}
