/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * State leaderboard on the module deep-dive page. Wraps the shared
 * IndiaStateLeaderboard with mock state values for the module's
 * primary metric.
 *
 * MOCK DATA — replace in Session C1.
 */

import IndiaStateLeaderboard, {
  type LeaderboardRow,
} from "../IndiaStateLeaderboard";
import { INDIA_DESIGN } from "@/lib/india/india-design";
import {
  getMockMetric,
  getStateValuesForMetric,
} from "@/lib/india/mock-state-data";
import { IndiaSectionTitle } from "./v4";

interface Props {
  locale: string;
  metricKey: string;
  metricLabel: string;
}

export default function ModuleStateLeaderboard({
  locale,
  metricKey,
  metricLabel,
}: Props) {
  const metric = getMockMetric(metricKey);
  const rows: LeaderboardRow[] = getStateValuesForMetric(metricKey).map((v) => ({
    stateSlug: v.stateSlug,
    stateName: v.stateName,
    value: v.value,
    unit: metric?.unit ?? null,
  }));

  return (
    <section
      style={{
        padding: "28px 16px",
        borderBottom: `1px solid ${INDIA_DESIGN.border}`,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <IndiaSectionTitle emoji="🏆">State leaderboard for {metricLabel}</IndiaSectionTitle>
        <IndiaStateLeaderboard
          locale={locale}
          rows={rows}
          higherIsBetter={metric?.higherIsBetter ?? true}
        />
      </div>
    </section>
  );
}
