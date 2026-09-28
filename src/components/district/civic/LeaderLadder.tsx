/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  LeaderLadder — "who is above whom", as a picture
// ═══════════════════════════════════════════════════════════════════════
//
//          ┌──────── 🏛️ Country ─────────┐          narrow at the top
//        ┌────────── 🗺️ State ────────────┐
//      ┌──────── 🗳️ MP and MLAs ────────────┐       (you vote for them)
//    ┌────────── 🏢 District officers ────────┐
//  ┌──────────── 🏙️ City and departments ───────┐   wide at the bottom
//
//  One band per level of government, top to bottom, each with its icon,
//  a plain one-line hint, how many people are listed, and the first names
//  as tappable chips (the chip opens that person's detail sheet; "+N
//  more" jumps to the level's list). On phones every band is full width;
//  from 600 px up the bands widen step by step into a pyramid.
"use client";

import { useTranslations } from "next-intl";
import type { Leader } from "@/hooks/useRealtimeData";
import { useFormat } from "@/i18n/client";
import { roleText, tierMeta } from "./leader-shared";

const CHIPS_PER_LEVEL = 3;

export function LeaderLadder({
  tiers,
  byTier,
  onPick,
  onJump,
}: {
  /** Levels in top-to-bottom order. */
  tiers: number[];
  byTier: Record<number, Leader[]>;
  onPick: (l: Leader) => void;
  onJump: (tier: number) => void;
}) {
  const t = useTranslations("page_leadership");
  const f = useFormat();
  const summary = tiers.map((tier) => `${tierMeta(tier, t).short}: ${f.number(byTier[tier]?.length ?? 0)}`).join(", ");
  const steps = tiers.length;
  return (
    <figure style={{ margin: 0 }}>
      <figcaption style={{ marginBottom: 12 }}>
        <span className="ftp-display" style={{ display: "block", fontSize: 18, lineHeight: "24px", fontWeight: 650, color: "var(--ftp-text)" }}>
          {t("ladder.title")}
        </span>
        <span style={{ display: "block", marginTop: 2, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{t("ladder.lead")}</span>
      </figcaption>
      <ol aria-label={t("ladder.aria", { summary })} style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 0 }}>
        {tiers.map((tier, i) => {
          const m = tierMeta(tier, t);
          const people = byTier[tier] ?? [];
          const shown = people.slice(0, CHIPS_PER_LEVEL);
          const more = people.length - shown.length;
          // Pyramid: each band is narrower than the next by one "step"; the
          // step is 0 on phones and grows to 56 px on wide screens.
          const inset = steps - 1 - i;
          return (
            <li key={tier} style={{ display: "grid", justifyItems: "center" }}>
              {i > 0 && (
                <span aria-hidden style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", margin: "2px 0" }}>
                  ▼
                </span>
              )}
              <div
                className="ftp-rise"
                style={{
                  ["--i" as string]: i,
                  width: `calc(100% - ${inset} * clamp(0px, (100vw - 600px) * 0.12, 56px))`,
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  padding: "12px 14px",
                  borderRadius: "var(--ftp-radius-tile)",
                  // v5.5: the level shows in the icon and the title only.
                  // v5.7: a band inside the card is a quiet surface-2 panel
                  // (no second border); the white name buttons sit on it.
                  background: "var(--ftp-surface-2)",
                }}
              >
                <span className="ftp-icon-chip" aria-hidden style={{ width: 36, height: 36, borderRadius: 11 }}>
                  <m.icon size={18} />
                </span>
                <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <span className="ftp-display" style={{ fontSize: 16, lineHeight: "22px", fontWeight: 650, color: "var(--hue-deep)" }}>
                      {m.short}
                    </span>
                    <span className="ftp-num" style={{ fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)" }}>
                      {t("ladder.people", { n: people.length })}
                    </span>
                    {tier === 4 && (
                      <span
                        style={{
                          fontSize: 11,
                          lineHeight: "18px",
                          fontWeight: 700,
                          padding: "0 8px",
                          borderRadius: 999,
                          border: "1px solid color-mix(in srgb, var(--hue) 35%, var(--ftp-border))",
                          color: "var(--hue-deep)",
                        }}
                      >
                        {t("ladder.yourVote")}
                      </span>
                    )}
                  </div>
                  {m.hint && <p style={{ margin: "2px 0 0", fontSize: 12, lineHeight: "17px", color: "var(--ftp-text-2)" }}>{m.hint}</p>}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: "1 1 240px", justifyContent: "flex-start" }}>
                  {shown.map((l) => {
                    const role = roleText(l, f.locale);
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => onPick(l)}
                        className="ftp-chip"
                        aria-label={t("ladder.openPerson", { name: l.name, role: role.text })}
                        style={{
                          display: "inline-flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          justifyContent: "center",
                          minHeight: 44,
                          maxWidth: "100%",
                          padding: "4px 12px",
                          borderRadius: "var(--ftp-radius-tile)",
                          border: "1px solid var(--ftp-border)",
                          background: "var(--ftp-surface)",
                          cursor: "pointer",
                          font: "inherit",
                          textAlign: "left",
                          color: "var(--ftp-text)",
                        }}
                      >
                        <span style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600 }}>{l.name}</span>
                        <span lang={role.lang} style={{ fontSize: 11, lineHeight: "15px", color: "var(--ftp-text-2)" }}>
                          {role.text}
                        </span>
                      </button>
                    );
                  })}
                  {more > 0 && (
                    <button
                      type="button"
                      onClick={() => onJump(tier)}
                      className="ftp-chip"
                      style={{
                        minHeight: 44,
                        padding: "0 12px",
                        borderRadius: 12,
                        border: "1px dashed color-mix(in srgb, var(--hue) 40%, var(--ftp-border))",
                        background: "transparent",
                        cursor: "pointer",
                        font: "inherit",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--hue-deep)",
                      }}
                    >
                      {t("ladder.more", { n: more })}
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
