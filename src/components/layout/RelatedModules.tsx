/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// RelatedModules — the "See also" row at the end of every district module
// page. It reads the open module from the URL and shows the modules listed
// in its registry `related` field (docs/MODULE-MAP.md "Pairs that used to be
// confusing"): Govt offices near you ↔ How to get certificates, Dams &
// rivers ↔ Tap water, What you can do ↔ Helplines & your rights, and so on.
//
// Mounted once in the district layout, under the page, so every module page
// gets it without page edits. Pages with nothing related (overview, taluk
// pages) render nothing. Each tile is the module's emoji (its identity
// icon), translated name and one-line description in its own hue.
// v5: the heading is text only.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useModuleText } from "@/i18n/client";
import { Section } from "@/components/district/ui";
import { getRelatedModules } from "@/lib/constants/sidebar-modules";
import { hueClass, moduleFromPath } from "@/lib/design/hues";

export default function RelatedModules({
  locale,
  stateSlug,
  districtSlug,
}: {
  locale: string;
  stateSlug: string;
  districtSlug: string;
}) {
  const ts = useTranslations("sidebar");
  const mt = useModuleText();
  const pathname = usePathname();
  const related = getRelatedModules(moduleFromPath(pathname));
  if (related.length === 0) return null;

  const base = `/${locale}/${stateSlug}/${districtSlug}`;
  return (
    <nav aria-label={ts("seeAlso")} className="ftp-module-page" style={{ paddingTop: 0 }}>
      <Section title={ts("seeAlso")}>
        <ul className="ftp-module-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(220px, 100%), 1fr))" }}>
          {related.map((m) => (
            <li key={m.slug} className={hueClass(m.slug)}>
              <Link href={m.slug === "overview" ? base : `${base}/${m.slug}`} className="ftp-module-tile ftp-card-link">
                <span className="ftp-module-emoji ftp-emoji" aria-hidden>
                  {m.emoji}
                </span>
                <span className="ftp-module-name">{mt.label(m.slug)}</span>
                <span className="ftp-module-desc">{mt.description(m.slug)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </nav>
  );
}
