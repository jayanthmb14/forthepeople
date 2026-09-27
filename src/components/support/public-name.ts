/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Every supporter surface in this folder runs names through publicName()
// as a second guard; the APIs mask contact-looking names themselves. The
// rule lives in src/lib/supporter-name.ts so the server and the browser
// use exactly the same one.
export { looksLikeContactInfo, publicName } from "@/lib/supporter-name";
