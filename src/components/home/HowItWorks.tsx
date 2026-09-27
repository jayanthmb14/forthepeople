/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  HowItWorks — three plain cards: collect → organise → you see
// ═══════════════════════════════════════════════════════════════════════
//
//  Copy is the audited, honest wording from the v2 section (no promise of
//  "real-time" anything). The module count comes from getPlatformFacts()
//  (the sidebar registry), never a typed number. Sources are real links.
//
import { useTranslations } from "next-intl";
import { Section } from "@/components/district/ui";
import { getPlatformFacts } from "@/lib/platform-facts";
import styles from "./home.module.css";

const { modulesPerDistrict } = getPlatformFacts();

/** Headline public sources. Full attribution lives on every module page. */
const SOURCES: { label: string; href: string }[] = [
  { label: "data.gov.in", href: "https://data.gov.in" },
  { label: "censusindia.gov.in", href: "https://censusindia.gov.in" },
  { label: "AGMARKNET", href: "https://agmarknet.gov.in" },
  { label: "eJalShakti", href: "https://ejalshakti.gov.in" },
  { label: "NFHS-5", href: "https://rchiips.org/nfhs/" },
  { label: "SHRUG", href: "https://www.devdatalab.org/shrug" },
  { label: "PRS", href: "https://prsindia.org" },
  { label: "Harvard Dataverse", href: "https://dataverse.harvard.edu" },
];

export default function HowItWorks() {
  const t = useTranslations("home");
  const STEPS = [
    { emoji: "📡", hue: "orange", title: t("collectTitle"), body: t("collectBody") },
    { emoji: "🧩", hue: "blue", title: t("organiseTitle"), body: t("organiseBody", { modules: modulesPerDistrict }) },
    { emoji: "👀", hue: "green", title: t("seeTitle"), body: t("seeBody") },
  ];
  return (
    <div className="ftp-container">
      <Section id="how-it-works" title={t("howItWorks")} emoji="⚙️">
        <ol className={styles.howGrid}>
          {/* A real sequence (collect → organise → see), so the steps are
              numbered and joined by a dotted line on wide screens. */}
          {STEPS.map((step, i) => (
            <li key={step.title} className={`${styles.howStep} ftp-hue-${step.hue}`}>
              <div className={styles.howHead}>
                <span className={`${styles.howEmoji} ftp-emoji`} aria-hidden>
                  {step.emoji}
                </span>
                <span className={styles.howNum}>{t("step", { n: i + 1 })}</span>
              </div>
              <h3 className={styles.howTitle}>{step.title}</h3>
              <p className={styles.howBody}>{step.body}</p>
            </li>
          ))}
        </ol>
        <p className={styles.howSources}>
          {t("sourcesInclude")}{" "}
          {SOURCES.map((s, i) => (
            <span key={s.href}>
              {i > 0 && ", "}
              <a href={s.href} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            </span>
          ))}{" "}
          {t("sourcesRest")}
        </p>
      </Section>
    </div>
  );
}
