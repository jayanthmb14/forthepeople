/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * /[locale]/india/updates — Public Update Log.
 *
 * Transparency page showing every IndiaIndicator update with source +
 * as-of date + relative time. Builds trust. Linked from the main india
 * page footer. Phase U scaffold (file 31 + Sessions B+D extension).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import IndiaUpdateLog from "@/components/india/IndiaUpdateLog";
import { INDIA_DESIGN } from "@/lib/india/india-design";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

export const revalidate = 300; // 5 min — update-log is more dynamic than the main page

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const url = `${BASE_URL}/${locale}/india/updates`;
  return {
    title: "Update Log · India · ForThePeople.in",
    description:
      "Every value update on /[locale]/india with its source citation and " +
      "reporting date. Independent transparency log.",
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en/india/updates`,
        kn: `${BASE_URL}/kn/india/updates`,
      },
    },
    openGraph: { url, title: "India Update Log · ForThePeople.in" },
    robots: { index: true, follow: true },
  };
}

export default async function IndiaUpdatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main
      role="main"
      style={{
        background: INDIA_DESIGN.bgPage,
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          padding: "24px 16px 16px",
          maxWidth: 880,
          margin: "0 auto",
        }}
      >
        <Link
          href={`/${locale}/india`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: INDIA_DESIGN.textMuted,
            textDecoration: "none",
            marginLeft: -8,
            padding: "6px 8px",
            minHeight: 44,
            borderRadius: 6,
          }}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to India dashboard
        </Link>
        <div
          style={{
            fontSize: 11,
            lineHeight: "16px",
            fontWeight: 500,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: INDIA_DESIGN.textFaint,
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {/* Design v3: Lucide icon instead of the clock emoji */}
          <Clock size={14} aria-hidden="true" />
          Update Log
        </div>
        <h1
          style={{
            fontSize: 28,
            lineHeight: "32px",
            fontWeight: 600, // v3: 600 only on the page's single H1
            color: INDIA_DESIGN.textPrimary,
            letterSpacing: "-0.01em",
            margin: "4px 0 6px",
            fontFamily: INDIA_DESIGN.fontDisplay,
          }}
        >
          Every change, with its source.
        </h1>
        <p
          style={{
            fontSize: 14,
            color: INDIA_DESIGN.textMuted,
            margin: 0,
            lineHeight: 1.55,
            maxWidth: 620,
          }}
        >
          The most recent {/* TODO_RESEARCH: word "100" inline once feed is live */}
          updates to any indicator on /[locale]/india. Each row shows what
          changed, where the value came from, and when. Filter by category
          to focus on a single area.
        </p>
      </header>

      <IndiaUpdateLog />
    </main>
  );
}
