/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import QueryProvider from "@/components/providers/QueryProvider";
import MigrationBanner from "@/components/layout/MigrationBanner";
import PageProgressBar from "@/components/common/PageProgressBar";

// Site-wide chrome — Design v3 "Civic Ledger" (2026-09-27).
// HeaderBar renders the 32 px disclaimer line and the 56 px sticky header.
// The GitHub star count is fetched here on the server (cached for an hour)
// so no visitor's browser ever calls api.github.com.
import HeaderBar from "@/components/home/HeaderBar";
import { getGithubStars } from "@/components/home/github-stars";
import Footer from "@/components/home/Footer";

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

  const githubStars = await getGithubStars();

  return (
    <QueryProvider>
      <PageProgressBar />
      <MigrationBanner />
      <HeaderBar locale={locale} githubStars={githubStars} />
      {children}
      <Footer locale={locale} />
    </QueryProvider>
  );
}
