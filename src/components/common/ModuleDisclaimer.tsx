/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

type Props = {
  text: string;
  tone?: "info" | "warning";
};

export default function ModuleDisclaimer({ text, tone = "info" }: Props) {
  const colors =
    tone === "warning"
      ? { bg: "#FFF9F0", border: "#FED7AA", label: "#D97706", labelText: "Important" }
      : { bg: "#F8FAFC", border: "#E2E8F0", label: "#64748B", labelText: "Note" };

  return (
    <div
      role="note"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        padding: "12px 16px",
        margin: "20px 0",
        fontSize: 12,
        color: "#4B4B4B",
        lineHeight: 1.6,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: colors.label,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginRight: 8,
        }}
      >
        {colors.labelText}
      </span>
      {text}
    </div>
  );
}
