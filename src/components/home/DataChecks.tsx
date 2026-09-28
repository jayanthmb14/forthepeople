/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  DataChecks — "How we get and check the data", four picture steps
// ═══════════════════════════════════════════════════════════════════════
//
//   ┌──────────────┬──────────────┬──────────────┬──────────────┐
//   │ (pic) 1      │ (pic) 2      │ (pic) 3      │ (pic) 4      │
//   │ Collect      │ Check        │ Double-check │ Show it with │
//   │ from govern- │ automatically│ with a second│ its date and │
//   │ ment portals │ …            │ source …     │ source …     │
//   └──────────────┴──────────────┴──────────────┴──────────────┘
//   See it on a district: Check this data →
//
//  Quiet on purpose: one white box split into four steps by thin lines,
//  the pictures all in the brand blue, numbers in small circles.
//
//  Every sentence describes what really happens (docs/BLUEPRINT-UNIFIED
//  §6–7): automatic feeds plus researched rows; empty / zero / impossible
//  values are left out, never filled in; a second source is compared
//  where one exists and doubtful news-based updates wait for a person;
//  every dataset shows its date, and old data says it is old. The link
//  opens the "Check this data" section (#verify) of a live district.
//
//  Server component.
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { StepCheck, StepCollect, StepCompare, StepShow } from "./HomeGlyphs";
import styles from "./home.module.css";

const STEPS = [
  { key: "collect", Pic: StepCollect },
  { key: "check", Pic: StepCheck },
  { key: "compare", Pic: StepCompare },
  { key: "show", Pic: StepShow },
] as const;

export default function DataChecks({ locale, example }: { locale: string; example: { stateSlug: string; slug: string; name: string } | null }) {
  const t = useTranslations("page_home");
  return (
    <section aria-labelledby="home-checks" className={`ftp-container ${styles.section}`}>
      <div className={styles.sectionHead}>
        <h2 id="home-checks" className={styles.h2}>
          {t("checks.title")}
        </h2>
        <p className={styles.sectionNote}>{t("checks.lead")}</p>
      </div>
      <ol className={styles.steps}>
        {STEPS.map(({ key, Pic }, i) => (
          <li key={key} className={`${styles.step} ftp-hue-blue`}>
            <span className={styles.stepTop}>
              <Pic size={36} />
              <span className={styles.stepNum} aria-hidden>
                {i + 1}
              </span>
            </span>
            <span className={styles.stepTitle}>{t(`checks.${key}Title`)}</span>
            <span className={styles.stepBody}>{t(`checks.${key}Body`)}</span>
          </li>
        ))}
      </ol>
      {example && (
        <Link href={`/${locale}/${example.stateSlug}/${example.slug}#verify`} className={styles.textLink}>
          {t("checks.link", { name: example.name })}
          <ArrowRight size={16} aria-hidden />
        </Link>
      )}
    </section>
  );
}
