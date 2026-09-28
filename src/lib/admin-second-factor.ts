/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Who may change what protects the admin login. Pure: the routes look up
// the session, the stored 2FA state and the code, and ask here.
//
// The rule: anything that could switch 2FA off or re-key it needs a browser
// session that already passed password + 2FA (the ops header only proves the
// password) AND, while 2FA is on, a fresh code. Otherwise a leaked password
// alone could point the recovery e-mail at itself, mail itself a reset link
// and switch 2FA off (Sept 2026 review).

export type Gate = { ok: true } | { ok: false; status: 400 | 401 | 409; error: string };

/**
 * PATCH /api/admin/security (recovery e-mail / phone), after the route has
 * checked the browser session with requireAdminCookie().
 */
export function canChangeRecovery(input: {
  totpEnabled: boolean;
  /** A code was sent with the request. */
  codeGiven: boolean;
  /** That code matched the stored secret (false when none was checked). */
  codeValid: boolean;
}): Gate {
  if (!input.totpEnabled) return { ok: true };
  if (!input.codeGiven) return { ok: false, status: 400, error: "Enter the current 6-digit code from your authenticator app." };
  if (!input.codeValid) return { ok: false, status: 400, error: "Invalid code" };
  return { ok: true };
}

/** POST /api/admin/2fa/setup: never overwrite the secret and backup codes in use. */
export function canStartTotpSetup(totpEnabled: boolean): Gate {
  return totpEnabled
    ? { ok: false, status: 409, error: "2FA is already on. Disable it first (that needs a current code), then set it up again." }
    : { ok: true };
}
