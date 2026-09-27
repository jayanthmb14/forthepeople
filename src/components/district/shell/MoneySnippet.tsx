/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// MoneySnippet — the "Budget" summary card on the district overview (v5.1).
//
//   [gold coins]  Budget                                    View all →
//   For FY 2024-25   [Old year]
//   ( 82 % ring )   Given  ₹2,239 crore
//                   Spent  ₹1,830 crore
//   82% of the money given has been spent
//   This is FY 2024-25. We could not find a newer budget.
//
// The newest financial year only. Painted in the gold accent (money), the
// share spent as a ring that draws in once. An old year says so twice —
// a chip by the year and a plain sentence — and an estimated spend says
// it is an estimate. Renders nothing without a budget for the district.
"use client";

import { useTranslations } from "next-intl";
import { useBudget } from "@/hooks/useRealtimeData";
import { useFreshness } from "@/hooks/useFreshness";
import { useMoney } from "@/components/money/useMoney";
import { useModuleText } from "@/i18n/client";
import { CountUp } from "@/components/district/ui";
import OverviewCard from "./OverviewCard";
import { MoneyMark } from "./overview-art";

function GoldRing({ pct, size = 76 }: { pct: number; size?: number }) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden focusable="false">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ov-gold-tint)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="color-mix(in srgb, var(--ov-gold-pop) 60%, transparent)" strokeWidth={1} />
      <circle
        className="ftp-draw-path"
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--ov-gold)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - p / 100)}
        style={{ ["--len" as string]: c }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export default function MoneySnippet({ district, state, base }: { district: string; state: string; base: string }) {
  const to = useTranslations("page_overview");
  const td = useTranslations("page_district-shell");
  const mt = useModuleText();
  const money = useMoney();
  const fresh = useFreshness(state, district);
  const { data: budgetData } = useBudget(district, state);

  const all = budgetData?.data?.entries ?? [];
  const fy = all.length > 0 ? all[0].fiscalYear : null;
  const rows = fy ? all.filter((e) => e.fiscalYear === fy) : [];
  const allocated = rows.reduce((s, e) => s + e.allocated, 0);
  const spent = rows.reduce((s, e) => s + e.spent, 0);
  if (!fy || allocated <= 0) return null;

  const share = spent / allocated;
  const estimated = rows.some((e) => /estimat/i.test(e.source ?? ""));
  const late = fresh.primary("finance")?.status === "late";

  return (
    <OverviewCard
      hue="finance"
      tone="gold"
      mark={<MoneyMark size={36} />}
      title={mt.label("finance")}
      ariaLabel={to("v5.money.aria")}
      href={`${base}/finance`}
      linkText={to("v5.money.viewAll")}
    >
      <p className="ftp-ovm-fy">
        {to("v5.money.fy", { fy })}
        {late && <span className="ftp-tile-flag" data-tone="warn">{td("tiles.oldYear")}</span>}
        {!late && estimated && <span className="ftp-tile-flag" data-tone="neutral">{td("tiles.estimateFlag")}</span>}
      </p>

      <div className="ftp-ovm-body">
        {spent > 0 && (
          <span className="ftp-ovm-ring" role="img" aria-label={to("v5.money.share", { pct: money.pct(share) })}>
            <GoldRing pct={share * 100} />
            <span className="ftp-ovm-ring-num">{money.pct(share)}</span>
          </span>
        )}
        <dl className="ftp-ovm-figs">
          <div>
            <dt className="ftp-label">{to("v5.money.given")}</dt>
            <dd className="ftp-ovm-amount"><CountUp value={money.short(allocated, 0)} /></dd>
          </div>
          <div>
            <dt className="ftp-label">{to("v5.money.spent")}</dt>
            <dd className="ftp-ovm-amount" data-muted={spent > 0 ? undefined : "true"}>
              {spent > 0 ? <CountUp value={money.short(spent, 0)} /> : "—"}
            </dd>
          </div>
        </dl>
      </div>

      <p className="ftp-ovm-line">{spent > 0 ? to("v5.money.share", { pct: money.pct(share) }) : to("v5.money.noSpend")}</p>
      {(late || estimated) && (
        <p className="ftp-ov-note">
          {late ? to("v5.money.old", { fy }) : ""}
          {late && estimated ? " " : ""}
          {estimated ? to("v5.money.estimate") : ""}
        </p>
      )}
    </OverviewCard>
  );
}
