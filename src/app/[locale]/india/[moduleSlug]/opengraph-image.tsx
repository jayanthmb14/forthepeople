/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Per-module OpenGraph image — generated server-side at build time
 * via next/og's ImageResponse. One image per /en/india/[moduleSlug].
 *
 * Layout: brand strip + module title + category accent ribbon.
 * Stays minimal so build-time generation across 53 modules is fast.
 */

import { ImageResponse } from "next/og";
import { getIndiaModuleBySlug } from "@/lib/india/india-modules";
import { CATEGORY_ACCENT } from "@/lib/india/india-design";

export const runtime = "edge";
export const alt = "India dashboard module";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: { locale: string; moduleSlug: string };
}) {
  const mod = getIndiaModuleBySlug(params.moduleSlug);
  const accent = mod ? CATEGORY_ACCENT[mod.category] : "#2563EB";
  const title = mod?.title ?? "India Module";
  const tagline = mod?.tagline ?? "ForThePeople.in";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FAFAF8",
          display: "flex",
          flexDirection: "column",
          padding: 60,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 22,
            color: "#6B6B6B",
          }}
        >
          <span style={{ display: "flex", gap: 4 }}>
            <span style={{ width: 14, height: 14, borderRadius: 7, background: "#FF9933" }} />
            <span style={{ width: 14, height: 14, borderRadius: 7, background: "#9B9B9B" }} />
            <span style={{ width: 14, height: 14, borderRadius: 7, background: "#138808" }} />
          </span>
          <span style={{ fontWeight: 700, color: "#1A1A1A" }}>ForThePeople.in</span>
          <span>· India dashboard</span>
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              fontSize: 36,
              color: accent,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            <span style={{ width: 60, height: 6, borderRadius: 3, background: accent }} />
            {mod?.category ?? "India"}
          </div>
          <div
            style={{
              fontSize: 86,
              fontWeight: 800,
              color: "#1A1A1A",
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 1080,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 30,
              color: "#4B4B4B",
              maxWidth: 1080,
              lineHeight: 1.35,
            }}
          >
            {tagline}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
