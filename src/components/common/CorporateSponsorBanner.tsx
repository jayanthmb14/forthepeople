/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════
//  CorporateSponsorBanner — "Sponsor this district" invitation for
//  businesses (shown on the contributors page). Design v3: a plain kit
//  Card with a title, one sentence and two quiet contact buttons
//  (email + Instagram). No gradient, no dashed border, no emoji.
// ═══════════════════════════════════════════════════════════

import { AtSign, Building2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, ToolbarButton } from "@/components/district/ui";
import { useFormat } from "@/i18n/client";

interface Props {
  districtName: string;
  population?: number | null;
}

export default function CorporateSponsorBanner({ districtName, population }: Props) {
  const t = useTranslations("sponsorBanner");
  const f = useFormat();
  // "18.1 lakh people" / "1.2 crore people" / "every citizen".
  const popText =
    !population || population <= 0
      ? t("everyone")
      : population >= 10_000_000
        ? t("peopleCrore", { n: f.number(population / 10_000_000, { maximumFractionDigits: 1 }) })
        : population >= 100_000
          ? t("peopleLakh", { n: f.number(population / 100_000, { maximumFractionDigits: 1 }) })
          : t("peopleExact", { n: f.number(population) });
  return (
    <Card as="section" padding={20} aria-labelledby="ftp-corporate-sponsor" style={{ marginBottom: 24 }}>
      <p className="ftp-label" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <Building2 size={14} aria-hidden />
        {t("kicker")}
      </p>

      <h2 id="ftp-corporate-sponsor" className="ftp-title" style={{ marginBottom: 4 }}>
        {t("title", { name: districtName })}
      </h2>
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 14 }}>
        {t.rich("body", { people: popText, b: (c) => <span style={{ color: "var(--ftp-text)", fontWeight: 500 }}>{c}</span> })}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <ToolbarButton icon={Mail} href="mailto:support@forthepeople.in?subject=Corporate%20Sponsorship%20Enquiry">
          support@forthepeople.in
        </ToolbarButton>
        <ToolbarButton icon={AtSign} href="https://www.instagram.com/forthepeople_in/" external>
          forthepeople_in
        </ToolbarButton>
      </div>

      <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: 0 }}>
        {t("note")}
        <br />
        {t("pricing")}
      </p>
    </Card>
  );
}
