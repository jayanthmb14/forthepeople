/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Header for the legal pages (Privacy, Disclaimer). Design v4: the site
// band (SiteHeader) in the page hue — slate on the legal pages — with the
// page's one <h1>, the "Last updated" date as its description, and the
// back link above it. The date is passed as an ISO day ("2026-04-16") and
// written out in the reader's language; the words come from "page_site".

import { Scale } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import SiteHeader from "@/components/site/SiteHeader";
import { intlLocale } from "@/i18n/languages";
import { formatDate } from "@/i18n/format-date";

type Props = {
  title: string;
  /** ISO date of the last change, e.g. "2026-04-16". */
  lastUpdated: string;
  backHref?: string;
  /** Emoji for the header tile (default ⚖️). */
  emoji?: string;
};

export default function LegalPageHeader({ title, lastUpdated, backHref, emoji = "⚖️" }: Props) {
  const locale = useLocale();
  const t = useTranslations("page_site");
  const parsed = new Date(`${lastUpdated}T00:00:00+05:30`);
  const date = Number.isNaN(parsed.getTime())
    ? lastUpdated
    : formatDate(parsed, intlLocale(locale), { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  return (
    <div style={{ marginBottom: 8 }}>
      <SiteHeader
        emoji={emoji}
        icon={Scale}
        title={title}
        description={t("lastUpdated", { date })}
        backHref={backHref ?? `/${locale}`}
      />
    </div>
  );
}
