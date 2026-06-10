/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { cookies } from "next/headers";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBot from "@/components/admin/AdminBot";
import { loginAction, totpAction } from "./actions";
import { requireAdmin } from "@/lib/admin-auth";

const TOTP_PENDING_COOKIE = "admin_totp_pending";

type Params = Promise<{ locale: string }>;

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const { locale } = await params;
  const jar = await cookies();
  const { ok: authed } = await requireAdmin();
  const totpPending = jar.get(TOTP_PENDING_COOKIE)?.value === "ok";

  if (!authed) {
    const showTOTP = totpPending;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 16,
          background: "#FAFAF8",
        }}
      >
        <div style={{ fontSize: 24 }}>{showTOTP ? "🔐" : "🛡️"}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A" }}>Admin Dashboard</div>
        <div style={{ fontSize: 13, color: "#6B6B6B" }}>ForThePeople.in</div>

        {showTOTP ? (
          <div style={{ width: 320 }}>
            <div style={{ fontSize: 13, color: "#6B6B6B", textAlign: "center", marginBottom: 16 }}>
              Enter the 6-digit code from Google Authenticator
            </div>
            <form
              action={totpAction}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
              id="totp-form"
            >
              <input type="hidden" name="locale" value={locale} />
              <input
                type="text"
                name="code"
                placeholder="000 000"
                autoFocus
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={7}
                style={{
                  padding: "12px 14px",
                  border: "1.5px solid #E8E8E4",
                  borderRadius: 8,
                  fontSize: 24,
                  letterSpacing: "0.3em",
                  textAlign: "center",
                  width: "100%",
                  boxSizing: "border-box",
                  fontFamily: "monospace",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "10px 0",
                  background: "#2563EB",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Verify
              </button>
            </form>
            <details style={{ marginTop: 12 }}>
              <summary style={{ fontSize: 12, color: "#6B6B6B", cursor: "pointer" }}>
                Lost your phone? Use backup code
              </summary>
              <form
                action={totpAction}
                style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}
              >
                <input type="hidden" name="locale" value={locale} />
                <input
                  type="text"
                  name="backupCode"
                  placeholder="XXXX-XXXX"
                  style={{
                    padding: "8px 10px",
                    border: "1.5px solid #E8E8E4",
                    borderRadius: 7,
                    fontSize: 14,
                    letterSpacing: "0.1em",
                    fontFamily: "monospace",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: "8px 0",
                    background: "#7C3AED",
                    color: "#fff",
                    border: "none",
                    borderRadius: 7,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Use Backup Code
                </button>
              </form>
            </details>
            <div style={{ marginTop: 10, textAlign: "center" }}>
              <a
                href={`/${locale}/admin`}
                style={{ fontSize: 11, color: "#9B9B9B", textDecoration: "underline" }}
              >
                Back to password
              </a>
              {" · "}
              <a
                href={`/${locale}/admin/recover`}
                style={{ fontSize: 11, color: "#9B9B9B", textDecoration: "underline" }}
              >
                Send recovery email
              </a>
            </div>
          </div>
        ) : (
          <form
            action={loginAction}
            style={{ display: "flex", flexDirection: "column", gap: 8, width: 280 }}
          >
            <input type="hidden" name="locale" value={locale} />
            <input
              type="password"
              name="password"
              placeholder="Admin password"
              autoFocus
              required
              style={{
                padding: "10px 12px",
                border: "1.5px solid #E8E8E4",
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "10px 0",
                background: "#2563EB",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Login
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "calc(100vh - 56px)",
        background: "#FAFAF8",
      }}
    >
      <AdminSidebar locale={locale} />
      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </main>
      <AdminBot />
    </div>
  );
}
