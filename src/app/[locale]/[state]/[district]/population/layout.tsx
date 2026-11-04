/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Page title and description for search engines and link previews, in the
// page's language (src/lib/seo.ts). It lives in the layout because most
// module pages are client components, which cannot export metadata.
import type { Metadata } from "next";
import { generateModuleMetadata } from "@/lib/seo";
import ScopedMessages from "@/i18n/ScopedMessages";

type Params = Promise<{ locale: string; state: string; district: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, state, district } = await params;
  return generateModuleMetadata("population", state, district, locale);
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  return children;
}

export default async function Layout(props: Parameters<typeof LayoutContent>[0] & { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return (
    <ScopedMessages scope="state/district/population" locale={locale}>
      <LayoutContent {...props} />
    </ScopedMessages>
  );
}
