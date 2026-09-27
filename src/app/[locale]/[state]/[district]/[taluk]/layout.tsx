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

type Params = Promise<{ locale: string; state: string; district: string; taluk: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, state, district, taluk } = await params;
  return generateTalukMetadata(state, district, taluk, locale);
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
