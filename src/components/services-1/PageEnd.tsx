/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// The end of a daily-needs page (tap water, power, transport, health,
// schools): related news, then the quiet Share / Compare row. Sources,
// the "not an official website" line and "report a mistake" are NOT here:
// the district layout adds one verification panel at the bottom of every
// page, so pages must not repeat them.
"use client";

import ModuleNews from "@/components/district/ModuleNews";
import { PageActions } from "@/components/district/page-kit";

export default function PageEnd({
  module,
  locale,
  state,
  district,
  shareText,
}: {
  /** Kept for callers; the words now come from page_pagekit. */
  ns?: string;
  module: string;
  locale: string;
  state: string;
  district: string;
  /** One translated sentence for the share sheet. */
  shareText: string;
}) {
  return (
    <>
      <ModuleNews district={district} state={state} locale={locale} module={module} />
      <div style={{ marginTop: 28 }}>
        <PageActions locale={locale} district={district} moduleSlug={module} shareText={shareText} />
      </div>
    </>
  );
}
