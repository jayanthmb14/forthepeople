/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════════════════
//  NationalSupporters — "Supported across India by …", one calm line
// ═══════════════════════════════════════════════════════════════════════
//
//   Supported across India by  [★ Micah Alex · Founding Builder]  [Asha · All-India Patron]
//
//  The support page promises the Founding Builder "your name first, on
//  every page" and All-India Patrons a place on every district page. This
//  line keeps that promise on any page it is placed on: it lists everyone
//  with All-India visibility (Founding Builder first, soft gold), and
//  renders NOTHING while loading or when there is nobody — never a
//  "be the first" advert.
//
//  Data: /api/data/contributors?type=top-tier (tier founder/patron OR a
//  gift of ₹9,999 and up; cached 2 min on the server).
//
//  Where it is mounted: /support, /contributors and /prices (this group);
//  the district layout and the home page should mount it too, low on the
//  page (see the v5 support-prices report).

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import SupporterChip from "./SupporterChip";
import { isFoundingBuilder, placeSupporters, type PlacedSupporter } from "./placement";

interface TopSupporter extends PlacedSupporter {
  socialLink: string | null;
  socialPlatform: string | null;
}

export default function NationalSupporters({ style }: { style?: React.CSSProperties }) {
  const t = useTranslations("page_support");
  const [list, setList] = useState<TopSupporter[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Plain fetch: some pages that mount this line sit outside the React
    // Query provider.
    fetch("/api/data/contributors?type=top-tier&limit=12")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { contributors?: TopSupporter[] } | null) => {
        if (!cancelled) setList(Array.isArray(d?.contributors) ? d.contributors : []);
      })
      .catch(() => {
        if (!cancelled) setList([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!list) return null;
  const row = placeSupporters(list).india;
  if (row.named.length === 0) return null;

  return (
    <section
      aria-label={t("national_title")}
      style={{ display: "flex", alignItems: "center", gap: "6px 12px", flexWrap: "wrap", ...style }}
    >
      <span style={{ fontSize: 13, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text-2)" }}>{t("national_title")}</span>
      <ul style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: 0, padding: 0 }}>
        {row.named.map((s) => {
          const founder = isFoundingBuilder(s);
          return (
            <SupporterChip
              key={s.id}
              s={s}
              founder={founder}
              tag={founder ? t("banner_founder") : t("banner_patron")}
              profileLabel={t("wallProfile", { name: s.name })}
            />
          );
        })}
      </ul>
    </section>
  );
}
