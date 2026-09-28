/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  Leaders & officers — the directory (v5.5, owner, 28 Sep 2026: "a clean
//  ordered directory", mostly white)
// ═══════════════════════════════════════════════════════════════════════
//
//    KeyPeople     the people most citizens need first, as white cards:
//                  Collector / DC, SP and Police Commissioner, the minister
//                  in charge, the MP(s) and the MLA for the district
//                  headquarters seat (same rules as the overview's
//                  LeadersSnippet, src/lib/leader-roles.ts)
//    LeaderCard    one person as a white card (key people)
//    LeaderRows    one level as a list in a white card: on a laptop a
//                  table (name and role · constituency · party), on a phone
//                  two lines. Officers are grouped by department when there
//                  is more than one. Every row opens the same LeaderSheet.
//
//  Party colour appears only as a small dot. Names, roles, parties and
//  constituencies are records and are shown as stored.
"use client";

import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import type { Leader } from "@/hooks/useRealtimeData";
import { getPartyColor } from "@/lib/constants/party-colors";
import { useFormat } from "@/i18n/client";
import { scriptLang } from "@/lib/utils/script-lang";
import {
  isCollectorRole,
  isHeadquartersMla,
  isInChargeMinisterRole,
  isPoliceCommissionerRole,
  isSPRole,
} from "@/lib/leader-roles";
import { LeaderAvatar, isPlaceholderName, roleText } from "./leader-shared";
import s from "./LeaderDirectory.module.css";

// ── Key people ─────────────────────────────────────────────────────────

const isMP = (l: Leader) => /\bmp\b|member of parliament/i.test(l.role);

/**
 * The key people, in the order citizens look for them. A person listed at
 * two levels (a minister who is also an MLA) appears once.
 */
export function pickKeyPeople(people: Leader[], district: string): Leader[] {
  const picks: Leader[] = [
    ...people.filter((l) => isCollectorRole(l.role)),
    ...people.filter((l) => isSPRole(l.role)),
    ...people.filter((l) => isPoliceCommissionerRole(l.role)),
    ...people.filter((l) => isInChargeMinisterRole(l.role)),
    ...people.filter(isMP),
    ...people.filter((l) => isHeadquartersMla(l, district)),
  ];
  return picks.filter((l, i) => picks.findIndex((x) => x.id === l.id) === i && !isPlaceholderName(l.name));
}

/** One person, as a white tappable card. The whole card opens the detail sheet. */
export function LeaderCard({ l, onOpen, hq = false }: { l: Leader; onOpen: (l: Leader) => void; hq?: boolean }) {
  const t = useTranslations("page_leadership");
  const f = useFormat();
  const role = roleText(l, f.locale);
  const placeholder = isPlaceholderName(l.name);
  return (
    <button
      type="button"
      onClick={() => onOpen(l)}
      className="ftp-card-link"
      aria-haspopup="dialog"
      aria-label={t("card.openAria", { name: l.name, role: role.text })}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        width: "100%",
        height: "100%",
        minHeight: 44,
        padding: 14,
        textAlign: "left",
        font: "inherit",
        color: "var(--ftp-text)",
        cursor: "pointer",
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
        boxShadow: "var(--ftp-shadow-1)",
      }}
    >
      <LeaderAvatar name={l.name} photoUrl={l.photoUrl} size={48} />
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1, alignSelf: "stretch" }}>
        <span lang={role.lang} style={{ fontSize: 12, lineHeight: "16px", fontWeight: 600, color: "var(--ftp-text-2)" }}>
          {role.text}
        </span>
        <span
          className="ftp-title"
          style={{ fontSize: 16, lineHeight: "22px", fontWeight: 650, color: placeholder ? "var(--ftp-text-2)" : "var(--ftp-text)", fontStyle: placeholder ? "italic" : "normal" }}
        >
          {l.name}
        </span>
        {l.nameLocal && !placeholder && l.nameLocal !== l.name && (
          <span lang={scriptLang(l.nameLocal)} style={{ fontSize: 13, lineHeight: "19px", color: "var(--ftp-text-2)" }}>
            {l.nameLocal}
          </span>
        )}
        {hq && <span style={{ fontSize: 12, lineHeight: "18px", fontWeight: 600, color: "var(--hue-deep)" }}>{t("hqBadge")}</span>}
        <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: "auto", paddingTop: 6 }}>
          {l.party ? <PartyTag party={l.party} /> : <span />}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 12, lineHeight: "18px", fontWeight: 600, color: "var(--hue-deep)" }}>
            {t("card.details")}
            <ChevronRight size={14} aria-hidden />
          </span>
        </span>
      </span>
    </button>
  );
}

export function KeyPeople({ people, district, onOpen }: { people: Leader[]; district: string; onOpen: (l: Leader) => void }) {
  if (people.length === 0) return null;
  return (
    <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "250px", gap: 12 } as React.CSSProperties}>
      {people.map((l) => (
        <LeaderCard key={l.id} l={l} onOpen={onOpen} hq={isHeadquartersMla(l, district)} />
      ))}
    </div>
  );
}

// ── The directory ──────────────────────────────────────────────────────

/** Party as a small dot and its name (party colour appears only as the dot). */
function PartyTag({ party }: { party: string }) {
  return (
    <span className={s.party} style={{ fontSize: 13, lineHeight: "18px" }}>
      <span aria-hidden className={s.dot} style={{ background: getPartyColor(party).border }} />
      {party}
    </span>
  );
}

export type DeptId = "admin" | "police" | "development" | "health" | "education" | "city" | "other";

/** Which department an officer's role belongs to (plain word rules, English roles). */
export function officerDept(role: string): DeptId {
  const r = role.toLowerCase();
  if (/police|\bsp\b|\bdysp\b|\bips\b|\bssp\b/.test(r)) return "police";
  if (/zilla|panchayat|\bceo\b|development|rural/.test(r)) return "development";
  if (/health|medical|hospital|\bdho\b/.test(r)) return "health";
  if (/education|school|\bddpi\b|\bdeo\b/.test(r)) return "education";
  if (/mayor|municipal|corporation|city/.test(r)) return "city";
  if (/collector|deputy commissioner|magistrate|tahsildar|assistant commissioner|revenue|sub-divisional|\bias\b/.test(r)) return "admin";
  return "other";
}
const DEPT_ORDER: DeptId[] = ["admin", "police", "development", "health", "education", "city", "other"];

function LeaderRow({ l, onOpen, hq, showParty }: { l: Leader; onOpen: (l: Leader) => void; hq: boolean; showParty: boolean }) {
  const t = useTranslations("page_leadership");
  const f = useFormat();
  const role = roleText(l, f.locale);
  const placeholder = isPlaceholderName(l.name);
  const seat = l.constituency?.trim() || null;
  return (
    <li className={s.item}>
      <button
        type="button"
        className={s.row}
        onClick={() => onOpen(l)}
        aria-haspopup="dialog"
        aria-label={t("card.openAria", { name: l.name, role: role.text })}
      >
        <LeaderAvatar name={l.name} photoUrl={l.photoUrl} size={40} />
        <span className={s.who}>
          <span className={`${s.name} ${placeholder ? s.placeholder : ""}`}>
            {l.name}
            {l.nameLocal && !placeholder && l.nameLocal !== l.name && (
              <span lang={scriptLang(l.nameLocal)} style={{ fontWeight: 400, color: "var(--ftp-text-2)" }}>
                {" · "}
                {l.nameLocal}
              </span>
            )}
          </span>
          <span className={s.sub} lang={role.lang}>
            {role.text}
          </span>
          <span className={s.meta}>
            {seat && <span>{seat}</span>}
            {hq && <span className={s.hq}>{t("hqBadge")}</span>}
            {showParty && l.party && <PartyTag party={l.party} />}
          </span>
        </span>
        <span className={s.cell}>
          {seat ?? <span style={{ color: "var(--ftp-text-2)" }}>—</span>}
          {hq && <span className={s.hq}>{t("hqBadge")}</span>}
        </span>
        <span className={s.cell}>{showParty && l.party ? <PartyTag party={l.party} /> : <span style={{ color: "var(--ftp-text-2)" }}>—</span>}</span>
        <ChevronRight size={18} aria-hidden className={s.chev} />
      </button>
    </li>
  );
}

/**
 * One level of government as a list. `groupByDept` splits officers into
 * departments (only when there is more than one department).
 */
export function LeaderRows({
  leaders,
  district,
  onOpen,
  groupByDept = false,
  partyColumn = true,
}: {
  leaders: Leader[];
  district: string;
  onOpen: (l: Leader) => void;
  groupByDept?: boolean;
  /** Officers have no party: the column shows a dash, so it can be left out. */
  partyColumn?: boolean;
}) {
  const t = useTranslations("page_leadership");
  const groups = new Map<DeptId, Leader[]>();
  if (groupByDept) for (const l of leaders) groups.set(officerDept(l.role), [...(groups.get(officerDept(l.role)) ?? []), l]);
  const split = groupByDept && groups.size > 1;
  const row = (l: Leader) => <LeaderRow key={l.id} l={l} onOpen={onOpen} hq={isHeadquartersMla(l, district)} showParty={partyColumn} />;
  return (
    <ul className={s.list}>
      <li className={s.head} aria-hidden>
        <span />
        <span>{t("table.name")}</span>
        <span>{t("table.seat")}</span>
        <span>{partyColumn ? t("table.party") : ""}</span>
        <span />
      </li>
      {split
        ? DEPT_ORDER.filter((d) => groups.has(d)).flatMap((d) => [
            <li key={`g-${d}`} className={s.group}>
              {t(`dept.${d}`)}
            </li>,
            ...(groups.get(d) ?? []).map(row),
          ])
        : leaders.map(row)}
    </ul>
  );
}
