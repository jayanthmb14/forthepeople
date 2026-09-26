/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { use, useState } from "react";
import Image from "next/image";
import { Star, ExternalLink, MapPin } from "lucide-react";
import { useFamousPersonalities } from "@/hooks/useRealtimeData";
import { ModuleHeader, SectionLabel, LoadingShell, ErrorBlock, LastUpdated } from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources } from "@/lib/constants/state-config";

const CATEGORY_EMOJI: Record<string, string> = {
  Politician:  "🏛️",
  Scientist:   "🔬",
  Artist:      "🎨",
  Writer:      "✍️",
  Athlete:     "🏅",
  Activist:    "✊",
  Business:    "💼",
  Military:    "⚔️",
  Spiritual:   "🙏",
  Educator:    "📚",
  Film:        "🎬",
  Music:       "🎵",
  Other:       "🌟",
};

function PersonalityAvatar({
  name,
  photoUrl,
  category,
}: {
  name: string;
  photoUrl?: string | null;
  category: string;
}) {
  const [imgError, setImgError] = useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const emoji = CATEGORY_EMOJI[category] ?? "🌟";

  if (photoUrl && !imgError) {
    return (
      <div
        style={{
          width: 72, height: 72, borderRadius: 14, flexShrink: 0,
          overflow: "hidden", border: "2px solid #E8E8E4",
        }}
      >
        <Image
          src={photoUrl}
          alt={name}
          width={72}
          height={72}
          onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: 72, height: 72, borderRadius: 14, flexShrink: 0,
        background: "#EFF6FF", border: "1px solid #BFDBFE",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}
    >
      <span style={{ fontSize: 22 }}>{emoji}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", marginTop: 2 }}>{initials}</span>
    </div>
  );
}

function PersonalityCard({ p }: { p: {
  id: string; name: string; nameLocal?: string | null; category: string;
  bio: string; photoUrl?: string | null; photoCredit?: string | null;
  wikiUrl?: string | null; birthYear?: number | null; deathYear?: number | null;
  birthPlace?: string | null; bornInDistrict?: boolean; notable?: string | null;
}}) {
  return (
    <div
      style={{
        background: "#FFFFFF", border: "1px solid #E8E8E4",
        borderRadius: 14, padding: "18px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        display: "flex", flexDirection: "column", gap: 12,
      }}
    >
      {/* Header: avatar + name */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <PersonalityAvatar name={p.name} photoUrl={p.photoUrl} category={p.category} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.2 }}>
            {p.name}
          </div>
          {p.nameLocal && (
            <div style={{ fontSize: 12, color: "#9B9B9B", fontFamily: "var(--font-regional)", marginTop: 2 }}>
              {p.nameLocal}
            </div>
          )}
          {/* Years */}
          {p.birthYear && (
            <div style={{ fontSize: 12, color: "#9B9B9B", marginTop: 4 }}>
              {p.birthYear}{p.deathYear ? `–${p.deathYear}` : " – present"}
              {p.birthPlace ? ` · ${p.birthPlace}` : ""}
            </div>
          )}
          {/* Notable for */}
          {p.notable && (
            <div
              style={{
                display: "inline-block", marginTop: 6,
                fontSize: 11, fontWeight: 600,
                color: "#2563EB", background: "#EFF6FF",
                padding: "2px 8px", borderRadius: 20,
              }}
            >
              {p.notable}
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      <p style={{ fontSize: 13, color: "#6B6B6B", lineHeight: 1.6, margin: 0 }}>
        {p.bio}
      </p>

      {/* Wikipedia link */}
      {p.wikiUrl && (
        <a
          href={p.wikiUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 12, color: "#2563EB", textDecoration: "none",
          }}
        >
          <ExternalLink size={11} /> Read on Wikipedia
        </a>
      )}

      {/* Photo credit */}
      {p.photoCredit && (
        <div style={{ fontSize: 10, color: "#C0C0C0" }}>
          Photo: {p.photoCredit}
        </div>
      )}
    </div>
  );
}

export default function FamousPersonalitiesPage({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string }>;
}) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useFamousPersonalities(district, state);
  const personalities = data?.data ?? [];

  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const categories = Array.from(new Set(personalities.map((p) => p.category))).sort();

  const filtered = personalities.filter((p) => {
    const matchCat = filter === "all" || p.category === filter;
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.bio.toLowerCase().includes(search.toLowerCase()) ||
      (p.notable ?? "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Split into born in district vs roots in district
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bornHere = filtered.filter((p) => (p as any).bornInDistrict === true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rootsHere = filtered.filter((p) => (p as any).bornInDistrict !== true);

  const districtLabel = district.charAt(0).toUpperCase() + district.slice(1).replace(/-/g, " ");

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader
        icon={Star}
        title="Famous Personalities"
        description="Notable people from this district who shaped history, culture, science, and public life"
        backHref={base}
      >
        <LastUpdated updatedAt={data?.meta?.updatedAt} />
      </ModuleHeader>
      {(() => { const _src = getModuleSources("famous-personalities", state); return <DataSourceBanner moduleName="famous-personalities" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="famous-personalities" district={district} />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && (
        <>
          {/* Search + Filter bar */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search personalities…"
              style={{
                flex: 1, minWidth: 180, padding: "8px 12px",
                border: "1px solid #E8E8E4", borderRadius: 8,
                fontSize: 13, outline: "none", background: "#fff",
              }}
            />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["all", ...categories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  style={{
                    padding: "6px 12px", borderRadius: 20,
                    border: filter === cat ? "1px solid #2563EB" : "1px solid #E8E8E4",
                    background: filter === cat ? "#EFF6FF" : "#FAFAF8",
                    color: filter === cat ? "#2563EB" : "#6B6B6B",
                    fontSize: 12, fontWeight: filter === cat ? 600 : 400,
                    cursor: "pointer",
                  }}
                >
                  {cat === "all" ? "All" : `${CATEGORY_EMOJI[cat] ?? "🌟"} ${cat}`}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#9B9B9B", fontSize: 13 }}>
              No personalities found.
            </div>
          )}

          {/* Section 1: Born in district */}
          {bornHere.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <MapPin size={16} style={{ color: "#16A34A" }} />
                <SectionLabel>
                  Born in {districtLabel} ({bornHere.length})
                </SectionLabel>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                {bornHere.map((p) => (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  <PersonalityCard key={p.id} p={p as any} />
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Roots in / associated with district */}
          {rootsHere.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Star size={16} style={{ color: "#D97706" }} />
                <SectionLabel>
                  Associated with {districtLabel} ({rootsHere.length})
                </SectionLabel>
              </div>
              <p style={{ fontSize: 12, color: "#9B9B9B", marginBottom: 14 }}>
                These personalities have deep ties to {districtLabel} through their work, representation, or cultural impact — though born elsewhere.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                {rootsHere.map((p) => (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  <PersonalityCard key={p.id} p={p as any} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
