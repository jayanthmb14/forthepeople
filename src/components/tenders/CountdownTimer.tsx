/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// CountdownTimer — time left until a tender's bid deadline.
// Tabular numbers so the digits do not jump. Under 48 hours the text turns
// the danger colour; after the deadline it just says "Closed". It shows
// days, hours and minutes and refreshes every 30 seconds — a quiet clock,
// not a ticking one (nothing on the page moves forever). The unit letters
// come from "page_tenders" so they read right in every language.
"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";

export default function CountdownTimer({ deadline, compact = false }: { deadline: string; compact?: boolean }) {
  const t = useTranslations("page_tenders");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
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
    return <span style={{ color: "var(--ftp-text-2)", fontSize: compact ? 12 : 14 }}>{t("countdown.closed")}</span>;
  }
  const d = Math.floor(diff / 86400_000);
  const h = Math.floor((diff % 86400_000) / 3600_000);
  const m = Math.floor((diff % 3600_000) / 60_000);

  const urgent = diff < 48 * 3600_000;
  const color = urgent ? "var(--ftp-warn)" : "var(--ftp-text)";
  if (compact) {
    return (
      <span suppressHydrationWarning style={{ ...mono, color, fontSize: 12 }}>
        {d >= 1 ? t("countdown.dh", { d, h }) : t("countdown.hm", { h, m })}
      </span>
    );
  }
  return (
    <span suppressHydrationWarning style={{ ...mono, color, fontSize: 14 }}>
      {d > 0 ? t("countdown.dhm", { d, h, m }) : t("countdown.hm", { h, m })}
    </span>
  );
}
