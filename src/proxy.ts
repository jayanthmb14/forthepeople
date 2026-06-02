/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function proxy(req: NextRequest) {
  // Admin IP restriction (optional — skip if ADMIN_ALLOWED_IPS is empty/unset)
  if (req.nextUrl.pathname.includes("/admin") || req.nextUrl.pathname.includes("/api/admin")) {
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
    "/(en|kn|bn)/:path*",
    "/((?!_next|_vercel|api|.*\\..*).*)",
  ],
};
