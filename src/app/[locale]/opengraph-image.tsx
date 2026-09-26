/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { ImageResponse } from "next/og";
import { getPlatformFacts } from "@/lib/platform-facts";

// Lives under [locale] so the route is /en/opengraph-image (and /kn/...).
// Next.js injects it as og:image / twitter:image for every page in the
// segment; src/app/layout.tsx points its explicit metadata at the same URL.
// Runs on the Node runtime (the default for next/og) so it can import the
// district and module registries without an edge bundle.
export const alt = "ForThePeople.in — Your District. Your Data. Your Right.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  // Counts from the registry, never hand-typed (issue #36).
  const facts = getPlatformFacts();
  const pills = [
    `${facts.activeDistricts} districts live`,
    `${facts.modulesPerDistrict} data modules`,
    "Source-linked",
    "Free forever",
  ];
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

        {/* Headline — three stacked lines in a flex column. Satori (next/og)
            refuses a <div> with several text children unless it is
            display:flex; the old "\n"-separated version made the route 500. */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          color: "#FFFFFF",
          fontSize: 64,
          fontWeight: 800,
          lineHeight: 1.15,
          marginBottom: 28,
          maxWidth: 900,
        }}>
          <div>Your District.</div>
          <div>Your Data.</div>
          <div>Your Right.</div>
        </div>

        {/* Subline */}
        {/* Subline — kept to ONE line on purpose: Satori under-measures
            wrapped text here and the pills row overlapped it. */}
        <div style={{
          display: "flex",
          color: "rgba(255,255,255,0.75)",
          fontSize: 26,
          fontWeight: 400,
          lineHeight: 1.4,
          marginBottom: 40,
          whiteSpace: "nowrap",
        }}>
          Free, source-linked government data for every Indian district.
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 32 }}>
          {pills.map((s) => (
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
