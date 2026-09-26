/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { redirect } from "next/navigation";

// Root route: redirect to default locale
export default function RootPage() {
  redirect("/en");
}
