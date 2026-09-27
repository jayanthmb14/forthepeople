/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// /[locale]/contribute — translated metadata here (the page itself is a
// client component and cannot export any).
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { languageAlternates } from "@/i18n/seo";

export { default } from "../../contribute/page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page_contribute" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: languageAlternates("/contribute", locale),
  };
}
