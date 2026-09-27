/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  DataChecks — "How we get and check the data", four picture steps
// ═══════════════════════════════════════════════════════════════════════
//
//   ① (portal→tray)  ─→  ② (gear ✓)  ─→  ③ (two papers =)  ─→  ④ (card)
//   Collect              Check             Double-check           Show it with
//   from government      automatically     with a second          its date and
//   portals and …        …                 source …               source …
//                    [ See it on a district: Check this data → ]
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
  { key: "collect", hue: "blue", Pic: StepCollect },
  { key: "check", hue: "violet", Pic: StepCheck },
  { key: "compare", hue: "teal", Pic: StepCompare },
  { key: "show", hue: "amber", Pic: StepShow },
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
        {STEPS.map(({ key, hue, Pic }, i) => (
          <li key={key} className={`${styles.step} ftp-hue-${hue}`}>
            <span className={styles.stepTop}>
              <Pic size={48} />
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
