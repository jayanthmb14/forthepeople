/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import SecurityExtras from "./SessionInfoCard";

function SecurityExtrasInline() {
  const params = useParams<{ locale: string }>();
  const locale = (params?.locale as string) || "en";
  return <SecurityExtras locale={locale} />;
}

interface AdminAuthInfo {
  totpEnabled: boolean;
  totpVerifiedAt: string | null;
  recoveryEmail: string;
  recoveryPhone: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  backupCodeCount: number;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return local.substring(0, 3) + "••••••" + "@" + domain;
}

function maskPhone(phone: string): string {
  return phone.substring(0, 4) + "•••••" + phone.substring(phone.length - 5);
}

export default function SecurityPage() {
  const [authInfo, setAuthInfo] = useState<AdminAuthInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // 2FA setup state
  const [setupData, setSetupData] = useState<{ qrCodeDataUrl: string; secret: string; backupCodes: string[] } | null>(null);
  const [setupStep, setSetupStep] = useState<"idle" | "scanning" | "codes" | "done">("idle");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [savedBackupCodes, setSavedBackupCodes] = useState(false);

  // Disable 2FA state
  const [disableCode, setDisableCode] = useState("");
  const [disableError, setDisableError] = useState("");
  const [showDisable, setShowDisable] = useState(false);

  // Recovery email
  const [recoveryEmailInput, setRecoveryEmailInput] = useState("");
  const [recoveryEmailSaving, setRecoveryEmailSaving] = useState(false);
  const [recoveryEmailMsg, setRecoveryEmailMsg] = useState("");
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [testEmailSent, setTestEmailSent] = useState(false);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function loadAuthInfo() {
    try {
      const res = await fetch("/api/admin/security");
      if (res.ok) setAuthInfo(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAuthInfo(); }, []);

  async function startSetup() {
    const res = await fetch("/api/admin/2fa/setup", { method: "POST" });
    const json = await res.json();
    if (!res.ok) { showToast(json.error, false); return; }
    setSetupData(json);
    setSetupStep("scanning");
  }

  async function verifyAndEnable() {
    setVerifyError("");
    const res = await fetch("/api/admin/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: verifyCode.replace(/\s/g, "") }),
    });
    const json = await res.json();
    if (!res.ok) { setVerifyError(json.error); return; }
    setSetupStep("codes");
    showToast("2FA enabled!");
    loadAuthInfo();
  }

  async function disableTOTP() {
    setDisableError("");
    const res = await fetch("/api/admin/2fa/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: disableCode }),
    });
    const json = await res.json();
    if (!res.ok) { setDisableError(json.error); return; }
    setShowDisable(false);
    setDisableCode("");
    showToast("2FA disabled");
    loadAuthInfo();
  }

  async function saveRecoveryEmail() {
    if (!recoveryEmailInput.trim()) return;
    setRecoveryEmailSaving(true);
    try {
      const res = await fetch("/api/admin/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recoveryEmail: recoveryEmailInput.trim() }),
      });
      const json = await res.json();
      if (res.ok) {
        showToast("Recovery email updated");
        setShowChangeEmail(false);
        setRecoveryEmailInput("");
        loadAuthInfo();
      } else {
        setRecoveryEmailMsg(json.error);
      }
    } finally {
      setRecoveryEmailSaving(false);
    }
  }

  async function sendTestEmail() {
    const res = await fetch("/api/admin/2fa/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: authInfo?.recoveryEmail }),
    });
    const json = await res.json();
    if (res.ok) {
      setTestEmailSent(true);
      showToast("Test recovery email sent");
    } else {
      showToast(json.error ?? "Failed to send email", false);
    }
  }

  const cardStyle: React.CSSProperties = {
    background: "#FFFFFF",
    border: "1px solid #E8E8E4",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  };

  if (loading) {
    return <div style={{ padding: 32, color: "#6B6B6B", fontSize: 13 }}>Loading security settings…</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 820, margin: "0 auto" }}>
      <Link href="/en/admin" style={{ fontSize: 12, color: "#2563EB", textDecoration: "none", display: "inline-block", marginBottom: 12 }}>&larr; Back to Admin Dashboard</Link>
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 100,
          background: toast.ok ? "#16A34A" : "#DC2626",
          color: "#fff", padding: "10px 18px", borderRadius: 8,
          fontSize: 13, fontWeight: 600, boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>🔐 Security</h1>
        <div style={{ fontSize: 13, color: "#6B6B6B", marginTop: 4 }}>
          Two-factor authentication, recovery options, team members, and audit log.
        </div>
      </div>

      <SecurityExtrasInline />

      {/* Card 1: Two-Factor Authentication */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 16 }}>
          Two-Factor Authentication (Google Authenticator)
        </div>

        {setupStep === "idle" && (
          <>
            {authInfo?.totpEnabled ? (
              <>
                <div style={{ padding: "10px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, marginBottom: 12 }}>
                  <span style={{ color: "#16A34A", fontWeight: 600, fontSize: 13 }}>✅ 2FA is active</span>
                  {authInfo.totpVerifiedAt && (
                    <span style={{ fontSize: 12, color: "#6B6B6B", marginLeft: 8 }}>
                      Enabled {new Date(authInfo.totpVerifiedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#6B6B6B", marginBottom: 12 }}>
                  Backup codes remaining: <strong>{authInfo.backupCodeCount}</strong> of 8
                </div>
                {!showDisable ? (
                  <button
                    onClick={() => setShowDisable(true)}
                    style={{ padding: "8px 16px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                  >
                    Disable 2FA
                  </button>
                ) : (
                  <div style={{ padding: 12, background: "#FFF1F2", borderRadius: 8, border: "1px solid #FECDD3" }}>
                    <div style={{ fontSize: 12, color: "#DC2626", marginBottom: 8 }}>Enter current TOTP code to confirm disable:</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        value={disableCode}
                        onChange={(e) => setDisableCode(e.target.value)}
                        placeholder="000000"
                        maxLength={6}
                        style={{ padding: "6px 10px", border: "1px solid #FECDD3", borderRadius: 6, fontSize: 16, fontFamily: "monospace", width: 100 }}
                      />
                      <button
                        onClick={disableTOTP}
                        style={{ padding: "6px 14px", background: "#DC2626", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                      >
                        Confirm Disable
                      </button>
                      <button
                        onClick={() => { setShowDisable(false); setDisableCode(""); setDisableError(""); }}
                        style={{ padding: "6px 14px", background: "#E8E8E4", color: "#6B6B6B", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                    </div>
                    {disableError && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 6 }}>{disableError}</div>}
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ padding: "10px 14px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, marginBottom: 16, fontSize: 13, color: "#92400E" }}>
                  ⚠️ 2FA is not enabled. Your admin panel is protected by password only.
                </div>
                <button
                  onClick={startSetup}
                  style={{ padding: "10px 20px", background: "#2563EB", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  Enable 2FA
                </button>
              </>
            )}
          </>
        )}

        {setupStep === "scanning" && setupData && (
          <div>
            <div style={{ fontSize: 13, color: "#6B6B6B", marginBottom: 16 }}>
              Scan this QR code with Google Authenticator (or any TOTP app)
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setupData.qrCodeDataUrl} alt="QR Code" style={{ width: 200, height: 200, marginBottom: 12 }} />
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#9B9B9B", marginBottom: 4 }}>Can&apos;t scan? Enter manually:</div>
              <div style={{
                fontFamily: "monospace", fontSize: 13, padding: "8px 12px",
                background: "#F5F5F0", borderRadius: 6, letterSpacing: "0.15em",
                border: "1px solid #E8E8E4", wordBreak: "break-all",
              }}>
                {setupData.secret.match(/.{1,4}/g)?.join(" ")}
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#1A1A1A", marginBottom: 8 }}>
              Enter the 6-digit code from your app to verify:
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="000000"
                maxLength={7}
                autoFocus
                style={{
                  padding: "8px 12px", border: "1.5px solid #E8E8E4", borderRadius: 7,
                  fontSize: 20, fontFamily: "monospace", letterSpacing: "0.2em", width: 130,
                }}
              />
              <button
                onClick={verifyAndEnable}
                style={{ padding: "8px 18px", background: "#16A34A", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Verify & Enable
              </button>
              <button
                onClick={() => setSetupStep("idle")}
                style={{ padding: "8px 14px", background: "#E8E8E4", color: "#6B6B6B", border: "none", borderRadius: 7, fontSize: 13, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
            {verifyError && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 6 }}>{verifyError}</div>}
          </div>
        )}

        {setupStep === "codes" && setupData && (
          <div>
            <div style={{ padding: "10px 14px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, marginBottom: 14, fontSize: 13, color: "#92400E" }}>
              ⚠️ Save these backup codes! You&apos;ll need them if you lose your phone. They won&apos;t be shown again.
            </div>
            <div style={{ background: "#F5F5F0", borderRadius: 8, padding: 14, marginBottom: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {setupData.backupCodes.map((code) => (
                <div key={code} style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{code}</div>
              ))}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(setupData.backupCodes.join("\n")).then(() => showToast("Codes copied"))}
              style={{ padding: "6px 14px", background: "#E8E8E4", color: "#1A1A1A", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}
            >
              Copy All
            </button>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 12 }}>
              <input type="checkbox" checked={savedBackupCodes} onChange={(e) => setSavedBackupCodes(e.target.checked)} />
              <span style={{ fontSize: 13, color: "#1A1A1A" }}>I have saved my backup codes</span>
            </label>
            <button
              disabled={!savedBackupCodes}
              onClick={() => { setSetupStep("done"); loadAuthInfo(); }}
              style={{
                padding: "10px 20px", background: savedBackupCodes ? "#16A34A" : "#E8E8E4",
                color: savedBackupCodes ? "#fff" : "#9B9B9B",
                border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: savedBackupCodes ? "pointer" : "not-allowed",
              }}
            >
              Done — 2FA is Active
            </button>
          </div>
        )}

        {setupStep === "done" && (
          <div style={{ fontSize: 13, color: "#16A34A", fontWeight: 600 }}>
            ✅ 2FA is active. Refresh the page to see the status.
          </div>
        )}
      </div>

      {/* Card 2: Recovery Options */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 16 }}>
          Recovery Options
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#9B9B9B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            Recovery Email
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#F5F7FF", borderRadius: 8 }}>
            <div>
              <span style={{ fontSize: 13, fontFamily: "monospace", color: "#1A1A1A" }}>
                {authInfo?.recoveryEmail ? maskEmail(authInfo.recoveryEmail) : "Not set"}
              </span>
              <span style={{ marginLeft: 8, fontSize: 11, color: "#16A34A", fontWeight: 600 }}>✅ Active</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={sendTestEmail}
                disabled={testEmailSent}
                style={{ padding: "4px 10px", background: "#E8E8E4", color: "#1A1A1A", border: "none", borderRadius: 5, fontSize: 11, cursor: testEmailSent ? "not-allowed" : "pointer" }}
              >
                {testEmailSent ? "Sent ✓" : "Send Test"}
              </button>
              <button
                onClick={() => setShowChangeEmail(!showChangeEmail)}
                style={{ padding: "4px 10px", background: "#E8E8E4", color: "#1A1A1A", border: "none", borderRadius: 5, fontSize: 11, cursor: "pointer" }}
              >
                Change
              </button>
            </div>
          </div>
          {showChangeEmail && (
            <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
              <input
                type="email"
                value={recoveryEmailInput}
                onChange={(e) => setRecoveryEmailInput(e.target.value)}
                placeholder="new@email.com"
                style={{ flex: 1, padding: "6px 10px", border: "1px solid #E8E8E4", borderRadius: 6, fontSize: 13 }}
              />
              <button
                onClick={saveRecoveryEmail}
                disabled={recoveryEmailSaving}
                style={{ padding: "6px 14px", background: "#2563EB", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Save
              </button>
            </div>
          )}
          {recoveryEmailMsg && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 4 }}>{recoveryEmailMsg}</div>}
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#9B9B9B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            Recovery Phone
          </div>
          <div style={{ padding: "10px 12px", background: "#F5F5F0", borderRadius: 8 }}>
            <span style={{ fontSize: 13, fontFamily: "monospace", color: "#1A1A1A" }}>
              {authInfo?.recoveryPhone ? maskPhone(authInfo.recoveryPhone) : "Not set"}
            </span>
            <span style={{ marginLeft: 8, fontSize: 11, color: "#9B9B9B" }}>Emergency reference (SMS/WhatsApp coming soon)</span>
          </div>
        </div>
      </div>

      {/* Card 3: Login History */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>
          Login History
        </div>
        {authInfo?.lastLoginAt ? (
          <div style={{ fontSize: 13, color: "#6B6B6B" }}>
            Last login: <strong>{new Date(authInfo.lastLoginAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}</strong>
            {authInfo.lastLoginIp && <span style={{ marginLeft: 8, fontFamily: "monospace", fontSize: 12 }}>from {authInfo.lastLoginIp}</span>}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "#9B9B9B" }}>No login history yet.</div>
        )}
      </div>

      {/* Card 4: Active Sessions */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>
          Active Sessions
        </div>
        <div style={{ fontSize: 13, color: "#6B6B6B", marginBottom: 12 }}>
          Session cookie expires 8 hours after login. Click below to invalidate all sessions (requires re-login).
        </div>
        <form method="POST" action="/api/admin/security/logout-all">
          <button
            type="button"
            onClick={() => {
              if (confirm("Log out all sessions? You will need to log in again.")) {
                fetch("/api/admin/security/logout-all", { method: "POST" }).then(() => {
                  window.location.href = window.location.href.replace("/security", "");
                });
              }
            }}
            style={{ padding: "8px 16px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Log Out All Sessions
          </button>
        </form>
      </div>
    </div>
  );
}
