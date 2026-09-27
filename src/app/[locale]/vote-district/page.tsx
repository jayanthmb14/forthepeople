/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Session 12 v7 — /vote-district route.
 *
 * Lists all locked (not-yet-live) districts with search / state filter / sort.
 * Vote button increments the existing DistrictRequest counter via
 * /api/district-request POST.
 *
 * The header search autocomplete deep-links here with `?d=<slug>` to
 * pre-select a district. Metadata is translated ("page_vote").
 */

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import VoteDistrictPage from "@/components/vote-district/VoteDistrictPage";
import { getPlatformFacts } from "@/lib/platform-facts";
import { intlLocale } from "@/i18n/languages";
import { languageAlternates } from "@/i18n/seo";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ d?: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page_vote" });
  // The "N districts waiting" count comes from the registry, never typed by hand.
  const { comingDistricts } = getPlatformFacts();
  return {
    title: t("metaTitle"),
    description: t("metaDescription", { n: new Intl.NumberFormat(intlLocale(locale)).format(comingDistricts) }),
    alternates: languageAlternates("/vote-district", locale),
  };
}

export default async function Page({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { d } = await searchParams;
  return <VoteDistrictPage locale={locale} preselected={d ?? null} />;
}
