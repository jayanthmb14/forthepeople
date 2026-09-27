/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

/**
 * Returns dynamic label for a contributor based on tier + associated district/state.
 * Examples:
 *   getContributorLabel("district", "Mandya") → "Mandya Champion"
 *   getContributorLabel("state", undefined, "Karnataka") → "Karnataka Champion"
 *   getContributorLabel("patron") → "India Patron"
 *   getContributorLabel("founder") → "Founding Builder"
 *   getContributorLabel("chai") → "Chai Supporter"
 *   getContributorLabel("custom") → "Supporter"
 */
export function getContributorLabel(
  tier: string,
  districtName?: string | null,
  stateName?: string | null
): string {
  switch (tier) {
    case "founder":
      return "Founding Builder";
    case "patron":
      return "India Patron";
    case "state":
      return stateName ? `${stateName} Champion` : "State Champion";
    case "district":
      return districtName ? `${districtName} Champion` : "District Champion";
    case "chai":
      return "Chai Supporter";
    case "custom":
      return "Supporter";
    default:
      return "Supporter";
  }
}
