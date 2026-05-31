# FORTHEPEOPLE.IN — UNIFIED MASTER BLUEPRINT
# ═══════════════════════════════════════════════════════════
# SINGLE SOURCE OF TRUTH — Combines original + all addendums
# Claude Code: Read this file at the start of EVERY session.
# Generic for ANY Indian district. Pilots: Mandya, Mysuru, Bengaluru Urban (Karnataka).
# Last updated: May 31, 2026
# ═══════════════════════════════════════════════════════════
#
# 2026-05-31 — ASSAM, DIMA HASAO DISTRICT #11 LAUNCH:             COMPLETE (local, pre-push)
#   Active district count: 10 → 11. Assam now has 1 active (Dima Hasao).
#
#   RECORDS SEEDED (idempotent findFirst-then-create):
#   • Taluks: Haflong, Mahur, Maibong, Umrangso (with regional names)
#   • Curated Leaders: Debolal Gorlosa (CEM, NCHAC), Rupali Langthasa (MLA), Amarsing Tisso (MP), Gayatri Devidas Hyalinge (DC), Ripunjoy Kakati (SP)
#   • Infrastructure Projects: Haflong Urban Water Supply (AMRUT 2.0), Disaster Resilient Hill Roads (ADRHRDP), Lanka-Umrangso BG Railway, Jatinga-Harangajao 4-Laning Stretch
#   • Industries: Umrangso Cement Hub, Organic Horticulture & Agriculture, Eco & Heritage Tourism
#   • Schemes: Orunodoi 3.0 (Assam regional scheme), JJM, PMAY, MGNREGA
#   • Schools: Haflong Government College, Maibang Higher Secondary School
#
#   UI & SCRAPER WIRING:
#   • /en/assam/dima-hasao routes route 200 OK.
#   • Dima Hasao registered in districts.ts, DistrictExplorer.tsx, LiveDistrictsList.tsx, DistrictBadges.tsx, and DistrictHeroIllustration.tsx.
#   • Added custom mountain landscape visual styling/SVG for Dima Hasao hero illustration.
#   • Fixed a major news scraper bug in news.ts where the state "Karnataka" was hardcoded into query builder. It now uses ctx.stateName dynamically to query news (e.g. "Dima Hasao Assam").
#
# 2026-04-23 — PUNE DISTRICT #10 LAUNCH (Maharashtra):              COMPLETE (local, pre-push)
#   Active district count: 9 → 10. Maharashtra now has 2 active (Mumbai + Pune).
#   Launched via 6-prompt sequential write-not-run pattern — new gold-standard
#   expansion workflow (supersedes single-prompt expansion for quality + audit).
#
#   RECORDS SEEDED (idempotent findFirst-then-create, confirmed in Neon prod):
#   • 41 Leaders = 17 governance (tier 1/3/4/5/6) + 24 elected reps (tier 1/2)
#       Landge (PCMC Mayor) cross-file deduped correctly between Prompts 2 & 4
#       Baramati MLA seeded as VACANT (active=false, by-election April 23 pending ECI)
#   • 5 BudgetAllocation rich records — PMC 25-26, PMC 26-27, PCMC 25-26,
#       PCMC 26-27 core, ZP 25-26 = ₹42,236 cr across all years, ₹19,942.73 cr FY 26-27
#   • 5 BudgetEntry sector aggregates (parallel model for /finance UI compat,
#       derived from BudgetAllocation, sums match to the rupee)
#   • 13 InfraProject — Metro Purple/Aqua/Pink, Phase 2, Outer+Inner Ring Roads,
#       Mula-Mutha rejuvenation, Purandar airport, Lohegaon T2, 33 Missing Link
#       Roads, Pavana-Indrayani, PCMC TTPs, Pavana pipeline. hasPublicOpposition=4.
#   • 8 School = 3 ZP/PMC aggregates + 5 notables (SPPU, Fergusson, COEP, FTII, NDA)
#   • 6 Scheme — PMAY-U, PMAY-G, JJM, MGNREGA, PM-JAY, PM POSHAN
#   • 14 Taluk (Prompt 1) — Pune City, Haveli, Khed, Junnar, Ambegaon, Maval, Mulshi,
#       Shirur, Purandar, Velhe, Bhor, Baramati, Indapur, Daund (with Marathi names)
#   • 0 Hospital — schema model missing across the fleet; blocked, parked for schema expansion
#   • Maharashtra hierarchy expanded 5 → 35 districts (30 new inactive + aurangabad
#       slug renamed to chhatrapati-sambhajinagar via one-off migration script)
#
#   UI + SCRAPER WIRING:
#   • /en/maharashtra/pune routes 34/34 HTTP 200; DataSourceBanner + ModuleDisclaimer
#       on all 12 core module routes.
#   • Pune added to OWM_CITY_OVERRIDE (weather.ts) and AGMARKNET_DISTRICT_OVERRIDE
#       (crops.ts). Scrapers fetch live data.
#   • Noto_Sans_Devanagari added via next/font in src/app/layout.tsx to cover
#       Marathi + Hindi regional text. `--font-devanagari` CSS var exposed.
#   • districts.ts has Pune minimal active stub (no fabricated leaders/modules —
#       all content DB-sourced).
#   • public/geo/pune-taluks.json shipped as stub FeatureCollection; 14 polygons
#       pending authoritative fetch from datameet/geohacker/OSM. TalukMap
#       DISTRICT_PROJECTION now includes Pune {center [73.86, 18.52], scale 6000}.
#
#   ARCHITECTURE PATTERNS ESTABLISHED:
#   • Write-not-run 6-prompt sequential pattern (Prompts 1-5 write files only,
#       Prompt 6 executes seeds + commits + pushes). Each prompt reports back
#       before next. Supersedes older single-prompt district expansion.
#   • Aggregate-first for high-N entities (3 school aggregates + 5 notables
#       instead of 3,546 individual ZP schools). Scales to 780 districts.
#   • Source-with-pipe-delimiter "Publication | URL" format for Leader model
#       (lacks sourceUrl column).
#   • JSON-packed legal flags on InfraProject — sourceUrls field carries
#       {primary, secondary, disclaimer, subJudice, hasPublicOpposition,
#       environmentalClearance} structured.
#   • Live-event seat handling — VACANT placeholder with active=false when
#       constituency is in transition (Ajit Pawar died Jan 28, 2026; Baramati
#       by-election April 23, 2026; row will be updated to certified winner
#       post-ECI declaration).
#   • Parallel dual-model seeding — BudgetAllocation (rich) + BudgetEntry
#       (UI-compat sector aggregates) both seeded; reconciliation deferred.
#   • Landge cross-file dedup — same record in Prompts 2 and 4 seed files,
#       findFirst({districtId, name, role}) idempotency guard handles cleanly.
#
#   KNOWN BUGS / DEFERRALS:
#   • [HIGH] Hospital model missing — affects all 10 districts
#   • [HIGH] Pre-existing fleet-wide GeoJSON attribution debt (~40 public/geo files)
#   • [MED] BudgetAllocation vs BudgetEntry parallel models — reconciliation deferred
#   • [MED] Mumbai DB tier 1/2 diverges from its own seed file
#   • [MED] Baramati VACANT row exists but API's active=true filter hides from UI
#   • [LOW] 14 Pune taluk polygons pending authoritative fetch
#   • [LOW] Hyderabad still missing from TalukMap DISTRICT_PROJECTION
#   • [LOW] Party-name convention 3-way split (SHS-UBT vs Shiv Sena (UBT) vs RPI (A))
#   • [LOW] Role-string full-form vs Mumbai's short-form divergence
#   • [LOW] Ravi Landge party (BJP) needs primary-source re-verification
#   • [LOW] Cross-file Landge record duplication (Prompts 2 & 4) — idempotent
#   • [LOW] Scheme level enum mixed-case in DB
#   • [LIVE-EVENT] Baramati by-election ECI certification pending (post-launch patch)
#
#   FILES CREATED / MODIFIED: see Phase-G commit plan in SESSION-LOG.md.
#
# 2026-04-19 — Module 30: GOVERNMENT TENDERS (Karnataka pilot):    COMPLETE (local, not pushed)
#   • First transparency-first module with legal-grade factual copy: tenders
#     from 6 Karnataka portals (KPPP, CPPP, IREPS, defproc, BEL_NIC, HAL_TW)
#     ingested via 4 reusable scraper engines — kppp-seam, nicgep (shared by
#     CPPP + defproc + BEL), ireps, tenderwizard. All rate-limited 1 req/3s,
#     honest UA, robots.txt-obeying, 3-retry exponential backoff on 403/429/503.
#   • 14 new Prisma models. Synced via `prisma db push` (project convention).
#   • Seed: 6 scraper configs, 31 authorities (BBMP/BDA/BESCOM/BWSSB/BMRCL/
#     BMTC/MCC/MUDA/CNNL/MYSUGAR/HAL/BEL/BEML/ITI/DRDO/SWR etc.), 20 NIC
#     categories, 10 education sections (EN; KN deferred), 12 stub tenders
#     across Bengaluru/Mysuru/Mandya flagged pending-scraper-verification.
#   • 6 API routes + 5 pages + 8 components. Every tender page renders
#     TenderDisclaimer compact+full.
#   • Red-flag taxonomy (src/lib/tenders/tender-redflags.ts): 7 flags — all
#     SQL-based, never LLM. Every flag cites factual statement + rule
#     reference (GFR 173 / KTPPA / CVC) + computed-value JSON.
#   • AI enrichment (summary + eligibility + doc-checklist) via callAI()
#     purpose='news-analysis' → free Tier 1. Daily $0.50 budget guard.
#   • PII redactor runs on every extracted doc text (DPDP readiness).
#   • Lint: scripts/lint-tender-copy.sh blocks suspicious/corrupt/dubious/
#     cartel/irregular/fraudulent in rendered strings. Passing.
#   • Docs: 29-Tenders-Module-Architecture / 30-Data-Sources-KA / 31-Legal-
#     Framework / 32-API-Integrations. TENDERS_MODULE_REPORT.md at repo
#     root captures phase-by-phase test pass + Neon quota caveat.
#   • NOT deployed. Local-only. Railway scraper + Vercel cron wire-up is
#     follow-up work.
#
# 2026-04-17 — Support Layout + Mobile Nav + Razorpay Prefill + UPI Cap:    COMPLETE (local, not pushed)
#   • /en/support container: maxWidth 860 → 1100 (matches admin pages).
#     Tier cards + stats grids now show more columns on desktop; mobile
#     stack unchanged.
#   • Header GitHub icon: removed `hidden sm:flex` — icon now visible at
#     all viewports including iPhone sizes. `flexShrink: 0` preserved.
#   • Phone field added to SupportCheckout form:
#       - Required for subscription tiers (UPI AutoPay / bank e-mandate)
#       - Optional for one-time contributions
#       - Validates 10-digit Indian number, strips +91 prefix
#       - Auto-fills Razorpay checkout via `prefill.contact`
#   • Razorpay subscription API (`/api/payment/create-subscription`):
#       - Accepts + validates phone
#       - Sends `customer_notify: 1` → Razorpay sends payment SMS + email
#       - Sends `notify_info: { notify_email, notify_phone }`
#       - Stores phone in `notes` for admin auditing
#   • Razorpay one-time API (`/api/payment/create-order`): accepts optional phone,
#     stores in order notes.
#   • Verify-subscription writes `phone` to Supporter.phone column.
#   • NPCI UPI AutoPay cap warning:
#       - Inline banner shown when `tier.isMonthly && amount > 15000`
#       - Affects Founder tier (₹50k/mo) — users told to use Card/Netbanking
#       - No product-side restructure; warning-only for now
#   • New doc: PAYMENT-DEBUG-REPORT.md (repo root) — full audit + manual
#     Razorpay Dashboard checklist + post-deploy verification URLs.
#
# 2026-04-17 — Payment UX + Duplicate Cleanup + Score Disclaimer:    COMPLETE
#   • District tier subscription fix: added requiresState: true to prevent
#     broken submit flow. District selector now always visible with disabled
#     state + helpful "Select a state first" hint before state is chosen.
#   • Added informative banner for district tier explaining state+district
#     selection is needed for sponsorship.
#   • LocalAlert dedup: added case-insensitive title check in news-action-engine
#     to prevent duplicates from multi-source news coverage.
#   • Cleanup script: scripts/cleanup-alert-news-dupes.ts
#     - Deactivated 42 duplicate LocalAlerts (kolkata:39, new-delhi:1, mumbai:1, hyderabad:1)
#     - Deleted 23 duplicate NewsItems across 7 districts
#   • Contribute page overhaul: all broken GitHub/fake-email links replaced
#     with feedback modal → admin panel routing. Supports report issue,
#     district request, translation, data source types.
#   • District Health Score: 3-layer disclaimers added (always-visible note,
#     warning box in breakdown, footer note) stating the score is indicative
#     and will evolve as more module data is populated.
#   • Leader dedup (smart): 81 entries marked inactive across all 9 districts
#     (79 duplicates + 2 junk entries like "Prime Minister" as name).
#   • Cross-district infra contamination fix: findTargetDistricts() now
#     validates extracted districts are in same state as source district.
#   • Update Log: "Scraper" → "Auto-Update" in public-facing labels.
#
# 2026-04-16 — Legal Pages Overhaul (Disclaimer + Privacy Policy):    COMPLETE
#   • Disclaimer rewritten: 14 sections (Political Neutrality, Government
#     Emblems, References to Public Officials, News Aggregation, etc.)
#   • Privacy Policy rewritten: DPDP Act 2023 fully compliant
#   • "Jayanth Malathi Basavaraju" → "Jayanth M B" everywhere
#   • PKJMB Media Private Limited + CIN removed from all pages
#   • Disclaimer Section 14 renamed "Contact" (was "Contact for Legal Notices")
#   • New: LegalPageHeader, ModuleDisclaimer, LEGAL-COMPLIANCE.md
#   • About page: "hold power accountable" → "engage with governance based on facts"
#   • 4 features renamed with votes preserved (638+444+180+157)
#
# 2026-04-16 — Political Risk Fixes + Feature Wording Update:    COMPLETE
#   • Renamed feature: "Corruption & Fund Leakage Tracker" → "Budget Utilization Tracker"
#     (votes preserved via scripts/update-feature-wording.ts)
#   • Renamed feature: "MP/MLA Report Card" → "Elected Representative Dashboard"
#   • Renamed feature: "Public Service Delivery Timer" → "Public Service Delivery Times"
#   • Updated feature description: "Compare Districts Side-by-Side" (neutral wording)
#   • About page mission: "hold power accountable" → "engage with governance based on facts"
#   • About page: "activist" → "researcher" in citizen listing
#   • Sidebar data-sources description: "scraping status" → "data refresh status"
#   • Disclaimer Section 5: email now clickable mailto link
#   • New component: src/components/common/ModuleDisclaimer.tsx
#   • Leadership module now shows source + verification disclaimer
#   • Infrastructure tracker shows timeline + news attribution disclaimer
#   • Data sources page badges: already clean ("Collected" / "Aggregated")
#   • All user-facing text: zero instances of "scrape/scraper/scraping/scraped",
#     "corruption" (except official govt helpline names), "suspicious",
#     "promises vs reality", "ACTUALLY"
#   • New doc: docs/LEGAL-COMPLIANCE.md (permanent language rules)
#
# 2026-04-16 — Legal Pages Overhaul (Disclaimer + Privacy Policy):    COMPLETE
#   • Disclaimer rewritten: 14 sections, including Political Neutrality,
#     Government Emblems & Trademarks, References to Public Officials,
#     News Aggregation, Not Legal/Financial/Medical Advice, User-Submitted
#     Content, Governing Law & Jurisdiction, Contact for Legal Notices
#   • Privacy Policy rewritten: DPDP Act 2023 fully compliant with
#     Grievance Officer, Cross-Border Data Transfers disclosure,
#     Data Breach Notification commitment (72-hour), Automated Processing
#     disclosure, Right to Withdraw Consent
#   • New component: src/components/common/LegalPageHeader.tsx
#   • Last updated: 16 April 2026 (both pages)
#   • Cross-links added between Disclaimer ↔ Privacy ↔ About
#   • Footer verified to include both pages
#
# 2026-04-14 — Security/perf hardening (responsible disclosure):
#   • /api/payment/contributors anonymized (DPDP): displayName (first + last initial),
#     tierLabel (range, not exact ₹), timeAgo bucket, message truncated to 100 chars.
#     Removed amountRupees and exact paidAt from public response. Cache key bumped to v2.
#     Admin endpoint (/api/admin/payments) unchanged — still returns full data.
#   • SupportCheckout.tsx: Razorpay script loader now de-dupes via DOM query (kills
#     1,200+/session tracking loop). Replaced `new QueryClient()` bug with useQueryClient()
#     (try/catch fallback when rendered outside QueryClientProvider).
#   • robots.ts: removed /admin/ from disallow list — reduces attack-surface signaling.
#
# 2026-04-14 — Mumbai routing + public UpdateLog feed + data fixes:
#   • Routing: slug aliases added (budget→finance, famous→famous-personalities,
#     citizen→citizen-corner, panchayat→gram-panchayat, farm-advisory→farm).
#     Static pages now take precedence over [taluk] catch-all, killing the
#     "Loading taluk…" bug on external/bookmarked links. Each alias uses
#     permanentRedirect so search engines collapse to canonical slug.
#   • UpdateLog extended: +recordCount Int?, +details Json? (existing oldValue/
#     newValue diff kept; new fields serve bulk scraper summaries). Run
#     `npx prisma db push` to apply. logUpdate() helper takes the new params.
#   • Scraper integration: weather/crops/news jobs now call logUpdate() after
#     each successful run (source="scraper", moduleName=module, recordCount=N).
#   • Public transparency surface: GET /api/data/update-log?district=…&filter=
#     (all|scrapers|admin|seeds) with cursor pagination; new module page at
#     /[locale]/[state]/[district]/update-log showing timeline, module/source
#     badges, relative timestamps, filter tabs, load more. Added to LOCAL INFO
#     section of desktop + mobile sidebars. New SIDEBAR_MODULES entry with
#     History icon.
#   • Mumbai fixes:
#     – Courts: avgDays is Float? in schema but treated as number in UI, causing
#       Couldn't load Courts via ErrorBoundary when any row had null. Interface
#       now `number | null`; reduce / toFixed sites guarded.
#     – Taluk count: Overview hero + StatCard now prefer DB count
#       (overview.taluks.length) over hardcoded talukCount in districts.ts so
#       Overview and Map agree.
#     – Population: /api/data/population filters out rows whose source contains
#       "Metropolitan Region" (MMR estimate was 21M for Mumbai district = wrong).
#       Seed-mumbai-data.ts row removed too.
#     – RTI fee ₹₹10: file-rti UI strips leading ₹/Rs prefix before prepending ₹.
#     – Services page gained DataSourceBanner; state-config registers sources
#       for services and update-log.
#   • Post-deploy: aliases moved to next.config.ts redirects() as true 308s
#     (server-component permanentRedirect streamed a 200 with target HTML,
#     which is fine for humans but not for SEO). 5 redirect page.tsx stubs
#     deleted.
#
# 2026-04-14 — Phase 2: Mumbai taluka data + urban-aware UI + classifier tuning:
#   • scripts/fix-mumbai-taluk-names.ts: Mumbai's 13 DB taluks had Kannada
#     nameLocal on some rows and 0 population across the board. Script
#     overwrites nameLocal with Marathi (Devanagari), seeds approximate
#     BMC-ward-aggregate populations + areas, and writes a UpdateLog entry
#     (module=map, action=update, recordCount=13). Data source noted in the
#     script header: BMC ward-wise estimates, exact ward census unavailable.
#   • scripts/backfill-mumbai-update-log.ts: idempotent backdated seed log
#     (15 module entries timestamped ~2026-04-01) so the public /update-log
#     page shows real historical provenance from the moment it ships.
#   • [taluk]/page.tsx: now state-config aware —
#       – subDistrictUnit label (Taluk/Mandal/Ward) instead of hardcoded "Taluk"
#       – removes the hardcoded Kannada "ತಾಲ್ಲೂಕು" suffix after nameLocal
#       – hides Gram Panchayats + JJM module cards when
#         gramPanchayatApplicable/jjmApplicable=false
#       – suppresses the entire "Villages (0)" section for urban districts
#       – stats grid now shows taluk.population (DB seeded value) and a new
#         Area km² card when area is set
#   • /map taluk list now surfaces population + area for urban districts
#     (the 5-shape GeoJSON covers only zone-level boundaries; card grid
#     carries the missing 8 zones via DB data).
#   • alerts/page.tsx: type pills + inline badges now pass through
#     formatTypeLabel() → "water_supply" renders as "Water Supply".
#   • scraper/jobs/news.ts: transport MODULE_KEYWORDS promoted above crops +
#     police in the match order so named-train / commuter / overcrowding
#     headlines win before falling to incidental "agri"/"crime" matches.
#     Added: vande bharat, shatabdi, rajdhani, duronto, tejas, jan shatabdi,
#     local train, mumbai local, suburban, wr local, cr local, best bus,
#     monorail, metro line, commuter(s), overcrowding/overcrowded,
#     stampede at station, train, platform, station, irctc.
#     Crops keyword list unchanged.
#
# 2026-04-15 — Deep cleanup + AI enrichment + location constants:
#   • NEW src/lib/constants/infra-locations.ts — single source of truth for
#     Indian city/neighborhood → district mapping AND city-locked agencies.
#     Used by BOTH the runtime sync-time scope override and the offline
#     cleanup script. Includes:
#       – AREA_TO_DISTRICT map (~90 neighborhoods + 25 out-of-system cities
#         mapped to null so references can be pruned)
#       – AGENCY_TO_DISTRICT pattern list (BMRCL / CMRL / DMRC / MMRDA /
#         UPMRC / HMDA / KMRC / NCRTC / L&T Metro Rail Hyderabad etc.)
#       – detectDistrictFromName(), detectDistrictFromAgency(),
#         allDistrictsMentionedInName()
#   • scripts/fix-infra-deep-cleanup.ts: removes rows by THREE strategies.
#       S1 area mismatch — e.g. "Kengeri Metro" in Mandya → dropped
#       S2 agency mismatch — "BMRCL Outer Ring Road" in Mumbai → dropped
#       S3 NATIONAL stub noise — scope=NATIONAL + no budget + no progress +
#          no verification (typical policy-announcement leftover)
#     Two-city connecting routes ("Mumbai-Ahmedabad Bullet Train",
#     "Bengaluru-Mysuru Expressway") always preserved. Produced 27
#     targeted deletes across 9 districts.
#   • applyScopeOverride() in src/lib/infra-sync.ts rewritten to use the
#     shared location constants FIRST — single-area names force
#     scope=DISTRICT + districtNames=[that one district], blocking the
#     fan-out that previously sprayed Bengaluru projects onto every
#     Karnataka district. Cities not in our system return
#     scope=NATIONAL with empty districtNames so the sync target list
#     comes up empty and the row is quietly skipped.
#   • scripts/fill-infra-missing-data.ts: Anthropic-backed
#     (FTP_AI_PROVIDER=anthropic, purpose="insight" → Claude Haiku 4.5)
#     fills missing announcedBy / party / executingAgency / description /
#     category. Fill-only semantics (never overwrites concrete data).
#     Each fill writes an InfraUpdate of updateType="AI_ENRICHMENT" so the
#     timeline preserves provenance. 1s pace, --limit default 100.
#   • NewsItem dedup pass: 42 title-prefix duplicates removed across 9
#     districts (Mandya industrial-hub article was repeating 4-5x).
#     Ongoing dedup still handled per-cron by the existing logic; this
#     was a catch-up sweep for historical data.
#
# 2026-04-15 — Infra polish round 2 + contributor visibility overhaul:
#   • Cross-contamination cleanup (scripts/fix-infra-cross-contamination.ts):
#     20 mis-targeted InfraProject rows removed (mostly Bengaluru projects that
#     had been fanned out to Mandya/Mysuru by AI scope=STATE inference).
#     Hardened in code: applyScopeOverride() in infra-sync.ts now forces
#     DISTRICT scope when the name carries a single city marker
#     ("Bengaluru Metro", "Mumbai Coastal Road"), STATE for two-city names
#     ("Mumbai-Ahmedabad"), NATIONAL for NH-/Bharatmala/Vande-Bharat patterns.
#     A debug log line announces every override.
#   • InfraProject +description (Text). Surfaces on cards (2-line clamp) and
#     in the new Timeline modal. AI extractor prompt asks for it; sync code
#     fills only when null. Admin Content Editor accepts it.
#   • scripts/seed-infra-real-data.ts: every one of the 31 curated projects
#     now ships with a 1-2 sentence citizen-focused description (route length,
#     stations, time saved, target population). Re-run produced 30 updates,
#     1 skipped (NICE Road already complete on every field).
#   • Timeline UX: the inline accordion on each project card was replaced
#     with a centred modal (max-width 700, ESC + backdrop click closes,
#     body-scroll lock while open). Description shown in modal header.
#     Pre-computed AI analysis still lives at the bottom of the modal.
#   • Overview page: new InfraSnippet component renders right after the
#     District Snapshot tile grid — totals + top-3 in-progress projects with
#     mini progress bars + total tracked budget, links to /infrastructure.
#     Hides itself entirely when the district has 0 projects.
#   • Sidebar Backed-By: TopTierShowcase now sources from amount-based
#     visibility (≥₹9,999 → national tier) and shows up to 2 placeholder
#     "Your name here" slots until 3+ real names exist. Bare-domain social
#     links normalised through normalizeSocialLink.
#   • /api/payment/contributors switched its source-of-truth from
#     Contribution (Razorpay-only, paise) to Supporter (all sources, rupees).
#     Support page total now shows the real figure (₹59k+ including manual
#     adds like Micah Alex's ₹50,000), not just Razorpay traffic. Cache key
#     bumped to v3.
#
# 2026-04-15 — Final pre-push polish (8 fixes):
#   • src/components/common/MobileHint.tsx — responsive hint widget. On
#     desktop (>=768px) renders a hover-tooltip with ⓘ marker; on mobile
#     renders inline expandable text under the trigger so touch users
#     aren't shut out. Replaces title="" calls on:
#       – leadership page party badge,
#       – infrastructure page "Announced by:" + party label.
#   • Leadership card role description: now an expandable button —
#     1-line truncated by default, ▸/▾ indicator, tap toggles full text;
#     desktop also gets the title-attr hover for accessibility.
#   • Leadership page additions:
#       – LiveElectionBanner now also rendered above the AI Insight card
#         (was overview-only). Surfaces the same red "VOTING IN N DAYS"
#         banner on TN/WB leadership pages right now.
#       – ModuleNews(module="leaders") rendered after ElectionSection so
#         related news articles appear at the bottom of the page when
#         classified as leadership news. Component renders nothing if
#         no articles exist for the module — quiet states stay calm.
#   • Mandya infrastructure: filled the last missing description
#     ("Mandya Industrial Hub with ARAI Centre") + executingAgency
#     (KIADB / ARAI). Mandya now 100% description coverage.
#   • Existing protections (verified, not re-introduced):
#       – Leader cards already render lastVerifiedAt provenance via
#         leaderProvenance() ("Manually researched · Last verified: …"
#         / "Added from seed data" / "Updated from news: …").
#       – Leadership page already wrapped in ModuleErrorBoundary so a
#         single component crash doesn't blank the page on scroll.
#       – ElectionSection already carries the ECI legal footer
#         disclaiming affiliation with the Election Commission.
#
# 2026-04-15 — Elections: live ECI dates + leadership election section + AI staleness fix:
#   • Schema (additive, prisma db push): NEW model ElectionEvent
#     (id, type [LOK_SABHA|STATE_ASSEMBLY|MUNICIPAL|PANCHAYAT], label,
#      state, district, lastHeld, pollingDate, pollingPhases JSON,
#      resultDate, nextExpected, termYears, totalSeats, body, note,
#      source, isActive, updatedAt, createdAt). Indexed by (state,isActive)
#     and (type,isActive).
#   • scripts/seed-election-events.ts (idempotent) — seeds 8 rows:
#     Lok Sabha (2024 → ~2029), TN Vidhan Sabha 2026 LIVE (poll 23 Apr,
#     result 4 May, single phase), WB Vidhan Sabha 2026 LIVE (poll 23 Apr +
#     29 Apr two-phase, result 4 May), Karnataka 2023→2028, Maharashtra
#     2024→2029, Telangana 2023→2028, Delhi 2025→2030, UP 2022→2027.
#     Source: ECI announcements, ECI 2024 LS results notification.
#   • /api/data/elections?state=<slug> — returns national rows
#     (state IS NULL) + state-level rows for the slug, sorted live →
#     upcoming → past. 5-min Redis cache.
#   • src/components/district/ElectionSection.tsx (rendered at the bottom
#     of /leadership): cards colour-coded by urgency —
#       PAST → grey ✅ Completed
#       ≤14d → red 🔴 LIVE / VOTING IN N DAYS (with CSS pulse animation)
#       ≤6mo → amber 🟠 APPROACHING
#       ≤2yr → yellow 🟡 UPCOMING
#       >2yr → grey ⚪ SCHEDULED
#     Footer disclaimer covers ECI source + non-affiliation.
#     Helper findActiveElection(events) used by the page to detect a
#     <30-day window for the top "ELECTION PERIOD" banner + per-card
#     "⚠ Election period" amber pill on political cards.
#   • src/components/district/LiveElectionBanner.tsx (rendered on the
#     overview page above AIInsightCard): only renders when state has a
#     polling date within 30 days; otherwise nothing. Links to /leadership.
#   • news-action-engine `elections` case enhanced: when an article title
#     looks like an ECI schedule announcement ("ECI announces", "polling
#     on…", "result date"), surfaces it to UpdateLog with recordId=
#     "pending-review" — auto-write of dates is intentionally gated
#     behind human review (wrong schedule data is worse than missing
#     schedule data when voting is days away).
#   • generate-insights cron: leaders module no longer hidden behind
#     hasDataChanged — gets a hard 7-day TTL refresh window. During an
#     active election period (any ElectionEvent with polling within ±30d
#     for the district's state), refreshes daily.
#   • AIInsightCard timing copy: stale insights (>14 days) now show
#     "Last analysis: <date>. Will refresh when data changes." instead
#     of the misleading "Refreshing soon" placeholder.
#
# 2026-04-15 — Leadership: role descriptions + auto-party fallback + all-districts re-tier:
#   • Schema (additive, prisma db push): Leader gains roleDescription String?
#   • src/lib/constants/role-descriptions.ts — single config of one-line role
#     descriptions (President, PM, Governor, CM, MP, MLA, Collector, SP, CP,
#     ZP CEO, Municipal Commissioner, Mayor, Chief Justice, Tahsildar, etc.).
#     getRoleDescription(role) does exact match → split-on-,;( head match →
#     contains match → "MP/MLA" pattern fallback → calm generic fallback.
#     Used by the leadership page (one-line italic grey under role title,
#     full text in title-attr tooltip) and the all-districts script.
#   • src/lib/constants/party-colors.ts now has YSRCP, RJD, CPI(M), CPI,
#     AIADMK, JMM, SAD, BJD, Independent (capitalised) entries. Improved
#     getPartyColor: exact match → case-insensitive match → grey UNKNOWN
#     fallback with one-time console.warn so unknown parties never crash
#     the page and surface as scannable log lines for the maintainer.
#   • news-action-engine `leaders` case logs the same warning when a news
#     article delivers a party not in PARTY_COLORS — easy to spot when
#     elections create a new party.
#   • /api/data/leaders now returns roleDescription so the page can render
#     it without re-deriving on every render.
#   • scripts/fix-all-districts-leadership.ts (one-shot data sweep across
#     all 9 active districts):
#       Stage 1a — DELETES known placeholder rows ("Bengaluru leaders",
#         "Karnataka CM", "Bengaluru Urban District Collector").
#       Stage 1b — ADDS Modi/Murmu at T1 for every district + per-state
#         CM/Governor at T2 where the user has explicitly confirmed
#         (Karnataka Gehlot/Siddaramaiah, Maharashtra Fadnavis, TN Stalin,
#         Telangana Revanth, UP Yogi+Anandiben, WB Mamata). Delhi CM left
#         untouched per spec (post-Feb-2025 election uncertainty).
#       Stage 2 — RE-TIERS every active leader by role-pattern alone:
#         T1 President/PM, T2 Governor/CM/Dy CM/CS/LG/Cabinet ministers,
#         T3 Collector/DC/DM/SP/CP/DCP/CEO ZP, T4 MP/MLA/Union Minister,
#         T5 Mayor/Municipal Commissioner/CJ/MD/Chairman/dept heads.
#         Legacy "Member of Legislative Assembly" rows normalised to
#         "MLA, <constituency>" using the row's own constituency value.
#       Stage 3 — Populates roleDescription = ROLE_DESCRIPTIONS[role] for
#         every active row whose roleDescription is null.
#   • Result (active rows by tier across the 9 districts):
#       Bengaluru 60 | Mysuru 40 | Mandya 15 | Mumbai 53 | Chennai 39 |
#       Hyderabad 23 | Lucknow 16 | Kolkata 45 | New Delhi 32
#       0 deleted · 0 added (all already present from prior runs) ·
#       225 re-tiered · 323 descriptions populated.
#   • DISTRICT-EXPANSION-SKILL.md updated with the new tier model and the
#     "[Verify at <portal>]" placeholder convention for unknown bureaucrats.
#
# 2026-04-15 — Leadership: 5-tier hierarchy redesign + party colours + Mandya re-tier:
#   • New tier semantics (replaces flat tier-by-role list):
#       T1 NATIONAL          — President, Prime Minister
#       T2 STATE             — Governor, Chief Minister, key state ministers
#       T3 DISTRICT ADMIN    — Collector, SP, ZP CEO  (IAS / IPS — no party)
#       T4 ELECTED REPS      — MP + MLAs (party + constituency)
#       T5 MUNICIPAL & DEPT  — Mayor, Municipal Commissioner, dept heads
#     Tier number is the only structural input — anything tagged tier=N
#     lands in the corresponding section. No tier-to-people mapping in UI.
#   • src/lib/constants/party-colors.ts — single source of truth for party
#     colour tokens (bg/border/text). Used by leadership page (party-coloured
#     card border) and infrastructure page (party label on Announced by).
#   • Leadership page rewritten as 5 vertical tier sections with:
#       – tier header (emoji + icon + accent + hint),
#       – party-coloured card border for political tiers, tier-coloured
#         border for bureaucratic tiers,
#       – per-card name/role/constituency/party-pill + ⓘ "as last reported"
#         tooltip + provenance footer ("Updated from news / Manually
#         researched / Added from seed data · Last verified: <date>"),
#       – placeholder name "[Verify at <portal>]" rendered italic-grey so
#         users see the verification action item, not a fake person,
#       – vertical connector line between tiers,
#       – bottom grey disclaimer covers political affiliations + bureaucrat-
#         names-change-on-transfer.
#   • src/components/district/LeadersSnippet.tsx — overview snippet placed
#     BEFORE InfraSnippet. Shows Collector / SP / MP / MLA-tally line with
#     party pills, links to /leadership. Replaces the old horizontal
#     "Leadership Strip" carousel in OverviewClient.
#   • scripts/fix-mandya-leadership.ts — re-tiers Mandya:
#       – T1: Modi + Murmu kept,
#       – T2: Siddaramaiah + Gehlot moved up from T1,
#       – T3: Collector / SP / ZP CEO added with [Verify at <portal>] names,
#       – T4: HDK MP + 7 MLAs moved from T1/T2; role normalised to
#         "MLA, <constituency>" using DB constituency (authoritative ECI
#         value, never overwritten by hand-coded constituency).
#       – Result: 14 updated · 1 added · Mandya now has 15 active leaders
#         spread cleanly across T1-T4.
#   • news-action-engine `leaders` case now writes UpdateLog rows for
#     creates and supersession events:
#       "New <role>: <name> (<party>) replacing <oldName>"
#       "Leader marked inactive: <oldName> (<role>) — replaced by <newName>".
#     Source = scraper (per UpdateSource enum). Surfaces in district Update
#     Log automatically.
#
# 2026-04-15 — Leadership: data corrections + disclaimers + news pipeline + last verified:
#   • Schema (additive, prisma db push): Leader gains active Boolean(default true)
#     and lastVerifiedAt DateTime?. New @@index([districtId, active]).
#   • scripts/fix-leadership-all-districts.ts (one-shot data correction):
#       – DELETES factually wrong rows: Mandya "Kumaraswamy | Chief Minister | BJP"
#         (HDK is JD(S), not BJP, and not CM); Bengaluru placeholder rows
#         "Bengaluru leaders" and "Karnataka CM".
#       – UPDATES Mandya HDK MP row to "Union Minister for Heavy Industries &
#         Steel; MP, Mandya" with party=JD(S).
#       – ADDS missing tier-1 leaders where certain (Apr 2026): Karnataka
#         Siddaramaiah(CM)/Gehlot(Gov); national Modi(PM)/Murmu(President);
#         per-state CMs for Maharashtra/TN/Telangana/UP/WB. Delhi CM left
#         untouched (post-Feb-2025-election uncertainty per spec).
#       – RENAMES role-as-name placeholders (e.g. "Commissioner of Police,
#         Chennai") to "[Name Not Available]" — never fabricates a person.
#       – Sets lastVerifiedAt=now() on every row touched (added/updated).
#   • /api/data/leaders: now filters active=true and surfaces source +
#     lastVerifiedAt fields; inactive (replaced) holders preserved in DB but
#     hidden from the page.
#   • Leadership page (/[locale]/[state]/[district]/leadership):
#       – Top blue Info banner: "Leadership data reflects the latest available
#         information. Political positions and party affiliations change
#         frequently. Verify current officeholders at the official district
#         administration website."
#       – Per-card provenance footer: "Updated from news / Manually researched /
#         Added from seed data · Last verified: <date>".
#       – Bottom grey "Note on political affiliations" — affiliations are as
#         last reported, IAS/IPS carry no party, no endorsement/opposition.
#   • news-action-engine `leaders` case rewritten:
#       – Bumps lastVerifiedAt+active=true on dedupe match.
#       – For unique-officeholder roles (CM/Gov/Collector/Mayor/CP/MD/Chairman/
#         CJ/etc.), marks previous holder of the SAME role inactive (never
#         deletes — preserves history).
#       – New rows always carry lastVerifiedAt + active=true.
#   • Result: Mandya now correct (no Kumaraswamy-as-BJP-CM), all 9 districts
#     have Modi+Murmu at tier-1, Karnataka districts share Siddaramaiah/Gehlot,
#     95 role-as-name placeholders renamed, 3 wrong rows deleted, 20 new
#     leaders added.
#
# 2026-04-15 — Infrastructure: comprehensive legal protection sweep:
#   • LegalFooter rewritten as 6-paragraph "Legal Notice" — Article 19(1)(a)
#     + NDSAP, person/party caveats (transparency-not-endorsement), status +
#     progress + budget caveats, agency-name-change caveat, fair-dealing under
#     Indian Copyright Act §52(1)(a)(ii), and explicit non-affiliation /
#     non-endorsement / non-opposition statement.
#   • DataFreshnessIndicator at the top of each district's /infrastructure
#     page (above stat tiles, below DataSourceBanner). Computes max(lastNewsAt)
#     across all projects: green ✅ "<24h/days> ago" when ≤7 days, amber ⚠
#     "Data last updated from news: …" when >7 days, blue ℹ "Initial data —
#     will be enriched as news articles appear" when no project has any news.
#   • Per-card additions (ProjectCard):
#       – ⚖️ "Subject to court proceedings" amber pill, shown when COURT_RE
#         matches name/description/cancellationReason or any update text
#         (supreme court, high court, tribunal, stay order, sub-judice,
#         court order, halted by court, injunction, writ petition, NCLAT, NGT).
#       – COMPLETED status now renders a green italic "Completion reported in
#         news media on <date>" line. STALLED/CANCELLED/DELAYED keep the
#         existing "Status derived from news reports" line.
#       – Budget block: italic "As reported in news media" line directly
#         below the figure (only when a budget is shown).
#       – Progress block: italic line below the bar — "Progress as of <date>"
#         when sourced from news, or "Progress approximate · Last verified:
#         <date>" when sourced from seed/manual data.
#       – Single-source warning standardised: verificationCount==0 → "Not yet
#         cross-verified by news sources"; verificationCount==1 → "⚠ Single
#         source — awaiting additional verification".
#   • PARTY_TOOLTIP extended with "Shown for transparency, not as political
#     endorsement." line.
#   • Fixes are layout-stable: every card still has the same row order
#     (header / disclaimer / people / budget / timeline / progress / verification
#     warning / latest-news / footer); placeholders just become italic notes
#     instead of changing card height.
#
# 2026-04-15 — Infrastructure: legal disclaimers + neutrality audit + Kolkata people:
#   • New per-page LegalFooter on /infrastructure (below ModuleNews, above page
#     padding): grey bordered box, font-size 12px, max-width matching cards.
#     Cites Article 19(1)(a) + NDSAP, clarifies that person/party attribution
#     reflects public news and is not a performance assessment, and notes that
#     status classifications are derived from news (not official). Augments the
#     existing top-of-page amber Data Transparency banner.
#   • Per-card mini disclaimer for STALLED / CANCELLED / DELAYED projects: a
#     low-contrast italic line directly above the People row reading "Status
#     derived from news reports. Contact <executingAgency> for official status."
#     (executingAgency clause omitted when null). Only renders for those three
#     statuses so the rest of the cards stay clean.
#   • PeopleRow: "👤 Announced by:" prefix added (was implicit), inline ⓘ tooltip
#     on the announcer (CSS title) and a separate tooltip on party label:
#       announcer  → "This attribution is based on news reports. It indicates
#                    who publicly announced this project, not who is responsible
#                    for its current status."
#       party      → "Party affiliation shown as reported in news media at the
#                    time of announcement."
#     Person attribution is rendered SEPARATE from the status badge (status sits
#     in card header top-right, person sits in its own row below the disclaimer).
#   • verifyInfraExtraction VERIFY_SYSTEM prompt strengthened with explicit
#     neutrality guard ("never use 'scam', 'loot', 'corrupt', 'waste'; never
#     attribute blame"). Matches the existing extraction + analysis prompts.
#   • Neutrality audit (codebase + DB): zero true judgmental hits. The 17 "waste"
#     hits in the DB are all legitimate civic terms (waste-to-energy, solid-
#     waste-management, wastewater) — not moral judgments.
#   • Kolkata people fill (scripts/fill-kolkata-people.ts): 13 of 18 curated
#     entries patched announcedBy/Role/Party (Mamata Banerjee, Firhad Hakim,
#     Ashwini Vaishnaw, Sarbananda Sonowal, Jyotiraditya Scindia). 5 already
#     complete. Kolkata people coverage 0 → 13.
#   • Coverage table after all April 15 fills (9 active districts):
#       Bengaluru Urban  157 · Chennai 18 · Hyderabad 21 · Kolkata 31 · Lucknow 10
#       Mandya 24 · Mumbai 26 · Mysuru 72 · New Delhi 33 — all 9 cross-clean ✅
#   • Duplicate card footer (legacy "Last updated/Source" pair) removed; the
#     real footer with View Timeline link remains the single source.
#
# 2026-04-15 — Manual-research data fill: Mumbai+Chennai+Hyderabad+Delhi+
#   Kolkata+Lucknow infrastructure (89 projects in fill-remaining-districts-
#   infra.ts). Same fill-only semantics as fill-bengaluru — match by name +
#   alts, never overwrite, mirror originalBudget→revisedBudget→budget, status
#   upgrade only forward, InfraUpdate(MANUAL_RESEARCH) per filled row, CREATE
#   fallback when no fuzzy match. Also globally deletes the 7 duplicate
#   "Metro light and metro neo for Tier 2 cities" policy-noise rows across
#   active districts. Result: 38 filled · 41 created · 9 already complete.
#
# 2026-04-14 — Infrastructure: news-driven tracker with timelines + AI analysis:
#   • Schema (additive, prisma db push): InfraProject gains announcedBy/
#     announcedByRole/party, executingAgency, keyPeople Json, originalBudget/
#     revisedBudget/costOverrun/costOverrunPct, timeline dates (announced/
#     approved/tender/actualStart/originalEnd/revisedEnd/completion/cancelled
#     + cancellationReason + delayMonths), shortName, scope, sourceUrls Json,
#     lastNewsAt, lastVerifiedAt, verificationCount. NEW model InfraUpdate
#     (one timeline row per news mention; newsUrl MANDATORY; type enum
#     ANNOUNCEMENT/APPROVAL/TENDER/… including SEED; (projectId, date) index).
#   • src/lib/infra-sync.ts:
#       – extractInfraFromNews(article): free-tier AI (purpose="classify").
#         Budget converted to RUPEES (₹12,700 Cr → 127000000000). Party/person
#         attribution strictly from article text; null otherwise. Never uses
#         scam/loot/corrupt/waste vocabulary.
#       – verifyInfraExtraction(article, extraction): SECOND free-tier AI
#         pass with a different prompt, returns {verified, corrections, flags}.
#         Verifier failure = not verified, never silently passes.
#       – syncInfraFromNews: fuzzy upsert (shortName/title prefix). Status
#         never downgrades; CANCELLED terminal. Budget lifecycle: first write
#         sets originalBudget; later writes update revisedBudget + computed
#         costOverrun / costOverrunPct. keyPeople appended (not replaced),
#         capped 25. sourceUrls capped 20. Every call creates an InfraUpdate
#         row keyed by newsUrl (dedupe). Cache-busts Redis per district.
#         Logs UpdateLog entry for every affected district.
#       – extractVerifyAndSyncInfra: orchestrator used by the news pipeline.
#         Gates: confidence>=0.5 + (verified||confidence>=0.85). Everything
#         else silently skipped (with log line) so the news cron never breaks.
#   • news-action-engine infrastructure case rewired to call the orchestrator;
#     old ad-hoc create/update logic removed.
#   • /api/data/infrastructure now includes updates[] (most recent 25 per
#     project) so project cards render the "Latest news" strip and the full
#     timeline accordion without a second fetch.
#   • /api/data/infra-analysis?projectId=… (NEW): lazy Gemini 2.5 Pro
#     (purpose="insight") project analysis. System prompt enforces neutral
#     tone + source-anchored facts. 24h Redis cache keyed
#     ftp:infra-analysis:<id>:v1. Only fires when the user clicks the
#     "Generate project analysis" button in an expanded timeline — not during
#     initial page load.
#   • infrastructure/page.tsx full redesign:
#       – Mandatory amber Data Transparency disclaimer banner at top.
#       – Stat tiles: Total/Active/Completed/Delayed/Cancelled + Total Budget
#         (+ Funds Released when non-zero).
#       – Category + Status filter pills with live counts.
#       – Sort: Latest Update / Budget / Most Complete / Most Delayed.
#       – Project cards: title + category + executing agency, "Announced by"
#         + party attribution, key people strip, budget block with overrun,
#         timeline dates, progress bar (hidden for CANCELLED), latest news
#         strip, verificationCount line ("⚠ Single source" when count=1),
#         expandable full timeline accordion with per-entry source link.
#         LazyAnalysis button for AI analysis under the open timeline.
#       – "Cancelled / Shelved Projects" section at the bottom, separated.
#   • ExamStepper unchanged (infra has its own timeline UI).
#   • Sidebar: new Infrastructure entry promoted to QUICK ACCESS right after
#     Finance & Budget (desktop + mobile both). HardHat icon, 🏗️ emoji.
#     sidebar-modules.ts SIDEBAR_MODULES now 36 entries.
#   • state-config getModuleSources for infrastructure updated to reflect the
#     news-driven source; /data-sources page row also updated.
#   • insight-config promptHint for infrastructure rewritten to require
#     neutral tone, include new fields (costOverrunPct/scope/executingAgency).
#   • scripts/backfill-infra-from-news.ts: --limit (default 10, cap 40) +
#     --dry-run. KEYWORD_RE pre-filter + title-prefix dedupe to keep AI cost
#     bounded. Phase 2 within the same script: seeds a SEED-type timeline row
#     for every legacy InfraProject that has a source URL but zero
#     InfraUpdates — so cards always carry at least one provenance link.
#   • Update Log sanity-tested across every active district
#     (/en/<state>/<slug>/update-log): all 9 districts return 200 for the
#     page, the API (/api/data/update-log?district=…), and the rebuilt
#     infrastructure page. Sidebar shows Update Log for every district.
#
# 2026-04-14 — Exams: news-driven sync + daily status cron + milestone UI:
#   • GovernmentExam schema extended additively with shortName, organizingBody,
#     category, scope (NATIONAL|STATE), notificationDate, sourceUrls (Json),
#     lastVerifiedAt, needsVerification. Legacy fields (title/department/status
#     lowercase) preserved; new news-sourced rows use UPPERCASE status enum.
#   • src/lib/exam-sync.ts:
#       – extractExamFromNews(article): free-tier AI extraction (no guessing,
#         null for unmentioned fields). Returns null when the article is not
#         about a specific exam.
#       – syncExamFromNews(extraction, article, sourceDistrictId): fuzzy upsert
#         by shortName / title-prefix. NATIONAL scope fans out to every active
#         district; STATE scope to that state's districts. Status never
#         downgrades. null values never overwrite concrete data. sourceUrls
#         array capped at 10. Logs UpdateLog + busts Redis cache per district.
#   • news-action-engine exams case rewired to call the new sync pipeline
#     (replaces the crude direct create).
#   • /api/cron/update-exams (route.ts, Bearer CRON_SECRET, 30 6 * * *):
#       pass A — advance status from calendar dates (APPLICATIONS_OPEN when
#         start<=now<=end, ADMIT_CARD_OUT when admitCardDate<=now, etc.),
#         never downgrading.
#       pass B — set needsVerification=true on non-completed exams whose
#         lastVerifiedAt is older than 30 days.
#     Added to vercel.json crons list.
#   • ExamStepper refactored: no padlocks. Date-driven states —
#       ✅ green + formatted date for past milestones
#       ● blue + date + "in N days" for upcoming
#       · grey "TBA" when the date isn't known
#     Connectors colored by status. Apply button lives under Applications step
#     only when applications are still open.
#   • Exams page:
#       – STATUS_CONFIG now covers both legacy lowercase and new uppercase
#         enum values.
#       – examBucket() groups by new statuses into open/upcoming/closed.
#       – Apply Now button shows whenever applyUrl exists and the exam isn't
#         in a closed bucket (was: only when status="open").
#       – Card footer: "Last updated from news: {relative}" + Source link to
#         the first article in sourceUrls.
#       – "⚠ Unverified" amber pill when needsVerification=true.
#   • src/lib/exam-onboard.ts: onboardDistrictExams(districtId) clones every
#     NATIONAL exam from other active districts + STATE exams matching the
#     target's state. Dedupes by shortName/title; skips rows that already
#     exist at the target. Logs a single UpdateLog summary row.
#   • scripts/backfill-exams-from-news.ts: --limit (default 10, hard-capped at
#     50) + --dry-run. Keyword + title-prefix dedupe, free-tier AI. One bad
#     article never aborts the run.
#
# 2026-04-14 — Phase 2 cont'd: Mumbai map fallback + overview empty sections:
#   • /map: DistrictMapArea replaces MapWithFallback. Fetches the GeoJSON
#     (not HEAD), counts features, compares to DB taluk count. Three states:
#     full (features ≥ taluks → render TalukMap D3), partial (features <
#     taluks → render card grid with coverage notice), missing (render card
#     grid with "boundary data being prepared"). Card grid shows name,
#     nameLocal, population, area per taluk. No more blank map area for
#     Mumbai (5 zone shapes + 13 DB taluks).
#   • Map section label switches to "Urban Zones" for urban districts
#     (showVillages=false); StatCard grid swaps the Villages card for Zones
#     count. The secondary rural village list is only rendered when
#     villages apply.
#   • OverviewClient: Finance & Budget, Police & Public Safety, and Local
#     News sections are now wrapped in {(loading || count > 0) && (…)} so
#     empty modules contribute zero DOM. Inner "No X data available"
#     fallbacks removed (they were unreachable after the outer guard).
#     Resolves massive blank whitespace between the Health Score card and
#     later sections when a module has no rows.

## 1. PROJECT IDENTITY

```
Name:           ForThePeople.in
Tagline:        "Your District. Your Data. Your Right."
Domain:         forthepeople.in
GitHub:         https://github.com/jayanthmb14/forthepeople (public — clean history, MIT with Attribution)
Live URL:       https://forthepeople.in
Vercel Scope:   zurvoapps-projects (zurvoapp Pro account)
Builder:        Jayanth M B, Karnataka, India
Project ID:     FTP-JMB-2026-IN
Pilot Districts: Mandya (Karnataka), Mysuru (Karnataka), Bengaluru Urban (Karnataka), New Delhi (Delhi)
Scalable To:    All 780+ districts across 28 states & 8 UTs
Languages:      English + Regional (Kannada for pilot, expandable via next-intl)
Theme:          LIGHT — minimal, clean, modern, airy
License:        MIT with Attribution (see LICENSE file — forks must retain creator credit)
Legal Status:   Uses ONLY publicly available government data
                NOT an official government website
Deploy:         git push origin main → auto-deploy via Vercel GitHub integration
                NEVER use `npx vercel --prod` directly (causes Vercel scope issues)
Git email:      jayanthmbj@gmail.com (required — Vercel rejects unknown author emails)
```

---

## 2. LEGAL PROTECTION

```
LEGALLY SAFE BECAUSE:
1. RIGHT TO INFORMATION: Article 19(1)(a) of the Indian Constitution
2. OPEN DATA POLICY: data.gov.in operates under NDSAP — designed for public reuse
3. NO COPYRIGHTED CONTENT: Government data is public domain (Copyright Act §52(1)(q))
4. NO IMPERSONATION: Site clearly states it is NOT a government website

MANDATORY DISCLAIMERS (every page):
  EN: "ForThePeople.in is an independent citizen transparency initiative.
       This is NOT an official government website. All data is sourced from
       publicly available government portals under India's Open Data Policy (NDSAP)."
  Footer: "Data sourced under NDSAP | Built with ❤️ by Jayanth M B"

NEVER DO:
  ✗ Use government logos/emblems (Ashoka emblem, state seals)
  ✗ Claim to be an official government service
  ✗ Store personal citizen data (Aadhaar, PAN, etc.)
  ✗ Display full copyrighted news articles (headlines + links only)
  ✗ Charge money for accessing government data
  ✗ Scrape faster than 1 request per 2-3 seconds
```

---

## 3. DESIGN SYSTEM

```
AESTHETIC:    Clean editorial — Linear.app, Vercel, Stripe inspired
THEME:        Light only (dark mode toggle in UI but default: light)

FONTS (Google Fonts — all free):
  English:    "Plus Jakarta Sans"
  Regional:   "Noto Sans Kannada" (pilot) — swap per state using Noto Sans family
  Monospace:  "JetBrains Mono" (data/numbers only — always use .font-data class)

COLOR PALETTE (from globals.css @theme):
  Background:     #FAFAF8  (warm off-white)
  Surface:        #FFFFFF  (cards)
  Border:         #E8E8E4  (soft warm gray)
  Text Primary:   #1A1A1A  (near-black)
  Text Secondary: #6B6B6B  (medium gray)
  Text Muted:     #9B9B9B  (light gray)
  Accent Blue:    #2563EB  (primary actions)
  Accent Green:   #16A34A  (success/positive)
  Accent Amber:   #D97706  (warning/in-progress)
  Accent Red:     #DC2626  (error/negative/wasted funds)
  Accent Purple:  #7C3AED  (planned/upcoming)
  Hover BG:       #F5F5F0
  Selected BG:    #EFF6FF

SPACING & COMPONENTS:
  Card padding: 24px | Section gap: 32px | Card radius: 16px | Small radius: 8px
  Card shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)
  Progress bars: 8px height, pill-shaped (border-radius: 99px)
  Tables: zebra-striped, no heavy borders
  Charts: accent colors only, no gradients
  Icons: Lucide React (20px default)
  Animations: subtle fade-in only (200ms ease)
  Mobile-first: works on ₹8000 phones, min tap target 44×44px
  Numbers: ALWAYS in JetBrains Mono (.font-data class)
  Font weights: max 2 per section (400 regular + 600 semibold)
```

Tailwind v4 — all tokens in `src/app/globals.css` `@theme {}` block.
NO tailwind.config.ts exists (it's Tailwind v4 CSS-based config).

---

## 4. TECH STACK

```
Framework:    Next.js 16.1.7 (App Router, TypeScript, src/ directory)
React:        19.2.3
CSS:          Tailwind CSS v4 (CSS-based config, tokens in globals.css @theme)
ORM:          Prisma 7.5.0 with prisma-client-js generator, output ../src/generated/prisma
DB adapter:   @prisma/adapter-pg (PrismaPg class — required for Prisma 7)
Database:     Neon PostgreSQL (production) / local Postgres via Prisma dev proxy (dev)
Cache:        @upstash/redis REST client (production Vercel — NOT ioredis)
              ioredis used ONLY in Railway scraper container
State:        @tanstack/react-query v5 + zustand v5
Charts:       recharts v3 (lazy loaded)
Maps:         react-simple-maps + topojson-client (India SVG map — FINAL, do not change)
              TalukMap.tsx uses react-simple-maps for taluk drill-down
Icons:        lucide-react
i18n:         next-intl v4
Payments:     razorpay SDK + Razorpay Live checkout
Email:        resend v6 (2FA recovery emails + admin alert emails)
AI provider:  OpenRouter (unified gateway — tiered model routing)
              Tier 1 (free): google/gemma-4-26b-a4b-it:free (classify, summarize)
              Tier 2 (scale): google/gemini-2.5-pro (insights, news, documents)
              Tier 3 (premium): anthropic/claude-sonnet-4 (fact-check only)
Monitoring:   @sentry/nextjs (error tracking, production only)
Alerts:       src/lib/admin-alerts.ts (email + DB alerts for scrapers, feedback, payments)
Analytics:    Plausible (cookieless, DPDP-friendly, one script tag)
2FA:          otpauth + qrcode (Google Authenticator TOTP)
Scraping:     cheerio + puppeteer + node-cron (scraper container)
AI providers: @anthropic-ai/sdk + @google/generative-ai
Encryption:   AES-256-CBC (Node.js crypto) via src/lib/encryption.ts
Date:         date-fns v4
```

### VERIFIED vs SPECULATIVE

```
VERIFIED (code confirmed):
  - Next.js 16.1.7, React 19, Tailwind v4 CSS-based config
  - Prisma 7.5.0 with @prisma/adapter-pg
  - @upstash/redis (NOT ioredis) on Vercel serverless
  - react-simple-maps for India map + taluk map
  - recharts (lazy loaded with next/dynamic)
  - Razorpay Live keys configured
  - next-intl v4 for English + Kannada
  - @anthropic-ai/sdk for Claude Opus
  - @google/generative-ai for Gemini
  - AES-256-CBC encryption for stored API keys + TOTP secrets

SPECULATIVE (assumed from dependencies, not fully verified):
  - zustand v5 store usage in specific components
  - puppeteer usage in scraper jobs
  - bullmq (listed as dep but may be unused currently)
```

### Critical Library Notes
- `@upstash/redis` (NOT ioredis) on Vercel — ioredis requires persistent TCP, crashes serverless
- `ioredis` is used ONLY in the scraper scheduler running on Railway containers
- `recharts` Tooltip `formatter` must NOT type-param as `(v: number)` — use `(v)` + `Number(v)` cast
- `react-simple-maps` is FRAGILE — see Section 7 for fix history. Never rewrite map components.
- Budget values stored in Rupees (NOT Crores) — display always divides by 1e7 to show Crores

---

## 5. DISTRICT HIERARCHY & ROUTING

```
LEVEL 0: Country     → forthepeople.in/
LEVEL 1: State       → /en/karnataka/
LEVEL 2: District    → /en/karnataka/mandya/
LEVEL 3: Taluk/Block → /en/karnataka/mandya/srirangapatna/ (future)
LEVEL 4: Village     → /en/karnataka/mandya/srirangapatna/ganjam/ (future)

ROUTE STRUCTURE:
  /[locale]/[state]/[district]/[module]/page.tsx
  Locale: "en" | "kn" (next-intl)
  State: slug (e.g., "karnataka")
  District: slug (e.g., "mandya", "mysuru", "bengaluru-urban")
  Module: one of 30 modules (see Section 6)

LOCK BEHAVIOR:
  Active district:  Full data, clickable
  Locked district:  Grayed out, "Coming Soon"

10 ACTIVE PILOT DISTRICTS (7 states):
  Mandya (ಮಂಡ್ಯ)          — "Sugar Capital of Karnataka"
  Mysuru (ಮೈಸೂರು)         — "City of Palaces"
  Bengaluru Urban (ಬೆಂಗಳೂರು) — "Silicon Valley of India"
  New Delhi (नई दिल्ली)    — "Seat of India's Government"
  Mumbai (मुंबई)           — "Financial Capital of India"
  Kolkata (কলকাতা)         — "City of Joy"
  Chennai (சென்னை)         — "Gateway to South India"
  Hyderabad (హైదరాబాద్)    — "City of Pearls" [Added 2026-04-10]

MANDYA TALUKS (7):
  1. Mandya        — "Sugar Capital of Karnataka"
  2. Maddur        — "Gateway to Old Mysore"
  3. Malavalli     — "Land of Temples & Tanks"
  4. Srirangapatna — "Tipu Sultan's Island Fortress"
  5. Nagamangala   — "Heart of the Deccan Plateau"
  6. K R Pete      — "Jewel of the Kaveri Basin"
  7. Pandavapura   — "Where the Pandavas Rested"
```

### Sitemap & SEO
- `sitemap.ts` uses `INDIA_STATES` (NOT `INDIA_HIERARCHY`) from districts.ts
- Only active districts are included (filter: `active: true`)
- All static page canonicals → /en/ variants
- hreflang: en, kn, x-default on homepage

---

## 6. 30 DASHBOARD MODULES

All module pages at: `src/app/[locale]/[state]/[district]/[module]/page.tsx`

### DATA (10 modules)
```
overview          — District summary: alerts, live data, snapshot, leadership, projects,
                    finance, police, news, taluks, module grid (reordered post-launch)
map               — react-simple-maps India SVG + TalukMap taluk drill-down
leadership        — 10-tier org chart: MP, MLAs, DC, SP, Judge, Revenue, Block, Dept, Taluk
water             — Live KRS dam levels, inflow/outflow, canal releases
industries        — Sugar factories (Mandya-specific), crushing data
finance           — Budget breakdown (Crores), lapsed funds, revenue collection
crops             — Real-time mandi prices from AGMARKNET (DATA_GOV_API_KEY)
population        — Rich demographic dashboard: Census 2011 + NFHS-5 (placeholder) +
                    NITI MPI 2023 + NITI MPI 2021 Baseline. Religion, caste, age,
                    literacy, employment, education, migration, disability, language,
                    household amenities, marital status, economic class (MPI + trend).
                    State-level Karnataka aggregate at /en/karnataka with choropleth.
                    Admin audit at /en/admin/population.
weather           — Live weather (OpenWeatherMap), historical rainfall
police            — Station directory, traffic revenue, crime stats by year
```

### SERVICES (7 modules)
```
schemes           — Active central/state schemes, eligibility, apply links
citizen-corner    — Responsibility tips, helplines, RTI templates
elections         — Results by constituency, representative, turnout
transport         — Bus routes, train schedule, auto fare chart
jjm               — Jal Jeevan Mission tap connection coverage
housing           — PMAY tracker, completion rates
power             — Scheduled power cuts, BESCOM outage tracker
```

### GOVERNANCE (7 modules)
```
schools           — UDISE data, SSLC board results, staffing widget
farm              — Soil health cards, KVK crop advisory
rti               — Filing trends, department-wise response time
file-rti          — Guided wizard with pre-drafted RTI templates
gram-panchayat    — Village-level MGNREGA, fund utilization
courts            — Case pendency, disposal rates, court directory
health            — Hospital directory, bed count, doctor ratio, staffing widget
```

### CIVIC (NEW — Phase 5, March 2026)
```
exams             — Govt. exam notifications: KPSC, KAS, UPSC, SSC + staffing data
                    ExamStepper component, Apply Now button, Student Perspective fields
                    StaffingWidget (sanctioned vs filled) for health/police/schools
```

### COMMUNITY (5 modules)
```
alerts            — Real-time advisories (auto-expires after 14 days)
offices           — Govt office directory with hours, "Open Now" indicator
responsibility    — 7 citizen duty sections (has own route /responsibility)
news              — Aggregated local news (AI dedup, AI insight badge)
famous-personalities — Notable people born in the district (born-in-district rule enforced)
```

### API SLUGS (CRITICAL — do not confuse):
```
Use:    /api/data/leaders       NOT /api/data/leadership
Use:    /api/data/budget        NOT /api/data/finance
Use:    /api/data/crops         (correct)
Use:    /api/data/water         (correct)
Use:    /api/data/overview      (correct)
Use:    /api/data/weather       (correct)
Use:    /api/data/police        (correct)
Use:    /api/data/news          (correct)
Use:    /api/data/population    (correct)
Use:    /api/data/exams         (correct — new, Phase 5)
Use:    /api/data/population/profile   (new — DemographicProfile for one district,
                                        defaults to dataset="Census 2011" with
                                        economicClass overlay from latest NITI MPI)
Use:    /api/data/population/state     (new — state rollup + all districts array
                                        for choropleth, includes inactive)
Use:    /api/data/population           (existing — now returns {data, profile, meta},
                                        backward-compatible, data field unchanged)
Admin:  /api/admin/population-audit    (new — summary stats + 31×14 completeness grid)
```

### Navigation
- Desktop: Sidebar with pinned modules + "Show all" toggle + emoji per module
- Mobile: Left hamburger → slide-in drawer (all 30 modules in 6 categories)
- Mobile bottom: MobileTabNav tab strip
- Breadcrumb: overflow:visible on desktop nav (not hidden — or dropdowns get clipped)
- Mobile breadcrumb strip: sticky top:56px
- Sidebar overflow:visible required (never set to hidden/overflow-x-hidden on nav)

---

## 7. INTERACTIVE MAP (FRAGILE)

### History of Map Implementation (3 attempts)
```
Attempt 1: D3.js + custom SVG — abandoned (complex, GeoJSON winding bugs, world-spanning fills)
Attempt 2: Leaflet.js + react-leaflet — abandoned (SSR issues, complex setup for India map)
Attempt 3: react-simple-maps — FINAL (works, simpler API, easier India state highlighting)
```

### Current Implementation
- Library: `react-simple-maps` + `topojson-client`
- India SVG map: portrait viewBox 800×900, scale=900, center=[82.5,23]
  - J&K at approximately y=175, south tip at approximately y=696 — fits all of India
- GeoJSON: exterior rings MUST be CW (clockwise winding)
  - Despite RFC7946 claiming CCW, d3-geo in practice needs CW for correct exterior rings
  - Zero-area rings (< 1e-10 by shoelace area) cause world-spanning fills — always remove them
- MapErrorBoundary component wraps all map renders
- Cache bust: GeoJSON served with `?v=4` query
- GeoJSON Cache-Control: 24h in response headers
- Taluk map: `TalukMap.tsx` + `public/geo/mandya-taluks.json` (approximate polygons)

### Rules (CRITICAL — never violate)
```
NEVER modify map components unless you have verified the fix in the browser.
NEVER change viewBox dimensions without testing all 36 states render correctly.
Use Playwright to inspect SVG DOM when debugging — check path `d` attribute for extreme
  coords (x > 900 or x < -100 means world-spanning bug).
Use getBoundingClientRect per path to debug individual state renders.
```

---

## 8. DATABASE SCHEMA (45+ PRISMA MODELS)

### Prisma 7 Configuration
```
Generator:  provider = "prisma-client-js", output = "../src/generated/prisma"
Imports:    from '@/generated/prisma'
Config:     prisma.config.ts at project root
            import "dotenv/config"
            defineConfig({ datasource: { url: process.env.DATABASE_URL! } })
Adapter:    new PrismaPg({ connectionString }) from @prisma/adapter-pg
            PrismaPg v7 takes pg.PoolConfig as first arg: new PrismaPg({ connectionString })
CRITICAL:   NO `url` field in datasource block of schema.prisma (Prisma 7 uses config file)
```

### Core Hierarchy
```
State       — id, name, nameLocal, slug, active, capital
District    — id, stateId(FK), name, nameLocal, slug, tagline, active, population, area,
              talukCount, villageCount, literacy, sexRatio, density, avgRainfall
              + 40 relation arrays
Taluk       — id, districtId(FK), name, nameLocal, slug, population, area, villageCount
Village     — id, talukId(FK), name, nameLocal, slug, population, households, pincode, lat, lng
```

### Data Models (per district)
```
Leader              — tier(1-10), name, role, party, constituency, phone, email, since, photoUrl
InfraProject        — name, category, budget, fundsReleased, progressPct, status, contractor, dates
BudgetEntry         — fiscalYear, sector, allocated, released, spent (values in RUPEES not Crores)
BudgetAllocation    — fiscalYear, department, scheme, category, allocated, released, spent, lapsed
RevenueEntry        — monthly revenue by category
RevenueCollection   — aggregated revenue records
CropPrice           — commodity, variety, market, minPrice, maxPrice, modalPrice, arrivalQty, date
WeatherReading      — temp, feelsLike, humidity, windSpeed, conditions, rainfall, pressure
RainfallHistory     — year, month, rainfall, normal, departure
PopulationHistory   — year, total, rural, urban, literacy, sexRatio, density
DemographicProfile  — id, districtId?/stateId?, level (STATE/DISTRICT/SUBDISTRICT/
                      WARD), year, dataset ("Census 2011" | "NFHS-5" | "NITI MPI
                      2023" | "NITI MPI 2021 Baseline" | "NITI MPI 2023 Rural" |
                      "NITI MPI 2023 Urban"). Totals: totalPopulation, male/female,
                      sexRatio, childSexRatio, age bands, literacy M/F/total, urban/
                      rural split, density, households. JSONB blocks (nullable):
                      religion (alphabetical 8 keys), caste (SC/ST/Other),
                      employment, economicClass (MPI H/A/MPI/rank), education,
                      migration, disability, language (top-10 mother tongue),
                      householdAmenities, maritalStatus. Source chain: sourceName,
                      sourceUrl, sourceLicense, retrievedAt, publishedAt,
                      boundaryVintage. @@unique([districtId, year, dataset]).
DemographicUpdate   — per-district demographic news/update log. Scoped via index
                      on (districtId, publishedAt) and (stateId, publishedAt).
                      Updates for one district never appear on another's page.
PoliceStation       — name, type, sho, phone, address, lat, lng, jurisdiction
TrafficCollection   — month, revenue, vehicles, fines
CrimeStat           — year, category, cases, solved
Scheme              — name, category, department, beneficiaries, budget, status
ServiceGuide        — service, steps, duration, fee, documents, department
GramPanchayat       — name, taluk, population, mgnregaDemand, mgnregaWorkDays, fundsReceived
RtiStat             — year, totalFiled, totalPending, avgResponseDays, departmentWise
CourtStat           — year, totalPending, totalDisposed, civilPending, criminalPending
NewsItem            — title(NOT headline), summary, url, source, category, publishedAt, aiAnalyzed
DamReading          — dam name, storageLevel, fullCapacity, inflow, outflow, rainfall
CanalRelease        — canal name, releaseDate, flowRate, reason, duration
SugarFactory        — name, capacity, crushingSeasonStart/End, cane crushed, recovery%
LocalAlert          — title, type, severity, message, active, createdAt (auto-expires >14 days)
GovOffice           — name, type, address, phone, hours, openNow, lat, lng
ElectionResult      — constituency, year, type, winnerName, winnerParty, winnerVotes, margin
                      (IMPORTANT: winner-per-constituency model, NOT per-candidate)
PollingBooth        — boothId, name, address, totalVoters, maleFemaleRatio
BusRoute / TrainSchedule — transport schedules
JJMStatus           — taluk, habitationsTotal, covered, coveragePct
HousingScheme       — scheme, category, sanctioned, completed, underConstruction
PowerOutage         — area, reason, startTime, endTime, duration, active
School / SchoolResult — UDISE data, student/teacher counts, board results
SoilHealth / AgriAdvisory — soil pH/NPK, weekly crop advisories
RtiTemplate         — topic, department, PIO address, fee, template text
FamousPersonality   — name, category, bio, photoUrl, birthYear, bornInDistrict
                      (bornInDistrict MUST be true for district's page — see Section 27)
Feedback            — type, module, subject, message, email, status, adminNote
AdminAlert          — level(critical/warning/info), title, message, details(Json),
                      module, district, read, emailed, createdAt
MarketData          — SENSEX, NIFTY, GOLD, SILVER, USD_INR, CRUDE prices
```

### AI & Intelligence Models
```
AIModuleInsight     — districtId, module (30 modules × district), headline, body, confidence,
                      aiProvider, aiModel, expiresAt, generatedAt (TTL-based, pre-computed)
AIInsight           — districtId, module, headline, summary, sentiment, confidence,
                      sourceUrls, approved (news-driven insights)
ReviewQueue         — insightId, status(pending/approved/rejected), reviewerNote
NewsIntelligenceLog — phase, status, tokensUsed, durationMs, aiProvider, aiModel
SharedAIInsight     — scope, scopeId, module, insight, variables, expiresAt
FactCheckStatus     — districtId, module, status, totalItems, issuesFound, staleItems,
                      duplicates, results(Json), aiProvider, durationMs
NewsActionQueue     — articleId, action, extractedData, confidence, status, executedAt

### Exams & Staffing (Phase 5 — March 2026)
```
GovernmentExam      — level(state|district), stateId, districtId, title, department,
                      vacancies, qualification, ageLimit, applicationFee, selectionProcess,
                      payScale, applyUrl, notificationUrl, syllabusUrl, status(upcoming|open|closed|results),
                      announcedDate, startDate, endDate, admitCardDate, examDate, resultDate
                      @@index([stateId,status]), @@index([districtId,status])

DepartmentStaffing  — districtId, module(health|police|schools), department, roleName,
                      sanctionedPosts, workingStrength, vacantPosts, asOfDate, sourceUrl
                      @@index([districtId,module])
```

### Health Score & Feature Voting
```
DistrictHealthScore — districtId, totalScore, grade, breakdown(Json) with 10 categories:
                      governance(15%), education(12%), health(12%), infrastructure(12%),
                      waterSanitation(10%), economy(10%), safety(10%), agriculture(8%),
                      digitalAccess(5%), citizenWelfare(6%) = 100%
                      Grades: A+(≥90) A(≥80) B+(≥70) B(≥60) C+(≥50) C(≥40) D(≥30) F(<30)
                      Current scores: Mandya 59/100 (C+), Mysuru 52.8 (C+), BLR Urban 55.4 (C+)

FeatureRequest      — title, description, votes, status(pending/planned/shipped), category
FeatureVote         — featureId, fingerprint(SHA-256(IP+UA).slice(0,32))
                      @@unique([featureId, fingerprint]) prevents double-voting
```

### Payments
```
Contribution        — razorpayOrderId, razorpayPaymentId, name, email, amount(paise), tier, status
Supporter           — name, email, phone, amount(₹), tier, paymentId, method, razorpayData
```

### System & Admin
```
ScraperLog          — jobName, status, recordsNew, recordsUpdated, duration, error
DataRefresh         — endpoint, lastRefreshed, nextRefresh, status
DistrictRequest     — stateName, districtName, requestCount, @@unique([stateName, districtName])
AdminAPIKey         — provider(gemini/anthropic/anthropic_official/razorpay_*), encryptedKey(AES-256), isActive
AIProviderSettings  — singleton: activeProvider, geminiModel, anthropicModel, anthropicBaseUrl,
                      anthropicSource, fallbackEnabled, totalCalls
AdminAuth           — singleton: totpSecret(encrypted), totpEnabled, totpVerifiedAt,
                      recoveryEmail, recoveryPhone, backupCodes(encrypted JSON),
                      lastLoginAt, failedAttempts, lockedUntil
```

---

## 9. 4 AI ENGINES

All AI calls go through `src/lib/ai-provider.ts` → `callAI()` and `callAIJSON()` unified gateway.
NEVER call Anthropic or Gemini APIs directly — always use callAI().

### ZERO-CREDIT RULE (CRITICAL — Backend Only)
Public API routes (`/api/ai/insight`, `/api/ai/citizen-tips`) are **READ-ONLY**.
They serve ONLY from Redis cache or DB — never call `callAI()` on public GET requests.
Returning null/empty instead of generating live AI prevents unauthorized billing.
- Cron routes (`/api/cron/generate-insights`) are protected by `x-cron-secret: CRON_SECRET`
- Admin routes require `ftp_admin_v1` cookie
- Direct AI key access is NEVER exposed to the client

### Provider Architecture
```
1. OpusCode.pro (Anthropic proxy)
   activeProvider = "anthropic", anthropicSource = "opuscode"
   Key stored: provider = "anthropic" in AdminAPIKey
   Base URL: process.env.ANTHROPIC_BASE_URL || settings.anthropicBaseUrl
   Auto-detection: if ANTHROPIC_BASE_URL contains "opuscode" → forces anthropicSource=opuscode

2. Official Anthropic
   activeProvider = "anthropic", anthropicSource = "official"
   Key stored: provider = "anthropic_official" in AdminAPIKey
   Base URL: "https://api.anthropic.com"

3. Google Gemini
   activeProvider = "gemini"
   Key stored: provider = "gemini" in AdminAPIKey
   Default model: gemini-2.5-flash
```

### Key Resolution Priority
1. DB-stored encrypted key (AdminAPIKey where provider = keyName, isActive = true)
2. Env var fallback: ANTHROPIC_API_KEY or GEMINI_API_KEY
3. Returns null → AI call fails gracefully

### Base URL Priority (CRITICAL)
```typescript
process.env.ANTHROPIC_BASE_URL || settings.anthropicBaseUrl || "https://api.anthropic.com"
// Env var MUST take priority over DB default — always
```

### Models
```
Gemini:     gemini-2.5-flash (default), gemini-2.0-flash, gemini-1.5-pro
Anthropic:  claude-opus-4-6 (default), claude-sonnet-4-6, claude-haiku-4-5-20251001
```

### Response Parsing (CRITICAL)
```typescript
// CORRECT: find the text block — do NOT assume content[0] is text
const textBlock = response.content.find(b => b.type === 'text');
// Extended thinking: maxTokens MUST be >= 2048
// Extended thinking may add thinking blocks BEFORE the text block — always use .find()
```

### Engine 1: News Intelligence Pipeline
- Location: `src/scraper/jobs/news.ts` → `src/scraper/jobs/ai-analyzer.ts`
- Flow: RSS scraping → Gemini/Opus classification → targetModule + extractedData stored in NewsItem
- Schedule: Every 1 hour (news), analysis in ai-analyzer.ts
- Stores results as AIInsight records, then queues for admin review

### Engine 2: News Action Engine
- Location: `src/lib/news-action-engine.ts`
- Functions: `classifyArticleWithAI()` extracts structured data from news
- `executeNewsAction()` auto-executes DB mutations at confidence > 0.85
- Queues for human review at confidence 0.60–0.85
- Skips (discards) at confidence < 0.60
- Stores pending actions in `NewsActionQueue` model

### Engine 3: Pre-computed AI Module Insights
- Location: `src/lib/insight-generator.ts`
- Generates insights for 30 modules × all active districts
- Stored in `AIModuleInsight` with TTL/expiry field
- Generated every 2 hours by Vercel cron (`/api/cron/generate-insights`)
- On request: Redis → DB (check expiry) → generate fresh if expired
- Shown as `AIInsightCard` on 11 module pages
- Footer shows: "Source-verified by Claude/Gemini AI" with actual provider+model

### Engine 4: Opus Fact Checker
- Location: `src/lib/fact-checker.ts`
- Runs 25+ module-level checks
- Born-in-district rule: famous personalities must be born in the specific district
- Saves results to `FactCheckStatus` table with per-module breakdown
- Admin-accessible via Dashboard tab → FactChecker component
- POST `/api/admin/fact-check` — runs checks, returns issuesFound, staleItems, duplicates

---

## 10. DISTRICT HEALTH SCORE

### Algorithm (`src/lib/health-score.ts`)
```
10 Categories with BASE weights (total = 100%):
  governance       15%  — infrastructure + budget utilization + leadership
  education        12%  — school results + student-teacher ratio + coverage
  health           12%  — hospital beds + doctor ratio + coverage
  infrastructure   12%  — project completion + road density
  waterSanitation  10%  — dam levels + JJM coverage + water supply
  economy          10%  — crop prices + industries + employment
  safety           10%  — crime rate + police coverage
  agriculture       8%  — crop diversity + soil health + advisory
  digitalAccess     5%  — internet/mobile penetration
  citizenWelfare    6%  — scheme enrollment + RTI usage

District-type aware weights (getAdjustedWeights):
  metro   (pop>5M)       — boosts infrastructure+digitalAccess, reduces agriculture
  urban   (pop>1M)       — uses base weights
  semi-urban (density>500) — uses base weights
  rural   (default)      — boosts agriculture+waterSanitation, reduces infrastructure+digitalAccess

Precision:
  Category scores: 1 decimal (e.g. 72.4)
  Overall score:   2 decimal (e.g. 68.37)

Grade thresholds:
  A+ = score >= 90  |  A = score >= 80  |  B+ = score >= 70
  B  = score >= 60  |  C+ = score >= 50 |  C  = score >= 40
  D  = score >= 30  |  F  = score < 30

Breakdown includes: districtType, trendChange, trendDetails (per-category change >0.5 points)

Pre-computed: Weekly by cron, stored in DistrictHealthScore table.
Shown on: Homepage district cards, District overview page header.
```

### Current Pilot Scores
```
Mandya:          59.0 / 100  (C+)
Mysuru:          52.8 / 100  (C+)
Bengaluru Urban: 55.4 / 100  (C+)
Delhi (New Delhi): [pending — run health score calculation after testing]
```

---

## 11. FEATURE VOTING

### Architecture
- 23 feature requests seeded via `prisma/seed-features.ts`
- Models: `FeatureRequest` (title, description, votes, status, category) + `FeatureVote`
- Fingerprint: SHA-256(IP + User-Agent).slice(0, 32) — anonymous but unique per device
- Anti-double-vote: `@@unique([featureId, fingerprint])` constraint on FeatureVote
- Vote transaction: atomic `create` vote + `increment` count (prevents race condition)
- Page: `src/app/[locale]/features/page.tsx`

### Feature Categories
- data_modules, scrapers, ui_ux, community, technical, ai_features

### Status Values
- pending → planned → shipped

---

## 12. HOMEPAGE

### Components
```
Header.tsx          — Logo (🗣️ ForThePeople.in), navigation, district selector
MarketTicker.tsx    — 40px ticker bar: SENSEX, NIFTY, Gold, Silver, Crude, USD/INR
                      5-min refresh during market hours (IST 9:15–15:30 Mon–Fri)
                      30-min refresh off-hours. Mobile: CSS scroll animation.
HomeDrilldown.tsx   — Unified scrollable homepage layout (same on desktop + mobile)
                      Desktop: 2-col grid (60% map + 40% districts), Mobile: stacked
                      Sections: Stats → Map + Districts → Live Data → How It Works → Request → Support
LiveDataPreview.tsx — Horizontally scrollable district preview cards
HomepageStats.tsx   — Animated counters (useCountUp hook): districts, modules, data points
HowItWorks.tsx      — 3-column explainer section
DistrictRequestSection.tsx — State/district dropdowns for requesting new districts
ContributorWall.tsx — Compact supporter wall (isPublic=true contributions)
FeatureVoteWidget.tsx — Top-voted feature requests widget
```

### District Cards (on homepage)
- Show DistrictHealthScore grade (A+, A, B+, B, C+, C, D, F)
- Live weather, dam storage, crop price snippets per district
- All active districts across all states (not just Karnataka)
- Link to `/en/[state]/[district]` using dynamic state slug

### Stats Bar
- Active districts: 10 (Mandya, Bengaluru Urban, Mysuru, Chennai, Mumbai, Kolkata, New Delhi, Hyderabad, Lucknow)
- Data modules: 29
- Records in DB: ~50,000+
- Contributor count from Contribution table

---

## 13. SCRAPER ARCHITECTURE

### Infrastructure
```
Container: Railway.app (Dockerfile.scraper) — runs 24/7 always-on
Scheduler: src/scraper/scheduler.ts — node-cron
Jobs dir:  src/scraper/jobs/*.ts (21 scrapers)
Logger:    src/scraper/logger.ts → ScraperLog DB table
Redis:     ioredis (NOT @upstash/redis) for Railway container
Districts: getActiveDistricts() queries prisma.district.findMany({ where: { active: true } })
           All scrapers are DB-driven — no hardcoded district arrays
```

### Dockerfile.scraper
```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm install --legacy-peer-deps   # npm ci FAILS due to peer dep conflicts
COPY . .
RUN npx prisma generate
ENV NODE_ENV=production
CMD ["npx", "tsx", "src/scraper/scheduler.ts"]
```

### Scraper Schedule
```
Every 5 min:   weather.ts       — OpenWeatherMap API (uses ctx.districtName, OWM_CITY_OVERRIDE)
Every 15 min:  crops.ts         — AGMARKNET via DATA_GOV_API_KEY (AGMARKNET_DISTRICT_OVERRIDE)
               power.ts         — BESCOM power outages
Every 30 min:  dams.ts          — KRS dam levels
Every 1 h:     news.ts          — RSS feeds (3 queries per district, 50 item limit, URL dedup)
Every 2 h:     alerts.ts        — Local alerts aggregation
               insights.ts      — Pre-compute AI module insights (generate-insights cron)
Every 6 h:     police.ts        — Police data
Every 12 h:    infrastructure.ts — Project status
               exams.ts          — Govt exam notifications + staffing (Phase 5, March 2026)
Daily:         rti.ts           — RTI statistics
               courts.ts        — Court pendency
               mgnrega.ts       — MGNREGA NREGS portal
Weekly:        jjm.ts           — Jal Jeevan Mission
               housing.ts       — PMAY housing
               schools.ts       — UDISE school data
Monthly:       finance.ts       — Budget/revenue
               transport.ts     — KSRTC/railway schedules
               schemes.ts       — Central/state schemes
               soil.ts          — Soil health cards (KVK)
               elections.ts     — Election commission data
               ai-analyzer.ts   — AI news intelligence pipeline + NewsAction execution
```

### JobContext (scraper/types.ts)
```typescript
interface JobContext {
  districtId: string;
  districtSlug: string;
  districtName: string;  // Added for scalability — used by weather, crops
  stateName: string;     // Added for scalability — used by crops AGMARKNET
  stateSlug: string;
}
```

### Vercel Cron Jobs (in vercel.json)
```
/api/cron/scrape-news       — daily 6AM UTC    (news scrape + dedup + expire stale)
/api/cron/scrape-crops      — daily 3:30AM UTC (9AM IST — AGMARKNET crop prices all active districts)
/api/cron/generate-insights — every 2h         (pre-compute AI insights 30 modules × all districts)
```
Authentication: `Authorization: Bearer CRON_SECRET` header.
CRITICAL: CRON_SECRET must ONLY be read from the Authorization header — never from query params
(query params appear in server logs and browser history — security vulnerability).

---

## 14. SCRAPING SOURCES

```
Weather:       OpenWeatherMap API (OPENWEATHER_API_KEY)
Crop Prices:   data.gov.in AGMARKNET API (DATA_GOV_API_KEY)
Dam Levels:    Karnataka State Natural Disaster Monitoring Centre (KRS dam data)
News:          Google News RSS / The Hindu / Deccan Herald (cheerio HTML parsing)
MGNREGA:       nregs.nic.in (public portal scrape)
RTI Stats:     rtionline.gov.in / CIC portal
Court Stats:   eCourts portal (eCourts.gov.in)
BESCOM:        bescom.org power outage data
UDISE:         udiseplus.gov.in school data
Jal Jeevan:   ejalshakti.gov.in / JJM dashboard
Housing:       rhreporting.nic.in (PMAY data)
Transport:     KSRTC website + IRCTC train data
Elections:     Karnatak State Election Commission portal
Market Data:   Yahoo Finance v8 API (no key) + open.er-api.com (forex)
```

### Scraping Rules
- Maximum 1 request per 2-3 seconds per domain
- URL dedup in news scraper: keep newest, delete duplicate titles
- Auto-expire LocalAlert records > 14 days old (active: false)
- AI news intelligence: runs post-news-scrape to classify and generate insights

---

## 15. API DESIGN

### Module Data API
```
GET /api/data/[module]?district=mandya&state=karnataka

Caching strategy:
  Layer 1: @upstash/redis (Redis cache) with per-module TTL
  Layer 2: Prisma query to Neon PostgreSQL

Module TTLs (from src/lib/cache.ts):
  weather:      5 minutes
  crops:        15 minutes
  water/dams:   30 minutes
  news:         60 minutes
  All others:   5 minutes default

Response includes:
  data: { ...moduleData }
  meta: { lastUpdated: timestamp, source: string }
```

### Cache Keys
```typescript
// Format: ftp:{module}:{districtSlug}
cacheKey('weather', 'mandya') → "ftp:weather:mandya"
```

### ISR (Incremental Static Regeneration)
- District page: `export const revalidate = 300` (5 minutes)
- GeoJSON files: Cache-Control: public, max-age=86400 (24 hours)
- API responses: Cache-Control: public, s-maxage=300 (5 minutes)

### Full API Reference
```
DATA:
GET  /api/data/[module]            — 30-module district data with Redis cache
GET  /api/data/village             — Village data
GET  /api/data/homepage-stats      — District counts, contributor count, data stats
GET  /api/data/homepage-preview    — Live weather/dam/crop/news snippets per district
GET  /api/data/market-ticker       — SENSEX/NIFTY/Gold/Silver/Crude/USD market data
GET  /api/data/ai-insight          — AI insight for a specific module
GET  /api/insights                 — AI insights list
GET  /api/data/health-score        — District health score with breakdown

AI:
POST /api/ai/insight               — Generate/fetch AI insight for module
POST /api/ai/citizen-tips          — Generate district-specific citizen tips

PUBLIC:
GET  /api/public/district/[district] — AI-readable district summary (structured paragraphs)

ADMIN:
GET/PUT  /api/admin/ai-settings        — AI provider settings
POST/DEL /api/admin/api-keys           — Manage encrypted API keys
GET      /api/admin/scraper-logs       — Scraper job history
GET      /api/admin/payments           — All contributions (admin-gated)
GET/PATC /api/admin/supporters         — Supporters management
POST     /api/admin/sync-razorpay      — Sync last 100 payments from Razorpay API
POST     /api/admin/fact-check         — Run AI fact check (7 modules)
GET      /api/admin/fact-check         — Fact check history (last 20 runs)
POST     /api/admin/verify-data        — AI data quality verification (returns graceful 200 on AI fail)
GET      /api/admin/expire-stale       — Preview stale alerts
POST     /api/admin/expire-stale       — Expire stale alerts older than N days
POST     /api/admin/deduplicate-news   — Deduplicate news by title prefix
GET/PATC /api/admin/security           — Auth info / recovery contact update
POST     /api/admin/security/logout-all — Invalidate all sessions
POST     /api/admin/2fa/setup          — Generate TOTP secret + QR code
POST     /api/admin/2fa/verify         — Enable 2FA
POST     /api/admin/2fa/disable        — Disable 2FA
POST     /api/admin/2fa/recover        — Send recovery email via Resend
POST     /api/admin/2fa/recover/verify — Verify recovery token
GET/PATC /api/admin/review             — AI insight review queue
GET/PATC /api/admin/feedback           — Feedback management
POST     /api/admin/ai-test            — Test AI provider connection
GET      /api/admin/districts          — Active districts from DB (for admin dropdowns)

PAYMENT:
POST /api/payment/create-order     — Create Razorpay order
POST /api/payment/verify           — Verify payment signature (HMAC-SHA256 + timingSafeEqual)
GET  /api/payment/contributors     — Public contributors list (isPublic=true)
POST /api/webhooks/razorpay        — Razorpay webhook handler (timingSafeEqual sig verify)

UTILITY:
GET  /api/health                   — Health check (DB, Redis, AI provider, alert counts)
POST /api/feedback                 — Submit user feedback
POST /api/district-request         — Vote to request new district
POST /api/cron/scrape-news         — Cron: daily news scrape + dedup + expire stale
GET  /api/cron/scrape-crops        — Cron: daily 3:30AM UTC crop prices (AGMARKNET all districts)
POST /api/cron/generate-insights   — Cron: pre-compute AI insights (every 2h)
```

---

## 16. ADMIN PANEL

URL: `forthepeople.in/en/admin`

### Navigation (April 2026 overhaul)
Unified left sidebar (`src/components/admin/AdminSidebar.tsx`) replaces the old
two-layer nav (top bar + sub-tab row). All admin routes share the sidebar via
`admin/layout.tsx`. Active item is derived from `pathname + ?tab=` query param.
Mobile (<1024px): hamburger button → slide-in overlay. Unread badges fetched
from `/api/admin/nav-counts` (alerts, review queue, feedback).

### 10 Tabs (grouped)
```
OVERVIEW
 1. Dashboard         — Action Required banner, Platform Health (DB/Redis/Scrapers),
                        Revenue summary, AI Provider (OpenRouter live spend),
                        Recent Activity feed with filters
OPERATIONS
 2. System Health     — DB/Redis/Server status, Data Freshness per district with
                        per-cell popover (last run, last error, Run Now button),
                        Scraper success % + filterable log table with expandable errors
 3. Alerts & Logs     — AdminAlert feed, severity colours, source badges (scraper /
                        feedback / payment / system), email status per alert,
                        filters (level / source / date / district / unread), CSV export
AI & DATA
 4. AI Settings       — 3-provider cards (OpusCode.pro, Official Anthropic, Gemini),
                        model select, fallback toggle, test connection
 5. Review Queue      — AI Insight approve/reject (AIModuleInsight / ReviewQueue)
FINANCE
 6. Revenue & Supporters — Contributions from Razorpay, manual sync, total/weekly totals
 7. Costs & Billing   — OpenRouter live credits (usage / limit / remaining / projected),
                        per-model estimated cost breakdown (free tier reported $0),
                        subscription table with editable renewal dates + countdown
ANALYTICS
 8. Analytics         — District requests, feature votes, feedback/revenue trends
SECURITY
 9. Access & 2FA      — 2FA setup, backup codes, recovery email, last login
COMMUNITY
10. Feedback          — User feedback feed, AI classification, inline reply
```

### URL / routing
```
/en/admin                     — default tab (dashboard)
/en/admin?tab=system-health   — in-page switch (SystemHealth, AlertsAndLogs,
/en/admin?tab=alerts            AnalyticsDashboard, CostsTab render under AdminClient)
/en/admin?tab=analytics
/en/admin?tab=costs
/en/admin/ai-settings         — full-route pages (separate Next.js routes)
/en/admin/review
/en/admin/supporters          — Revenue & Supporters
/en/admin/feedback
/en/admin/security            — Access & 2FA
```

### New API Routes (April 2026)
```
GET  /api/admin/nav-counts        — Unread badge counts for sidebar
GET  /api/admin/dashboard-summary — Roll-up powering the Dashboard (30s Redis cache)
GET  /api/admin/openrouter-usage  — Real credit spend from OpenRouter /auth/key (5min cache)
POST /api/admin/run-scraper       — Manual scraper trigger per district + job
                                    ({ district: slug, job: "weather"|"news"|"crops"|"insights" })
DELETE /api/admin/scraper-logs    — Purge ScraperLog entries older than N days
```

### AI Settings Page (`/admin/ai-settings`)
```
3 provider cards with single-select "Activate" button
Active card: colored border + "ACTIVE" badge
Expandable API key input per card (hidden by default)

Provider mapping:
  OpusCode.pro     → activeProvider="anthropic", anthropicSource="opuscode", key="anthropic"
  Official Anthropic → activeProvider="anthropic", anthropicSource="official", key="anthropic_official"
  Google Gemini    → activeProvider="gemini", key="gemini"

API routes: GET/PUT /api/admin/ai-settings, POST/DELETE /api/admin/api-keys
            GET /api/admin/system-health (DB/Redis status, data freshness, scrapers, pending items)
            GET/PATCH/DELETE /api/admin/alerts (AdminAlert CRUD with filters)
            GET /api/admin/analytics (district requests, feature votes, trends, totals)
```

### Fact Checker (`FactChecker.tsx`)
```
Runs: POST /api/admin/fact-check
Modules: leadership, budget, infrastructure, demographics, courts, news/alerts, all
Returns: totalItems, issuesFound, staleItems, duplicates, per-module results
Stored: FactCheckStatus table with durationMs, aiProvider, aiModel
GET returns last 20 checks
District selector: cascading State→District dropdown from /api/admin/districts
```

### Data Verifier
```
POST /api/admin/verify-data — AI QA of a specific module
Returns: issues[], suggestions[], confidence(0-100), status(ok/warning/error)
Graceful error: returns status:"error" NOT a 500 on AI failure
```

### Stale Data Management
```
GET  /api/admin/expire-stale    — preview stale alerts (shows count + oldest)
POST /api/admin/expire-stale    — expire alerts older than N days
POST /api/admin/deduplicate-news — dedup by normalized title prefix (keep newest)
POST /api/admin/cleanup-news    — comprehensive cleanup (x-admin-password header):
   1. Delete NewsItems older than 7 days
   2. Delete future-dated NewsItems (RSS parse errors)
   3. Delete duplicate articles by title prefix (keeps oldest per district+prefix)
   4. Delete auto-generated LocalAlerts older than 7 days
   5. Clear NewsActionQueue (pending + skipped items)
   6. Delete stale AIInsight records (module=alerts or createdAt >7 days)

GET /api/data/freshness?district=<slug> — traffic-light data freshness per module:
   Returns: { status: "green"|"amber"|"red"|"unknown", age, lastUpdated } per module
   Expected intervals: weather=10min, dam=60min, news/alerts/insights=120min, crops=1440min
```

### News Pipeline Quality Gates
```
isArticleFresh(): Reject if >3 days old, future-dated, or year < current-1
  - Google News RSS returns by relevance not recency; old articles silently reappear

isTitleDuplicate(): Normalize → first 5 words (len>3) → in-memory Set + DB lookup
  - Google News uses different redirect URLs for the same article (URL dedup alone insufficient)

classifyArticleWithAI(publishedAt): Injects article age into AI prompt
  - CRITICAL DATE RULE: events >2 days old → module=news, confidence ≤ 0.4, no alerts
```

---

## 17. SECURITY

### Admin Authentication
```
Cookie: ftp_admin_v1 = "ok" (HttpOnly, set by /admin login)
Password: ADMIN_PASSWORD env var (verified using timingSafeEqual — constant-time compare)
All admin API routes check isAuthed() which reads cookie
Alternative: x-admin-secret header (for direct API calls)
```

### 2FA (Google Authenticator TOTP)
```
Library: otpauth + qrcode
Secret: stored AES-256-CBC encrypted in AdminAuth.totpSecret
Setup: /api/admin/2fa/setup → scan QR → /api/admin/2fa/verify
Disable: /api/admin/2fa/disable
Recovery: /api/admin/2fa/recover → Resend email → /api/admin/2fa/recover/verify
Backup codes: 8 codes, stored encrypted JSON in AdminAuth.backupCodes
Rate limiting: failedAttempts counter, lockedUntil timestamp in AdminAuth
```

### Encryption (`src/lib/encryption.ts`)
```
Algorithm: AES-256-CBC
Key: ENCRYPTION_SECRET env var (32+ char random string)
Used for: AdminAPIKey.encryptedKey, AdminAuth.totpSecret, AdminAuth.backupCodes
Format: encrypt(plaintext) → "iv:ciphertext" (base64 encoded)
```

### Payment Security
```
Razorpay signature: HMAC-SHA256(orderId + "|" + paymentId, RAZORPAY_KEY_SECRET)
Comparison: timingSafeEqual (prevents timing attacks)
Webhook: same HMAC-SHA256 with RAZORPAY_WEBHOOK_SECRET
```

### NEXT_PUBLIC Rules
```
ONLY these two keys may be NEXT_PUBLIC:
  NEXT_PUBLIC_SITE_URL         — https://forthepeople.in
  NEXT_PUBLIC_RAZORPAY_KEY_ID  — Razorpay key ID (needed for client-side checkout)
No other secrets in NEXT_PUBLIC — they ship to the browser
```

### Cron Authentication
```
Header: Authorization: Bearer CRON_SECRET
Env var: CRON_SECRET (set in Vercel dashboard)
Applies to: /api/cron/scrape-news, /api/cron/scrape-crops, /api/cron/generate-insights, /api/cron/news-intelligence
```
SECURITY RULE: Read CRON_SECRET from Authorization header ONLY.
Never accept it as a URL query param — URL params appear in server access logs and browser history.

### Rate Limiting
```
Library: src/lib/rate-limit.ts (Upstash Redis incr + expire)
Usage: await rateLimit(identifier, limit=60, window=60)
Fallback: if Redis unavailable, gracefully allows all requests (no crash)
Apply to: public API routes that could be abused
```

---

## 17B. CREATOR WATERMARKING

Deep watermarking to prove original authorship. Removing all marks requires touching 100+ files.

### Layers
```
1. Source code headers (219 source files):
   /**
    * ForThePeople.in — Your District. Your Data. Your Right.
    * © 2026 Jayanth M B. MIT License with Attribution.
    * https://github.com/jayanthmb14/forthepeople
    */

2. HTML <head> meta tags (src/app/layout.tsx metadata.other):
   original-author, project-inception, x-created-by, x-project-id, x-repository

3. JSON-LD WebApplication schema (layout.tsx):
   "@type": "WebApplication", "author": { "name": "Jayanth M B" }, "dateCreated": "2026-03-17"

4. HTTP Response headers (src/middleware.ts — every response):
   X-Powered-By: ForThePeople.in
   X-Creator: Jayanth M B
   X-Project-ID: FTP-JMB-2026-IN
   X-License: MIT with Attribution — github.com/jayanthmb14/forthepeople

5. package.json: author, repository, homepage, keywords, description

6. LICENSE file: MIT with Attribution (requires keeping original creator attribution)

7. public/humans.txt: Creator attribution for humans.txt standard

8. watermark.ts: CREATOR constant exported with projectId, inception date
```

### Watermark Utility (`src/lib/watermark.ts`)
```typescript
import { CREATOR, addWatermarkHeaders, getWatermarkMeta } from '@/lib/watermark';
// CREATOR.projectId = "FTP-JMB-2026-IN"
// CREATOR.inception = "2026-03-17"
// CREATOR.repository = "github.com/jayanthmb14/forthepeople"
```

### GitHub Repo
```
URL:     https://github.com/jayanthmb14/forthepeople (public after clean push)
History: Fresh single commit (no leaked secrets in history)
License: MIT with Attribution — requires creator credit in any fork
```

---

## 18. PERFORMANCE

### Lazy Loading
```typescript
// All heavy components use next/dynamic with ssr:false
const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false });
const RechartChart = dynamic(() => import('./ChartComponent'), { ssr: false });
```

### Redis Caching Strategy
```
@upstash/redis REST client (not TCP — works in Vercel serverless)
TTLs:
  weather:   300s (5 min)
  crops:     900s (15 min)
  dams:      1800s (30 min)
  news:      3600s (1 h)
  default:   300s (5 min)
  ai insights: 21600s (6 h)
```

### Static & ISR
```
Homepage: fully static (getStaticProps equivalent)
District page: ISR revalidate=300 (5 minutes)
Module pages: ISR revalidate=300
GeoJSON: static files with Cache-Control: public, max-age=86400 (24h)
Sitemap: auto-generated from active districts (DB-driven)
```

### Mobile Performance
- Target: works on ₹8000 Android phones on 4G
- Min tap target: 44×44px (enforced in mobile sidebar and dropdowns)
- No heavy animations — only 200ms fade-in
- Recharts charts lazy-loaded to avoid SSR bundle size

---

## 19. PAYMENTS (RAZORPAY LIVE)

```
Keys: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET (all in Vercel env)

4 Support Tiers on /en/support:
  Chai           (₹99)   — one-time
  Supporter      (₹499)  — one-time
  District Champion (₹1999) — one-time
  State Patron   (₹4999) — one-time

Payment Flow:
  1. POST /api/payment/create-order → creates Razorpay order, returns orderId
  2. Razorpay checkout modal on frontend (uses NEXT_PUBLIC_RAZORPAY_KEY_ID)
  3. POST /api/payment/verify → HMAC-SHA256 sig verify, save to Contribution table
  4. POST /api/webhooks/razorpay → webhook backup (timingSafeEqual sig verify)
  5. GET  /api/payment/contributors → public contributor wall (isPublic=true only)

Admin Sync:
  POST /api/admin/sync-razorpay → fetch last 100 captured payments from Razorpay API
    - Skip captured=false payments
    - Dedup by paymentId
    - Upsert into Supporter table
    - After sync: SyncButton calls router.refresh() to update Server Component stats

Contributor Wall: shown on /support + compact version on homepage
```

---

## 19B. FINANCE SYSTEM (April 2026)

Three admin tabs under 💰 FINANCE, all backed by database queries — zero hardcoded values:

**Revenue & Supporters** (`/admin/supporters` — full route)
- Summary cards: total revenue, this month/week, supporter count, weekly trend %
- Monthly breakdown chart (last 12 months, revenue only)
- "Add Manual Supporter" modal: name, email, amount, tier, payment method, reference, date,
  sponsored district/state, social link, message, public toggle.
- Click any supporter row → inline edit modal (tier, district, state, message, public)
- Source badge: `MANUAL` pill on manually-added supporters vs Razorpay webhook rows
- Razorpay sync + CSV export (preserved from earlier iteration)
- Cache invalidation: `ftp:contributors:v1|all|leaderboard|district-rankings` are set to null with
  1s TTL on every manual add / edit so the public Wall refreshes immediately.

**Expenditure** (`/admin?tab=expenditure` — in-page tab)
- Summary cards: total expense, this month, net P&L (month), recurring monthly total
- Add/edit/delete expenses (modal): date, category, description, INR + USD amount with
  exchange rate snapshot, payment method, reference, invoice link, recurring interval, notes
- List view with category + recurring filter + search
- **P&L view** — monthly table comparing revenue vs expenses for last 12 months with Profit/Loss status
- CSV export of filtered rows
- **Invoice attachment: link-only for now.** `Expense.invoiceBlobUrl` reserved for future
  Vercel Blob upload — not wired (would need `@vercel/blob` + `BLOB_READ_WRITE_TOKEN`).

**Costs & Billing** (`/admin?tab=costs` — in-page tab)
- Top summary: Monthly Cost (INR + USD), Yearly Cost, Expiring Soon count
- OpenRouter live credit spend card (from Prompt 1)
- AI usage + per-model estimated cost
- Subscription table with: displayName, plan, account email, INR+USD cost, purchase date,
  expiry countdown (red <7d, yellow ≤30d, red if past due), inline renewal date edit

### Models (prisma/schema.prisma)

**Subscription** (extended from Prompt 1; `ServiceSubscription` merged in):
  id, name, displayName, serviceName @unique, provider, category, plan,
  costINR, costUSD, currency, costOriginal, exchangeRate,
  billingCycle, purchaseDate, expiryDate, renewalDate (legacy), status,
  autoRenew, accountEmail, apiKeyEnvVar, dashboardUrl, notes

**Expense** (new):
  id, date, category, description, amountINR, amountUSD, exchangeRate,
  paymentMethod, referenceNumber, invoiceUrl, invoiceBlobUrl,
  isRecurring, recurringInterval, notes, createdBy

**Supporter** (extended): + `source "razorpay"|"manual"`, `referenceNumber`

### API Routes

```
GET    /api/admin/expenses?category=&from=&to=&recurring=  — list
POST   /api/admin/expenses                                   — create
PATCH  /api/admin/expenses/[id]                              — update
DELETE /api/admin/expenses/[id]                              — delete

GET    /api/admin/subscriptions                              — list (existing)
POST   /api/admin/subscriptions                              — create (existing)
PATCH  /api/admin/subscriptions/[id]                         — update (new, REST-style)
DELETE /api/admin/subscriptions/[id]                         — hard delete (new)

POST   /api/admin/manual-supporter                           — create offline supporter +
                                                               invalidate contributor caches
PATCH  /api/admin/supporters/[id]                            — edit (tier/district/msg/public)

GET    /api/admin/finance-summary                            — combined revenue + expenses +
                                                               subscriptions (5min Redis cache)
```

### Seed

`prisma/seed-subscriptions.ts` — upserts 9 default services (OpenRouter, Upstash, Neon,
Domain, Resend, Vercel Pro, Plausible, Sentry, Razorpay) idempotently keyed on `serviceName`.
Run with: `npx tsx prisma/seed-subscriptions.ts`

---

## 20. ENVIRONMENT VARIABLES

### Required — Production (Vercel)
```
DATABASE_URL              — Neon PostgreSQL connection string
REDIS_URL                 — Upstash Redis REST URL
REDIS_TOKEN               — Upstash Redis REST token
GEMINI_API_KEY            — Google Gemini API key (fallback AI)
ANTHROPIC_API_KEY         — Anthropic/OpusCode API key (primary AI)
ANTHROPIC_BASE_URL        — OpusCode.pro proxy base URL (if using OpusCode)
ENCRYPTION_SECRET         — 32+ char random string for AES-256 encryption
ADMIN_PASSWORD            — Admin panel password (strong password required)
CRON_SECRET               — Bearer token for cron endpoint authentication
RAZORPAY_KEY_ID           — Razorpay live key ID
RAZORPAY_KEY_SECRET       — Razorpay live key secret (NEVER NEXT_PUBLIC)
RAZORPAY_WEBHOOK_SECRET   — Razorpay webhook signature secret
RESEND_API_KEY            — Resend email API key (for 2FA recovery emails + admin alerts)
ADMIN_EMAIL               — Admin email for alert notifications
NEXT_PUBLIC_PLAUSIBLE_DOMAIN — Plausible analytics domain (cookieless)
ADMIN_ALLOWED_IPS         — Comma-separated IPs for admin access (optional, empty = disabled)
NEXT_PUBLIC_SENTRY_DSN    — Sentry DSN for error tracking (client + server)
SENTRY_AUTH_TOKEN         — Sentry auth token (for source maps upload during build)
NEXT_PUBLIC_SITE_URL      — https://forthepeople.in
NEXT_PUBLIC_RAZORPAY_KEY_ID — Razorpay key ID (client-side checkout only)
DATA_GOV_API_KEY          — data.gov.in API key (AGMARKNET crop prices)
OPENWEATHER_API_KEY       — OpenWeatherMap API key (weather module)
ADMIN_RECOVERY_EMAIL      — Recovery email address (set in Vercel env vars)
ADMIN_RECOVERY_PHONE      — Recovery phone (set in Vercel env vars)
```

### Required — Railway (Scraper Container)
```
DATABASE_URL              — Same Neon PostgreSQL connection string
REDIS_URL                 — ioredis-format Redis URL (redis://... NOT upstash REST format)
GEMINI_API_KEY            — Google Gemini API key
ANTHROPIC_API_KEY         — Anthropic/OpusCode API key
ANTHROPIC_BASE_URL        — OpusCode proxy URL
ENCRYPTION_SECRET         — Same as Vercel (needed for DB-stored key decryption)
DATA_GOV_API_KEY          — AGMARKNET crops data
OPENWEATHER_API_KEY       — Weather data
```

### Local Dev (.env or .env.local)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:51214/template1?sslmode=disable
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
ANTHROPIC_BASE_URL=https://api.anthropic.com  (or OpusCode URL)
ENCRYPTION_SECRET=...  (any 32+ char string locally)
ADMIN_PASSWORD=...
```

NEVER commit .env, .env.local, .env.prod to git. Listed in .gitignore.

---

## 21. DEPLOYMENT

### Frontend — Vercel (CURRENT CORRECT METHOD)
```bash
git push origin main   # AUTO-DEPLOYS via GitHub integration
# NEVER use: npx vercel --prod (causes Vercel scope/account issues)
```
- Vercel account: zurvoapp Pro (scope: zurvoapps-projects)
- GitHub: jayanthmb14/forthepeople (private)
- Domain: forthepeople.in (Hostinger DNS → Vercel)
- Git email MUST be jayanthmbj@gmail.com:
  git config user.email "jayanthmbj@gmail.com"

### Scraper — Railway
```
Service: Docker container from Dockerfile.scraper
Runs: 24/7 always-on container
Connects: directly to Neon PostgreSQL
Auto-restarts on crash
Env vars: set in Railway dashboard
```

### Local Dev
```bash
# Terminal 1 — Start Prisma dev proxy (KEEP RUNNING)
cd forthepeople && npx prisma dev

# Terminal 2 — Start Next.js
npm run dev

# Access: http://localhost:3000/en/karnataka/mandya
```
- Prisma proxy: port 51213 (prisma+postgres://)
- Actual Postgres: port 51214 (direct postgresql://)
- DATABASE_URL must use template1 db with port 51214 locally

### Database Commands
```bash
npx prisma db push              # Apply schema changes (no migration files)
npx prisma generate             # Regenerate Prisma client
npx tsx prisma/seed.ts          # Re-seed Mandya data
npx tsx prisma/seed-hierarchy.ts  # Seed State→District→Taluk hierarchy
npx tsx prisma/seed-features.ts   # Seed 23 feature requests

# Force reset (DANGEROUS):
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="yes" npx prisma db push --force-reset
```

### Cron Configuration (vercel.json)
```json
{
  "crons": [
    { "path": "/api/cron/scrape-news",       "schedule": "0 6 * * *"   },
    { "path": "/api/cron/scrape-crops",      "schedule": "30 3 * * *"  },
    { "path": "/api/cron/generate-insights", "schedule": "0 */2 * * *" }
  ]
}
```

---

## 22. SCALING — HOW TO ADD A NEW DISTRICT

### Step-by-Step Checklist

#### Step 1: Add to Hierarchy Seeder
```bash
# Edit prisma/seed-hierarchy.ts — add new State (if new) + District + Taluks
# Run against production Neon DB:
npx tsx prisma/seed-hierarchy.ts
```

#### Step 2: Add to Static Constants
```typescript
// Edit src/lib/constants/districts.ts
// Add to INDIA_STATES array (used for static routing + compare page)
// District becomes available in all DB-driven APIs automatically
```

#### Step 3: Handle Name Overrides (if needed)
```typescript
// src/scraper/jobs/weather.ts — add to OWM_CITY_OVERRIDE if OpenWeatherMap
// uses a different name than the district slug
OWM_CITY_OVERRIDE['new-district-slug'] = 'City Name For OWM';

// src/scraper/jobs/crops.ts — add to AGMARKNET_DISTRICT_OVERRIDE if needed
AGMARKNET_DISTRICT_OVERRIDE['new-district-slug'] = 'AGMARKNET Name';
```

#### Step 4: Seed Initial Data
```bash
# Create a seed file: prisma/seed-newdistrict.ts
# Seed: leadership, budget, demographics, infrastructure projects
npx tsx prisma/seed-newdistrict.ts
```

#### Step 5: Activate the District
```sql
-- In Neon DB console or via prisma:
UPDATE "District" SET active = true WHERE slug = 'new-district-slug';
```

#### Step 6: Automatic — Nothing Else Needed
After `active: true`, the following work automatically:
- All 30 module API routes (DB-driven by districtSlug)
- Scraper jobs (queries active districts from DB)
- Admin dropdowns (FactChecker, VerifySection)
- Homepage preview cards
- Sitemap generation
- District health score calculation
- AI insight generation (next cron run)
- News intelligence pipeline

### Future Schema Enhancements (tracked in SCALING-CHECKLIST.md)
```
[ ] Add owmCityName field to District model (replace OWM_CITY_OVERRIDE dict)
[ ] Add agmarknetName field to District model (replace AGMARKNET_DISTRICT_OVERRIDE dict)
[ ] Full State→District cascading in admin panel (currently flat district list)
[ ] TalukSelector component on district overview page
```

### How to Add a New State
1. Add State + Districts + Taluks to `prisma/seed-hierarchy.ts` → run it
2. Add to `src/lib/constants/districts.ts` INDIA_STATES array
3. Add any regional font to `src/app/globals.css` @import (Noto Sans for the language)
4. Update OWM_CITY_OVERRIDE and AGMARKNET_DISTRICT_OVERRIDE as needed
5. Activate districts → everything else is automatic

---

## 23. KNOWN CONSTRAINTS

### Vercel Limits
```
Function timeout: 5 minutes max (AI calls must complete within this)
Hobby plan crons: 1 cron job per day (we use Pro which allows multiple)
Background jobs: NOT supported — use Railway for always-on scrapers
Serverless: no persistent TCP connections → must use @upstash/redis REST (not ioredis)
```

### Railway
```
Scraper container: always-on Docker container (node-cron scheduler)
Not Vercel-compatible: uses ioredis which needs persistent TCP
Railway free tier: may sleep after inactivity — use paid tier for production
```

### Neon PostgreSQL
```
Free tier: 0.5GB storage limit
Connection pooling: Neon handles pooling; use adapter-pg, not direct pool management
Scale tier: needed once >3 active districts with real-time scraping
```

### Upstash Redis
```
Free tier: 10,000 requests/day limit
Production: needs paid tier once daily cron runs × active districts exceed limit
REST API only (no TCP): compatible with Vercel serverless
```

### AI Calls
```
OpusCode proxy: higher rate limits than official Anthropic API
Extended thinking: maxTokens MUST be >= 2048 for thinking to work
Response parsing: ALWAYS use content.find(b => b.type === 'text') — never content[0]
Gemini free tier: sufficient for current load (3 districts)
Cost scales: linearly with active districts × modules × cron frequency
```

---

## 24. PROGRESS TRACKER

- **2026-04-21 · Population Module v2** — Major upgrade. Additive schema
  (`DemographicProfile`, `DemographicUpdate` models + `DemographicLevel` enum);
  zero breaking changes to existing `PopulationHistory`. 14 chart primitives
  (Recharts + Okabe-Ito palette) in `src/components/demographics/charts/`.
  7-section `DemographicDisclaimer` wrapper with stable legal IDs §3A-§3G.
  `DataSourceCard` per chart (source + licence + data-age chip). 3 API routes
  (`/api/data/population/profile`, `/api/data/population/state`, backward-
  compatible update to `/api/data/population`). Admin Population Audit tab at
  `/en/admin/population` with 31×14 completeness grid + CSV export. 98
  `DemographicProfile` rows seeded — Karnataka state (5 rows: Census 2011 + 4
  MPI variants), 30 Karnataka districts (Census 2011 baseline + NITI MPI 2023
  for 2019-21 and 2015-16), 3 active districts with NFHS-5 placeholder rows.
  Bengaluru Urban MPI = 0.007 (H=1.47%, A=45.68%, rank 3 of 30 in Karnataka —
  Ramanagara and Bengaluru Rural rank higher/better). Vijayanagara excluded
  from MPI (bifurcated from Ballari 2021, post-NFHS-5 fieldwork). NFHS-5
  district factsheets deferred to Phase 2 (original rchiips.org URLs dead
  after IIPS site reorganization; to be loaded via Harvard Dataverse CC-BY-4.0
  CSV mirror or manual nfhsiips.in guest-login). Zero new crons, zero new AI
  cost at runtime. 2 local commits (`6bc0225`, `28e0307`) not yet pushed —
  Group E docs commit pending.

```
Section 1:  Foundation           COMPLETE
  - Next.js 16 + TypeScript + Tailwind v4 setup
  - Design system (fonts, colors, tokens in globals.css)
  - District routing: /[locale]/[state]/[district]/[module]
  - Prisma 7 with PrismaPg adapter + Neon PostgreSQL

Section 2:  District Dashboard   COMPLETE (30 modules)
  - All 30 module pages built
  - Sidebar navigation with pinned modules + "Show all" + emoji
  - Mobile sidebar: left hamburger → slide-in drawer
  - MobileTabNav: bottom tab strip
  - AIInsightCard on 11 module pages

Section 3:  Interactive Map      COMPLETE
  - Full India SVG map (react-simple-maps, 800×900 portrait)
  - CW winding fix on GeoJSON exterior rings
  - Zero-area ring removal
  - MapErrorBoundary component
  - Mandya Taluk drill-down: TalukMap.tsx

Section 4:  Leadership           COMPLETE
  - 10-tier org chart for all Mandya officials
  - 2024 MP: Nikhil Kumaraswamy (JD(S))
  - 7 MLAs: INC 6, BJP 2, JD(S) 1

Section 5:  Finance & Budget     COMPLETE
  - Budget values stored in Rupees, display ÷1e7 → Crores
  - Full budget breakdown with lapsed funds tracker

Section 6:  Real-time Data       COMPLETE
  - Weather (5min), Crops (15min), Dams (30min) scrapers running

Section 7:  Citizen Features     COMPLETE
  - RTI Tracker + File RTI wizard
  - Gram Panchayat MGNREGA data
  - Citizen Corner + Responsibility page
  - Services Guide + Government Offices directory

Section 8:  Scrapers             COMPLETE (21 jobs)
  - All jobs running on Railway
  - ScraperLog written to DB after each job
  - All scrapers DB-driven (no hardcoded districts)

Section 9:  Admin Panel          COMPLETE
  - 9-tab admin dashboard (added System Health, Alerts & Logs, Analytics)
  - AI Settings: 3-provider cards, model selection, test
  - 2FA: Google Authenticator setup/disable/recovery
  - Fact Checker: AI verification across 7 modules
  - Data Verifier: AI QA per module
  - Review Queue: approve/reject AI insights
  - Feedback management + Payments tab

Section 10: Launch               COMPLETE
  - Support page with 4 Razorpay tiers
  - Contributor Wall (public + compact homepage)
  - Public API: /api/public/district/[district]
  - Health check endpoint
  - Feedback system (floating button + modal + DB)
  - Sitemap + robots.txt
  - NDSAP disclaimer on every page
  - README.md
  - Deployed at https://forthepeople.in

Post-launch: AI Intelligence     COMPLETE
  - 4 AI engines implemented
  - News Action Engine with confidence thresholds
  - Pre-computed insights (30 modules × all districts, every 2h)
  - Fact Checker with 25+ checks

Post-launch: Security (2FA)      COMPLETE
  - TOTP via otpauth, AES-256 encryption
  - 8 backup codes, recovery email via Resend

Post-launch: Payments            COMPLETE
  - Razorpay Live keys, webhook, sync
  - Contributor wall

Post-launch: Feedback            COMPLETE
  - FeedbackModal + floating button + admin management

Post-launch: Scale               COMPLETE
  - 9 pilot districts active (Karnataka: Mandya, Mysuru, Bengaluru Urban; Delhi: New Delhi;
    Maharashtra: Mumbai; West Bengal: Kolkata; Tamil Nadu: Chennai; Telangana: Hyderabad)
  - 10 additional Delhi districts ready to activate
  - All scrapers DB-driven (not hardcoded)
  - Health scores pre-computed for all 3 Karnataka districts

Post-launch: Feature Voting      COMPLETE
  - 23 feature requests seeded
  - Fingerprint-based anonymous voting
  - Features page + vote widget on homepage

Post-launch: District Health Score  COMPLETE
  - 10-category algorithm in src/lib/health-score.ts
  - Pre-computed weekly, stored in DistrictHealthScore
  - Shown on homepage district cards + district overview

OpenRouter Migration + Admin Upgrade COMPLETE (2026-04-12)
  - OpenRouter replaces OpusCode.pro as sole AI provider
  - Tiered routing: Gemma 4 free → Gemini 2.5 Pro → Claude Sonnet 4
  - AI feedback classifier with legal guardrails (DPDP, defamation, PII)
  - Feedback reply system via Resend email
  - AI usage tracking (AIUsageLog) + subscription manager (Subscription)
  - Admin panel: 10 tabs (added Costs), AI Settings shows OpenRouter
  - Feedback tab: AI classification, flags, warnings, inline reply
  - All OpusCode.pro references removed from codebase

Bug Fixes from User Feedback        COMPLETE (2026-04-12)
  - Schools: student:teacher ratio color INVERTED (green=good, red=bad)
  - Population: grid minmax reduced 150→130px for mobile
  - Overview: responsive grid uses min(240px, 100%) to prevent overflow
  - Water & Dams: tooltips on Level, Inflow, Outflow, Storage with info icons
  - Weather: NoDataCard added when no readings available
  - Crops: NoDataCard for empty crop data (metro districts like Chennai)
  - Market Ticker: USD/INR now uses Yahoo Finance (USDINR=X) as primary source
  - Market Ticker: "Last updated" timestamp shown on desktop
  - Data fix script: scripts/fix-data-april-2026.ts (TN Governor + Bengaluru elections)

Error Monitoring + Alerts           COMPLETE (2026-04-11)
  - @sentry/nextjs for automatic error catching in production
  - AdminAlert model for storing alerts in DB
  - src/lib/admin-alerts.ts: email + DB alert system via Resend
  - Alerts wired into scrapers, feedback, and payments
  - Global error page: src/app/global-error.tsx

Analytics + Privacy + Security      COMPLETE (2026-04-11)
  - Plausible Analytics (cookieless, one script tag in layout.tsx)
  - DPDP Act 2023 compliant privacy policy at /privacy (10 sections)
  - Homepage stat counters: fallback values 10/29/50000 instead of "–"
  - npm audit: 12 → 3 vulnerabilities (d3-color override, next-intl fixed, next updated)
  - Admin IP restriction middleware (optional, ADMIN_ALLOWED_IPS env var)

Admin Panel Expansion (6→9 tabs)    COMPLETE (2026-04-11)
  - System Health tab: DB/Redis status, data freshness, scraper logs, pending items
  - Alerts & Logs tab: AdminAlert feed with filters, mark-as-read, email status
  - Analytics tab: district requests, feature votes, feedback/revenue trends
  - Tab navigation via AdminClient wrapper with unread badge on Alerts tab
  - 3 new API routes: system-health, alerts, analytics

Security + Performance Audit       COMPLETE (2026-03-29 commit a999b28)
Exams & Jobs (Phase 5)              COMPLETE (2026-03-30)
  - CRON_SECRET: query param fallback removed from generate-insights (security)
  - 2FA recovery token: crypto.timingSafeEqual comparison added (timing attack)
  - useDistrictData: "dam" added to LIVE_MODULES list (cache TTL sync with cache.ts)
  - schools query: take: 200 added (unbounded query fix)
  - elections query: take: 100 added (unbounded query fix)
  - scrape-crops: hardcoded "karnataka" fallback removed, null-guard + continue added
  - scrape-crops: Vercel cron route created (GET /api/cron/scrape-crops, 3:30AM UTC)
  - Vote on Features: links added to Sidebar (collapsed 🗳️ icon + expanded label),
    MobileTabNav drawer, Footer (purple), DistrictRequestSection href fixed

Leadership Fix + Zero-Credit AI Lockdown  COMPLETE (2026-03-31)
  - leaders API: DISTINCT ON (name+role) deduplication — API-level clean data always
  - scripts/cleanup-leaders.ts: raw SQL dedup for all active districts
  - news-action-engine: leader dedup check before insert (name+role)
  - /api/ai/insight: READ-ONLY (Redis cache only, never live AI on public GET)
  - /api/ai/citizen-tips: READ-ONLY (Redis cache only, never live AI on public GET)
  - cron routes: protected by x-cron-secret: CRON_SECRET header

Open Source & Community Setup  COMPLETE (2026-04-08)
  - CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md created
  - GitHub repo made contributor-friendly (labels, starter issues, branch protection)
  - Instagram walkthrough reel linked in README
  - Broken GitHub links fixed on contribute page
  - 15 npm dependency vulnerabilities fixed

Gold/Silver Prices Fix  COMPLETE (2026-04-08)
  - Switched from Yahoo Finance conversion to IBJA (India Bullion Association) scraping
  - Gold shown per gram (not per 10g)
  - Daily change calculated from IBJA historical data

Multi-State Scalability Overhaul  COMPLETE (2026-04-09/10)
  NEW FILES:
    src/lib/constants/state-config.ts    — Per-state config (DISCOM, transport, water, board exam, RTI, data sources)
    src/components/common/DataSourceBanner.tsx — Data source attribution banner on every module page
    src/components/common/NoDataCard.tsx  — Universal empty state component with module-specific messages
  CHANGES:
    - DataSourceBanner added to all 28 module pages
    - State-config created for 6 states (Karnataka, Telangana, Delhi, Maharashtra, WB, TN)
    - All "scrape"/"scraped" removed from user-facing text → "collected"/"sourced"
    - Industries page: dynamic mode (sugar/tech/heritage/general) based on data
    - Data sources page: dynamic per-state sources
    - Water/weather/schools descriptions: removed Karnataka-specific hardcoding
    - Scrapers made state-aware (power, dams, transport — graceful skip for non-Karnataka)
    - Map page: GeoJSON fallback when file missing
    - District counter: dynamic from INDIA_STATES (not hardcoded "3")
    - layout.tsx JSON-LD: FAQ updated to list all 6 states
    - llms.txt: updated with all active states/districts
    - AI insight card: shows "Analysis from Xh ago · Updated every 2 hours" footer

Hyderabad (Telangana) Expansion  COMPLETE (2026-04-10)
  NEW FILES:
    prisma/seed-hyderabad-data.ts        — Full Hyderabad district data seed
    scripts/activate-telangana-districts.ts — Future district activation script
    scripts/fix-hyderabad-data.ts        — Budget expenditure + crime + traffic fix
  CHANGES:
    - Telangana state added (6th active state) with 5 districts (1 active, 4 inactive)
    - Hyderabad district: 16 mandals, full data seeded (leadership, budget, infra, schools,
      police, offices, schemes, elections, RTI, famous personalities, industries, transport,
      service guides, court stats)
    - seed-hierarchy.ts: Telangana + Hyderabad + 16 mandals
    - districts.ts: HYDERABAD_DISTRICT constant with all mandals + localities
    - Telugu font (Noto Sans Telugu) imported in globals.css
    - README.md updated with Telangana

Exams Dedup & State Filtering Fix  COMPLETE (2026-04-10)
  - 50 duplicate exam records removed (114 → 64)
  - National exams (UPSC/SSC/IBPS/RBI/RRB/SBI) set to level='national', stateId=null
  - Karnataka exams (KSP/KEA) restricted to Karnataka stateId only
  - API: queries national + state-specific exams separately (no cross-state leaking)
  - Scraper: upsertNationalExam() for central exams, Karnataka scraper gated by state

Data Quality & Empty State Fix  COMPLETE (2026-04-10)
  - NoDataCard shows for water, power, farm, gram-panchayat, jjm, news when empty
  - Finance: "₹0Cr" → "Data pending", "0%" → "Pending" when expenditure missing
  - Police: "0" → "No data", "₹0.0L" → "—" when traffic data missing
  - Hyderabad: crime stats (18 records), traffic revenue (12 records), budget expenditure seeded

Favicon Replacement  COMPLETE (2026-04-10)
  - New FTP logo favicon.ico, apple-touch-icon, android-chrome icons deployed
  - manifest.ts updated, sw.js updated, dynamic icon.tsx disabled

National Scraper Integration  COMPLETE (2026-04-10)
  NEW FILES:
    src/lib/constants/dam-config.ts         — Dam-to-district mapping for all 8 districts
    src/scraper/jobs/budget.ts              — National budget data collector (PFMS/data.gov.in)
    src/app/api/cron/scrape-budget/route.ts — Vercel cron route (Monday 6 AM UTC)
  CHANGES:
    - Dam scraper (dams.ts): Rewritten with national architecture
      Karnataka: uses working state portal API (water.karnataka.gov.in)
      Other states: graceful skip with documented research findings
      (India-WRIS has no public REST API — confirmed 2026-04-10)
    - Power scraper (power.ts): DISCOM plugin architecture
      DISCOMParser interface — each state has its own parser function
      Currently: BESCOM (Karnataka). Adding new DISCOMs = add parser to array.
    - Transport scraper (transport.ts): already state-aware from earlier session
    - Budget scraper registered in scheduler.ts (Monday 6 AM, weekly)
    - vercel.json: scrape-budget cron added
  RESEARCH NOTES:
    - India-WRIS: No public REST API. GIS-based internal queries only.
    - CWC RSMS: Old ASP portal with TLS issues. Daily bulletin as PDF/HTML.
    - PFMS: No public API. ASP.NET forms behind session cookies.
    - data.gov.in: No live reservoir or district expenditure datasets found.
    - Karnataka water portal: ONLY working live state portal (POST API, GeoJSON)
  - New FTP logo favicon.ico, apple-touch-icon, android-chrome icons deployed
  - manifest.ts updated to reference new icon paths
  - sw.js updated to cache new icon paths
  - Dynamic icon.tsx disabled (renamed to .bak)

Hyderabad Audit & State-Aware Fixes  COMPLETE (2026-04-11)
  SESSION 1 — Hardcoded Karnataka Backend Fixes:
    - state-config.ts: Added subDistrictUnitPlural, healthSubLabel, villageLabel,
      showVillages, gramPanchayatApplicable, jjmApplicable, municipalBody, waterBoard,
      stateHealthScheme, lastElectionYear, lastElectionType for all 6 states
    - OverviewClient.tsx: Dynamic Taluks→Mandals/Blocks/Tehsils label, hide Villages for urban
    - map/page.tsx: Dynamic sub-district labels, hide villages column for urban districts
    - health/page.tsx: State-aware health schemes (Aarogyasri for Telangana, not Arogya Karnataka),
      iCALL national helpline (replaced NIMHANS), dynamic hospital type labels
    - elections/page.tsx: State-aware "most recent election" text
    - gram-panchayat/page.tsx: Municipal Governance content for urban districts (GHMC, HMWSSB)
    - jjm/page.tsx: Urban water supply messaging with municipal water board name
    - Header.tsx: Dynamic "Select Mandal/Taluk/Tehsil" dropdown label
    - citizen-corner/page.tsx: Ward Committee instead of Gram Sabha for urban districts
    - transport/page.tsx: Fixed "Every Every" frequency display bug
    - news/page.tsx: HTML entity stripping (cleanHtml for &nbsp; etc.)
    - responsibility-content.ts: Added Hyderabad-specific urban responsibility content
  SESSION 2 — Hyderabad Data Quality:
    NEW FILES:
      scripts/fix-hyderabad-crops.ts    — Delete Apple/Avocado, round prices to integers
    UPDATED:
      scripts/fix-hyderabad-data.ts     — Population history (4 census years), dam readings
        (Osmansagar + Himayatsagar), crime stats, traffic revenue, leader VERIFY placeholders
        filled (Collector: Dasari Harichandana, CP: V.C. Sajjanar, CJ: Aparesh Kumar Singh),
        10 missing assembly constituencies added, RTI statistics, HMWSSB alert fix
  SESSION 3 — Cross-Cutting Features:
    NEW FILES:
      src/components/district/ModuleNews.tsx  — Related news at bottom of module pages
      scripts/generate-hyderabad-insights.ts  — AI insight generation for Hyderabad only
    CHANGES:
      - ModuleNews added to 10 module pages (health, elections, finance, transport, exams,
        water, police, infrastructure, crops, population, schemes)
      - Exams page: Central/State/Banking category filter tabs
      - Finance page: State-specific data source attribution text
  SESSION 4 — District Polish (2026-04-11):
    NEW FILES:
      scripts/seed-subdistrict-populations.ts  — Updates population+area on all Taluk DB records
      src/components/district/DistrictBadges.tsx — Achievement badge pills with per-district color avoidance
      src/components/district/DistrictHeroIllustration.tsx — SVG hero with per-district palette + landmark
    CHANGES:
      - districts.ts: Added DistrictBadge interface + badges for all 9 active districts
      - OverviewClient.tsx: Replaced plain header with SVG hero illustration + gradient overlay
      - Sponsor CTA: Toned down from hot pink gradient to plain subtle bar (#FFF on #FAFAF8)
      - HomeDrilldown.tsx: District cards show badges instead of crop prices/dam levels
      - Each district has unique palette (Mandya=sage green, Mysuru=gold, Bengaluru=teal,
        Hyderabad=terracotta, Chennai=ocean teal, Delhi=sandstone, Mumbai=steel blue, Kolkata=ochre)
      - Badge colors avoid clashing with district palette via badgeAvoid mapping
      - SVG approach: 3-5KB inline SVGs, no external images, zero 404 risk

Lucknow (#10) Full Data Seeding  COMPLETE (2026-04-11)
  NEW FILES:
    prisma/seed-lucknow-data.ts              — Full Lucknow seed (19 modules)
    scripts/fix-lucknow-crops.ts             — Round crop price decimals
  CHANGES:
    - state-config.ts: Added Uttar Pradesh (7th active state) with Tehsil labels,
      UPPCL/LESA power, Jal Kal Vibhag water, UPSRTC/LMRC transport, UP Board exams
    - districts.ts: Lucknow badges (City of Nawabs, Chikankari, Kebab Capital, State Capital)
    - DistrictHeroIllustration.tsx: Lucknow mauve palette + Rumi Darwaza SVG
    - DistrictBadges.tsx: Lucknow badge avoidance (no pink/purple)
    - health/page.tsx: Added Ayushman Bharat UP to state health schemes
    - seed-subdistrict-populations.ts: Added Lucknow 4 tehsils
  Mobile Optimization + AI Insight Timing (2026-04-11):
    - globals.css: mobile breakpoint (max-width:767px) with responsive rules
    - Hero illustration: min-height reduced on mobile
    - Stats strip: 2x2 on mobile (no border-left separators)
    - Sponsor bar: column layout on mobile
    - DataTable: horizontal scroll wrapper on mobile
    - Crop toggle: min tap target 36px
    - AI insight: human-readable timing ("13 days ago" not "313h ago")
    - AI insight: shows "Next refresh in Xh" from expiresAt field
    - Removed hardcoded "Updated every 2 hours" — uses dynamic timing

  Cross-District Fixes (2026-04-11):
    - Budget consistency: overview filters to latest FY only (matches finance page)
    - Schemes: Apply Online button green (#0f6e56), grey fallback for missing URLs
    - Scheme eligibility + benefit amounts updated for 20 records across all districts
    - Hyderabad housing: PMAY-U + 2BHK seeded (was all zeros)
    - Health scores recalculated for all 10 districts
    - Crop price Kg/Quintal toggle: default per Kg, AGMARKNET data stays per quintal in DB
    - Overview mandi preview: shows per-kg prices

    - Seeded: leadership (MP, 9 MLAs, Governor, CM, DM, CP), budget (10 sectors),
      infrastructure (8 projects), police (15 stations), schools (15 institutions),
      offices (10), schemes (10), elections (2024 LS + 2022 Assembly 9 constituencies),
      RTI (templates + stats), famous personalities, industries, transport (bus + train),
      services, courts, crime stats, traffic revenue, alerts, population history
```

---

## 25. COST ANALYSIS

```
Vercel Pro (zurvoapp):    ~$20/month (includes cron + preview deployments)
Neon PostgreSQL:          Free tier (0.5GB) — sufficient for 3 districts
                          Scale tier ~$20/month if >10 districts
Upstash Redis:            Free tier (10K req/day) — upgrade to $10/month at scale
Railway (scraper):        ~$5/month (always-on container, minimal CPU)
Razorpay:                 2% per transaction (no monthly fee)
Resend:                   Free (100 emails/day)
Gemini API:               Free tier sufficient for current load
Anthropic/OpusCode:       ~$10-20/month (Claude Opus calls for insights + fact-check)
Domain (forthepeople.in): ~₹800/year (~₹67/month)

CURRENT TOTAL:            ~₹2,500-3,500/month (~₹108/district/month for 3 districts)
AT SCALE (780 districts): ~₹108/district/year if infra scales linearly
                          Realistically ~₹5,000/month for 100 districts
```

---

## 26. MEMORY MANAGEMENT

### Claude Code Skills Location
```
/Users/jayanth/Documents/For The People/forthepeople/.claude/skills/forthepeople/SKILL.md
```

### Key Reference Files
```
/Users/jayanth/Documents/For The People/BLUEPRINT-UNIFIED.md          — This file (master reference)
/Users/jayanth/Documents/For The People/FORTHEPEOPLE-SKILL-UPDATED.md — Skill reference for Claude
/Users/jayanth/Documents/For The People/forthepeople/README.md         — GitHub landing page
/Users/jayanth/Documents/For The People/forthepeople/SCALING-CHECKLIST.md — How to add districts/states
/Users/jayanth/.claude/projects/.../memory/MEMORY.md                  — Session memory (auto-updated)
```

### Session Start Protocol
1. Read BLUEPRINT-UNIFIED.md (this file) at the start of each session
2. Check MEMORY.md for latest updates since blueprint was last written
3. For map work: read Section 7 carefully before touching any map file
4. For AI work: read Section 9 carefully before calling any AI function

---

## 27. ANTI-PATTERNS (Things That Don't Work And Why)

### Libraries to Never Use on Vercel
```
ioredis        — Requires persistent TCP connection. Crashes Vercel serverless functions.
                 Use @upstash/redis (REST-based) instead.
bullmq         — Also requires ioredis. Do not use in Next.js API routes.
node-cron      — Does not work in Vercel serverless. Use Vercel cron + /api/cron/ routes.
puppeteer      — Too heavy for Vercel (memory limit). Use only in Railway scraper container.
```

### Map Anti-Patterns
```
Never: Change react-simple-maps viewBox without testing all 36 states
Never: Use CCW winding for GeoJSON exterior rings (d3-geo needs CW despite RFC7946)
Never: Forget to remove zero-area rings (area < 1e-10) — they cause world-spanning fills
Never: Use D3.js for the India map (too complex, was abandoned)
Never: Use Leaflet for the main India map (SSR issues, was abandoned)
```

### AI Anti-Patterns
```
Never: Call Anthropic or Gemini APIs directly — always use callAI() from ai-provider.ts
Never: Assume content[0] is the text block — use content.find(b => b.type === 'text')
Never: Set maxTokens < 2048 when using extended thinking
Never: Let ANTHROPIC_BASE_URL default to DB value — env var MUST take priority
Never: Hardcode "gemini" as the AI provider — read from AIProviderSettings in DB
```

### Database Anti-Patterns
```
Never: Store budget values in Crores — always store in Rupees, display ÷1e7
Never: Overwrite previous leadership records — ADD only, never delete historical leaders
Never: Add famous personality without verifying bornInDistrict = true for their district
       Example: Dr. Rajkumar was born in Erode, TN — NOT in Mandya (removed after error)
Never: Use `headline` field on NewsItem — the field is `title` (was a bug)
Never: Assume ElectionResult is per-candidate — it's per-constituency (winnerName/winnerParty)
```

### Deployment Anti-Patterns
```
Never: Run `npx vercel --prod` directly (causes Vercel scope switching issues)
       Always: git push origin main → auto-deploy
Never: Commit with git user.email != jayanthmbj@gmail.com (Vercel rejects deployment)
Never: Use `git commit --amend` after a failed pre-commit hook (amends PREVIOUS commit)
       Always: Fix the issue, re-stage, create a NEW commit
Never: Use `npm ci` in Dockerfile.scraper (peer dep conflicts — use npm install --legacy-peer-deps)
```

### Code Pattern Anti-Patterns
```
Never: recharts Tooltip formatter typed as (v: number) → TypeScript error
       Always: (v) + Number(v) cast
Never: Set overflow:hidden on the nav element (clips dropdown menus)
       Always: overflow:visible on Header nav
Never: Hardcode district or state names in API routes (use dynamic DB queries)
Never: Put secrets in NEXT_PUBLIC_ vars except NEXT_PUBLIC_SITE_URL and NEXT_PUBLIC_RAZORPAY_KEY_ID
Never: Accept CRON_SECRET as a URL query param (leaks in server logs/browser history)
       Always: read from Authorization: Bearer header only
Never: Use unbounded findMany() on high-cardinality tables (schools, elections)
       Always: add take: N (schools take:200, elections take:100)
```

---

## 28. KEY FILES REFERENCE

```
ENTRY POINTS:
src/app/layout.tsx                              — Root layout (fonts, providers)
src/app/globals.css                             — Tailwind v4 @theme design tokens
src/app/[locale]/layout.tsx                     — Header + RefreshIndicator + disclaimer
src/app/[locale]/[state]/[district]/layout.tsx  — Sidebar + MobileTabNav + FeedbackFloatingButton
src/app/[locale]/[state]/[district]/page.tsx    — District overview page (ISR)

ADMIN PAGES:
src/app/[locale]/admin/page.tsx                 — Admin dashboard (9 tabs)
src/app/[locale]/admin/AdminClient.tsx          — Client-side tab navigation wrapper
src/app/[locale]/admin/SystemHealth.tsx         — System health monitoring tab
src/app/[locale]/admin/AlertsAndLogs.tsx        — Admin alert feed + filters tab
src/app/[locale]/admin/AnalyticsDashboard.tsx   — Analytics dashboard tab
src/app/[locale]/admin/ai-settings/page.tsx     — AI Settings with 3-provider cards
src/app/[locale]/admin/security/page.tsx        — 2FA setup, backup codes
src/app/[locale]/admin/review/page.tsx          — AI insight review queue
src/app/[locale]/admin/feedback/page.tsx        — Feedback management
src/app/[locale]/admin/supporters/page.tsx      — Contributors/payments
src/app/[locale]/support/page.tsx               — Contribution/support page (Razorpay)
src/app/[locale]/features/page.tsx              — Feature voting page

CORE LIBRARY:
src/lib/ai-provider.ts                          — Unified AI gateway (callAI, callAIJSON)
src/lib/encryption.ts                           — AES-256-CBC encrypt/decrypt
src/lib/db.ts                                   — Prisma singleton (PrismaPg adapter)
src/lib/redis.ts                                — @upstash/redis singleton (Vercel)
src/lib/cache.ts                                — cacheGet, cacheSet, cacheKey, getModuleTTL
src/lib/constants/districts.ts                  — INDIA_STATES hierarchy (all 28 states)
src/lib/health-score.ts                         — District health score algorithm
src/lib/insight-generator.ts                    — Pre-compute AI module insights
src/lib/news-action-engine.ts                   — News action classification + execution
src/lib/admin-alerts.ts                         — Email + DB alert system (Resend + AdminAlert model)

MONITORING:
sentry.client.config.ts                         — Sentry browser init (production only)
sentry.server.config.ts                         — Sentry server init (production only)
sentry.edge.config.ts                           — Sentry edge init (production only)
src/app/global-error.tsx                        — Global error boundary (reports to Sentry)
src/app/privacy/page.tsx                        — DPDP Act 2023 compliant privacy policy
src/middleware.ts                               — Admin IP restriction (optional, ADMIN_ALLOWED_IPS)
src/lib/fact-checker.ts                         — AI fact checking (25+ checks)

COMPONENTS:
src/components/common/FeedbackModal.tsx         — Feedback modal (type/subject/message)
src/components/common/FeedbackFloatingButton.tsx — Floating button (uses usePathname)
src/components/common/AIInsightCard.tsx         — AI insight badge per module
src/components/ui.tsx                           — EmptyBlock, ProgressBar, LastUpdatedBadge, etc.

SCRAPER:
src/scraper/scheduler.ts                        — node-cron job scheduler (getActiveDistricts)
src/scraper/jobs/                               — 20 scraper job files
src/scraper/jobs/weather.ts                     — OWM_CITY_OVERRIDE dict
src/scraper/jobs/crops.ts                       — AGMARKNET_DISTRICT_OVERRIDE dict
src/scraper/logger.ts                           — ScraperLog DB logger
src/scraper/types.ts                            — JobContext (districtName, stateName added)

DATABASE:
prisma/schema.prisma                            — 45+ models
prisma/seed.ts                                  — Full Mandya seed (30 tables, deleteMany cleanup)
prisma/seed-hierarchy.ts                        — State→District→Taluk hierarchy (upsert only)
prisma/seed-features.ts                         — 23 feature requests seed
prisma.config.ts                                — Prisma 7 config (DATABASE_URL from env)
Dockerfile.scraper                              — Railway scraper container
```

---

## 29. EXTERNAL INTEGRATIONS (April 2026)

### Sentry Error API
Reads unresolved issues and surfaces them inside Alerts & Logs tab + Dashboard banner.
- `src/lib/sentry-api.ts` — REST client (sentry.io/api/0)
- `src/app/api/admin/sentry-errors/route.ts` — cookie-auth endpoint, 5min Redis cache
- `src/components/admin/SentryErrorsSection.tsx` — rendered at top of Alerts & Logs
- Env: `SENTRY_API_TOKEN` (not SENTRY_AUTH_TOKEN — that's build-time), `SENTRY_ORG`,
  `SENTRY_PROJECT`. Token requires `event:read` + `project:read` scopes.
- Graceful: shows setup instructions when unconfigured.

### Plausible Stats API
Powers the Traffic tab with real-time visitors, top pages, referrers, devices, countries.
- `src/lib/plausible-api.ts` — `fetchAllPlausibleData(period)` returns all blocks in one go
- `src/app/api/admin/traffic/route.ts` — cookie-auth, 3min cache, supports 7d/30d/90d/month/year
- `src/app/[locale]/admin/TrafficTab.tsx` — in-page tab (`?tab=traffic`)
- Env: `PLAUSIBLE_API_KEY`, `PLAUSIBLE_SITE_ID` (default: forthepeople.in)
- Graceful: setup instructions when unconfigured.
- "View Full Analytics" button links to plausible.io dashboard.

### API Key Vault (April 2026)
- Models: `AdminAPIKey` (extended: envVarName, maskedKey, notes, lastAccessedAt, lastAccessedBy, addedBy)
- Gate: separate TOTP verification (`ftp_vault_session` cookie, 10-min Redis TTL, bound to admin
  cookie hash so the session can't be replayed from another browser)
- Reveal: POST `/api/admin/vault/[id]/reveal` — decrypts via `src/lib/encryption.ts`, rate limited
  to 5 reveals per session, auto-hidden after 30s client-side
- `/api/admin/vault` GET (list masked + env reference), POST (add/upsert)
- `/api/admin/vault/[id]` GET, PATCH, DELETE
- `/api/admin/vault/unlock` POST, `/api/admin/vault/session` GET/DELETE
- Seed: `scripts/seed-vault-keys.ts` — reads known env vars + stores encrypted. Idempotent.
- Every vault action writes an AdminAuditLog entry.

### Multi-user Admin (Foundation — future work)
- Models: `AdminUser` (username, passwordHash [bcryptjs], role, permissions, totpSecret),
  `AdminAuditLog` (actorLabel, action, resource, resourceId, details, ipAddress, userAgent)
- Roles: `owner` (full access), `admin` (no vault/users), `viewer` (Dashboard/Health/Analytics/Traffic)
- `/api/admin/users` GET/POST, `/api/admin/users/[id]` PATCH/DELETE (soft delete → isActive=false)
- Scaffolding only: ADMIN_PASSWORD cookie still gates all admin routes. Per-user login remains
  a future task — the table is populated so role-based UI filtering can be wired later.

### Audit Logging
- `src/lib/audit-log.ts`: `logAudit()` + `logAuditAuto()` (auto-extracts IP + UA from headers).
- Never throws — audit write failures are logged to stderr but don't break the main operation.
- Viewer: `/api/admin/audit-log` with filters (action, adminUserId, resource, date range),
  rendered as paginated table on Security page with CSV export.
- Instrumented: vault ops, manual-supporter, supporter edit, expense add/edit/delete,
  platform-report manual generation, user create/update/deactivate.

### Content Editor (April 2026)
- New tab under ⚙️ Operations: `/admin?tab=content-editor`.
- Selects State → District, shows module grid with editable cards.
- Inline table editor for a vetted allowlist (`CONTENT_MODULES` in
  `src/app/api/admin/content/route.ts`): 13 modules — leaders, infrastructure,
  schemes, offices, police, schools, famous personalities, budget entries,
  court stats, industries, service guides, election results, bus routes.
  Scraper-generated modules (weather/news/crops/dams/power/alerts) stay read-only.
  Hospital module skipped (no Hospital Prisma model yet).
- `GET /api/admin/content?district=&module=` lists editable rows + field list.
- `POST /api/admin/content/save` applies updates/creates/deletes, invalidates
  Redis cache keys (`ftp:<slug>:<module>` + `ftp:<slug>:overview`), and
  writes UpdateLog + AdminAuditLog entries for every change.

### Update Log
- Model: `UpdateLog(source, actorLabel, tableName, recordId, action, fieldName,
  oldValue, newValue, districtId, districtName, moduleName, description)`
- Util: `src/lib/update-log.ts` → `logUpdate()` (never throws).
- UI tab: `/admin?tab=update-log` with source/module filters, date grouping,
  expandable old/new diff view, CSV export.

### Admin Bot
- Floating bottom-right widget, rendered in `admin/layout.tsx`.
- Pattern-matched queries answered from the DB with zero AI cost:
  revenue/expense totals, stale districts, pending review/feedback/alerts,
  counts, and a parser for `Add expense: <description> ₹<amount>` (supports
  $ → ₹ conversion at ₹84/$1).
- Unmatched prompts return a requires-AI nudge directing the user to the
  Dashboard Platform Report for real analysis.
- Message history in `AdminBotMessage`.

### Cost + Alert Hygiene (April 2026)
- `/api/cron/generate-insights` schedule: `0 */2 * * *` → `0 0,12 * * *`
  (every 2h → twice daily). Combined with existing per-module TTLs this cuts
  OpenRouter spend dramatically. `FREE_FALLBACK_MODELS` reordered to try
  `qwen/qwen3-235b-a22b:free` first since OSS-20b:free has been hitting
  200 req/day limits.
- **News classification (April 13):** `news-analysis` purpose moved from
  Gemini 2.5 Pro ($1.25/M) to `openai/gpt-oss-20b:free`. In `scraper/jobs/news.ts`
  the keyword classifier runs first — AI only fires when keyword returns
  "news"/null OR the article lands in an `ACTIONABLE_MODULES` category
  (infrastructure / alerts / exams / staffing / leaders / police / health /
  power / schemes) where we want structured data extraction.
- **Data-change detection (April 13):** `hasDataChanged(districtId, module)`
  in `src/lib/insight-generator.ts` checks whether the source table has rows
  newer than the last AIModuleInsight.generatedAt. For modules whose tables
  lack an updatedAt/createdAt timestamp (Leader, PoliceStation, School,
  BudgetEntry, ElectionResult, Scheme, CourtStat, LocalIndustry,
  FamousPersonality) the check falls back to a 14-day staleness ceiling.
  Skipped generations log to stdout, not AdminAlert.
- **Estimated daily spend after all cuts:** $0.02–0.05 (was ~$2/day).
- `src/lib/admin-alerts.ts`: `isTransientError()` filter skips email + DB
  alerts for fetch-failed / timeout / 5xx / ECONN* / aborted errors.
  `alertScraperFailed` and `alertCronFailed` short-circuit when the error
  matches. Freshness panel still reflects stale state so the problem remains
  visible — we just stop paging. Dashboard recent-activity feed drops them too.

### AI Platform Analysis
Weekly AI-generated platform health report with action items + cost tips.
- Model: `PlatformReport` (type, summary, actionItems, metrics, costTips, growthNotes,
  aiModel, aiProvider, aiCostUSD, generatedAt)
- `src/lib/platform-analysis.ts` — gathers 7-day snapshot + calls Gemini 2.5 Pro via callAIJSON
- `src/app/api/admin/platform-report/route.ts` — GET latest + estimate, POST with
  `?confirm=true` to generate
- `src/app/api/cron/platform-report/route.ts` — Sundays 00:00 UTC via vercel.json
- `src/components/admin/PlatformReportCard.tsx` — Dashboard card with two-step generate flow
- Approx cost: $0.002 (~₹0.20) per report. Cheaper than the prompt's ~$0.01 estimate because
  the actual prompt fits in ~1.7K tokens.
- Weekly cron needs `CRON_SECRET` set; manual trigger from Dashboard works independently.

### Contributors & Sponsorship System (April 13, 2026 — COMPLETE)
Complete overhaul of the contributor/sponsor system: pricing tiers, expiry,
variable-based labels, per-district + per-state contributor pages, corporate
sponsor banner, homepage showcase, admin CRUD, growth chart, performance
pagination, and dynamic Razorpay plans.

**Tier structure (5 cards, Indian hook lines — `src/lib/constants/razorpay-plans.ts`):**
- `custom` — One-Time Contribution · ₹10–50,000 (default ₹50) · "Even ₹50 keeps
  one district's data running for a day"
- `district` — District Champion · ₹99–1,998/mo (default ₹99) · featured · "₹99/mo
  — one less Zomato order, one more district with free data 🍛"
- `state` — State Champion · ₹1,999–9,998/mo · "₹67/day — an auto ride's worth"
- `patron` — All-India Patron · ₹9,999–49,998/mo · "780 districts. 22,620 dashboards"
- `founder` — Founding Builder · ₹50,000–99,000/mo · "Royal Contributor"
- Every tier has `minAmount`, `maxAmount`, `step`, `hookLine`, `isRecurring`.
- `chai` kept in `TIER_PRIORITY` + `getContributorLabel` for backward compat with
  pre-merger DB records (they render as "Supporter").

**Dynamic Razorpay plan creation (CRITICAL):**
- `src/app/api/payment/create-subscription/route.ts` no longer uses preset
  `RAZORPAY_PLANS`. Each subscription creates a new Razorpay plan with the
  user's exact amount from the +/- buttons.
- `SupportCheckout.tsx` passes the clamped `amount` to both create-subscription
  and verify-subscription routes.
- `verify-subscription/route.ts` saves the actual amount on the Supporter row
  (both upsert branches).
- Preset `RAZORPAY_PLANS` constants remain but are no longer referenced in code.

**Amount clamping + validation:**
- UI: +/- buttons use `tier.step`, disable at min/max, blur-snap rounds to step
  within `[minAmount, maxAmount]`. Number input respects the same bounds.
- Server: `create-order` and `create-subscription` enforce
  `minAmount ≤ amount ≤ maxAmount` per tier.

**Expiry system (`src/lib/contribution-expiry.ts`):**
- `calculateOneTimeExpiry(amount, from)` — ≥₹2000 = 90d, ≥₹500 = 60d, else 30d.
- `calculateFounderGrace()` — 90d post-cancellation grace for founders.
- `calculateStandardGrace()` — 30d fallback for other cancellations.
- Active subscriptions have `expiresAt: null` (Razorpay manages renewals).
- Public API filters: `OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]`.
- One-time cards show "Active until {date}" / "Expires in N days" via
  `formatExpiryLabel()` in `ContributorsClient`.
- Migration script: `scripts/migrate-existing-contributor-expiry.ts` backfills
  `expiresAt` for pre-existing one-time rows based on amount + createdAt; grants
  30-day grace if calculated expiry already passed. Also clears stale
  `expiresAt` on active subscriptions.

**Dynamic labels (`src/lib/contributor-label.ts`):**
- `getContributorLabel(tier, districtName, stateName)` returns
  "Mandya Champion", "Karnataka Champion", "India Patron", "Royal Contributor",
  "Chai Supporter" (legacy), "Supporter" (custom/unknown).
- Used by `ContributorsClient`, `GlobalContributorsClient`, `PatronCard`,
  `DistrictSponsorBanner`, `StateSponsorSection`, `TopTierShowcase`.

**Social link validation (`src/lib/social-detect.ts`):**
- New `validateSocialLink(input)` returns `{ valid, platform, cleanUrl, warning }`.
- UI shows green checkmark (`✓ {Platform} link detected`), orange warning
  (`⚠ Could not verify — please double-check`), red error (`✗ Invalid format`).

**API (`src/app/api/data/contributors/route.ts`) — paginated + typed:**
- Every endpoint accepts `?limit=` and `?offset=`, returns `total`.
- `?type=top-tier&limit=20` — founders + patrons for homepage.
- `?district=&state=&limit=500` — district page (all tiers including one-time).
- `?type=state-page&state=&limit=60` — state-level sponsors (India + state tier).
- `?type=leaderboard&limit=10` — top active subscribers by tenure.
- `?type=growth-trend` — `{ points: [{ month, newCount, cumulative }, …] }`.
- `?type=district-rankings` — aggregated monthly totals per district.
- No params — paginated `{ subscribers, oneTime, subscribersTotal, oneTimeTotal }`.
- DB orderBy: `[{ amount: "desc" }, { activatedAt: "asc" }]` so richest
  contributor shows first. Public response nulls `amount` for recurring rows
  (only one-time amounts are shown). Hard ceiling `HARD_MAX = 500`.
- Select includes `sponsoredDistrict` + `sponsoredState` so the response carries
  `districtName`, `stateName`, `districtSlug`, `stateSlug`.

**UI components — new:**
- `src/components/common/CorporateSponsorBanner.tsx` — dashed-border CTA banner
  at the top of every district's contributors page with email + Instagram contacts.
- `src/components/common/StateSponsorSection.tsx` — 2-line ticker (India / State
  Champions) rendered below the district grid on `/[locale]/[state]/page.tsx`.
- `src/components/common/ContributorGrowthChart.tsx` — Recharts AreaChart above
  the global leaderboard. Shows cumulative growth + "+X new this month".
- `src/components/support/TopTierShowcase.tsx` — slim homepage strip
  (`🏆 Backed By`) with CSS `@keyframes ticker-scroll` (60s desktop, 45s mobile,
  pause on hover, respects `prefers-reduced-motion`). Limited to 20 via
  `?limit=20`. Renders nothing when no top-tier contributors.

**UI components — redesigned:**
- `ContributorsClient.tsx` (district page) — 6 sections in order:
  1. CorporateSponsorBanner, 2. {District} Champions, 3. {State} Champions,
  4. India Patrons & Royal Contributors, 5. One-Time Supporters, 6. Bottom CTA.
  Each section caps at 20 cards initially; horizontal scroll with arrow buttons
  (desktop) and touch swipe (mobile); "Show more (+X)" expands by 40 up to a
  `MAX_RENDERED = 200` hard cap. Empty sections show a "Be the first {District}
  Champion" soft CTA.
- `DistrictSponsorBanner.tsx` (overview ticker) — 3 lines: 👑 India, 🇮🇳 {State},
  🏛️ {District}. Each line caps at 15 chips with "+X more" chip linking to the
  contributors page. Mobile: chip labels shrink to 11px, line label wraps.
- `ContributorWall.tsx` (support page wall) — capped at 50 one-time + 30
  subscribers; animation duration `wall-scroll` slowed from 30s to 90s so names
  are readable. "View all {total} →" link shown when oneTimeTotal > 50.
- `GlobalContributorsClient.tsx` (/contributors) — grows chart + paginated list
  (50 per page, "Load more" loads next 50 via `limit = PAGE_SIZE × page`);
  filter=one-time preset from URL param so the support-page wall link works.

**Homepage:**
- `src/app/[locale]/page.tsx` renders `<TopTierShowcase />` above
  `HomeDrilldown` + existing `CompactContributorWallClient`.

**Support page (`src/app/support/page.tsx`):**
- 5 tier cards (chai merged into custom), each shows hook line beneath the
  description. Passes full props (`minAmount`, `maxAmount`, `step`, `hookLine`)
  to `SupportCheckout`. Bottom CTA uses the `custom` tier (was `chai`).
- "View full contributor leaderboard →" link added under the wall.
- Post-payment success screen instructs users to email
  `support@forthepeople.in` to update social link or display name later.

**Admin — manual contributor CRUD (`src/app/[locale]/admin/supporters/`):**
- `ManualSupporterForm.tsx` updated: 5 new tiers (no chai), One-Time/Monthly
  radio that auto-infers from tier preset, Expires On date picker
  (auto-calculated for one-time unless overridden).
- `src/app/api/admin/manual-supporter/route.ts` accepts `isRecurring`,
  `expiresAt`, `paymentDate`; defaults expiry via `calculateOneTimeExpiry` for
  one-time rows; sets `subscriptionStatus: "active"` + `activatedAt` for
  monthly; stamps `paymentId: "manual_<ts>_<rand>"`; invalidates
  `ftp:contributors:*` (including new `top-tier` key).

**Dev-only mock mode (`src/lib/mock-contributors.ts`):**
- `isMockEnabled()` double-gated: requires `FTP_MOCK_CONTRIBUTORS=1` AND
  `NODE_ENV === "development"`. Production-safe even if env var leaks.
- Deterministic pool (mulberry32, seed=42) of 10,000 contributors with
  realistic tier distribution and Indian names.
- Helpers: `mockTopTier`, `mockDistrict`, `mockStatePage`, `mockLeaderboard`,
  `mockDistrictRankings`, `mockGrowthTrend`, `mockAll` — each applies the same
  "null amount for recurring" projection as the real API's `toPublic()`.
- Wired into the API at the very top of the handler; skipped in prod.

**Scripts:**
- `scripts/seed-bulk-dummy-contributors.ts` — writes up to 10,000 `[TEST]`
  contributors to the DB for load/visual testing. **Cleanup required before
  any push:** `npx tsx -r dotenv/config scripts/cleanup-test-contributors.ts`.
  DB is shared with production — never run the seed without also running the
  cleanup.
- `scripts/migrate-existing-contributor-expiry.ts` — one-shot backfill
  (40 real one-time contributors got natural expiries on 2026-04-13, 4 active
  subscriptions had stale expiresAt cleared).
- `scripts/cleanup-test-contributors.ts` — pre-existing, wipes any row where
  `name LIKE "[TEST]%"` OR `email LIKE "%@test.forthepeople.in"`.

**Cache invalidation:**
- Verify + verify-subscription + manual-supporter now include
  `"ftp:contributors:top-tier"` in the invalidation list.
- Redis `SCAN match: ftp:contributors:*` used when bulk-busting after DB writes.

### Contributors — Final UX Polish (April 14, 2026 — COMPLETE)
Post-launch polish pass on the contributor system. No feature changes, only
presentation + performance.

**District overview section order (shared across ALL districts):**
1. Hero (name, badges, population, illustration)
2. **Combined Supporters + Sponsor CTA card** (cool slate `#F8FAFC` on
   `#E2E8F0` border — intentionally distinct from AI Analysis's warm orange)
3. AI Analysis card
4. District Health Score
5. Active Alerts → rest of the dashboard

The old separate "SPONSORED BY" amber banner + grey sponsor CTA bar are gone.
Both collapsed into one slate card in `DistrictSponsorBanner.tsx`.

**Per-line independent auto-scroll (`DistrictSponsorBanner.tsx`):**
- Three rows (👑 India / 🇮🇳 State / 🏛️ District) measure their own overflow
  via `ResizeObserver` + `scrollWidth` vs `clientWidth + 50` slack.
- Each animates at its own speed only when it overflows:
  India **120s**, State **90s**, District **60s** (slower at the top so the
  highest-value tier reads clearest).
- `onMouseEnter` / `onMouseLeave` toggle `animationPlayState` so hovering any
  chip pauses that row only; leaving resumes from the paused position.
- `@media (prefers-reduced-motion: reduce)` disables all animations.
- Non-overflowing rows show an inline "View all →" chip at the end instead.
- Sponsor CTA sits inside the same card under a subtle `border-top` separator
  with red-accent "❤️ Sponsor {District} — ₹99/mo" + secondary state/patron lines.

**Support page contributor wall (`ContributorWall.tsx`):**
- Animation slowed to **180s** (3-min gentle drift). Was 30s → 90s → 180s as
  Jayanth tuned the readability.
- One-time cards capped at 50; subscribers at 30; "View all X →" link shown
  when totals exceed those caps.

**District contributor rows (`ContributorsClient.tsx`):**
- Each section row (District / State / India / One-Time) auto-scrolls (90s
  desktop, 60s mobile) when ≥4 cards; pauses on hover at the viewport level;
  reduced-motion falls back to native horizontal scroll.
- Count badges next to section headers are now buttons — clicking "🏛️ {District}
  Champions 204" opens a full-screen `ViewAllModal` with a responsive grid of
  all contributors, Esc / click-outside to close, body scroll-locked.

**Homepage `TopTierShowcase.tsx`:**
- CSS `@keyframes ticker-scroll` 60s desktop / 45s mobile; duplicates the
  items for seamless loop; pause-on-hover via `:hover .ftp-ticker-track`;
  respects `prefers-reduced-motion`. Only loops when >6 chips.

**Global `/[locale]/contributors` page (`GlobalContributorsClient.tsx`):**
- Gradient hero ("The People Behind the Platform") with 3 stat cards
  (total supporters, active monthly, districts sponsored) + "Join the Movement
  — from ₹99/mo →" CTA.
- 💡 WHY IT MATTERS card under hero — counts are derived dynamically from
  `getTotalActiveDistrictCount()` × `MODULES_PER_DISTRICT`. No hardcoded "9"
  anywhere.
- Top-3 leaderboard rows get gold/silver/bronze `border-left: 4px` tints.
- 🔥 NEW badge on contributors who joined in the last 7 days.
- ⭐ LONGEST badge on the #1 by tenure (from leaderboard API).
- Growth chart + "Every district needs a champion. Will you be one?" bottom
  CTA moved after the Load-more section.

**Growth trend:**
- API query filtered to `createdAt >= 2026-04-01` (project launch). Applies
  to both real Prisma query and `mockGrowthTrend()`.
- `ContributorGrowthChart.tsx` renders a stat card ("📊 April 2026 · X new this
  month · Tracking since April 2026") when fewer than 2 months of data exist,
  and auto-swaps to the Recharts `AreaChart` once 2+ months are available.

**Support page prominence (`/support/page.tsx`):**
- New `ContributorCountBanner.tsx` (plain `fetch`, no QueryClient — this page
  sits outside `[locale]` layout where the provider lives) shows gold
  "🏆 N people already backing India's data revolution · View leaderboard →"
  above the tier cards.
- "View full contributor leaderboard →" link added beneath the wall.
- Dynamic district/state counts via `getTotalActiveDistrictCount()` +
  `getActiveStateCount()` — no more hardcoded "9 active districts".

**Helper utilities added to `src/lib/constants/districts.ts`:**
- `getTotalActiveDistrictCount()` — sum of active districts across all states.
- `getActiveStateCount()` — states with ≥1 active district.
Use these anywhere UI copy references live-district numbers — they auto-update
as new districts launch.
```
