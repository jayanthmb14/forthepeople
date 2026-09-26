/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Loading skeleton for district module pages (Next.js App Router loading.tsx)
export default function DistrictLoading() {
  return (
    <div style={{ padding: 24 }}>
      {/* Module header skeleton */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ height: 12, width: 100, background: "#F0F0EC", borderRadius: 6, marginBottom: 12 }} />
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ width: 40, height: 40, background: "#EFF6FF", borderRadius: 10, flexShrink: 0 }} />
          <div>
            <div style={{ height: 22, width: 200, background: "#F0F0EC", borderRadius: 6 }} />
            <div style={{ height: 13, width: 280, background: "#F5F5F0", borderRadius: 6, marginTop: 8 }} />
          </div>
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, marginBottom: 24 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ height: 80, background: shimmerGradient, borderRadius: 12, animation: "shimmer 1.5s infinite", backgroundSize: "200% 100%" }} />
        ))}
      </div>

      {/* Table skeleton */}
      <div style={{ background: "#fff", border: "1px solid #E8E8E4", borderRadius: 10, overflow: "hidden" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 44,
              borderBottom: i < 5 ? "1px solid #F5F5F0" : "none",
              background: shimmerGradient,
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
            }}
          />
        ))}
      </div>

      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  );
}

const shimmerGradient = "linear-gradient(90deg, #F5F5F0 25%, #EBEBEB 50%, #F5F5F0 75%)";
