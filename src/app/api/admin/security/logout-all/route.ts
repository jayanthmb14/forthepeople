/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  TOTP_PENDING_COOKIE,
  TOTP_PENDING_TOKEN_COOKIE,
  requireAdminCookie,
  revokeAllAdminSessions,
} from "@/lib/admin-auth";

// Cookie-only: "log me out everywhere" must come from a browser that passed
// 2FA, never from the password-only ops header.
async function isAuthed() {
  const { ok } = await requireAdminCookie();
  return ok;
}

/**
 * POST — revoke EVERY admin session (all devices) by deleting the Redis
 * records, then clear this browser's cookies. Previously this only cleared the
 * current browser's cookie, which is not "logout all".
 */
export async function POST() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const revoked = await revokeAllAdminSessions();

  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  jar.delete(TOTP_PENDING_TOKEN_COOKIE);
  jar.delete(TOTP_PENDING_COOKIE);

  return NextResponse.json(
    { ok: true, revokedSessions: revoked.sessions, revokedPending: revoked.pending },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
