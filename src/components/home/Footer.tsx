/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Footer — site-wide footer (Design v5.1 "Warm Calm", light)
// ═══════════════════════════════════════════════════════════════════════
//
//    ═══ pastel ribbon ═══
//    [logo] ForThePeople.in      (blue) Explore     (rose) Get involved   (teal) About
//    Your district. Your data…   India dashboard    Support the project   About
//    Independent … sources note  Prices today       Vote on features      Privacy
//    [Instagram] [GitHub ★ 312]  Vote for a district Suggest a feature    Disclaimer
//                                Compare districts  Contribute · Feedback
//                                                   Code on GitHub ★ 312
//    Coming soon from ForThePeople
//    [mark] ForThePeople Connect — report local problems      Coming soon
//    [mark] ForThePeople Jobs — government jobs and exams     Coming soon
//    Built by Jayanth M B · Free expression under Article 19(1)(a)
//
//  "Jayanth M B" links to his LinkedIn profile (new tab; screen readers
//  hear "LinkedIn, opens in a new tab").
//
//  Each column title has a small icon chip in its own pastel hue. There is
//  no site-wide "Data refreshed …" line: freshness belongs to each dataset,
//  next to its own figure (and in the status strip only when it is true).
//
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Compass, Github, HeartHandshake, Info, Instagram, Star, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NUMBER_LOCALE } from "@/i18n/languages";
import { PRODUCTS, ProductMark } from "./products";
import styles from "./chrome.module.css";

const GITHUB_URL = "https://github.com/jayanthmb14/forthepeople";
const INSTAGRAM_URL = "https://www.instagram.com/forthepeople_in/";
const LINKEDIN_URL = "https://www.linkedin.com/in/jayanthmb/";

export interface FooterProps {
  locale: string;
  /** GitHub star count from the server (hourly); null = unknown, no number. */
  githubStars?: number | null;
}

type FooterLink = { href: string; label: string; external?: boolean; stars?: boolean };

export default function Footer({ locale, githubStars = null }: FooterProps) {
  const t = useTranslations("footer2");
  const th = useTranslations("header");
  const tp = useTranslations("page_home");
  const stars = githubStars !== null ? githubStars.toLocaleString(NUMBER_LOCALE) : null;

  const groups: { title: string; hue: string; Icon: LucideIcon; links: FooterLink[] }[] = [
    {
      title: t("explore"),
      hue: "ftp-hue-blue",
      Icon: Compass,
      links: [
        { href: `/${locale}/india`, label: t("indiaDashboard") },
        { href: `/${locale}/prices`, label: t("pricesToday") },
        { href: `/${locale}/vote-district`, label: t("voteDistrict") },
        { href: `/${locale}/compare`, label: t("compare") },
      ],
    },
    {
      title: t("involved"),
      hue: "ftp-hue-rose",
      Icon: HeartHandshake,
      links: [
        { href: `/${locale}/support`, label: t("supportProject") },
        { href: `/${locale}/features`, label: t("voteFeatures") },
        { href: `/${locale}/features#share-idea`, label: t("suggestFeature") },
        { href: `/${locale}/contribute`, label: t("contribute") },
        { href: `/${locale}/feedback`, label: t("feedback") },
        { href: GITHUB_URL, label: t("github"), external: true, stars: true },
      ],
    },
    {
      title: t("about"),
      hue: "ftp-hue-teal",
      Icon: Info,
      links: [
        { href: `/${locale}/about`, label: t("aboutUs") },
        { href: `/${locale}/privacy`, label: t("privacy") },
        { href: `/${locale}/disclaimer`, label: t("disclaimer") },
      ],
    },
  ];

  // "Built by <Jayanth M B>" — the name is the link.
  const builtBy = t.rich("builtBy", {
    link: (chunks) => (
      <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className={styles.builtByLink}>
        {chunks}
        <span className="sr-only"> {t("linkedinNote")}</span>
      </a>
    ),
  });

  const starBadge = stars && (
    <>
      <span className={styles.footerStars} aria-hidden>
        <Star size={12} className={styles.star} />
        <span className="ftp-num">{stars}</span>
      </span>
      <span className="sr-only">{th("stars", { n: githubStars ?? 0 })}</span>
    </>
  );

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
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label={tp("onInstagram")} className={`ftp-hue-pink ${styles.footerIcon}`}>
              <Instagram size={18} aria-hidden />
            </a>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={`ftp-hue-slate ${styles.footerIcon} ${styles.footerIconWide}`}>
              <Github size={18} aria-hidden />
              <span className="sr-only">{tp("onGithub")}</span>
              {starBadge}
            </a>
          </div>
        </div>
        <nav aria-label={tp("footerNav")} className={styles.footerCols}>
          {groups.map((g) => (
            <div key={g.title} className={g.hue}>
              <h2 className={styles.footerColTitle}>
                <span className={styles.footerColIcon} aria-hidden>
                  <g.Icon size={15} />
                </span>
                {g.title}
              </h2>
              <ul className={styles.footerColList}>
                {g.links.map((l) => (
                  <li key={l.href}>
                    {l.external ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer">
                        {l.label}
                        {l.stars && starBadge}
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
        <section className={styles.soon} aria-labelledby="ftp-footer-soon">
          <h2 id="ftp-footer-soon" className={styles.soonTitle}>
            {t("comingSoonTitle")}
          </h2>
          <ul className={styles.soonList}>
            {PRODUCTS.filter((p) => p.status === "soon").map((p) => (
              <li key={p.key} className={`${p.hue} ${styles.soonCard}`}>
                <ProductMark product={p} size={36} />
                <span className={styles.productText}>
                  <span className={styles.productName} translate="no" lang="en">
                    {p.name}
                  </span>
                  <span className={styles.productHint}>{th(`products.${p.key}Hint`)}</span>
                </span>
                <span className={styles.productSoon}>{th("products.soon")}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* The rule sits inside the container, so it lines up with the
          dashed rule and the columns above (not the container's padding). */}
      <div className="ftp-container">
        <div className={styles.footerBottom}>
          <span>{builtBy}</span>
          <span>{t("article")}</span>
        </div>
      </div>
    </footer>
  );
}
