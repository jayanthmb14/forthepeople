/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════════════════
//  SupportCheckout — a plan card's amount + button, and the checkout popup
// ═══════════════════════════════════════════════════════════════════════
//
//  On the card:   [−] ₹ 99 [+]   [ Subscribe ₹99/mo ]
//  Pressing the button opens a POPUP (the kit DetailSheet: right panel on
//  laptops, bottom sheet on tablets, full screen on phones). In it, top to
//  bottom:
//    1. the amount (still adjustable) and, for monthly plans, "cancel any time";
//    2. where your name goes — state / district, only when the plan needs it;
//    3. about you — your name (required unless anonymous), email for the
//       receipt, and a mobile number for monthly plans (UPI AutoPay needs it);
//    4. "Keep me anonymous";
//    5. on the supporters wall — the name to show, a link (monthly plans; the
//       one-time API has no link field) and a short message, with a live
//       preview of the wall card;
//    6. "Continue to pay ₹99 a month" → Razorpay, as before.
//  After paying, the same popup says thank you; if it fails, it says so and
//  keeps everything typed. Escape, the ✕ and the backdrop close it (not
//  while Razorpay is open). Errors appear politely: after leaving a field,
//  or all at once (with a short amber summary) when Continue is pressed,
//  and the first one gets the focus.
//
//  The money flow is UNCHANGED: the same endpoints (create-order / verify,
//  create-subscription / verify-subscription), the same body fields and the
//  same Razorpay options. The popup's answers are turned into those fields
//  by resolveCheckout() in checkout-form.ts (one `name` + `isPublic`). The
//  English tier `label` is still the Razorpay description, and `accent` is
//  still Razorpay's theme colour. `?tier=&state=&district=` still opens the
//  right plan, now straight into its popup.
//
//  Languages: every word comes from "page_support" (co_* keys); name errors
//  from "page_site.nameError". Validator and link-check messages from the
//  shared libraries are mapped to translated text below.

import { useCallback, useContext, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Github,
  Instagram,
  Linkedin,
  Lock,
  Minus,
  Plus,
  Share2,
  ShieldCheck,
  Twitter,
  XCircle,
} from "lucide-react";
import { QueryClientContext } from "@tanstack/react-query";
import { INDIA_STATES } from "@/lib/constants/districts";
import { validateSocialLink } from "@/lib/social-detect";
import { useFormat, usePlaceText } from "@/i18n/client";
import { nameErrorText } from "@/components/site/name-error";
import { DetailSheet } from "@/components/district/DetailSheet";
import TierArt from "./TierArt";
import SupporterAvatar from "./SupporterAvatar";
import { tierHueClass, tierKeyOf } from "./tier-look";
import {
  checkCheckout,
  firstProblem,
  resolveCheckout,
  type CheckoutField,
  type CheckoutFields,
  type FieldProblem,
} from "./checkout-form";
import look from "./look.module.css";
import css from "./checkout.module.css";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export interface TierConfig {
  /** Kept for compatibility; the card shows a drawn picture (TierArt), never the emoji. */
  emoji: string;
  label: string;
  defaultAmount: number;
  minAmount: number;
  maxAmount: number;
  step: number;
  /** Razorpay's theme colour (Razorpay needs a real colour string). */
  accent: string;
  isMonthly?: boolean;
  isCustom?: boolean;
  tierKey: string;
  requiresDistrict?: boolean;
  requiresState?: boolean;
  hookLine?: string;
}

type Step = "form" | "processing" | "success" | "error";

const RAZORPAY_SRC = "https://checkout.razorpay.com/v1/checkout.js";
const MESSAGE_MAX = 280;

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SRC}"]`
    );
    if (existing) {
      if (window.Razorpay) return resolve(true);
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
  website: ExternalLink,
};

interface Props {
  tier: TierConfig;
}

type SupportT = (key: string, values?: Record<string, string | number>) => string;

/** Translated text for a validateSupporterMessage() failure (English reason in, message out). */
function messageErrorText(t: SupportT, reason: string): string {
  if (reason.startsWith("Message must be text")) return t("co_msgText");
  if (reason.startsWith("Message too short")) return t("co_msgShort");
  if (reason.startsWith("Maximum")) return t("co_msgLong", { n: Number(reason.match(/\d+/)?.[0] ?? MESSAGE_MAX) });
  if (reason.startsWith("Messages can't contain")) return t("co_msgSpam");
  return reason;
}

/** Translated text for a validateSocialLink() warning. */
function socialWarningText(t: SupportT, warning: string): string {
  if (warning.startsWith("Assumed Instagram")) return t("co_socialAssumed");
  if (warning.startsWith("Could not verify")) return t("co_socialUnverified");
  if (warning.startsWith("Invalid link")) return t("co_socialInvalid");
  return warning;
}

/** False on the server and while hydrating, true after — so the popup never renders during SSR. */
const noopSubscribe = () => () => {};
function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export default function SupportCheckout({ tier }: Props) {
  const t = useTranslations("page_support");
  const ts = useTranslations("page_site");
  const locale = useLocale();
  const { number } = useFormat();
  const place = usePlaceText();
  const hydrated = useHydrated();
  const uid = useId();
  const fieldId = (k: string) => `${uid}-${k}`;
  const inr = (n: number) => `₹${number(n)}`;
  const tierKey = tierKeyOf(tier.tierKey);
  // Tier name on screen (the English `tier.label` still goes to Razorpay).
  const tierName = t.has(`tier_${tier.tierKey}_name`) ? t(`tier_${tier.tierKey}_name`) : tier.label;
  // React Query client, if this component is rendered inside <QueryProvider>.
  // Every /[locale]/support page is wrapped by the provider in
  // src/app/[locale]/layout.tsx, but the legacy non-locale /support route is
  // not. Reading the context directly (instead of useQueryClient(), which
  // throws when no provider exists) keeps hook order stable on every render
  // and satisfies react-hooks/rules-of-hooks without a try/catch around a hook.
  const queryClient = useContext(QueryClientContext) ?? null;

  function invalidateContributorQueries() {
    if (!queryClient) return;
    queryClient.invalidateQueries({ queryKey: ["contributors"] });
    queryClient.invalidateQueries({ queryKey: ["contributors-all"] });
    queryClient.invalidateQueries({ queryKey: ["district-sponsors"] });
    queryClient.invalidateQueries({ queryKey: ["homepage-preview"] });
  }

  // `?tier=district&state=karnataka&district=mandya` opens this plan's popup
  // with the place already chosen. This component sits inside <Suspense>
  // (useSearchParams), so these first values are read in the browser.
  const searchParams = useSearchParams();
  const paramTier = searchParams.get("tier");
  const paramState = searchParams.get("state");
  const paramDistrict = searchParams.get("district");
  const autoOpen = paramTier === tier.tierKey;

  const [amount, setAmount] = useState(tier.defaultAmount);
  const [amountStr, setAmountStr] = useState(String(tier.defaultAmount));
  const [open, setOpen] = useState(autoOpen);
  const [step, setStep] = useState<Step>("form");
  const [scriptReady, setScriptReady] = useState(false);
  const [fields, setFields] = useState<CheckoutFields>(() => ({
    name: "",
    email: "",
    phone: "",
    displayName: "",
    message: "",
    socialLink: "",
    anonymous: false,
    state: autoOpen && paramState ? paramState : "",
    district: autoOpen && paramDistrict ? paramDistrict : "",
  }));
  const setField = <K extends keyof CheckoutFields>(k: K, v: CheckoutFields[K]) => setFields((f) => ({ ...f, [k]: v }));
  // Polite validation: a field shows its problem after the visitor leaves
  // it, or after they press Continue.
  const [touched, setTouched] = useState<Partial<Record<CheckoutField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const touch = (k: CheckoutField) => setTouched((m) => (m[k] ? m : { ...m, [k]: true }));

  // True from "Continue" until Razorpay closes: the popup must stay open
  // underneath so it can show the thank-you (or the failure) afterwards.
  const busyRef = useRef(false);

  // Success data
  const [paidAmount, setPaidAmount] = useState(0);

  useEffect(() => {
    loadRazorpayScript().then(setScriptReady);
  }, []);

  const selectedState = fields.state;
  const selectedDistrict = fields.district;

  const socialDetect = useMemo(() => validateSocialLink(fields.socialLink), [fields.socialLink]);
  const detectedPlatform = socialDetect.platform;
  const SocialIcon = detectedPlatform ? SOCIAL_ICONS[detectedPlatform] : null;
  const isVerified = !!detectedPlatform && !socialDetect.warning;
  const hasWarning = !!socialDetect.warning;

  const stateOptions = useMemo(() => INDIA_STATES, []);
  const districtOptions = useMemo(() => {
    if (!selectedState) return [];
    const state = INDIA_STATES.find((s) => s.slug === selectedState);
    return state?.districts ?? [];
  }, [selectedState]);

  // For subscription tiers, get the DB IDs via a lookup
  const [stateDbId, setStateDbId] = useState<string | null>(null);
  const [districtDbId, setDistrictDbId] = useState<string | null>(null);

  // Resolve slugs to DB IDs when selection changes
  useEffect(() => {
    if (selectedState && (tier.requiresState || tier.requiresDistrict)) {
      fetch(`/api/data/resolve-ids?state=${selectedState}&district=${selectedDistrict || ""}`)
        .then((r) => r.json())
        .then((data) => {
          setStateDbId(data.stateId ?? null);
          setDistrictDbId(data.districtId ?? null);
        })
        .catch(() => {});
    }
  }, [selectedState, selectedDistrict, tier.requiresState, tier.requiresDistrict]);

  function handleAmountBlur() {
    const parsed = parseInt(amountStr.replace(/[^0-9]/g, ""), 10);
    const base = Number.isFinite(parsed) ? parsed : tier.minAmount;
    const clamped = Math.max(tier.minAmount, Math.min(base, tier.maxAmount));
    const rounded = Math.round(clamped / tier.step) * tier.step;
    const final = Math.max(tier.minAmount, Math.min(rounded, tier.maxAmount));
    setAmount(final);
    setAmountStr(String(final));
  }

  function adjust(delta: number) {
    const next = Math.max(tier.minAmount, Math.min(tier.maxAmount, amount + delta));
    setAmount(next);
    setAmountStr(String(next));
  }

  const districtRequired = !!tier.requiresDistrict;
  const stateRequired = !!tier.requiresState || districtRequired;
  const showPlace = stateRequired;
  // Phone: required for subscription tiers (UPI AutoPay / bank e-mandate
  // needs a contact). One-time payments never sent it to the API, and
  // Razorpay asks for it on its own page, so the popup does not ask.
  const phoneRequired = !!tier.isMonthly;
  const rules = useMemo(
    () => ({ phoneRequired, stateRequired, districtRequired }),
    [phoneRequired, stateRequired, districtRequired],
  );

  const problems = useMemo(() => checkCheckout(fields, rules), [fields, rules]);
  const problemCount = Object.keys(problems).length;
  const shown = (k: CheckoutField): FieldProblem | undefined => (submitted || touched[k] ? problems[k] : undefined);

  /** Translated text for one field problem. */
  function problemText(k: CheckoutField, p: FieldProblem): string {
    switch (p.kind) {
      case "name":
        return nameErrorText(ts, p.reason);
      case "message":
        return messageErrorText(t, p.reason);
      case "email":
        return t("co_emailInvalid");
      case "phone":
        return t("co_phoneInvalid");
      case "required":
        if (k === "name") return t("co_errNameReq");
        if (k === "phone") return t("co_errPhoneReq");
        if (k === "state") return t("co_errStateReq");
        if (k === "district") return t("co_errDistrictReq");
        return t("co_errNameReq");
    }
  }

  function openCheckout() {
    setStep("form");
    setOpen(true);
  }

  const closeSheet = useCallback(() => {
    // Not while the payment is being created or Razorpay is open on top.
    if (busyRef.current) return;
    setOpen(false);
    setStep("form");
    setSubmitted(false);
  }, []);

  async function handlePay() {
    const r = resolveCheckout(fields);
    busyRef.current = true;
    setStep("processing");
    const done = () => {
      busyRef.current = false;
    };

    try {
      if (tier.isMonthly) {
        // ── Subscription flow ──────────────────────────────
        const res = await fetch("/api/payment/create-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tier: tier.tierKey,
            amount, // user-chosen amount from +/- buttons
            name: r.name,
            email: r.email,
            phone: r.phone,
            districtId: districtDbId || undefined,
            stateId: stateDbId || undefined,
            socialLink: r.socialLink,
            message: r.message,
          }),
        });

        if (!res.ok) throw new Error("Subscription creation failed");
        const { subscriptionId } = await res.json();

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          subscription_id: subscriptionId,
          name: "ForThePeople.in",
          description: tier.label,
          prefill: {
            name: r.prefillName || undefined,
            email: r.email ?? "",
            contact: r.phone ? `+91${r.phone}` : undefined,
          },
          theme: { color: tier.accent },
          modal: {
            ondismiss: () => {
              done();
              setStep("form");
            },
          },
          handler: async (response: {
            razorpay_subscription_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const verifyRes = await fetch("/api/payment/verify-subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_subscription_id: response.razorpay_subscription_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  name: r.name,
                  email: r.email,
                  phone: r.phone,
                  tier: tier.tierKey,
                  amount,
                  districtId: districtDbId || undefined,
                  stateId: stateDbId || undefined,
                  socialLink: r.socialLink,
                  message: r.message,
                  isPublic: r.isPublic,
                }),
              });
              const data = await verifyRes.json();
              if (data.success) {
                setPaidAmount(amount);
                setStep("success");
                // Instantly invalidate all contributor queries so walls refresh
                invalidateContributorQueries();
              } else {
                setStep("error");
              }
            } catch {
              setStep("error");
            } finally {
              done();
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", () => {
          done();
          setStep("error");
        });
        rzp.open();
        setStep("form");
      } else {
        // ── One-time payment flow ──────────────────────────
        const res = await fetch("/api/payment/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            tier: tier.tierKey || tier.label,
            name: r.name,
            email: r.email,
            message: r.message,
            isPublic: r.isPublic,
          }),
        });

        if (!res.ok) throw new Error("Order failed");
        const { orderId, amount: orderAmount, currency, contributionId } = await res.json();

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderAmount,
          currency,
          name: "ForThePeople.in",
          description: tier.label,
          order_id: orderId,
          prefill: {
            name: r.prefillName || undefined,
            email: r.email ?? "",
            contact: r.phone ? `+91${r.phone}` : undefined,
          },
          theme: { color: tier.accent },
          modal: {
            ondismiss: () => {
              done();
              setStep("form");
            },
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const verifyRes = await fetch("/api/payment/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  contributionId,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                setPaidAmount(amount);
                setStep("success");
                // Instantly invalidate all contributor queries so walls refresh
                invalidateContributorQueries();
              } else {
                setStep("error");
              }
            } catch {
              setStep("error");
            } finally {
              done();
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", () => {
          done();
          setStep("error");
        });
        rzp.open();
        setStep("form");
      }
    } catch {
      done();
      setStep("error");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === "processing" || busyRef.current) return;
    const first = firstProblem(problems);
    if (first) {
      setSubmitted(true);
      // Move to the first field that needs attention.
      window.setTimeout(() => document.getElementById(fieldId(first))?.focus(), 0);
      return;
    }
    if (!scriptReady) return;
    handlePay();
  }

  // ── Pieces ────────────────────────────────────────────────
  const atMin = amount <= tier.minAmount;
  const atMax = amount >= tier.maxAmount;
  const stepper = (idSuffix: string) => (
    <div className={css.stepper}>
      <button
        type="button"
        onClick={() => adjust(-tier.step)}
        disabled={atMin}
        aria-label={t("co_decrease", { amount: inr(tier.step) })}
        className={css.stepBtn}
      >
        <Minus size={16} aria-hidden />
      </button>
      <div className={css.amountBox}>
        <span className={`ftp-num ${css.rupee}`} aria-hidden>₹</span>
        <input
          id={fieldId(`amount-${idSuffix}`)}
          type="number"
          inputMode="numeric"
          min={tier.minAmount}
          max={tier.maxAmount}
          step={tier.step}
          value={amountStr}
          aria-label={t("co_amountAria", { tier: tierName })}
          onChange={(e) => setAmountStr(e.target.value)}
          onBlur={handleAmountBlur}
          onKeyDown={(e) => {
            // Enter settles the amount; it never jumps straight to payment.
            if (e.key === "Enter") {
              e.preventDefault();
              handleAmountBlur();
            }
          }}
          className={css.amountInput}
        />
      </div>
      <button
        type="button"
        onClick={() => adjust(tier.step)}
        disabled={atMax}
        aria-label={t("co_increase", { amount: inr(tier.step) })}
        className={css.stepBtn}
      >
        <Plus size={16} aria-hidden />
      </button>
    </div>
  );

  /** Label + control + hint + (polite) error for one field. */
  const field = (
    k: CheckoutField,
    label: string,
    control: (a11y: { id: string; "aria-invalid": boolean; "aria-describedby": string | undefined }) => React.ReactNode,
    opts: { optional?: boolean; hint?: React.ReactNode; aside?: React.ReactNode } = {},
  ) => {
    const id = fieldId(k);
    const problem = shown(k);
    const hintId = opts.hint ? `${id}-hint` : undefined;
    const errId = problem ? `${id}-err` : undefined;
    return (
      <div className={css.field}>
        <label htmlFor={id} className={css.label}>
          {label}
          {opts.optional && <span className={css.optional}>({t("co_optional")})</span>}
        </label>
        {control({ id, "aria-invalid": !!problem, "aria-describedby": [errId, hintId].filter(Boolean).join(" ") || undefined })}
        {problem && (
          <p id={errId} className={css.error}>
            <AlertCircle size={14} aria-hidden />
            {problemText(k, problem)}
          </p>
        )}
        {(opts.hint || opts.aside) && (
          <div className={css.hintRow}>
            {opts.hint ? (
              <p id={hintId} className={css.hint}>
                {opts.hint}
              </p>
            ) : (
              <span />
            )}
            {opts.aside}
          </div>
        )}
      </div>
    );
  };

  const lockedDistrictPicked = !!selectedDistrict && !!districtOptions.find((d) => d.slug === selectedDistrict && !d.active);
  const previewName = fields.anonymous
    ? t("anonymous")
    : (fields.displayName.trim() || fields.name.trim() || t("co_previewYou"));
  const previewMessage = !fields.anonymous && fields.message.trim() ? fields.message.trim() : "";

  // ── Popup content per step ────────────────────────────────
  let body: React.ReactNode;
  let footer: React.ReactNode;

  if (step === "success") {
    const shareText = tier.isMonthly ? t("co_shareSubscribed") : t("co_shareContributed", { amount: inr(paidAmount) });
    const shareUrl = `https://forthepeople.in/${locale}/support`;
    const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
    const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    // The district's supporters page when a district was chosen, else everyone.
    const contributorsUrl = selectedState && selectedDistrict
      ? `/${locale}/${selectedState}/${selectedDistrict}/contributors?just_paid=true`
      : `/${locale}/contributors`;

    body = (
      <div role="status" className={css.result}>
        <TierArt tier={tierKey} size={76} />
        <p className={css.resultTitle}>{t("co_thanks")}</p>
        <p className={css.resultBody}>
          {tier.isMonthly ? t("co_activeMonthly", { amount: inr(paidAmount) }) : t("co_oneTimeThanks", { amount: inr(paidAmount) })}
        </p>
        <p className={css.resultNote}>{fields.anonymous ? t("co_anonSoon") : t("co_nameSoon")}</p>
        <div className={css.row}>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={css.quietBtn}>
            <Share2 size={15} aria-hidden /> {t("co_shareWhatsApp")}
          </a>
          <a href={twitterHref} target="_blank" rel="noopener noreferrer" className={css.quietBtn}>
            <Twitter size={15} aria-hidden /> {t("co_shareX")}
          </a>
        </div>
        <div className={css.row}>
          <Link href={contributorsUrl} className={css.quietBtn} style={{ color: "var(--hue-deep)" }}>
            {t("co_viewContributors")}
          </Link>
          <Link href={`/${locale}`} className={css.quietBtn}>
            {t("co_backHome")}
          </Link>
        </div>
        <p className={css.resultSmall}>
          {t.rich("co_updateLater", { link: (c) => <a href="mailto:support@forthepeople.in">{c}</a> })}
        </p>
      </div>
    );
    footer = (
      <div className={css.foot}>
        <button type="button" onClick={closeSheet} className={css.mainBtn}>
          {t("co_done")}
        </button>
      </div>
    );
  } else if (step === "error") {
    body = (
      <div role="alert" className={css.result}>
        <XCircle size={40} aria-hidden className={css.failIcon} />
        <p className={css.resultTitle} style={{ color: "var(--ftp-text)" }}>{t("co_failed")}</p>
        <p className={css.resultBody}>
          {t.rich("co_failedHelp", { link: (c) => <a href="mailto:support@forthepeople.in">{c}</a> })}
        </p>
      </div>
    );
    footer = (
      <div className={css.foot}>
        <button type="button" onClick={() => setStep("form")} className={css.mainBtn}>
          {t("co_tryAgain")}
        </button>
      </div>
    );
  } else {
    const isLoading = step === "processing";
    body = (
      <form id={fieldId("form")} onSubmit={onSubmit} noValidate className={css.form}>
        {/* 1. The amount */}
        <div className={css.summary}>
          <p className={css.summaryLabel}>{tier.isMonthly ? t("co_youGiveMonthly") : t("co_youGiveOnce")}</p>
          {stepper("sheet")}
          {tier.isMonthly && <p className={css.hint}>{t("co_autoDebit")}</p>}
          {/* NPCI UPI AutoPay cap is ₹15,000 per debit. For higher subscription
              amounts (Founder tier is ₹50k+), users must use card or netbanking. */}
          {tier.isMonthly && amount > 15000 && (
            <p className={`${css.note} ${css.warnNote}`}>
              <AlertTriangle size={15} aria-hidden />
              <span>{t.rich("co_upiNote", { b: (c) => <strong style={{ fontWeight: 650 }}>{c}</strong> })}</span>
            </p>
          )}
        </div>

        {/* Polite summary when Continue finds something to fix: shown on
            screen, and read out once by the (hidden) live region. */}
        <p aria-live="polite" className={css.srLive}>
          {submitted && problemCount > 0 ? t("co_errSummary", { n: problemCount }) : ""}
        </p>
        {submitted && problemCount > 0 && (
          <p className={css.errorSummary} aria-hidden>
            <AlertCircle size={16} aria-hidden />
            {t("co_errSummary", { n: problemCount })}
          </p>
        )}

        {/* 2. Where the name goes — only for plans tied to a place */}
        {showPlace && (
          <fieldset className={css.group}>
            <legend className={css.legend}>{t("co_placeTitle")}</legend>
            {districtRequired && <p className={css.hint}>{t("co_pickDistrict")}</p>}
            {field("state", t("co_stateLabel"), (a) => (
              <div className={css.selectWrap}>
                <select
                  {...a}
                  value={selectedState}
                  onChange={(e) => setFields((f) => ({ ...f, state: e.target.value, district: "" }))}
                  onBlur={() => touch("state")}
                  className={css.input}
                  style={{ color: selectedState ? undefined : "var(--ftp-text-2)" }}
                >
                  <option value="">{t("co_statePick")}</option>
                  {stateOptions.map((s) => (
                    <option key={s.slug} value={s.slug}>{place.state(s.slug, s.name)}</option>
                  ))}
                </select>
                <ChevronDown size={18} aria-hidden />
              </div>
            ))}
            {districtRequired &&
              field("district", t("co_districtLabel"), (a) => (
                <div className={css.selectWrap}>
                  <select
                    {...a}
                    value={selectedDistrict}
                    onChange={(e) => setField("district", e.target.value)}
                    onBlur={() => touch("district")}
                    disabled={!selectedState}
                    className={css.input}
                    style={{ color: selectedDistrict ? undefined : "var(--ftp-text-2)" }}
                  >
                    <option value="">{!selectedState ? t("co_districtFirst") : t("co_districtPick")}</option>
                    {/* Plain-text markers only: ● live, ○ coming soon (no emoji). */}
                    {selectedState && districtOptions.map((d) => (
                      <option key={d.slug} value={d.slug}>
                        {d.active ? "● " : "○ "}{d.active ? d.name : t("co_districtSoon", { name: d.name })}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} aria-hidden />
                </div>
              ))}
            {lockedDistrictPicked && (
              <p className={css.note}>
                <Lock size={15} aria-hidden />
                <span>{t("co_lockedNote")}</span>
              </p>
            )}
          </fieldset>
        )}

        {/* 3. About you */}
        <fieldset className={css.group}>
          <legend className={css.legend}>{t("co_aboutTitle")}</legend>
          {field(
            "name",
            t("co_nameLabel"),
            (a) => (
              <input
                {...a}
                type="text"
                autoComplete="name"
                maxLength={40}
                value={fields.name}
                onChange={(e) => setField("name", e.target.value)}
                onBlur={() => touch("name")}
                className={css.input}
              />
            ),
            { optional: fields.anonymous, hint: t("co_nameHint") },
          )}
          {field(
            "email",
            t("co_emailLabel"),
            (a) => (
              <input
                {...a}
                type="email"
                inputMode="email"
                autoComplete="email"
                value={fields.email}
                onChange={(e) => setField("email", e.target.value)}
                onBlur={() => touch("email")}
                className={css.input}
              />
            ),
            { optional: true, hint: t("co_emailHint") },
          )}
          {phoneRequired &&
            field(
              "phone",
              t("co_phoneLabel"),
              (a) => (
                <input
                  {...a}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={fields.phone}
                  onChange={(e) => setField("phone", e.target.value.slice(0, 14))}
                  onBlur={() => touch("phone")}
                  className={css.input}
                />
              ),
              { hint: t("co_phoneWhy") },
            )}
        </fieldset>

        {/* 4. Anonymous */}
        <label className={css.anonRow}>
          <input
            type="checkbox"
            checked={fields.anonymous}
            onChange={(e) => setField("anonymous", e.target.checked)}
          />
          <span className={css.anonText}>
            <span className={css.anonTitle}>{t("co_anonLabel")}</span>
            <span className={css.hint}>{t("co_anonHint")}</span>
          </span>
        </label>

        {/* 5. On the supporters wall */}
        {!fields.anonymous && (
          <fieldset className={css.group}>
            <legend className={css.legend}>{t("co_wallTitle")}</legend>
            {field(
              "displayName",
              t("co_displayLabel"),
              (a) => (
                <input
                  {...a}
                  type="text"
                  autoComplete="nickname"
                  maxLength={40}
                  placeholder={fields.name.trim() || t("co_displayPh")}
                  value={fields.displayName}
                  onChange={(e) => setField("displayName", e.target.value)}
                  onBlur={() => touch("displayName")}
                  className={css.input}
                />
              ),
              { optional: true, hint: t("co_displayHint") },
            )}
            {/* The link is stored for monthly supporters only (the one-time API has no link field). */}
            {tier.isMonthly && (
              <div className={css.field}>
                <label htmlFor={fieldId("social")} className={css.label}>
                  {t("co_linkLabel")}
                  <span className={css.optional}>({t("co_optional")})</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id={fieldId("social")}
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    placeholder={t("co_socialPh")}
                    value={fields.socialLink}
                    onChange={(e) => setField("socialLink", e.target.value)}
                    aria-describedby={fieldId("social-hint")}
                    className={css.input}
                    style={{ paddingRight: SocialIcon ? 40 : undefined }}
                  />
                  {SocialIcon && (
                    <SocialIcon
                      size={16}
                      aria-hidden
                      style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ftp-text-2)" }}
                    />
                  )}
                </div>
                <p
                  id={fieldId("social-hint")}
                  className={css.hint}
                  style={{
                    display: "flex",
                    gap: 6,
                    alignItems: "flex-start",
                    color: isVerified
                      ? "var(--ftp-live-text)"
                      : hasWarning
                        ? "var(--ftp-warn-text)"
                        : !socialDetect.valid
                          ? "var(--ftp-danger)"
                          : undefined,
                  }}
                >
                  {isVerified && detectedPlatform ? (
                    <>
                      <CheckCircle2 size={14} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
                      {t("co_socialDetected", { platform: detectedPlatform.charAt(0).toUpperCase() + detectedPlatform.slice(1) })}
                    </>
                  ) : hasWarning ? (
                    <>
                      <AlertTriangle size={14} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
                      {socialWarningText(t, socialDetect.warning ?? "")}
                    </>
                  ) : !socialDetect.valid ? (
                    <>
                      <XCircle size={14} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
                      {t("co_socialInvalid")}
                    </>
                  ) : (
                    t("co_socialHint")
                  )}
                </p>
              </div>
            )}
            {field(
              "message",
              t("co_msgLabel"),
              (a) => (
                <textarea
                  {...a}
                  rows={3}
                  maxLength={MESSAGE_MAX}
                  value={fields.message}
                  onChange={(e) => setField("message", e.target.value.slice(0, MESSAGE_MAX))}
                  onBlur={() => touch("message")}
                  className={css.input}
                />
              ),
              {
                optional: true,
                hint: t("co_msgHint"),
                aside: (
                  <span className={css.count} aria-hidden>
                    {t("co_msgCount", { n: number(fields.message.length), max: number(MESSAGE_MAX) })}
                  </span>
                ),
              },
            )}
          </fieldset>
        )}

        {/* How it will look on the wall — updates as they type. */}
        <div className={css.group}>
          <p className={css.summaryLabel} style={{ color: "var(--ftp-text-2)" }}>{t("co_previewTitle")}</p>
          <div className={css.preview}>
            <SupporterAvatar name={previewName} tier={tierKey} size={44} anonymous={fields.anonymous || (!fields.displayName.trim() && !fields.name.trim())} />
            <span className={css.previewText}>
              <span className={css.previewName}>{previewName}</span>
              <span className={css.tierTag}>{tierName}</span>
              {previewMessage && <span className={css.previewMsg}>&ldquo;{previewMessage}&rdquo;</span>}
            </span>
          </div>
        </div>
      </form>
    );
    footer = (
      <div className={css.foot}>
        <button type="submit" form={fieldId("form")} disabled={isLoading || !scriptReady} className={css.mainBtn}>
          <Lock size={16} aria-hidden />
          {isLoading
            ? t("co_opening")
            : !scriptReady
              ? t("co_loadingPay")
              : tier.isMonthly
                ? t("co_continueMonthly", { amount: inr(amount) })
                : t("co_continueOnce", { amount: inr(amount) })}
        </button>
        <p className={css.secure}>
          <ShieldCheck size={14} aria-hidden />
          {t("co_secure")}
        </p>
      </div>
    );
  }

  // ── On the plan card: amount + one button ─────────────────
  return (
    <div className={css.cardAction}>
      {stepper("card")}
      <button type="button" onClick={openCheckout} aria-haspopup="dialog" className={css.mainBtn}>
        {tier.isMonthly
          ? t("co_subscribeMo", { amount: inr(amount) })
          : t("co_contribute", { amount: inr(amount) })}
      </button>

      <DetailSheet
        open={open && hydrated}
        onClose={closeSheet}
        title={tierName}
        subtitle={tier.isMonthly ? t("co_sheetSubMonthly", { amount: inr(amount) }) : t("co_sheetSubOnce", { amount: inr(amount) })}
        media={<TierArt tier={tierKey} size={48} />}
        hueClassName={`${tierHueClass(tierKey)} ${look.metal} ${css.sheet}`}
        footer={footer}
      >
        {body}
      </DetailSheet>
    </div>
  );
}
