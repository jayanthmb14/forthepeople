import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Loads src/i18n/request.ts (messages per language, English fallback).
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// ─────────────────────────────────────────────────────────────────────────────
// Content-Security-Policy (REPORT-ONLY)
// ─────────────────────────────────────────────────────────────────────────────
// This policy is deliberately shipped as `Content-Security-Policy-Report-Only`.
// Browsers LOG violations (and POST them to Sentry when a DSN is configured)
// but never block anything, so it cannot break the site. Watch the reports for
// a few weeks, tighten the list, and only then consider switching the header
// key to the enforcing `Content-Security-Policy`.
//
// Hosts explained:
//   plausible.io               analytics script + event beacon (src/app/layout.tsx)
//   checkout.razorpay.com      Razorpay checkout.js + its iframe
//   api.razorpay.com           Razorpay checkout iframe/XHR
//   lumberjack.razorpay.com    Razorpay's own telemetry beacon from checkout
//   fonts.googleapis.com       Noto Sans Tamil/Bengali/Telugu @import (globals.css)
//   fonts.gstatic.com          the font files those stylesheets load
//   *.ingest.*.sentry.io       browser error reports (NEXT_PUBLIC_SENTRY_DSN)
//   api.github.com             star count fetch in the header
//   https: for img-src         leader/personality photos come from many gov + wiki hosts
//   data: / blob:              QR codes (2FA setup), inline SVG maps, CSV downloads
//
// 'unsafe-inline' is required by Next.js for its bootstrap scripts and by our
// inline JSON-LD / service-worker snippets. Moving to nonces is a separate,
// larger task and is not needed for a report-only rollout.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://plausible.io https://checkout.razorpay.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  [
    "connect-src 'self'",
    "https://plausible.io",
    "https://api.razorpay.com",
    "https://checkout.razorpay.com",
    "https://lumberjack.razorpay.com",
    "https://*.ingest.sentry.io",
    "https://*.ingest.us.sentry.io",
    "https://*.ingest.de.sentry.io",
    "https://api.github.com",
  ].join(" "),
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/**
 * If a public Sentry DSN is configured, turn it into Sentry's CSP report
 * endpoint so violations show up in the Sentry project instead of vanishing
 * into the browser console. The DSN key is already public (NEXT_PUBLIC_*).
 * DSN shape: https://<key>@<host>/<projectId>
 */
function sentryCspReportUri(): string | null {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return null;
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/^\/+/, "");
    if (!u.username || !projectId) return null;
    return `https://${u.host}/api/${projectId}/security/?sentry_key=${u.username}`;
  } catch {
    return null;
  }
}

const cspReportUri = sentryCspReportUri();
const cspHeaderValue = cspReportUri ? `${CSP_REPORT_ONLY}; report-uri ${cspReportUri}` : CSP_REPORT_ONLY;

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployments
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,

  // Security + cache headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          // X-XSS-Protection was removed: the header is deprecated, ignored by
          // every current browser, and could itself introduce side-channels in
          // old ones. CSP (below) is the modern replacement.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // geolocation=(self): "Use my location" on the home page and the district
          // finder asks the browser for a position. geolocation=() blocked it for
          // the whole document, so the prompt never appeared (Sep 2026 audit).
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          { key: "Content-Security-Policy-Report-Only", value: cspHeaderValue },
          { key: "X-Powered-By", value: "ForThePeople.in" },
          { key: "X-Creator", value: "Jayanth M B" },
          { key: "X-Project-ID", value: "FTP-JMB-2026-IN" },
          // Plain SPDX identifier so licence scanners (GitHub, FLOSS/fund,
          // Sentry/Vercel OSS programmes) read it correctly.
          { key: "X-License", value: "MIT" },
        ],
      },
      // Admin + payment JSON must NEVER be cached by the CDN. Vercel's edge
      // cache does not key on cookies, so a cached admin response could be
      // served to an anonymous visitor. `private, no-store` makes every layer
      // (CDN, proxy, browser) skip caching.
      //
      // The API-key vault lives under /api/admin/vault/*, so it is covered by
      // the first rule (there is no top-level /api/vault route).
      {
        source: "/api/admin/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/api/payment/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      // Cache static GeoJSON files aggressively
      {
        source: "/geo/:file*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      // Cache API responses for 5 minutes at CDN
      {
        source: "/api/data/:path*",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=600" },
        ],
      },
    ];
  },

  // Slug aliases → canonical module routes (308, SEO-friendly).
  // Keeps external/bookmarked links working after folder rename.
  async redirects() {
    const pairs: Array<[string, string]> = [
      ["budget", "finance"],
      ["famous", "famous-personalities"],
      ["citizen", "citizen-corner"],
      ["panchayat", "gram-panchayat"],
      ["farm-advisory", "farm"],
    ];
    const districtModuleRedirects = pairs.map(([from, to]) => ({
      source: "/:locale/:state/:district/" + from,
      destination: "/:locale/:state/:district/" + to,
      permanent: true,
    }));

    // /[locale]/india-detail → /[locale]/india (308 permanent).
    // The old route is being deleted; this preserves bookmarks and the
    // legacy CTAs while we migrate.
    const indiaDetailRedirect = {
      source: "/:locale(en|kn)/india-detail",
      destination: "/:locale/india",
      permanent: true,
    };

    return [...districtModuleRedirects, indiaDetailRedirect];
  },

  // Remove default "x-powered-by: Next.js" header (we set our own above)
  poweredByHeader: false,

  // Compress responses
  compress: true,

  // Image optimisation
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // Match the dashboard project Jayanth uses to view events
  // (forthepeoplein.sentry.io/issues/?project=javascript-nextjs).
  // If org/project ever change, update both here AND in Vercel env so
  // source-map upload at build time still finds the right project.
  org: "forthepeoplein",
  project: "javascript-nextjs",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  // Keep Vercel's per-cron monitoring off — we already have admin dashboards
  // for cron health and don't need duplicate noise in Sentry.
  automaticVercelMonitors: false,
});
