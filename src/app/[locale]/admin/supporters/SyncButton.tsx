/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ synced?: number; skipped?: number; total?: number; error?: string } | null>(null);
  const router = useRouter();

  async function doSync() {
    if (!confirm("Fetch last 100 payments from Razorpay and sync missing ones to database?")) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/sync-razorpay", { method: "POST" });
      const json = await res.json();
      setResult(json);
      if (!json.error) router.refresh();
    } catch (e) {
      setResult({ error: String(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button
        onClick={doSync}
        disabled={loading}
        style={{
          padding: "8px 16px",
          background: loading ? "#E8E8E4" : "#2563EB",
          color: loading ? "#9B9B9B" : "#fff",
          border: "none", borderRadius: 8,
          fontSize: 13, fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Syncing…" : "🔄 Sync Razorpay Payments"}
      </button>
      {result && !result.error && (
        <span style={{ fontSize: 12, color: "#16A34A" }}>
          ✅ Synced {result.synced} new · Skipped {result.skipped} existing (of {result.total} total)
        </span>
      )}
      {result?.error && (
        <span style={{ fontSize: 12, color: "#DC2626" }}>❌ {result.error}</span>
      )}
    </div>
  );
}
