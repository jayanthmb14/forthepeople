/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/**
 * Locale prefixes we advertise (footer, old share links, the language
 * toggle in an earlier design) but that have NOT shipped yet. Until the
 * Hindi dictionary lands, send them to English with a temporary redirect
 * (307) so search engines keep the original URL and re-check later.
 * Remove "hi" from this list when /hi goes live.
 */
const UNSHIPPED_LOCALES = ["hi"] as const;

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /hi and /hi/* → /en (temporary, see UNSHIPPED_LOCALES above). Before
  // this, /hi fell into the [locale] segment and rendered the English
  // homepage with a 200 — a soft 404 that the audit flagged.
  for (const locale of UNSHIPPED_LOCALES) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      const url = req.nextUrl.clone();
      url.pathname = `/${routing.defaultLocale}`;
      return NextResponse.redirect(url, 307);
    }
  }

  // Admin IP allowlist — OPTIONAL, best-effort defense-in-depth only. It runs
  // solely when ADMIN_ALLOWED_IPS is set. Real admin auth is per-route via
  // `requireAdmin()` (src/lib/admin-auth.ts); this IP check is NOT the gate.
  //
  // Matcher decision: `/api/admin/*` is intentionally NOT in `config.matcher`
  // below — adding it would run next-intl's middleware over API routes and can
  // rewrite/redirect them. So this allowlist effectively covers the admin
  // *page* (/[locale]/admin) only; API routes are gated by requireAdmin().
  if (pathname.includes("/admin") || pathname.includes("/api/admin")) {
    const allowed = process.env.ADMIN_ALLOWED_IPS?.split(",").map(s => s.trim()) || [];
    if (allowed.length > 0 && allowed[0] !== "") {
      const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
                       req.headers.get("x-real-ip") || "";
      if (!allowed.includes(clientIP)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  return intlMiddleware(req);
}

export const config = {
  // Match all pathnames except for internal Next.js/API routes
  matcher: [
    "/",
    "/(en|kn|hi)/:path*",
    "/((?!_next|_vercel|api|.*\\..*).*)",
  ],
};
