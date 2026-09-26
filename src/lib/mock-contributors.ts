/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * DEV-ONLY in-memory mock contributor generator.
 * Activated only when FTP_MOCK_CONTRIBUTORS=1 AND NODE_ENV !== "production".
 * Used by /api/data/contributors to return fabricated data without touching the DB.
 *
 * This file must never be imported when the flag is off — the route guards
 * the call, and isMockEnabled() double-checks NODE_ENV.
 */

import { calculateOneTimeExpiry } from "./contribution-expiry";

export function isMockEnabled(): boolean {
  // Double-gated: requires the dev-only env var AND NODE_ENV=development.
  // Even if the env var leaks to Vercel (where NODE_ENV=production), mock stays off.
  return (
    process.env.FTP_MOCK_CONTRIBUTORS === "1" &&
    process.env.NODE_ENV === "development"
  );
}

interface MockContributor {
  id: string;
  name: string;
  amount: number; // raw amount kept internally for sorting
  tier: string;
  badgeType: string | null;
  badgeLevel: string | null;
  socialLink: string | null;
  socialPlatform: string | null;
  districtId: string | null;
  stateId: string | null;
  districtName: string | null;
  stateName: string | null;
  districtSlug: string | null;
  stateSlug: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  isRecurring: boolean;
  monthsActive: number;
  message: string | null;
  createdAt: string;
}

const FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
  "Rohan", "Rahul", "Ananya", "Saanvi", "Aadhya", "Priya", "Kavya", "Diya", "Pari", "Karthik",
  "Manoj", "Suresh", "Ramesh", "Deepa", "Anita", "Meera", "Farhan", "Zara", "Aisha", "Fatima",
  "Tanvi", "Neha", "Shreya", "Pooja", "Vikram", "Nikhil", "Pranav", "Ashish", "Amit", "Sanjay",
  "Vijay", "Ravi", "Kiran", "Lakshmi", "Padma", "Revathi", "Mallika", "Deepika", "Arun", "Karan",
];
const LAST_NAMES = [
  "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Shah", "Mehta", "Agarwal", "Jain",
  "Iyer", "Nair", "Menon", "Reddy", "Rao", "Naidu", "Chatterjee", "Banerjee", "Das", "Ghosh",
  "Bose", "Sen", "Roy", "Khan", "Ali", "Ahmed", "Joshi", "Desai", "Bhatt", "Trivedi",
];
const MESSAGES = [
  "Keep up the great work!",
  "For a transparent India 🇮🇳",
  "Open data for every citizen",
  "Building the future, one district at a time",
  "Love what you're doing",
  null, null, null, null, null,
];
const SOCIAL_TEMPLATES = [
  (h: string) => ({ url: `https://instagram.com/${h}`, platform: "instagram" }),
  (h: string) => ({ url: `https://linkedin.com/in/${h}`, platform: "linkedin" }),
  (h: string) => ({ url: `https://github.com/${h}`, platform: "github" }),
  (h: string) => ({ url: `https://x.com/${h}`, platform: "twitter" }),
  () => null,
  () => null,
];

// Seeded pseudo-random so the same mock pool is returned every request.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6D2B79F5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function calcBadge(monthsActive: number): string | null {
  if (monthsActive >= 24) return "platinum";
  if (monthsActive >= 12) return "gold";
  if (monthsActive >= 6) return "silver";
  if (monthsActive >= 3) return "bronze";
  return null;
}

function generate(count: number): MockContributor[] {
  const rng = mulberry32(42); // fixed seed = stable output
  const out: MockContributor[] = [];

  // Tier distribution scaled for 10,000:
  //   3 founder, 25 patrons, 200 state, 2000 district, 3000 chai, ~4772 custom
  const tiers: Array<{ tier: string; end: number }> = [
    { tier: "founder", end: Math.max(1, Math.round(count * 0.0003)) },
    { tier: "patron", end: Math.max(3, Math.round(count * 0.0028)) },
    { tier: "state", end: Math.max(10, Math.round(count * 0.0228)) },
    { tier: "district", end: Math.max(50, Math.round(count * 0.2228)) },
    { tier: "chai", end: Math.max(100, Math.round(count * 0.5228)) },
    { tier: "custom", end: count },
  ];

  // Real state/district pool (slugs & names that match INDIA_STATES in the codebase).
  const statePool: Array<{ slug: string; name: string }> = [
    { slug: "karnataka", name: "Karnataka" },
    { slug: "maharashtra", name: "Maharashtra" },
    { slug: "tamil-nadu", name: "Tamil Nadu" },
    { slug: "telangana", name: "Telangana" },
    { slug: "delhi", name: "Delhi" },
    { slug: "kerala", name: "Kerala" },
    { slug: "uttar-pradesh", name: "Uttar Pradesh" },
  ];
  const districtPool: Array<{ slug: string; name: string; stateSlug: string; stateName: string }> = [
    { slug: "mandya", name: "Mandya", stateSlug: "karnataka", stateName: "Karnataka" },
    { slug: "bengaluru-urban", name: "Bengaluru Urban", stateSlug: "karnataka", stateName: "Karnataka" },
    { slug: "mysuru", name: "Mysuru", stateSlug: "karnataka", stateName: "Karnataka" },
    { slug: "mumbai", name: "Mumbai", stateSlug: "maharashtra", stateName: "Maharashtra" },
    { slug: "pune", name: "Pune", stateSlug: "maharashtra", stateName: "Maharashtra" },
    { slug: "chennai", name: "Chennai", stateSlug: "tamil-nadu", stateName: "Tamil Nadu" },
    { slug: "hyderabad", name: "Hyderabad", stateSlug: "telangana", stateName: "Telangana" },
    { slug: "new-delhi", name: "New Delhi", stateSlug: "delhi", stateName: "Delhi" },
    { slug: "lucknow", name: "Lucknow", stateSlug: "uttar-pradesh", stateName: "Uttar Pradesh" },
  ];

  for (let i = 0; i < count; i++) {
    const tier = tiers.find((t) => i < t.end)!.tier;
    const firstName = pick(rng, FIRST_NAMES);
    const lastName = pick(rng, LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    const handle = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${i}`;
    const social = pick(rng, SOCIAL_TEMPLATES)(handle);
    const message = pick(rng, MESSAGES);
    const isPublic = rng() > 0.05;

    const isRecurring = ["founder", "patron", "state", "district"].includes(tier);

    let amount = 0;
    let stateData: typeof statePool[number] | null = null;
    let districtData: typeof districtPool[number] | null = null;
    let activatedAt: Date | null = null;
    let expiresAt: Date | null = null;
    let monthsActive = 0;

    if (tier === "founder") {
      amount = 50000 + randInt(rng, 0, 9) * 5000;
      monthsActive = randInt(rng, 3, 24);
      activatedAt = new Date(Date.now() - monthsActive * 30 * 24 * 60 * 60 * 1000);
    } else if (tier === "patron") {
      amount = 9999 + randInt(rng, 0, 4) * 1000;
      monthsActive = randInt(rng, 1, 18);
      activatedAt = new Date(Date.now() - monthsActive * 30 * 24 * 60 * 60 * 1000);
    } else if (tier === "state") {
      amount = 999 + randInt(rng, 0, 4) * 500;
      stateData = pick(rng, statePool);
      monthsActive = randInt(rng, 1, 14);
      activatedAt = new Date(Date.now() - monthsActive * 30 * 24 * 60 * 60 * 1000);
    } else if (tier === "district") {
      amount = 99 + randInt(rng, 0, 20) * 50;
      districtData = pick(rng, districtPool);
      stateData = { slug: districtData.stateSlug, name: districtData.stateName };
      monthsActive = randInt(rng, 1, 12);
      activatedAt = new Date(Date.now() - monthsActive * 30 * 24 * 60 * 60 * 1000);
    } else if (tier === "chai") {
      amount = 50 * randInt(rng, 1, 20);
      if (rng() < 0.4) {
        districtData = pick(rng, districtPool);
        stateData = { slug: districtData.stateSlug, name: districtData.stateName };
      }
      expiresAt = calculateOneTimeExpiry(amount, new Date(Date.now() - randInt(rng, 0, 20) * 24 * 60 * 60 * 1000));
    } else {
      amount = 10 * randInt(rng, 1, 500);
      if (rng() < 0.3) {
        districtData = pick(rng, districtPool);
        stateData = { slug: districtData.stateSlug, name: districtData.stateName };
      }
      expiresAt = calculateOneTimeExpiry(amount, new Date(Date.now() - randInt(rng, 0, 20) * 24 * 60 * 60 * 1000));
    }

    const badgeLevel = isRecurring ? calcBadge(monthsActive) : null;
    const badgeType =
      tier === "founder" ? "founder"
      : tier === "patron" ? "patron"
      : tier === "state" ? "state"
      : tier === "district" ? "champion"
      : null;

    const isAnon = !isPublic;
    const createdAt = activatedAt ?? new Date(Date.now() - randInt(rng, 0, 90) * 24 * 60 * 60 * 1000);

    out.push({
      id: `mock_${i}`,
      name: isAnon ? "Anonymous" : name,
      amount, // keep raw amount; helpers null it for recurring at response time
      tier,
      badgeType,
      badgeLevel,
      socialLink: isAnon ? null : social?.url ?? null,
      socialPlatform: isAnon ? null : social?.platform ?? null,
      districtId: districtData ? `mock_d_${districtData.slug}` : null,
      stateId: stateData ? `mock_s_${stateData.slug}` : null,
      districtName: districtData?.name ?? null,
      stateName: stateData?.name ?? null,
      districtSlug: districtData?.slug ?? null,
      stateSlug: stateData?.slug ?? null,
      activatedAt: activatedAt?.toISOString() ?? null,
      expiresAt: expiresAt?.toISOString() ?? null,
      isRecurring,
      monthsActive,
      message: isAnon ? null : message,
      createdAt: createdAt.toISOString(),
    });
  }

  return out;
}

const POOL_SIZE = Number(process.env.FTP_MOCK_POOL_SIZE) || 10000;

let cachedPool: MockContributor[] | null = null;
function getPool(): MockContributor[] {
  if (!cachedPool) cachedPool = generate(POOL_SIZE);
  return cachedPool;
}

const TIER_PRIORITY: Record<string, number> = {
  founder: 6, patron: 5, state: 4, district: 3, chai: 1, custom: 0,
};

function sortByPriorityThenTenure(a: MockContributor, b: MockContributor): number {
  const pa = TIER_PRIORITY[a.tier] ?? 0;
  const pb = TIER_PRIORITY[b.tier] ?? 0;
  if (pa !== pb) return pb - pa;
  // Highest amount first within same tier, tenure as tiebreaker.
  // Mock generator keeps raw amount on the record (not nulled like public API).
  const aAmt = a.amount ?? 0;
  const bAmt = b.amount ?? 0;
  if (aAmt !== bAmt) return bAmt - aAmt;
  return b.monthsActive - a.monthsActive;
}

// Projection that mirrors the public API — nulls recurring amounts.
type PublicMock = Omit<MockContributor, "amount"> & { amount: number | null };
function publicView(c: MockContributor): PublicMock {
  return { ...c, amount: c.isRecurring ? null : c.amount };
}

export function mockTopTier(): PublicMock[] {
  return getPool()
    .filter((c) => c.tier === "founder" || c.tier === "patron")
    .sort(sortByPriorityThenTenure)
    .map(publicView);
}

export function mockDistrict(districtSlug: string | null, stateSlug: string | null): PublicMock[] {
  const pool = getPool();
  return pool
    .filter((c) => {
      if (c.tier === "founder" || c.tier === "patron") return true;
      if (c.tier === "state" && stateSlug && c.stateSlug === stateSlug) return true;
      if (c.tier === "district" && districtSlug && c.districtSlug === districtSlug) return true;
      if (!c.isRecurring) {
        if (districtSlug && c.districtSlug === districtSlug) return true;
        if (stateSlug && c.stateSlug === stateSlug && !c.districtSlug) return true;
      }
      return false;
    })
    .sort(sortByPriorityThenTenure)
    .map(publicView);
}

export function mockStatePage(stateSlug: string): PublicMock[] {
  return getPool()
    .filter((c) => {
      if (c.tier === "founder" || c.tier === "patron") return true;
      if (c.tier === "state" && c.stateSlug === stateSlug) return true;
      return false;
    })
    .sort(sortByPriorityThenTenure)
    .map(publicView);
}

export function mockLeaderboard(): PublicMock[] {
  return getPool()
    .filter((c) => c.isRecurring)
    .sort(sortByPriorityThenTenure)
    .slice(0, 50)
    .map(publicView);
}

export function mockGrowthTrend(): Array<{ month: string; newCount: number; cumulative: number }> {
  const LAUNCH = new Date("2026-04-01T00:00:00Z");
  const months: Record<string, number> = {};
  for (const c of getPool()) {
    const d = new Date(c.createdAt);
    if (d < LAUNCH) continue;
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months[m] = (months[m] ?? 0) + 1;
  }
  const sorted = Object.keys(months).sort();
  let cum = 0;
  return sorted.map((month) => {
    cum += months[month];
    return { month, newCount: months[month], cumulative: cum };
  });
}

export function mockDistrictRankings() {
  const pool = getPool().filter((c) => c.isRecurring && c.tier === "district" && c.districtSlug);
  const byDistrict: Record<string, { districtName: string; districtSlug: string; stateName: string; stateSlug: string; active: boolean; count: number; monthlyTotal: number }> = {};
  for (const c of pool) {
    const key = c.districtSlug!;
    if (!byDistrict[key]) {
      byDistrict[key] = {
        districtName: c.districtName ?? "",
        districtSlug: c.districtSlug ?? "",
        stateName: c.stateName ?? "",
        stateSlug: c.stateSlug ?? "",
        active: true,
        count: 0,
        monthlyTotal: 0,
      };
    }
    byDistrict[key].count += 1;
    byDistrict[key].monthlyTotal += c.amount ?? 0;
  }
  const rankings = Object.values(byDistrict).sort((a, b) => b.monthlyTotal - a.monthlyTotal);
  return { rankings, awaitingLaunch: [] };
}

export function mockAll() {
  const pool = getPool();
  return {
    subscribers: pool.filter((c) => c.isRecurring).sort(sortByPriorityThenTenure).map(publicView),
    oneTime: pool.filter((c) => !c.isRecurring).sort((a, b) => b.amount - a.amount).map(publicView),
  };
}
