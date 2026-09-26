/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Module-specific news strip — top 6 NewsItem rows whose title or
 * description matches any of the module.newsKeywords. Falls back to
 * top 6 newest district-tagged news if no keyword match exists.
 *
 * Server component (Prisma query). Per file 31 §4: headline +
 * 1-line meta + outbound source link only — no article paragraphs.
 */

import { prisma } from "@/lib/db";
import { INDIA_DESIGN } from "@/lib/india/india-design";

interface Props {
  newsKeywords: string[];
  moduleTitle: string;
}

export default async function ModuleNewsStrip({ newsKeywords, moduleTitle }: Props) {
  // Build OR clauses across all keywords against title + description
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
    district: { name: string; slug: string; state: { slug: string } } | null;
  }> = [];

  try {
    items = await prisma.newsItem.findMany({
      where: {
        duplicateOf: null,
        OR: orClauses,
      },
      orderBy: { publishedAt: "desc" },
      take: 6,
      include: {
        district: { select: { slug: true, name: true, state: { select: { slug: true } } } },
      },
    });

    // Fallback if zero matches — show 6 most recent district-tagged
    if (items.length === 0) {
      items = await prisma.newsItem.findMany({
        where: { duplicateOf: null, districtId: { not: null } },
        orderBy: { publishedAt: "desc" },
        take: 6,
        include: {
          district: { select: { slug: true, name: true, state: { select: { slug: true } } } },
        },
      });
    }
  } catch {
    items = [];
  }

  if (items.length === 0) {
    return (
      <section
        style={{
          padding: "28px 16px",
          background: INDIA_DESIGN.bgPage,
          borderBottom: `1px solid ${INDIA_DESIGN.border}`,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SectionLabel>News on {moduleTitle}</SectionLabel>
          <div
            style={{
              padding: "14px 16px",
              fontSize: 13,
              color: INDIA_DESIGN.textMuted,
              fontStyle: "italic",
              background: INDIA_DESIGN.bgCard,
              border: `1px dashed ${INDIA_DESIGN.border}`,
              borderRadius: 10,
            }}
          >
            No matching news yet. We&apos;re indexing district-tagged news;
            national news ingestion lands in a future session.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      style={{
        padding: "28px 16px",
        background: INDIA_DESIGN.bgPage,
        borderBottom: `1px solid ${INDIA_DESIGN.border}`,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionLabel>News on {moduleTitle}</SectionLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 10,
          }}
        >
          {items.map((n) => (
            <a
              key={n.id}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: INDIA_DESIGN.bgCard,
                border: `1px solid ${INDIA_DESIGN.border}`,
                borderRadius: 10,
                padding: "12px 14px",
                textDecoration: "none",
                color: INDIA_DESIGN.textPrimary,
                display: "block",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: 1.4,
                  marginBottom: 4,
                }}
              >
                {n.title}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: INDIA_DESIGN.textFaint,
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span>{n.district?.name ?? "India"}</span>
                <span>·</span>
                <span>{n.publisher ?? n.source}</span>
                <span>·</span>
                <span style={{ fontFamily: INDIA_DESIGN.fontMono }}>
                  {n.publishedAt.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: INDIA_DESIGN.textFaint,
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}
