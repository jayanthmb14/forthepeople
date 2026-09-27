/**
 * ForThePeople.in — top-level constants used across the homepage redesign.
 *
 * Keep this file SMALL — granular per-feature constants belong in their
 * own files under src/lib/constants/. This is the high-level platform
 * shape only.
 *
 * For the full set of citizen-facing numbers (districts, states, modules)
 * use `getPlatformFacts()` from src/lib/platform-facts.ts — that is the one
 * place every count is derived from, so the homepage, /about, the support
 * chatbot and the FAQ JSON-LD can never disagree with each other again
 * (GitHub issue #36).
 */

import { SIDEBAR_MODULES } from "@/lib/constants/sidebar-modules";

/**
 * Number of dashboard modules each active district exposes.
 *
 * DERIVED, not typed by hand: it is the length of SIDEBAR_MODULES, the
 * registry that draws the district sidebar and mobile nav. Add a module to
 * that registry and every "N dashboards per district" label on the site
 * updates on its own. (Before this the site said 25+, 28, 29 and 32 in
 * different places — none of them matched the sidebar.)
 */
export const DASHBOARDS_PER_DISTRICT: number = SIDEBAR_MODULES.length;

/**
 * Total districts in India, as the Local Government Directory counts them:
 * lgdirectory.gov.in home page, read 28 Sep 2026 — 36 States/UTs (28 + 8),
 * 784 districts. LGD (Ministry of Panchayati Raj) is the official register
 * of administrative units; the page carries no date, so re-check it when
 * states create districts. (Was 780, labelled "2024 Census-aligned" and
 * "MHA, 2024" — there was no 2024 census and MHA publishes no such count.)
 * Used as the goal ("all N districts") — never as current coverage.
 */
export const TOTAL_INDIA_DISTRICTS = 784;
