/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { WifiOff } from "lucide-react";

// Lives under [locale] (route: /en/offline) so the service worker can
// precache a real 200 page; see public/sw.js. Rendered inside the locale
// layout (header + footer), hence 60vh rather than a full-screen block.
//
// Design v3 (2026-09-27): token colours and fonts, a Lucide icon in the
// usual 40 px tinted square instead of an emoji, and honest copy (the site
// shows published government data with dates, not "live" data).
export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--ftp-bg)",
        padding: "24px 16px",
        textAlign: "center",
      }}
    >
      <div
        aria-hidden
        style={{
          width: 40,
          height: 40,
          borderRadius: "var(--ftp-radius-tile)",
          background: "var(--ftp-surface-2)",
          color: "var(--ftp-text-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <WifiOff size={20} />
      </div>
      <h1 className="ftp-h2" style={{ marginBottom: 8 }}>
        You are offline
      </h1>
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", maxWidth: 360 }}>
        ForThePeople.in needs an internet connection to load district data.
        Pages you opened recently may still work. Check your connection and try again.
      </p>
    </div>
  );
}
