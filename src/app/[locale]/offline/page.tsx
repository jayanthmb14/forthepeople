/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#FAFAF8",
        padding: 24,
        textAlign: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ fontSize: 56, marginBottom: 16 }}>📡</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
        You are offline
      </h1>
      <p style={{ fontSize: 14, color: "#6B6B6B", maxWidth: 320 }}>
        ForThePeople.in needs an internet connection to load live government data.
        Check your connection and try again.
      </p>
    </div>
  );
}
