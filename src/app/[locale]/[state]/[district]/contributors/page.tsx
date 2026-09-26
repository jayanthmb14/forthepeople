/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import type { Metadata } from "next";
import { getState, getDistrict } from "@/lib/constants/districts";
import ContributorsClient from "./ContributorsClient";

interface Props {
  params: Promise<{ locale: string; state: string; district: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, district } = await params;
  const d = getDistrict(state, district);
  return {
    title: `Contributors — ${d?.name ?? district} | ForThePeople.in`,
    description: `People who support ${d?.name ?? district}'s open data dashboard on ForThePeople.in`,
  };
}

export default async function ContributorsPage({ params }: Props) {
  const { locale, state, district } = await params;
  const stateData = getState(state);
  const districtData = getDistrict(state, district);

  return (
    <ContributorsClient
      locale={locale}
      stateSlug={state}
      districtSlug={district}
      districtName={districtData?.name ?? district}
      stateName={stateData?.name ?? state}
      population={districtData?.population ?? null}
    />
  );
}
