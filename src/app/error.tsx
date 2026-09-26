/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#FAFAF8",
            padding: 24,
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#FEE2E2",
              lineHeight: 1,
              marginBottom: 16,
            }}
          >
            500
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#1A1A1A",
              marginBottom: 8,
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#6B6B6B",
              marginBottom: 8,
              maxWidth: 360,
            }}
          >
            An unexpected error occurred. Our team has been notified.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: 11,
                color: "#9B9B9B",
                fontFamily: "monospace",
                marginBottom: 24,
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: "10px 20px",
              background: "#2563EB",
              color: "#FFF",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
