/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * The checkout popup's rules (src/components/support/checkout-form.ts) and
 * the plan colours (src/components/support/tier-look.ts).
 */
import { describe, expect, it } from "vitest";
import {
  ANONYMOUS_NAME,
  checkCheckout,
  firstProblem,
  phoneDigitsOf,
  resolveCheckout,
  type CheckoutFields,
} from "@/components/support/checkout-form";
import { initialsOf, supporterTierKey, tierHueClass, tierKeyFromWallLabel, tierKeyOf } from "@/components/support/tier-look";

const blank: CheckoutFields = {
  name: "",
  email: "",
  phone: "",
  displayName: "",
  message: "",
  socialLink: "",
  anonymous: false,
  state: "",
  district: "",
};
const oneTime = { phoneRequired: false, stateRequired: false, districtRequired: false };
const districtPlan = { phoneRequired: true, stateRequired: true, districtRequired: true };

describe("checkCheckout", () => {
  it("needs a name unless the supporter stays anonymous", () => {
    expect(checkCheckout(blank, oneTime).name).toEqual({ kind: "required" });
    expect(checkCheckout({ ...blank, anonymous: true }, oneTime)).toEqual({});
  });

  it("runs the same name rules as the payment API", () => {
    expect(checkCheckout({ ...blank, name: "Asha Rao" }, oneTime)).toEqual({});
    expect(checkCheckout({ ...blank, name: "SML Finance" }, oneTime).name?.kind).toBe("name");
    // A bad display name is caught too, but only when it will be shown.
    expect(checkCheckout({ ...blank, name: "Asha", displayName: "Call 9876543210" }, oneTime).displayName?.kind).toBe("name");
    expect(checkCheckout({ ...blank, name: "Asha", displayName: "Call 9876543210", anonymous: true }, oneTime).displayName).toBeUndefined();
  });

  it("accepts Indic names", () => {
    expect(checkCheckout({ ...blank, name: "ರವಿ ಕುಮಾರ್" }, oneTime)).toEqual({});
    expect(checkCheckout({ ...blank, name: "राम शर्मा" }, oneTime)).toEqual({});
  });

  it("checks an email only when one is given", () => {
    expect(checkCheckout({ ...blank, name: "Asha", email: "asha@" }, oneTime).email).toEqual({ kind: "email" });
    expect(checkCheckout({ ...blank, name: "Asha", email: "asha@example.org" }, oneTime).email).toBeUndefined();
  });

  it("asks monthly plans for a 10-digit mobile and the place", () => {
    const p = checkCheckout({ ...blank, name: "Asha" }, districtPlan);
    expect(p.phone).toEqual({ kind: "required" });
    expect(p.state).toEqual({ kind: "required" });
    expect(p.district).toEqual({ kind: "required" });
    expect(checkCheckout({ ...blank, name: "Asha", phone: "98765" }, districtPlan).phone).toEqual({ kind: "phone" });
    expect(
      checkCheckout({ ...blank, name: "Asha", phone: "+91 98765 43210", state: "karnataka", district: "mandya" }, districtPlan),
    ).toEqual({});
  });

  it("rejects promotional messages, like the API", () => {
    expect(checkCheckout({ ...blank, name: "Asha", message: "Visit www.example.com" }, oneTime).message?.kind).toBe("message");
    expect(checkCheckout({ ...blank, name: "Asha", message: "Keep going!" }, oneTime).message).toBeUndefined();
  });

  it("focuses the first problem in on-screen order (place first)", () => {
    expect(firstProblem(checkCheckout(blank, districtPlan))).toBe("state");
    expect(firstProblem(checkCheckout(blank, oneTime))).toBe("name");
    expect(firstProblem({})).toBeNull();
  });
});

describe("resolveCheckout", () => {
  it("shows the chosen display name publicly, and keeps the own name for the receipt", () => {
    const r = resolveCheckout({ ...blank, name: "Asha Kumari Rao", displayName: "Asha R", message: " Thanks! ", email: " a@b.in " });
    expect(r).toMatchObject({ name: "Asha R", isPublic: true, prefillName: "Asha Kumari Rao", message: "Thanks!", email: "a@b.in" });
  });

  it("falls back to the own name when no display name is typed", () => {
    expect(resolveCheckout({ ...blank, name: "  Asha   Rao " }).name).toBe("Asha Rao");
  });

  it("anonymous: never public; keeps a typed name, else a placeholder the API accepts", () => {
    const withName = resolveCheckout({ ...blank, name: "Asha", anonymous: true, displayName: "X", message: "Hello there" });
    expect(withName).toMatchObject({ name: "Asha", isPublic: false });
    expect(withName.message).toBeUndefined();
    expect(withName.socialLink).toBeUndefined();
    expect(resolveCheckout({ ...blank, anonymous: true })).toMatchObject({ name: ANONYMOUS_NAME, isPublic: false, prefillName: "" });
  });

  it("normalises the phone like the API", () => {
    expect(phoneDigitsOf("+91 98765-43210")).toBe("9876543210");
    expect(resolveCheckout({ ...blank, name: "Asha", phone: "919876543210" }).phone).toBe("9876543210");
  });
});

describe("tier-look", () => {
  it("maps stored tiers and wall labels to a plan colour", () => {
    expect(tierKeyOf("chai")).toBe("custom");
    expect(tierKeyOf("patron")).toBe("patron");
    expect(tierKeyOf(null)).toBe("custom");
    expect(tierHueClass("founder")).toBe("ftp-hue-yellow");
    expect(tierHueClass("district")).toBe("ftp-hue-blue");
    expect(tierKeyFromWallLabel("🌟 All-India Patron")).toBe("patron");
    expect(tierKeyFromWallLabel("☕ Chai Supporter")).toBe("custom");
  });

  it("colours big one-time gifts by what they gave", () => {
    expect(supporterTierKey({ id: "1", name: "F", tier: "custom", amount: 50000 })).toBe("founder");
    expect(supporterTierKey({ id: "2", name: "P", tier: "custom", amount: 12000 })).toBe("patron");
    expect(supporterTierKey({ id: "3", name: "S", tier: "state", amount: null })).toBe("state");
    expect(supporterTierKey({ id: "4", name: "C", tier: "custom", amount: 50 })).toBe("custom");
  });

  it("makes initials from the first and last words, Indic too", () => {
    expect(initialsOf("asha kumari rao")).toBe("AR");
    expect(initialsOf("Micah")).toBe("M");
    expect(initialsOf("ರವಿ ಕುಮಾರ್")).toBe("ರಕ");
    expect(initialsOf("  ")).toBe("");
  });
});
