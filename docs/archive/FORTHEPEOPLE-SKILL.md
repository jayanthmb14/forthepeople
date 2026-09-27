---
name: forthepeople-blueprint
description: "Complete blueprint for building ForThePeople.in — India's citizen transparency platform. Use this skill whenever building ANY component, page, dashboard, scraper, API, database model, or UI element for ForThePeople.in. This includes: district dashboards, budget trackers, crop price modules, interactive maps, government office directories, citizen responsibility sections, real-time alerts, RTI filing assistants, school performance trackers, dam/water level dashboards, sugar factory trackers, election dashboards, transport modules, housing scheme trackers, power outage trackers, soil health advisories, or any data visualization for Indian government data. Also trigger when the user mentions 'ForThePeople', 'district dashboard', 'citizen transparency', 'government data India', 'scrape Indian government portal', or references any Indian district/state data platform. Even if the user just says 'build the next section' or 'continue from where we left off', use this skill."
---

# ForThePeople.in — Unified Blueprint & Skill

This skill contains the COMPLETE blueprint for ForThePeople.in.
Read `references/BLUEPRINT-UNIFIED.md` for the full project specification.

## Quick Start

When starting a new session, always:
1. Read `references/BLUEPRINT-UNIFIED.md`
2. Check the PROGRESS TRACKER at the bottom
3. Continue from the next incomplete section

## Architecture Summary

- **Stack**: Next.js 16 + TypeScript + Tailwind v4 + Prisma + PostgreSQL + Redis
- **28 dashboard modules** per district (Overview, Budget, Water/Dams, Sugar Factories, Crop Prices, Weather, Population, Leadership, Infrastructure, Police, Schemes, Services Guide, Elections, Transport, JJM Water Supply, Housing, Power Outages, Schools, Farm Advisory, RTI Tracker, RTI Filing, Gram Panchayat, Courts, Health, Alerts, Offices, Citizen Corner, News)
- **Interactive D3.js map**: India → State → District → Taluk drill-down
- **40+ Prisma models** covering all government data categories
- **15+ scrapers** pulling from data.gov.in, state portals, NREGA, eJalShakti, BESCOM, etc.
- **Pilot district**: Mandya, Karnataka (expandable to all 780+ districts)

## Key References

- `references/BLUEPRINT-UNIFIED.md` — Full project spec, all sections, all models, all scrapers
- Design system: Light theme, Plus Jakarta Sans, #FAFAF8 background, Linear.app aesthetic
- Legal: Article 19(1)(a), NDSAP open data policy, NOT a government website
