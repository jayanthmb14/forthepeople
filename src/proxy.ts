/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { PLANNED_LOCALES } from "./i18n/languages";

const intlMiddleware = createMiddleware(routing);

// Languages that exist in the registry but are not switched on yet
// (status "planned" in src/i18n/languages.ts) redirect to English.
const UNSHIPPED_LOCALES = PLANNED_LOCALES;

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /<planned locale> and /<planned locale>/* → /en (see UNSHIPPED_LOCALES
  // above; hi and kn are routed beta locales, not in this list). Before
  // this, such a path fell into the [locale] segment and rendered the
  // English homepage with a 200 — a soft 404 that the audit flagged.
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
  // Every page path (locale-prefixed or not); files, _next and API are
  // excluded. Locale codes are NOT listed here, so adding a language to
  // the registry needs no change in this file.
  matcher: [
    "/",
    "/((?!_next|_vercel|api|.*\\..*).*)",
  ],
};
