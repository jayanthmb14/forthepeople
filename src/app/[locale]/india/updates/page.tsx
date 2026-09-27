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
import { ArrowLeft } from "lucide-react";
import IndiaUpdateLog from "@/components/india/IndiaUpdateLog";
import { INDIA_DESIGN } from "@/lib/india/india-design";
import { hueClass } from "@/lib/design/hues";

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
      // Design v4: the update log's module hue (slate), same as the
      // district update-log page, so the kit chip and filter colours match.
      className={hueClass("update-log")}
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
        {/* Design v4: the page's group chip (emoji + sentence case), as in
            the kit PageHeader, instead of a tracked-out uppercase eyebrow. */}
        <div
          style={{
            marginTop: 16,
            display: "flex",
            width: "fit-content",
            alignItems: "center",
            gap: 6,
            padding: "3px 10px 3px 6px",
            borderRadius: 999,
            background: "var(--hue-tint)",
            color: "var(--hue-deep)",
            fontSize: 12,
            lineHeight: "18px",
            fontWeight: 600,
          }}
        >
          <span className="ftp-emoji" aria-hidden="true" style={{ fontSize: 14 }}>
            🕒
          </span>
          Update log
        </div>
        <h1
          style={{
            fontSize: 32,
            lineHeight: "38px",
            fontWeight: 700,
            color: INDIA_DESIGN.textPrimary,
            letterSpacing: "-0.02em",
            margin: "10px 0 6px",
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
          updates to any indicator on the India dashboard. Each row shows what
          changed, where the value came from, and when. Filter by category
          to focus on a single area.
        </p>
      </header>

      <IndiaUpdateLog />
    </main>
  );
}
