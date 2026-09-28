/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  PoliceStaffing — "Police posts: filled or empty?" on the police page
// ═══════════════════════════════════════════════════════════════════════
//  Same data and rules as StaffingSection (the "exams" module response
//  carries a `staffing` array; rows for module "police" only),
//  drawn with kit pieces and fully translated (page_police → staff*):
//    • ten police officers, the filled share lit;
//    • one bar per role (most posts first), empty posts in the danger
//      colour as text when more than 30 % are vacant;
//    • the data date and the official source link.
//  Renders nothing while loading or when there are no rows, so the page
//  never shows a fake zero.
"use client";

import type React from "react";
import { useTranslations } from "next-intl";
import { useDistrictData } from "@/hooks/useDistrictData";
import { useFormat } from "@/i18n/client";
import { Section, Card, ProgressBar, AsOfText, SourcePill } from "@/components/district/ui";
import { UserCheck } from "lucide-react";
import { IconPictogram } from "@/components/district/calm-parts";

interface StaffingRecord {
  id: string;
  module: string;
  department: string;
  roleName: string;
  sanctionedPosts: number;
  workingStrength: number;
  vacantPosts: number;
  asOfDate: string;
  sourceUrl: string | null;
}

/** Most roles shown as bars; the rest are in the total. */
const MAX_ROLES = 6;

const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

export default function PoliceStaffing({ district, state }: { district: string; state: string }) {
  const t = useTranslations("page_police");
  const f = useFormat();
  const { data, isLoading } = useDistrictData<{ staffing?: StaffingRecord[] }>("exams", district, state);
  const rows = (data?.data?.staffing ?? []).filter((s) => s.module === "police" && s.sanctionedPosts > 0);
  if (isLoading || rows.length === 0) return null;

  const sanctioned = rows.reduce((s, r) => s + r.sanctionedPosts, 0);
  const working = rows.reduce((s, r) => s + r.workingStrength, 0);
  const vacant = Math.max(0, sanctioned - working);
  const share = sanctioned > 0 ? working / sanctioned : 0;
  const asOf = rows.map((r) => r.asOfDate).sort().reverse()[0];
  const sourceUrl = rows.find((r) => r.sourceUrl)?.sourceUrl ?? null;
  const roles = [...rows].sort((a, b) => b.sanctionedPosts - a.sanctionedPosts).slice(0, MAX_ROLES);
  const num = (n: number) => f.number(n);

  return (
    <Section title={t("staffTitle")}>
      <Card padding={18}>
        <div className="ftp-picture-row">
          <div style={{ minWidth: 0 }}>
            <p className="ftp-prose" style={{ margin: "0 0 14px", fontSize: 15, lineHeight: 1.6 }}>
              {t.rich("staffExplain", { working: num(working), sanctioned: num(sanctioned), vacant: num(vacant), b: bold })}
            </p>
            <IconPictogram filled={share * 10} icon={UserCheck} label={t("staffPicto", { n: num(Math.round(share * 10)) })} />
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
            {roles.map((r) => {
              const pct = (r.workingStrength / r.sanctionedPosts) * 100;
              const short = 100 - pct > 30;
              return (
                <li key={r.id} style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", fontSize: 13, lineHeight: "20px" }}>
                    <span lang="en" style={{ fontWeight: 600, color: "var(--ftp-text)", minWidth: 0, overflowWrap: "anywhere" }}>
                      {r.roleName}
                    </span>
                    <span className="ftp-num" style={{ color: short ? "var(--ftp-warn)" : "var(--hue-deep)" }}>
                      {t("staffRole", { working: num(r.workingStrength), sanctioned: num(r.sanctionedPosts) })}
                    </span>
                  </div>
                  <ProgressBar pct={pct} tone={short ? "warn" : "brand"} height={8} />
                </li>
              );
            })}
          </ul>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          <AsOfText asOf={asOf} />
          {sourceUrl && <SourcePill label={t("staffSource")} href={sourceUrl} />}
        </div>
      </Card>
    </Section>
  );
}
