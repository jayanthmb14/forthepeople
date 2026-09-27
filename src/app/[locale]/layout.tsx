/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { getLanguage } from "@/i18n/languages";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import QueryProvider from "@/components/providers/QueryProvider";
import MigrationBanner from "@/components/layout/MigrationBanner";
import PageProgressBar from "@/components/common/PageProgressBar";

// Site-wide chrome — Design v5.1 "Warm Calm" (2026-09-27).
// HeaderBar renders the disclaimer line, the 56 px sticky header and the
// status strip under it. The GitHub star count is fetched here on the
// server (cached for an hour) so no visitor's browser ever calls
// api.github.com; the header and the footer both show it.
// ReportButton is the floating "Report a problem" button on every page.
import HeaderBar from "@/components/home/HeaderBar";
import { getGithubStars } from "@/components/home/github-stars";
import Footer from "@/components/home/Footer";
import SkipLink from "@/components/common/SkipLink";
import ReportButton from "@/components/common/ReportButton";

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
  // Static rendering: tell next-intl the locale instead of reading headers.
  setRequestLocale(locale);

  const [githubStars, messages] = await Promise.all([getGithubStars(), getMessages({ locale })]);
  const lang = getLanguage(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Kolkata">
      {/* lang + dir for everything rendered in this language (screen
          readers, hyphenation, the :lang() font rules in globals.css,
          right-to-left scripts). The inline script also updates <html>. */}
      <div lang={locale} dir={lang.dir} className="ftp-locale-root">
        <SkipLink />
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.lang=${JSON.stringify(locale)};document.documentElement.dir=${JSON.stringify(lang.dir)};`,
          }}
        />
        <QueryProvider>
          <PageProgressBar />
          <MigrationBanner />
          <HeaderBar locale={locale} githubStars={githubStars} />
          {children}
          <Footer locale={locale} />
          <ReportButton />
        </QueryProvider>
      </div>
    </NextIntlClientProvider>
  );
}
