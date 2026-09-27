/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// 404 — Design v4: a friendly dead end that points somewhere useful.
"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
        background:
          "radial-gradient(700px 420px at 15% 10%, rgba(255,153,51,0.16), transparent 70%), radial-gradient(700px 420px at 85% 90%, rgba(19,136,8,0.14), transparent 70%), #F6F5F0",
      }}
    >
      <div className="ftp-pop ftp-emoji" aria-hidden style={{ fontSize: 72, lineHeight: 1, marginBottom: 12 }}>
        🧭
      </div>
      <p className="ftp-bignum" style={{ margin: 0, fontSize: 64, lineHeight: 1, color: "#D2CFC4" }}>
        404
      </p>
      <h1 className="ftp-display" style={{ margin: "12px 0 8px", fontSize: 30, lineHeight: 1.15, fontWeight: 700, color: "#15171C" }}>
        We couldn&apos;t find that page
      </h1>
      <p style={{ margin: "0 0 28px", fontSize: 15, lineHeight: "23px", color: "#5D6270", maxWidth: 420 }}>
        The link may be old, or this district or dashboard is not live yet. You can vote for the next district to
        go live.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/en"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 44,
            padding: "0 20px",
            background: "#2563EB",
            color: "#FFF",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 8px 18px -10px rgba(37,99,235,0.85)",
          }}
        >
          <span aria-hidden>🏠</span> Go to the home page
        </Link>
        <Link
          href="/en/vote-district"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 44,
            padding: "0 20px",
            background: "#fff",
            color: "#15171C",
            border: "1px solid #D2CFC4",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <span aria-hidden>🗳️</span> Vote for a district
        </Link>
      </div>
    </div>
  );
}
