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
import { Database, LayoutGrid, Eye } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, Section } from "@/components/district/ui";
import { getPlatformFacts } from "@/lib/platform-facts";
import styles from "./home.module.css";

const { modulesPerDistrict } = getPlatformFacts();

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Database,
    title: "We collect",
    body: "Data from official .gov.in portals, checked daily and stamped with the date the source published. NDSAP-licensed, traceable to the source.",
  },
  {
    icon: LayoutGrid,
    title: "We organise",
    body: `Into ${modulesPerDistrict} dashboards per district with charts, maps, news and source links.`,
  },
  {
    icon: Eye,
    title: "You see",
    body: 'The latest district data, with an "as of" date on every figure. Free. Open source. Yours.',
  },
];

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
  return (
    <div className="ftp-container">
      <Section id="how-it-works" title="How it works">
        <ol className={styles.howGrid}>
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <Card as="li" key={step.title}>
                <div className={styles.howHead}>
                  <span className={`ftp-num ${styles.howNum}`}>{String(i + 1).padStart(2, "0")}</span>
                  <Icon size={18} aria-hidden className={styles.howIcon} />
                </div>
                <h3 className="ftp-title">{step.title}</h3>
                <p className={styles.howBody}>{step.body}</p>
              </Card>
            );
          })}
        </ol>
        <p className={styles.howSources}>
          Sources include{" "}
          {SOURCES.map((s, i) => (
            <span key={s.href}>
              {i > 0 && ", "}
              <a href={s.href} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            </span>
          ))}{" "}
          and other public datasets. Every module page lists its own sources.
        </p>
      </Section>
    </div>
  );
}
