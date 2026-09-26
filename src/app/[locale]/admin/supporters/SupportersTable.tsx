/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useState, useMemo } from "react";

export interface SupporterRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  amount: number;
  tier: string;
  status: string;
  method: string | null;
  isRecurring: boolean;
  subscriptionStatus: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  districtName: string | null;
  districtSlug: string | null;
  districtId: string | null;
  stateName: string | null;
  stateSlug: string | null;
  stateId: string | null;
  socialLink: string | null;
  badgeLevel: string | null;
  badgeType: string | null;
  message: string | null;
  isPublic: boolean;
  source: string;
  createdAt: string;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_COLORS: Record<string, string> = {
  success: "#16A34A",
  active: "#16A34A",
  failed: "#DC2626",
  expired: "#DC2626",
  pending: "#D97706",
  paused: "#D97706",
  cancelled: "#9B9B9B",
  refunded: "#7C3AED",
};

function exportCSV(supporters: SupporterRow[]) {
  const headers = ["Name", "Email", "Amount", "Tier", "Status", "Subscription Status", "Recurring", "District", "State", "Social Link", "Badge Level", "Activated", "Expires", "Created", "Message"];
  const rows = supporters.map((s) => [
    s.name, s.email ?? "", s.amount.toString(), s.tier, s.status,
    s.subscriptionStatus ?? "", s.isRecurring ? "Yes" : "No",
    s.districtName ?? "", s.stateName ?? "", s.socialLink ?? "",
    s.badgeLevel ?? "", fmtDate(s.activatedAt), fmtDate(s.expiresAt),
    fmtDate(s.createdAt), s.message ?? "",
  ]);

  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `forthepeople-supporters-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SupportersTable({
  supporters,
  onEdit,
}: {
  supporters: SupporterRow[];
  onEdit?: (s: SupporterRow) => void;
}) {
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"flat" | "grouped">("flat");

  const filtered = useMemo(() => {
    let list = supporters;

    if (tierFilter !== "all") {
      list = list.filter((s) => s.tier === tierFilter);
    }
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        list = list.filter((s) => s.subscriptionStatus === "active");
      } else if (statusFilter === "expired") {
        list = list.filter((s) => s.subscriptionStatus === "expired");
      } else if (statusFilter === "cancelled") {
        list = list.filter((s) => s.subscriptionStatus === "cancelled");
      } else if (statusFilter === "paused") {
        list = list.filter((s) => s.subscriptionStatus === "paused");
      } else {
        list = list.filter((s) => s.status === statusFilter);
      }
    }

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "amount-high": return b.amount - a.amount;
        case "amount-low": return a.amount - b.amount;
        case "oldest": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "tenure": {
          const at = a.activatedAt ? new Date(a.activatedAt).getTime() : Infinity;
          const bt = b.activatedAt ? new Date(b.activatedAt).getTime() : Infinity;
          return at - bt;
        }
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return list;
  }, [supporters, tierFilter, statusFilter, sortBy]);

  // Grouped view: state → district
  const grouped = useMemo(() => {
    if (viewMode !== "grouped") return null;
    const groups: Record<string, { supporters: SupporterRow[]; districts: Record<string, SupporterRow[]> }> = {};
    const noDistrict: SupporterRow[] = [];
    const oneTime: SupporterRow[] = [];

    for (const s of filtered) {
      if (!s.isRecurring) {
        oneTime.push(s);
        continue;
      }
      if (!s.stateName && !s.districtName) {
        noDistrict.push(s);
        continue;
      }
      const stateKey = s.stateName ?? "Unknown State";
      if (!groups[stateKey]) groups[stateKey] = { supporters: [], districts: {} };
      if (s.districtName) {
        if (!groups[stateKey].districts[s.districtName]) groups[stateKey].districts[s.districtName] = [];
        groups[stateKey].districts[s.districtName].push(s);
      } else {
        groups[stateKey].supporters.push(s);
      }
    }

    return { groups, noDistrict, oneTime };
  }, [filtered, viewMode]);

  return (
    <div>
      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}
          style={{ padding: "7px 12px", border: "1px solid #E8E8E4", borderRadius: 8, fontSize: 13, background: "#FAFAF8" }}>
          <option value="all">All Tiers</option>
          <option value="chai">Chai</option>
          <option value="founder">Founder</option>
          <option value="district">District</option>
          <option value="state">State</option>
          <option value="patron">Patron</option>
          <option value="custom">Custom</option>
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "7px 12px", border: "1px solid #E8E8E4", borderRadius: 8, fontSize: 13, background: "#FAFAF8" }}>
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="active">Active Sub</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
          <option value="paused">Paused</option>
          <option value="failed">Failed</option>
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: "7px 12px", border: "1px solid #E8E8E4", borderRadius: 8, fontSize: 13, background: "#FAFAF8" }}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="amount-high">Amount ↓</option>
          <option value="amount-low">Amount ↑</option>
          <option value="tenure">Longest Tenure</option>
        </select>

        <div style={{ display: "flex", border: "1px solid #E8E8E4", borderRadius: 8, overflow: "hidden" }}>
          <button onClick={() => setViewMode("flat")}
            style={{ padding: "7px 14px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: viewMode === "flat" ? "#2563EB" : "#FAFAF8", color: viewMode === "flat" ? "#fff" : "#6B6B6B" }}>
            Flat List
          </button>
          <button onClick={() => setViewMode("grouped")}
            style={{ padding: "7px 14px", fontSize: 12, fontWeight: 600, border: "none", borderLeft: "1px solid #E8E8E4", cursor: "pointer", background: viewMode === "grouped" ? "#2563EB" : "#FAFAF8", color: viewMode === "grouped" ? "#fff" : "#6B6B6B" }}>
            Grouped
          </button>
        </div>

        <div style={{ flex: 1 }} />

        <button onClick={() => exportCSV(filtered)}
          style={{ padding: "7px 14px", background: "#16A34A", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          📥 Export CSV ({filtered.length})
        </button>

        <span style={{ fontSize: 12, color: "#9B9B9B" }}>
          {filtered.length} of {supporters.length}
        </span>
      </div>

      {/* Grouped View */}
      {viewMode === "grouped" && grouped ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Object.entries(grouped.groups).map(([stateName, { supporters: stateSubs, districts }]) => (
            <div key={stateName} style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>{stateName}</div>
              {Object.entries(districts).map(([distName, dSubs]) => (
                <div key={distName} style={{ marginLeft: 16, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#6B6B6B" }}>
                    └─ {distName}: {dSubs.length} sponsor{dSubs.length !== 1 ? "s" : ""}{" "}
                    <span style={{ color: "#9B9B9B" }}>
                      ({dSubs.map((s) => `${s.name} ₹${s.amount.toLocaleString("en-IN")}${s.isRecurring ? "/mo" : ""}`).join(", ")})
                    </span>
                  </div>
                </div>
              ))}
              {stateSubs.length > 0 && (
                <div style={{ marginLeft: 16, fontSize: 13, color: "#9B9B9B" }}>
                  └─ State-level: {stateSubs.length} subscriber{stateSubs.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          ))}

          {grouped.noDistrict.length > 0 && (
            <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
                No District (Monthly/Patron): {grouped.noDistrict.length} supporter{grouped.noDistrict.length !== 1 ? "s" : ""}
              </div>
            </div>
          )}

          {grouped.oneTime.length > 0 && (
            <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>
                One-Time Contributors: {grouped.oneTime.length} total · ₹{grouped.oneTime.reduce((t, s) => t + s.amount, 0).toLocaleString("en-IN")}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Flat Table View */
        filtered.length === 0 ? (
          <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 40, textAlign: "center", fontSize: 13, color: "#9B9B9B" }}>
            No supporters match the current filters.
          </div>
        ) : (
          <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 12, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 900 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E8E8E4", background: "#FAFAF8" }}>
                  {["Name", "Email", "Tier", "Amount", "Status", "Sub Status", "District/State", "Social", "Activated", "Expires", "Badge", "Created"].map((h) => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const displayStatus = s.isRecurring ? (s.subscriptionStatus ?? s.status) : s.status;
                  return (
                    <tr
                      key={s.id}
                      onClick={onEdit ? () => onEdit(s) : undefined}
                      style={{
                        borderBottom: i < filtered.length - 1 ? "1px solid #F5F5F0" : "none",
                        cursor: onEdit ? "pointer" : "default",
                      }}
                    >
                      <td style={{ padding: "8px 10px", fontWeight: 500 }}>
                        {s.name}
                        {!s.isPublic && <span style={{ fontSize: 10, color: "#D97706", marginLeft: 4 }}>(hidden)</span>}
                        {s.source === "manual" && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              padding: "1px 5px",
                              borderRadius: 3,
                              background: "#F3F4F6",
                              color: "#6B6B6B",
                              marginLeft: 6,
                            }}
                            title="Added manually via admin panel"
                          >
                            MANUAL
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "8px 10px", color: "#6B6B6B" }}>{s.email ?? "—"}</td>
                      <td style={{ padding: "8px 10px", color: "#6B6B6B" }}>
                        {s.tier}{s.isRecurring ? " 🔄" : ""}
                      </td>
                      <td style={{ padding: "8px 10px", fontFamily: "var(--font-mono, monospace)", fontWeight: 600, color: "#2563EB" }}>
                        ₹{s.amount.toLocaleString("en-IN")}{s.isRecurring ? "/mo" : ""}
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <span style={{ background: `${STATUS_COLORS[s.status] ?? "#9B9B9B"}15`, color: STATUS_COLORS[s.status] ?? "#9B9B9B", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        {s.subscriptionStatus ? (
                          <span style={{ background: `${STATUS_COLORS[s.subscriptionStatus] ?? "#9B9B9B"}15`, color: STATUS_COLORS[s.subscriptionStatus] ?? "#9B9B9B", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
                            {s.subscriptionStatus}
                          </span>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "8px 10px", color: "#6B6B6B", fontSize: 11 }}>
                        {s.districtName ?? s.stateName ?? "—"}
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        {(() => {
                          const href = s.socialLink && s.socialLink.startsWith("http") ? s.socialLink : null;
                          return href ? (
                            <a href={href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#2563EB", textDecoration: "none" }}>
                              Link
                            </a>
                          ) : (s.socialLink ? <span style={{ fontSize: 11, color: "#DC2626" }} title="Raw text — edit to clean">{s.socialLink}</span> : "—");
                        })()}
                      </td>
                      <td style={{ padding: "8px 10px", color: "#6B6B6B", whiteSpace: "nowrap", fontSize: 11 }}>{fmtDate(s.activatedAt)}</td>
                      <td style={{ padding: "8px 10px", color: "#6B6B6B", whiteSpace: "nowrap", fontSize: 11 }}>
                        {fmtDate(s.expiresAt)}
                        {s.expiresAt && new Date(s.expiresAt) < new Date() && (
                          <span style={{ color: "#DC2626", marginLeft: 4, fontSize: 10 }}>PAST</span>
                        )}
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        {s.badgeLevel ? (
                          <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: displayStatus === "active" ? "#92400E" : "#9B9B9B" }}>
                            {s.badgeLevel}
                          </span>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "8px 10px", color: "#6B6B6B", whiteSpace: "nowrap", fontSize: 11 }}>{fmtDate(s.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
