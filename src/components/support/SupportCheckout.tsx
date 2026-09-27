/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useState, useEffect, useMemo, useRef, useContext } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Github,
  Instagram,
  Linkedin,
  Lock,
  Minus,
  Plus,
  Share2,
  Twitter,
  XCircle,
} from "lucide-react";
import { INDIA_STATES } from "@/lib/constants/districts";
import { validateSocialLink } from "@/lib/social-detect";
import { validateContributorName } from "@/lib/validators/contributor-name";
import { validateSupporterMessage } from "@/lib/validators/supporter-message";
import { QueryClientContext } from "@tanstack/react-query";
import { useFormat, usePlaceText } from "@/i18n/client";
import { nameErrorText } from "@/components/site/name-error";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

// Design v4 note: this component's LOOK uses --ftp-* tokens and the page hue
// (--hue / --hue-deep; the /support page is rose). Two props are kept for
// compatibility but are not drawn here:
//   • `emoji`  — the /support page shows the tier emoji on the tier card.
//   • `accent` — still passed to Razorpay as `theme.color` (Razorpay needs a
//                real colour string, not a CSS variable); on-page buttons use
//                the page hue instead.
// The payment flow itself (create → Razorpay → verify) is unchanged.
//
// Languages: every word on screen comes from the "page_support" messages
// (co_* keys); name errors from "page_site.nameError". The English tier
// `label` is still what Razorpay receives as the payment description, so
// payment records read the same in every language. Validator and link-check
// messages from the shared libraries are mapped to translated text below.
export interface TierConfig {
  emoji: string;
  label: string;
  defaultAmount: number;
  minAmount: number;
  maxAmount: number;
  step: number;
  accent: string;
  isMonthly?: boolean;
  isCustom?: boolean;
  tierKey: string;
  requiresDistrict?: boolean;
  requiresState?: boolean;
  hookLine?: string;
}

type Step = "idle" | "form" | "processing" | "success" | "error";

const RAZORPAY_SRC = "https://checkout.razorpay.com/v1/checkout.js";

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
  if (reason.startsWith("Maximum")) return t("co_msgLong", { n: Number(reason.match(/\d+/)?.[0] ?? 280) });
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

export default function SupportCheckout({ tier }: Props) {
  const t = useTranslations("page_support");
  const ts = useTranslations("page_site");
  const locale = useLocale();
  const { number } = useFormat();
  const place = usePlaceText();
  const inr = (n: number) => `₹${number(n)}`;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [amount, setAmount] = useState(tier.defaultAmount);
  const [amountStr, setAmountStr] = useState(String(tier.defaultAmount));
  const [step, setStep] = useState<Step>("idle");
  const [scriptReady, setScriptReady] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [socialLink, setSocialLink] = useState("");

  // District/State selection
  const searchParams = useSearchParams();
  const paramTier = searchParams.get("tier");
  const paramState = searchParams.get("state");
  const paramDistrict = searchParams.get("district");

  const [selectedState, setSelectedState] = useState(paramTier === tier.tierKey && paramState ? paramState : "");
  const [selectedDistrict, setSelectedDistrict] = useState(paramTier === tier.tierKey && paramDistrict ? paramDistrict : "");

  // Success data
  const [paidAmount, setPaidAmount] = useState(0);

  useEffect(() => {
    loadRazorpayScript().then(setScriptReady);
  }, []);

  // Auto-open form if URL params match this tier, then scroll into view
  useEffect(() => {
    if (paramTier === tier.tierKey) {
      setStep("form");
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ block: "center" });
      }, 300);
    }
  }, [paramTier, tier.tierKey]);

  const socialDetect = useMemo(() => validateSocialLink(socialLink), [socialLink]);
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

  const showDistrictSelector = tier.requiresDistrict || (!tier.isMonthly && !tier.isCustom);
  const showStateSelector = tier.requiresState || tier.requiresDistrict || (!tier.isMonthly && !tier.isCustom);
  const districtRequired = !!tier.requiresDistrict;
  const stateRequired = !!tier.requiresState;

  // Phone: digits only, 10-digit Indian number (or +91 prefix stripped).
  // Required for subscription tiers (UPI AutoPay / bank e-mandate needs contact).
  const phoneDigits = phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  const phoneValid = phoneDigits.length === 10;
  const phoneRequired = !!tier.isMonthly;

  const nameCheck = useMemo(() => validateContributorName(name), [name]);
  const nameError = name.length > 0 && !nameCheck.ok ? nameErrorText(ts, nameCheck.reason) : null;

  const messageCheck = useMemo(() => validateSupporterMessage(message), [message]);
  const messageError = message.length > 0 && !messageCheck.ok ? messageErrorText(t, messageCheck.reason) : null;

  const canSubmit =
    nameCheck.ok &&
    messageCheck.ok &&
    scriptReady &&
    (!districtRequired || selectedDistrict) &&
    (!stateRequired || selectedState) &&
    (!phoneRequired || phoneValid);

  async function handlePay() {
    if (!canSubmit) return;
    setStep("processing");

    try {
      if (tier.isMonthly) {
        // ── Subscription flow ──────────────────────────────
        const res = await fetch("/api/payment/create-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tier: tier.tierKey,
            amount, // user-chosen amount from +/- buttons
            name: name.trim(),
            email: email.trim() || undefined,
            phone: phoneDigits || undefined,
            districtId: districtDbId || undefined,
            stateId: stateDbId || undefined,
            socialLink: socialLink.trim() || undefined,
            message: message.trim() || undefined,
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
            name: name.trim(),
            email: email.trim(),
            contact: phoneDigits ? `+91${phoneDigits}` : undefined,
          },
          theme: { color: tier.accent },
          modal: {
            ondismiss: () => setStep("form"),
          },
          handler: async (response: {
            razorpay_subscription_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            const verifyRes = await fetch("/api/payment/verify-subscription", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                name: name.trim(),
                email: email.trim() || undefined,
                phone: phoneDigits || undefined,
                tier: tier.tierKey,
                amount,
                districtId: districtDbId || undefined,
                stateId: stateDbId || undefined,
                socialLink: socialLink.trim() || undefined,
                message: message.trim() || undefined,
                isPublic,
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
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", () => setStep("error"));
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
            name: name.trim(),
            email: email.trim() || undefined,
            message: message.trim() || undefined,
            isPublic,
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
            name: name.trim(),
            email: email.trim(),
            contact: phoneDigits ? `+91${phoneDigits}` : undefined,
          },
          theme: { color: tier.accent },
          modal: {
            ondismiss: () => setStep("form"),
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
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
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", () => setStep("error"));
        rzp.open();
        setStep("form");
      }
    } catch {
      setStep("error");
    }
  }

  // ── SUCCESS SCREEN ────────────────────────────────────────
  if (step === "success") {
    const shareText = tier.isMonthly ? t("co_shareSubscribed") : t("co_shareContributed", { amount: inr(paidAmount) });
    const shareUrl = `https://forthepeople.in/${locale}/support`;
    const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
    const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

    // Build contributors page URL if district context available
    const contributorsUrl = selectedState && selectedDistrict
      ? `/${locale}/${selectedState}/${selectedDistrict}/contributors?just_paid=true`
      : `/${locale}`;

    return (
      <div role="status" style={{ textAlign: "center", padding: "16px 0" }}>
        <CheckCircle2 size={32} aria-hidden style={{ color: "var(--ftp-live)", margin: "0 auto 8px", display: "block" }} />
        <p className="ftp-title" style={{ marginBottom: 6 }}>{t("co_thanks")}</p>
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 12 }}>
          {tier.isMonthly ? t("co_activeMonthly", { amount: inr(paidAmount) }) : t("co_oneTimeThanks", { amount: inr(paidAmount) })}
        </p>
        <p className="ftp-body" style={{ ...NOTE, color: "var(--ftp-live-text)", marginBottom: 8 }}>{t("co_nameSoon")}</p>
        <p style={{ ...NOTE, fontSize: 11, lineHeight: 1.5, color: "var(--ftp-text-2)", marginBottom: 16 }}>
          {t.rich("co_updateLater", {
            link: (c) => (
              <a href="mailto:support@forthepeople.in" style={{ color: "var(--hue-deep)", textDecoration: "none", fontWeight: 600 }}>
                {c}
              </a>
            ),
          })}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 8 }}>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="ftp-btn-secondary" style={SECONDARY_BTN}>
            <Share2 size={14} aria-hidden /> {t("co_shareWhatsApp")}
          </a>
          <a href={twitterHref} target="_blank" rel="noopener noreferrer" className="ftp-btn-secondary" style={SECONDARY_BTN}>
            <Twitter size={14} aria-hidden /> {t("co_shareX")}
          </a>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href={contributorsUrl} style={{ ...TEXT_LINK, color: "var(--hue-deep)", fontWeight: 600 }}>
            {t("co_viewContributors")}
          </Link>
          <Link href={`/${locale}`} style={{ ...TEXT_LINK, color: "var(--ftp-text-2)" }}>
            {t("co_backHome")}
          </Link>
        </div>
      </div>
    );
  }

  // ── FORM STEP ─────────────────────────────────────────────
  if (step === "form" || step === "processing") {
    const isLoading = step === "processing";
    const lockedDistrictPicked =
      !!selectedDistrict && !!districtOptions.find((d) => d.slug === selectedDistrict && !d.active);
    return (
      <div ref={containerRef} style={{ paddingTop: 4 }}>
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)", fontWeight: 500, marginBottom: 12 }}>{t("co_almost")}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="text" placeholder={t("co_namePh")} value={name} aria-label={t("co_nameAria")}
            onChange={(e) => setName(e.target.value)} maxLength={40}
            aria-invalid={!!nameError}
            style={{ ...INPUT, borderColor: nameError ? "var(--ftp-danger)" : "var(--ftp-border)" }}
          />
          {nameError && <FieldError>{nameError}</FieldError>}
          <input
            type="email" placeholder={t("co_emailPh")} value={email} aria-label={t("co_emailAria")}
            onChange={(e) => setEmail(e.target.value)}
            style={INPUT}
          />

          {/* NPCI UPI AutoPay cap is ₹15,000 per debit. For higher subscription
              amounts (Founder tier is ₹50k+), users must use card or netbanking. */}
          {tier.isMonthly && amount > 15000 && (
            <div style={{ ...NOTE, display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11, lineHeight: "16px", color: "var(--ftp-text)" }}>
              <AlertTriangle size={14} aria-hidden style={{ color: "var(--ftp-warn)", flexShrink: 0, marginTop: 1 }} />
              <span>{t.rich("co_upiNote", { b: (c) => <strong style={{ fontWeight: 500 }}>{c}</strong> })}</span>
            </div>
          )}

          {/* Phone — required for subscriptions (UPI AutoPay / bank e-mandate),
              optional for one-time contributions. Auto-fills Razorpay checkout. */}
          <div>
            <input
              type="tel"
              inputMode="numeric"
              placeholder={phoneRequired ? t("co_phoneReqPh") : t("co_phoneOptPh")}
              aria-label={phoneRequired ? t("co_phoneReqAria") : t("co_phoneOptAria")}
              value={phone}
              onChange={(e) => setPhone(e.target.value.slice(0, 14))}
              aria-invalid={phoneRequired && !!phone && !phoneValid}
              style={{
                ...INPUT,
                width: "100%",
                borderColor: phoneRequired && phone && !phoneValid ? "var(--ftp-danger)" : "var(--ftp-border)",
              }}
            />
            {phoneRequired && phone && !phoneValid && (
              <FieldError>{t("co_phoneInvalid")}</FieldError>
            )}
            {phoneRequired && !phone && (
              <p style={HINT}>{t("co_phoneWhy")}</p>
            )}
          </div>

          {/* Social link */}
          <label htmlFor={`social-${tier.tierKey}`} className="ftp-body" style={{ color: "var(--ftp-text-2)", fontWeight: 500, marginTop: 2 }}>
            {t("co_socialLabel")}
          </label>
          <div style={{ position: "relative" }}>
            <input
              id={`social-${tier.tierKey}`}
              type="url" placeholder={t("co_socialPh")} value={socialLink}
              onChange={(e) => setSocialLink(e.target.value)}
              style={{ ...INPUT, paddingRight: SocialIcon ? 36 : 12, width: "100%" }}
            />
            {SocialIcon && (
              <SocialIcon
                size={16}
                aria-hidden
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ftp-text-2)" }}
              />
            )}
          </div>
          <p
            style={{
              ...HINT,
              marginTop: -6,
              display: "flex",
              gap: 4,
              alignItems: "flex-start",
              color: isVerified
                ? "var(--ftp-live-text)"
                : hasWarning
                  ? "var(--ftp-warn)"
                  : !socialDetect.valid
                    ? "var(--ftp-danger)"
                    : "var(--ftp-text-2)",
            }}
          >
            {isVerified && detectedPlatform ? (
              <>
                <CheckCircle2 size={12} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
                {t("co_socialDetected", { platform: detectedPlatform.charAt(0).toUpperCase() + detectedPlatform.slice(1) })}
              </>
            ) : hasWarning ? (
              <>
                <AlertTriangle size={12} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
                {socialWarningText(t, socialDetect.warning ?? "")}
              </>
            ) : !socialDetect.valid ? (
              <>
                <XCircle size={12} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
                {t("co_socialInvalid")}
              </>
            ) : (
              t("co_socialHint")
            )}
          </p>

          {/* Helper text explaining required fields for this tier */}
          {districtRequired && (
            <p style={{ ...NOTE, fontSize: 11, lineHeight: 1.5, color: "var(--ftp-text)" }}>{t("co_pickDistrict")}</p>
          )}

          {/* State selector (for district/state tiers, optional for others) */}
          {showStateSelector && (
            <select
              value={selectedState}
              aria-label={stateRequired ? t("co_stateReqAria") : t("co_stateOptAria")}
              onChange={(e) => { setSelectedState(e.target.value); setSelectedDistrict(""); }}
              style={{ ...INPUT, color: selectedState ? "var(--ftp-text)" : "var(--ftp-text-2)" }}
            >
              <option value="">{stateRequired ? t("co_stateReqPh") : t("co_stateOptPh")}</option>
              {stateOptions.map((s) => (
                <option key={s.slug} value={s.slug}>{place.state(s.slug, s.name)}</option>
              ))}
            </select>
          )}

          {/* District selector — always shown when required, disabled until state picked */}
          {showDistrictSelector && (
            <select
              value={selectedDistrict}
              aria-label={districtRequired ? t("co_districtReqAria") : t("co_districtOptAria")}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedState}
              style={{
                ...INPUT,
                background: !selectedState ? "var(--ftp-surface-2)" : "var(--ftp-surface)",
                color: selectedDistrict ? "var(--ftp-text)" : "var(--ftp-text-2)",
                cursor: !selectedState ? "not-allowed" : "pointer",
              }}
            >
              <option value="">
                {!selectedState
                  ? t("co_districtFirst")
                  : districtRequired
                    ? t("co_districtReqPh")
                    : t("co_districtOptPh")}
              </option>
              {/* Plain-text markers only: ● live, ○ coming soon (no emoji). */}
              {selectedState && districtOptions.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.active ? "● " : "○ "}{d.active ? d.name : t("co_districtSoon", { name: d.name })}
                </option>
              ))}
            </select>
          )}

          {/* Show message for locked districts */}
          {lockedDistrictPicked && (
            <p style={{ ...NOTE, display: "flex", gap: 8, alignItems: "flex-start", color: "var(--ftp-text)" }} className="ftp-body">
              <Lock size={14} aria-hidden style={{ color: "var(--hue)", flexShrink: 0, marginTop: 3 }} />
              <span>{t("co_lockedNote")}</span>
            </p>
          )}

          <input
            type="text" placeholder={t("co_msgPh")} value={message} aria-label={t("co_msgAria")}
            onChange={(e) => setMessage(e.target.value.slice(0, 280))}
            aria-invalid={!!messageError}
            style={{ ...INPUT, borderColor: messageError ? "var(--ftp-danger)" : "var(--ftp-border)" }}
          />
          {messageError && <FieldError>{messageError}</FieldError>}

          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", minHeight: 44 }}>
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} style={{ marginTop: 3, flexShrink: 0, width: 16, height: 16 }} />
            <span style={{ fontSize: 11, lineHeight: 1.5, color: "var(--ftp-text)" }}>
              {t("co_public")}<br />
              <span style={{ color: "var(--ftp-text-2)" }}>{t("co_publicHint")}</span>
            </span>
          </label>
        </div>

        {tier.isMonthly && (
          <p style={{ ...HINT, marginTop: 8 }}>{t("co_autoDebit")}</p>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button
            type="button"
            onClick={() => setStep("idle")} disabled={isLoading}
            className="ftp-btn-secondary"
            style={{ ...SECONDARY_BTN, flexShrink: 0 }}>
            <ArrowLeft size={14} aria-hidden /> {t("co_back")}
          </button>
          <button
            type="button"
            onClick={handlePay}
            disabled={!canSubmit || isLoading}
            style={{ ...primaryBtn(!canSubmit || isLoading), flex: 1 }}>
            {isLoading
              ? t("co_opening")
              : tier.isMonthly
                ? t("co_subscribeMonth", { amount: inr(amount) })
                : t("co_contribute", { amount: inr(amount) })}
          </button>
        </div>
      </div>
    );
  }

  // ── ERROR STEP ────────────────────────────────────────────
  if (step === "error") {
    return (
      <div role="alert" style={{ textAlign: "center", paddingTop: 4 }}>
        <p className="ftp-body" style={{ color: "var(--ftp-danger)", marginBottom: 12, display: "flex", gap: 6, alignItems: "center", justifyContent: "center" }}>
          <AlertCircle size={14} aria-hidden /> {t("co_failed")}
        </p>
        <button type="button" onClick={() => setStep("idle")} style={{ ...primaryBtn(false), width: "100%" }}>
          {t("co_tryAgain")}
        </button>
      </div>
    );
  }

  // ── IDLE STEP (amount input + contribute button) ───────────
  const atMin = amount <= tier.minAmount;
  const atMax = amount >= tier.maxAmount;
  return (
    <div>
      {/* Editable amount row: [−] ₹ [amount] [+] — 44 px targets for thumbs */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <button
          type="button"
          onClick={() => adjust(-tier.step)} disabled={atMin}
          aria-label={t("co_decrease", { amount: inr(tier.step) })}
          className="ftp-btn-secondary"
          style={{ ...STEPPER_BTN, cursor: atMin ? "not-allowed" : "pointer", opacity: atMin ? 0.5 : 1 }}>
          <Minus size={16} aria-hidden />
        </button>
        {/* The "/mo" hint lives on the card and the button, not in here:
            inside the box it squeezed 5-digit amounts until they clipped. */}
        <div style={{ ...INPUT, display: "flex", alignItems: "center", flex: 1, padding: "0 8px", minWidth: 0 }}>
          <span className="ftp-num" style={{ fontSize: 15, color: "var(--ftp-text-2)", marginRight: 4 }}>₹</span>
          <input
            type="number" min={tier.minAmount} max={tier.maxAmount} step={tier.step} value={amountStr}
            aria-label={t("co_amountAria", { tier: tierName })}
            onChange={(e) => setAmountStr(e.target.value)}
            onBlur={handleAmountBlur}
            className="ftp-num ftp-no-spin"
            style={{ flex: 1, border: "none", background: "transparent", fontSize: 16, color: "var(--ftp-text)", outline: "none", minWidth: 0, height: 42 }}
          />
        </div>
        <button
          type="button"
          onClick={() => adjust(tier.step)} disabled={atMax}
          aria-label={t("co_increase", { amount: inr(tier.step) })}
          className="ftp-btn-secondary"
          style={{ ...STEPPER_BTN, cursor: atMax ? "not-allowed" : "pointer", opacity: atMax ? 0.5 : 1 }}>
          <Plus size={16} aria-hidden />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setStep("form")} disabled={!scriptReady}
        style={{ ...primaryBtn(false), width: "100%", opacity: scriptReady ? 1 : 0.7 }}>
        {tier.isMonthly
          ? t("co_subscribeMo", { amount: inr(amount) })
          : t("co_contribute", { amount: inr(amount) })}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Presentation helpers (Design v3 tokens only — no hex colours here)
// ─────────────────────────────────────────────────────────────────────

/** Text inputs and selects: 44 px tall, 1 px border, 8 px radius. */
const INPUT: React.CSSProperties = {
  minHeight: 44,
  padding: "10px 12px",
  border: "1px solid var(--ftp-border)",
  borderRadius: "var(--ftp-radius-tile)",
  fontSize: 13,
  lineHeight: "20px",
  outline: "none",
  background: "var(--ftp-surface)",
  color: "var(--ftp-text)",
  boxSizing: "border-box",
};

/** Quiet grey note box (surface-2, no coloured border). */
const NOTE: React.CSSProperties = {
  margin: 0,
  padding: "8px 12px",
  background: "var(--ftp-surface-2)",
  borderRadius: "var(--ftp-radius-tile)",
};

/** 11 px helper line under a field. */
const HINT: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: 11,
  lineHeight: "16px",
  color: "var(--ftp-text-2)",
};

/** Secondary (quiet) button: bordered surface, 44 px tall. */
const SECONDARY_BTN: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  minHeight: 44,
  padding: "0 14px",
  background: "var(--ftp-surface)",
  border: "1px solid var(--ftp-border)",
  borderRadius: "var(--ftp-radius-tile)",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--ftp-text)",
  textDecoration: "none",
  cursor: "pointer",
};

/** Square 44 px −/+ buttons beside the amount. */
const STEPPER_BTN: React.CSSProperties = {
  ...SECONDARY_BTN,
  width: 44,
  padding: 0,
  flexShrink: 0,
  color: "var(--ftp-text-2)",
};

/** Plain text link with a 44 px hit area. */
const TEXT_LINK: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  minHeight: 44,
  fontSize: 13,
  fontWeight: 500,
  textDecoration: "none",
};

/**
 * Primary (filled) button in the page hue with white text (v4: the hue is
 * always a deep enough shade for white type).
 */
function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 44,
    padding: "0 14px",
    background: disabled ? "var(--ftp-border-strong)" : "var(--hue)",
    color: disabled ? "var(--ftp-text-2)" : "#fff",
    border: "none",
    borderRadius: "var(--ftp-radius-tile)",
    boxShadow: disabled ? "none" : "0 6px 16px -8px color-mix(in srgb, var(--hue) 70%, transparent)",
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? "default" : "pointer",
  };
}

/** Red 11 px validation message under a field. */
function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" style={{ ...HINT, marginTop: -4, color: "var(--ftp-danger)" }}>
      {children}
    </p>
  );
}
