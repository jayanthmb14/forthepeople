/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  NewsList — every list of headlines on the site, one quiet row per story
// ═══════════════════════════════════════════════════════════════════════
//
//  v5.6 (Sept 2026, owner feedback: "news should be in one line"; the June
//  "News and Updates" list read well). A white list with hairline dividers:
//
//    Headline on one line, cut with "…" when it is too long ........ [↗]
//    Deccan Herald · 4 days ago · Crime  [Police]
//
//  The full headline is in the row's title (tooltip) and is read out in full
//  by screen readers. The meta line (where it came from, when, what it is
//  about) is small grey text; a tag is a tiny neutral box. No colour but the
//  brand blue on hover and focus.
//
//  A row can
//    - open a detail sheet (`onOpen`), with the original story on a
//      separate 48 px "open" button beside it (`href`),
//    - or be one link (`href`): external stories open in a new tab,
//      `internal` links stay on the site.
//
//  No hooks and no "use client": the news page, the "Related news" block,
//  the district overview (client) and the India module pages (server) all
//  use it. Callers pass translated text (`newTabLabel`, meta pieces).
//
//  Used by: news/page.tsx, district/ModuleNews.tsx, OverviewClient.tsx,
//  india/module-page/ModuleNewsStrip.tsx, india/sections/RelevantNewsSection.tsx.

import Link from "next/link";
import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import s from "./NewsList.module.css";

export interface NewsRowItem {
  id: string;
  /** Already cleaned headline text. */
  headline: string;
  /** Language of the headline/summary when it differs from the page. */
  lang?: string;
  /** Optional one-line summary under the headline (cut with "…"). */
  summary?: string | null;
  /** Meta pieces, joined with " · ": publisher, <time>, topic. Empty ones are skipped. */
  meta: ReactNode[];
  /** A tiny neutral tag at the end of the meta line (e.g. the data page it is about). */
  tag?: ReactNode;
  /** The original story (or, with `internal`, a page on this site). */
  href?: string | null;
  /** `href` is a page on this site (no new tab). */
  internal?: boolean;
  /** Opens the story's detail sheet. The row becomes a button; `href` moves to the side button. */
  onOpen?: () => void;
}

export default function NewsList({
  items,
  newTabLabel,
  openOriginalLabel,
  flush = false,
  label,
}: {
  items: NewsRowItem[];
  /** Screen-reader note on external links: "(opens the original article in a new tab)". */
  newTabLabel: string;
  /** Accessible name of the side "open the original" button (rows with `onOpen`). */
  openOriginalLabel?: string;
  /** No own frame: the list sits inside a Card. */
  flush?: boolean;
  /** Accessible name of the list. */
  label?: string;
}) {
  return (
    <ul className={`${s.list}${flush ? ` ${s.flush}` : ""}`} aria-label={label}>
      {items.map((n) => (
        <NewsRow key={n.id} n={n} newTabLabel={newTabLabel} openOriginalLabel={openOriginalLabel} />
      ))}
    </ul>
  );
}

function RowBody({ n, externalIcon }: { n: NewsRowItem; externalIcon: boolean }) {
  const meta = n.meta.filter((m) => m !== null && m !== undefined && m !== false && m !== "");
  return (
    <>
      <span className={s.titleLine}>
        <span className={s.title} lang={n.lang}>
          {n.headline}
        </span>
        {externalIcon && <ExternalLink size={14} aria-hidden className={s.inlineIcon} />}
      </span>
      {n.summary && (
        <span className={s.summary} lang={n.lang}>
          {n.summary}
        </span>
      )}
      {(meta.length > 0 || n.tag) && (
        <span className={s.meta}>
          {meta.map((m, i) => (
            <span key={i} className={s.metaItem}>
              {i > 0 && (
                <span className={s.sep} aria-hidden>
                  ·
                </span>
              )}
              {m}
            </span>
          ))}
          {n.tag && <span className={s.tag}>{n.tag}</span>}
        </span>
      )}
    </>
  );
}

function NewsRow({ n, newTabLabel, openOriginalLabel }: { n: NewsRowItem; newTabLabel: string; openOriginalLabel?: string }) {
  const external = Boolean(n.href) && !n.internal;

  // Opens the sheet; the original story sits on its own button beside it.
  if (n.onOpen) {
    return (
      <li className={s.row}>
        <button type="button" className={s.main} onClick={n.onOpen} title={n.headline}>
          <RowBody n={n} externalIcon={false} />
        </button>
        {n.href && (
          <a
            href={n.href}
            target="_blank"
            rel="noopener noreferrer"
            className={s.ext}
            title={openOriginalLabel}
            aria-label={`${openOriginalLabel ?? ""} ${newTabLabel}`.trim()}
          >
            <ExternalLink size={16} aria-hidden />
          </a>
        )}
      </li>
    );
  }

  if (n.href && n.internal) {
    return (
      <li className={s.row}>
        <Link href={n.href} className={s.main} title={n.headline}>
          <RowBody n={n} externalIcon={false} />
        </Link>
      </li>
    );
  }

  if (n.href && external) {
    return (
      <li className={s.row}>
        <a href={n.href} target="_blank" rel="noopener noreferrer" className={s.main} title={n.headline}>
          <RowBody n={n} externalIcon />
          <span className="sr-only"> {newTabLabel}</span>
        </a>
      </li>
    );
  }

  return (
    <li className={s.row}>
      <div className={s.main} title={n.headline}>
        <RowBody n={n} externalIcon={false} />
      </div>
    </li>
  );
}
