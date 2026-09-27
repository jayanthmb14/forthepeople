/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Lives under [locale] (route: /en/offline) so the service worker can
// precache a real 200 page; see public/sw.js. Rendered inside the locale
// layout (header + footer), hence 60vh rather than a full-screen block.
//
// Design v4 "Rang": a friendly dead end in the quiet slate hue — a big
// emoji in a tinted tile, the display face for the heading, and honest
// copy (the site shows published government data with dates, not "live"
// data). No motion: this page may be shown on a slow, flaky connection.
export default function OfflinePage() {
  return (
    <div
      className="ftp-hue-slate"
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
        className="ftp-icon-chip ftp-emoji"
        style={{ width: 88, height: 88, borderRadius: 26, fontSize: 44, marginBottom: 18 }}
      >
        📡
      </div>
      <h1 className="ftp-display" style={{ margin: "0 0 8px", fontSize: 30, lineHeight: 1.15, fontWeight: 700, color: "var(--ftp-text)" }}>
        You are offline
      </h1>
      <p style={{ margin: 0, fontSize: 15, lineHeight: "23px", color: "var(--ftp-text-2)", maxWidth: 400 }}>
        ForThePeople.in needs an internet connection to load district data.
        Pages you opened recently may still work. Check your connection and try again.
      </p>
    </div>
  );
}
