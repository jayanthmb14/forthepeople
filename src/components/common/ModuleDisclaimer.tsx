/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════
//  ModuleDisclaimer — a short "Note" / "Important" line on a module page.
//  Design v3: plain body text on a bordered surface. Semantic colour
//  appears ONLY in the small uppercase label (warn for "Important",
//  text-2 for "Note") — never as a tinted box (CONCEPT-v3 §2.4).
// ═══════════════════════════════════════════════════════════

type Props = {
  text: string;
  tone?: "info" | "warning";
};

export default function ModuleDisclaimer({ text, tone = "info" }: Props) {
  const label = tone === "warning" ? "Important" : "Note";
  const labelColor = tone === "warning" ? "var(--ftp-warn)" : "var(--ftp-text-2)";

  return (
    <div
      role="note"
      style={{
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
        padding: "12px 16px",
        margin: "20px 0",
        fontSize: 13,
        lineHeight: "20px",
        color: "var(--ftp-text)",
      }}
    >
      <span className="ftp-label" style={{ color: labelColor, marginRight: 8 }}>
        {label}
      </span>
      {text}
    </div>
  );
}
