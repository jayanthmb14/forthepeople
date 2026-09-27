/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import Sidebar from "@/components/layout/Sidebar";
import DistrictStatusBar from "@/components/layout/DistrictStatusBar";
import { MobileBreadcrumbStrip } from "@/components/district/MobileBreadcrumbStrip";
import { MobileDistrictChrome } from "@/components/district/MobileDistrictChrome";
import FeedbackFloatingButton from "@/components/common/FeedbackFloatingButton";
import { getDistrict, getState } from "@/lib/constants/districts";

type Params = Promise<{ locale: string; state: string; district: string }>;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { state: stateSlug, district: districtSlug } = await params;
  const stateData = getState(stateSlug);
  const districtData = getDistrict(stateSlug, districtSlug);

  if (!districtData || !stateData) return {};

  const title = `${districtData.name} District — Government Data Dashboard`;
  const description = `Live government data for ${districtData.name} district, ${stateData.name}${districtData.tagline ? ` — ${districtData.tagline}` : ""}. Crop prices, water levels, schemes, budget, and more.`;

  const canonicalUrl = `${BASE_URL}/en/${stateSlug}/${districtSlug}`;
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalUrl,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function DistrictLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const { locale, state: stateSlug, district: districtSlug } = await params;

  // 404 for non-existent districts
  const stateData = getState(stateSlug);
  const districtData = getDistrict(stateSlug, districtSlug);
  if (!districtData) notFound();

  // JSON-LD structured data
  const districtUrl = `${BASE_URL}/en/${stateSlug}/${districtSlug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GovernmentOrganization",
    "name": `${districtData!.name} District Administration`,
    "description": `Government data dashboard for ${districtData!.name} district${stateData ? `, ${stateData.name}` : ""}`,
    "url": districtUrl,
    "areaServed": {
      "@type": "AdministrativeArea",
      "name": districtData!.name,
      "containedInPlace": stateData ? { "@type": "State", "name": stateData.name } : undefined,
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL },
      { "@type": "ListItem", "position": 2, "name": stateData?.name ?? "Karnataka", "item": `${BASE_URL}/en/${stateSlug}` },
      { "@type": "ListItem", "position": 3, "name": districtData!.name, "item": districtUrl },
    ],
  };

  return (
    <>
      <Script
        id="district-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Mobile-only chrome: the 44 px module bar under the header
          ("current module · All modules") plus the bottom sheet that lists
          the 5 module groups. It also listens for the
          'ftp:open-modules-drawer' window event dispatched by HeaderBar's
          mobile menu. Hidden on desktop (the left rail takes over). */}
      <MobileDistrictChrome
        locale={locale}
        stateSlug={stateSlug}
        districtSlug={districtSlug}
        districtName={districtData!.name}
      />
      {/* 32 px status strip: district · state · date · time · data
          freshness (from /api/data/freshness). Tells people WHEN the
          numbers below were last updated. */}
      <DistrictStatusBar
        districtSlug={districtSlug}
        stateSlug={stateSlug}
        districtName={districtData!.name}
        stateName={stateData?.name ?? ""}
      />
      {/* Mobile-only breadcrumb strip — desktop has its breadcrumb inside
          HeaderBar (hidden on mobile). CSS in mobile.css hides this strip
          on viewport ≥ 768px. */}
      <MobileBreadcrumbStrip locale={locale} />

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          minHeight: "calc(100vh - 56px - 32px - 28px)", // viewport - header - status bar - disclaimer
        }}
      >
        {/* Sidebar — desktop only */}
        <Sidebar locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />

        {/* Main content */}
        <main
          style={{ flex: 1, minWidth: 0, background: "var(--ftp-bg)" }}
          role="main"
          aria-label={`${districtData!.name} district data`}
        >
          {children}
        </main>
      </div>

      {/* Floating feedback button — bottom-right on all district pages */}
      <FeedbackFloatingButton stateSlug={stateSlug} districtSlug={districtSlug} />
    </>
  );
}
