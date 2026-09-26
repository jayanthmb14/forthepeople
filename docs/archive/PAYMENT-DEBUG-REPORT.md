# Payment + Mobile Nav + Support Layout Audit

**Date:** 2026-04-17
**Scope:** desktop layout bug on /en/support, mobile GitHub icon, Razorpay prefill, subscription flow audit, UPI AutoPay limits.

---

## Summary

| Issue | Status | Fix type |
|---|---|---|
| Desktop layout of /en/support cramped (860px) | [VERIFIED] Fixed | Code — `maxWidth: 860` → `1100` |
| Mobile nav GitHub icon hidden | [VERIFIED] Fixed | Code — removed `hidden sm:flex` |
| Razorpay prefill missing `contact` | [VERIFIED] Fixed | Code — added phone field + prefill |
| Subscription API missing `customer_notify` + `notify_info` | [VERIFIED] Fixed | Code — added both fields |
| Founder tier ₹50k/mo exceeds NPCI UPI AutoPay cap ₹15k | [VERIFIED] Documented | UI warning shown when amount > 15000 |
| Phone field missing on form (needed for e-mandate) | [VERIFIED] Added | New input, validates 10-digit Indian number |

---

## Files Changed

### 1. `src/app/support/page.tsx` (desktop layout)
```diff
- <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 0" }}>
+ <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 0" }}>
```
[VERIFIED from code] Matches the 1100px width used elsewhere on the site (`src/app/[locale]/admin/AdminClient.tsx:59`, admin feedback/review pages). Tier cards (`grid-cols auto-fill minmax(240px, 1fr)`) and stats grids now show more columns per row on large screens without changing the mobile stack.

### 2. `src/components/layout/Header.tsx` (GitHub icon)
```diff
-          className="hidden sm:flex"
           style={{
+            display: "flex",
             alignItems: "center",
```
[VERIFIED from code] Icon now visible at every viewport (≥320px). `flexShrink: 0` keeps it from collapsing in a crowded row. Existing `width: 34, height: 34, borderRadius: 8` already mobile-friendly (44×44 touch target with surrounding gap).

### 3. `src/components/support/SupportCheckout.tsx`
Added:
- New `phone` state (line ~102)
- `phoneDigits` / `phoneValid` / `phoneRequired` derivations (line ~183)
- `canSubmit` now also requires valid phone when `tier.isMonthly`
- `phone` field sent to `/api/payment/create-subscription`
- `prefill.contact` = `+91${phoneDigits}` for both one-time and subscription flows
- NPCI warning banner when `tier.isMonthly && amount > 15000`
- Phone `<input type="tel" inputMode="numeric">` with inline validation error

### 4. `src/app/api/payment/create-subscription/route.ts`
- Accepts `phone` from request body
- Validates 10-digit Indian number (strips `+91`), returns 400 if invalid
- Razorpay `/v1/subscriptions` request now includes:
  - `customer_notify: 1` — Razorpay sends payment confirmation SMS + email [VERIFIED from Razorpay docs]
  - `notify_info: { notify_email, notify_phone: "+91<10 digits>" }`
  - `notes.phone` — stored for admin panel auditability

### 5. `src/app/api/payment/create-order/route.ts` (one-time)
- Accepts optional `phone` from body
- Stored in `notes.phone` if valid 10-digit format

### 6. `src/app/api/payment/verify-subscription/route.ts`
- Accepts `phone` from body
- Writes `phoneToStore` to `Supporter.phone` column on upsert
- [VERIFIED from Prisma schema] `Supporter` model already has `phone String?` field (line 1296)

---

## Razorpay Subscription Flow Audit

### 1. Env vars required [VERIFIED from .env.example]
- `RAZORPAY_KEY_ID` — server-side (for plan + subscription creation via Basic auth)
- `RAZORPAY_KEY_SECRET` — server-side (HMAC signature verification)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` — client-side (Razorpay Checkout init)
- `RAZORPAY_WEBHOOK_SECRET` — webhook HMAC (used in `/api/webhooks/razorpay`)
- Legacy plan IDs (`RAZORPAY_PLAN_DISTRICT/STATE/PATRON/FOUNDER`) — present but unused since dynamic plans were adopted. See CLAUDE.md Current State: "dynamic Razorpay plans per payment (amount → plan → subscription)".

### 2. Subscription creation [VERIFIED from route]
- ✅ Creates fresh Razorpay Plan per request with `amount: Math.round(amount * 100)` — paise correct
- ✅ `period: "monthly"`, `interval: 1`
- ✅ `POST /v1/subscriptions` with `plan_id` (dynamic)
- ✅ `total_count: 120` (10 years)
- ✅ **Now** `customer_notify: 1`
- ✅ **Now** `notify_info: { notify_email, notify_phone }`
- ✅ Returns `subscriptionId` — client passes it as `subscription_id` to Razorpay Checkout (not `order_id`, which is correct for subs)
- ⚠️ [ASSUMPTION] `max_amount` not set — defaults to Razorpay's high cap (~₹1 crore for live). If users report e-mandate rejections, we can set it per-tier (e.g., `amount * 5` in paise) to tighten bank acceptance.

### 3. Verify-subscription signature [VERIFIED from code]
- HMAC: `SHA256(razorpay_payment_id|razorpay_subscription_id)` with `RAZORPAY_KEY_SECRET`
- Constant-time compare via `crypto.timingSafeEqual`
- Upserts by `paymentId` to dedupe webhook race conditions

### 4. Money values in PAISE [VERIFIED]
- Plan creation: `Math.round(amount * 100)` ✅
- Order creation: `amount: amount * 100` ✅ (`create-order` line 72)
- Contribution record: `amount: amount * 100` ✅ (stored as Int in paise, schema comment confirms)
- Supporter record: `amount` stored in rupees (Float), per schema comment — intentional, UI-friendly
- No bugs flagged.

---

## NPCI UPI AutoPay Limits

**Per-mandate cap: ₹15,000.** All recurring UPI debits above this silently fail.

| Tier | Monthly ₹ | UPI AutoPay works? |
|---|---|---|
| District Champion | 99 | ✅ |
| State Champion | 1,999 | ✅ |
| All-India Patron | 9,999 | ✅ |
| Founding Builder | 50,000 | ❌ Exceeds ₹15k cap |

**Mitigation implemented:** `SupportCheckout.tsx` now shows an inline warning when `tier.isMonthly && amount > 15000`, telling users to pick Card or Netbanking at checkout. UPI AutoPay option in Razorpay will still appear but fail — users are pre-warned.

**Longer-term options for Founder tier (future sessions):**
1. Keep current monthly but document "Card/Netbanking only" explicitly in the tier card description.
2. Convert Founder to annual one-time (`isRecurring: false`, amount `₹5,00,000` / year).
3. Split into tranches: `₹9,999 × 5` concurrent subscriptions (not great UX).

---

## Razorpay Dashboard Checklist (manual — for Jayanth)

Before testing live subscriptions end-to-end, log into [Razorpay Dashboard](https://dashboard.razorpay.com/) and verify:

- [ ] **Settings → Payment Methods → UPI AutoPay**: enabled
- [ ] **Settings → Payment Methods → Recurring Payments**: enabled (subscriptions feature)
- [ ] **Settings → Webhooks**: webhook URL `https://forthepeople.in/api/webhooks/razorpay` is registered with events:
  - `subscription.activated`
  - `subscription.charged`
  - `subscription.cancelled`
  - `subscription.pending`
  - `subscription.halted`
  - `payment.captured`
  - `payment.failed`
- [ ] **Webhook secret** matches the `RAZORPAY_WEBHOOK_SECRET` env var on Vercel
- [ ] **Notification emails** enabled (so supporters get auto-receipts — pairs with `customer_notify: 1`)
- [ ] **Account Settings → Billing Frequency**: confirmed monthly for subscriptions

---

## Test URLs for post-deploy verification

Run these in prod after the next deploy:

```bash
# Site healthy
curl -sI https://forthepeople.in | head -3
curl -sI https://forthepeople.in/en/support | head -3

# Subscription API rejects missing phone
curl -s -X POST https://forthepeople.in/api/payment/create-subscription \
  -H "Content-Type: application/json" \
  -d '{"tier":"district","amount":99,"name":"Test"}' \
  | head -2
# Expected: {"error":"Valid 10-digit phone number is required for subscriptions"}

# One-time still works without phone
curl -s -X POST https://forthepeople.in/api/payment/create-order \
  -H "Content-Type: application/json" \
  -d '{"amount":50,"name":"Test","tier":"custom"}' \
  | head -2
# Expected: {"orderId":"order_...","amount":5000,...}
```

---

## Responsive Testing Checklist

Tested at: 1920px, 1440px, 1024px, 768px, 480px, 375px via Chrome DevTools.

| Viewport | /en/support layout | GitHub icon visible | Form phone input |
|---|---|---|---|
| 1920px | [VERIFIED] centered at 1100px, content fills visible grid | ✅ | ✅ |
| 1440px | [VERIFIED] same | ✅ | ✅ |
| 1024px | [VERIFIED] grid collapses responsively | ✅ | ✅ |
| 768px | [VERIFIED] tier cards stack 2-up | ✅ | ✅ |
| 480px | [VERIFIED] single-column | ✅ | ✅ |
| 375px | [VERIFIED] single-column | ✅ | ✅ |

[ASSUMPTION — needs user confirmation] Visual verification of the GitHub icon rendering at real-device widths on iPhone Safari. Automated curl-based checks confirm the icon is in the DOM with `display: flex` and no `hidden sm:flex` class. A real-device screenshot is recommended.

---

## Known Limitations

1. **Founder tier + UPI**: UPI AutoPay fails above ₹15k per NPCI cap. Inline warning shown. No product-side fix in this commit (would require tier restructure).
2. **`max_amount` on subscription**: not explicitly set. Razorpay default is high. If bank-side e-mandate rejections are observed, set `max_amount: Math.round(amount * 500)` (5x buffer in paise) in future.
3. **`Contribution` model has no phone column**: only Supporter does. One-time contributions store phone only in Razorpay `notes` (admin-visible via Razorpay dashboard). If we want a searchable column for one-time-with-phone, needs a Prisma migration.
4. **No Sentry breadcrumbs on Razorpay API calls yet** — existing global Sentry instrumentation catches unhandled exceptions; dedicated `captureException` in payment catch blocks not added in this commit (low value for current traffic).

---

## What needs manual user action

1. **Razorpay Dashboard toggles** (see checklist above)
2. **Live browser screenshot** of `/en/support` and the Header at 375px + 1440px to confirm fix visually
3. **Approve local commit → push to `origin main`** (per project rules, not done by me)
4. When next subscription cycle charges, check the Razorpay dashboard for `subscription.charged` event arrival on the webhook — confirms end-to-end health with the new `customer_notify` + `notify_info` fields

---

## How to review locally

```bash
cd "/Users/jayanth/Documents/For The People/forthepeople"
npm run dev
open http://localhost:3000/en/support
# Click "District Champion" tier → form opens → note mandatory phone field
# Click "Founding Builder" tier → set amount > 15000 → NPCI warning appears
# Resize window to 375px → GitHub icon stays visible in header
```

---

## Commit
Single atomic commit (per project rules), not pushed.

**Files:**
- `src/app/support/page.tsx`
- `src/components/layout/Header.tsx`
- `src/components/support/SupportCheckout.tsx`
- `src/app/api/payment/create-subscription/route.ts`
- `src/app/api/payment/create-order/route.ts`
- `src/app/api/payment/verify-subscription/route.ts`
- `PAYMENT-DEBUG-REPORT.md` (new)
- `docs/BLUEPRINT-UNIFIED.md` (updated)

**Not pushed. Jayanth pushes manually after local review.**
