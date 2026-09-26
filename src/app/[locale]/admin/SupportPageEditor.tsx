"use client";

/**
 * ForThePeople.in — Support Page Editor tab
 *
 * Admin edits the bio, photo URL, cost-breakdown table, and help-links list
 * that render on /support. Everything writes to the SupportPageConfig singleton
 * row via /api/admin/support-config.
 */

import { useCallback, useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import type { CostBreakdownItem, HelpItem, SupportPageContent } from "@/lib/support-defaults";

type Loaded = SupportPageContent & { updatedAt: string | null };

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E8E8E4",
  borderRadius: 10,
  padding: 16,
  marginBottom: 16,
};

const label: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#6B6B6B",
  marginBottom: 4,
  display: "block",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  fontSize: 13,
  border: "1px solid #E8E8E4",
  borderRadius: 6,
  background: "#FAFAF8",
  fontFamily: "inherit",
  color: "#1A1A1A",
};

const smallBtn: React.CSSProperties = {
  padding: "6px 10px",
  fontSize: 12,
  border: "1px solid #E8E8E4",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};

export default function SupportPageEditor() {
  const [data, setData] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/support-config");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData({
        ...json.config,
        costBreakdown: json.config.costBreakdown ?? [],
        helpItems: json.config.helpItems ?? [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateField<K extends keyof SupportPageContent>(key: K, value: SupportPageContent[K]) {
    setData((d) => (d ? { ...d, [key]: value } : d));
  }

  function updateCost(index: number, patch: Partial<CostBreakdownItem>) {
    setData((d) => {
      if (!d) return d;
      const next = [...d.costBreakdown];
      next[index] = { ...next[index], ...patch };
      return { ...d, costBreakdown: next };
    });
  }
  function addCost() {
    setData((d) => (d ? { ...d, costBreakdown: [...d.costBreakdown, { label: "", pct: 0, color: "#6B7280" }] } : d));
  }
  function removeCost(index: number) {
    setData((d) => (d ? { ...d, costBreakdown: d.costBreakdown.filter((_, i) => i !== index) } : d));
  }

  function updateHelp(index: number, patch: Partial<HelpItem>) {
    setData((d) => {
      if (!d) return d;
      const next = [...d.helpItems];
      next[index] = { ...next[index], ...patch };
      return { ...d, helpItems: next };
    });
  }
  function addHelp() {
    setData((d) => (d ? { ...d, helpItems: [...d.helpItems, { label: "", desc: "", url: "", icon: "🔗", external: true }] } : d));
  }
  function removeHelp(index: number) {
    setData((d) => (d ? { ...d, helpItems: d.helpItems.filter((_, i) => i !== index) } : d));
  }

  async function save() {
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/support-config", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bioName: data.bioName,
          bioSubtitle: data.bioSubtitle,
          bioText: data.bioText,
          photoUrl: data.photoUrl,
          costBreakdown: data.costBreakdown,
          helpItems: data.helpItems,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const j = await res.json();
      setSavedAt(j.updatedAt ?? new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const costTotal = data?.costBreakdown.reduce((a, c) => a + (c.pct || 0), 0) ?? 0;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          Support Page Editor
        </h1>
        <p style={{ fontSize: 13, color: "#6B6B6B", marginTop: 6 }}>
          Edit bio, photo, cost breakdown, and &quot;other ways to help&quot; items on{" "}
          <a href="/en/support" target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB" }}>/support</a>.
          Changes save to the DB and take effect on next page load.
        </p>
      </div>

      {loading && <p style={{ color: "#6B6B6B" }}>Loading…</p>}
      {error && (
        <div style={{ ...card, background: "#FEF2F2", borderColor: "#FECACA", color: "#B91C1C" }}>
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Bio */}
          <div style={card}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Bio</h2>
            <div style={{ marginBottom: 10 }}>
              <label style={label}>Name</label>
              <input style={input} value={data.bioName} onChange={(e) => updateField("bioName", e.target.value)} maxLength={80} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={label}>Subtitle</label>
              <input style={input} value={data.bioSubtitle} onChange={(e) => updateField("bioSubtitle", e.target.value)} maxLength={200} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={label}>Bio text (use blank line to separate paragraphs; **word** for bold)</label>
              <textarea
                style={{ ...input, minHeight: 220, fontFamily: "var(--font-mono, monospace)", fontSize: 12, lineHeight: 1.6 }}
                value={data.bioText}
                onChange={(e) => updateField("bioText", e.target.value)}
              />
            </div>
            <div>
              <label style={label}>Photo URL (path under /public or absolute URL)</label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input style={{ ...input, flex: 1 }} value={data.photoUrl} onChange={(e) => updateField("photoUrl", e.target.value)} maxLength={500} />
                {data.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.photoUrl} alt="preview" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid #E8E8E4" }} />
                )}
              </div>
            </div>
          </div>

          {/* Cost breakdown */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Cost Breakdown</h2>
              <div style={{ fontSize: 12, color: costTotal === 100 ? "#16A34A" : "#DC2626", fontWeight: 600 }}>
                Total: {costTotal}%{costTotal !== 100 && " (should sum to 100)"}
              </div>
            </div>
            {data.costBreakdown.map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 40px", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <input style={input} placeholder="Label" value={row.label} onChange={(e) => updateCost(i, { label: e.target.value })} />
                <input style={input} type="number" min={0} max={100} value={row.pct} onChange={(e) => updateCost(i, { pct: Number(e.target.value) || 0 })} />
                <input style={{ ...input, fontFamily: "var(--font-mono, monospace)" }} placeholder="#2563EB" value={row.color} onChange={(e) => updateCost(i, { color: e.target.value })} />
                <button onClick={() => removeCost(i)} title="Remove" style={{ ...smallBtn, color: "#DC2626", border: "none", background: "transparent" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button onClick={addCost} style={smallBtn}><Plus size={12} /> Add row</button>
          </div>

          {/* Help items */}
          <div style={card}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Other Ways to Help</h2>
            {data.helpItems.map((item, i) => (
              <div key={i} style={{ border: "1px solid #F0F0EC", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 60px 40px", gap: 8, marginBottom: 6, alignItems: "center" }}>
                  <input style={{ ...input, textAlign: "center" }} placeholder="icon" value={item.icon} onChange={(e) => updateHelp(i, { icon: e.target.value })} maxLength={4} />
                  <input style={input} placeholder="Label" value={item.label} onChange={(e) => updateHelp(i, { label: e.target.value })} />
                  <label style={{ fontSize: 11, color: "#6B6B6B", display: "flex", alignItems: "center", gap: 4 }}>
                    <input type="checkbox" checked={item.external} onChange={(e) => updateHelp(i, { external: e.target.checked })} />
                    ext
                  </label>
                  <button onClick={() => removeHelp(i)} title="Remove" style={{ ...smallBtn, color: "#DC2626", border: "none", background: "transparent" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <input style={{ ...input, marginBottom: 6 }} placeholder="Description" value={item.desc} onChange={(e) => updateHelp(i, { desc: e.target.value })} />
                <input style={input} placeholder="URL" value={item.url} onChange={(e) => updateHelp(i, { url: e.target.value })} />
              </div>
            ))}
            <button onClick={addHelp} style={smallBtn}><Plus size={12} /> Add item</button>
          </div>

          {/* Save */}
          <div style={{ position: "sticky", bottom: 0, background: "#FAFAF8", padding: "12px 0", display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={save}
              disabled={saving}
              style={{
                padding: "10px 22px", fontSize: 13, fontWeight: 700, color: "#fff",
                background: saving ? "#9B9B9B" : "#2563EB",
                border: "none", borderRadius: 8, cursor: saving ? "not-allowed" : "pointer",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              <Save size={14} /> {saving ? "Saving…" : "Save changes"}
            </button>
            {savedAt && !saving && <span style={{ fontSize: 12, color: "#16A34A" }}>Saved {new Date(savedAt).toLocaleTimeString()}</span>}
            <span style={{ fontSize: 12, color: "#9B9B9B", marginLeft: "auto" }}>
              Last updated: {data.updatedAt ? new Date(data.updatedAt).toLocaleString() : "never"}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
