/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Translated text for a validateContributorName() failure. The validator
// (src/lib/validators/contributor-name.ts) is shared with the API routes and
// returns English reasons; the forms map each reason to "page_site.nameError".
// An unknown reason is shown as the validator wrote it.

type SiteT = (key: string, values?: Record<string, string | number>) => string;

export function nameErrorText(t: SiteT, reason: string): string {
  const n = Number(reason.match(/\d+/)?.[0] ?? 0);
  if (reason.startsWith("Name must be text")) return t("nameError.text");
  if (reason.startsWith("Name must be at least")) return t("nameError.short", { n });
  if (reason.startsWith("Name must be under")) return t("nameError.long", { n });
  if (reason.startsWith("Name can only contain")) return t("nameError.letters");
  if (reason.startsWith("Please enter a personal name")) return t("nameError.business");
  if (reason.startsWith("Please enter your name only")) return t("nameError.spam");
  return reason;
}
