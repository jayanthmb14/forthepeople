import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import ResponsibilityAdminClient from "./ResponsibilityAdminClient";
import { requireAdmin } from "@/lib/admin-auth";
type Params = Promise<{ locale: string }>;

export default async function AdminResponsibilityPage({ params }: { params: Params }) {
  const { locale } = await params;
  const { ok: authed } = await requireAdmin();
  if (!authed) redirect(`/${locale}/admin`);

  const districts = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  });

  const pune = districts.find((d) => d.slug === "pune");
  const defaultSlug = pune?.slug ?? districts[0]?.slug ?? "";

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Responsibility Items</h1>
        <p style={{ color: "#6B6B6B", fontSize: 13 }}>
          Per-district civic responsibility items shown on the
          <code style={codeStyle}>/responsibility</code> page. Unverified phone numbers are kept
          out of public rendering until Jayanth confirms them here.
        </p>
      </div>
      <ResponsibilityAdminClient districts={districts} defaultSlug={defaultSlug} />
    </div>
  );
}

const codeStyle: React.CSSProperties = {
  padding: "1px 6px",
  background: "#F3F4F6",
  borderRadius: 4,
  fontSize: 11,
  margin: "0 4px",
};
