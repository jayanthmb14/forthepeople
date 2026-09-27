/**
 * ForThePeople.in — District Leadership page (5-tier hierarchy).
 *
 *   T1 NATIONAL          — President, Prime Minister
 *   T2 STATE             — Governor, Chief Minister, key state ministers
 *   T3 DISTRICT ADMIN    — Collector, SP, ZP CEO  (IAS / IPS — no party)
 *   T4 ELECTED REPS      — MP + MLAs (party + constituency)
 *   T5 MUNICIPAL & DEPT  — Mayor, Municipal Commissioner, dept heads
 *
 * Data is grouped in the page from the existing Leader.tier column. No
 * tier-to-people mapping is hardcoded in the UI — anything tagged tier=N
 * lands in the corresponding section. Adding a district just means seeding
 * leaders with the right tier numbers.
 *
 * Design v4 "Rang" (docs/DESIGN-SYSTEM.md): PageHeader → notes → StatStrip
 * of emoji tiles → the picture ("In simple words" + how many people sit at
 * each level, as bars that grow in) → one emoji Section per tier →
 * elections (in the elections hue) → SourcesFooter → ModuleNews → Toolbar.
 * Accents read the page hue (--hue …); party colour still appears only as a
 * 6 px dot inside a neutral pill. Data logic is unchanged from v2.
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use, useState } from "react";
import Image from "next/image";
import {
  Users, Phone, Mail, Info,
  AlertTriangle, ChevronDown, ChevronRight, MapPin, Download, Share2, ArrowLeftRight,
} from "lucide-react";
import { useLeaders, useAIInsight } from "@/hooks/useRealtimeData";
import type { Leader } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  Pill,
  LoadingShell,
  ErrorBlock,
  EmptyState,
  AIInsightBanner,
  SourcesFooter,
  Toolbar,
  ToolbarButton,
} from "@/components/district/ui";
import { Explainer } from "@/components/district/visuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleDisclaimer from "@/components/common/ModuleDisclaimer";
import { getModuleSources } from "@/lib/constants/state-config";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { hueClass } from "@/lib/design/hues";
import { getPartyColor } from "@/lib/constants/party-colors";
import { getRoleDescription } from "@/lib/constants/role-descriptions";
import ElectionSection, { findActiveElection, type ElectionEvent } from "@/components/district/ElectionSection";
import LiveElectionBanner from "@/components/district/LiveElectionBanner";
import ModuleNews from "@/components/district/ModuleNews";
import MobileHint from "@/components/common/MobileHint";
import { useQuery } from "@tanstack/react-query";
import knDict from "@/dictionaries/kn.json";

/** Official websites for the sources named by getModuleSources("leadership"). */
const SOURCE_URLS: Record<string, string> = {
  "Election Commission of India (ECI)": "https://eci.gov.in",
};

interface TierMeta {
  label: string;
  /** Short name for the levels picture ("Country", "State", …). */
  short: string;
  emoji: string;
  hint: string;
}
const TIER_META: Record<number, TierMeta> = {
  1: { label: "National leadership", short: "Country", emoji: "🏛️", hint: "Heads of state and government" },
  2: { label: "State leadership", short: "State", emoji: "🗺️", hint: "Governor, Chief Minister and key state ministers" },
  3: { label: "District administration", short: "District officers", emoji: "🏢", hint: "IAS / IPS officers running the district day-to-day" },
  4: { label: "Elected representatives", short: "MP and MLAs", emoji: "🗳️", hint: "MP and MLAs elected by citizens of this district" },
  5: { label: "Municipal and department heads", short: "City and departments", emoji: "🏙️", hint: "Mayor, municipal commissioner and department officers" },
};
function tierMeta(t: number): TierMeta {
  return TIER_META[t] ?? { label: `Tier ${t}`, short: `Tier ${t}`, emoji: "👥", hint: "" };
}

function formatVerifiedDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return null; }
}

function leaderProvenance(l: { source?: string | null; lastVerifiedAt?: string | null }): string {
  const verified = formatVerifiedDate(l.lastVerifiedAt);
  const src = (l.source ?? "").toLowerCase();
  if (src.startsWith("http")) return verified ? `Updated from news. Last verified: ${verified}` : "Updated from news";
  if (src.includes("manual-research")) return verified ? `Manually researched. Last verified: ${verified}` : "Manually researched";
  if (src.includes("seed") || src === "" || src === "manual" || !src) {
    return verified ? `Added from seed data. Last verified: ${verified}` : "Added from seed data";
  }
  return verified ? `Last verified: ${verified}` : "Verification pending";
}

const ATTRIBUTION_TOOLTIP = "As last reported in news media. Political positions and party affiliations change frequently — verify on the official district website.";

/** Turn rows into a CSV file and start a download in the browser. */
function downloadCsv(filename: string, rows: Array<Record<string, string | number | null | undefined>>) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Phone and email links: a hue pill, 32 px tall (44 px on phones via ftp-chip). */
const CONTACT_LINK: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "0 12px",
  borderRadius: "var(--ftp-radius-pill)",
  background: "var(--hue-tint)",
  border: "1px solid color-mix(in srgb, var(--hue) 22%, transparent)",
  color: "var(--hue-deep)",
  fontSize: 13,
  lineHeight: "20px",
  fontWeight: 500,
  textDecoration: "none",
};

/**
 * The page's picture: one bar per level of government, as long as the
 * number of people listed at that level (longest = most people). Bars grow
 * in once; the numbers are the same counts as the sections below.
 */
function LevelsPicture({ tiers, counts }: { tiers: number[]; counts: Record<number, number> }) {
  const max = Math.max(1, ...tiers.map((t) => counts[t] ?? 0));
  const summary = tiers.map((t) => `${tierMeta(t).short}: ${counts[t] ?? 0}`).join(", ");
  return (
    <figure style={{ margin: 0 }}>
      <div role="img" aria-label={`People listed at each level. ${summary}.`} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tiers.map((t, i) => {
          const m = tierMeta(t);
          const n = counts[t] ?? 0;
          return (
            <div
              key={t}
              aria-hidden
              style={{ display: "grid", gridTemplateColumns: "26px minmax(0, 9.5em) minmax(40px, 1fr) 2.5em", alignItems: "center", gap: 10 }}
            >
              <span className="ftp-emoji" style={{ fontSize: 20, textAlign: "center" }}>{m.emoji}</span>
              <span style={{ fontSize: 13, lineHeight: "18px", color: "var(--ftp-text)" }}>{m.short}</span>
              <span
                style={{
                  display: "block",
                  height: 12,
                  borderRadius: "var(--ftp-radius-pill)",
                  background: "color-mix(in srgb, var(--hue-tint) 70%, var(--ftp-surface-2))",
                  overflow: "hidden",
                }}
              >
                <span
                  className="ftp-grow-x"
                  style={{
                    display: "block",
                    width: `${(n / max) * 100}%`,
                    height: "100%",
                    borderRadius: "var(--ftp-radius-pill)",
                    background: "linear-gradient(90deg, var(--hue-pop), var(--hue))",
                    ["--i" as string]: i,
                  }}
                />
              </span>
              <span className="ftp-num" style={{ fontSize: 15, color: "var(--hue-deep)", textAlign: "right" }}>{n}</span>
            </div>
          );
        })}
      </div>
      <figcaption style={{ marginTop: 10, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
        How many people are listed at each level, from the whole country at the top to your town at the bottom.
      </figcaption>
    </figure>
  );
}

function RoleDescription({ text }: { text: string }) {
  // Tap to toggle full text on mobile; desktop also gets clickable expand
  // for accessibility (the title attribute is kept as a hover affordance).
  const [open, setOpen] = useState(false);
  const Chevron = open ? ChevronDown : ChevronRight;
  return (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      title={text}
      style={{
        background: "transparent", border: "none", padding: 0, margin: "4px 0 0",
        textAlign: "left", cursor: "pointer", color: "var(--ftp-text-2)", font: "inherit",
        fontSize: 11, lineHeight: "16px", width: "100%",
        display: "flex", alignItems: "flex-start", gap: 4,
      }}
      aria-expanded={open}
    >
      <Chevron size={12} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
      <span
        style={open ? undefined : {
          display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 1,
          overflow: "hidden", textOverflow: "ellipsis",
        }}
      >
        {text}
      </span>
    </button>
  );
}

/** Photo when we have one; otherwise the person's initials on a quiet disc. */
function LeaderAvatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  const [imgError, setImgError] = useState(false);
  const isPlaceholder = name.startsWith("[");
  const initials = isPlaceholder
    ? "?"
    : name.split(/\s+/).map((w) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();

  const ring: React.CSSProperties = {
    width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
    overflow: "hidden", border: "2px solid color-mix(in srgb, var(--hue) 28%, #fff)",
  };
  if (photoUrl && !imgError) {
    return (
      <div style={ring}>
        <Image src={photoUrl} alt={name} width={56} height={56}
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
        ...ring,
        background: "var(--hue-tint)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--ftp-font-display)", fontSize: 18, fontWeight: 650, color: "var(--hue-deep)",
      }}
    >
      {initials}
    </div>
  );
}

function LeaderCard({ l, inElectionPeriod }: { l: Leader; inElectionPeriod?: boolean }) {
  const tone = getPartyColor(l.party);
  const isPlaceholderName = l.name.startsWith("[");
  const desc = l.roleDescription ?? getRoleDescription(l.role);

  return (
    <Card as="article" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <LeaderAvatar name={l.name} photoUrl={l.photoUrl} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            className="ftp-title"
            style={{
              color: isPlaceholderName ? "var(--ftp-text-2)" : "var(--ftp-text)",
              fontStyle: isPlaceholderName ? "italic" : "normal",
            }}
          >
            {l.name}
          </h3>
          {l.nameLocal && !isPlaceholderName && (
            <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", fontFamily: "var(--font-regional)" }}>
              {l.nameLocal}
            </div>
          )}
          <div className="ftp-body" style={{ color: "var(--ftp-text)", marginTop: 2 }}>{l.role}</div>
          {desc && <RoleDescription text={desc} />}
          {l.constituency && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 4 }}>
              <MapPin size={12} aria-hidden /> {l.constituency}
            </div>
          )}
          {l.party && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
              {/* Party colour appears only as the 6 px dot. */}
              <Pill>
                <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: tone.border, flexShrink: 0 }} />
                <MobileHint hint={ATTRIBUTION_TOOLTIP}>
                  <span>{l.party}</span>
                </MobileHint>
              </Pill>
              {inElectionPeriod && (
                <Pill tone="warn" icon={AlertTriangle} title="Active election period — affiliations may change after results">
                  Election period
                </Pill>
              )}
            </div>
          )}
        </div>
      </div>

      {(l.phone || l.email) && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 10, borderTop: "1px solid var(--ftp-border)" }}>
          {l.phone && (
            <a href={`tel:${l.phone}`} className="ftp-chip" style={CONTACT_LINK}>
              <Phone size={14} aria-hidden /> <span className="ftp-num">{l.phone}</span>
            </a>
          )}
          {l.email && (
            <a href={`mailto:${l.email}`} className="ftp-chip" style={CONTACT_LINK}>
              <Mail size={14} aria-hidden /> Email
            </a>
          )}
        </div>
      )}

      <div style={{ marginTop: "auto", paddingTop: 4, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
        {leaderProvenance(l)}
      </div>
    </Card>
  );
}

function TierSection({ tier, leaders, inElectionPeriod }: { tier: number; leaders: Leader[]; inElectionPeriod?: boolean }) {
  const meta = tierMeta(tier);
  return (
    <div style={{ marginTop: 8 }}>
      <Section title={meta.label} emoji={meta.emoji}>
        {meta.hint && (
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "-4px 0 12px" }}>{meta.hint}</p>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))",
            gap: 12,
          }}
        >
          {leaders.map((l) => <LeaderCard key={l.id} l={l} inElectionPeriod={inElectionPeriod} />)}
        </div>
      </Section>
    </div>
  );
}

function LeadershipPageInner({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string }>;
}) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useLeaders(district, state);
  const { data: aiInsight } = useAIInsight(district, "leadership");
  const leaders: Leader[] = data?.data ?? [];
  const [shareNote, setShareNote] = useState<string | null>(null);

  // Used for the election-period top banner + per-card "Election period" badge.
  const { data: electionsData } = useQuery<{ data: ElectionEvent[] }>({
    queryKey: ["elections", state],
    queryFn: () => fetch(`/api/data/election-events?state=${state}`).then((r) => r.json()),
    staleTime: 5 * 60_000,
  });
  const liveElection = findActiveElection(electionsData?.data);
  const inElectionPeriod = liveElection != null;

  // Group by tier; sort cards within a tier by importance heuristics
  // (President before PM, Governor before CM, MP before MLAs).
  const ROLE_ORDER: Array<RegExp> = [
    /^president\b/i,
    /^prime minister/i,
    /^governor/i,
    /^chief minister/i,
    /^deputy chief minister/i,
    /\bunion minister\b|\bmp\b|member of parliament/i,
    /^district collector|deputy commissioner/i,
    /^superintendent of police|commissioner of police/i,
    /^ceo/i,
    /^mla\b|member of legislative/i,
    /^mayor/i,
    /^municipal commissioner/i,
  ];
  function rank(role: string): number {
    for (let i = 0; i < ROLE_ORDER.length; i++) if (ROLE_ORDER[i].test(role)) return i;
    return ROLE_ORDER.length + 1;
  }

  // Deduplicate leaders by name (case-insensitive) within the same tier.
  // Catches duplicates like "Narendra Modi / Prime Minister / BJP" vs
  // "Narendra Modi / Prime Minister of India / Bharatiya Janata Party".
  // Also filters out entries where the name is just a role echo (e.g. name="Prime Minister").
  const ROLE_WORDS = /^(prime minister|president|governor|chief minister|minister|mla|mp|speaker|collector|commissioner|mayor|judge|officer|secretary|chairman|director)/i;
  const deduped = leaders
    .filter((l) => !ROLE_WORDS.test(l.name.trim()) || l.name.includes(" ") && l.name.split(/\s+/).length > 2)
    .filter((l, i, arr) =>
      arr.findIndex((x) =>
        x.name.toLowerCase() === l.name.toLowerCase() && x.tier === l.tier
      ) === i
    );

  const byTier = deduped.reduce((acc: Record<number, Leader[]>, l) => {
    (acc[l.tier] ??= []).push(l);
    return acc;
  }, {});
  const tiers = Object.keys(byTier).map(Number).sort((a, b) => a - b);
  for (const t of tiers) byTier[t].sort((a, b) => rank(a.role) - rank(b.role) || a.name.localeCompare(b.name));

  // Freshness = the most recent "last verified" date across all leaders.
  const asOf = leaders.reduce<string | null>(
    (best, l) => (l.lastVerifiedAt && (!best || l.lastVerifiedAt > best) ? l.lastVerifiedAt : best),
    null
  );
  const src = getModuleSources("leadership", state);
  // Local-script title comes from the dictionary (Kannada only for now).
  const titleLocal = state === "karnataka" ? knDict.modules.leadership : undefined;

  const onShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "District Leadership", url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareNote("Link copied");
        setTimeout(() => setShareNote(null), 2000);
      }
    } catch {
      /* The visitor closed the share sheet — nothing to do. */
    }
  };

  const onCsv = () =>
    downloadCsv(
      `${district}-leadership.csv`,
      deduped.map((l) => ({
        tier: tierMeta(l.tier).label,
        name: l.name,
        role: l.role,
        party: l.party ?? "",
        constituency: l.constituency ?? "",
        last_verified: l.lastVerifiedAt ?? "",
      }))
    );

  return (
    <div className="module-page" style={{ padding: 24, maxWidth: "var(--ftp-reading-max)" }}>
      <PageHeader
        icon={Users}
        accent={getModuleAccent("leadership")}
        title="District Leadership"
        titleLocal={titleLocal}
        description="Who governs this district — from the President down to your MLA"
        backHref={base}
        freshness={asOf ? { asOf } : undefined}
        source={{ label: "ECI", href: SOURCE_URLS["Election Commission of India (ECI)"] }}
      />
      {aiInsight && (
        <div style={{ marginBottom: 16 }}>
          <AIInsightBanner
            headline={aiInsight.headline}
            summary={aiInsight.summary}
            sentiment={aiInsight.sentiment}
            confidence={aiInsight.confidence}
            sourceUrls={aiInsight.sourceUrls}
            createdAt={aiInsight.createdAt}
          />
        </div>
      )}

      <ModuleDisclaimer
        text="Leader information is sourced from publicly available government records (Election Commission of India, state assembly websites, and district administration portals) and may have delays. For official verification, always refer to the original source."
      />

      <p role="note" className="ftp-body" style={{ display: "flex", alignItems: "flex-start", gap: 8, color: "var(--ftp-text-2)", marginBottom: 16 }}>
        <Info size={14} aria-hidden style={{ flexShrink: 0, marginTop: 3 }} />
        <span>
          Leadership data reflects the latest available information. Political positions and party affiliations change frequently. Verify current officeholders at the official district administration website.
        </span>
      </p>

      <LiveElectionBanner stateSlug={state} leadershipHref={base + "/leadership"} />

      {inElectionPeriod && liveElection && (
        <div role="alert" style={{ marginBottom: 16 }}>
          <Card padding={14}>
            <div className="ftp-body" style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "var(--ftp-text)" }}>
              <AlertTriangle size={16} aria-hidden style={{ color: "var(--ftp-danger)", flexShrink: 0, marginTop: 2 }} />
              <span>
                <span style={{ fontWeight: 600, color: "var(--ftp-danger)" }}>Election period:</span>{" "}
                This district is currently in an active election period ({liveElection.label}).
                Leadership positions and party affiliations may change following the election results
                {liveElection.resultDate ? ` on ${new Date(liveElection.resultDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}` : ""}.
                ForThePeople.in is not affiliated with any political party and does not endorse any candidate.
              </span>
            </div>
          </Card>
        </div>
      )}

      <AIInsightCard module="leaders" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && leaders.length === 0 && (
        <EmptyState
          emoji="👥"
          title="No leadership data yet"
          body="Data on elected representatives and officials for this district will be updated soon."
        />
      )}

      {deduped.length > 0 && (
        <StatStrip cols={3}>
          <StatTile emoji="👥" label="People listed" value={deduped.length} asOf={asOf} />
          <StatTile emoji="🗳️" label="Elected representatives" value={byTier[4]?.length ?? 0} sub="MP and MLAs" asOf={asOf} />
          <StatTile emoji="🏢" label="District officers" value={byTier[3]?.length ?? 0} sub="IAS / IPS" asOf={asOf} />
        </StatStrip>
      )}

      {/* The picture: one plain sentence with the real counts, and a bar
          per level (drawn only when there are at least two levels). */}
      {deduped.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Card tinted padding={18}>
            <Explainer title="In simple words" emoji="🧭">
              <strong className="ftp-num">{deduped.length}</strong> people are listed here, at{" "}
              <strong className="ftp-num">{tiers.length}</strong> {tiers.length === 1 ? "level" : "levels"} of government.
              {(byTier[4]?.length ?? 0) > 0 && (
                <>
                  {" "}<strong className="ftp-num">{byTier[4].length}</strong> of them are the MP and MLAs that voters of this district elected.
                </>
              )}
              {(byTier[3]?.length ?? 0) > 0 && (
                <>
                  {" "}<strong className="ftp-num">{byTier[3].length}</strong> are officers who run the district day to day.
                </>
              )}
            </Explainer>
            {tiers.length > 1 && (
              <LevelsPicture
                tiers={tiers}
                counts={Object.fromEntries(tiers.map((t) => [t, byTier[t].length]))}
              />
            )}
          </Card>
        </div>
      )}

      {tiers.map((t) => (
        <TierSection key={t} tier={t} leaders={byTier[t]} inElectionPeriod={inElectionPeriod} />
      ))}

      {/* Election dates wear the Elections module's own hue. */}
      <div className={hueClass("elections")}>
        <ElectionSection stateSlug={state} />
      </div>

      {leaders.length > 0 && (
        <div role="note" style={{ marginTop: 28 }}>
          <Card>
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>
              <span style={{ fontWeight: 600, color: "var(--hue-deep)" }}>Note on political affiliations:</span>{" "}
              Political party affiliations shown are as last reported and may not reflect current affiliations due to party
              changes, cabinet reshuffles, or elections. Government officers (IAS, IPS) carry no party. ForThePeople.in does
              not endorse or oppose any political party or individual.
            </p>
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 12 }}>
              <span style={{ fontWeight: 600, color: "var(--hue-deep)" }}>On bureaucrat names:</span>{" "}
              IAS/IPS officer names change with transfers and may not reflect the most recent postings. Verify current
              district officers at the official district website.
            </p>
          </Card>
        </div>
      )}

      <SourcesFooter sources={src.sources.map((name) => ({ name, url: SOURCE_URLS[name], frequency: src.frequency }))} />
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", fontSize: 11, lineHeight: "16px", marginTop: 8 }}>
        ForThePeople.in is NOT an official government website. Data aggregated from publicly available government portals under India&apos;s Open Data Policy (NDSAP).
      </p>

      <ModuleNews district={district} state={state} locale={locale} module="leaders" />

      <Toolbar>
        <ToolbarButton icon={Download} onClick={onCsv} disabled={deduped.length === 0}>
          Download CSV
        </ToolbarButton>
        <ToolbarButton icon={Share2} onClick={onShare}>
          {shareNote ?? "Share"}
        </ToolbarButton>
        <ToolbarButton icon={ArrowLeftRight} href={`/${locale}/compare?module=leadership&a=${district}`}>
          Compare with another district
        </ToolbarButton>
      </Toolbar>
    </div>
  );
}

export default function LeadershipPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Leadership">
      <LeadershipPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
