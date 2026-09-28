/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Admin 2FA recovery: the page the e-mailed reset link opens. It lives
// OUTSIDE src/app/[locale]/admin/ on purpose: the admin layout shows only
// the password / code form to a logged-out visitor, and someone who lost
// their phone is logged out, so inside it this page could never render.

"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";

function RecoverContent() {
  const searchParams = useSearchParams();
  const params = useParams<{ locale: string }>();
  const loginHref = `/${params?.locale || "en"}/admin`;
  const token = searchParams.get("token");
  // A token in the link means we start verifying straight away.
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(token ? "loading" : "idle");
  const [message, setMessage] = useState("");

  // If token is in URL, auto-verify on mount
  useEffect(() => {
    if (!token) return;
    fetch("/api/admin/2fa/recover/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setStatus("success");
          setMessage(json.message ?? "2FA disabled. You can now log in with your password.");
        } else {
          setStatus("error");
          setMessage(json.error ?? "Invalid or expired recovery link.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Network error. Try again.");
      });
  }, [token]);

  // If no token, show email request form
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");

  async function requestRecovery() {
    setSending(true);
    setSendError("");
    try {
      const res = await fetch("/api/admin/2fa/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (res.ok) {
        setSent(true);
      } else {
        setSendError(json.error ?? "Failed to send email");
      }
    } finally {
      setSending(false);
    }
  }

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: 16,
    background: "#FAFAF8",
    padding: 24,
  };

  if (token) {
    return (
      <div style={containerStyle}>
        <div style={{ fontSize: 32 }}>{status === "success" ? "✅" : status === "error" ? "❌" : "🔄"}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A" }}>
          {status === "loading" ? "Verifying recovery link…" : status === "success" ? "2FA Reset" : "Recovery Failed"}
        </div>
        {message && (
          <div style={{ fontSize: 14, color: status === "error" ? "#DC2626" : "#6B6B6B", textAlign: "center", maxWidth: 360 }}>
            {message}
          </div>
        )}
        {(status === "success" || status === "error") && (
          <a
            href={loginHref}
            style={{
              padding: "10px 24px", background: "#2563EB", color: "#fff",
              textDecoration: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
            }}
          >
            Go to Login
          </a>
        )}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ fontSize: 32 }}>🔐</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A" }}>Admin 2FA Recovery</div>
      <div style={{ fontSize: 13, color: "#6B6B6B", textAlign: "center", maxWidth: 360 }}>
        Enter your recovery email to receive a reset link.
      </div>
      {!sent ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 300 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Recovery email address"
            style={{
              padding: "10px 12px", border: "1.5px solid #E8E8E4",
              borderRadius: 8, fontSize: 14, width: "100%", boxSizing: "border-box",
            }}
          />
          <button
            onClick={requestRecovery}
            disabled={sending || !email.trim()}
            style={{
              padding: "10px 0", background: sending ? "#E8E8E4" : "#2563EB",
              color: sending ? "#9B9B9B" : "#fff",
              border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
              cursor: sending ? "not-allowed" : "pointer",
            }}
          >
            {sending ? "Sending…" : "Send Recovery Email"}
          </button>
          {sendError && <div style={{ fontSize: 12, color: "#DC2626" }}>{sendError}</div>}
        </div>
      ) : (
        <div style={{ fontSize: 14, color: "#16A34A", textAlign: "center" }}>
          ✅ If that email matches our records, a recovery link has been sent. Check your inbox.
        </div>
      )}
      <a href={loginHref} style={{ fontSize: 12, color: "#9B9B9B" }}>← Back to login</a>
    </div>
  );
}

export default function RecoverPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32, color: "#6B6B6B" }}>Loading…</div>}>
      <RecoverContent />
    </Suspense>
  );
}
