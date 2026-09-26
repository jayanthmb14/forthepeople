/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

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
        background: "#FAFAF8",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 80,
          fontWeight: 800,
          fontFamily: "var(--font-jetbrains)",
          color: "#E8E8E4",
          lineHeight: 1,
          marginBottom: 16,
        }}
      >
        404
      </div>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#1A1A1A",
          marginBottom: 8,
          letterSpacing: "-0.3px",
        }}
      >
        Page not found
      </h1>
      <p style={{ fontSize: 14, color: "#6B6B6B", marginBottom: 32, maxWidth: 360 }}>
        This page doesn&apos;t exist, or the district / module you&apos;re looking for
        hasn&apos;t been added yet.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/"
          style={{
            padding: "10px 20px",
            background: "#2563EB",
            color: "#FFF",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Go Home
        </Link>
        <Link
          href="/about"
          style={{
            padding: "10px 20px",
            background: "#FFF",
            border: "1px solid #E8E8E4",
            color: "#1A1A1A",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          About ForThePeople
        </Link>
      </div>
    </div>
  );
}
