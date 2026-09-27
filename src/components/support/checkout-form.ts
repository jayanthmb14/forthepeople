/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  The checkout popup's form rules — pure, so they can be unit tested
// ═══════════════════════════════════════════════════════════════════════
//
//  The popup (CheckoutSheet) asks for:
//    • your name        — required, unless "keep me anonymous" is ticked;
//                          it goes to Razorpay for the receipt;
//    • email            — optional, Razorpay sends the receipt there;
//    • phone            — required for monthly plans only (UPI AutoPay /
//                          bank e-mandate), exactly as before;
//    • name to show     — optional; empty = your name; hidden when anonymous;
//    • link + message   — optional; hidden when anonymous;
//    • state / district — only when the plan needs them.
//
//  The payment API is unchanged and still takes ONE `name` plus `isPublic`.
//  resolveCheckout() turns the popup's answers into exactly those fields:
//    shown publicly → name = the name to show (or your name), isPublic true;
//    anonymous      → name = your name if you typed a valid one (so the
//                     team can match the receipt), else "Anonymous";
//                     isPublic false (every public API shows "Anonymous").
//  Validators are the same ones the API routes run, so a form that passes
//  here is not rejected there.

import { validateContributorName } from "@/lib/validators/contributor-name";
import { validateSupporterMessage } from "@/lib/validators/supporter-message";

/** Stored name for an anonymous supporter who typed no name (a valid name for the API). */
export const ANONYMOUS_NAME = "Anonymous";

export interface CheckoutFields {
  name: string;
  email: string;
  phone: string;
  displayName: string;
  message: string;
  socialLink: string;
  anonymous: boolean;
  state: string;
  district: string;
}

export interface CheckoutRules {
  /** Monthly plans need a 10-digit mobile number. */
  phoneRequired: boolean;
  stateRequired: boolean;
  districtRequired: boolean;
}

export type CheckoutField = "name" | "email" | "phone" | "displayName" | "message" | "state" | "district";

/** Why a field is not accepted. `reason` is the shared validator's English text (the UI maps it). */
export type FieldProblem =
  | { kind: "required" }
  | { kind: "name"; reason: string }
  | { kind: "message"; reason: string }
  | { kind: "email" }
  | { kind: "phone" };

export type CheckoutProblems = Partial<Record<CheckoutField, FieldProblem>>;

/** Top-to-bottom order of the fields in the popup (first problem gets the focus). */
export const FIELD_ORDER: CheckoutField[] = ["state", "district", "name", "email", "phone", "displayName", "message"];

/** 10 digits, with any "+91"/"91" prefix and spaces removed (same rule as the API). */
export function phoneDigitsOf(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Every problem with the answers, keyed by field. Empty object = ready to pay. */
export function checkCheckout(f: CheckoutFields, rules: CheckoutRules): CheckoutProblems {
  const out: CheckoutProblems = {};

  const name = f.name.trim();
  if (!name) {
    if (!f.anonymous) out.name = { kind: "required" };
  } else {
    const r = validateContributorName(name);
    if (!r.ok) out.name = { kind: "name", reason: r.reason };
  }

  const email = f.email.trim();
  if (email && !EMAIL_RE.test(email)) out.email = { kind: "email" };

  if (rules.phoneRequired) {
    if (!f.phone.trim()) out.phone = { kind: "required" };
    else if (phoneDigitsOf(f.phone).length !== 10) out.phone = { kind: "phone" };
  }

  if (!f.anonymous) {
    const display = f.displayName.trim();
    if (display) {
      const r = validateContributorName(display);
      if (!r.ok) out.displayName = { kind: "name", reason: r.reason };
    }
    if (f.message) {
      const r = validateSupporterMessage(f.message);
      if (!r.ok) out.message = { kind: "message", reason: r.reason };
    }
  }

  if (rules.stateRequired && !f.state) out.state = { kind: "required" };
  if (rules.districtRequired && !f.district) out.district = { kind: "required" };

  return out;
}

/** The first field with a problem, in on-screen order. */
export function firstProblem(problems: CheckoutProblems): CheckoutField | null {
  return FIELD_ORDER.find((k) => problems[k]) ?? null;
}

export interface ResolvedCheckout {
  /** What the payment API stores and (when public) shows. */
  name: string;
  isPublic: boolean;
  /** Your own name, for the Razorpay receipt (may be empty when anonymous). */
  prefillName: string;
  email?: string;
  phone?: string;
  message?: string;
  socialLink?: string;
}

/** Turn valid answers into the fields the unchanged payment API expects. */
export function resolveCheckout(f: CheckoutFields): ResolvedCheckout {
  const own = f.name.trim().replace(/\s+/g, " ");
  const email = f.email.trim() || undefined;
  const digits = phoneDigitsOf(f.phone);
  const phone = digits || undefined;
  if (f.anonymous) {
    return {
      name: own && validateContributorName(own).ok ? own : ANONYMOUS_NAME,
      isPublic: false,
      prefillName: own,
      email,
      phone,
    };
  }
  const shown = f.displayName.trim().replace(/\s+/g, " ") || own;
  return {
    name: shown,
    isPublic: true,
    prefillName: own,
    email,
    phone,
    message: f.message.trim() || undefined,
    socialLink: f.socialLink.trim() || undefined,
  };
}
