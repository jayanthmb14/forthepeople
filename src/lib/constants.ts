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
 * Canonical total of Indian districts (2024 Census-aligned). Used for
 * "X coming" stat tiles and the /vote-district pool size.
 */
export const TOTAL_INDIA_DISTRICTS = 780;
