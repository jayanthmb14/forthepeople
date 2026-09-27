/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Footer — site-wide footer (Design v5 "calm", light)
// ═══════════════════════════════════════════════════════════════════════
//
//    [logo] ForThePeople.in          Explore        Get involved      About
//    Your district. Your data…       India …        Support …         About
//    Independent … sources note      Vote for …     Contribute        Privacy
//    [Instagram] [GitHub]            Compare …      Suggest a feature Disclaimer
//                                    Prices today   Vote on features
//                                                   Feedback · GitHub
//    ── Coming soon · ForThePeople Connect: report local problems …
//    Built by Jayanth M B in Mandya · Free expression under Article 19(1)(a)
//
//  GitHub and "Vote on features" live here (not in the header). There is
//  no site-wide "Data refreshed …" line: freshness belongs to each
//  dataset, next to its own figure.
//
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Github, Instagram, Users } from "lucide-react";
import styles from "./chrome.module.css";

const GITHUB_URL = "https://github.com/jayanthmb14/forthepeople";
const INSTAGRAM_URL = "https://www.instagram.com/forthepeople_in/";

export interface FooterProps {
  locale: string;
}

export default function Footer({ locale }: FooterProps) {
  const t = useTranslations("footer2");
  const th = useTranslations("header");
  const tp = useTranslations("page_home");

  const groups: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
    {
      title: t("explore"),
      links: [
        { href: `/${locale}/india`, label: t("indiaDashboard") },
        { href: `/${locale}/vote-district`, label: t("voteDistrict") },
        { href: `/${locale}/compare`, label: t("compare") },
        { href: `/${locale}/prices`, label: t("pricesToday") },
      ],
    },
    {
      title: t("involved"),
      links: [
        { href: `/${locale}/support`, label: t("supportProject") },
        { href: `/${locale}/contribute`, label: t("contribute") },
        { href: `/${locale}/features#share-idea`, label: t("suggestFeature") },
        { href: `/${locale}/features`, label: t("voteFeatures") },
        { href: `/${locale}/feedback`, label: t("feedback") },
        { href: GITHUB_URL, label: t("github"), external: true },
      ],
    },
    {
      title: t("about"),
      links: [
        { href: `/${locale}/about`, label: t("aboutUs") },
        { href: `/${locale}/privacy`, label: t("privacy") },
        { href: `/${locale}/disclaimer`, label: t("disclaimer") },
      ],
    },
  ];

  return (
    <footer role="contentinfo" className={styles.footer}>
      <div className={`ftp-container ${styles.footerGrid}`}>
        <div className={styles.footerBrand}>
          <Link href={`/${locale}`} className={styles.footerLogo} aria-label={th("home")} translate="no">
            <span className={styles.logoTile} aria-hidden>
              <Users size={17} strokeWidth={2.4} />
            </span>
            <span>
              ForThePeople<span className={styles.wordmarkSuffix}>.in</span>
            </span>
          </Link>
          <p className={styles.footerTagline}>{t("tagline")}</p>
          <p className={styles.footerNote}>{t("note")}</p>
          <div className={styles.footerIcons}>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label={tp("onInstagram")} className={styles.footerIcon}>
              <Instagram size={18} aria-hidden />
            </a>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" aria-label={tp("onGithub")} className={styles.footerIcon}>
              <Github size={18} aria-hidden />
            </a>
          </div>
        </div>
        <nav aria-label={tp("footerNav")} className={styles.footerCols}>
          {groups.map((g) => (
            <div key={g.title}>
              <h2 className={styles.footerColTitle}>{g.title}</h2>
              <ul className={styles.footerColList}>
                {g.links.map((l) => (
                  <li key={l.href}>
                    {l.external ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer">
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href}>{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="ftp-container">
        <p className={styles.connect}>
          <span className={styles.connectTag}>{t("connectSoon")}</span>
          <span>
            <strong>{t("connectName")}</strong> {t("connectBody")}
          </span>
        </p>
      </div>

      <div className={`ftp-container ${styles.footerBottom}`}>
        <span>{t("builtBy")}</span>
        <span>{t("article")}</span>
      </div>
    </footer>
  );
}
