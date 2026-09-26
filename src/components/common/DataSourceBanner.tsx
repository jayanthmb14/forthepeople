/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { Info } from "lucide-react";

interface DataSourceBannerProps {
  moduleName: string;
  sources: string[];
  lastUpdated?: string | null;
  updateFrequency: string;
  isLive?: boolean;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DataSourceBanner({ sources, lastUpdated, updateFrequency, isLive }: DataSourceBannerProps) {
  return (
    <div
      style={{
        fontSize: 12,
        color: "#6B6B6B",
        lineHeight: 1.6,
        padding: "10px 14px",
        background: "#FAFAF8",
        borderRadius: 8,
        borderLeft: "3px solid #2563EB",
        marginBottom: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <Info size={13} style={{ color: "#9B9B9B", flexShrink: 0, marginTop: 2 }} />
        <div>
          <span>
            Data sourced from{" "}
            <strong style={{ color: "#4B4B4B" }}>{sources.join(", ")}</strong>.
            {lastUpdated && (
              <> Last updated: <strong>{timeAgo(lastUpdated)}</strong>.</>
            )}
            {" "}Update frequency: {updateFrequency}.
            {isLive && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 6, color: "#16A34A", fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A", display: "inline-block" }} />
                LIVE
              </span>
            )}
          </span>
          <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 4 }}>
            ForThePeople.in is NOT an official government website. Data aggregated from publicly available government portals under India&apos;s Open Data Policy (NDSAP).
          </div>
        </div>
      </div>
    </div>
  );
}
