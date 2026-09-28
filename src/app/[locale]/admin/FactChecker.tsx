/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useState, useEffect } from "react";
import { timeAgoLabel } from "@/lib/utils/timeAgo";

interface ModuleStatus {
  slug: string;
  name: string;
  icon: string;
  category: string;
  lastChecked: string | null;
  status: "never" | "running" | "passed" | "issues" | "failed";
  itemsChecked: number;
  issuesFound: number;
  staleItems: number;
  checkedBy: string | null;
}

/** "12m ago" (the shared formatter, src/lib/utils/timeAgo.ts); "" when never checked. */
const timeAgo = (dateStr: string | null): string => (dateStr ? timeAgoLabel(dateStr).label : "");

const CATEGORY_ICONS: Record<string, string> = {
  "Quick Access": "⚡",
  "Live Data": "📡",
  "Governance": "🏛️",
  "Community": "🏘️",
  "Transparency": "🔍",
  "Local Info": "📌",
};

export function FactChecker() {
  const [district, setDistrict] = useState("");
  const [districts, setDistricts] = useState<{ slug: string; name: string; state?: { slug: string; name: string } }[]>([]);
  const [modules, setModules] = useState<ModuleStatus[]>([]);
  const [loading, setLoading] = useState<string | null>(null); // module slug or "all"
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Load districts
  useEffect(() => {
    fetch("/api/admin/districts")
      .then((r) => r.json())
      .then((json) => {
        if (json.districts?.length > 0) {
          setDistricts(json.districts);
          setDistrict((prev) => prev || json.districts[0].slug);
        }
      })
      .catch(() => {});
  }, []);

  // Load module statuses when district changes
  useEffect(() => {
    if (!district) return;
    setLoadingStatus(true);
    fetch(`/api/admin/fact-check-status?district=${district}`)
      .then((r) => r.json())
      .then((json) => { setModules(json.modules ?? []); })
      .catch(() => {})
      .finally(() => setLoadingStatus(false));
  }, [district]);

  async function checkModule(slug: string) {
    if (loading) return;
    setLoading(slug);
    // Optimistically mark as running
    setModules((prev) => prev.map((m) => m.slug === slug ? { ...m, status: "running" } : m));
    try {
      const res = await fetch("/api/admin/fact-check-module", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ district, module: slug }),
      });
      const json = await res.json() as { itemsChecked: number; issuesFound: number; staleItems: number };
      setModules((prev) => prev.map((m) =>
        m.slug === slug ? {
          ...m,
          status: json.issuesFound > 0 ? "issues" : "passed",
          itemsChecked: json.itemsChecked,
          issuesFound: json.issuesFound,
          staleItems: json.staleItems,
          lastChecked: new Date().toISOString(),
          checkedBy: "opus",
        } : m
      ));
    } catch {
      setModules((prev) => prev.map((m) => m.slug === slug ? { ...m, status: "failed" } : m));
    } finally {
      setLoading(null);
    }
  }

  async function runAll() {
    if (loading) return;
    setLoading("all");
    setModules((prev) => prev.map((m) => ["overview", "interactive-map", "services", "file-rti"].includes(m.slug) ? m : { ...m, status: "running" }));
    try {
      await fetch("/api/admin/fact-check-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ district }),
      });
      // Reload statuses
      const res = await fetch(`/api/admin/fact-check-status?district=${district}`);
      const json = await res.json();
      setModules(json.modules ?? []);
    } catch {
      // silently fail — next refresh will show status
    } finally {
      setLoading(null);
    }
  }

  const categories = [...new Set(modules.map((m) => m.category))];
  const totalIssues = modules.reduce((s, m) => s + m.issuesFound, 0);
  const totalChecked = modules.filter((m) => m.status !== "never").length;

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 12, overflow: "hidden", marginTop: 24 }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px",
        borderBottom: "1px solid #F0F0EC",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 10,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>🔍 Fact Checker — Powered by Opus</div>
          {totalChecked > 0 && (
            <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 2 }}>
              {totalChecked}/{modules.length} modules checked
              {totalIssues > 0 && <span style={{ color: "#D97706", marginLeft: 8 }}>⚠️ {totalIssues} issues</span>}
              {totalIssues === 0 && totalChecked === modules.length && <span style={{ color: "#16A34A", marginLeft: 8 }}>✅ All passing</span>}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            style={{ padding: "5px 10px", border: "1px solid #E8E8E4", borderRadius: 6, fontSize: 12, background: "#FAFAF8" }}
          >
            {Object.entries(
              districts.reduce((acc, d) => {
                const stateName = d.state?.name ?? "Other";
                (acc[stateName] = acc[stateName] || []).push(d);
                return acc;
              }, {} as Record<string, typeof districts>)
            ).map(([stateName, stateDistricts]) => (
              <optgroup key={stateName} label={stateName}>
                {stateDistricts.map((d) => (
                  <option key={d.slug} value={d.slug}>{d.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            onClick={runAll}
            disabled={loading !== null}
            style={{
              padding: "7px 14px",
              background: loading ? "#E8E8E4" : "#DC2626",
              color: loading ? "#9B9B9B" : "#fff",
              border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {loading === "all" ? "⏳ Running…" : "🔍 Run Full Fact Check"}
          </button>
        </div>
      </div>

      {/* Category sections */}
      {loadingStatus ? (
        <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: "#9B9B9B" }}>Loading…</div>
      ) : (
        <div style={{ padding: 16 }}>
          {categories.map((category) => {
            const catModules = modules.filter((m) => m.category === category);
            return (
              <div key={category} style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#9B9B9B",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}>
                  <span>{CATEGORY_ICONS[category] ?? "•"}</span>
                  {category}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 8 }}>
                  {catModules.map((mod) => {
                    const isRunning = loading === mod.slug || (loading === "all" && !["overview", "interactive-map", "services", "file-rti"].includes(mod.slug));
                    const statusNow = isRunning ? "running" : mod.status;
                    const borderColor =
                      statusNow === "passed" ? "#BBF7D0" :
                      statusNow === "issues" ? "#FDE68A" :
                      statusNow === "running" ? "#BFDBFE" :
                      statusNow === "failed" ? "#FECACA" :
                      "#E8E8E4";
                    const bgColor =
                      statusNow === "passed" ? "#F0FDF4" :
                      statusNow === "issues" ? "#FFFBEB" :
                      statusNow === "running" ? "#EFF6FF" :
                      statusNow === "failed" ? "#FEF2F2" :
                      "#FAFAF8";

                    return (
                      <div key={mod.slug} style={{
                        border: `1px solid ${borderColor}`,
                        borderRadius: 8,
                        padding: "10px 12px",
                        background: bgColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        opacity: isRunning ? 0.8 : 1,
                      }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ fontSize: 13 }}>{mod.icon}</span>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mod.name}</span>
                          </div>
                          <div style={{ fontSize: 10, color: "#9B9B9B", marginTop: 3 }}>
                            {statusNow === "never" && "Never checked"}
                            {statusNow === "running" && "⏳ Checking…"}
                            {statusNow === "passed" && `✅ ${mod.itemsChecked} items · ${timeAgo(mod.lastChecked)}`}
                            {statusNow === "issues" && `⚠️ ${mod.issuesFound} issues · ${timeAgo(mod.lastChecked)}`}
                            {statusNow === "failed" && `❌ Failed · ${timeAgo(mod.lastChecked)}`}
                          </div>
                        </div>
                        <button
                          onClick={() => checkModule(mod.slug)}
                          disabled={loading !== null}
                          style={{
                            flexShrink: 0,
                            padding: "3px 9px",
                            background: loading !== null ? "#E8E8E4" : "#2563EB",
                            color: loading !== null ? "#9B9B9B" : "#fff",
                            border: "none",
                            borderRadius: 5,
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: loading !== null ? "not-allowed" : "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {statusNow === "never" ? "Check" : "Re-check"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
