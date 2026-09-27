/**
 * ForThePeople.in — Compact tenders snippet for the district overview.
 *
 * Shown only where tenders are really tracked for the district (v5):
 *   LIVE   — "Tracking": open tenders, closing soon, next deadline
 *   STALE  — "Update pending": the same numbers, plainly marked
 * LOCKED (not switched on for this district) and NO_DATA render nothing —
 * the old "Locked / coming soon" card is gone; the sidebar, drawer and
 * topic index mark the module "coming soon" instead.
 *
 * "Updated …" uses the kit FreshnessPill, so it never claims to be live
 * unless the last check really was under 30 minutes ago. All text comes
 * from page_overview.tenders (en / hi / kn).
 */

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import { Card, FreshnessPill, Pill } from "@/components/district/ui";
import { useFormat, useModuleText } from "@/i18n/client";

type Status = "LIVE" | "STALE" | "LOCKED" | "NO_DATA";

interface StatsResponse {
  districtName: string;
  tendersActive: boolean;
  snippetStatus: Status;
  lastCheckedAt: string | null;
  nextDeadline: { id: string; title: string; bidSubmissionEnd: string; daysLeft: number } | null;
  closing48hCount: number;
  closing7dCount: number;
  live: { count: number };
}

export default function TenderSnippet({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  locale, state, district, base,
}: {
  locale: string; state: string; district: string; base: string;
}) {
  const t = useTranslations("page_overview");
  const mt = useModuleText();
  const f = useFormat();
  const { data } = useQuery<StatsResponse>({
    queryKey: ["district", district, "tenders", "snippet"],
    queryFn: () => fetch(`/api/tenders/${district}/stats`).then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  if (!data) return null;
  const status = data.snippetStatus;
  if (status !== "LIVE" && status !== "STALE") return null;

  return (
    <Card as="section" aria-label={t("tenders.aria")} className="ftp-hue-indigo" tinted>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 32, height: 32, fontSize: 17, borderRadius: 10 }}>📑</span>
          <h3 className="ftp-title" style={{ fontSize: 16, fontWeight: 650, color: "var(--hue-deep)" }}>{mt.label("tenders")}</h3>
          <Pill tone={status === "LIVE" ? "live" : "warn"}>{status === "LIVE" ? t("tenders.tracking") : t("tenders.pending")}</Pill>
        </span>
        <Link href={`${base}/tenders`} style={{ fontSize: 13, fontWeight: 600, color: "var(--hue-deep)", textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", flexShrink: 0 }}>
          {t("tenders.viewAll")}
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <span className="ftp-num" style={{ fontSize: 22, lineHeight: "28px", color: "var(--ftp-text)" }}>
          {f.number(data.live.count)}
        </span>
        <span style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>{t("tenders.open", { n: data.live.count })}</span>
        {data.closing48hCount > 0 && (
          <span style={{ fontSize: 13, color: "var(--ftp-danger)" }}>
            · {t("tenders.closing", { n: f.number(data.closing48hCount) })}
          </span>
        )}
      </div>

      {data.nextDeadline && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", marginBottom: 8 }}>
          <Clock size={12} aria-hidden style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {t("tenders.next", { title: data.nextDeadline.title })}
          </span>
          <span className="ftp-num" style={{ color: data.nextDeadline.daysLeft <= 2 ? "var(--ftp-danger)" : "var(--ftp-text)", flexShrink: 0 }}>
            {data.nextDeadline.daysLeft === 0 ? t("tenders.today") : t("tenders.days", { n: data.nextDeadline.daysLeft })}
          </span>
        </div>
      )}

      {data.lastCheckedAt ? (
        <FreshnessPill asOf={data.lastCheckedAt} thresholdHours={24} />
      ) : (
        <span style={{ fontSize: 11, color: "var(--ftp-text-2)" }}>{t("tenders.notChecked")}</span>
      )}
    </Card>
  );
}
