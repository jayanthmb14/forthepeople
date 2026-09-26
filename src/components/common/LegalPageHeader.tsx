/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import Link from "next/link";

type Props = {
  title: string;
  lastUpdated: string;
  backHref?: string;
};

export default function LegalPageHeader({ title, lastUpdated, backHref = "/" }: Props) {
  return (
    <div style={{ marginBottom: 32 }}>
      <Link
        href={backHref}
        style={{ fontSize: 12, color: "#2563EB", textDecoration: "none" }}
      >
        ← Back to ForThePeople.in
      </Link>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: "#1A1A1A",
          letterSpacing: "-0.4px",
          margin: "16px 0 4px",
        }}
      >
        {title}
      </h1>
      <div style={{ fontSize: 12, color: "#9B9B9B" }}>
        Last updated: {lastUpdated}
      </div>
    </div>
  );
}
