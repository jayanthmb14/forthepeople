/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getState, getDistrict } from "@/lib/constants/districts";
import { scriptLang } from "@/lib/utils/script-lang";
import ContributorsClient from "./ContributorsClient";

interface Props {
  params: Promise<{ locale: string; state: string; district: string }>;
}

/** The district name in the page language when the registry has it, else English. */
function localName(locale: string, d: { name: string; nameLocal?: string } | undefined, fallback: string): string {
  if (d?.nameLocal && scriptLang(d.nameLocal) === locale) return d.nameLocal;
  return d?.name ?? fallback;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, state, district } = await params;
  const t = await getTranslations({ locale, namespace: "page_contributors" });
  const name = localName(locale, getDistrict(state, district), district);
  return {
    title: t("metaTitle", { name }),
    description: t("metaDescription", { name }),
  };
}

export default async function ContributorsPage({ params }: Props) {
  const { locale, state, district } = await params;
  setRequestLocale(locale);
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
