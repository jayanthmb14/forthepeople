/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Segment error boundary. It renders INSIDE the root layout, so it must
// not output <html>/<body> (only global-error.tsx does that). The old
// version did, which nested a second document inside the page whenever a
// page threw ("<html> cannot be a child of <body>").
"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div className="ftp-pop ftp-emoji" aria-hidden style={{ fontSize: 64, lineHeight: 1, marginBottom: 12 }}>
        🛠️
      </div>
      <h1 className="ftp-display" style={{ margin: "0 0 8px", fontSize: 28, lineHeight: 1.15, fontWeight: 700, color: "var(--ftp-text)" }}>
        Something went wrong on this page
      </h1>
      <p style={{ margin: "0 0 8px", fontSize: 15, lineHeight: "23px", color: "var(--ftp-text-2)", maxWidth: 420 }}>
        The error has been logged. Try again, or go back to the home page.
      </p>
      {error.digest && (
        <p className="ftp-num" style={{ margin: "0 0 20px", fontSize: 12, color: "var(--ftp-text-2)" }}>
          Error ID: {error.digest}
        </p>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          type="button"
          onClick={reset}
          style={{
            height: 44,
            padding: "0 20px",
            background: "#2563EB",
            color: "#FFF",
            border: "none",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--ftp-font-sans)",
          }}
        >
          Try again
        </button>
        <Link
          href="/en"
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: 44,
            padding: "0 20px",
            background: "#fff",
            color: "var(--ftp-text)",
            border: "1px solid var(--ftp-border-strong)",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Go to the home page
        </Link>
      </div>
    </div>
  );
}
