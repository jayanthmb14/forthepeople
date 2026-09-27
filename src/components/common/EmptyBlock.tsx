"use client";

// ═══════════════════════════════════════════════════════════
// EmptyBlock (common) — one honest line when there is nothing to show.
//
// Design v3 (2026-09-27): token colours, a Lucide icon instead of an emoji
// (default: Inbox), 8 px tile radius, no tinted fill. For new code prefer
// the kit's EmptyState in "@/components/district/ui", which also takes a
// second line and an action.
//
// @prop message  The sentence to show (say what is missing, never a fake zero).
// @prop icon     Optional Lucide icon component (e.g. `icon={CloudOff}`).
// ═══════════════════════════════════════════════════════════
import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface EmptyBlockProps {
  icon?: LucideIcon;
  message: string;
}

export default function EmptyBlock({ icon: Icon = Inbox, message }: EmptyBlockProps) {
  return (
    <div
      style={{
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-tile)",
        padding: "16px",
        color: "var(--ftp-text-2)",
        fontSize: 13,
        lineHeight: "20px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: "10px 0",
      }}
    >
      <Icon size={18} aria-hidden style={{ flexShrink: 0 }} />
      <span>{message}</span>
    </div>
  );
}
