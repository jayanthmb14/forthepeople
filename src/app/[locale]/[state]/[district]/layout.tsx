/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { getTranslations } from "next-intl/server";
import HueScope from "@/components/district/HueScope";
import Sidebar from "@/components/layout/Sidebar";
import RelatedModules from "@/components/layout/RelatedModules";
import DistrictBar from "@/components/district/shell/DistrictBar";
import { ShellBottom, ShellTop } from "@/components/district/shell/ShellSlots";
import "./district-shell.css";
import { getDistrict, getState } from "@/lib/constants/districts";
import { generateDistrictMetadata, localName } from "@/lib/seo";

type Params = Promise<{ locale: string; state: string; district: string }>;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

// The district overview's title and description, in the page's language.
// Module pages and taluk pages override it from their own layouts.
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, state: stateSlug, district: districtSlug } = await params;
  return generateDistrictMetadata(stateSlug, districtSlug, locale);
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
  const ts = await getTranslations({ locale, namespace: "sidebar" });

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
    <div className="ftp-dshell">
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

      {/* v5: ONE district bar under the site header, sticky on every width:
          state › district › taluk switchers, plus the topics drawer
          (below 1024 px) or a link to the verification section (PC). */}
      <DistrictBar locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />

      {/* HueScope: the open module's colour (Design v4) for sidebar + page. */}
      <HueScope
        style={{
          display: "flex",
          alignItems: "flex-start",
          minHeight: "calc(100vh - var(--ftp-shell-top, 104px))", // viewport - header - district bar
        }}
      >
        {/* Sidebar — laptops and PCs (≥ 1024 px) only */}
        <Sidebar locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />

        {/* Main content (v5):
              ShellTop     — stale-data notice for the open module (the
                             glance tiles are overview-only since v5.1)
              the page
              See also     — modules people mix up with this one
              ShellBottom  — "Check this data" (#verify) with the one
                             "Report a mistake" button (it replaces the
                             floating "Report issue" pill)
            The overview places its own glance row and verification panel. */}
        <main
          className="ftp-dshell-main"
          style={{ flex: 1, minWidth: 0 }}
          role="main"
          aria-label={ts("mainAria", { district: localName(locale, districtData!) })}
        >
          <ShellTop stateSlug={stateSlug} districtSlug={districtSlug} />
          {children}
          <RelatedModules locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />
          <ShellBottom stateSlug={stateSlug} districtSlug={districtSlug} />
        </main>
      </HueScope>
    </div>
  );
}
