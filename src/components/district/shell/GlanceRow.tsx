/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  GlanceRow — the district's key numbers as colourful tiles (overview only)
// ═══════════════════════════════════════════════════════════════════════
//
//   ┌ ⚠ Warnings now ┐┌ People ─────┐┌ Projects ───┐┌ Budget given ┐┌ Next election ┐┌ MP ─────────┐
//   │ 2              ││ 18.1 lakh   ││ 22          ││ ₹2,239 crore ││ Assembly      ││ H.D. Kuma…  │
//   │ Heavy rain …   ││ Census 2011 ││ of 24 …     ││ FY 2024-25 Old││ about May 2028││ JD(S)       │
//   └────────────────┘└─────────────┘└─────────────┘└──────────────┘└───────────────┘└─────────────┘
//
//  • v5.1: overview only (on a module page the tiles read as that page's
//    own numbers). Each tile wears its module's hue: a pastel wash, a small
//    drawn picture (overview-art.tsx) or icon, the number in the deep hue
//    (counting up once), and a line that says where the number is from.
//  • A tile with nothing honest to show is left out. An old budget year
//    says "Old year"; an estimate says so; warnings only while active; the
//    report card only while it has not expired.
//  • Phone: 2 tiles per row. Tablet and up: as many as fit (≥ 170 px,
//    150 px on wide PCs). A row that is not full stretches its tiles, so
//    no empty cell is ever left.
//  • One small request: /api/data/glance (cached 10 min).
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, BadgeCheck, ClipboardCheck, ShieldCheck } from "lucide-react";
import { hueClass } from "@/lib/design/hues";
import { useDistrictName, useFormat } from "@/i18n/client";
import { useMoney } from "@/components/money/useMoney";
import { useFreshness } from "@/hooks/useFreshness";
import { CountUp } from "@/components/district/ui";
import { ElectionMark, MoneyMark, PeopleMark, ProjectsMark } from "./overview-art";
import type { GlanceData } from "./glance-types";
import { useVerification } from "./useVerification";
import { isPastFiscalYear } from "./fiscal";

interface Tile {
  key: string;
  module: string;
  /** Dataset key (src/lib/freshness.ts) for the double-check mark. */
  dataset?: string;
  /** The tile's picture (overview-art.tsx) or icon, in its module's hue. */
  art: React.ReactNode;
  label: string;
  value: string;
  /** Count the value up once (numbers only). */
  count?: boolean;
  sub?: string;
  flag?: { text: string; tone: "warn" | "neutral" };
  tone?: "warn" | "danger";
  href: string;
}

function IconArt({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon size={22} strokeWidth={2} aria-hidden />;
}

/** Whole months between now and a future date (rounded). */
function monthsUntil(iso: string, now: number): number {
  return Math.max(0, Math.round((new Date(iso).getTime() - now) / (30.44 * 86_400_000)));
}

export default function GlanceRow({ stateSlug, districtSlug }: { stateSlug: string; districtSlug: string }) {
  const t = useTranslations("page_shell");
  const td = useTranslations("page_district-shell");
  const locale = useLocale();
  const f = useFormat();
  const money = useMoney();
  const fresh = useFreshness(stateSlug, districtSlug);
  const districtName = useDistrictName(stateSlug, districtSlug);
  const verification = useVerification(stateSlug, districtSlug);
  const { data, isLoading, dataUpdatedAt } = useQuery<GlanceData>({
    queryKey: ["glance", stateSlug, districtSlug],
    queryFn: async () => {
      const res = await fetch(
        `/api/data/glance?district=${encodeURIComponent(districtSlug)}&state=${encodeURIComponent(stateSlug)}`,
      );
      if (!res.ok) throw new Error(`glance ${res.status}`);
      return res.json();
    },
    staleTime: 10 * 60_000,
  });

  const base = `/${locale}/${stateSlug}/${districtSlug}`;
  const one = (n: number) => f.number(n, { maximumFractionDigits: 1 });
  const people = (n: number) => (n >= 1e7 ? t("glance.crore", { n: f.number(n / 1e7, { maximumFractionDigits: 2 }) }) : t("glance.lakh", { n: one(n / 1e5) }));
  const monthYear = (iso: string) => f.date(iso, { month: "short", year: "numeric" });
  // "Census 2011" comes from the database in English; say it in the page language.
  const datasetName = (ds: string) => {
    const m = /^census\s+(?:of\s+india\s+)?(\d{4})$/i.exec(ds.trim());
    return m ? td("tiles.census", { year: m[1] }) : ds;
  };
  const countdown = (iso: string) => {
    const now = dataUpdatedAt || new Date(data?.checkedAt ?? 0).getTime();
    const days = Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 86_400_000));
    if (days < 60) return td("tiles.inDays", { n: days });
    const months = monthsUntil(iso, now);
    return months < 24 ? td("tiles.inMonths", { n: months }) : td("tiles.inYears", { n: Math.round(months / 12) });
  };

  const tiles: Tile[] = [];
  if (data) {
    if (data.alerts.active > 0) {
      const serious = ["critical", "high", "severe"].includes(data.alerts.topSeverity ?? "");
      tiles.push({
        key: "alerts",
        module: "alerts",
        art: <IconArt icon={AlertTriangle} />,
        label: td("tiles.alerts"),
        value: f.number(data.alerts.active),
        count: true,
        sub: data.alerts.topTitle ?? undefined,
        tone: serious ? "danger" : "warn",
        href: `${base}/alerts`,
      });
    }
    if (data.population) {
      tiles.push({
        key: "people",
        dataset: "census",
        module: "population",
        art: <PeopleMark size={34} />,
        label: t("glance.people"),
        value: people(data.population.value),
        count: true,
        sub: data.population.dataset ? datasetName(data.population.dataset) : td("tiles.estimate"),
        flag: data.population.dataset ? undefined : { text: td("tiles.estimateFlag"), tone: "neutral" },
        href: `${base}/population`,
      });
    }
    if (data.projects && data.projects.active > 0) {
      tiles.push({
        key: "projects",
        dataset: "projects",
        module: "infrastructure",
        art: <ProjectsMark size={34} />,
        label: td("tiles.projects"),
        value: f.number(data.projects.active),
        count: true,
        sub: td("tiles.projectsSub", { total: data.projects.total }),
        href: `${base}/infrastructure`,
      });
    }
    if (data.budget) {
      const late =
        fresh.primary("finance")?.status === "late" ||
        isPastFiscalYear(data.budget.fiscalYear, dataUpdatedAt || new Date(data.checkedAt).getTime());
      tiles.push({
        key: "budget",
        dataset: "budget",
        module: "finance",
        art: <MoneyMark size={34} />,
        label: td("tiles.budget"),
        value: money.short(data.budget.allocated, 0),
        count: true,
        sub: t("glance.fy", { fy: data.budget.fiscalYear }),
        flag: late
          ? { text: td("tiles.oldYear"), tone: "warn" }
          : data.budget.estimate
            ? { text: td("tiles.estimateFlag"), tone: "neutral" }
            : undefined,
        href: `${base}/finance`,
      });
    }
    if (data.election) {
      const type =
        data.election.type === "LOK_SABHA"
          ? t("glance.lokSabha")
          : data.election.type === "STATE_ASSEMBLY"
            ? t("glance.assembly")
            : t("glance.localBody");
      const date = monthYear(data.election.date);
      tiles.push({
        key: "election",
        dataset: "elections",
        module: "elections",
        art: <ElectionMark size={34} />,
        label: t("glance.nextVote"),
        value: type,
        sub: `${data.election.approximate ? td("tiles.about", { date }) : date} · ${countdown(data.election.date)}`,
        href: `${base}/elections`,
      });
    }
    if (data.grade) {
      tiles.push({
        key: "grade",
        module: "overview",
        art: <IconArt icon={ClipboardCheck} />,
        label: t("glance.grade"),
        value: data.grade.grade,
        sub: td("tiles.gradeSub", { score: f.number(data.grade.score, { maximumFractionDigits: 1 }), date: monthYear(data.grade.generatedAt) }),
        href: `${base}#health-score`,
      });
    }
    if (data.mp) {
      // Several Lok Sabha seats cover some districts: show all names for
      // two, the count for more — never one MP as if they were the only one.
      const many = (data.mp.count ?? 1) > 1;
      tiles.push({
        key: "mp",
        dataset: "leaders",
        module: "leadership",
        art: <IconArt icon={BadgeCheck} />,
        label: many ? t("glance.mps") : t("glance.mp"),
        value: !many ? data.mp.name : data.mp.count === 2 ? data.mp.names.join(", ") : t("glance.mpsCount", { n: data.mp.count }),
        sub: !many ? (data.mp.party ?? undefined) : undefined,
        href: `${base}/leadership`,
      });
    }
  }

  if (!isLoading && tiles.length === 0) return null;

  return (
    <nav className="ftp-tiles" aria-label={t("glance.aria", { district: districtName })}>
      {isLoading ? (
        <ul className="ftp-tiles-list" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="ftp-tile-skeleton ftp-skeleton" />
          ))}
          <li className="sr-only">{t("glance.loading")}</li>
        </ul>
      ) : (
        <ul className="ftp-tiles-list">
          {tiles.map((c, i) => (
            <li
              key={c.key}
              className={`${hueClass(c.module)} ftp-rise`}
              style={{ ["--i" as string]: i }}
            >
              <Link href={c.href} className="ftp-tile" data-key={c.key} data-tone={c.tone}>
                <span className="ftp-tile-art" aria-hidden>
                  {c.art}
                </span>
                <span className="ftp-tile-label">{c.label}</span>
                <span className="ftp-tile-value" data-kind={c.count ? "num" : "text"}>
                  {c.count ? <CountUp value={c.value} /> : c.value}
                </span>
                {(() => {
                  // v5.1: a small mark when a second source was compared.
                  const v = c.dataset && verification ? verification[c.dataset] : undefined;
                  if (!v || (v.status !== "verified" && v.status !== "disagreement")) return null;
                  const Icon = v.status === "verified" ? ShieldCheck : AlertTriangle;
                  return (
                    <span className="ftp-tile-check" data-status={v.status} title={td(`verify.chip.${v.status}`)}>
                      <Icon size={13} aria-hidden />
                      <span className="sr-only">{td(`verify.chip.${v.status}`)}</span>
                    </span>
                  );
                })()}
                {(c.sub || c.flag) && (
                  <span className="ftp-tile-sub">
                    {c.sub && <span className="ftp-tile-sub-text">{c.sub}</span>}
                    {c.flag && (
                      <span className="ftp-tile-flag" data-tone={c.flag.tone}>
                        {c.flag.text}
                      </span>
                    )}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
