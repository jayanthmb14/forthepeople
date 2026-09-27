/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { DASHBOARDS_PER_DISTRICT, TOTAL_INDIA_DISTRICTS } from "@/lib/constants";

// Counts shown in the All-India Patron copy. Derived, never typed by hand:
// TOTAL_INDIA_DISTRICTS is the canonical district total and
// DASHBOARDS_PER_DISTRICT is the length of the sidebar module registry,
// so adding a module updates "N dashboards" here automatically.
const ALL_INDIA_DISTRICTS = TOTAL_INDIA_DISTRICTS.toLocaleString("en-IN");
const ALL_INDIA_DASHBOARDS = (TOTAL_INDIA_DISTRICTS * DASHBOARDS_PER_DISTRICT).toLocaleString("en-IN");

// Note: dynamic plan creation is now used — these static plan IDs are no
// longer required (kept only for legacy compatibility). See create-subscription route.
export const RAZORPAY_PLANS = {
  district: process.env.RAZORPAY_PLAN_DISTRICT ?? "",
  state: process.env.RAZORPAY_PLAN_STATE ?? "",
  patron: process.env.RAZORPAY_PLAN_PATRON ?? "",
  founder: process.env.RAZORPAY_PLAN_FOUNDER ?? "",
} as const;

export interface TierConfigItem {
  name: string;
  amount: number;       // default amount (shown initially)
  minAmount: number;    // minimum allowed (clamp floor)
  maxAmount: number;    // maximum allowed (clamp ceiling)
  step: number;         // +/- button increment
  isRecurring: boolean;
  description: string;
  hookLine: string;     // motivational one-liner
  emoji: string;
  badgeType: string | null;
  requiresDistrict?: boolean;
  requiresState?: boolean;
  color: string;
  border: string;
  accent: string;
  featured?: boolean;
}

export const TIER_CONFIG: Record<string, TierConfigItem> = {
  custom: {
    name: "One-Time Contribution",
    amount: 50,
    minAmount: 10,
    maxAmount: 50000,
    step: 10,
    isRecurring: false,
    description: "Any amount · one-time · every rupee goes to infrastructure",
    hookLine: "Even ₹50 keeps one district's data running for a day",
    emoji: "☕",
    badgeType: null,
    color: "#FFF7ED",
    border: "#FED7AA",
    accent: "#F97316",
  },
  district: {
    name: "District Champion",
    amount: 99,
    minAmount: 99,
    maxAmount: 998,
    step: 50,
    isRecurring: true,
    description: "Monthly · your name on the district page you champion",
    hookLine: "₹99/mo — one less Zomato order, one more district with free data",
    emoji: "🏛️",
    badgeType: "champion",
    requiresDistrict: true,
    requiresState: true,
    color: "#EFF6FF",
    border: "#BFDBFE",
    accent: "#2563EB",
    featured: true,
  },
  state: {
    name: "State Champion",
    amount: 999,
    minAmount: 999,
    maxAmount: 9998,
    step: 500,
    isRecurring: true,
    description: "Monthly · your name on all districts in one state",
    hookLine: "₹33/day — a cup of coffee to keep an entire state's districts free",
    emoji: "🇮🇳",
    badgeType: "state",
    requiresState: true,
    color: "#F5F3FF",
    border: "#DDD6FE",
    accent: "#7C3AED",
  },
  patron: {
    name: "All-India Patron",
    amount: 9999,
    minAmount: 9999,
    maxAmount: 49998,
    step: 1000,
    isRecurring: true,
    description: `Monthly · featured across all ${ALL_INDIA_DISTRICTS}+ districts, homepage spotlight`,
    hookLine: `${ALL_INDIA_DISTRICTS} districts. ${ALL_INDIA_DASHBOARDS} dashboards. Your name on all of them`,
    emoji: "🌟",
    badgeType: "patron",
    color: "#FEF2F2",
    border: "#FECACA",
    accent: "#DC2626",
  },
  founder: {
    name: "Founding Builder",
    amount: 50000,
    minAmount: 50000,
    maxAmount: 99000,
    step: 5000,
    isRecurring: true,
    description: "Monthly · everything + permanent homepage feature, gold card on every page, listed first everywhere",
    hookLine: "Royal Contributor — permanently etched into India's data revolution",
    emoji: "👑",
    badgeType: "founder",
    color: "#FFFBEB",
    border: "#FDE68A",
    accent: "#D97706",
  },
};

// Ordered tier keys for display (5 cards: row 1 = 3, row 2 = 2)
export const TIER_ORDER = ["custom", "district", "state", "patron", "founder"] as const;

// Tier priority for sorting (higher = more prominent)
// `chai` kept for backward compat with pre-merger DB records.
export const TIER_PRIORITY: Record<string, number> = {
  founder: 6,
  patron: 5,
  state: 4,
  district: 3,
  custom: 1,
  chai: 1,
};
