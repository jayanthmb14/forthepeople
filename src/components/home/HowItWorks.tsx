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
import { Section } from "@/components/district/ui";
import { getPlatformFacts } from "@/lib/platform-facts";
import styles from "./home.module.css";

const { modulesPerDistrict } = getPlatformFacts();

const STEPS: { icon: LucideIcon; emoji: string; hue: string; title: string; body: string }[] = [
  {
    icon: Database,
    emoji: "📡",
    hue: "orange",
    title: "We collect",
    body: "Data from official .gov.in portals, checked daily and stamped with the date the source published. NDSAP-licensed, traceable to the source.",
  },
  {
    icon: LayoutGrid,
    emoji: "🧩",
    hue: "blue",
    title: "We organise",
    body: `Into ${modulesPerDistrict} dashboards per district with charts, maps, news and source links.`,
  },
  {
    icon: Eye,
    emoji: "👀",
    hue: "green",
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
      <Section id="how-it-works" title="How it works" emoji="⚙️">
        <ol className={styles.howGrid}>
          {/* A real sequence (collect → organise → see), so the steps are
              numbered and joined by a dotted line on wide screens. */}
          {STEPS.map((step, i) => (
            <li key={step.title} className={`${styles.howStep} ftp-hue-${step.hue}`}>
              <div className={styles.howHead}>
                <span className={`${styles.howEmoji} ftp-emoji`} aria-hidden>
                  {step.emoji}
                </span>
                <span className={styles.howNum}>Step {i + 1}</span>
              </div>
              <h3 className={styles.howTitle}>{step.title}</h3>
              <p className={styles.howBody}>{step.body}</p>
            </li>
          ))}
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
