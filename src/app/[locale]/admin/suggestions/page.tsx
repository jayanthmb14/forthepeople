import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import SuggestionsClient from "./SuggestionsClient";
import { requireAdmin } from "@/lib/admin-auth";
type Params = Promise<{ locale: string }>;

export default async function AdminSuggestionsPage({ params }: { params: Params }) {
  const { locale } = await params;
  const { ok: authed } = await requireAdmin();
  if (!authed) redirect(`/${locale}/admin`);

  const rows = await prisma.suggestion.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const serialized = rows.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Citizen Suggestions</h1>
        <p style={{ color: "#6B6B6B", fontSize: 13 }}>
          {rows.length} total. Mark suggestions as Accepted or Implemented to publish them on <code>/features?tab=suggest</code>. Mark as Spam or Rejected to hide. Pending means not yet reviewed.
        </p>
      </div>
      <SuggestionsClient initialRows={serialized} />
    </div>
  );
}
