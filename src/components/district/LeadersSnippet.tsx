/**
 * ForThePeople.in — Compact leadership snippet for the district overview.
 *
 * Shows the key positions citizens look for first:
 *   Collector  (Collector / District Collector / Deputy Commissioner /
 *               District Magistrate — src/lib/leader-roles.ts)
 *   SP         (Superintendent of Police) and/or Police Commissioner
 *              (Commissioner of Police), each under its own label
 *   MP         (T4 row whose role mentions MP / Member of Parliament)
 *   MLAs       (how many we list + per-party tally; never presented as the
 *               district's total number of seats)
 *
 * v5.4 (Sept 2026 audit): the Collector rule matches the glance tile's
 * (Hyderabad, Mumbai and Lucknow said "Name not published yet" although the
 * name was in the data), a Commissioner of Police is labelled as one (seven
 * districts showed "SP <Commissioner>"), and the MLA count says "listed".
 *
 * Renders nothing if the district has zero leaders, so empty districts
 * don't show a hollow shell. Links to /leadership for the full hierarchy.
 *
 * Design v3: a kit Card with a title row; each position is one 44 px row
 * (Lucide icon · role label · name). Party colour appears only as a 6 px dot.
 *
 * v5.1 "Warm Calm": OverviewCard frame with the drawn public-hall mark;
 * each named person gets a round initials badge in the hue (a dashed "?"
 * circle when the name is not published), so the card reads as people.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { Vote } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Leader } from "@/hooks/useRealtimeData";
import { getPartyColor } from "@/lib/constants/party-colors";
import OverviewCard from "@/components/district/shell/OverviewCard";
import { LeadersMark } from "@/components/district/shell/overview-art";
import { isCollectorRole, isHeadquartersMla, isInChargeMinisterRole, isPoliceCommissionerRole, isSPRole } from "@/lib/leader-roles";

interface ApiResponse { data: Leader[]; meta?: unknown }

const isCollector = (l: Leader) => isCollectorRole(l.role);
const isSP = (l: Leader) => isSPRole(l.role);
const isCP = (l: Leader) => isPoliceCommissionerRole(l.role);
function isMP(l: Leader): boolean {
  return /\bmp\b|member of parliament|union minister/i.test(l.role);
}
function isMLA(l: Leader): boolean {
  return /^mla\b|member of legislative assembly/i.test(l.role);
}

/** "H.D. Kumaraswamy" → "HK"; titles like Dr./Smt. and "(Ganiga)"-style
 *  bracketed aliases are skipped. */
function initials(name: string): string {
  const words = name
    .replace(/\([^)]*\)/g, " ")
    .replace(/[.,]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !/^(dr|smt|shri|sri|mr|mrs|ms|prof|ias|ips)$/i.test(w));
  if (words.length === 0) return "?";
  const first = words[0][0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** One row: round badge · role · value. `badge` null = a dashed "?" (name not published). */
function Row({ badge, role, children }: { badge: React.ReactNode | null; role: string; children: React.ReactNode }) {
  return (
    <li className="ftp-ovl-row">
      <span className="ftp-ovl-badge" data-empty={badge === null ? "true" : undefined} aria-hidden>
        {badge ?? "?"}
      </span>
      <span className="ftp-ovl-role">{role}</span>
      <span className="ftp-ovl-value">{children}</span>
    </li>
  );
}

/** Honest placeholder text (italic, secondary colour). */
function Pending({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "var(--ftp-text-2)", fontStyle: "italic" }}>{children}</span>;
}

export default function LeadersSnippet({
  district, state, base,
}: {
  district: string; state: string; base: string;
}) {
  const { data } = useQuery<ApiResponse>({
    queryKey: ["district", district, "leaders", "snippet"],
    queryFn: () => fetch(`/api/data/leaders?district=${district}&state=${state}`).then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  const t = useTranslations("page_snippets.leaders");
  const leaders = data?.data ?? [];
  if (leaders.length === 0) return null;

  // Mumbai has two Collectors (City, Suburban); Pune two Commissioners of Police.
  const collectors = leaders.filter(isCollector);
  const collector = collectors[0];
  const sp = leaders.find(isSP);
  const cps = leaders.filter(isCP);
  const cp = cps[0];
  // Some districts have several MPs (Pune: 4); list them all.
  const mps = leaders.filter(isMP);
  const inCharge = leaders.find((l) => isInChargeMinisterRole(l.role));
  const mlas = leaders.filter(isMLA);
  // The MLA for the district headquarters seat is named, not only counted.
  const hqMla = mlas.find((l) => isHeadquartersMla(l, district));
  const partyTally = mlas.reduce<Record<string, number>>((acc, l) => {
    const k = l.party ?? t("other");
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const partyLine = Object.entries(partyTally)
    .sort((a, b) => b[1] - a[1])
    .map(([p, n]) => `${p}: ${n}`)
    .join(", ");

  // Bureaucrat names that are placeholders (e.g. "[Verify at mandya.nic.in]")
  // render in italic grey so users see the action item, not a fake person.
  const named = (l: Leader | undefined): l is Leader => Boolean(l && !l.name.startsWith("["));
  const renderName = (l: Leader | undefined, pending: string, others = 0) => {
    if (!named(l)) return <Pending>{pending}</Pending>;
    return (
      <>
        <span lang="en" style={{ fontWeight: 600 }}>{l.name}</span>
        {others > 0 && <span style={{ fontSize: 12, color: "var(--ftp-text-2)" }}> {t("more", { n: others })}</span>}
      </>
    );
  };
  const mp = mps[0];

  return (
    <OverviewCard
      hue="indigo"
      mark={<LeadersMark size={36} />}
      title={t("title")}
      ariaLabel={t("aria")}
      href={`${base}/leadership`}
      linkText={t("viewAll")}
    >
      <ul className="ftp-ovl-list">
        <Row badge={named(collector) ? initials(collector.name) : null} role={t("collector")}>
          {renderName(collector, t("collectorPending"), collectors.length - 1)}
        </Row>
        {/* A district SP and a city Police Commissioner are different posts:
            each shows under its own label (Mysuru and Pune have both). */}
        {(sp || !cp) && (
          <Row badge={named(sp) ? initials(sp.name) : null} role={t("sp")}>
            {renderName(sp, t("spPending"))}
          </Row>
        )}
        {cp && (
          <Row badge={named(cp) ? initials(cp.name) : null} role={t("cp")}>
            {renderName(cp, t("spPending"), cps.length - 1)}
          </Row>
        )}
        {named(inCharge) && (
          <Row badge={initials(inCharge.name)} role={t("inCharge")}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span lang="en" style={{ fontWeight: 600 }}>{inCharge.name}</span>
              {inCharge.party && (
                <span className="ftp-ovl-party">
                  <span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", background: getPartyColor(inCharge.party).text }} />
                  {inCharge.party}
                </span>
              )}
            </span>
          </Row>
        )}
        <Row badge={named(mp) ? initials(mp.name) : null} role={mps.length > 1 ? t("mps") : t("mp")}>
          {named(mp) ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span lang="en" style={{ fontWeight: 600 }}>{mp.name}</span>
              {mp.party && (
                <span className="ftp-ovl-party">
                  {/* Party colour as a small dot only (design rule: no tinted boxes). */}
                  <span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", background: getPartyColor(mp.party).text }} />
                  {mp.party}
                </span>
              )}
              {mps.length > 1 && <span style={{ fontSize: 12, color: "var(--ftp-text-2)" }}>{t("more", { n: mps.length - 1 })}</span>}
            </span>
          ) : (
            <Pending>{t("notRecorded")}</Pending>
          )}
        </Row>
        {named(hqMla) && (
          <Row badge={initials(hqMla.name)} role={t("hqMla")}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span lang="en" style={{ fontWeight: 600 }}>{hqMla.name}</span>
              {hqMla.party && (
                <span className="ftp-ovl-party">
                  <span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", background: getPartyColor(hqMla.party).text }} />
                  {hqMla.party}
                </span>
              )}
            </span>
          </Row>
        )}
        <Row badge={mlas.length > 0 ? <Vote size={15} /> : null} role={t("mlas")}>
          {mlas.length > 0 ? (
            <>
              {/* "14 listed": the MLAs we hold, not the district's number of seats. */}
              <span className="ftp-num" style={{ fontSize: 15 }}>{t("mlasListed", { n: mlas.length })}</span>
              {partyLine && <span style={{ color: "var(--ftp-text-2)" }}> ({partyLine})</span>}
            </>
          ) : (
            <Pending>{t("notRecorded")}</Pending>
          )}
        </Row>
      </ul>
    </OverviewCard>
  );
}
