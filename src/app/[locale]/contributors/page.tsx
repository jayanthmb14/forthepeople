/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import type { Metadata } from "next";
import GlobalContributorsClient from "./GlobalContributorsClient";

// Session 14 v8.1 Phase G (Fix #11): the Session 12 ContributorsHero
// was a second hero rendered above GlobalContributorsClient — it
// duplicated the existing in-page "The People Behind the Platform"
// heading. ContributorsHero.tsx was removed in the Sept 2026 dead-code
// sweep (commit 96e2eb7); git history is the rollback if it is ever needed.

export const metadata: Metadata = {
  title: "Contributors — ForThePeople.in",
  description: "The people who keep India's citizen transparency platform running. View the leaderboard and all contributors.",
};

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function GlobalContributorsPage({ params }: Props) {
  const { locale } = await params;
  return <GlobalContributorsClient locale={locale} />;
}
