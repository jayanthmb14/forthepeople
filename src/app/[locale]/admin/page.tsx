/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/people
 *
 * Admin dashboard entry. Content is switched client-side by AdminClient
 * based on the ?tab= query param. All data fetching happens in the sub-tabs
 * (each via its own API route), so this page does no server-side queries.
 */

import { redirect } from "next/navigation";
import { FactChecker } from "./FactChecker";
import AdminClient from "./AdminClient";
import DashboardView from "./DashboardView";
import { requireAdmin } from "@/lib/admin-auth";

type Params = Promise<{ locale: string }>;

export default async function AdminDashboardPage({ params }: { params: Params }) {
  const { locale } = await params;
  const { ok: authed } = await requireAdmin();
  if (!authed) redirect(`/${locale}/admin?error=1`);

  return (
    <AdminClient locale={locale}>
      <DashboardView locale={locale} />
      <FactChecker />
    </AdminClient>
  );
}
