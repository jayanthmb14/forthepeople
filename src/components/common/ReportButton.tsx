/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  ReportButton — "Report a problem", always one tap away, on every page
// ═══════════════════════════════════════════════════════════════════════
//
//  Mounted once in src/app/[locale]/layout.tsx.
//
//    PC / tablet  a small pill in the bottom-right corner:  [⚑ Report a problem]
//    Phone        a 44 px round flag button in the corner (icon only, with a
//                 label for screen readers), so it covers almost nothing.
//
//  It opens a short form that already knows the page: the page title, its
//  address, and — on a district page — the state, district and dashboard.
//  The visitor picks what kind of problem (wrong or old data / something
//  does not work / something else), writes what is wrong and, if they
//  want a reply, an email. It posts to the existing /api/feedback (the
//  same inbox as the "Report a mistake" button in each district page's
//  verification section).
//
//  Not shown on admin pages, nor on India dashboard module pages, which
//  have their own report button (IndiaReportIssueButton) in the same corner.
//
"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, X } from "lucide-react";
import { getDistrict, getState } from "@/lib/constants/districts";
import { getModule } from "@/lib/constants/sidebar-modules";
import { OPEN_REPORT_EVENT } from "@/components/district/shell/ReportMistake";
import s from "./ReportButton.module.css";

type Kind = "wrong_data" | "bug" | "other";
type Phase = "idle" | "sending" | "done" | "failed" | "busy";

const KINDS: readonly Kind[] = ["wrong_data", "bug", "other"];
/** English names for the admin inbox (the visitor's words stay as written). */
const KIND_EN: Record<Kind, string> = { wrong_data: "Wrong or old data", bug: "Something does not work", other: "Other" };

/** Where the report is from: district page context, or the site section. */
export function reportContext(pathname: string): { module?: string; stateSlug?: string; districtSlug?: string } {
  const parts = pathname.split("/").filter(Boolean); // [locale, …]
  const st = parts[1] ? getState(parts[1]) : undefined;
  const dist = st && parts[2] ? getDistrict(st.slug, parts[2]) : undefined;
  if (st && dist) {
    const mod = parts[3] ? getModule(parts[3]) : undefined;
    return { stateSlug: st.slug, districtSlug: dist.slug, module: parts[3] ? mod?.slug : "overview" };
  }
  if (parts[1] === "india") return { module: parts[2] ? `india:${parts[2]}` : "india" };
  return { module: parts[1] ?? "home" };
}

/** India module pages carry their own report button in this corner. */
function hiddenOn(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[1] === "admin") return true;
  return parts[1] === "india" && !!parts[2] && parts[2] !== "category" && parts[2] !== "updates";
}

/** A small flag on a pole, in the warm "attention" colour (decorative). */
function FlagGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden focusable="false" className={s.glyph}>
      <path d="M5 2.6v15" className={s.pole} strokeWidth="1.8" />
      <path d="M5.6 3.4h9.2l-2.3 3.3 2.3 3.3H5.6z" className={s.flag} />
      <circle cx="5" cy="17.6" r="1.2" className={s.base} />
    </svg>
  );
}

export default function ReportButton() {
  const t = useTranslations("header.report");
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("wrong_data");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [tooShort, setTooShort] = useState(false);
  // Read from the browser when the form opens (title and ?query included).
  const [pageTitle, setPageTitle] = useState("");
  const [page, setPage] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const uid = useId();

  const close = useCallback(() => {
    setOpen(false);
    trigger.current?.focus();
  }, []);

  // While open: lock the page scroll, Escape closes, Tab stays inside.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = window.setTimeout(() => textRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab" || !card.current) return;
      const f = Array.from(
        card.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), textarea, a[href]"),
      ).filter((el) => el.offsetParent !== null);
      if (f.length === 0) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  if (hiddenOn(pathname)) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 5) {
      setTooShort(true);
      textRef.current?.focus();
      return;
    }
    setTooShort(false);
    setPhase("sending");
    const ctx = reportContext(pathname);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: kind,
          // The admin inbox is in English: the dashboard's English name and
          // the district slug, or the page address.
          subject: `Report (${KIND_EN[kind]}): ${
            ctx.districtSlug ? `${(ctx.module && getModule(ctx.module)?.label) || "District page"} (${ctx.districtSlug})` : pathname
          }`.slice(0, 200),
          message: message.trim().slice(0, 2000),
          email: email.trim() || undefined,
          module: ctx.module,
          districtSlug: ctx.districtSlug,
          stateSlug: ctx.stateSlug,
          page: (page || pathname).slice(0, 500),
        }),
      });
      setPhase(res.ok ? "done" : res.status === 429 ? "busy" : "failed");
    } catch {
      setPhase("failed");
    }
  }

  const ids = { title: `${uid}-t`, what: `${uid}-w`, hint: `${uid}-h`, email: `${uid}-e`, kind: `${uid}-k` };

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={s.fab}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t("buttonAria")}
        onClick={() => {
          // District pages have their own form that already knows the
          // district and module: open that one instead of a second form.
          if (document.documentElement.dataset.ftpReport === "district") {
            window.dispatchEvent(new Event(OPEN_REPORT_EVENT));
            return;
          }
          // A fresh form after a report was sent.
          if (phase === "done") {
            setMessage("");
            setEmail("");
            setKind("wrong_data");
          }
          if (phase !== "sending") setPhase("idle");
          setPageTitle(document.title.split(" | ")[0]?.trim() ?? "");
          setPage(`${window.location.pathname}${window.location.search}`);
          setOpen(true);
        }}
      >
        <FlagGlyph />
        <span className={s.fabText}>{t("button")}</span>
      </button>

      {open &&
        createPortal(
          <div className={s.backdrop} onClick={close}>
            <div
              ref={card}
              className={s.card}
              role="dialog"
              aria-modal="true"
              aria-labelledby={ids.title}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={s.head}>
                <span className={s.headGlyph} aria-hidden>
                  <FlagGlyph size={22} />
                </span>
                <h2 id={ids.title} className={s.title}>
                  {t("title")}
                </h2>
                <button type="button" className={s.x} onClick={close} aria-label={t("close")}>
                  <X size={18} aria-hidden />
                </button>
              </div>

              {phase === "done" ? (
                <div className={s.done} role="status">
                  <CheckCircle2 size={22} aria-hidden />
                  <p>{t("thanks")}</p>
                  <button type="button" className={s.btn} data-primary="true" onClick={close}>
                    {t("close")}
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <p className={s.intro}>{t("intro")}</p>
                  <p className={s.about}>
                    <span className={s.aboutLabel}>{t("aboutLabel")}</span>
                    <span className={s.aboutPage}>{pageTitle || pathname}</span>
                    <span className={s.aboutUrl} dir="ltr">
                      {page || pathname}
                    </span>
                  </p>

                  <fieldset className={s.kinds}>
                    <legend className={s.label}>{t("kind")}</legend>
                    <div className={s.kindRow}>
                      {KINDS.map((k) => (
                        <label key={k} className={s.kind} data-on={kind === k ? "true" : undefined}>
                          <input type="radio" name={ids.kind} value={k} checked={kind === k} onChange={() => setKind(k)} className={s.radio} />
                          {t(`kinds.${k}`)}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <label htmlFor={ids.what} className={s.label}>
                    {t("what")}
                  </label>
                  <textarea
                    id={ids.what}
                    ref={textRef}
                    className={s.field}
                    rows={4}
                    maxLength={2000}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    aria-describedby={ids.hint}
                    aria-invalid={tooShort || undefined}
                  />
                  <p id={ids.hint} className={s.hint} data-error={tooShort ? "true" : undefined}>
                    {tooShort ? t("tooShort") : t("whatHint")}
                  </p>

                  <label htmlFor={ids.email} className={s.label}>
                    {t("email")}
                  </label>
                  <input
                    id={ids.email}
                    type="email"
                    className={s.field}
                    maxLength={200}
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <p className={s.privacy}>{t("privacy")}</p>

                  {(phase === "failed" || phase === "busy") && (
                    <p className={s.hint} data-error="true" role="alert">
                      {phase === "busy" ? t("busy") : t("failed")}
                    </p>
                  )}

                  <div className={s.actions}>
                    <button type="button" className={s.btn} onClick={close}>
                      {t("cancel")}
                    </button>
                    <button type="submit" className={s.btn} data-primary="true" disabled={phase === "sending"}>
                      {phase === "sending" ? t("sending") : t("send")}
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
