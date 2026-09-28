"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  Database,
  Server,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Play,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ModuleHelp from "@/components/admin/ModuleHelp";

type ModuleKey = "weather" | "news" | "crops" | "insights";

interface HealthData {
  database: { status: string; responseMs: number; activeDistricts: number; totalNewsItems: number };
  redis: { status: string; responseMs: number };
  scrapers: {
    last24h: { total: number; successful: number; failed: number };
    recentLogs: Array<{
      id: string;
      jobName: string;
      status: string;
      recordsAffected: number;
      durationMs: number;
      error: string | null;
      createdAt: string;
    }>;
  };
  dataFreshness: Array<{
    district: string;
    slug: string;
    weather: string | null;
    news: string | null;
    crops: string | null;
    aiInsights: string | null;
    errors: {
      weather: string | null;
      news: string | null;
      crops: string | null;
      insights: string | null;
    };
  }>;
  pendingItems: { reviews: number; feedback: number; alerts: number; unreadAlerts: number };
  contributions: { last7days: number; totalRevenue: number };
  expectedIntervals: Record<ModuleKey, number>;
  serverTimeMs: number;
  timestamp: string;
}

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E8E8E4",
  borderRadius: 10,
  padding: 16,
};

function freshnessColor(
  iso: string | null,
  expectedMin: number
): React.CSSProperties {
  if (!iso) return { background: "#F3F4F6", color: "#6B6B6B" };
  const age = Date.now() - new Date(iso).getTime();
  const expected = expectedMin * 60_000;
  if (age < expected) return { background: "#DCFCE7", color: "#16A34A" };
  if (age < expected * 3) return { background: "#FEF3C7", color: "#D97706" };
  return { background: "#FEE2E2", color: "#DC2626" };
}

function relTime(iso: string | null): string {
  if (!iso) return "No data";
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "Unknown";
  }
}

const MODULE_LABEL: Record<ModuleKey, string> = {
  weather: "Weather",
  news: "News",
  crops: "Crops",
  insights: "AI Insights",
};

const SYSTEM_HELP = `This tab monitors your infrastructure in real-time.

• Database: PostgreSQL connection + response time
• Redis: Cache connection + response time
• Server: Total API response time

Data Freshness shows when each data type last updated per district:
🟢 Green = updated within expected interval
🟡 Yellow = delayed (1–3× expected interval)
🔴 Red = failing or stale (>3× expected interval)
⬜ No data = never been scraped for this district

Expected intervals: Weather 5min, News 1hr, Crops 15min, AI Insights 2hrs.
Click "Run Now" to manually trigger a scraper for any district.`;

export default function SystemHealth() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>("");
  const [openCell, setOpenCell] = useState<string | null>(null);
  const [runningCell, setRunningCell] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<Set<string>>(new Set());
  const [logFilter, setLogFilter] = useState<string>("all");
  const [logLimit, setLogLimit] = useState<number>(20);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/system-health")
      .then((r) => r.json())
      .then((d: HealthData) => {
        setData(d);
        setLastRefresh(new Date().toLocaleTimeString("en-IN", { hour12: false }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const runScraper = useCallback(
    async (districtSlug: string, job: ModuleKey) => {
      const key = `${districtSlug}:${job}`;
      setRunningCell(key);
      try {
        await fetch("/api/admin/run-scraper", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ district: districtSlug, job }),
        });
      } catch {
        // ignore
      } finally {
        setRunningCell(null);
        setOpenCell(null);
        fetchData();
      }
    },
    [fetchData]
  );

  const clearOldLogs = useCallback(async () => {
    if (!confirm("Delete ScraperLog entries older than 30 days?")) return;
    await fetch("/api/admin/scraper-logs?olderThanDays=30", { method: "DELETE" }).catch(() => {});
    fetchData();
  }, [fetchData]);

  const toggleLogExpand = (id: string) => {
    setExpandedLog((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredLogs = useMemo(() => {
    if (!data) return [];
    const logs = data.scrapers.recentLogs;
    if (logFilter === "all") return logs.slice(0, logLimit);
    return logs
      .filter((l) => l.jobName.toLowerCase().includes(logFilter.toLowerCase()))
      .slice(0, logLimit);
  }, [data, logFilter, logLimit]);

  if (loading && !data) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#9B9B9B" }}>
        <RefreshCw size={20} style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ marginTop: 8, fontSize: 13 }}>Loading system health...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (!data) return null;

  const s24 = data.scrapers.last24h;
  const successPct = s24.total > 0 ? (s24.successful / s24.total) * 100 : 100;

  // From vercel.json via the API (cronIntervalsFor); no client copy to drift.
  const expected: Partial<Record<ModuleKey, number>> = data.expectedIntervals ?? {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1A1A1A" }}>
            System Health
          </h2>
          <ModuleHelp text={SYSTEM_HELP} size={14} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#9B9B9B" }}>
            Last refreshed: {lastRefresh}
          </span>
          <button
            onClick={fetchData}
            style={{
              background: "none",
              border: "1px solid #E8E8E4",
              borderRadius: 6,
              padding: "4px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: "#6B6B6B",
            }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Service Status */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Database size={16} color="#6B6B6B" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Database
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {data.database.status === "healthy" ? (
              <CheckCircle size={16} color="#16A34A" />
            ) : (
              <XCircle size={16} color="#DC2626" />
            )}
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: data.database.status === "healthy" ? "#16A34A" : "#DC2626",
              }}
            >
              {data.database.status === "healthy" ? "Healthy" : "Error"}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 6 }}>
            {data.database.responseMs}ms · {data.database.activeDistricts} active districts
          </div>
        </div>

        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Server size={16} color="#6B6B6B" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Redis
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {data.redis.status === "healthy" ? (
              <CheckCircle size={16} color="#16A34A" />
            ) : (
              <XCircle size={16} color="#DC2626" />
            )}
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: data.redis.status === "healthy" ? "#16A34A" : "#DC2626",
              }}
            >
              {data.redis.status === "healthy" ? "Healthy" : "Error"}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 6 }}>
            {data.redis.responseMs}ms response time
          </div>
        </div>

        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Activity size={16} color="#6B6B6B" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Server
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle size={16} color="#16A34A" />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#16A34A" }}>
              Online
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 6 }}>
            Total response: {data.serverTimeMs}ms
          </div>
        </div>
      </div>

      {/* Data Freshness */}
      <div style={card}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#1A1A1A",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Clock size={14} /> Data Freshness
          <span style={{ fontSize: 11, color: "#9B9B9B", fontWeight: 500 }}>
            · click any cell for details
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E8E8E4" }}>
                <th style={th}>District</th>
                <th style={thc}>Weather</th>
                <th style={thc}>News</th>
                <th style={thc}>Crops</th>
                <th style={thc}>AI Insights</th>
                <th style={thc}>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.dataFreshness.map((d) => (
                <tr key={d.slug} style={{ borderBottom: "1px solid #F5F5F0" }}>
                  <td style={{ padding: "6px 8px", fontWeight: 600, color: "#1A1A1A" }}>
                    {d.district}
                  </td>
                  {(["weather", "news", "crops", "insights"] as ModuleKey[]).map((mod) => {
                    const iso =
                      mod === "weather"
                        ? d.weather
                        : mod === "news"
                        ? d.news
                        : mod === "crops"
                        ? d.crops
                        : d.aiInsights;
                    const err = d.errors?.[mod] ?? null;
                    const cellKey = `${d.slug}:${mod}`;
                    const isOpen = openCell === cellKey;
                    const running = runningCell === cellKey;
                    return (
                      <td
                        key={mod}
                        style={{ padding: "4px 6px", textAlign: "center", position: "relative" }}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenCell(isOpen ? null : cellKey)}
                          style={{
                            ...freshnessColor(iso, expected[mod] ?? 60),
                            padding: "3px 10px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          {relTime(iso)}
                        </button>
                        {isOpen && (
                          <div
                            style={{
                              position: "absolute",
                              zIndex: 10,
                              top: "calc(100% + 4px)",
                              left: "50%",
                              transform: "translateX(-50%)",
                              background: "#FFFFFF",
                              border: "1px solid #E8E8E4",
                              borderRadius: 8,
                              padding: 10,
                              width: 240,
                              fontSize: 11,
                              textAlign: "left",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                              color: "#1A1A1A",
                            }}
                          >
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>
                              {MODULE_LABEL[mod]} · {d.district}
                            </div>
                            <div style={{ color: "#6B6B6B", marginBottom: 2 }}>
                              Last run: {iso ? new Date(iso).toLocaleString("en-IN") : "never"}
                            </div>
                            <div style={{ color: "#6B6B6B", marginBottom: 6 }}>
                              Expected every {expected[mod] ?? 60} min
                            </div>
                            {err && (
                              <div
                                style={{
                                  background: "#FEE2E2",
                                  color: "#991B1B",
                                  padding: 6,
                                  borderRadius: 4,
                                  marginBottom: 6,
                                  wordBreak: "break-word",
                                }}
                              >
                                Last error: {err.slice(0, 200)}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => runScraper(d.slug, mod)}
                              disabled={running}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                background: "#2563EB",
                                color: "#fff",
                                border: "none",
                                borderRadius: 6,
                                padding: "5px 10px",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: running ? "wait" : "pointer",
                                opacity: running ? 0.7 : 1,
                              }}
                            >
                              {running ? (
                                <RefreshCw size={11} style={{ animation: "spin 1s linear infinite" }} />
                              ) : (
                                <Play size={11} />
                              )}
                              {running ? "Running..." : "Run Now"}
                            </button>
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td style={{ padding: "4px 6px", textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => runScraper(d.slug, "weather")}
                      disabled={runningCell?.startsWith(`${d.slug}:`) ?? false}
                      style={{
                        background: "#fff",
                        color: "#2563EB",
                        border: "1px solid #DBEAFE",
                        borderRadius: 4,
                        padding: "3px 8px",
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                      title="Run weather scraper (use cell popover for other modules)"
                    >
                      Weather
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scraper Status */}
      <div style={card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>
            Scraper Status (24h) —{" "}
            <span style={{ color: successPct >= 90 ? "#16A34A" : successPct >= 70 ? "#D97706" : "#DC2626" }}>
              {Math.round(successPct)}% success
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              style={{
                padding: "4px 8px",
                border: "1px solid #E8E8E4",
                borderRadius: 6,
                fontSize: 11,
              }}
            >
              <option value="all">All Jobs</option>
              <option value="weather">Weather</option>
              <option value="news">News</option>
              <option value="crops">Crops</option>
              <option value="dams">Dams</option>
              <option value="power">Power</option>
              <option value="alerts">Alerts</option>
              <option value="insights">Insights</option>
            </select>
            <button
              onClick={clearOldLogs}
              style={{
                background: "#fff",
                color: "#DC2626",
                border: "1px solid #FCA5A5",
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Clear 30d+
            </button>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 18,
              borderRadius: 9,
              overflow: "hidden",
              background: "#FEE2E2",
              display: "flex",
            }}
          >
            <div
              style={{
                width: `${successPct}%`,
                background: "#16A34A",
                borderRadius: 9,
                transition: "width 300ms",
              }}
            />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", whiteSpace: "nowrap" }}>
            {s24.successful} ✓ / {s24.failed} ✗
          </span>
        </div>
        {filteredLogs.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E8E8E4" }}>
                <th style={th}>Job</th>
                <th style={thc}>Status</th>
                <th style={{ ...th, textAlign: "right" }}>Duration</th>
                <th style={{ ...th, textAlign: "right" }}>Records</th>
                <th style={{ ...th, textAlign: "right" }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const isExpanded = expandedLog.has(log.id);
                const isError = log.status === "error";
                return (
                  <>
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: isExpanded ? "none" : "1px solid #F5F5F0",
                        cursor: isError ? "pointer" : "default",
                      }}
                      onClick={() => (isError ? toggleLogExpand(log.id) : null)}
                    >
                      <td style={{ padding: "6px 8px", color: "#1A1A1A", fontWeight: 500 }}>
                        {log.jobName}
                      </td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>
                        {isError ? (
                          <span style={{ color: "#DC2626", display: "inline-flex", alignItems: "center", gap: 2 }}>
                            ✗ {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          </span>
                        ) : (
                          <span style={{ color: "#16A34A" }}>✓</span>
                        )}
                      </td>
                      <td style={{ padding: "6px 8px", textAlign: "right", color: "#6B6B6B" }}>
                        {(log.durationMs / 1000).toFixed(1)}s
                      </td>
                      <td style={{ padding: "6px 8px", textAlign: "right", color: "#6B6B6B" }}>
                        {log.recordsAffected}
                      </td>
                      <td style={{ padding: "6px 8px", textAlign: "right", color: "#9B9B9B", fontSize: 11 }}>
                        {log.createdAt ? relTime(log.createdAt) : "—"}
                      </td>
                    </tr>
                    {isExpanded && log.error && (
                      <tr key={`${log.id}-err`}>
                        <td colSpan={5} style={{ padding: "6px 10px 12px 10px", borderBottom: "1px solid #F5F5F0" }}>
                          <div
                            style={{
                              background: "#FEE2E2",
                              color: "#991B1B",
                              padding: 10,
                              borderRadius: 6,
                              fontSize: 11,
                              fontFamily: "var(--font-mono, monospace)",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}
                          >
                            {log.error}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ fontSize: 12, color: "#9B9B9B", textAlign: "center", padding: 16 }}>
            No scraper runs matched.
          </div>
        )}
        {data.scrapers.recentLogs.length > logLimit && (
          <button
            onClick={() => setLogLimit((n) => n + 20)}
            style={{
              marginTop: 10,
              background: "#fff",
              border: "1px solid #E8E8E4",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              color: "#2563EB",
              cursor: "pointer",
            }}
          >
            Load more
          </button>
        )}
      </div>

      {/* Pending Items */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { label: "Reviews", count: data.pendingItems.reviews, bg: "#DBEAFE", color: "#2563EB" },
          { label: "Feedback", count: data.pendingItems.feedback, bg: "#FEF3C7", color: "#D97706" },
          { label: "Alerts", count: data.pendingItems.alerts, bg: "#FFEDD5", color: "#EA580C" },
          {
            label: "Unread Alerts",
            count: data.pendingItems.unreadAlerts,
            bg: data.pendingItems.unreadAlerts > 0 ? "#FEE2E2" : "#F3F4F6",
            color: data.pendingItems.unreadAlerts > 0 ? "#DC2626" : "#6B6B6B",
          },
        ].map((p) => (
          <div
            key={p.label}
            style={{
              background: p.bg,
              color: p.color,
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {p.count} {p.label}
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "6px 8px",
  color: "#9B9B9B",
  fontWeight: 600,
  fontSize: 11,
};

const thc: React.CSSProperties = {
  ...th,
  textAlign: "center",
};
