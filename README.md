<div align="center">

# 🇮🇳 ForThePeople.in

### Your District. Your Data. Your Right.

**India's free, open-source, district-level civic transparency platform.**

[Live Site](https://forthepeople.in) · [Watch the Platform Walkthrough](https://www.instagram.com/reel/DW0UIkWvmxq/) · [Vote for Features](https://forthepeople.in/en/features) · [Support the Project](https://forthepeople.in/en/support)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Districts](https://img.shields.io/badge/districts_live-10-green.svg)
![Modules](https://img.shields.io/badge/dashboards-30%2B_per_district-orange.svg)
![CI](https://github.com/jayanthmb14/forthepeople/actions/workflows/ci.yml/badge.svg)

</div>

---

## What is ForThePeople.in?

ForThePeople.in aggregates publicly available Indian government data into clean, citizen-friendly dashboards — one for every district. Instead of navigating 50+ government portals, citizens get a single platform for crop prices, dam levels, budget spending, school performance, infrastructure projects, government schemes, tenders and more.

Data is **updated daily or when sources publish** — every module shows when its data was last refreshed, and nothing is invented when a source is down.

**Currently live: 10 districts across 7 states** (see the [live site](https://forthepeople.in) for the current number — it changes as districts go live):
- **Karnataka:** Mandya, Mysuru, Bengaluru Urban
- **Tamil Nadu:** Chennai
- **Maharashtra:** Mumbai, Pune
- **Delhi:** New Delhi
- **West Bengal:** Kolkata
- **Telangana:** Hyderabad
- **Uttar Pradesh:** Lucknow

There is also an [India-wide dashboard](https://forthepeople.in/en/india) that rolls the same modules up to the national level.

**Goal:** All 780+ districts across 28 states and 8 UTs.

## Dashboard Modules

Each district has 30+ modules (the sidebar on any district page is the authoritative list). Grouped roughly:

| Category | Modules |
|----------|---------|
| **Data** | Overview, Interactive Map, Water & Dams, Crop Prices, Weather & Rainfall, Finance & Budget, Population, Power |
| **Governance** | Leadership, Police & Traffic, Schools, Courts, RTI Tracker, Gram Panchayat, Health, Responsibility, Tenders |
| **Services** | Gov. Schemes, Services Guide, Elections, Exams, Transport, JJM Water Supply, Housing, Industries, Farm |
| **Community** | Local Alerts, Offices, Citizen Corner, Famous Personalities, News, Contributors, Data Sources, Update Log |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS v4, react-simple-maps, Recharts |
| Database | PostgreSQL (Neon), Prisma ORM (108 models) |
| Cache | Upstash Redis (REST) |
| AI | OpenRouter (free-tier models for news classification, low-cost models for insights) with Anthropic fallback — see `src/lib/ai-provider.ts` |
| Data collection | Vercel Cron jobs, Google News RSS, Cheerio |
| Hosting | Vercel (Mumbai region) |
| Payments | Razorpay (supporter contributions, India only) |
| Monitoring | Sentry (errors), Plausible (analytics, cookieless) |
| Email | Resend (admin alerts) |
| Tests | Vitest (pure helpers), ESLint, TypeScript strict |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the pieces fit together.

## Getting Started

Requires **Node.js 24** (see `.nvmrc`; run `nvm use`).

```bash
# Clone
git clone https://github.com/jayanthmb14/forthepeople.git
cd forthepeople

# Install
npm install

# Set up environment (see .env.example — it is the only list of variables)
cp .env.example .env.local
# Fill in DATABASE_URL at minimum

# Database
npx prisma generate
npx prisma db push          # your OWN dev database only

# Run
npm run dev

# Checks
npm run lint && npx tsc --noEmit && npm test
```

## Project Structure

```
docs/                       # Architecture, runbooks, trackers (docs/ARCHITECTURE.md first)
prompts/                    # Claude Code prompts archive (completed + pending)
tests/                      # Vitest unit tests for pure helpers
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── api/
│   │   ├── data/[module]/  # Unified per-module data API
│   │   ├── cron/           # Scheduled jobs (news, crops, insights, exams, budget)
│   │   └── admin/          # Admin endpoints (health, alerts, analytics, vault)
│   └── [locale]/[state]/[district]/  # District dashboard pages
├── components/             # Reusable React components
├── lib/                    # Core utilities (DB, Redis, AI, alerts, health score, tenders)
└── scraper/                # Background data collection jobs
prisma/
├── schema.prisma           # Database schema (108 models)
└── seed*.ts                # Seed data per district / module
```

## Legal

ForThePeople.in is an **independent citizen transparency initiative**. It is NOT an official government website. All data is sourced from publicly available government portals under India's Open Data Policy (NDSAP) and the Right to Information (Article 19(1)(a) of the Indian Constitution).

## Support

Running this platform for all 780+ districts costs approximately ₹12 lakh/year. You can help:

- **One-Time Contribution** — any amount from ₹10
- **District Champion** — ₹99/mo, name on your chosen district page
- **State Champion** — ₹999/mo, name on every district in that state
- **All-India Patron** — ₹9,999/mo, featured on every district page
- **Founding Builder** — ₹50,000/mo, permanent homepage spotlight

[Support page →](https://forthepeople.in/en/support) · [Contributor leaderboard →](https://forthepeople.in/en/contributors) · [funding.json →](https://forthepeople.in/funding.json)

## Contributing

We welcome contributions from developers of all skill levels! Whether you want to add a new district, fix a bug, improve the UI, or add translations — every contribution helps.

- Read the [Contributing Guide](CONTRIBUTING.md) to get started
- Check out [`good-first-issue`](https://github.com/jayanthmb14/forthepeople/labels/good-first-issue) and [`help-wanted`](https://github.com/jayanthmb14/forthepeople/labels/help-wanted) issues
- Review our [Code of Conduct](CODE_OF_CONDUCT.md)
- Report security issues privately via [SECURITY.md](SECURITY.md)

Thank you to everyone who has opened a pull request or issue so far — including @AmanSurushe, @threatner, @joellui, @Ronithkumar, @tiwarikaran, @abhiprd2000 and @rigsutra. Open PRs are being reviewed in order; see the pinned STATUS issue for where things stand.

**Goal:** Cover all 780+ districts across India. Currently at 10 — help us get there!

## Creator

**Jayanth M B** — Entrepreneur from Karnataka, India.

Built with the belief that every Indian citizen deserves free, transparent access to their district's government data.

- Instagram: [@jayanth_m_b](https://www.instagram.com/jayanth_m_b/)
- Project: [forthepeople.in](https://forthepeople.in)
- Contact: support@forthepeople.in

## License

[MIT](LICENSE) — Copyright (c) 2026 Jayanth M B. Use it, fork it, build on it.

### Attribution (a request, not a licence condition)

The MIT licence only requires you to keep the copyright notice. Beyond that, if you fork or deploy this project, the creator would appreciate — but does not legally require — that you:

1. Keep the "Originally created by Jayanth M B" line in your README or About page.
2. Link back to [github.com/jayanthmb14/forthepeople](https://github.com/jayanthmb14/forthepeople) so improvements can flow back upstream.
3. Keep the platform free for citizens and never present it as an official government service.
