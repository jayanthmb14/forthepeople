/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// CountdownTimer — time left until a tender's bid deadline.
// Numbers in JetBrains Mono (tabular) so the digits do not jump as they
// tick. Under 48 hours the text turns the danger colour; after the
// deadline it just says "Closed". Colours are v3 tokens only.
"use client";

import { useEffect, useState, type CSSProperties } from "react";

export default function CountdownTimer({ deadline, compact = false }: { deadline: string; compact?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const target = new Date(deadline).getTime();
  const diff = target - now;

  const mono: CSSProperties = {
    fontFamily: "var(--ftp-font-mono)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 500,
  };

  if (diff <= 0) {
    return <span style={{ color: "var(--ftp-text-2)", fontSize: compact ? 12 : 14 }}>Closed</span>;
  }
  const days = Math.floor(diff / 86400_000);
  const hours = Math.floor((diff % 86400_000) / 3600_000);
  const mins = Math.floor((diff % 3600_000) / 60_000);
  const secs = Math.floor((diff % 60_000) / 1000);

  const urgent = diff < 48 * 3600_000;
  const color = urgent ? "var(--ftp-danger)" : "var(--ftp-text)";
  if (compact) {
    if (days >= 1) return <span suppressHydrationWarning style={{ ...mono, color, fontSize: 12 }}>{days}d {hours}h</span>;
    return <span suppressHydrationWarning style={{ ...mono, color, fontSize: 12 }}>{hours}h {mins}m</span>;
  }
  return (
    <span suppressHydrationWarning style={{ ...mono, color, fontSize: 14 }}>
      {days > 0 ? `${days}d ` : ""}{hours}h {mins}m {secs}s
    </span>
  );
}
