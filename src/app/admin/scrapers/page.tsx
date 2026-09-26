/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { useState } from "react";
import { RefreshCw, CheckCircle, XCircle, Database } from "lucide-react";

interface ScraperLog {
  id: string;
  jobName: string;
  status: string;
  recordsNew: number | null;
  recordsUpdated: number | null;
  duration: number | null;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
}

function formatDuration(ms: number | null) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const JOB_COLORS: Record<string, string> = {
  weather: "#2563EB", crops: "#16A34A", news: "#7C3AED",
  alerts: "#D97706", dams: "#0891B2", jjm: "#059669", housing: "#D97706",
};

export default function ScrapersAdminPage() {
  const [logs, setLogs] = useState<ScraperLog[]>([]);
  const [, setLoading] = useState(true);
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");

  const fetchLogs = async (s: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/scraper-logs", {
        headers: { "x-admin-secret": s },
      });
      if (res.status === 401) { setError("Invalid secret"); setLoading(false); return; }
      const data = await res.json();
      setLogs(data.logs ?? []);
      setAuthed(true);
      setError("");
    } catch {
      setError("Failed to fetch logs");
    }
    setLoading(false);
  };

  // Group by job name for summary
  const latestByJob = Object.values(
    logs.reduce((acc: Record<string, ScraperLog>, log) => {
      if (!acc[log.jobName] || new Date(log.startedAt) > new Date(acc[log.jobName].startedAt)) {
        acc[log.jobName] = log;
      }
      return acc;
    }, {})
  );

  return (
    <div style={{ padding: 32, background: "#FAFAF8", minHeight: "100vh" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <Database size={24} style={{ color: "#2563EB" }} />
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A" }}>Scraper Admin</h1>
            <p style={{ fontSize: 13, color: "#6B6B6B" }}>Monitor scraper job status and logs</p>
          </div>
        </div>

        {!authed ? (
          <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 24, maxWidth: 360 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Enter Admin Secret</div>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchLogs(secret)}
              placeholder="admin secret..."
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #E8E8E4", fontSize: 14, marginBottom: 8, boxSizing: "border-box" }}
            />
            {error && <div style={{ color: "#DC2626", fontSize: 12, marginBottom: 8 }}>{error}</div>}
            <button onClick={() => fetchLogs(secret)} style={{
              width: "100%", padding: "8px 16px", background: "#2563EB", color: "#FFF",
              borderRadius: 8, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
            }}>
              Access Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
              {latestByJob.map((job) => {
                const color = JOB_COLORS[job.jobName] ?? "#6B7280";
                return (
                  <div key={job.jobName} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color }}>{job.jobName}</span>
                      {job.status === "success"
                        ? <CheckCircle size={14} style={{ color: "#16A34A" }} />
                        : <XCircle size={14} style={{ color: "#DC2626" }} />}
                    </div>
                    <div style={{ fontSize: 11, color: "#9B9B9B" }}>
                      {job.completedAt ? formatTime(job.completedAt) : "Running..."}
                    </div>
                    <div style={{ fontSize: 11, color: "#6B6B6B", marginTop: 2 }}>
                      +{job.recordsNew ?? 0} new · {formatDuration(job.duration)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Refresh button */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <button onClick={() => fetchLogs(secret)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 8,
                fontSize: 13, cursor: "pointer",
              }}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {/* Log table */}
            <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FAFAF8", borderBottom: "1px solid #F0F0EC" }}>
                    {["Job", "Status", "New", "Updated", "Duration", "Started", "Error"].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#9B9B9B", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={log.id} style={{ borderBottom: i < logs.length - 1 ? "1px solid #F5F5F0" : "none" }}>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: JOB_COLORS[log.jobName] ?? "#1A1A1A" }}>{log.jobName}</span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 8,
                          background: log.status === "success" ? "#F0FDF4" : "#FFF1F2",
                          color: log.status === "success" ? "#16A34A" : "#DC2626",
                        }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontFamily: "monospace" }}>{log.recordsNew ?? 0}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontFamily: "monospace" }}>{log.recordsUpdated ?? 0}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontFamily: "monospace" }}>{formatDuration(log.duration)}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#6B6B6B" }}>{formatTime(log.startedAt)}</td>
                      <td style={{ padding: "10px 14px", fontSize: 11, color: "#DC2626", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {log.error ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
