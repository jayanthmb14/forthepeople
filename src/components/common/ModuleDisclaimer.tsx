/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// A short "Note" / "Important" paragraph for a module page.
// Design v3: a plain bordered surface — no tinted background. The only
// colour is the label text (text-2 for a note, warn for "Important"),
// because semantic colour appears as text, never as a filled box.

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
        borderRadius: "var(--ftp-radius-tile)",
        padding: "12px 16px",
        margin: "20px 0",
        fontSize: 13,
        lineHeight: "20px",
        color: "var(--ftp-text-2)",
      }}
    >
      <span
        style={{
          fontSize: 11,
          lineHeight: "16px",
          fontWeight: 500,
          color: labelColor,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          marginRight: 8,
        }}
      >
        {label}
      </span>
      {text}
    </div>
  );
}
