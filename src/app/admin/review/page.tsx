/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, RefreshCw, Clock, Brain } from "lucide-react";

interface ReviewItem {
  id: string;
  insightId: string;
  status: string;
  createdAt: string;
  insight: {
    id: string;
    module: string;
    headline: string;
    summary: string;
    sentiment: string;
    confidence: number;
    sourceUrls: string[];
    districtId: string;
    approved: boolean;
  };
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#16A34A",
  negative: "#DC2626",
  neutral: "#6B7280",
};

export default function AdminReviewPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchQueue(secret: string): Promise<boolean> {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/review", {
        headers: { "x-admin-secret": secret },
      });
      if (res.status === 401) return false;
      const json = await res.json();
      setItems(json.items ?? []);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    const ok = await fetchQueue(password);
    if (ok) {
      setAuthed(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  }

  async function handleAction(id: string, action: "approve" | "reject", secret: string) {
    setActionLoading(id);
    try {
      await fetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": secret },
        body: JSON.stringify({ id, action }),
      });
      await fetchQueue(secret);
    } finally {
      setActionLoading(null);
    }
  }

  useEffect(() => {
    // No auto-fetch — wait for explicit login
  }, []);

  if (!authed) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Brain size={24} style={{ color: "#2563EB" }} />
          <span style={{ fontSize: 20, fontWeight: 700 }}>AI Review Dashboard</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{ padding: "8px 12px", border: "1px solid #E8E8E4", borderRadius: 8, fontSize: 14, outline: "none" }}
          />
          <button
            onClick={handleLogin}
            style={{ padding: "8px 16px", background: "#2563EB", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
          >
            Login
          </button>
        </div>
        {authError && (
          <span style={{ fontSize: 12, color: "#DC2626" }}>Incorrect password</span>
        )}
      </div>
    );
  }

  const pending = items.filter((i) => i.status === "pending");
  const reviewed = items.filter((i) => i.status !== "pending");

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Brain size={22} style={{ color: "#2563EB" }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A" }}>AI Insight Review Queue</h1>
          {pending.length > 0 && (
            <span style={{ background: "#DC2626", color: "#fff", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
              {pending.length}
            </span>
          )}
        </div>
        <button
          onClick={() => fetchQueue(password)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", border: "1px solid #E8E8E4", borderRadius: 8, background: "#FAFAF8", cursor: "pointer", fontSize: 13 }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", color: "#9B9B9B", padding: "40px 0" }}>Loading queue…</div>
      )}

      {!loading && pending.length === 0 && reviewed.length === 0 && (
        <div style={{ textAlign: "center", color: "#9B9B9B", padding: "60px 0", fontSize: 13 }}>
          No items in the review queue. Run the AI analyzer to generate insights.
        </div>
      )}

      {pending.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
            Pending Review ({pending.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pending.map((item) => (
              <InsightCard
                key={item.id}
                item={item}
                onApprove={() => handleAction(item.id, "approve", password)}
                onReject={() => handleAction(item.id, "reject", password)}
                actionLoading={actionLoading === item.id}
              />
            ))}
          </div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
            Reviewed ({reviewed.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reviewed.slice(0, 20).map((item) => (
              <InsightCard key={item.id} item={item} reviewed />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InsightCard({
  item,
  onApprove,
  onReject,
  actionLoading,
  reviewed,
}: {
  item: ReviewItem;
  onApprove?: () => void;
  onReject?: () => void;
  actionLoading?: boolean;
  reviewed?: boolean;
}) {
  const { insight } = item;
  const sentimentColor = SENTIMENT_COLORS[insight.sentiment] ?? "#6B7280";
  const confidencePct = Math.round(insight.confidence * 100);

  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${reviewed ? "#E8E8E4" : "#E0ECFF"}`,
        borderRadius: 12,
        padding: "16px 18px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        opacity: reviewed ? 0.75 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 600, background: "#EFF6FF", color: "#2563EB", padding: "2px 8px", borderRadius: 20 }}>
              {insight.module}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: sentimentColor, background: `${sentimentColor}18`, padding: "2px 8px", borderRadius: 20 }}>
              {insight.sentiment}
            </span>
            <span style={{ fontSize: 11, color: "#9B9B9B", display: "flex", alignItems: "center", gap: 3 }}>
              <Clock size={10} />
              {new Date(item.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} IST
            </span>
            {reviewed && (
              <span style={{ fontSize: 11, fontWeight: 600, color: item.status === "approved" ? "#16A34A" : "#DC2626", background: item.status === "approved" ? "#DCFCE7" : "#FEE2E2", padding: "2px 8px", borderRadius: 20 }}>
                {item.status}
              </span>
            )}
          </div>

          <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.3, marginBottom: 6 }}>
            {insight.headline}
          </div>
          <p style={{ fontSize: 13, color: "#6B6B6B", lineHeight: 1.6, margin: "0 0 10px" }}>
            {insight.summary}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "#9B9B9B" }}>Confidence</span>
            <div style={{ flex: 1, height: 4, background: "#F0F0EC", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${confidencePct}%`, background: confidencePct >= 80 ? "#16A34A" : confidencePct >= 60 ? "#D97706" : "#DC2626", borderRadius: 99 }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#1A1A1A", fontFamily: "monospace" }}>{confidencePct}%</span>
          </div>

          {insight.sourceUrls.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {insight.sourceUrls.slice(0, 3).map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: "#2563EB", textDecoration: "none" }}>
                  Source {i + 1} →
                </a>
              ))}
            </div>
          )}
        </div>

        {!reviewed && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
            <button
              onClick={onApprove}
              disabled={actionLoading}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px", background: "#DCFCE7", color: "#16A34A",
                border: "1px solid #BBF7D0", borderRadius: 8, cursor: actionLoading ? "not-allowed" : "pointer",
                fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
              }}
            >
              <CheckCircle size={13} /> Approve
            </button>
            <button
              onClick={onReject}
              disabled={actionLoading}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px", background: "#FEE2E2", color: "#DC2626",
                border: "1px solid #FECACA", borderRadius: 8, cursor: actionLoading ? "not-allowed" : "pointer",
                fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
              }}
            >
              <XCircle size={13} /> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
