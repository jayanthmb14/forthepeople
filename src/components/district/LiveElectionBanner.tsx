/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  LiveElectionBanner — overview-page notice of an election in this state
// ═══════════════════════════════════════════════════════════════════════
//  Shows only when the district's state has an ElectionEvent with polling
//  in the next 30 days; otherwise renders nothing, so quiet states stay
//  calm. A tinted card in the Elections hue: 🗳️ chip, the election's name
//  and polling date(s), a "N days to go" pill in the last two weeks, the
//  results date, and a link to the Elections page (countdown, calendar,
//  how to vote).
//
//  Text: "page_elections" namespace (`banner.*`); dates via useFormat().
//  The election label is reference data and is shown as stored.
"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import type { ElectionEvent } from "@/components/district/ElectionSection";
import { Card, Pill } from "@/components/district/ui";
import { useFormat } from "@/i18n/client";
import { hueClass } from "@/lib/design/hues";

function daysFromToday(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.round((t - Date.now()) / 86_400_000);
}

export default function LiveElectionBanner({
  stateSlug,
  leadershipHref,
}: {
  stateSlug: string;
  /** The district's leadership page; the banner links to the Elections page beside it. */
  leadershipHref: string;
}) {
  const t = useTranslations("page_elections");
  const f = useFormat();
  const { data } = useQuery<{ data: ElectionEvent[] }>({
    queryKey: ["elections", stateSlug],
    queryFn: () => fetch(`/api/data/election-events?state=${stateSlug}`).then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  const events = data?.data ?? [];
  const live = events.find((e) => {
    const d = daysFromToday(e.pollingDate);
    return d != null && d >= 0 && d <= 30 && e.state === stateSlug;
  });
  if (!live || !live.pollingDate) return null;

  const href = leadershipHref.replace(/\/leadership\/?$/, "/elections");
  const days = daysFromToday(live.pollingDate)!;
  const day = (iso: string) => f.date(iso, { day: "numeric", month: "short" });
  const phases =
    live.pollingPhases && live.pollingPhases.length > 1
      ? live.pollingPhases.map((p) => t("banner.phase", { n: p.phase, date: day(p.date) })).join(", ")
      : t("banner.pollingOn", { date: day(live.pollingDate) });

  return (
    <div className={hueClass("elections")}>
      <Card href={href} tinted padding={14}>
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 40, height: 40, fontSize: 20, borderRadius: 12 }}>
            🗳️
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span className="ftp-title" style={{ fontWeight: 650 }}>
                {live.label}
              </span>
              {days <= 14 && <Pill tone="danger">{days === 0 ? t("banner.today") : t("banner.daysLeft", { n: days })}</Pill>}
            </span>
            <span className="ftp-num" style={{ display: "block", fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>
              {phases}
            </span>
            <span style={{ display: "block", fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
              {live.resultDate ? t("banner.results", { date: day(live.resultDate) }) : t("banner.more")}
            </span>
          </span>
          <ChevronRight size={18} aria-hidden style={{ color: "var(--hue)", flexShrink: 0 }} />
        </span>
      </Card>
    </div>
  );
}
