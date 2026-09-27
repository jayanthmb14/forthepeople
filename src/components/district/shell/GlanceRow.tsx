/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  GlanceRow — the district's key facts as small chips, on every page
// ═══════════════════════════════════════════════════════════════════════
//
//   [Collector  Jitendra Dudi] [MP  S. Barne] [People  94.3 lakh (Census 2011)]
//   [Projects  14 being built] [Budget  ₹19,943 Cr (FY 2026-27)]
//   [Next election  Lok Sabha, about May 2029] [⚠ 2 warnings now]
//
//  • Each chip is label · value (with its date or year) and links to its
//    module. A chip with nothing honest to show is left out: no Collector
//    name → no chip; the report card only while it has not expired; the
//    warnings chip only when a warning is active.
//  • `compact` (module pages): one row that scrolls sideways.
//    Full (overview): wraps on wider screens, scrolls on phones.
//  • One small request: /api/data/glance (cached 10 min).
//  • No emoji: each chip has a small Lucide icon in its module's hue.
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, BadgeCheck, ClipboardCheck, HardHat, Landmark, PiggyBank, Users, Vote } from "lucide-react";
import { hueClass } from "@/lib/design/hues";
import { useDistrictName, useFormat } from "@/i18n/client";
import { useMoney } from "@/components/money/useMoney";
import type { GlanceData } from "./glance-types";

interface Chip {
  key: string;
  module: string;
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "warn" | "danger";
}

export default function GlanceRow({
  stateSlug,
  districtSlug,
  compact = false,
}: {
  stateSlug: string;
  districtSlug: string;
  compact?: boolean;
}) {
  const t = useTranslations("page_shell");
  const locale = useLocale();
  const f = useFormat();
  const money = useMoney();
  const districtName = useDistrictName(stateSlug, districtSlug);
  const { data, isLoading } = useQuery<GlanceData>({
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

  const chips: Chip[] = [];
  if (data) {
    if (data.alerts.active > 0) {
      const serious = data.alerts.topSeverity === "critical" || data.alerts.topSeverity === "high" || data.alerts.topSeverity === "severe";
      chips.push({
        key: "alerts",
        module: "alerts",
        icon: AlertTriangle,
        label: "",
        value: t("glance.alerts", { n: data.alerts.active }),
        tone: serious ? "danger" : "warn",
      });
    }
    if (data.collector) {
      const role = data.collector.role;
      const label = /deputy commissioner/i.test(role)
        ? t("glance.dc")
        : /district magistrate/i.test(role) && !/collector/i.test(role)
          ? t("glance.dm")
          : t("glance.collector");
      chips.push({ key: "collector", module: "leadership", icon: Landmark, label, value: data.collector.name });
    }
    if (data.mp) {
      // Several Lok Sabha seats cover some districts: show all names for
      // two, the count for more — never one MP as if they were the only one.
      const many = (data.mp.count ?? 1) > 1;
      chips.push({
        key: "mp",
        module: "leadership",
        icon: BadgeCheck,
        label: many ? t("glance.mps") : t("glance.mp"),
        value: !many ? data.mp.name : data.mp.count === 2 ? data.mp.names.join(", ") : t("glance.mpsCount", { n: data.mp.count }),
      });
    }
    if (data.population) {
      const n = people(data.population.value);
      chips.push({
        key: "people",
        module: "population",
        icon: Users,
        label: t("glance.people"),
        value: data.population.dataset
          ? t("glance.peopleCensus", { n, dataset: data.population.dataset })
          : t("glance.peopleEstimate", { n }),
      });
    }
    if (data.projects && data.projects.active > 0) {
      chips.push({
        key: "projects",
        module: "infrastructure",
        icon: HardHat,
        label: t("glance.projects"),
        value: t("glance.projectsActive", { n: data.projects.active }),
      });
    }
    if (data.budget) {
      chips.push({
        key: "budget",
        module: "finance",
        icon: PiggyBank,
        label: t("glance.budget"),
        value: t("glance.budgetValue", { amount: money.short(data.budget.allocated, 0), fy: t("glance.fy", { fy: data.budget.fiscalYear }) }),
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
      chips.push({
        key: "election",
        module: "elections",
        icon: Vote,
        label: t("glance.nextVote"),
        value: data.election.approximate ? t("glance.voteAbout", { type, date }) : t("glance.voteDate", { type, date }),
      });
    }
    if (data.grade) {
      chips.push({
        key: "grade",
        module: "overview",
        icon: ClipboardCheck,
        label: t("glance.grade"),
        value: t("glance.gradeValue", { grade: data.grade.grade, date: monthYear(data.grade.generatedAt) }),
      });
    }
  }

  if (!isLoading && chips.length === 0) return null;

  return (
    <nav className="ftp-glance" data-compact={compact ? "true" : undefined} aria-label={t("glance.aria", { district: districtName })}>
      {isLoading ? (
        <ul className="ftp-glance-list" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="ftp-glance-skeleton ftp-skeleton" />
          ))}
          <li className="sr-only">{t("glance.loading")}</li>
        </ul>
      ) : (
        <ul className="ftp-glance-list">
          {chips.map((c) => {
            const Icon = c.icon;
            const href = c.key === "grade" ? `${base}#health-score` : c.module === "overview" ? base : `${base}/${c.module}`;
            return (
              <li key={c.key} className={hueClass(c.module)}>
                <Link href={href} className="ftp-glance-chip" data-tone={c.tone}>
                  <span className="ftp-glance-icon" aria-hidden>
                    <Icon size={14} />
                  </span>
                  <span className="ftp-glance-text">
                    {c.label && <span className="ftp-glance-label">{c.label}</span>}
                    <span className="ftp-glance-value">{c.value}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
