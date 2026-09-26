/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ForThePeople.in — Your District. Your Data. Your Right.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 60%, #1D4ED8 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px 100px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo area */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 40 }}>
          <div style={{
            fontSize: 56,
            background: "rgba(255,255,255,0.15)",
            borderRadius: 16,
            padding: "8px 16px",
          }}>
            🗣️
          </div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 22, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase" }}>
            ForThePeople.in
          </div>
        </div>

        {/* Headline */}
        <div style={{
          color: "#FFFFFF",
          fontSize: 64,
          fontWeight: 800,
          lineHeight: 1.15,
          marginBottom: 28,
          maxWidth: 900,
        }}>
          Your District.{"\n"}Your Data.{"\n"}Your Right.
        </div>

        {/* Subline */}
        <div style={{
          color: "rgba(255,255,255,0.75)",
          fontSize: 28,
          fontWeight: 400,
          marginBottom: 48,
          maxWidth: 800,
        }}>
          India&apos;s citizen transparency platform — free district-level government data for every Indian.
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 32 }}>
          {["780+ Districts", "28 Data Modules", "Live Updates", "Free Forever"].map((s) => (
            <div
              key={s}
              style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: 12,
                padding: "10px 20px",
                color: "#FFFFFF",
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
