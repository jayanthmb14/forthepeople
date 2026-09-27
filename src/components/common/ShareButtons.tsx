/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
// ═══════════════════════════════════════════════════════════
//  ShareButtons — WhatsApp + Copy link (Design v3)
// ═══════════════════════════════════════════════════════════
//
//  Two quiet kit ToolbarButtons. Drop it inside a <Toolbar> (or anywhere);
//  it renders its own small role="group" wrapper.
//
//  The WhatsApp message is plain text — no emoji — in this shape:
//
//     Mandya District Update
//
//     <text passed in>
//
//     Source: https://forthepeople.in/en/karnataka/mandya/crops
//     #ForThePeople #Mandya
//
import { useState } from "react";
import { Check, Link2, MessageCircle } from "lucide-react";
import { ToolbarButton } from "@/components/district/ui";

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

  // Read the URL at click time so it is always the page the reader is on.
  const getShareUrl = () => url ?? (typeof window !== "undefined" ? window.location.href : "");

  function handleWhatsApp() {
    const shareUrl = getShareUrl();
    const waText = [
      district ? `${district} District Update` : "District Update",
      "",
      text,
      "",
      `Source: ${shareUrl}`,
      "#ForThePeople" + (district ? ` #${district.replace(/\s+/g, "")}` : ""),
    ].join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, "_blank", "noopener,noreferrer");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (old browser / insecure context): nothing to do.
    }
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }} role="group" aria-label={`Share ${module ?? "data"}`}>
      <ToolbarButton icon={MessageCircle} onClick={handleWhatsApp} ariaLabel="Share on WhatsApp">
        WhatsApp
      </ToolbarButton>
      <ToolbarButton icon={copied ? Check : Link2} onClick={handleCopy} ariaLabel={copied ? "Link copied" : "Copy link to clipboard"}>
        <span aria-live="polite">{copied ? "Copied" : "Copy link"}</span>
      </ToolbarButton>
    </div>
  );
}
