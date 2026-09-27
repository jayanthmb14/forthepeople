/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════════════════
//  DistrictSponsorBanner — "Supported by", low on the district overview
// ═══════════════════════════════════════════════════════════════════════
//
//   Supported by                                            See all
//   All India   [★ Micah Alex · Founding Builder] [Asha · All-India Patron]
//   Karnataka   [Ravi]
//   Mandya      [Preethaam] [+3 more]  and 2 people who chose not to show their name
//   ─────────────────────────────────────────────────────────────────
//   Support Mandya: ₹99 a month
//   Or all of Karnataka for ₹999 a month, or all of India for ₹9,999 a month.
//
//  v5 (Sept 2026):
//  • Placement is by tier or amount (placement.ts), the same rule the API
//    uses — not "monthly subscribers only". The old filter hid the one
//    Founding Builder (a one-time gift), so every district said "All India —
//    Be the first" although the support page promises the founder "first
//    place everywhere". The Founding Builder is now listed first, in a soft
//    gold chip.
//  • Rows with nobody are not drawn; there is one quiet invitation at the
//    bottom instead of three "Be the first" links.
//  • The same name twice on a row is shown once; anonymous supporters are
//    counted, not listed.
//  • Every word comes from "page_support" (banner_* keys) in en/hi/kn.
//
//  Data: /api/data/contributors?district=&state= (the same request and
//  React Query key as before; SupportCheckout invalidates it after a payment).
//  Prices come from TIER_CONFIG, never typed by hand.

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { HandHeart } from "lucide-react";
import { TIER_CONFIG } from "@/lib/constants/razorpay-plans";
import { Card } from "@/components/district/ui";
import { useDistrictName, useFormat, usePlaceText } from "@/i18n/client";
import SupporterChip from "@/components/support/SupporterChip";
import { isFoundingBuilder, placeSupporters, type PlacedRow } from "@/components/support/placement";

interface Sponsor {
  id: string;
  name: string;
  tier: string;
  amount: number | null;
  badgeType: string | null;
  badgeLevel: string | null;
  socialLink: string | null;
  socialPlatform: string | null;
  districtName: string | null;
  stateName: string | null;
  monthsActive: number;
  message: string | null;
  isRecurring: boolean;
}

interface DistrictSponsorBannerProps {
  district: string;
  state: string;
  stateName?: string;
  districtName?: string;
  locale?: string;
}

/** How many names to show per row before "+N more". */
const MAX_PER_ROW = 8;

function Row({
  label,
  row,
  viewAllHref,
  tagFor,
}: {
  label: string;
  row: PlacedRow<Sponsor>;
  viewAllHref: string;
  tagFor?: (s: Sponsor) => { tag?: string; founder?: boolean };
}) {
  const t = useTranslations("page_support");
  const { number } = useFormat();
  if (row.named.length === 0 && row.anonymous === 0) return null;
  const shown = row.named.slice(0, MAX_PER_ROW);
  const more = row.named.length - shown.length;
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "4px 12px", flexWrap: "wrap", padding: "8px 0" }}>
      <span style={{ width: 120, flexShrink: 0, fontSize: 13, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text-2)" }}>{label}</span>
      <ul style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, flex: "1 1 240px", minWidth: 0, margin: 0, padding: 0 }}>
        {shown.map((s) => {
          const extra = tagFor?.(s) ?? {};
          return <SupporterChip key={s.id} s={s} tag={extra.tag} founder={extra.founder} profileLabel={t("wallProfile", { name: s.name })} />;
        })}
        {more > 0 && (
          <li style={{ listStyle: "none" }}>
            <Link href={viewAllHref} style={{ fontSize: 13, color: "var(--ftp-brand)", textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}>
              {t("banner_more", { n: number(more) })}
            </Link>
          </li>
        )}
        {row.anonymous > 0 && (
          <li style={{ listStyle: "none", fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
            {row.named.length > 0 ? t("banner_anonAnd", { n: row.anonymous }) : t("banner_anon", { n: row.anonymous })}
          </li>
        )}
      </ul>
    </div>
  );
}

export default function DistrictSponsorBanner({
  district,
  state,
  stateName,
  districtName,
  locale = "en",
}: DistrictSponsorBannerProps) {
  const t = useTranslations("page_support");
  const { number } = useFormat();
  const inr = (n: number) => `₹${number(n)}`;
  const { data } = useQuery<{ contributors: Sponsor[] }>({
    queryKey: ["district-sponsors", district, state],
    queryFn: () =>
      fetch(`/api/data/contributors?district=${district}&state=${state}&limit=120`).then((r) => r.json()),
    staleTime: 30_000,
    refetchInterval: 120_000,
  });

  const place = usePlaceText();
  const rows = placeSupporters(data?.contributors ?? []);
  const total = rows.india.named.length + rows.india.anonymous + rows.state.named.length + rows.state.anonymous + rows.district.named.length + rows.district.anonymous;

  // Names in the reader's language: "मंड्या का साथ दें", "ಮಂಡ್ಯ ಜಿಲ್ಲೆಗೆ ಬೆಂಬಲ ನೀಡಿ"
  // (English "Mandya" inside a Hindi/Kannada sentence: Sept 2026 audit).
  const dName = useDistrictName(state, district, districtName);
  const sName = place.state(state, stateName ?? state);
  const viewAllHref = `/${locale}/${state}/${district}/contributors`;
  const supportHref = `/${locale}/support?tier=district&state=${state}&district=${district}`;

  const indiaTag = (s: Sponsor) =>
    isFoundingBuilder(s) ? { tag: t("banner_founder"), founder: true } : { tag: t("banner_patron") };

  return (
    <Card as="section" aria-labelledby="ftp-backed-by" className="ftp-supported-by-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <h2 id="ftp-backed-by" className="ftp-title" style={{ fontWeight: 600 }}>{t("banner_title")}</h2>
        {total > 0 && (
          <Link href={viewAllHref} style={{ fontSize: 13, color: "var(--ftp-brand)", textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}>
            {t("banner_seeAll")}
          </Link>
        )}
      </div>

      {data && total === 0 && (
        <p style={{ margin: "4px 0 0", fontSize: 14, lineHeight: 1.5, color: "var(--ftp-text-2)" }}>{t("banner_none", { district: dName })}</p>
      )}
      <Row label={t("banner_india")} row={rows.india} viewAllHref={viewAllHref} tagFor={indiaTag} />
      <Row label={sName} row={rows.state} viewAllHref={viewAllHref} />
      <Row label={dName} row={rows.district} viewAllHref={viewAllHref} />

      {/* One quiet invitation — a link, not a banner. */}
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--ftp-border)" }}>
        <Link
          href={supportHref}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 14, fontWeight: 600, color: "var(--ftp-brand)", textDecoration: "none" }}
        >
          <HandHeart size={16} aria-hidden />
          {t("banner_cta", { district: dName, amount: inr(TIER_CONFIG.district.amount) })}
        </Link>
        <p style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)" }}>
          {t("banner_ctaOr", { state: sName, stateAmount: inr(TIER_CONFIG.state.amount), indiaAmount: inr(TIER_CONFIG.patron.amount) })}
        </p>
      </div>
    </Card>
  );
}
