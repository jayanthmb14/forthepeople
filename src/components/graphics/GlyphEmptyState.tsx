/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  GlyphEmptyState — the kit's EmptyState with a small illustration
// ═══════════════════════════════════════════════════════════════════════
//  Same honest job as <EmptyState> (src/components/district/ui.tsx): one
//  plain sentence that says the data is not there yet, never a fake zero.
//  It adds a GlyphScene so an empty page still looks cared for. The text
//  comes from the caller (already translated); the picture is decorative.
//  On a phone the picture sits above the text; wider, beside it.
//
//    <GlyphEmptyState
//      pick={glyphPick("shield")}
//      companions={[glyphPick("traffic"), glyphPick("women")]}
//      title={t("emptyTitle", { district })}
//      body={t("emptyBody")}
//    />

import type React from "react";
import { GlyphScene } from "./GlyphScene";
import type { GlyphPick } from "./category-map";

export function GlyphEmptyState({
  pick,
  companions,
  title,
  body,
  action,
}: {
  pick: GlyphPick;
  companions?: GlyphPick[];
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "12px 22px",
        padding: "18px 20px",
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
      }}
    >
      <GlyphScene pick={pick} companions={companions} size={104} />
      <div style={{ flex: "1 1 220px", minWidth: 0 }}>
        <p style={{ fontSize: 16, lineHeight: "23px", fontWeight: 650, color: "var(--ftp-text)", margin: 0 }}>{title}</p>
        {body && <p style={{ fontSize: 14, lineHeight: "21px", color: "var(--ftp-text-2)", margin: "6px 0 0" }}>{body}</p>}
        {action && <div style={{ marginTop: 12 }}>{action}</div>}
      </div>
    </div>
  );
}
