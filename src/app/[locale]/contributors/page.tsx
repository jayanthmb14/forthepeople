/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { languageAlternates } from "@/i18n/seo";
import GlobalContributorsClient from "./GlobalContributorsClient";

// Session 14 v8.1 Phase G (Fix #11): the Session 12 ContributorsHero
// was a second hero rendered above GlobalContributorsClient — it
// duplicated the existing in-page "The People Behind the Platform"
// heading. ContributorsHero.tsx was removed in the Sept 2026 dead-code
// sweep (commit 96e2eb7); git history is the rollback if it is ever needed.

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page_contributors" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: languageAlternates("/contributors", locale),
  };
}

export default async function GlobalContributorsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <GlobalContributorsClient locale={locale} />;
}
