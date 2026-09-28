/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// Mounted once in src/app/[locale]/layout.tsx. Loads the support nudge
// (SupportNudge.tsx) in the browser only, after the page is up, so it adds
// nothing to the server HTML or the first paint.

import dynamic from "next/dynamic";

const SupportNudge = dynamic(() => import("./SupportNudge"), { ssr: false, loading: () => null });

export default function SupportNudgeMount(props: { monthlyFrom: number | null; onceFrom: number | null }) {
  return <SupportNudge {...props} />;
}
