/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import type { Metadata } from "next";
import Script from "next/script";
import { generateModuleMetadata, generateModuleJsonLd } from "@/lib/seo";
import ScopedMessages from "@/i18n/ScopedMessages";

type Params = Promise<{ locale: string; state: string; district: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, state, district } = await params;
  return generateModuleMetadata("weather", state, district, locale);
}

async function WeatherLayoutContent({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string; state: string; district: string }> }) {
  const { state, district } = await params;
  const jsonLd = generateModuleJsonLd({
    module: "weather",
    districtName: district,
    stateName: state,
    stateSlug: state,
    districtSlug: district,
  });
  return (
    <>
      {jsonLd && (
        <Script
          id="module-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}

export default async function WeatherLayout(props: Parameters<typeof WeatherLayoutContent>[0] & { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return (
    <ScopedMessages scope="state/district/weather" locale={locale}>
      <WeatherLayoutContent {...props} />
    </ScopedMessages>
  );
}
