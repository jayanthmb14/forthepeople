# Contributing to ForThePeople.in

Thank you for your interest in contributing to ForThePeople.in! This project aims to bring transparent, district-level government data to every citizen in India, and we welcome contributions from developers of all skill levels.

## Table of Contents

- [Where to start](#where-to-start)
- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Code Style](#code-style)
- [Adding a New District](#adding-a-new-district)
- [Need Help?](#need-help)

## Where to start

- [`good-first-issue`](https://github.com/jayanthmb14/forthepeople/labels/good-first-issue) — small, well-scoped tasks with pointers to the exact files. Great for a first PR.
- [`help-wanted`](https://github.com/jayanthmb14/forthepeople/labels/help-wanted) — bigger items (new districts, new data modules, translations) where the maintainer needs extra hands.
- The pinned **STATUS** issue lists what is being worked on right now and which PRs are queued for review.
- Not sure? Open an issue describing what you would like to do before writing code — it avoids duplicate work.

This is a solo-maintained project. Reviews happen in batches; small PRs get merged fastest.

## Getting Started

1. **Fork** this repository on GitHub
2. **Clone** your fork locally
3. **Create a branch** for your changes
4. **Make your changes** and test them
5. **Submit a Pull Request** back to this repo (the PR template will guide you)

## Prerequisites

- **Node.js 24** — the version is pinned in `.nvmrc` (`nvm use`) and enforced by `package.json` `engines`. Vercel builds on 24 too.
- **npm** (comes with Node.js)
- **PostgreSQL** — We recommend [Neon](https://neon.tech/) (free tier available) for a cloud-hosted database
- **Git** — [Download here](https://git-scm.com/)

Optional (for full functionality):
- [Upstash](https://upstash.com/) account (Redis, free tier available)
- API keys for data providers (see `.env.example`)

## Local Setup

```bash
# 1. Clone your fork
git clone https://github.com/YOUR_USERNAME/forthepeople.git
cd forthepeople

# 2. Use the right Node version and install dependencies
nvm use
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Open .env.local and fill in your values (see below)

# 4. Set up the database (YOUR dev database, never production)
npx prisma generate
npx prisma db push

# 5. (Optional) Load districts, states and taluks (upsert only, no deletes)
npx tsx prisma/seed-hierarchy.ts
#    There is no demo-data seed: the old one invented figures and wiped
#    tables, so it lives in prisma/archive/ (never run; see its README).

# 6. Start the dev server
npm run dev
```

The app will be running at `http://localhost:3000` (it redirects to `/en`).

### Environment Variables

`.env.local` is the local env file (git-ignored). **`.env.example` is the only list of variables the app reads** — every name, what it is for, and which are required are documented there. Do not look for env lists in other docs; if you add a `process.env.X` read in code, add `X` to `.env.example` in the same PR.

At minimum you need:
- `DATABASE_URL` — Your PostgreSQL connection string (get one free from [Neon](https://neon.tech/))
- `ADMIN_SESSION_SECRET` — any random hex string (`openssl rand -hex 32`); the admin auth module refuses to load without it

For full functionality, you'll also want:
- `REDIS_URL` and `REDIS_TOKEN` — From [Upstash](https://upstash.com/) (free tier)
- `OPENROUTER_API_KEY` (or `ANTHROPIC_API_KEY`) — For AI-powered news classification and insights
- `DATA_GOV_API_KEY` — From [data.gov.in](https://data.gov.in/) (free)
- `OPENWEATHER_API_KEY` — From [OpenWeatherMap](https://openweathermap.org/api) (free tier)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── api/
│   │   ├── data/[module]/  # Unified per-module data API
│   │   ├── cron/           # Scheduled jobs
│   │   └── admin/          # Admin endpoints
│   └── [locale]/[state]/[district]/  # District dashboard pages
├── components/             # Reusable React components
├── lib/                    # Core utilities (DB, Redis, AI, scoring, tenders)
├── scraper/                # Background data collection jobs
├── dictionaries/           # i18n translation files (en, kn)
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript type definitions
prisma/
├── schema.prisma           # Database schema
└── seed-*.ts               # District seed data
tests/                      # Vitest unit tests (pure helpers only)
docs/ARCHITECTURE.md        # How the pieces fit together — read this first
```

## How to Contribute

### Types of Contributions We Welcome

- **New districts** — Expand coverage to more of India's 780+ districts
- **Translations** — Help make the platform accessible in more Indian languages
- **Bug fixes** — Found something broken? Fix it!
- **UI/UX improvements** — Better design, accessibility, mobile experience
- **Data modules** — New types of government data dashboards
- **Documentation** — Improve guides, add code comments, fix typos
- **Tests** — Add Vitest coverage for pure helpers in `src/lib/`

### Two rules that are not negotiable

1. **Never invent data.** If a source is down, write nothing and show the empty state. No estimates, no placeholders that look like real numbers.
2. **Never use the words "scraper", "scraping" or "scraped" in citizen-facing text.** Say "data collection" / "updated from official sources". (Internal code and comments are fine.)

## Pull Request Guidelines

1. **One PR per feature/fix** — Keep changes focused and reviewable
2. **Write clear PR descriptions** — Explain what you changed and why (the PR template asks the right questions)
3. **Test your changes** — Make sure the dev server runs without errors
4. **Follow existing patterns** — Look at how similar code is structured in the project
5. **Keep it small** — Smaller PRs are reviewed faster
6. **Schema changes need a heads-up** — the build never runs `prisma db push`; the maintainer applies schema changes to production by hand BEFORE merging. Say clearly in the PR if `prisma/schema.prisma` changed.

### PR Checklist

- [ ] I've tested my changes locally with `npm run dev`
- [ ] My code passes linting (`npm run lint` — 0 errors)
- [ ] My code passes the type check (`npx tsc --noEmit`)
- [ ] Unit tests pass (`npm test`)
- [ ] I've updated documentation if needed
- [ ] My PR targets the `main` branch

CI runs the same three checks (lint, type-check + build, unit tests) on every PR.

## Code Style

- **TypeScript** — All code should be written in TypeScript (strict mode)
- **Tailwind CSS** — Use Tailwind utility classes for styling
- **React Server Components** — Prefer server components where possible (Next.js App Router)
- **Prisma** — All database access goes through Prisma ORM (`src/lib/db.ts`)
- **Rupees, not crores** — Budget values are stored in whole rupees
- **No hard-coded district counts** — use `getTotalActiveDistrictCount()` from `src/lib/constants/districts.ts`
- Run `npm run lint` before submitting to catch style issues

## Adding a New District

Adding a new district is one of the most impactful contributions. Here's the high-level process:

1. Register the district in `src/lib/constants/districts.ts` (state, slug, coordinates, `isActive`)
2. Create a seed file at `prisma/seed-{districtname}.ts` with district-specific data, citing the official source for every value
3. Add GeoJSON boundary data under `public/geo/` (see the existing files for the naming pattern and keep the source attribution)
4. Verify every module renders for the new district (empty states are fine where no data exists yet — invented data is not)

Look at an existing sourced seed (e.g., `prisma/seed-pune-offices.ts`) as a reference — never the demo seeds in `prisma/archive/`, which contain invented figures — and read `docs/DISTRICT-EXPANSION-SKILL.md` for the detailed guide. Named officials and projects must be sourced before a district goes live; the maintainer runs seeds against production by hand.

## Need Help?

- **Open an issue** — Ask questions, report bugs, or suggest features
- **Check existing issues** — Your question may already be answered
- **Read the README** and `docs/ARCHITECTURE.md` — For project overview and how things fit together

---

Thank you for helping make government data accessible to every Indian citizen!
