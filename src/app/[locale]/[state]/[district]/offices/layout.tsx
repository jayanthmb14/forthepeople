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

type Params = Promise<{ locale: string; state: string; district: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, state, district } = await params;
  return generateModuleMetadata("offices", state, district, locale);
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
