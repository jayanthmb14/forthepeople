/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Famous Personalities — Design v4 "Rang" module page (docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  PageHeader → AI summary → StatStrip of emoji tiles → the picture (an
//  "In simple words" line, a pictogram of how many were born here, and
//  one bar per field — all counted from the list below) → search + field
//  Chips → "Born in <district>" and "Associated with <district>" card
//  grids → SourcesFooter (Wikipedia, CC-BY-SA) → related news → Toolbar.
//
//  Avatars: the Wikipedia photo when there is one, otherwise a tile in the
//  page hue with the emoji for the person's field and their initials.
//
"use client";
import { use, useState } from "react";
import Image from "next/image";
import { ExternalLink, MapPin, Search, Share2, GitCompare, Star } from "lucide-react";
import { useFamousPersonalities } from "@/hooks/useRealtimeData";
import {
  PageHeader, Section, Card, Chips, StatStrip, StatTile, LoadingShell, ErrorBlock,
  EmptyState, ProgressBar, SourcesFooter, Toolbar, ToolbarButton,
} from "@/components/district/ui";
import { Explainer, Pictogram } from "@/components/district/visuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleNews from "@/components/district/ModuleNews";
import { getModuleSources } from "@/lib/constants/state-config";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

// Field → emoji (shown on the initials avatar and beside the field bars).
const CATEGORY_EMOJI: Record<string, string> = {
  Politician: "🏛️",
  Scientist:  "🔬",
  Artist:     "🎨",
  Writer:     "✍️",
  Athlete:    "🏅",
  Activist:   "📣",
  Business:   "💼",
  Military:   "🎖️",
  Spiritual:  "🙏",
  Educator:   "📚",
  Film:       "🎬",
  Music:      "🎵",
  Other:      "🌟",
};

/** Emoji for a field; unknown fields get the module star. */
function fieldEmoji(category: string): string {
  return CATEGORY_EMOJI[category] ?? "🌟";
}

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

  if (photoUrl && !imgError) {
    return (
      <div
        style={{
          width: 76, height: 76, borderRadius: 18, flexShrink: 0,
          overflow: "hidden",
          border: "2px solid color-mix(in srgb, var(--hue) 35%, #fff)",
          background: "var(--hue-tint)",
          boxShadow: "0 8px 18px -12px color-mix(in srgb, var(--hue) 80%, transparent)",
        }}
      >
        <Image
          src={photoUrl}
          alt={name}
          width={76}
          height={76}
          onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      style={{
        width: 76, height: 76, borderRadius: 18, flexShrink: 0,
        background: "linear-gradient(135deg, var(--hue-tint) 0%, color-mix(in srgb, var(--hue-pop) 50%, #fff) 100%)",
        border: "1px solid color-mix(in srgb, var(--hue) 25%, transparent)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 4,
      }}
    >
      <span className="ftp-emoji" style={{ fontSize: 26 }}>{fieldEmoji(category)}</span>
      <span className="ftp-display" style={{ fontSize: 12, lineHeight: "14px", fontWeight: 700, color: "var(--hue-deep)" }}>{initials}</span>
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
    <Card as="article" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header: avatar + name */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <PersonalityAvatar name={p.name} photoUrl={p.photoUrl} category={p.category} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="ftp-display" style={{ margin: 0, fontSize: 17, lineHeight: "23px", fontWeight: 650, color: "var(--ftp-text)" }}>{p.name}</h3>
          {p.nameLocal && (
            <div lang="und" style={{ fontSize: 14, lineHeight: "20px", color: "var(--hue-deep)", marginTop: 2 }}>
              {p.nameLocal}
            </div>
          )}
          {/* Years and birthplace */}
          {p.birthYear && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 4 }}>
              <span className="ftp-num" style={{ fontWeight: 500 }}>
                {p.birthYear}{p.deathYear ? `–${p.deathYear}` : " – present"}
              </span>
              {p.birthPlace && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <MapPin size={12} aria-hidden style={{ color: "var(--hue)" }} />
                  {p.birthPlace}
                </span>
              )}
            </div>
          )}
          {/* Notable for */}
          {p.notable && (
            <div style={{ marginTop: 8 }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "3px 10px",
                  borderRadius: 12,
                  background: "var(--hue-tint)",
                  color: "var(--hue-deep)",
                  fontSize: 12,
                  lineHeight: "18px",
                  fontWeight: 600,
                }}
              >
                {p.notable}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{p.bio}</p>

      {/* Wikipedia link */}
      {p.wikiUrl && (
        <a
          href={p.wikiUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, minHeight: 32,
            fontSize: 13, fontWeight: 600, color: "var(--hue-deep)", textDecoration: "none",
          }}
        >
          <ExternalLink size={14} aria-hidden style={{ color: "var(--hue)" }} /> Read on Wikipedia
        </a>
      )}

      {/* Photo credit */}
      {p.photoCredit && (
        <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
          Photo: {p.photoCredit}
        </div>
      )}
    </Card>
  );
}

/** Share button: the phone's share sheet when available, else copy the link. */
function SharePageButton() {
  const [copied, setCopied] = useState(false);
  function share() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: document.title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => {});
    }
  }
  return <ToolbarButton icon={Share2} onClick={share}>{copied ? "Link copied" : "Share"}</ToolbarButton>;
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
  const sources = getModuleSources("famous-personalities", state);

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bornTotal = personalities.filter((p) => (p as any).bornInDistrict === true).length;

  const districtLabel = district.charAt(0).toUpperCase() + district.slice(1).replace(/-/g, " ");
  const gridCols = "repeat(auto-fill, minmax(min(300px, 100%), 1fr))";

  // The picture: people per field, biggest first (counted from the list).
  const fieldCounts = categories
    .map((cat) => ({ category: cat, count: personalities.filter((p) => p.category === cat).length }))
    .sort((a, b) => b.count - a.count);
  const topFields = fieldCounts.slice(0, 3).map((f) => f.category);
  const bornOfTen = personalities.length > 0 ? (bornTotal / personalities.length) * 10 : 0;
  // A "N of every 10" picture needs a few people behind it.
  const showPicture = personalities.length >= 3;

  return (
    <div className="ftp-container" style={{ maxWidth: "var(--ftp-reading-max)", margin: 0, paddingTop: 24, paddingBottom: 48 }}>
      <PageHeader
        icon={Star}
        title="Famous Personalities"
        description="Notable people from this district who shaped history, culture, science, and public life"
        backHref={base}
        accent={getModuleAccent("famous-personalities")}
        // The data date of the list (not the time the page was served).
        freshness={data?.meta?.lastUpdated ? { asOf: data.meta.lastUpdated } : undefined}
        source={{ label: "Wikipedia (CC-BY-SA)" }}
      />
      <AIInsightCard module="famous-personalities" district={district} />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && (
        <>
          {personalities.length > 0 && (
            <StatStrip cols={3}>
              <StatTile emoji="🌟" label="Personalities" value={personalities.length} />
              <StatTile emoji="🏡" label={`Born in ${districtLabel}`} value={bornTotal} />
              <StatTile
                emoji="🧭"
                label="Fields"
                value={categories.length}
                sub={topFields.length > 0 ? topFields.join(", ") : undefined}
              />
            </StatStrip>
          )}

          {showPicture && (
            <div className="ftp-picture-row" style={{ marginTop: 16 }}>
              <Card tinted padding={18}>
                <Explainer title="In simple words" emoji="🌟">
                  We list <strong className="ftp-num">{personalities.length}</strong> well-known people linked to {districtLabel}, and{" "}
                  <strong className="ftp-num">{bornTotal}</strong> of them {bornTotal === 1 ? "was" : "were"} born here.
                </Explainer>
                <Pictogram
                  filled={bornOfTen}
                  emoji="🧑"
                  label={`About ${Math.round(bornOfTen)} of every 10 people listed here were born in ${districtLabel}.`}
                />
              </Card>
              <Card tinted padding={18}>
                <p className="ftp-display" style={{ margin: "0 0 12px", fontSize: 16, lineHeight: "22px", fontWeight: 650, color: "var(--hue-deep)" }}>
                  What they are known for
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {fieldCounts.slice(0, 5).map((f) => (
                    <div key={f.category} style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                      <span className="ftp-emoji" aria-hidden style={{ fontSize: 18, marginBottom: 1 }}>{fieldEmoji(f.category)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <ProgressBar value={f.count} max={personalities.length} label={`${f.category} (${f.count})`} height={8} />
                      </div>
                    </div>
                  ))}
                </div>
                {fieldCounts.length > 5 && (
                  <p style={{ margin: "10px 0 0", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                    {fieldCounts.length - 5} more {fieldCounts.length - 5 === 1 ? "field" : "fields"} in the filter below.
                  </p>
                )}
              </Card>
            </div>
          )}

          {/* Search + filter bar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, margin: "20px 0 4px" }}>
            <label style={{ position: "relative", display: "block" }}>
              <span className="sr-only">Search personalities</span>
              <Search
                size={16}
                aria-hidden
                style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--hue)" }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search personalities…"
                type="search"
                style={{
                  width: "100%", minHeight: 46, padding: "0 14px 0 40px",
                  border: "1px solid color-mix(in srgb, var(--hue) 25%, var(--ftp-border))", borderRadius: 999,
                  fontFamily: "var(--ftp-font-sans)", fontSize: 14,
                  color: "var(--ftp-text)", background: "var(--ftp-surface)",
                  boxShadow: "var(--ftp-shadow-1)",
                }}
              />
            </label>
            {categories.length > 0 && (
              <Chips
                label="Filter by field"
                value={filter}
                onChange={setFilter}
                items={[
                  { value: "all", label: "All", count: personalities.length },
                  ...categories.map((cat) => ({
                    value: cat,
                    label: cat,
                    count: personalities.filter((p) => p.category === cat).length,
                  })),
                ]}
              />
            )}
          </div>

          {filtered.length === 0 && (
            <div style={{ marginTop: 20 }}>
              <EmptyState
                emoji={personalities.length === 0 ? "🌟" : "🔍"}
                title={personalities.length === 0 ? `No personalities listed for ${districtLabel} yet.` : "No personalities found."}
                body={personalities.length === 0 ? undefined : "Try a different search or field."}
              />
            </div>
          )}

          {/* Section 1: Born in district */}
          {bornHere.length > 0 && (
            <Section
              emoji="🏡"
              title={
                <>
                  Born in {districtLabel}{" "}
                  <span className="ftp-num" style={{ color: "var(--ftp-text-2)", fontWeight: 400 }}>({bornHere.length})</span>
                </>
              }
            >
              <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 12 }}>
                {bornHere.map((p) => (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  <PersonalityCard key={p.id} p={p as any} />
                ))}
              </div>
            </Section>
          )}

          {/* Section 2: Roots in / associated with district */}
          {rootsHere.length > 0 && (
            <Section
              emoji="🔗"
              title={
                <>
                  Associated with {districtLabel}{" "}
                  <span className="ftp-num" style={{ color: "var(--ftp-text-2)", fontWeight: 400 }}>({rootsHere.length})</span>
                </>
              }
            >
              <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 12 }}>
                These personalities have deep ties to {districtLabel} through their work, representation, or cultural impact — though born elsewhere.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 12 }}>
                {rootsHere.map((p) => (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  <PersonalityCard key={p.id} p={p as any} />
                ))}
              </div>
            </Section>
          )}
        </>
      )}

      <SourcesFooter
        sources={sources.sources.map((name) => ({ name, url: "https://en.wikipedia.org", frequency: sources.frequency }))}
      />
      <ModuleNews district={district} state={state} locale={locale} module="famous-personalities" />
      <Toolbar>
        <SharePageButton />
        <ToolbarButton icon={GitCompare} href={`/${locale}/compare?module=famous-personalities&a=${district}`}>
          Compare with another district
        </ToolbarButton>
      </Toolbar>
    </div>
  );
}
