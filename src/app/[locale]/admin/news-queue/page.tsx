/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Admin → News & Check Queue (read-only)
//
// Everything waiting in NewsActionQueue, grouped by dataType:
//   • "verify-*"  disagreements raised by the daily data check
//                 (/api/cron/verify-data, src/lib/verification) — e.g. a
//                 leader our pages list who differs from Wikipedia and
//                 Wikidata. Fix them in the Content Editor after checking
//                 the official source.
//   • "leaders", "police", "power" …  data changes the news pipeline found
//                 but may not write by itself (src/lib/news-action-engine.ts).
// Counts per type and status, then the newest 50 items of each type.
// No approve / dismiss buttons: no admin action exists for this queue yet,
// so this page only lists (nothing here writes to the database).
// ═══════════════════════════════════════════════════════════
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Params = Promise<{ locale: string }>;

/** Items shown per type. */
const PER_TYPE = 50;

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  pending: { bg: "#FEF3C7", fg: "#854D0E" },
  approved: { bg: "#DCFCE7", fg: "#166534" },
  executed: { bg: "#D1FAE5", fg: "#065F46" },
  rejected: { bg: "#F3F4F6", fg: "#4B5563" },
  skipped: { bg: "#F3F4F6", fg: "#4B5563" },
};

const cell: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid #EEE", verticalAlign: "top", fontSize: 13 };

function StatusPill({ status, n }: { status: string; n?: number }) {
  const c = STATUS_COLORS[status] ?? { bg: "#EEF2FF", fg: "#3730A3" };
  return (
    <span style={{ background: c.bg, color: c.fg, borderRadius: 999, padding: "2px 8px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
      {status}
      {n !== undefined ? ` · ${n.toLocaleString("en-IN")}` : ""}
    </span>
  );
}

/** Short, readable view of the extracted data (never more than ~400 characters). */
function preview(v: unknown): string {
  try {
    const s = JSON.stringify(v);
    return s.length > 400 ? `${s.slice(0, 400)}…` : s;
  } catch {
    return "";
  }
}

export default async function NewsQueuePage({ params }: { params: Params }) {
  const { locale } = await params;
  const { ok: authed } = await requireAdmin();
  if (!authed) redirect(`/${locale}/admin`);

  const grouped = await prisma.newsActionQueue.groupBy({
    by: ["dataType", "status"],
    _count: { _all: true },
    _max: { createdAt: true },
  });

  // dataType → { status → count }, newest item time, total.
  const types = new Map<string, { byStatus: Record<string, number>; total: number; pending: number; newest: Date | null }>();
  for (const g of grouped) {
    const t = types.get(g.dataType) ?? { byStatus: {}, total: 0, pending: 0, newest: null };
    t.byStatus[g.status] = g._count._all;
    t.total += g._count._all;
    if (g.status === "pending") t.pending += g._count._all;
    if (g._max.createdAt && (!t.newest || g._max.createdAt > t.newest)) t.newest = g._max.createdAt;
    types.set(g.dataType, t);
  }
  // Data-check disagreements first, then the busiest types.
  const order = [...types.entries()].sort(([a, x], [b, y]) => {
    const va = a.startsWith("verify-") ? 0 : 1;
    const vb = b.startsWith("verify-") ? 0 : 1;
    return va - vb || y.pending - x.pending || a.localeCompare(b);
  });

  const items = await Promise.all(
    order.map(([dataType]) =>
      prisma.newsActionQueue.findMany({
        where: { dataType },
        orderBy: { createdAt: "desc" },
        take: PER_TYPE,
        select: {
          id: true,
          status: true,
          headline: true,
          sourceUrl: true,
          confidence: true,
          extractedData: true,
          reviewerNote: true,
          createdAt: true,
          district: { select: { name: true } },
        },
      }),
    ),
  );

  const grandTotal = order.reduce((s, [, t]) => s + t.total, 0);
  const grandPending = order.reduce((s, [, t]) => s + t.pending, 0);
  const fmt = (d: Date) => d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>News &amp; Check Queue</h1>
        <p style={{ color: "#6B6B6B", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          {grandTotal.toLocaleString("en-IN")} items, {grandPending.toLocaleString("en-IN")} pending, in {order.length} types. Read-only: nothing
          here changes the site. <b>verify-*</b> items are disagreements found by the daily data check — confirm against the official source, then fix
          the record in the Content Editor. Other types are changes the news pipeline found but may not write by itself. Newest {PER_TYPE} per type.
        </p>
      </div>

      {order.length === 0 && <p style={{ color: "#6B6B6B" }}>The queue is empty.</p>}

      {/* Counts per type */}
      {order.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24, background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 8 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "#FAFAF8" }}>
              <th style={cell}>Type</th>
              <th style={cell}>By status</th>
              <th style={cell}>Total</th>
              <th style={cell}>Newest</th>
            </tr>
          </thead>
          <tbody>
            {order.map(([dataType, t]) => (
              <tr key={dataType}>
                <td style={cell}>
                  <a href={`#type-${dataType}`} style={{ color: "#1E40AF", fontWeight: 600 }}>
                    {dataType}
                  </a>
                </td>
                <td style={{ ...cell, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {Object.entries(t.byStatus).map(([status, n]) => (
                    <StatusPill key={status} status={status} n={n} />
                  ))}
                </td>
                <td style={cell}>{t.total.toLocaleString("en-IN")}</td>
                <td style={cell}>{t.newest ? fmt(t.newest) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Newest items per type */}
      {order.map(([dataType, t], i) => (
        <details key={dataType} id={`type-${dataType}`} open={dataType.startsWith("verify-")} style={{ marginBottom: 12, background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 8 }}>
          <summary style={{ padding: "10px 14px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
            {dataType} — {t.pending.toLocaleString("en-IN")} pending of {t.total.toLocaleString("en-IN")}
            {t.total > PER_TYPE ? ` (newest ${PER_TYPE} shown)` : ""}
          </summary>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", background: "#FAFAF8" }}>
                  <th style={cell}>When</th>
                  <th style={cell}>District</th>
                  <th style={cell}>Headline / finding</th>
                  <th style={cell}>Status</th>
                  <th style={cell}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {items[i].map((q) => (
                  <tr key={q.id}>
                    <td style={{ ...cell, whiteSpace: "nowrap" }}>{fmt(q.createdAt)}</td>
                    <td style={cell}>{q.district?.name ?? "—"}</td>
                    <td style={{ ...cell, maxWidth: 560 }}>
                      <div style={{ fontWeight: 500 }}>
                        {/^https?:\/\//.test(q.sourceUrl) ? (
                          <a href={q.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#1A1A1A" }}>
                            {q.headline}
                          </a>
                        ) : (
                          q.headline
                        )}
                      </div>
                      <details style={{ marginTop: 4 }}>
                        <summary style={{ fontSize: 12, color: "#6B6B6B", cursor: "pointer" }}>Extracted data</summary>
                        <code style={{ display: "block", fontSize: 11, whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#4B5563" }}>
                          {preview(q.extractedData)}
                        </code>
                      </details>
                      {q.reviewerNote && <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 4 }}>Note: {q.reviewerNote}</div>}
                    </td>
                    <td style={cell}>
                      <StatusPill status={q.status} />
                    </td>
                    <td style={cell}>{Number.isFinite(q.confidence) ? `${Math.round(q.confidence * 100)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ))}
    </div>
  );
}
