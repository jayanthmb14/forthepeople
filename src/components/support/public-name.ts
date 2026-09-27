/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// A supporter's name as it may be SHOWN. Some stored names are really a
// phone number or an e-mail address (the payment webhook falls back to the
// payer's contact when no name was given). /api/payment/contributors already
// masks those, but /api/data/contributors (the /contributors page, the
// district "Supported by" block, the All-India line) sent them as they are
// (seen 27 Sep 2026: "+91…" names on /contributors). Every supporter surface
// in this folder runs names through here as a second guard; the API itself
// should mask them too (same rule as looksLikeContactInfo() in
// src/app/api/payment/contributors/route.ts).

const PHONE_LIKE = /^\+?\d[\d\s-]{7,}$/;
const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Names the APIs send instead of a real one. */
const PLACEHOLDERS = new Set(["anonymous", "supporter"]);

/** True when a stored name is a phone number, an e-mail address or has fewer than 2 letters. */
export function looksLikeContactInfo(raw: string | null | undefined): boolean {
  const name = (raw ?? "").trim();
  if (PHONE_LIKE.test(name)) return true;
  if (EMAIL_LIKE.test(name)) return true;
  if (/\d{6,}/.test(name.replace(/[\s-]/g, ""))) return true;
  const letters = name.match(/\p{L}/gu)?.length ?? 0;
  return letters < 2;
}

/**
 * The name to show, or null when it must not be shown (anonymous, a
 * placeholder, or contact details) — the caller then shows its translated
 * "Anonymous" / "Supporter" and a plain person avatar.
 */
export function publicName(raw: string | null | undefined): string | null {
  const name = (raw ?? "").trim();
  if (!name || PLACEHOLDERS.has(name.toLowerCase())) return null;
  if (looksLikeContactInfo(name)) return null;
  return name;
}
