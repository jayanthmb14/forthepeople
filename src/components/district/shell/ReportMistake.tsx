/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  ReportMistake — the one "Report a mistake" button of a district page
// ═══════════════════════════════════════════════════════════════════════
//
//  Lives in the verification panel at the bottom of every district page.
//  Opens a short form (a bottom sheet on phones, a centred card on PCs)
//  that is already about THIS page: the report goes to /api/feedback as
//  type "wrong_data" with the module, district, state and URL filled in,
//  so the visitor only writes what is wrong (and, if they like, an email).
//  Replaces the floating "Report issue" pill (it covered content on phones
//  and defaulted to "Bug") and the sidebar link that went to feature voting.
//
//  v5.1 — one report form per district page, reachable from anywhere:
//  the site-wide Report button (site chrome) should not open a second,
//  generic form on district pages. While this component is mounted it sets
//  <html data-ftp-report="district">, and it opens itself when
//    • the window event OPEN_REPORT_EVENT ("ftp:open-report") fires, or
//    • the URL hash becomes REPORT_HASH ("#report-mistake") — so a plain
//      link <a href="#report-mistake"> works without JavaScript glue.
//  The form it opens is already about THIS page and district.
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, Flag, X } from "lucide-react";
import { getModule } from "@/lib/constants/sidebar-modules";

interface Props {
  stateSlug: string;
  districtSlug: string;
  /** Module slug, or null on a taluk page. */
  module: string | null;
  /** Page name in the reader's language ("Dams & rivers"). */
  pageName: string;
  /** District name in the reader's language. */
  districtName: string;
}

type Phase = "idle" | "sending" | "done" | "failed";

/** Fire on window to open the district page's report form (site-wide Report button). */
export const OPEN_REPORT_EVENT = "ftp:open-report";
/** A link to this hash opens the form too. */
export const REPORT_HASH = "#report-mistake";

export default function ReportMistake({ stateSlug, districtSlug, module, pageName, districtName }: Props) {
  const t = useTranslations("page_shell");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [tooShort, setTooShort] = useState(false);
  const uid = useId();
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    textRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Let the site-wide Report button hand over to this form (see header).
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.ftpReport = "district";
    const onOpen = () => setOpen(true);
    const onHash = () => {
      if (window.location.hash === REPORT_HASH) setOpen(true);
    };
    window.addEventListener(OPEN_REPORT_EVENT, onOpen);
    window.addEventListener("hashchange", onHash);
    const first = window.setTimeout(onHash, 0);
    return () => {
      delete root.dataset.ftpReport;
      window.removeEventListener(OPEN_REPORT_EVENT, onOpen);
      window.removeEventListener("hashchange", onHash);
      window.clearTimeout(first);
    };
  }, []);

  function close() {
    setOpen(false);
    if (window.location.hash === REPORT_HASH) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    if (phase === "done") {
      setMessage("");
      setEmail("");
      setPhase("idle");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 5) {
      setTooShort(true);
      return;
    }
    setTooShort(false);
    setPhase("sending");
    // The subject is for the admin inbox, which is in English; the
    // visitor's own words go in the message unchanged.
    const moduleEn = module ? (getModule(module)?.label ?? module) : "Taluk page";
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "wrong_data",
          subject: `Wrong data: ${moduleEn} (${districtSlug})`.slice(0, 200),
          message: message.trim().slice(0, 2000),
          email: email.trim() || undefined,
          module: module ?? undefined,
          districtSlug,
          stateSlug,
          page: pathname,
        }),
      });
      setPhase(res.ok ? "done" : "failed");
    } catch {
      setPhase("failed");
    }
  }

  const ids = { title: `${uid}-t`, what: `${uid}-w`, hint: `${uid}-h`, email: `${uid}-e` };

  return (
    <>
      <button type="button" id="report-mistake" className="ftp-verify-btn" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <Flag size={14} aria-hidden />
        {t("report.button")}
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="ftp-report-backdrop" onClick={close}>
            <div
              className="ftp-report-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby={ids.title}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ftp-report-head">
                <h2 id={ids.title} className="ftp-report-title">{t("report.title")}</h2>
                <button type="button" className="ftp-report-x" onClick={close} aria-label={t("report.close")}>
                  <X size={18} aria-hidden />
                </button>
              </div>

              {phase === "done" ? (
                <p className="ftp-report-done" role="status">
                  <CheckCircle2 size={18} aria-hidden />
                  {t("report.thanks")}
                </p>
              ) : (
                <form onSubmit={submit} noValidate>
                  <p className="ftp-report-intro">{t("report.intro")}</p>
                  <p className="ftp-report-about">{t("report.about", { page: pageName, district: districtName })}</p>

                  <label htmlFor={ids.what} className="ftp-report-label">{t("report.what")}</label>
                  <textarea
                    id={ids.what}
                    ref={textRef}
                    className="ftp-report-field"
                    rows={4}
                    maxLength={2000}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    aria-describedby={ids.hint}
                    aria-invalid={tooShort || undefined}
                  />
                  <p id={ids.hint} className="ftp-report-hint" data-error={tooShort ? "true" : undefined}>
                    {tooShort ? t("report.tooShort") : t("report.whatHint")}
                  </p>

                  <label htmlFor={ids.email} className="ftp-report-label">{t("report.email")}</label>
                  <input
                    id={ids.email}
                    type="email"
                    className="ftp-report-field"
                    maxLength={200}
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  {phase === "failed" && <p className="ftp-report-hint" data-error="true" role="alert">{t("report.failed")}</p>}

                  <div className="ftp-report-actions">
                    <button type="button" className="ftp-verify-btn" onClick={close}>{t("report.cancel")}</button>
                    <button type="submit" className="ftp-verify-btn" data-primary="true" disabled={phase === "sending"}>
                      {phase === "sending" ? t("report.sending") : t("report.send")}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
