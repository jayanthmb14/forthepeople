/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Translated supporter badge ("Mandya Champion", "India Patron"), the
// language-aware twin of getContributorLabel() in src/lib/contributor-label.ts.
// Pass the translator for the "page_site" namespace. Place names stay as
// stored (they are proper nouns from the registry / database).

type SiteT = (key: string, values?: Record<string, string | number>) => string;

export function tierLabel(t: SiteT, tier: string, districtName?: string | null, stateName?: string | null): string {
  switch (tier) {
    case "founder":
      return t("tier.founder");
    case "patron":
      return t("tier.patron");
    case "state":
      return stateName ? t("tier.state", { place: stateName }) : t("tier.stateAny");
    case "district":
      return districtName ? t("tier.district", { place: districtName }) : t("tier.districtAny");
    case "chai":
      return t("tier.chai");
    default:
      return t("tier.supporter");
  }
}
