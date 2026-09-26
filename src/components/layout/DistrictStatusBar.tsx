/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * DistrictStatusBar — the thin sticky strip under the header on every
 * district page: "Mandya, Karnataka · Monday, 27 Sep 2026 · 18:16:04 IST ·
 * <freshness>".
 *
 * Audit 2026-09 (finding 3.9): the old bar rendered a hard-coded pulsing
 * green "Live" that read no data at all — it said "Live" over weather from
 * April. It now asks /api/data/freshness?district=<slug> (the honest
 * instrument that already existed but had no UI consumer) and shows a
 * traffic light:
 *   green  — every dated module is within its expected refresh window
 *   amber  — some modules are current, some are behind
 *   red    — every dated module is behind
 *   grey   — still loading, request failed, or no dated data at all
 * Hover / focus / tap the indicator to see each module's age
 * ("Weather · as of 20 Apr").
 */

"use client";

import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { asOfLabel } from "@/lib/utils/timeAgo";

interface DistrictStatusBarProps {
  districtName: string;
  stateName: string;
  /**
   * District slug used for the freshness request. Optional: when the
   * layout does not pass it we read it from the URL
   * (/<locale>/<state>/<district>/...).
   */
  districtSlug?: string;
}

// Shape of /api/data/freshness (src/app/api/data/freshness/route.ts).
type Light = "green" | "amber" | "red" | "unknown";
interface FreshnessModule {
  status: Light | "ok";
  age?: string;
  lastUpdated?: string | null;
  activeCount?: number;
}
interface FreshnessResponse {
  modules: Record<string, FreshnessModule>;
}

// Which modules to list, in display order, with citizen-friendly names.
// The API also returns `alerts` (a count, not a timestamp) — it is left
// out because it carries no freshness information.
const MODULE_LABELS: Array<[key: string, label: string]> = [
  ["weather", "Weather"],
  ["crops", "Crop prices"],
  ["dam", "Dam levels"],
  ["news", "News"],
  ["aiInsights", "AI insights"],
];

type Overall = Light | "loading";

const LIGHT_COLOR: Record<Overall, string> = {
  green: "#16A34A",
  amber: "#D97706",
  red: "#DC2626",
  unknown: "#9B9B9B",
  loading: "#9B9B9B",
};

const LIGHT_TEXT: Record<Overall, string> = {
  green: "Data current",
  amber: "Partly updated",
  red: "Data behind",
  unknown: "No dated data",
  loading: "Checking data…",
};

/** Roll the per-module lights up into one colour for the bar. */
function summarise(modules: Record<string, FreshnessModule>): Overall {
  const lights = MODULE_LABELS.map(([k]) => modules[k]?.status).filter(
    (s): s is Light => s === "green" || s === "amber" || s === "red",
  );
  if (lights.length === 0) return "unknown";
  if (lights.every((l) => l === "green")) return "green";
  if (lights.every((l) => l === "red")) return "red";
  return "amber";
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

export default function DistrictStatusBar({ districtName, stateName, districtSlug }: DistrictStatusBarProps) {
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");
  // The freshness answer is stored together with the slug it belongs to,
  // so switching district shows "loading" again without any synchronous
  // setState inside the effect (React Compiler rule).
  const [result, setResult] = useState<{
    slug: string;
    overall: Overall;
    rows: Array<{ label: string; light: Light; asOf: string }>;
  } | null>(null);
  const [open, setOpen] = useState(false);
  const popoverId = useId();

  // Fallback: derive the slug from /<locale>/<state>/<district>/...
  const pathname = usePathname();
  const slug = districtSlug ?? pathname?.split("/").filter(Boolean)[2] ?? "";

  // IST clock, ticks every second.
  useEffect(() => {
    function update() {
      const now = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      setTimeStr(`${hh}:${mm}:${ss} IST`);
      setDateStr(`${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // Freshness: one request per district page load. Grey until it answers,
  // grey again if it fails — we never guess.
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetch(`/api/data/freshness?district=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? (r.json() as Promise<FreshnessResponse>) : null))
      .then((data) => {
        if (cancelled) return;
        if (!data?.modules) {
          setResult({ slug, overall: "unknown", rows: [] });
          return;
        }
        setResult({
          slug,
          overall: summarise(data.modules),
          rows: MODULE_LABELS.map(([key, label]) => {
            const m = data.modules[key];
            const light: Light =
              m?.status === "green" || m?.status === "amber" || m?.status === "red"
                ? m.status
                : "unknown";
            const asOf = asOfLabel(m?.lastUpdated ?? null) || "no data yet";
            return { label, light, asOf };
          }),
        });
      })
      .catch(() => {
        if (!cancelled) setResult({ slug, overall: "unknown", rows: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // No slug → we cannot ask; answer for another slug → still loading.
  const overall: Overall = !slug ? "unknown" : result?.slug === slug ? result.overall : "loading";
  const rows = result?.slug === slug ? result.rows : [];

  const colour = LIGHT_COLOR[overall];
  const text = LIGHT_TEXT[overall];
  // Plain-text version of the popover for the native tooltip / screen readers.
  const title = rows.length
    ? rows.map((r) => `${r.label} · ${r.asOf}`).join("\n")
    : text;

  return (
    <div
      className="sticky top-[92px] md:top-[56px] flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-3"
      style={{
        zIndex: 30,
        minHeight: 32,
        background: "#FAFAF8",
        borderBottom: "1px solid #E8E8E4",
        fontSize: 11,
      }}
    >
      <style>{`
        .ftp-fresh-btn {
          display: inline-flex; align-items: center; gap: 5px;
          background: transparent; border: 0; padding: 2px 4px; margin: 0;
          font: inherit; font-weight: 600; cursor: default; border-radius: 4px;
          position: relative;
        }
        .ftp-fresh-btn:focus-visible { outline: 2px solid #2563EB; outline-offset: 2px; }
        .ftp-fresh-dot {
          width: 7px; height: 7px; border-radius: 50%; display: inline-block; flex-shrink: 0;
        }
        .ftp-fresh-pop {
          position: absolute; top: calc(100% + 6px); right: 0; z-index: 40;
          min-width: 200px; padding: 8px 10px;
          background: #FFFFFF; border: 1px solid #E8E8E4; border-radius: 8px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.08);
          text-align: left; font-weight: 400; color: #1A1A1A;
        }
        .ftp-fresh-pop-row {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 3px 0; font-size: 11px; white-space: nowrap;
        }
        .ftp-fresh-pop-row span:last-child { color: #6B6B6B; font-variant-numeric: tabular-nums; }
        .ftp-fresh-pop-foot { margin-top: 6px; padding-top: 6px; border-top: 1px solid #F0F0EC; font-size: 10px; color: #9B9B9B; }
      `}</style>

      {/* Location dot + name */}
      <span className="flex items-center gap-1" style={{ color: "#6B6B6B" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#9B9B9B", display: "inline-block", flexShrink: 0 }} />
        {districtName}
        {stateName && <span style={{ color: "#9B9B9B" }}>, {stateName}</span>}
      </span>

      <span style={{ color: "#D4D4D0" }}>|</span>

      {/* Date — hidden on very small screens */}
      {dateStr && (
        <>
          <span className="hidden sm:inline" style={{ color: "#9B9B9B" }}>{dateStr}</span>
          <span className="hidden sm:inline" style={{ color: "#D4D4D0" }}>|</span>
        </>
      )}

      {/* Time */}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          color: "#6B6B6B",
          fontWeight: 500,
          letterSpacing: "0.03em",
        }}
      >
        {timeStr}
      </span>

      <span style={{ color: "#D4D4D0" }}>|</span>

      {/* Freshness traffic light. Hover / focus / tap shows per-module ages. */}
      <button
        type="button"
        className="ftp-fresh-btn"
        style={{ color: colour }}
        title={title}
        aria-label={`Data freshness: ${text}`}
        aria-expanded={open}
        aria-controls={popoverId}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="ftp-fresh-dot" style={{ background: colour }} aria-hidden="true" />
        {text}
        {open && rows.length > 0 && (
          <span id={popoverId} role="tooltip" className="ftp-fresh-pop">
            {rows.map((r) => (
              <span key={r.label} className="ftp-fresh-pop-row">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span className="ftp-fresh-dot" style={{ background: LIGHT_COLOR[r.light] }} aria-hidden="true" />
                  {r.label}
                </span>
                <span>{r.asOf}</span>
              </span>
            ))}
            <span className="ftp-fresh-pop-foot" style={{ display: "block" }}>
              Dates are when the source last published.
            </span>
          </span>
        )}
      </button>
    </div>
  );
}
