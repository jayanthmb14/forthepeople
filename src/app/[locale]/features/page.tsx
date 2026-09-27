/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// /[locale]/features — the server shell: translated metadata, then the
// voting list and the share-an-idea form (FeaturesClient).

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { languageAlternates } from "@/i18n/seo";
import FeaturesClient from "./FeaturesClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page_features" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: languageAlternates("/features", locale),
  };
}

export default async function FeaturesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FeaturesClient />;
}
