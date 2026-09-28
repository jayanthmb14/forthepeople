/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// A leaked admin password (the x-admin-secret header) must not be enough to
// move the 2FA recovery e-mail or re-key 2FA (src/lib/admin-second-factor.ts).
import { describe, expect, it } from "vitest";
import { canChangeRecovery, canStartTotpSetup } from "@/lib/admin-second-factor";

describe("canChangeRecovery (after the cookie-only session check)", () => {
  it("asks for a current code while 2FA is on", () => {
    expect(canChangeRecovery({ totpEnabled: true, codeGiven: false, codeValid: false })).toMatchObject({ ok: false, status: 400 });
    expect(canChangeRecovery({ totpEnabled: true, codeGiven: true, codeValid: false })).toMatchObject({ ok: false, status: 400, error: "Invalid code" });
    expect(canChangeRecovery({ totpEnabled: true, codeGiven: true, codeValid: true })).toEqual({ ok: true });
  });
  it("needs only the browser session while 2FA is off", () => {
    expect(canChangeRecovery({ totpEnabled: false, codeGiven: false, codeValid: false })).toEqual({ ok: true });
  });
});

describe("canStartTotpSetup", () => {
  it("never re-keys 2FA that is on (the owner's app and backup codes would stop working)", () => {
    expect(canStartTotpSetup(true)).toMatchObject({ ok: false, status: 409 });
  });
  it("allows setup while 2FA is off", () => {
    expect(canStartTotpSetup(false)).toEqual({ ok: true });
  });
});
