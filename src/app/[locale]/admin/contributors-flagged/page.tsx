/**
 * Flagged content — admin review tab.
 * Two sections:
 *   1. Names Flagged — Supporter rows where nameFlagged=true
 *   2. Messages Flagged — Supporter rows where messageFlagged=true
 *
 * Paid-supporter policy: never delete paid records. Actions here rename /
 * restore / clear / keep — not delete (though Delete is available for
 * administrative overrides).
 */

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import FlaggedNamesClient from "./FlaggedNamesClient";
import FlaggedMessagesClient from "./FlaggedMessagesClient";
import { requireAdmin } from "@/lib/admin-auth";
type Params = Promise<{ locale: string }>;

export default async function FlaggedContributorsPage({ params }: { params: Params }) {
  const { locale } = await params;
  const { ok: authed } = await requireAdmin();
  if (!authed) redirect(`/${locale}/admin`);

  const [nameRows, messageRows] = await Promise.all([
    prisma.supporter.findMany({
      where: { nameFlagged: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, originalName: true, email: true,
        tier: true, amount: true, createdAt: true,
      },
    }),
    prisma.supporter.findMany({
      where: { messageFlagged: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, message: true, originalMessage: true, email: true,
        tier: true, amount: true, createdAt: true,
      },
    }),
  ]);

  const serializedNames = nameRows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));
  const serializedMessages = messageRows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Flagged Supporter Content</h1>
        <p style={{ color: "#6B6B6B", fontSize: 13 }}>
          Paid records never deleted. Names shortened or anonymized; messages cleared with
          originals preserved for review. All tiers + payments intact.
        </p>
      </div>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          Names Flagged — {nameRows.length}
        </h2>
        <p style={{ color: "#6B6B6B", fontSize: 12, marginBottom: 12 }}>
          Names that failed the validator (business names, emails, promotional text).
        </p>
        <FlaggedNamesClient initialRows={serializedNames} />
      </section>

      <section>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          Messages Flagged — {messageRows.length}
        </h2>
        <p style={{ color: "#6B6B6B", fontSize: 12, marginBottom: 12 }}>
          Messages that failed validation (promotional content, phone numbers, URLs, interest-rate language).
          Current message cleared; original preserved.
        </p>
        <FlaggedMessagesClient initialRows={serializedMessages} />
      </section>
    </div>
  );
}
