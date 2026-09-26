/**
 * One-shot admin endpoint to seed the Karnataka tenders dataset into
 * production. Idempotent — safe to re-run (all entries are upserted).
 *
 * Auth (either one):
 *   - a logged-in admin browser session (cookie), OR
 *   - `Authorization: Bearer <SEED_SECRET>` — checked HERE, in constant time.
 *     SEED_SECRET is scoped to this single endpoint; it is no longer a
 *     universal admin credential (it used to be accepted by requireAdmin()).
 *     Generate a fresh value with `openssl rand -hex 32` and set it on Vercel.
 *
 * Wrong bearer tokens count against the same "admin-header-fail" limiter as
 * the other ops headers (10 per 15 min per IP, fail closed).
 *
 * Usage:
 *   curl -X POST https://forthepeople.in/api/admin/seed-tenders \
 *        -H "Authorization: Bearer <SEED_SECRET>"
 *
 * Not intended for routine scheduling — this is a migration tool to
 * bootstrap tenders data once the NEW Neon database has the Tender*
 * schema (auto-applied by vercel.json's buildCommand).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminCookie, safeEqual } from "@/lib/admin-auth";
import { getClientIp, hashIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";

// Vercel Pro allows up to 60s — seed touches ~80 rows across 5 tables,
// well within budget. Bump if you ever grow the seed substantially.
export const maxDuration = 60;

// Force this route to be dynamic — never statically generated.
export const dynamic = "force-dynamic";

/** Bearer-token check scoped to this route. Returns "ok" | "fail" | "absent". */
function checkSeedSecret(req: NextRequest): "ok" | "fail" | "absent" {
  const auth = req.headers.get("authorization");
  if (!auth) return "absent";
  const seedSecret = process.env.SEED_SECRET;
  if (!seedSecret) return "fail"; // unset ⇒ bearer path closed, never "Bearer undefined"
  if (!auth.startsWith("Bearer ")) return "fail";
  return safeEqual(auth.slice("Bearer ".length), seedSecret) ? "ok" : "fail";
}

export async function POST(req: NextRequest) {
  let authorized = (await requireAdminCookie()).ok;

  if (!authorized) {
    const ipHash = hashIp(getClientIp(req));
    const limiterKey = `admin-header-fail:${ipHash}`;
    const rl = await rateLimit(limiterKey, 10, 15 * 60, { failClosed: true });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many failed attempts. Try again in 15 minutes." },
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }
    const result = checkSeedSecret(req);
    if (result === "ok") {
      await resetRateLimit(limiterKey); // a correct token must not count as a failure
      authorized = true;
    } else if (result === "fail") {
      console.warn(JSON.stringify({ event: "seed_secret_auth_failed", ipHash }));
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Dynamic import so the seed module isn't loaded unless this route fires.
    const mod = await import("@/../prisma/seed-tenders-karnataka");
    await mod.seedTendersKarnataka();
    return NextResponse.json({
      success: true,
      message:
        "Tenders seed complete. Check Prisma Studio or /api/tenders/<district>?status=LIVE to verify.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
