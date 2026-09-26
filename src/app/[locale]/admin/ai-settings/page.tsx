/**
 * ForThePeople.in — AI Provider Settings (OpenRouter)
 */

"use client";

import { useState, useEffect } from "react";

interface AISettings {
  id: string;
  activeProvider: string;
  maxTokens: number;
  temperature: number;
  totalGeminiCalls: number;
  totalAnthropicCalls: number;
  lastError?: string | null;
  lastErrorAt?: string | null;
}

interface SettingsResponse {
  settings: AISettings;
}

export default function AISettingsPage() {
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; provider?: string; model?: string; durationMs?: number; usedFallback?: boolean; error?: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/admin/ai-settings")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function save(patch: Partial<AISettings>) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ai-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.error ?? "Save failed", false);
      } else {
        setData((prev) => prev ? { ...prev, settings: { ...prev.settings, ...json.settings } } : prev);
        showToast("Saved");
      }
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/ai-test", { method: "POST" });
      const json = await res.json();
      setTestResult(json);
    } catch (e) {
      setTestResult({ success: false, error: String(e) });
    } finally {
      setTesting(false);
    }
  }

  if (!data) {
    return <div style={{ padding: 32, color: "#6B6B6B", fontSize: 13 }}>Loading AI settings…</div>;
  }

  const s = data.settings;
  const totalCalls = s.totalGeminiCalls + s.totalAnthropicCalls;

  const cardBase: React.CSSProperties = {
    background: "#FFFFFF",
    border: "1px solid #E8E8E4",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  };

  return (
    <div style={{ padding: 24, maxWidth: 860, margin: "0 auto" }}>
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 100,
          background: toast.ok ? "#16A34A" : "#DC2626",
          color: "#fff", padding: "10px 18px", borderRadius: 8,
          fontSize: 13, fontWeight: 600, boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>
          AI Provider Settings
        </h1>
        <div style={{ fontSize: 13, color: "#6B6B6B", marginTop: 4 }}>
          OpenRouter is the unified AI gateway. Tiered model routing selects the best model per task.
        </div>
      </div>

      {/* ─── OpenRouter Active Card ─── */}
      <div style={{ ...cardBase, borderLeft: "4px solid #16A34A" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>🌐</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>OpenRouter</span>
              <span style={{ fontSize: 10, fontWeight: 700, background: "#16A34A", color: "#fff", padding: "2px 8px", borderRadius: 10 }}>ACTIVE</span>
            </div>
            <div style={{ fontSize: 12, color: "#6B6B6B" }}>Unified API gateway — 300+ models via single endpoint</div>
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginBottom: 8 }}>Model Routing</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
          {[
            // Mirrors getModelForPurpose() in src/lib/ai-provider.ts — update both together.
            { purpose: "Classification / Summaries / Format / News analysis", model: "google/gemma-4-31b-it:free", cost: "Free" },
            { purpose: "District Insights / Documents", model: "google/gemini-2.5-flash-lite", cost: "~$0.10/M in · $0.40/M out" },
            { purpose: "Large documents", model: "google/gemini-2.5-pro", cost: "~$1.25/M in · $10/M out" },
            { purpose: "Fact-check (critical accuracy)", model: "anthropic/claude-sonnet-4", cost: "~$3/M in · $15/M out" },
          ].map((r) => (
            <div key={r.purpose} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "#FAFAF8", borderRadius: 6, fontSize: 12 }}>
              <span style={{ color: "#6B6B6B" }}>{r.purpose}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-mono)", color: "#1A1A1A", fontWeight: 500, fontSize: 11 }}>{r.model}</span>
                <span style={{ fontSize: 10, color: "#16A34A", fontWeight: 600 }}>{r.cost}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6B6B6B", marginBottom: 10 }}>
          <span>Total calls: <strong style={{ fontFamily: "monospace", color: "#1A1A1A" }}>{totalCalls.toLocaleString("en-IN")}</strong></span>
          <span>API Key: <strong style={{ color: "#16A34A" }}>Configured</strong> (via OPENROUTER_API_KEY env var)</span>
        </div>

        {s.lastError && (
          <div style={{ padding: "8px 12px", background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: 8, fontSize: 11, color: "#DC2626" }}>
            Last error: {s.lastError}
            {s.lastErrorAt && ` (${new Date(s.lastErrorAt).toLocaleString("en-IN")})`}
          </div>
        )}
      </div>

      {/* ─── Advanced ─── */}
      <div style={cardBase}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>
          Advanced
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: "#6B6B6B", display: "block", marginBottom: 4 }}>
              Max Tokens: <strong>{s.maxTokens}</strong>
            </label>
            <input
              type="range" min={512} max={4096} step={128}
              value={s.maxTokens}
              onChange={(e) => setData((prev) => prev ? { ...prev, settings: { ...prev.settings, maxTokens: Number(e.target.value) } } : prev)}
              onMouseUp={(e) => save({ maxTokens: Number((e.target as HTMLInputElement).value) })}
              style={{ width: "100%" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9B9B9B" }}>
              <span>512</span><span>4096</span>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#6B6B6B", display: "block", marginBottom: 4 }}>
              Temperature: <strong>{s.temperature.toFixed(1)}</strong>
            </label>
            <input
              type="range" min={0} max={1} step={0.1}
              value={s.temperature}
              onChange={(e) => setData((prev) => prev ? { ...prev, settings: { ...prev.settings, temperature: Number(e.target.value) } } : prev)}
              onMouseUp={(e) => save({ temperature: Number((e.target as HTMLInputElement).value) })}
              style={{ width: "100%" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9B9B9B" }}>
              <span>0.0 (precise)</span><span>1.0 (creative)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Test Connection ─── */}
      <div style={cardBase}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>
          Test Connection
        </div>
        <button
          onClick={testConnection}
          disabled={testing}
          style={{
            padding: "10px 20px",
            background: testing ? "#E8E8E4" : "#2563EB",
            color: testing ? "#9B9B9B" : "#fff",
            border: "none", borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: testing ? "not-allowed" : "pointer",
          }}
        >
          {testing ? "Testing…" : "Test OpenRouter Connection"}
        </button>
        {testResult && (
          <div style={{
            marginTop: 12, padding: "12px 14px",
            background: testResult.success ? "#F0FDF4" : "#FFF1F2",
            border: `1px solid ${testResult.success ? "#BBF7D0" : "#FECDD3"}`,
            borderRadius: 8, fontSize: 12,
          }}>
            {testResult.success ? (
              <>
                ✅ <strong>Success</strong> &nbsp;·&nbsp;
                Model: <strong>{testResult.model}</strong> &nbsp;·&nbsp;
                Time: <strong>{testResult.durationMs}ms</strong>
                {testResult.usedFallback && <span style={{ color: "#D97706" }}> &nbsp;·&nbsp; Used fallback</span>}
              </>
            ) : (
              <span style={{ color: "#DC2626" }}>❌ Error: {testResult.error}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
