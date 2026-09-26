/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Scraping cadence tiers for the India National Dashboard.
 *
 * Each scraper picks a tier — never a raw cron string. When a tier
 * needs adjustment, change one constant and every scraper using that
 * tier picks up the new schedule on next deploy.
 *
 * Source: docs/india/32 §1.
 */

export const INDIA_SCRAPING_TIERS = {
  // For things that genuinely change daily on govt portals.
  // Currently UNUSED in §2 — kept as an option for future high-cadence scrapers.
  DAILY_EARLY: {
    label: "Daily, early morning IST",
    cron: "0 1 * * *", // 06:30 IST (01:00 UTC)
    description: "Runs once a day at 06:30 IST.",
    minIntervalHours: 23,
  },

  // For weekly govt releases (RBI WSS, NJDG snapshot, CWC reservoir bulletin).
  WEEKLY_MONDAY: {
    label: "Weekly, Monday",
    cron: "0 4 * * 1", // 09:30 IST Mon
    description: "Runs Mondays at 09:30 IST.",
    minIntervalHours: 167,
  },
  WEEKLY_FRIDAY: {
    label: "Weekly, Friday",
    cron: "0 13 * * 5", // 18:30 IST Fri (after RBI WSS)
    description: "Runs Fridays at 18:30 IST (after RBI WSS).",
    minIntervalHours: 167,
  },

  // Monthly releases — split by where in the month they typically land.
  MONTHLY_EARLY: {
    label: "Monthly, 5th of the month",
    cron: "0 4 5 * *", // 09:30 IST on 5th
    description: "Runs on the 5th of each month at 09:30 IST.",
    minIntervalHours: 27 * 24,
  },
  MONTHLY_MID: {
    label: "Monthly, 15th of the month",
    cron: "0 4 15 * *", // 09:30 IST on 15th (after CPI on 12th, WPI on 14th)
    description: "Runs on the 15th of each month at 09:30 IST.",
    minIntervalHours: 27 * 24,
  },
  MONTHLY_LATE: {
    label: "Monthly, 28th of the month",
    cron: "0 4 28 * *", // 09:30 IST on 28th (PLFS, TRAI, CEA, MoRTH)
    description: "Runs on the 28th of each month at 09:30 IST.",
    minIntervalHours: 27 * 24,
  },

  // Quarterly — GDP releases end-Feb / end-May / end-Aug / end-Nov.
  QUARTERLY: {
    label: "Quarterly, last week",
    cron: "0 4 28 2,5,8,11 *", // 28th of Feb/May/Aug/Nov, 09:30 IST
    description: "Runs on 28th of Feb, May, Aug, Nov at 09:30 IST.",
    minIntervalHours: 80 * 24,
  },

  // Annual — most census-style data, ISFR, NCRB, UDISE+, NFHS.
  ANNUAL_APRIL: {
    label: "Annual, April",
    cron: "0 4 1 4 *", // 1 April 09:30 IST
    description: "Runs once a year on 1 April at 09:30 IST.",
    minIntervalHours: 360 * 24,
  },
  ANNUAL_BUDGET_DAY: {
    label: "Annual, Budget Day evening",
    cron: "30 12 1 2 *", // 1 Feb 18:00 IST after Budget speech
    description: "Runs annually on 1 Feb at 18:00 IST after Budget speech.",
    minIntervalHours: 360 * 24,
  },

  // Event-driven — only triggered manually from admin or by polling
  // a "watch list" weekly to detect new releases.
  EVENT_DRIVEN_WEEKLY_POLL: {
    label: "Event-driven (weekly poll)",
    cron: "0 5 * * 1", // Mon 10:30 IST
    description: "Polls the source weekly; only writes if new event detected.",
    minIntervalHours: 167,
  },

  // Manual only — never runs on cron, only when admin clicks "Run now".
  MANUAL_ONLY: {
    label: "Manual / on-demand",
    cron: null,
    description: "Runs only when triggered from admin.",
    minIntervalHours: 0,
  },
} as const;

export type IndiaScrapingTierKey = keyof typeof INDIA_SCRAPING_TIERS;

export type IndiaScrapingTier = (typeof INDIA_SCRAPING_TIERS)[IndiaScrapingTierKey];
