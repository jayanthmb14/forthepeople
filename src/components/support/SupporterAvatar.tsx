/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// A supporter's round avatar: their initials on a soft wash of their plan's
// colour (tier-look.ts) — rose, blue, teal, violet, or gold with a gold ring
// for the Founding Builder. Anonymous supporters (and names with no
// letters) get a plain person shape instead of initials. Decorative: the
// name is always written next to it.

import { UserRound } from "lucide-react";
import { initialsOf, tierHueClass, type TierKey } from "./tier-look";
import look from "./look.module.css";

export default function SupporterAvatar({
  name,
  tier,
  size = 40,
  anonymous,
}: {
  name: string;
  tier: TierKey;
  size?: number;
  /** Show the person shape, not initials. */
  anonymous?: boolean;
}) {
  const initials = anonymous ? "" : initialsOf(name);
  return (
    <span
      aria-hidden
      className={`${look.avatar} ${look.metal} ${tierHueClass(tier)}`}
      data-tier={tier}
      style={{ ["--size" as string]: `${size}px` } as React.CSSProperties}
    >
      {initials || <UserRound size={Math.round(size * 0.5)} strokeWidth={2} />}
    </span>
  );
}
