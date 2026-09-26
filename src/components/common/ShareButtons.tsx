/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Share Buttons (WhatsApp + Copy Link)
// ═══════════════════════════════════════════════════════════
import { useState } from "react";
import { Link, Share2, Check } from "lucide-react";

interface ShareButtonsProps {
  /** Short summary of the data being shared */
  text: string;
  /** Full page URL (defaults to window.location.href) */
  url?: string;
  /** District name for context */
  district?: string;
  /** Module name for context */
  module?: string;
}

export default function ShareButtons({ text, url, district, module }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

  const waText = [
    district ? `📍 ${district} District Update` : "📍 District Update",
    "",
    text,
    "",
    `Source: ${shareUrl}`,
    "#ForThePeople" + (district ? ` #${district.replace(/\s+/g, "")}` : ""),
  ].join("\n");

  function handleWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, "_blank", "noopener,noreferrer");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 6 }}
      role="group"
      aria-label={`Share ${module ?? "data"}`}
    >
      {/* WhatsApp */}
      <button
        onClick={handleWhatsApp}
        title="Share on WhatsApp"
        aria-label="Share on WhatsApp"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "5px 10px",
          border: "1px solid #D1FAE5",
          borderRadius: 8,
          background: "#F0FDF4",
          color: "#16A34A",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <Share2 size={13} aria-hidden="true" />
        <span>WhatsApp</span>
      </button>

      {/* Copy link */}
      <button
        onClick={handleCopy}
        title="Copy link"
        aria-label={copied ? "Link copied!" : "Copy link to clipboard"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "5px 10px",
          border: "1px solid #E8E8E4",
          borderRadius: 8,
          background: copied ? "#F0FDF4" : "#FAFAF8",
          color: copied ? "#16A34A" : "#6B6B6B",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 150ms",
          whiteSpace: "nowrap",
        }}
      >
        {copied ? <Check size={13} aria-hidden="true" /> : <Link size={13} aria-hidden="true" />}
        <span>{copied ? "Copied!" : "Copy link"}</span>
      </button>
    </div>
  );
}
