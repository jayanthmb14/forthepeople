/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// /[locale]/compare — the server shell: translated metadata, then the
// interactive comparison (CompareClient, which reads ?a=, ?b= and ?module=).

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { languageAlternates } from "@/i18n/seo";
import CompareClient from "./CompareClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page_compare" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: languageAlternates("/compare", locale),
  };
}

export default async function ComparePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CompareClient locale={locale} />;
}
