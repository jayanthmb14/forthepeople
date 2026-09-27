/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════
//  NoDataCard — the honest "no data yet" block for a module page.
//  Design v3: renders the kit <EmptyState> (one honest sentence as the
//  title, what is being done about it as the body). No amber box, no
//  stripe. The per-module wording below is unchanged from v2.
// ═══════════════════════════════════════════════════════════

import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/district/ui";
import { getStateConfig } from "@/lib/constants/state-config";
import { useDistrictName } from "@/i18n/client";

interface NoDataCardProps {
  module: string;
  district: string;
  state: string;
  isUrban?: boolean;
  customMessage?: string;
}

/** Modules with a separate "not applicable in an urban district" message. */
const URBAN_VARIANT = new Set(["crops", "farm", "gram-panchayat", "jjm"]);

export default function NoDataCard({ module, district, state, isUrban = false, customMessage }: NoDataCardProps) {
  const t = useTranslations("noData");
  const stateConfig = getStateConfig(state, district);
  // In the page language (ಮಂಡ್ಯ / मंड्या), not a title-cased slug.
  const districtName = useDistrictName(state, district);
  const values = {
    district: districtName,
    discom: stateConfig?.discomFullName ?? t("fallbackDiscom"),
    portal: stateConfig?.waterPortalName ?? t("fallbackWaterPortal"),
    transport: stateConfig?.stateTransportFullName ?? t("fallbackTransport"),
    url: stateConfig?.discomPortalUrl ?? "",
  };
  const key = URBAN_VARIANT.has(module) && isUrban ? `${module}Urban` : module;
  const known = t.has(`${key}.title`);
  const title = customMessage ? t("generic.title") : known ? t(`${key}.title`, values) : t("generic.title");
  const body = customMessage ?? (known ? t(`${key}.body`, values) : t("generic.body", values));

  return (
    <div style={{ marginBottom: 20 }}>
      <EmptyState
        title={title}
        body={body}
        action={<p style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", margin: 0 }}>{t("footer")}</p>}
      />
    </div>
  );
}
