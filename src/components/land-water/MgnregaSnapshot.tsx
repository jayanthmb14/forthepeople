/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  The district's MGNREGA figures on the village-council page
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: the NREGA collector's checked snapshot (/api/data/panchayats →
//  `snapshot`, written by /api/cron/scrape-mgnrega from the MGNREGA "At a
//  glance" page). Shows the newest financial year only, with the page's
//  own "as on" date and a link to the page.
//
//  Counts the source prints in lakh (two decimals, so rounded to 1,000)
//  go through lakhDisplay(): "0.00 lakh" reads "fewer than 1,000", never
//  "0". A figure the source left blank is left out, never shown as 0.
//  Money is whole rupees (lakh / crore through the page's money()).
//  Every word comes from page_gram-panchayat → mgnrega.*.
"use client";

import type React from "react";
import { useTranslations } from "next-intl";
import { Briefcase, CalendarDays, Home, Wallet } from "lucide-react";
import { Card, Section, StatStrip, StatTile } from "@/components/district/ui";
import { Explainer } from "@/components/district/visuals";
import { DetailList } from "@/components/district/DetailSheet";
import { useFormat } from "@/i18n/client";
import { countDisplay, lakhDisplay } from "@/lib/mgnrega-display";
import type { DistrictSnapshot } from "@/scraper/lib/district-snapshot";
import type { NregaSnapshotData } from "@/scraper/lib/nrega";

const bold = (chunks: React.ReactNode) => <strong className="ftp-num">{chunks}</strong>;

/** "2026-2027" → "2026-27". */
function shortFy(fy: string): string {
  const m = /^(\d{4})-(\d{2})(\d{2})$/.exec(fy);
  return m ? `${m[1]}-${m[3]}` : fy;
}

export default function MgnregaSnapshot({
  snapshot,
  districtName,
  money,
}: {
  snapshot: DistrictSnapshot<NregaSnapshotData>;
  districtName: string;
  /** Whole rupees → "₹12.3 lakh" / "₹1.2 crore" (from the page). */
  money: (rupees: number) => string;
}) {
  const t = useTranslations("page_gram-panchayat");
  const f = useFormat();
  const d = snapshot.data;
  const year = d.years[0] ?? null;
  const asOf = snapshot.asOf ?? d.asOf ?? null;
  const asOfText = asOf ? f.date(`${asOf}T12:00:00+05:30`, { day: "numeric", month: "long", year: "numeric" }) : null;
  const fy = year ? shortFy(year.fy) : null;

  /** A lakh count as text: "1.92 lakh", "fewer than 1,000", or null (left out). */
  const lakhText = (v: number | null | undefined): string | null => {
    const x = lakhDisplay(v);
    if (x.kind === "none") return null;
    if (x.kind === "fewer") return t("mgnrega.fewer");
    return t("mgnrega.lakhCount", { n: f.number(x.lakh, { maximumFractionDigits: 2 }) });
  };
  /** Same, split for a tile: value + unit. */
  const lakhTile = (v: number | null | undefined): { value: string; unit?: string } | null => {
    const x = lakhDisplay(v);
    if (x.kind === "none") return null;
    if (x.kind === "fewer") return { value: t("mgnrega.fewer") };
    return { value: f.number(x.lakh, { maximumFractionDigits: 2 }), unit: t("mgnrega.lakhUnit") };
  };
  const pctText = (v: number | null | undefined) =>
    v === null || v === undefined ? null : f.number(v / 100, { style: "percent", maximumFractionDigits: 1 });
  const countText = (v: number | null | undefined) => {
    const n = countDisplay(v);
    return n === null ? null : f.number(n);
  };

  const gps = countDisplay(d.gps);
  const blocks = countDisplay(d.blocks);
  const days = year ? lakhTile(year.persondaysLakh) : null;
  const families = year ? lakhTile(year.householdsWorkedLakh) : null;
  const daysText = year ? lakhText(year.persondaysLakh) : null;
  const spent = year?.totalExpenditureRupees ?? null;

  return (
    <Section title={t("mgnrega.title")}>
      <Explainer>
        {gps !== null && blocks !== null && (
          <>{t.rich("mgnrega.answerCouncils", { district: districtName, gps: f.number(gps), blocks: f.number(blocks), b: bold })} </>
        )}
        {fy && daysText
          ? t.rich("mgnrega.answerDays", { fy, days: daysText, b: bold })
          : t("mgnrega.answerNoYear")}
      </Explainer>

      <StatStrip>
        {gps !== null && <StatTile icon={Home} label={t("mgnrega.tileGps")} value={f.number(gps)} sub={blocks !== null ? t("mgnrega.tileGpsSub", { blocks: f.number(blocks) }) : undefined} asOf={snapshot.fetchedAt} />}
        {days && fy && (
          <StatTile icon={CalendarDays} label={t("mgnrega.tileDays")} value={days.value} unit={days.unit} sub={t("mgnrega.fy", { fy })} countUp={false} />
        )}
        {families && fy && (
          <StatTile icon={Briefcase} label={t("mgnrega.tileFamilies")} value={families.value} unit={families.unit} sub={t("mgnrega.fy", { fy })} countUp={false} />
        )}
        {spent !== null && fy && <StatTile icon={Wallet} label={t("mgnrega.tileSpent")} value={money(spent)} sub={t("mgnrega.fy", { fy })} countUp={false} />}
      </StatStrip>

      {year && (
        <Card padding={18} style={{ marginTop: 16 }}>
          <p className="ftp-display" style={{ margin: "0 0 10px", fontSize: 17, lineHeight: "22px", fontWeight: 650 }}>
            {t("mgnrega.moreTitle", { fy: fy ?? "" })}
          </p>
          <DetailList
            rows={[
              { label: t("mgnrega.rowIndividuals"), value: lakhText(year.individualsWorkedLakh) },
              { label: t("mgnrega.rowAvgDays"), value: year.avgDaysPerHousehold === null ? null : f.number(year.avgDaysPerHousehold, { maximumFractionDigits: 1 }) },
              { label: t("mgnrega.row100Days"), value: countText(year.households100Days) },
              { label: t("mgnrega.rowWage"), value: year.avgWagePerDayRupees === null ? null : t("mgnrega.rupees", { n: f.number(Math.round(year.avgWagePerDayRupees)) }) },
              { label: t("mgnrega.rowWomen"), value: pctText(year.womenPersondaysPct) },
              { label: t("mgnrega.rowPaidOnTime"), value: pctText(year.paymentsWithin15DaysPct) },
              { label: t("mgnrega.rowWages"), value: year.wagesRupees === null ? null : money(year.wagesRupees) },
              { label: t("mgnrega.rowCompleted"), value: countText(year.completedWorks) },
              { label: t("mgnrega.rowJobCards"), value: lakhText(d.jobCardsIssuedLakh) },
              { label: t("mgnrega.rowActiveWorkers"), value: lakhText(d.activeWorkersLakh) },
            ]}
          />
        </Card>
      )}

      <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
        {asOfText ? t("mgnrega.sourceAsOf", { date: asOfText }) : t("mgnrega.sourceNoDate")}{" "}
        <a href={snapshot.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--hue-deep)" }}>
          {t("mgnrega.openSource")}
        </a>
      </p>
    </Section>
  );
}
