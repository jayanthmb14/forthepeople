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
 */

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { localizeRows } from "@/lib/translation/overlay";
import { EmptyState, Section } from "@/components/district/ui";
import { CategoryGlyph } from "@/components/graphics";
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
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
            gap: 12,
          }}
        >
          {items.map((n) => {
            const lang = (n as { lang?: string }).lang;
            return (
              <li key={n.id}>
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ftp-card-link"
                  style={{
                    display: "flex",
                    gap: 12,
                    height: "100%",
                    background: "var(--ftp-surface)",
                    border: "1px solid var(--ftp-border)",
                    borderRadius: "var(--ftp-radius-card)",
                    boxShadow: "var(--ftp-shadow-1)",
                    padding: "14px 16px",
                    textDecoration: "none",
                    color: "var(--ftp-text)",
                  }}
                >
                  <CategoryGlyph glyph="general" size={32} chip />
                  <span style={{ minWidth: 0 }}>
                    <span lang={lang} style={{ display: "block", fontSize: 14, fontWeight: 500, lineHeight: 1.45, marginBottom: 4 }}>
                      {n.title}
                    </span>
                    <span style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12, color: "var(--ftp-text-2)" }}>
                      <span>{n.district?.name ?? t("news.india")}</span>
                      <span>{n.publisher ?? n.source}</span>
                      <span className="ftp-num">{fmtDate(locale, n.publishedAt, { day: "numeric", month: "short" })}</span>
                    </span>
                    <span className="sr-only">{tn("opensOriginal")}</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
