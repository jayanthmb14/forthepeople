/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Module-specific news strip — up to 6 NewsItem rows whose title or
 * description matches any of the module's news keywords, newest first.
 * When nothing matches it says so (it no longer fills the strip with
 * unrelated district news, which read as if it were about this module).
 *
 * Server component (Prisma). Headlines are live data: they are shown in
 * the stored translation when one exists (localizeRows), otherwise in
 * English marked lang="en". Per file 31 §4: headline, one meta line and
 * the outbound link only.
 *
 * v5.6 (Sept 2026): the same quiet list as the district news page
 * (NewsList): one row per story, the headline on one line, then
 * "district · publisher · date" in small grey text; the row is the link.
 */

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { localizeRows } from "@/lib/translation/overlay";
import { EmptyState, Section } from "@/components/district/ui";
import NewsList from "@/components/news/NewsList";
import { fmtDate } from "../format";

interface Props {
  locale: string;
  newsKeywords: string[];
  moduleTitle: string;
}

export default async function ModuleNewsStrip({ locale, newsKeywords, moduleTitle }: Props) {
  const t = await getTranslations({ locale, namespace: "page_india-module" });
  const tn = await getTranslations({ locale, namespace: "moduleNews" });

  const orClauses = newsKeywords.flatMap((kw) => [
    { title: { contains: kw, mode: "insensitive" as const } },
    { description: { contains: kw, mode: "insensitive" as const } },
  ]);

  let items: Array<{
    id: string;
    title: string;
    url: string;
    publisher: string | null;
    source: string;
    publishedAt: Date;
    district: { name: string } | null;
  }> = [];

  try {
    const rows = await prisma.newsItem.findMany({
      where: { duplicateOf: null, OR: orClauses },
      orderBy: { publishedAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        url: true,
        publisher: true,
        source: true,
        publishedAt: true,
        district: { select: { name: true } },
      },
    });
    items = await localizeRows("news", rows, locale === "en" ? null : locale);
  } catch {
    items = [];
  }

  return (
    <Section title={t("news.title", { module: moduleTitle })}>
      {items.length === 0 ? (
        <EmptyState
          emoji="📰"
          title={t("news.emptyTitle", { module: moduleTitle })}
          body={t("news.emptyBody")}
        />
      ) : (
        <NewsList
          newTabLabel={tn("opensOriginal")}
          items={items.map((n) => ({
            id: n.id,
            headline: n.title,
            lang: (n as { lang?: string }).lang,
            href: n.url,
            meta: [
              n.district?.name ?? t("news.india"),
              n.publisher ?? n.source,
              <time key="when" dateTime={n.publishedAt.toISOString()}>
                {fmtDate(locale, n.publishedAt, { day: "numeric", month: "short" })}
              </time>,
            ],
          }))}
        />
      )}
    </Section>
  );
}
