/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import QueryProvider from "@/components/providers/QueryProvider";
import MigrationBanner from "@/components/layout/MigrationBanner";
import PageProgressBar from "@/components/common/PageProgressBar";

// Session 11.1 — chrome swapped to redesign-v2 site-wide.
// Legacy components (Header.tsx 938 LOC, Footer.tsx 144 LOC,
// DisclaimerBar.tsx 73 LOC) remain on disk for rollback. Some
// district-page-specific behavior of the legacy Header (lock state,
// state/district jump, MobileSidebar wiring) is intentionally simpler
// in HeaderBar — see component header comment for the deferred list.
import DisclaimerBanner from "@/components/home/redesign-v2/DisclaimerBanner";
import HeaderBar from "@/components/home/redesign-v2/HeaderBar";
import Footer from "@/components/home/redesign-v2/Footer";

/**
 * Only the locales in src/i18n/routing.ts may render this layout.
 *
 * Before this check, ANY first path segment matched `[locale]` — so
 * `/random-xyz.json` or `/hi` quietly rendered the English homepage with a
 * 200 status ("soft 404"). Search engines index those as duplicate pages and
 * uptime monitors can never see a real error. Unknown locales now fall
 * through to the root not-found page with a proper 404.
 */
function isSupportedLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}

/**
 * Tell Next.js the complete list of valid `[locale]` values and refuse
 * anything else (`dynamicParams = false`). This returns a 404 for
 * `/random-xyz.json` BEFORE the homepage's database query runs — the
 * `notFound()` guard below is the belt, this is the braces.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
export const dynamicParams = false;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  return (
    <QueryProvider>
      <PageProgressBar />
      <MigrationBanner />
      <DisclaimerBanner />
      <HeaderBar locale={locale} />
      {children}
      <Footer locale={locale} />
    </QueryProvider>
  );
}
