/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
//  Loading skeleton for district pages (Next.js App Router loading.tsx)
//  Design v3: flat surface-2 blocks with the kit's gentle fade
//  (.ftp-skeleton — turned off by prefers-reduced-motion). No shimmer
//  gradient. The shape mirrors a module page: header, 4 stat tiles,
//  then a table.
// ═══════════════════════════════════════════════════════════
import { LoadingShell } from "@/components/district/ui";

export default function DistrictLoading() {
  return (
    <div className="px-4 md:px-6 pt-6 pb-12" style={{ maxWidth: "calc(var(--ftp-reading-max) + 48px)" }} aria-busy="true">
      {/* Header: back link, icon square, title, description */}
      <div style={{ borderBottom: "1px solid var(--ftp-border)", paddingBottom: 20, marginBottom: 24 }}>
        <div className="ftp-skeleton" style={{ height: 12, width: 110, borderRadius: "var(--ftp-radius-pill)", marginBottom: 12 }} />
        <div style={{ display: "flex", gap: 12 }}>
          <div className="ftp-skeleton" style={{ width: 40, height: 40, borderRadius: "var(--ftp-radius-tile)", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ftp-skeleton" style={{ height: 22, width: "min(220px, 70%)", borderRadius: "var(--ftp-radius-tile)" }} />
            <div className="ftp-skeleton" style={{ height: 13, width: "min(300px, 90%)", borderRadius: "var(--ftp-radius-tile)", marginTop: 8 }} />
          </div>
        </div>
      </div>

      {/* Stat strip: 4 tiles (2 × 2 on phones via .ftp-stat-strip) */}
      <div className="ftp-stat-strip" style={{ marginBottom: 24 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="ftp-skeleton" style={{ height: 88, borderRadius: "var(--ftp-radius-tile)" }} />
        ))}
      </div>

      {/* Table rows */}
      <LoadingShell rows={6} />
    </div>
  );
}
