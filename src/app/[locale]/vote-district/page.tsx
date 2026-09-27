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
 * pre-select a district.
 */

import type { Metadata } from "next";
import VoteDistrictPage from "@/components/vote-district/VoteDistrictPage";
import { getPlatformFacts } from "@/lib/platform-facts";

// The "N districts waiting" count comes from the registry, never typed by hand.
const { comingDistricts } = getPlatformFacts();

export const metadata: Metadata = {
  title: "Vote for the next district — ForThePeople.in",
  description: `${comingDistricts} districts waiting. Your vote prioritises which goes live next on India's free district transparency platform.`,
};

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ d?: string }>;
}

export default async function Page({ params, searchParams }: Props) {
  const { locale } = await params;
  const { d } = await searchParams;
  return <VoteDistrictPage locale={locale} preselected={d ?? null} />;
}
