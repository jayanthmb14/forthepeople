/**
 * ForThePeople.in — Compact leadership snippet for the district overview.
 *
 * Shows the four key positions citizens look for first:
 *   Collector  (T3 District Collector / Deputy Commissioner)
 *   SP         (T3 Superintendent of Police / Commissioner of Police)
 *   MP         (T4 row whose role mentions MP / Member of Parliament)
 *   MLAs       (count + per-party tally for T4 rows whose role starts MLA)
 *
 * Renders nothing if the district has zero leaders, so empty districts
 * don't show a hollow shell. Links to /leadership for the full hierarchy.
 *
 * Design v3: a kit Card with a title row; each position is one 44 px row
 * (Lucide icon · role label · name). Party colour appears only as a 6 px dot.
 */

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Landmark, Shield, Users, Vote } from "lucide-react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import type { Leader } from "@/hooks/useRealtimeData";
import { getPartyColor } from "@/lib/constants/party-colors";
import { Card } from "@/components/district/ui";

interface ApiResponse { data: Leader[]; meta?: unknown }

function isCollector(l: Leader): boolean {
  return /^(district collector|deputy commissioner)\b/i.test(l.role);
}
function isSP(l: Leader): boolean {
  return /^(superintendent of police|commissioner of police)\b/i.test(l.role);
}
function isMP(l: Leader): boolean {
  return /\bmp\b|member of parliament|union minister/i.test(l.role);
}
function isMLA(l: Leader): boolean {
  return /^mla\b|member of legislative assembly/i.test(l.role);
}

/** One labelled row: icon · role · value. */
function Row({ icon: Icon, role, children }: { icon: LucideIcon; role: string; children: React.ReactNode }) {
  return (
    <li style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 36, fontSize: 13, lineHeight: "20px" }}>
      <Icon size={14} aria-hidden style={{ color: "var(--ftp-text-2)", flexShrink: 0 }} />
      <span style={{ color: "var(--ftp-text-2)", width: 72, flexShrink: 0 }}>{role}</span>
      <span style={{ minWidth: 0, flex: 1, color: "var(--ftp-text)" }}>{children}</span>
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

  const collector = leaders.find(isCollector);
  const sp = leaders.find(isSP);
  // Some districts have several MPs (Pune: 4); list them all.
  const mps = leaders.filter(isMP);
  const mlas = leaders.filter(isMLA);
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
  const renderName = (l: Leader | undefined, pending: string) => {
    if (!l || l.name.startsWith("[")) return <Pending>{pending}</Pending>;
    return <span lang="en" style={{ fontWeight: 500 }}>{l.name}</span>;
  };

  return (
    <Card as="section" aria-label={t("aria")} className="ftp-hue-indigo" tinted>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="ftp-icon-chip" aria-hidden style={{ width: 32, height: 32, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--hue-deep)" }}><Users size={16} /></span>
          <h3 className="ftp-title" style={{ fontSize: 16, fontWeight: 650, color: "var(--hue-deep)" }}>{t("title")}</h3>
        </span>
        <Link href={`${base}/leadership`} style={{ fontSize: 13, fontWeight: 600, color: "var(--hue-deep)", textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}>
          {t("viewAll")}
        </Link>
      </div>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        <Row icon={Landmark} role={t("collector")}>{renderName(collector, t("collectorPending"))}</Row>
        <Row icon={Shield} role={t("sp")}>{renderName(sp, t("spPending"))}</Row>
        <Row icon={BadgeCheck} role={mps.length > 1 ? t("mps") : t("mp")}>
          {mps.length > 0 ? (() => { const mp = mps[0]; return (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span lang="en" style={{ fontWeight: 500 }}>{mp.name}</span>
              {mp.party && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--ftp-text-2)" }}>
                  {/* Party colour as a 6 px dot only (design rule: no tinted boxes). */}
                  <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: getPartyColor(mp.party).text }} />
                  {mp.party}
                </span>
              )}
              {mps.length > 1 && <span style={{ fontSize: 12, color: "var(--ftp-text-2)" }}>{t("more", { n: mps.length - 1 })}</span>}
            </span>
          ); })() : (
            <Pending>{t("notRecorded")}</Pending>
          )}
        </Row>
        <Row icon={Vote} role={t("mlas")}>
          {mlas.length > 0 ? (
            <>
              <span className="ftp-num">{mlas.length}</span>
              {partyLine && <span style={{ color: "var(--ftp-text-2)" }}> ({partyLine})</span>}
            </>
          ) : (
            <Pending>{t("notRecorded")}</Pending>
          )}
        </Row>
      </ul>
    </Card>
  );
}
