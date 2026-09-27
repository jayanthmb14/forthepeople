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
 *
 * Design v3 (2026-09-27): a calm 32 px strip on tokens —
 *   district · state · date · time (JetBrains Mono) · status Pill.
 * The request now goes through the shared useFreshness() hook, so the
 * status strip, the left rail and the overview page share ONE fetch of
 * /api/data/freshness per district (5-minute in-memory cache).
 */

"use client";

import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { asOfLabel } from "@/lib/utils/timeAgo";
import { useFreshness } from "@/hooks/useFreshness";
import type { FreshnessKey } from "@/hooks/useFreshness";
import { Pill } from "@/components/district/ui";
import type { Tone } from "@/components/district/ui";

interface DistrictStatusBarProps {
  districtName: string;
  stateName: string;
  /**
   * District slug used for the freshness request. Optional: when the
   * layout does not pass it we read it from the URL
   * (/<locale>/<state>/<district>/...).
   */
  districtSlug?: string;
  /** State slug (same fallback: read from the URL). */
  stateSlug?: string;
}

type Light = "green" | "amber" | "red" | "unknown";

// Which modules to list, in display order, with citizen-friendly names.
// The API also returns `alerts` (a count, not a timestamp) — it is left
// out because it carries no freshness information.
const MODULE_LABELS: Array<[key: FreshnessKey, label: string]> = [
  ["weather", "Weather"],
  ["crops", "Crop prices"],
  ["dam", "Dam levels"],
  ["news", "News"],
  ["aiInsights", "AI insights"],
];

type Overall = Light | "loading";

/** Traffic light → kit Pill tone (colour shows only as tint + 6 px dot). */
const LIGHT_TONE: Record<Overall, Tone> = {
  green: "live",
  amber: "warn",
  red: "danger",
  unknown: "neutral",
  loading: "neutral",
};

/** Dot colour for each row in the popover. */
const LIGHT_DOT: Record<Light, string> = {
  green: "var(--ftp-live)",
  amber: "var(--ftp-warn)",
  red: "var(--ftp-danger)",
  unknown: "var(--ftp-border-strong)",
};

const LIGHT_TEXT: Record<Overall, string> = {
  green: "Data current",
  amber: "Partly updated",
  red: "Data behind",
  unknown: "No dated data",
  loading: "Checking data…",
};

/** Roll the per-module lights up into one light for the strip. */
function summarise(lights: Light[]): Light {
  const dated = lights.filter((s): s is "green" | "amber" | "red" => s === "green" || s === "amber" || s === "red");
  if (dated.length === 0) return "unknown";
  if (dated.every((l) => l === "green")) return "green";
  if (dated.every((l) => l === "red")) return "red";
  return "amber";
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

export default function DistrictStatusBar({ districtName, stateName, districtSlug, stateSlug }: DistrictStatusBarProps) {
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [open, setOpen] = useState(false);
  const popoverId = useId();

  // Fallback: derive the slugs from /<locale>/<state>/<district>/...
  const pathname = usePathname();
  const parts = pathname?.split("/").filter(Boolean) ?? [];
  const slug = districtSlug ?? parts[2] ?? "";
  const stateKey = stateSlug ?? parts[1] ?? "";

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

  // Freshness: the shared hook makes one request per district page load.
  // Grey while it is loading, grey again if it fails — we never guess.
  const fresh = useFreshness(stateKey, slug);
  const hasData = Object.keys(fresh.modules).length > 0;
  const rows = hasData
    ? MODULE_LABELS.map(([key, label]) => {
        const m = fresh.modules[key];
        const light: Light = m?.status ?? "unknown";
        const asOf = asOfLabel(m?.asOf ?? null) || "no data yet";
        return { label, light, asOf };
      })
    : [];

  const overall: Overall = !slug
    ? "unknown"
    : hasData
      ? summarise(rows.map((r) => r.light))
      : fresh.error
        ? "unknown"
        : "loading";

  const text = LIGHT_TEXT[overall];
  // Plain-text version of the popover for the native tooltip / screen readers.
  const title = rows.length ? rows.map((r) => `${r.label} · ${r.asOf}`).join("\n") : text;

  return (
    <div
      className="sticky top-[92px] md:top-[56px] flex items-center justify-center gap-2 px-4"
      style={{
        zIndex: 30,
        height: 32,
        background: "var(--ftp-bg)",
        borderBottom: "1px solid var(--ftp-border)",
        fontSize: 11,
        lineHeight: "16px",
        color: "var(--ftp-text-2)",
        whiteSpace: "nowrap",
      }}
    >
      <style>{`
        .ftp-fresh-btn {
          display: inline-flex; align-items: center; min-height: 32px;
          background: transparent; border: 0; padding: 0; margin: 0;
          font: inherit; cursor: default; position: relative;
        }
        .ftp-fresh-btn:focus-visible { outline: 2px solid var(--ftp-brand); outline-offset: 2px; border-radius: var(--ftp-radius-pill); }
        .ftp-fresh-pop {
          position: absolute; top: calc(100% + 4px); right: 0; z-index: 40;
          min-width: 220px; padding: 8px 12px;
          background: var(--ftp-surface); border: 1px solid var(--ftp-border); border-radius: var(--ftp-radius-tile);
          text-align: left; color: var(--ftp-text); white-space: nowrap;
        }
        .ftp-fresh-pop-row {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 3px 0; font-size: 11px; line-height: 16px;
        }
        .ftp-fresh-pop-foot {
          display: block; margin-top: 6px; padding-top: 6px;
          border-top: 1px solid var(--ftp-border); font-size: 11px; color: var(--ftp-text-2);
        }
      `}</style>

      {/* District · State (truncates first on narrow phones) */}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>
        <span style={{ color: "var(--ftp-text)", fontWeight: 500 }}>{districtName}</span>
        {stateName && <span> · {stateName}</span>}
      </span>

      {/* Date — hidden on small screens to keep the strip one line */}
      {dateStr && (
        <span className="hidden sm:inline" suppressHydrationWarning>
          · {dateStr}
        </span>
      )}

      {/* Time (mono) */}
      {timeStr && (
        <span className="ftp-num" style={{ color: "var(--ftp-text)" }} suppressHydrationWarning>
          · {timeStr}
        </span>
      )}

      {/* Freshness status. Hover / focus / tap shows per-module ages. */}
      <button
        type="button"
        className="ftp-fresh-btn"
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
        <Pill tone={LIGHT_TONE[overall]} dot>{text}</Pill>
        {open && rows.length > 0 && (
          <span id={popoverId} role="tooltip" className="ftp-fresh-pop">
            {rows.map((r) => (
              <span key={r.label} className="ftp-fresh-pop-row">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: LIGHT_DOT[r.light], flexShrink: 0 }} />
                  {r.label}
                </span>
                <span className="ftp-num" style={{ color: "var(--ftp-text-2)" }}>{r.asOf}</span>
              </span>
            ))}
            <span className="ftp-fresh-pop-foot">Dates are when the source last published.</span>
          </span>
        )}
      </button>
    </div>
  );
}
