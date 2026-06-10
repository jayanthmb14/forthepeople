/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin, createAdminSession } from "@/lib/admin-auth";

const COOKIE = "ftp_admin_v1";

async function loginAction(formData: FormData) {
  "use server";
  const pw = formData.get("password") as string;
  const locale = formData.get("locale") as string;
  if (pw === (process.env.ADMIN_PASSWORD ?? "")) {
    const hdrs = await headers();
    const ip =
      hdrs.get("x-forwarded-for")?.split(",")[0].trim() ||
      hdrs.get("x-real-ip") ||
      "unknown";
    const token = await createAdminSession(ip);
    (await cookies()).set(COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 3600,
      path: "/",
      sameSite: "strict",
    });
    redirect(`/${locale}/admin/review`);
  }
  redirect(`/${locale}/admin/review?error=1`);
}

async function reviewAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const action = formData.get("action") as "approve" | "reject";
  const locale = formData.get("locale") as string;
  const now = new Date();
  const q = await prisma.reviewQueue.update({
    where: { id },
    data: { status: action === "approve" ? "approved" : "rejected", reviewedAt: now },
  });
  await prisma.aIInsight.update({
    where: { id: q.insightId },
    data: { approved: action === "approve", approvedAt: action === "approve" ? now : null },
  });
  revalidatePath(`/${locale}/admin/review`);
}

async function feedbackAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  const locale = formData.get("locale") as string;
  await prisma.feedback.update({ where: { id }, data: { status } });
  revalidatePath(`/${locale}/admin/review`);
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#16A34A", negative: "#DC2626", neutral: "#6B7280",
};
const FEEDBACK_EMOJI: Record<string, string> = {
  bug: "🐛", wrong_data: "📊", suggestion: "💡", praise: "🙏", other: "💬",
};

export default async function AdminReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; tab?: string }>;
}) {
  const { locale } = await params;
  const { error, tab = "review" } = await searchParams;
  const { ok: authed } = await requireAdmin();

  if (!authed) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
        <div style={{ fontSize: 22 }}>🧠</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A" }}>Admin Dashboard</div>
        <form action={loginAction} style={{ display: "flex", flexDirection: "column", gap: 8, width: 260 }}>
          <input type="hidden" name="locale" value={locale} />
          <input type="password" name="password" placeholder="Admin password" autoFocus required
            style={{ padding: "9px 12px", border: "1px solid #E8E8E4", borderRadius: 8, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" }} />
          {error && <span style={{ fontSize: 12, color: "#DC2626" }}>Incorrect password</span>}
          <button type="submit" style={{ padding: "9px 0", background: "#2563EB", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Login</button>
        </form>
      </div>
    );
  }

  // Fetch all data
  const pending = await prisma.reviewQueue.findMany({ where: { status: "pending" }, orderBy: { createdAt: "desc" } });
  const applied = await prisma.reviewQueue.findMany({ where: { status: { in: ["approved", "rejected"] } }, orderBy: { reviewedAt: "desc" }, take: 50 });
  const allInsightIds = [...pending, ...applied].map((q) => q.insightId);
  const allInsights = allInsightIds.length ? await prisma.aIInsight.findMany({ where: { id: { in: allInsightIds } } }) : [];
  const insightMap = Object.fromEntries(allInsights.map((i) => [i.id, i]));
  const pendingItems = pending.map((q) => ({ ...q, insight: insightMap[q.insightId] ?? null })).filter((x) => x.insight);
  const appliedItems = applied.map((q) => ({ ...q, insight: insightMap[q.insightId] ?? null })).filter((x) => x.insight);
  const feedbackItems = await prisma.feedback.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { district: { select: { name: true } } } });
  const newFeedbackCount = feedbackItems.filter((f) => f.status === "new").length;
  const logs = await prisma.newsIntelligenceLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  const contributions = await prisma.contribution.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const paidContributions = contributions.filter((c) => c.status === "paid");
  const totalCollectedRs = Math.round(paidContributions.reduce((s, c) => s + c.amount, 0) / 100);

  const TABS = [
    { key: "review", label: "Pending Review", badge: pendingItems.length },
    { key: "applied", label: "Applied", badge: appliedItems.length },
    { key: "feedback", label: "Feedback", badge: newFeedbackCount, badgeRed: newFeedbackCount > 0 },
    { key: "payments", label: "Payments", badge: paidContributions.length },
    { key: "logs", label: "AI Logs", badge: null },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <a href="/en/admin" style={{ fontSize: 12, color: "#2563EB", textDecoration: "none", display: "inline-block", marginBottom: 12 }}>&larr; Back to Admin Dashboard</a>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A" }}>🧠 Admin Dashboard</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "1px solid #E8E8E4" }}>
        {TABS.map((t) => (
          <a key={t.key} href={`/${locale}/admin/review?tab=${t.key}`}
            style={{
              padding: "10px 16px", fontSize: 13,
              fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? "#2563EB" : "#6B6B6B",
              borderBottom: tab === t.key ? "2px solid #2563EB" : "2px solid transparent",
              textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
              marginBottom: -1, whiteSpace: "nowrap",
            }}>
            {t.label}
            {t.badge !== null && t.badge > 0 && (
              <span style={{ background: t.badgeRed ? "#DC2626" : (tab === t.key ? "#2563EB" : "#6B7280"), color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>
                {t.badge}
              </span>
            )}
          </a>
        ))}
      </div>

      {/* Pending Review Tab */}
      {tab === "review" && (
        pendingItems.length === 0 ? (
          <EmptyState message="No pending items." hint="/api/cron/news-intelligence" />
        ) : (
          <>
            <p style={{ fontSize: 13, color: "#6B6B6B", marginBottom: 16 }}>{pendingItems.length} pending · Approve to show on district pages</p>
            <InsightTable items={pendingItems} locale={locale} reviewAction={reviewAction} showActions />
          </>
        )
      )}

      {/* Applied Tab */}
      {tab === "applied" && (
        appliedItems.length === 0 ? (
          <EmptyState message="No reviewed items yet." />
        ) : (
          <>
            <p style={{ fontSize: 13, color: "#6B6B6B", marginBottom: 16 }}>Last 50 reviewed items</p>
            <InsightTable items={appliedItems} locale={locale} reviewAction={reviewAction} showActions={false} />
          </>
        )
      )}

      {/* Feedback Tab */}
      {tab === "feedback" && (
        feedbackItems.length === 0 ? (
          <EmptyState message="No feedback received yet." />
        ) : (
          <>
            <p style={{ fontSize: 13, color: "#6B6B6B", marginBottom: 16 }}>{feedbackItems.length} total · {newFeedbackCount} new</p>
            <div style={{ background: "#fff", border: "1px solid #E8E8E4", borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FAFAF8", borderBottom: "1px solid #F0F0EC" }}>
                    {["Type", "Subject & Message", "Contact", "District", "Status", "Date", "Action"].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "#9B9B9B", textAlign: "left", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {feedbackItems.map((f, i) => (
                    <tr key={f.id} style={{ borderBottom: i < feedbackItems.length - 1 ? "1px solid #F5F5F0" : "none" }}>
                      <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                        <div style={{ fontSize: 18 }}>{FEEDBACK_EMOJI[f.type] ?? "💬"}</div>
                        <div style={{ fontSize: 10, color: "#9B9B9B", marginTop: 2 }}>{f.type}</div>
                      </td>
                      <td style={{ padding: "12px 14px", verticalAlign: "top", maxWidth: 300 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginBottom: 4 }}>{f.subject}</div>
                        <div style={{ fontSize: 12, color: "#6B6B6B", lineHeight: 1.5 }}>{f.message.slice(0, 180)}{f.message.length > 180 ? "…" : ""}</div>
                      </td>
                      <td style={{ padding: "12px 14px", verticalAlign: "top", fontSize: 12, color: "#6B6B6B" }}>
                        {f.name && <div>{f.name}</div>}
                        {f.email && <div style={{ color: "#2563EB" }}>{f.email}</div>}
                        {!f.name && !f.email && <span style={{ color: "#C0C0C0" }}>Anonymous</span>}
                      </td>
                      <td style={{ padding: "12px 14px", verticalAlign: "top", fontSize: 12, color: "#6B6B6B" }}>
                        {f.district?.name ?? <span style={{ color: "#C0C0C0" }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: f.status === "new" ? "#FEF3C7" : f.status === "resolved" ? "#DCFCE7" : "#F3F4F6", color: f.status === "new" ? "#D97706" : f.status === "resolved" ? "#16A34A" : "#6B7280" }}>
                          {f.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", verticalAlign: "top", fontSize: 11, color: "#9B9B9B", whiteSpace: "nowrap" }}>
                        {new Date(f.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                        <form action={feedbackAction}>
                          <input type="hidden" name="id" value={f.id} />
                          <input type="hidden" name="locale" value={locale} />
                          <select name="status" defaultValue={f.status} style={{ fontSize: 12, padding: "4px 6px", borderRadius: 6, border: "1px solid #E8E8E4" }}>
                            <option value="new">New</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="resolved">Resolved</option>
                          </select>
                          <button type="submit" style={{ marginLeft: 4, padding: "4px 8px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Set</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      )}

      {/* Payments Tab */}
      {tab === "payments" && (
        <>
          {/* Summary bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Total Collected", value: `₹${totalCollectedRs.toLocaleString("en-IN")}` },
              { label: "Successful Payments", value: String(paidContributions.length) },
              { label: "Pending / Failed", value: String(contributions.length - paidContributions.length) },
            ].map((s) => (
              <div key={s.label} style={{ background: "#fff", border: "1px solid #E8E8E4", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, color: "#9B9B9B", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#2563EB", fontFamily: "monospace" }}>{s.value}</div>
              </div>
            ))}
          </div>
          {contributions.length === 0 ? (
            <EmptyState message="No contributions yet." />
          ) : (
            <div style={{ background: "#fff", border: "1px solid #E8E8E4", borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FAFAF8", borderBottom: "1px solid #F0F0EC" }}>
                    {["Name", "Email", "Amount", "Tier", "Status", "Date"].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "#9B9B9B", textAlign: "left", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: i < contributions.length - 1 ? "1px solid #F5F5F0" : "none" }}>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#6B6B6B" }}>{c.email ?? "—"}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontFamily: "monospace", fontWeight: 600, color: "#16A34A" }}>
                        ₹{Math.round(c.amount / 100).toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 11 }}>
                        <span style={{ background: "#F3F4F6", color: "#6B7280", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
                          {c.tier ?? "custom"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                          background: c.status === "paid" ? "#DCFCE7" : c.status === "failed" ? "#FEE2E2" : "#FEF3C7",
                          color: c.status === "paid" ? "#16A34A" : c.status === "failed" ? "#DC2626" : "#D97706",
                        }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 11, color: "#9B9B9B", whiteSpace: "nowrap" }}>
                        {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Logs Tab */}
      {tab === "logs" && (
        logs.length === 0 ? (
          <EmptyState message="No logs yet." hint="/api/cron/news-intelligence" />
        ) : (
          <>
            <p style={{ fontSize: 13, color: "#6B6B6B", marginBottom: 16 }}>Last 50 AI pipeline events</p>
            <div style={{ background: "#fff", border: "1px solid #E8E8E4", borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FAFAF8", borderBottom: "1px solid #F0F0EC" }}>
                    {["Phase", "Status", "Message", "Items", "ms", "Date"].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "#9B9B9B", textAlign: "left", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={log.id} style={{ borderBottom: i < logs.length - 1 ? "1px solid #F5F5F0" : "none" }}>
                      <td style={{ padding: "10px 14px", fontSize: 12, fontFamily: "monospace" }}>{log.phase}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: log.status === "success" ? "#DCFCE7" : log.status === "error" ? "#FEE2E2" : "#F3F4F6", color: log.status === "success" ? "#16A34A" : log.status === "error" ? "#DC2626" : "#6B7280" }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#6B6B6B", maxWidth: 300 }}>{log.message?.slice(0, 120) ?? "—"}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, fontFamily: "monospace", color: "#6B6B6B" }}>{log.itemsProcessed ?? "—"}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, fontFamily: "monospace", color: "#6B6B6B" }}>{log.durationMs ?? "—"}</td>
                      <td style={{ padding: "10px 14px", fontSize: 11, color: "#9B9B9B", whiteSpace: "nowrap" }}>
                        {new Date(log.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      )}
    </div>
  );
}

function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 0", color: "#9B9B9B", fontSize: 13, background: "#FAFAF8", borderRadius: 12, border: "1px solid #E8E8E4" }}>
      {message}
      {hint && <><br />Trigger <code style={{ background: "#F0F0EC", padding: "1px 6px", borderRadius: 4 }}>{hint}</code> to generate data.</>}
    </div>
  );
}

function InsightTable({ items, locale, reviewAction, showActions }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[];
  locale: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reviewAction: (fd: FormData) => any;
  showActions: boolean;
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E8E8E4", borderRadius: 12, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#FAFAF8", borderBottom: "1px solid #F0F0EC" }}>
            {["Module", "Headline & Summary", "Sentiment", "Conf.", "Date", showActions ? "Actions" : "Decision"].map((h) => (
              <th key={h} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "#9B9B9B", textAlign: "left", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ins = item.insight as any;
            const color = SENTIMENT_COLORS[ins?.sentiment] ?? "#6B7280";
            return (
              <tr key={item.id} style={{ borderBottom: i < items.length - 1 ? "1px solid #F5F5F0" : "none" }}>
                <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, background: "#EFF6FF", color: "#2563EB", padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>{ins?.module}</span>
                </td>
                <td style={{ padding: "12px 14px", verticalAlign: "top", maxWidth: 380 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginBottom: 4, lineHeight: 1.4 }}>{ins?.headline}</div>
                  <div style={{ fontSize: 12, color: "#6B6B6B", lineHeight: 1.55 }}>{ins?.summary}</div>
                </td>
                <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}18`, padding: "2px 8px", borderRadius: 20 }}>{ins?.sentiment}</span>
                </td>
                <td style={{ padding: "12px 14px", verticalAlign: "top", fontSize: 13, fontFamily: "monospace", color: "#1A1A1A" }}>
                  {Math.round((ins?.confidence ?? 0) * 100)}%
                </td>
                <td style={{ padding: "12px 14px", verticalAlign: "top", fontSize: 11, color: "#9B9B9B", whiteSpace: "nowrap" }}>
                  {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </td>
                <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                  {showActions ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <form action={reviewAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="action" value="approve" />
                        <input type="hidden" name="locale" value={locale} />
                        <button type="submit" style={{ padding: "5px 10px", background: "#DCFCE7", color: "#16A34A", border: "1px solid #BBF7D0", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✓ Approve</button>
                      </form>
                      <form action={reviewAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="action" value="reject" />
                        <input type="hidden" name="locale" value={locale} />
                        <button type="submit" style={{ padding: "5px 10px", background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✗ Reject</button>
                      </form>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: item.status === "approved" ? "#DCFCE7" : "#FEE2E2", color: item.status === "approved" ? "#16A34A" : "#DC2626" }}>
                      {item.status}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
