/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// The courts page's data pictures:
//   AgeRibbon   cases waiting by age, one soft ribbon, fresh (teal) → old (rose)
//   TookBars    last year's decided cases by time taken, same colours
//   ChecksList  "checked two ways": which NJDG counts agreed
"use client";

import type React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AgeBands } from "@/lib/courts/parse";
import type { CourtCheck } from "@/lib/courts/snapshot";
import { useFormat } from "@/i18n/client";
import { AGE_HUES } from "./data";
import styles from "../courts.module.css";

const pctOf = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

/** One stacked ribbon of the five age bands (no labels; the legend carries them). */
export function AgeRibbonBar({ bands, thin, ariaLabel }: { bands: AgeBands; thin?: boolean; ariaLabel: string }) {
  const total = bands.reduce((s, n) => s + n, 0);
  return (
    <div className={`${styles.ribbon} ${thin ? styles.ribbonThin : ""}`} role="img" aria-label={ariaLabel}>
      {bands.map((n, i) =>
        n > 0 ? (
          <div
            key={i}
            className={`${styles.seg} ftp-hue-${AGE_HUES[i]}`}
            style={{ flexGrow: n, flexBasis: 0, ["--i" as string]: i } as React.CSSProperties}
            title={`${pctOf(n, total)}%`}
          />
        ) : null,
      )}
    </div>
  );
}

/** Cases waiting by age: the ribbon and a legend with counts and shares. */
export function AgeRibbon({ bands }: { bands: AgeBands }) {
  const t = useTranslations("page_courts");
  const f = useFormat();
  const total = bands.reduce((s, n) => s + n, 0);
  const labels = [t("age0"), t("age1"), t("age2"), t("age3"), t("age4")];
  const aria = t("ageAria", {
    list: bands.map((n, i) => t("ageAriaItem", { label: labels[i], count: f.number(n) })).join(", "),
  });
  return (
    <figure style={{ margin: 0 }}>
      <AgeRibbonBar bands={bands} ariaLabel={aria} />
      <ul className={styles.legend} aria-hidden>
        {bands.map((n, i) => (
          <li key={i} className={`${styles.legendItem} ftp-hue-${AGE_HUES[i]}`}>
            <span className={styles.swatch} />
            <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{labels[i]}</span>
              <span style={{ display: "flex", gap: 6, alignItems: "baseline", flexWrap: "wrap" }}>
                <strong className="ftp-num" style={{ fontSize: 16, lineHeight: "22px", color: "var(--hue-deep)" }}>
                  {f.number(n)}
                </strong>
                <span style={{ fontSize: 12, color: "var(--ftp-text-2)" }}>{t("agePct", { pct: pctOf(n, total) })}</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Last year's decided cases, by time taken (fresh → old colours). */
export function TookBars({ took, year }: { took: AgeBands; year: number }) {
  const t = useTranslations("page_courts");
  const f = useFormat();
  const max = Math.max(...took);
  const total = took.reduce((s, n) => s + n, 0);
  const labels = [t("took0"), t("took1"), t("took2"), t("took3"), t("took4")];
  const aria = t("tookAria", {
    year: String(year),
    list: took.map((n, i) => t("ageAriaItem", { label: labels[i], count: f.number(n) })).join(", "),
  });
  return (
    <ul className={styles.took} role="img" aria-label={aria}>
      {took.map((n, i) => (
        <li key={i} className={`${styles.tookRow} ftp-hue-${AGE_HUES[i]}`} aria-hidden>
          <span style={{ color: "var(--ftp-text-2)" }}>{labels[i]}</span>
          <span className={styles.tookTrack}>
            <span
              className={styles.tookFill}
              style={{ display: "block", width: `${max > 0 ? Math.max(1.5, (n / max) * 100) : 0}%`, ["--i" as string]: i } as React.CSSProperties}
            />
          </span>
          <span className="ftp-num" style={{ minWidth: 84, textAlign: "end", color: "var(--hue-deep)" }}>
            {f.number(n)} <span style={{ fontWeight: 400, color: "var(--ftp-text-2)" }}>· {pctOf(n, total)}%</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** "Checked two ways": one line per NJDG cross-check, green when it agreed. */
export function ChecksList({ checks, decidedYear }: { checks: CourtCheck[]; decidedYear: number | null }) {
  const t = useTranslations("page_courts");
  const f = useFormat();
  // One line per kind of check (a district with several NJDG units runs
  // each check once per unit): it agrees only if every unit agreed.
  const kinds = (["ageMatches", "ageAddsUp", "decidedMatches"] as const)
    .map((id) => {
      const list = checks.filter((c) => c.id === id);
      if (list.length === 0) return null;
      const ok = list.every((c) => c.ok);
      const expected = list.reduce((s, c) => s + c.expected, 0);
      const found = list.reduce((s, c) => s + c.found, 0);
      return { id, ok, expected, found };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <ul className={styles.checks}>
      {kinds.map((c) => {
        let text: string;
        if (!c.ok) text = t("checkFailed", { expected: f.number(c.expected), found: f.number(c.found) });
        else if (c.id === "ageMatches") text = t("checkAgeMatches", { found: f.number(c.found) });
        else if (c.id === "ageAddsUp")
          text =
            c.found === c.expected
              ? t("checkAgeAddsUp", { found: f.number(c.found) })
              : t("checkAgeAddsUpClose", { gap: f.number(Math.abs(c.found - c.expected)) });
        else text = t("checkDecided", { year: String(decidedYear ?? ""), found: f.number(c.found) });
        return (
          <li key={c.id} className={styles.check}>
            {c.ok ? (
              <CheckCircle2 size={18} aria-hidden style={{ color: "var(--ftp-live)", flexShrink: 0, marginTop: 1 }} />
            ) : (
              <AlertTriangle size={18} aria-hidden style={{ color: "var(--ftp-warn)", flexShrink: 0, marginTop: 1 }} />
            )}
            <span>
              <span className="sr-only">{c.ok ? t("checkOk") : t("checkNo")}: </span>
              {text}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
