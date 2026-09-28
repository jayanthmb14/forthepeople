/**
 * ForThePeople.in — Admin Feedback Manager
 * AI classification, reply system, filters, priority badges
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { timeAgoLabel } from "@/lib/utils/timeAgo";

interface FeedbackItem {
  id: string;
  type: string;
  subject: string;
  message: string;
  name: string | null;
  email: string | null;
  module: string | null;
  rating: number | null;
  status: string;
  adminNote: string | null;
  district: { name: string } | null;
  aiCategory: string | null;
  aiPriority: string | null;
  aiSummary: string | null;
  aiConfidence: number | null;
  aiFlags: string[];
  aiAdminWarning: string | null;
  aiClassifiedAt: string | null;
  adminReply: string | null;
  adminRepliedAt: string | null;
  replySentAt: string | null;
  createdAt: string;
}

const TYPE_EMOJI: Record<string, string> = {
  bug: "🐛", wrong_data: "📊", suggestion: "💡", praise: "👏", other: "💬", partnership: "🤝",
};
const TYPE_LABEL: Record<string, string> = {
  bug: "Bug", wrong_data: "Data Error", suggestion: "Feature", praise: "Praise", other: "General", partnership: "Partnership",
};
const PRIORITY_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  critical: { bg: "#FEE2E2", color: "#DC2626", label: "Critical" },
  high: { bg: "#FFEDD5", color: "#EA580C", label: "High" },
  medium: { bg: "#FEF3C7", color: "#D97706", label: "Medium" },
  low: { bg: "#F3F4F6", color: "#6B6B6B", label: "Low" },
};
const AI_CAT_EMOJI: Record<string, string> = {
  bug: "🐛", feature: "💡", data_error: "📊", praise: "👏", general: "💬", partnership: "🤝",
};
const FLAG_BADGES: Record<string, { emoji: string; color: string; bg: string }> = {
  legal_risk: { emoji: "🔴", color: "#DC2626", bg: "#FEE2E2" },
  data_verification_needed: { emoji: "🟡", color: "#D97706", bg: "#FEF3C7" },
  personal_data_exposed: { emoji: "🟣", color: "#7C3AED", bg: "#F5F3FF" },
  partnership_opportunity: { emoji: "🟢", color: "#16A34A", bg: "#DCFCE7" },
  testimonial_worthy: { emoji: "🔵", color: "#2563EB", bg: "#DBEAFE" },
  duplicate_request: { emoji: "⚪", color: "#6B6B6B", bg: "#F3F4F6" },
  requires_new_data_source: { emoji: "🟠", color: "#EA580C", bg: "#FFEDD5" },
  revenue_relevant: { emoji: "💰", color: "#D97706", bg: "#FEF3C7" },
  accessibility_request: { emoji: "♿", color: "#2563EB", bg: "#DBEAFE" },
};

const card: React.CSSProperties = { background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: 16 };

export default function FeedbackAdminPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "priority">("newest");
  const [autoClassify, setAutoClassify] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [classifyResult, setClassifyResult] = useState<string | null>(null);
  const [expandedReply, setExpandedReply] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const [reclassifying, setReclassifying] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Array<{ key: string; label: string; value: string }>>([]);

  const fetchFeedback = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/feedback-list`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchFeedback();
    fetch("/api/admin/feedback/classify-toggle").then((r) => r.json()).then((d) => setAutoClassify(d.enabled)).catch(() => {});
    fetch("/api/admin/feedback/templates").then((r) => r.json()).then((d) => setTemplates(d.templates || [])).catch(() => {});
  }, [fetchFeedback]);

  const toggleAutoClassify = async () => {
    const res = await fetch("/api/admin/feedback/classify-toggle", { method: "POST" });
    const d = await res.json();
    setAutoClassify(d.enabled);
  };

  const classifyAll = async () => {
    setClassifying(true);
    setClassifyResult(null);
    try {
      const res = await fetch("/api/admin/feedback/classify", { method: "POST" });
      const d = await res.json();
      if (d.error) {
        setClassifyResult(`Error: ${d.error}`);
      } else if (d.lastError) {
        setClassifyResult(`Classified ${d.classified}, failed ${d.failed} — ${d.lastError}`);
      } else {
        setClassifyResult(`Classified ${d.classified}${d.failed > 0 ? `, failed ${d.failed}` : ""}`);
      }
      fetchFeedback();
    } catch { setClassifyResult("Network error — check console"); }
    setClassifying(false);
  };

  const reclassify = async (id: string) => {
    setReclassifying(id);
    try {
      await fetch(`/api/admin/feedback/${id}/reclassify`, { method: "POST" });
      fetchFeedback();
    } catch {}
    setReclassifying(null);
  };

  const markRead = async (id: string) => {
    await fetch("/api/admin/feedback-list", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "reviewed" }),
    });
    fetchFeedback();
  };

  const archive = async (id: string) => {
    await fetch("/api/admin/feedback-list", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "archived" }),
    });
    fetchFeedback();
  };

  const sendReply = async (id: string, sendEmail: boolean) => {
    const text = replyText[id]?.trim();
    if (!text) return;
    setSendingReply(id);
    try {
      await fetch("/api/admin/feedback/reply", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId: id, replyText: text, sendEmail }),
      });
      setReplyText((p) => ({ ...p, [id]: "" }));
      setExpandedReply(null);
      fetchFeedback();
    } catch {}
    setSendingReply(null);
  };

  // Filtering
  let filtered = items;
  if (filter === "new") filtered = filtered.filter((f) => f.status === "new");
  else if (filter === "archived") filtered = filtered.filter((f) => f.status === "archived");
  else if (filter !== "all") filtered = filtered.filter((f) => f.type === filter || f.aiCategory === filter);
  if (priorityFilter !== "all") filtered = filtered.filter((f) => f.aiPriority === priorityFilter);

  // Sorting
  if (sortBy === "priority") {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    filtered.sort((a, b) => (order[a.aiPriority as keyof typeof order] ?? 4) - (order[b.aiPriority as keyof typeof order] ?? 4));
  }

  // Counts
  const unclassifiedCount = items.filter((f) => !f.aiClassifiedAt).length;
  const counts = {
    new: items.filter((f) => f.status === "new").length,
    bug: items.filter((f) => f.type === "bug" || f.aiCategory === "bug").length,
    feature: items.filter((f) => f.type === "suggestion" || f.aiCategory === "feature").length,
    data_error: items.filter((f) => f.type === "wrong_data" || f.aiCategory === "data_error").length,
    praise: items.filter((f) => f.type === "praise" || f.aiCategory === "praise").length,
    partnership: items.filter((f) => f.aiCategory === "partnership").length,
  };
  const priorityCounts = {
    critical: items.filter((f) => f.aiPriority === "critical").length,
    high: items.filter((f) => f.aiPriority === "high").length,
    medium: items.filter((f) => f.aiPriority === "medium").length,
    low: items.filter((f) => f.aiPriority === "low").length,
  };

  if (loading && items.length === 0) {
    return <div style={{ padding: 24, color: "#9B9B9B", fontSize: 13 }}>Loading feedback...</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", margin: "0 0 4px" }}>Feedback Manager</h1>
        <div style={{ fontSize: 12, color: "#6B6B6B" }}>
          TOTAL: <strong>{items.length}</strong> | UNREAD: <strong>{counts.new}</strong> |
          {" "}🐛 {counts.bug} | 💡 {counts.feature} | 📊 {counts.data_error} | 👏 {counts.praise} | 🤝 {counts.partnership}
        </div>
      </div>

      {/* Auto-classify bar */}
      <div style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={toggleAutoClassify} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: autoClassify ? "#DCFCE7" : "#F3F4F6", color: autoClassify ? "#16A34A" : "#6B6B6B",
            border: autoClassify ? "1px solid #BBF7D0" : "1px solid #E8E8E4",
          }}>
            🤖 Auto-Classify: {autoClassify ? "ON" : "OFF"}
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {classifyResult && <span style={{ fontSize: 11, color: "#16A34A" }}>{classifyResult}</span>}
          <button onClick={classifyAll} disabled={classifying || unclassifiedCount === 0} style={{
            padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: classifying ? "not-allowed" : "pointer",
            background: "#2563EB", color: "#fff", border: "none", opacity: classifying || unclassifiedCount === 0 ? 0.5 : 1,
          }}>
            {classifying ? "Classifying..." : `Classify All (${unclassifiedCount} items)`}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
        {[
          { id: "all", label: "All" }, { id: "new", label: `🆕 New (${counts.new})` },
          { id: "bug", label: "🐛 Bugs" }, { id: "wrong_data", label: "📊 Data Errors" },
          { id: "suggestion", label: "💡 Features" }, { id: "praise", label: "👏 Praise" },
          { id: "partnership", label: "🤝 Partnership" }, { id: "archived", label: "📦 Archived" },
        ].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
            border: filter === f.id ? "1px solid #2563EB" : "1px solid #E8E8E4",
            background: filter === f.id ? "#EFF6FF" : "#fff", color: filter === f.id ? "#2563EB" : "#6B6B6B",
          }}>{f.label}</button>
        ))}
      </div>

      {/* Priority + Sort */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        {(["all", "critical", "high", "medium", "low"] as const).map((p) => {
          const pc = p === "all" ? null : PRIORITY_COLORS[p];
          const count = p === "all" ? items.length : priorityCounts[p];
          return (
            <button key={p} onClick={() => setPriorityFilter(p)} style={{
              padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: "pointer",
              border: priorityFilter === p ? "1px solid #2563EB" : "1px solid #E8E8E4",
              background: pc?.bg ?? "#fff", color: pc?.color ?? "#6B6B6B",
            }}>
              {p === "all" ? `All (${count})` : `${pc!.label}: ${count}`}
            </button>
          );
        })}
        <span style={{ marginLeft: 8, fontSize: 11, color: "#9B9B9B" }}>Sort:</span>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "newest" | "priority")} style={{
          padding: "3px 8px", border: "1px solid #E8E8E4", borderRadius: 4, fontSize: 11, background: "#fff",
        }}>
          <option value="newest">Newest</option>
          <option value="priority">Priority</option>
        </select>
      </div>

      {/* Feedback list */}
      {filtered.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
          <div style={{ fontSize: 13, color: "#9B9B9B" }}>No feedback matches your filters.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((item) => {
            const typeEmoji = TYPE_EMOJI[item.type] ?? "💬";
            const typeLabel = TYPE_LABEL[item.type] ?? item.type;
            const pc = item.aiPriority ? PRIORITY_COLORS[item.aiPriority] : null;
            const isReplyOpen = expandedReply === item.id;

            return (
              <div key={item.id} style={{
                ...card,
                borderLeft: `3px solid ${item.status === "new" ? "#2563EB" : item.status === "archived" ? "#D1D5DB" : "#16A34A"}`,
              }}>
                {/* Admin warning banner */}
                {item.aiAdminWarning && (
                  <div style={{ marginBottom: 10, padding: "8px 12px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 6, fontSize: 12, color: "#92400E" }}>
                    ⚠️ {item.aiAdminWarning}
                  </div>
                )}

                {/* Header row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontSize: 14 }}>{typeEmoji}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{item.subject}</span>
                      <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#F5F5F0", color: "#6B6B6B", fontWeight: 600 }}>{typeLabel}</span>
                      {item.status === "new" && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#DBEAFE", color: "#2563EB", fontWeight: 700 }}>NEW</span>}
                      {item.adminReply && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#DCFCE7", color: "#16A34A", fontWeight: 600 }}>REPLIED</span>}
                    </div>

                    {/* AI classification */}
                    {item.aiClassifiedAt && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: "#9B9B9B" }}>AI:</span>
                        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "#EFF6FF", color: "#2563EB", fontWeight: 600 }}>
                          {AI_CAT_EMOJI[item.aiCategory ?? ""] ?? "🤖"} {item.aiCategory}
                        </span>
                        {pc && (
                          <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: pc.bg, color: pc.color, fontWeight: 600 }}>
                            {pc.label}
                          </span>
                        )}
                        {item.aiConfidence != null && (
                          <span style={{ fontSize: 10, color: "#9B9B9B" }}>{(item.aiConfidence * 100).toFixed(0)}% conf</span>
                        )}
                      </div>
                    )}

                    {/* AI summary */}
                    {item.aiSummary && (
                      <div style={{ fontSize: 12, color: "#6B6B6B", fontStyle: "italic", marginBottom: 4 }}>
                        {item.aiSummary}
                      </div>
                    )}

                    {/* Flag badges */}
                    {item.aiFlags?.length > 0 && (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                        {item.aiFlags.map((flag) => {
                          const fb = FLAG_BADGES[flag];
                          return fb ? (
                            <span key={flag} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: fb.bg, color: fb.color, fontWeight: 600 }}>
                              {fb.emoji} {flag.replace(/_/g, " ")}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  {/* Time */}
                  <span style={{ fontSize: 10, color: "#9B9B9B", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {timeAgoLabel(item.createdAt).label}
                  </span>
                </div>

                {/* Message */}
                <div style={{ fontSize: 13, color: "#1A1A1A", lineHeight: 1.5, marginBottom: 8 }}>
                  {item.message}
                </div>

                {/* Meta */}
                <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#9B9B9B", flexWrap: "wrap", marginBottom: 8 }}>
                  {item.name && <span>👤 {item.name}</span>}
                  {item.email && <span>✉️ {item.email}</span>}
                  {item.district && <span>📍 {item.district.name}</span>}
                  {item.module && <span>📦 {item.module}</span>}
                  {item.rating && <span>{"⭐".repeat(item.rating)}</span>}
                </div>

                {/* Existing reply */}
                {item.adminReply && (
                  <div style={{ padding: "8px 12px", background: "#F0FDF4", borderRadius: 6, fontSize: 12, color: "#166534", marginBottom: 8 }}>
                    <strong>Reply:</strong> {item.adminReply}
                    {item.replySentAt && <span style={{ fontSize: 10, color: "#16A34A", marginLeft: 8 }}>📧 Email sent</span>}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <button onClick={() => setExpandedReply(isReplyOpen ? null : item.id)} style={{
                    padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", borderRadius: 5,
                    background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE",
                  }}>Reply ✉️</button>
                  {item.status === "new" && (
                    <button onClick={() => markRead(item.id)} style={{
                      padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", borderRadius: 5,
                      background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0",
                    }}>Mark Read</button>
                  )}
                  {item.status !== "archived" && (
                    <button onClick={() => archive(item.id)} style={{
                      padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", borderRadius: 5,
                      background: "#F5F5F0", color: "#9B9B9B", border: "1px solid #E8E8E4",
                    }}>Archive</button>
                  )}
                  <button onClick={() => reclassify(item.id)} disabled={reclassifying === item.id} style={{
                    padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: reclassifying === item.id ? "not-allowed" : "pointer", borderRadius: 5,
                    background: "#F5F3FF", color: "#7C3AED", border: "1px solid #DDD6FE",
                    opacity: reclassifying === item.id ? 0.5 : 1,
                  }}>{reclassifying === item.id ? "..." : "Reclassify 🔄"}</button>
                </div>

                {/* Reply section */}
                {isReplyOpen && (
                  <div style={{ marginTop: 10, padding: 12, background: "#FAFAF8", borderRadius: 8, border: "1px solid #E8E8E4" }}>
                    {templates.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <select
                          onChange={(e) => {
                            if (e.target.value) setReplyText((p) => ({ ...p, [item.id]: e.target.value }));
                            e.target.value = "";
                          }}
                          style={{ padding: "4px 8px", border: "1px solid #E8E8E4", borderRadius: 6, fontSize: 12, background: "#fff", color: "#6B6B6B" }}
                        >
                          <option value="">Quick Reply Template...</option>
                          {templates.map((t) => (
                            <option key={t.key} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <textarea
                      placeholder="Type your reply..."
                      value={replyText[item.id] ?? ""}
                      onChange={(e) => setReplyText((p) => ({ ...p, [item.id]: e.target.value }))}
                      rows={3}
                      style={{ width: "100%", padding: "8px 10px", border: "1px solid #E8E8E4", borderRadius: 6, fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                      <button
                        onClick={() => sendReply(item.id, true)}
                        disabled={sendingReply === item.id || !item.email || !(replyText[item.id]?.trim())}
                        style={{
                          padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", borderRadius: 6,
                          background: "#2563EB", color: "#fff", border: "none",
                          opacity: sendingReply === item.id || !item.email || !(replyText[item.id]?.trim()) ? 0.4 : 1,
                        }}
                      >Send Email</button>
                      <button
                        onClick={() => sendReply(item.id, false)}
                        disabled={sendingReply === item.id || !(replyText[item.id]?.trim())}
                        style={{
                          padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", borderRadius: 6,
                          background: "#F5F5F0", color: "#6B6B6B", border: "1px solid #E8E8E4",
                          opacity: sendingReply === item.id || !(replyText[item.id]?.trim()) ? 0.4 : 1,
                        }}
                      >Save Only</button>
                      {!item.email && <span style={{ fontSize: 11, color: "#9B9B9B" }}>No email — can only save</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
