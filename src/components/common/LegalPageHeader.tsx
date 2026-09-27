/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Header for the legal pages (Privacy, Disclaimer). Design v4: the site
// band (SiteHeader) in the page hue — slate on the legal pages — with the
// page's one <h1>, the "Last updated" date as its description, and the
// back link above it.

import { Scale } from "lucide-react";
import SiteHeader from "@/components/site/SiteHeader";

type Props = {
  title: string;
  lastUpdated: string;
  backHref?: string;
  /** Emoji for the header tile (default ⚖️). */
  emoji?: string;
};

export default function LegalPageHeader({ title, lastUpdated, backHref = "/", emoji = "⚖️" }: Props) {
  return (
    <div style={{ marginBottom: 8 }}>
      <SiteHeader emoji={emoji} icon={Scale} title={title} description={`Last updated: ${lastUpdated}`} backHref={backHref} />
    </div>
  );
}
