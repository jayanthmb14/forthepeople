/**
 * ForThePeople.in — Support page default content
 *
 * Acts as the fallback when the SupportPageConfig row is missing, and as the
 * canonical shape for the admin editor. If you change the structure here,
 * keep SupportPageConfig (schema.prisma) and SupportPageEditor (admin UI) in
 * lockstep.
 *
 * District / state / module counts are pulled from src/lib/platform-facts.ts
 * so the support page and its chatbot never say "9 districts" while the
 * homepage says 10 (GitHub issue #36).
 */

import { getCoveragePhrase, getPlatformFacts } from "@/lib/platform-facts";

const FACTS = getPlatformFacts();

export interface CostBreakdownItem {
  label: string;
  pct: number;
  color: string;
}

export interface HelpItem {
  label: string;
  desc: string;
  url: string;
  icon: string; // emoji
  external: boolean;
}

export interface SupportPageContent {
  bioName: string;
  bioSubtitle: string;
  bioText: string;
  photoUrl: string;
  costBreakdown: CostBreakdownItem[];
  helpItems: HelpItem[];
}

export const SUPPORT_DEFAULTS: SupportPageContent = {
  bioName: "Jayanth M B",
  bioSubtitle: "26 yr old · Entrepreneur from Mandya, Karnataka · Founder - ForThePeople.in",
  bioText: [
    "When I was preparing for civil services during engineering, I spent hours trying to find basic government data about my own district — budgets, infrastructure projects, scheme eligibility, crop prices. The information existed, but it was scattered across dozens of portals, buried in PDFs, and nearly impossible for an ordinary citizen to navigate.",
    "That frustration stayed with me. Years later, I finally built what should have existed all along — ForThePeople.in. A platform that brings all of a district's government data into one clean, accessible dashboard.",
    "A single Instagram reel explaining the platform reached lakhs of people. Citizens from across India started asking for their districts, sharing it with families, telling me this was exactly what they needed.",
    `Today — **${getCoveragePhrase()}**, ${FACTS.modulesPerDistrict} data modules each. Infrastructure projects, elected representatives, crop prices, dam levels, school data, budgets, government exams, and more. The goal: all ${FACTS.totalIndiaDistricts} districts in India.`,
    "This is **not a startup**. Not for profit. A citizen initiative under India's Open Data Policy (NDSAP). Running this costs **more than ₹12 lakh a year** — and I fund it independently.",
    "Every rupee contributed keeps the data live, expands to more districts, and builds new modules.",
  ].join("\n\n"),
  photoUrl: "/jayanth-profile.jpg",
  costBreakdown: [
    { label: "Servers & Hosting (Vercel + Railway)", pct: 40, color: "#2563EB" },
    { label: "AI Analysis & Intelligence (OpenRouter)", pct: 20, color: "#7C3AED" },
    { label: "Data Collection & APIs", pct: 15, color: "#16A34A" },
    { label: "Analytics & Monitoring (Plausible + Sentry)", pct: 10, color: "#F59E0B" },
    { label: "Development & Expansion", pct: 10, color: "#EC4899" },
    { label: "Domain & Security", pct: 5, color: "#6B7280" },
  ],
  helpItems: [
    { label: "Star on GitHub", desc: "Help us get visibility — star the repository", url: "https://github.com/jayanthmb14/forthepeople", icon: "⭐", external: true },
    { label: "Share on social media", desc: "Share ForThePeople.in with #OpenDataIndia", url: "https://twitter.com/intent/tweet?text=Check%20out%20ForThePeople.in%20%E2%80%94%20free%20government%20data%20dashboards%20for%20Indian%20districts%20%23OpenDataIndia&url=https://forthepeople.in", icon: "🐦", external: true },
    { label: "Contribute code", desc: "We're open source — PRs welcome on GitHub", url: "https://github.com/jayanthmb14/forthepeople/issues", icon: "💻", external: true },
    { label: "Send district data", desc: "Know RTI documents or official reports? Share them", url: "/en/feedback", icon: "📊", external: false },
  ],
};
