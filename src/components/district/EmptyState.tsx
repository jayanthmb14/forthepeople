// ── ForThePeople.in — Module empty state (Design v3) ─────────
//
// Thin wrapper that looks up the honest per-module message in
// src/lib/empty-states.ts and renders it with the kit:
//   compact → one line of text-2 (for small tiles)
//   default → the kit <EmptyState> card (title + message)
// The registry's emoji `icon` field is intentionally not rendered
// (Design v3: no emoji in the page chrome).
import { getEmptyState } from "@/lib/empty-states";
import { EmptyState as KitEmptyState } from "@/components/district/ui";

interface EmptyStateProps {
  module: string;
  compact?: boolean;
}

export default function EmptyState({ module, compact = false }: EmptyStateProps) {
  const { title, message } = getEmptyState(module);

  if (compact) {
    return (
      <p style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", margin: 0, padding: "8px 0" }}>
        {message}
      </p>
    );
  }

  return <KitEmptyState title={title} body={message} />;
}
