/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Title and description for a taluk (tehsil, mandal…) page and its village
// pages, in the page's language: "Srirangapatna Taluk — Mandya". The page is
// a client component, so its metadata lives here. Unknown taluks get the
// district's metadata (the page shows its own not-found state).
import type { Metadata } from "next";
import { generateTalukMetadata } from "@/lib/seo";
import ScopedMessages from "@/i18n/ScopedMessages";

type Params = Promise<{ locale: string; state: string; district: string; taluk: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, state, district, taluk } = await params;
  return generateTalukMetadata(state, district, taluk, locale);
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  return children;
}

export default async function Layout(props: Parameters<typeof LayoutContent>[0] & { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return (
    <ScopedMessages scope="state/district/taluk" locale={locale}>
      <LayoutContent {...props} />
    </ScopedMessages>
  );
}
