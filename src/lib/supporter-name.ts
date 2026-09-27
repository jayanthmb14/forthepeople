/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// A supporter's name as it may be SHOWN — one rule for the server (the
// supporter APIs) and the browser (the supporter components).
//
// Some stored names are really a phone number or an e-mail address: the
// payment webhook used to fall back to the payer's contact when no name was
// given, and an early checkout form put the wrong field there. Such values
// are personal data and must never leave the server as a name (seen on
// /contributors, 27 Sep 2026: "+91…" names). The APIs mask them as
// "Supporter"; the components run names through publicName() as a second
// guard. Pure: no I/O, safe to import anywhere.

const PHONE_LIKE = /^\+?\d[\d\s-]{7,}$/;
const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Names the APIs send instead of a real one. */
const PLACEHOLDERS = new Set(["anonymous", "supporter"]);

/** What the APIs send for a supporter who asked not to be shown. */
export const ANONYMOUS_NAME = "Anonymous";
/** What the APIs send when the stored name is contact details or too short to be a name. */
export const MASKED_NAME = "Supporter";

/**
 * True when a stored name is a phone number, an e-mail address, contains a
 * run of 6+ digits (a phone number inside text), or has fewer than 2 letters.
 */
export function looksLikeContactInfo(raw: string | null | undefined): boolean {
  const name = (raw ?? "").trim();
  if (PHONE_LIKE.test(name)) return true;
  if (EMAIL_LIKE.test(name)) return true;
  if (/\d{6,}/.test(name.replace(/[\s-]/g, ""))) return true;
  if (/[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(name)) return true;
  const letters = name.match(/\p{L}/gu)?.length ?? 0;
  return letters < 2;
}

/**
 * The name a public API may send: "Anonymous" when the supporter did not
 * opt in (or gave no name), "Supporter" when the stored name is contact
 * details, else the name itself (trimmed).
 */
export function publicDisplayName(raw: string | null | undefined, isPublic: boolean): string {
  if (!isPublic) return ANONYMOUS_NAME;
  const name = (raw ?? "").trim();
  if (!name) return ANONYMOUS_NAME;
  if (looksLikeContactInfo(name)) return MASKED_NAME;
  return name;
}

/**
 * The name to show on screen, or null when it must not be shown
 * (anonymous, a placeholder, or contact details) — the caller then shows
 * its translated "Anonymous" / "Supporter" and a plain person avatar.
 */
export function publicName(raw: string | null | undefined): string | null {
  const name = (raw ?? "").trim();
  if (!name || PLACEHOLDERS.has(name.toLowerCase())) return null;
  if (looksLikeContactInfo(name)) return null;
  return name;
}
