"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Pencil, RefreshCw } from "lucide-react";
import ModuleHelp from "@/components/admin/ModuleHelp";
import { PRICE_TABLE } from "@/lib/ai-models";

interface UsageData {
  totalCalls: number;
  totalTokens: number;
  totalCostINR: number;
  avgCostPerCall: number;
  byPurpose: Array<{ purpose: string; calls: number; tokens: number; costINR: number }>;
  byDay: Array<{ day: string; calls: number; tokens: number; costINR: number }>;
  byModel: Array<{
    model: string;
    calls: number;
    tokens: number;
    inputTokens?: number;
    outputTokens?: number;
    /** Sum of AIUsageLog.costUSD — the real per-call cost written by ai-provider.ts since Sept 2026. */
    costUSD?: number;
  }>;
}

interface Sub {
  id: string;
  name: string;
  provider: string;
  category: string;
  costINR: number;
  costUSD: number;
  billingCycle: string;
  status: string;
  dashboardUrl?: string | null;
  notes?: string | null;
  renewalDate?: string | null;
  expiryDate?: string | null;
  purchaseDate?: string | null;
  serviceName?: string | null;
  displayName?: string | null;
  plan?: string | null;
  accountEmail?: string | null;
  autoRenew?: boolean;
  exchangeRate?: number | null;
  createdAt?: string;
}

interface SubData {
  subscriptions: Sub[];
  totalMonthly: number;
  totalYearlyPerMonth: number;
}

interface FinanceSummary {
  subscriptions: {
    totalMonthlyINR: number;
    totalMonthlyUSD: number;
    paidCount: number;
    expiringSoon: number;
  };
}

interface OpenRouterUsage {
  spent: number;
  limit: number | null;
  remaining: number | null;
  percentUsed: number;
  usdToInr: number;
  source: "api" | "fallback";
  error?: string;
}

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E8E8E4",
  borderRadius: 10,
  padding: 16,
};

// Fallback OpenRouter pricing (USD per 1M tokens: [input, output]) for the
// "By Model" section. Since Sept 2026 every AIUsageLog row carries the real
// costUSD/costINR computed in src/lib/ai-provider.ts (PRICE_TABLE), so this
// map is only consulted for rows logged before that (costUSD = 0). Keep it
// in sync with the model chain in ai-provider.ts when you rotate models.
const MODEL_PRICE_USD_PER_MTOK: Record<string, [number, number]> = {
  ...PRICE_TABLE,
  // Older rows logged before the Sept 2026 model change.
  "google/gemini-2.5-flash-lite": [0.1, 0.4],
  "google/gemini-2.5-pro": [1.25, 10],
  "anthropic/claude-sonnet-4": [3, 15],
}

function estimateCostUSD(model: string, inputTokens: number, outputTokens: number): number {
  const rate = MODEL_PRICE_USD_PER_MTOK[model];
  if (rate == null) return 0;
  const [inPrice, outPrice] = rate;
  return (inputTokens / 1_000_000) * inPrice + (outputTokens / 1_000_000) * outPrice;
}

const COSTS_HELP =
  "This tab tracks real OpenRouter credit spend (live from the OpenRouter API), estimated per-model cost breakdown based on token counts, and your SaaS subscription renewals. Set renewal dates so you see countdowns for services expiring soon.";

function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null;
  const ms = new Date(date).getTime() - Date.now();
  return Math.floor(ms / 86_400_000);
}

export default function CostsTab() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [subs, setSubs] = useState<SubData | null>(null);
  const [openRouter, setOpenRouter] = useState<OpenRouterUsage | null>(null);
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [range, setRange] = useState("30");
  const [editing, setEditing] = useState<string | null>(null);
  const [editRenewal, setEditRenewal] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(() => {
    const from = new Date(Date.now() - Number(range) * 86_400_000).toISOString().slice(0, 10);
    fetch(`/api/admin/usage?from=${from}`)
      .then((r) => r.json())
      .then(setUsage)
      .catch(() => {});
    fetch("/api/admin/subscriptions")
      .then((r) => r.json())
      .then(setSubs)
      .catch(() => {});
    fetch("/api/admin/openrouter-usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setOpenRouter(d))
      .catch(() => {});
    fetch("/api/admin/finance-summary")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setFinance(d))
      .catch(() => {});
  }, [range]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const byModelWithCost = useMemo(() => {
    if (!usage) return [];
    const withCost = usage.byModel.map((m) => {
      // Prefer the cost logged per call (AIUsageLog.costUSD); fall back to the
      // price map for rows written before costUSD was populated (they carry 0).
      const logged = m.costUSD ?? 0;
      const estimatedUSD =
        logged > 0
          ? logged
          : estimateCostUSD(m.model, m.inputTokens ?? m.tokens, m.outputTokens ?? 0);
      return { ...m, estimatedUSD };
    });
    const totalUSD = withCost.reduce((s, m) => s + m.estimatedUSD, 0);
    return withCost
      .map((m) => ({
        ...m,
        pct: totalUSD > 0 ? (m.estimatedUSD / totalUSD) * 100 : 0,
      }))
      .sort((a, b) => b.estimatedUSD - a.estimatedUSD);
  }, [usage]);

  const startEdit = (sub: Sub) => {
    setEditing(sub.id);
    setEditRenewal(sub.renewalDate ? String(sub.renewalDate).slice(0, 10) : "");
  };

  const saveEdit = async (sub: Sub) => {
    setSaving(true);
    try {
      await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sub.id,
          renewalDate: editRenewal ? new Date(editRenewal).toISOString() : null,
        }),
      });
      setEditing(null);
      loadAll();
    } finally {
      setSaving(false);
    }
  };

  const or = openRouter;
  const orSpent = or?.spent ?? 0;
  const orLimit = or?.limit ?? 10;
  const orRemaining = or?.remaining ?? Math.max(0, orLimit - orSpent);
  const orPct = or?.percentUsed ?? 0;
  const usdToInr = or?.usdToInr ?? 84;
  const projectedMonthly = (() => {
    if (!usage || !usage.byDay.length) return null;
    const recent = usage.byDay.slice(-7);
    const totalUSD = recent.reduce((s, d) => s + (d.costINR ?? 0), 0) / usdToInr;
    const avgDaily = totalUSD / recent.length;
    return avgDaily * 30;
  })();

  const barColor = orPct >= 80 ? "#DC2626" : orPct >= 50 ? "#D97706" : "#16A34A";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1A1A1A" }}>
            Costs & Billing
          </h2>
          <ModuleHelp text={COSTS_HELP} size={14} />
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[{ v: "7", l: "7d" }, { v: "30", l: "30d" }, { v: "90", l: "90d" }].map((r) => (
            <button
              key={r.v}
              onClick={() => setRange(r.v)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                border: range === r.v ? "1px solid #2563EB" : "1px solid #E8E8E4",
                background: range === r.v ? "#EFF6FF" : "#fff",
                color: range === r.v ? "#2563EB" : "#6B6B6B",
              }}
            >
              {r.l}
            </button>
          ))}
        </div>
      </div>

      {/* Service cost summary */}
      {finance && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <div style={card}>
            <div style={tinyLabel}>Monthly Cost</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", fontFamily: "var(--font-mono, monospace)" }}>
              ₹{Math.round(finance.subscriptions.totalMonthlyINR).toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 4 }}>
              ~${finance.subscriptions.totalMonthlyUSD.toFixed(2)} · {finance.subscriptions.paidCount} paid service
              {finance.subscriptions.paidCount === 1 ? "" : "s"}
            </div>
          </div>
          <div style={card}>
            <div style={tinyLabel}>Yearly Cost</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", fontFamily: "var(--font-mono, monospace)" }}>
              ₹{Math.round(finance.subscriptions.totalMonthlyINR * 12).toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 4 }}>
              ~${(finance.subscriptions.totalMonthlyUSD * 12).toFixed(2)}
            </div>
          </div>
          <div style={card}>
            <div style={tinyLabel}>Expiring Soon (30d)</div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: finance.subscriptions.expiringSoon > 0 ? "#D97706" : "#16A34A",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              {finance.subscriptions.expiringSoon}
            </div>
            <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 4 }}>
              services need attention
            </div>
          </div>
        </div>
      )}

      {/* Low-credit warning */}
      {or && or.limit != null && or.remaining != null && or.remaining < or.limit * 0.3 && (
        <div
          style={{
            background: "#FEE2E2",
            border: "1px solid #FCA5A5",
            borderRadius: 10,
            padding: 12,
            color: "#991B1B",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertTriangle size={16} />
          <span>
            <strong>OpenRouter credits running low!</strong> ${or.remaining.toFixed(2)}{" "}
            remaining out of ${or.limit.toFixed(2)}. Top up at{" "}
            <a
              href="https://openrouter.ai/credits"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#991B1B", textDecoration: "underline" }}
            >
              openrouter.ai/credits
            </a>{" "}
            to avoid AI insight generation failures.
          </span>
        </div>
      )}

      {/* OpenRouter real spend card */}
      <div style={card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>
            OpenRouter Credits
            {or?.source === "fallback" && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#D97706",
                  background: "#FEF3C7",
                  padding: "2px 6px",
                  borderRadius: 4,
                }}
              >
                Estimated — API unreachable
              </span>
            )}
          </div>
          <button
            onClick={loadAll}
            style={{
              background: "none",
              border: "1px solid #E8E8E4",
              borderRadius: 6,
              padding: "4px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              color: "#6B6B6B",
            }}
          >
            <RefreshCw size={11} /> Refresh
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <div>
            <div style={tinyLabel}>Credits Used</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A" }}>
              ${orSpent.toFixed(2)}
            </div>
            <div style={{ fontSize: 11, color: "#9B9B9B" }}>
              ~₹{Math.round(orSpent * usdToInr).toLocaleString("en-IN")}
            </div>
          </div>
          <div>
            <div style={tinyLabel}>Credits Remaining</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#16A34A" }}>
              {or?.limit == null ? "—" : `$${orRemaining.toFixed(2)}`}
            </div>
            <div style={{ fontSize: 11, color: "#9B9B9B" }}>
              {or?.limit == null
                ? "Unlimited"
                : `~₹${Math.round(orRemaining * usdToInr).toLocaleString("en-IN")}`}
            </div>
          </div>
          <div>
            <div style={tinyLabel}>Credit Limit</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#2563EB" }}>
              {or?.limit == null ? "Unlimited" : `$${or.limit.toFixed(2)}`}
            </div>
            <div style={{ fontSize: 11, color: "#9B9B9B" }}>
              {or?.limit == null
                ? ""
                : `~₹${Math.round(or.limit * usdToInr).toLocaleString("en-IN")}`}
            </div>
          </div>
          <div>
            <div style={tinyLabel}>Projected Monthly</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#7C3AED" }}>
              {projectedMonthly != null ? `$${projectedMonthly.toFixed(2)}` : "—"}
            </div>
            <div style={{ fontSize: 11, color: "#9B9B9B" }}>
              Based on last 7 days
            </div>
          </div>
        </div>
        {or && or.limit != null && (
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                height: 8,
                borderRadius: 4,
                background: "#F0F0EC",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, orPct)}%`,
                  height: "100%",
                  background: barColor,
                  transition: "width 300ms",
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: "#6B6B6B", marginTop: 4 }}>
              {orPct.toFixed(1)}% used
            </div>
          </div>
        )}
      </div>

      {/* AI Usage Stats */}
      {usage && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "Total Calls", value: String(usage.totalCalls), color: "#2563EB" },
              {
                label: "Total Tokens",
                value: usage.totalTokens.toLocaleString("en-IN"),
                color: "#7C3AED",
              },
              {
                label: `Internal Cost (${range}d)`,
                value: `₹${usage.totalCostINR.toFixed(2)}`,
                color: "#16A34A",
              },
              {
                label: "Avg/Call",
                value: `₹${usage.avgCostPerCall.toFixed(3)}`,
                color: "#D97706",
              },
            ].map((s) => (
              <div key={s.label} style={card}>
                <div style={tinyLabel}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* By Purpose */}
          {usage.byPurpose.length > 0 && (
            <div style={card}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1A1A1A",
                  marginBottom: 10,
                }}
              >
                By Purpose
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {usage.byPurpose.map((p) => (
                  <div
                    key={p.purpose}
                    style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}
                  >
                    <span style={{ color: "#1A1A1A", fontWeight: 500 }}>{p.purpose}</span>
                    <span style={{ color: "#6B6B6B" }}>
                      {p.calls} calls · {p.tokens.toLocaleString("en-IN")} tokens
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* By Model with est. cost */}
          {byModelWithCost.length > 0 && (
            <div style={card}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1A1A1A",
                  marginBottom: 10,
                }}
              >
                By Model (estimated cost)
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E8E8E4" }}>
                    <th style={th}>Model</th>
                    <th style={{ ...th, textAlign: "right" }}>Calls</th>
                    <th style={{ ...th, textAlign: "right" }}>Tokens</th>
                    <th style={{ ...th, textAlign: "right" }}>Est. Cost</th>
                    <th style={{ ...th, textAlign: "right" }}>% of cost</th>
                  </tr>
                </thead>
                <tbody>
                  {byModelWithCost.map((m) => (
                    <tr key={m.model} style={{ borderBottom: "1px solid #F5F5F0" }}>
                      <td
                        style={{
                          padding: "6px 8px",
                          color: "#1A1A1A",
                          fontWeight: 500,
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {m.model}
                      </td>
                      <td style={tdRight}>{m.calls}</td>
                      <td style={tdRight}>{m.tokens.toLocaleString("en-IN")}</td>
                      <td style={tdRight}>${m.estimatedUSD.toFixed(4)}</td>
                      <td style={tdRight}>{m.pct.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 6 }}>
                Cost is the sum of per-call costUSD logged by the AI provider; rows logged
                before Sept 2026 fall back to tokens × published per-MTok rate. Free tier
                models report $0. Actual OpenRouter charges appear in the top card.
              </div>
            </div>
          )}

          {/* Daily Trend */}
          {usage.byDay.length > 0 && (
            <div style={card}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1A1A1A",
                  marginBottom: 10,
                }}
              >
                Daily Calls
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 60 }}>
                {usage.byDay.slice(-14).map((d) => {
                  const max = Math.max(...usage.byDay.map((x) => x.calls), 1);
                  return (
                    <div
                      key={d.day}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: `${(d.calls / max) * 50}px`,
                          background: "#2563EB",
                          borderRadius: 2,
                          minHeight: 2,
                        }}
                      />
                      <span style={{ fontSize: 8, color: "#9B9B9B" }}>{d.day.slice(8)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Subscriptions */}
      {subs && (
        <div style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>
              Subscriptions
            </div>
            <div style={{ fontSize: 12, color: "#6B6B6B" }}>
              Monthly:{" "}
              <strong style={{ color: "#1A1A1A" }}>
                ₹{(subs.totalMonthly + subs.totalYearlyPerMonth).toFixed(0)}
              </strong>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E8E8E4" }}>
                  <th style={th}>Service</th>
                  <th style={th}>Category</th>
                  <th style={{ ...th, textAlign: "right" }}>Cost</th>
                  <th style={{ ...th, textAlign: "center" }}>Cycle</th>
                  <th style={{ ...th, textAlign: "center" }}>Purchased</th>
                  <th style={{ ...th, textAlign: "center" }}>Renews / Expires</th>
                  <th style={{ ...th, textAlign: "center" }}>Status</th>
                  <th style={{ ...th, textAlign: "center" }}></th>
                </tr>
              </thead>
              <tbody>
                {subs.subscriptions.map((s) => {
                  const effectiveExpiry = s.expiryDate ?? s.renewalDate ?? null;
                  const d = daysUntil(effectiveExpiry);
                  const countdown =
                    d != null && d >= 0 && d <= 30
                      ? `Expires in ${d} day${d === 1 ? "" : "s"}`
                      : d != null && d < 0
                      ? `Expired ${Math.abs(d)} day${d === -1 ? "" : "s"} ago`
                      : null;
                  const countdownColor =
                    d != null && d < 0 ? "#DC2626" : d != null && d <= 7 ? "#DC2626" : d != null && d <= 30 ? "#D97706" : "#6B6B6B";
                  const purchased = s.purchaseDate ?? s.createdAt;
                  const purchasedLabel = purchased
                    ? new Date(purchased).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";
                  const renews = effectiveExpiry
                    ? new Date(effectiveExpiry).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";
                  const isEditing = editing === s.id;
                  const displayName = s.displayName ?? s.name;
                  const costLabel =
                    s.costINR > 0 || s.costUSD > 0
                      ? s.costUSD > 0
                        ? `$${s.costUSD.toFixed(2)} (₹${Math.round(s.costINR).toLocaleString("en-IN")})`
                        : `₹${s.costINR.toLocaleString("en-IN")}`
                      : "Free";

                  return (
                    <tr key={s.id} style={{ borderBottom: "1px solid #F5F5F0" }}>
                      <td style={{ padding: "6px 8px", color: "#1A1A1A", fontWeight: 500 }}>
                        {s.dashboardUrl ? (
                          <a
                            href={s.dashboardUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#2563EB", textDecoration: "none" }}
                          >
                            {displayName}
                          </a>
                        ) : (
                          displayName
                        )}
                        {s.plan && (
                          <div style={{ fontSize: 10, color: "#9B9B9B", marginTop: 1 }}>
                            {s.plan}
                            {s.accountEmail ? ` · ${s.accountEmail}` : ""}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "6px 8px", color: "#6B6B6B" }}>{s.category}</td>
                      <td style={tdRight}>{costLabel}</td>
                      <td style={{ padding: "6px 8px", textAlign: "center", color: "#9B9B9B" }}>
                        {s.billingCycle}
                      </td>
                      <td style={{ padding: "6px 8px", textAlign: "center", color: "#6B6B6B" }}>
                        {purchasedLabel}
                      </td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editRenewal}
                            onChange={(e) => setEditRenewal(e.target.value)}
                            style={{
                              padding: "3px 6px",
                              border: "1px solid #E8E8E4",
                              borderRadius: 4,
                              fontSize: 11,
                            }}
                          />
                        ) : (
                          <div>
                            <div style={{ color: "#1A1A1A" }}>{renews}</div>
                            {countdown && (
                              <div style={{ fontSize: 10, color: countdownColor, fontWeight: 600 }}>
                                {countdown}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: s.status === "active" ? "#DCFCE7" : "#FEE2E2",
                            color: s.status === "active" ? "#16A34A" : "#DC2626",
                          }}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                            <button
                              onClick={() => saveEdit(s)}
                              disabled={saving}
                              style={{
                                background: "#16A34A",
                                color: "#fff",
                                border: "none",
                                borderRadius: 4,
                                padding: "3px 8px",
                                fontSize: 10,
                                fontWeight: 600,
                                cursor: saving ? "wait" : "pointer",
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditing(null)}
                              style={{
                                background: "#fff",
                                color: "#6B6B6B",
                                border: "1px solid #E8E8E4",
                                borderRadius: 4,
                                padding: "3px 8px",
                                fontSize: 10,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(s)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#9B9B9B",
                              cursor: "pointer",
                              padding: 4,
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                            aria-label="Edit"
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const tinyLabel: React.CSSProperties = {
  fontSize: 11,
  color: "#9B9B9B",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 4,
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "6px 8px",
  color: "#9B9B9B",
  fontWeight: 600,
  fontSize: 11,
};

const tdRight: React.CSSProperties = {
  padding: "6px 8px",
  textAlign: "right",
  fontFamily: "var(--font-mono)",
  fontWeight: 600,
  color: "#1A1A1A",
};
