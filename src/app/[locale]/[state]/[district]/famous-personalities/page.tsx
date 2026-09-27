/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Famous Personalities — Design v3 "Civic Ledger" module page
// ═══════════════════════════════════════════════════════════════════════
//
//  PageHeader → AI summary → StatStrip → search + category Chips →
//  "Born in <district>" and "Associated with <district>" card grids →
//  SourcesFooter (Wikipedia, CC-BY-SA) → related news → Toolbar.
//
//  Avatars: the Wikipedia photo when there is one, otherwise the person's
//  initials with a Lucide icon for their category (no emoji).
//
"use client";
import { use, useState } from "react";
import Image from "next/image";
import {
  Star, ExternalLink, MapPin, Search, Share2, GitCompare,
  Landmark, FlaskConical, Palette, PenLine, Medal, Megaphone, Briefcase, Swords,
  Flower2, BookOpen, Clapperboard, Music,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useFamousPersonalities } from "@/hooks/useRealtimeData";
import {
  PageHeader, Section, Card, Pill, Chips, StatStrip, StatTile, LoadingShell, ErrorBlock,
  EmptyState, SourcesFooter, Toolbar, ToolbarButton,
} from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleNews from "@/components/district/ModuleNews";
import { getModuleSources } from "@/lib/constants/state-config";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

// Category → Lucide icon (shown on the initials avatar).
const CATEGORY_ICON: Record<string, LucideIcon> = {
  Politician:  Landmark,
  Scientist:   FlaskConical,
  Artist:      Palette,
  Writer:      PenLine,
  Athlete:     Medal,
  Activist:    Megaphone,
  Business:    Briefcase,
  Military:    Swords,
  Spiritual:   Flower2,
  Educator:    BookOpen,
  Film:        Clapperboard,
  Music:       Music,
  Other:       Star,
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
  const Icon = CATEGORY_ICON[category] ?? Star;

  if (photoUrl && !imgError) {
    return (
      <div
        style={{
          width: 72, height: 72, borderRadius: "var(--ftp-radius-tile)", flexShrink: 0,
          overflow: "hidden", border: "1px solid var(--ftp-border)", background: "var(--ftp-surface-2)",
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
      aria-hidden
      style={{
        width: 72, height: 72, borderRadius: "var(--ftp-radius-tile)", flexShrink: 0,
        background: "var(--ftp-surface-2)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 2,
        color: "var(--ftp-text-2)",
      }}
    >
      <Icon size={20} />
      <span className="ftp-num" style={{ fontSize: 11, color: "var(--ftp-text)" }}>{initials}</span>
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
          <h3 className="ftp-title">{p.name}</h3>
          {p.nameLocal && (
            <div lang="und" style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", marginTop: 2 }}>
              {p.nameLocal}
            </div>
          )}
          {/* Years + birthplace */}
          {p.birthYear && (
            <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 4 }}>
              <span className="ftp-num" style={{ fontWeight: 400 }}>
                {p.birthYear}{p.deathYear ? `–${p.deathYear}` : " – present"}
              </span>
              {p.birthPlace ? ` · ${p.birthPlace}` : ""}
            </div>
          )}
          {/* Notable for */}
          {p.notable && (
            <div style={{ marginTop: 6 }}>
              <Pill tone="brand" style={{ whiteSpace: "normal", height: "auto", minHeight: 24, padding: "2px 8px" }}>
                {p.notable}
              </Pill>
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
            fontSize: 13, color: "var(--ftp-brand)", textDecoration: "none",
          }}
        >
          <ExternalLink size={14} aria-hidden /> Read on Wikipedia
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
        source={{ label: "Wikipedia · CC-BY-SA" }}
      />
      <AIInsightCard module="famous-personalities" district={district} />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && (
        <>
          {personalities.length > 0 && (
            <StatStrip cols={3}>
              <StatTile label="Personalities" value={personalities.length} />
              <StatTile label={`Born in ${districtLabel}`} value={bornTotal} />
              <StatTile label="Fields" value={categories.length} sub="Politics, arts, science…" />
            </StatStrip>
          )}

          {/* Search + filter bar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, margin: "20px 0 4px" }}>
            <label style={{ position: "relative", display: "block" }}>
              <span className="sr-only">Search personalities</span>
              <Search
                size={16}
                aria-hidden
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ftp-text-2)" }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search personalities…"
                type="search"
                style={{
                  width: "100%", minHeight: 44, padding: "0 12px 0 36px",
                  border: "1px solid var(--ftp-border)", borderRadius: "var(--ftp-radius-tile)",
                  fontFamily: "var(--ftp-font-sans)", fontSize: 14,
                  color: "var(--ftp-text)", background: "var(--ftp-surface)",
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
                title={personalities.length === 0 ? `No personalities listed for ${districtLabel} yet.` : "No personalities found."}
                body={personalities.length === 0 ? undefined : "Try a different search or field."}
              />
            </div>
          )}

          {/* Section 1: Born in district */}
          {bornHere.length > 0 && (
            <Section
              title={
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <MapPin size={18} aria-hidden style={{ color: "var(--ftp-text-2)" }} />
                  Born in {districtLabel}{" "}
                  <span className="ftp-num" style={{ color: "var(--ftp-text-2)", fontWeight: 400 }}>({bornHere.length})</span>
                </span>
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
              title={
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Star size={18} aria-hidden style={{ color: "var(--ftp-text-2)" }} />
                  Associated with {districtLabel}{" "}
                  <span className="ftp-num" style={{ color: "var(--ftp-text-2)", fontWeight: 400 }}>({rootsHere.length})</span>
                </span>
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
