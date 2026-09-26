/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Session 19 v13 Phase I (Fix #9) — red support banner above footer.
 *
 * Production has this between the last content section and the footer:
 * "❤️ Support — ₹3.30/day serves one district". Restores parity.
 * Links to /<locale>/support.
 *
 * Session 19.2 Phase I: ₹1.50/day → ₹3.30/day (matches the ₹99/month
 * entry tier: 99 ÷ 30 = 3.30). Was inconsistent with the actual
 * pricing on /support page.
 */

import Link from "next/link";

export interface SupportBannerProps {
  locale: string;
}

export default function SupportBanner({ locale }: SupportBannerProps) {
  return (
    <Link
      href={`/${locale}/support`}
      className="ftp-support-banner"
      aria-label="Support For The People — see contribution tiers"
    >
      <style>{`
        .ftp-support-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 24px;
          margin: 24px auto;
          max-width: 800px;
          background: var(--ftp-color-support-bg);
          border: 1px solid var(--ftp-color-support-border);
          border-radius: 12px;
          color: var(--ftp-color-support);
          font-size: 14px;
          text-decoration: none;
          transition: background 200ms ease, border-color 200ms ease, transform 200ms ease, box-shadow 200ms ease;
        }
        .ftp-support-banner:hover {
          background: #FFE4E6;
          border-color: var(--ftp-color-support);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(225, 29, 72, 0.12);
        }
        .ftp-support-banner-heart { font-size: 16px; line-height: 1; }
        .ftp-support-banner-text strong { font-weight: 700; }
        .ftp-support-banner-arrow { font-size: 14px; font-weight: 700; }
        @media (max-width: 600px) {
          .ftp-support-banner {
            margin: 16px;
            padding: 10px 16px;
            font-size: 13px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ftp-support-banner { transition: none; }
          .ftp-support-banner:hover { transform: none; }
        }
      `}</style>
      <span className="ftp-support-banner-heart" aria-hidden="true">❤️</span>
      <span className="ftp-support-banner-text">
        Support — <strong>₹3.30/day</strong> serves one district
      </span>
      <span className="ftp-support-banner-arrow" aria-hidden="true">→</span>
    </Link>
  );
}
