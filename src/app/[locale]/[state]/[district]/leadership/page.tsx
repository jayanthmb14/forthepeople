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
 * Design v4 "Rang" (docs/DESIGN-SYSTEM.md): PageHeader → one note → StatStrip
 * of emoji tiles → the pictures ("In simple words" + how many people sit at
 * each level, as bars that grow in; then a ring of the elected
 * representatives by party) → one emoji Section per tier → elections (in
 * the elections hue) → SourcesFooter → ModuleNews → Toolbar.
 * Accents read the page hue (--hue …); party colour still appears only as a
 * 6 px dot inside a neutral pill. Data logic is unchanged from v2.
 *
 * Language: interface text comes from the "page_leadership" namespace.
 * Names, roles, parties and constituencies are records and are shown as
 * stored (the local-script role is shown when it is in the reader's
 * language). Role descriptions come from messages (`roles.<id>`), with a
 * description stored on the record taking priority.
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
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
import { ChartCard, Explainer } from "@/components/district/visuals";
import { HueDonut } from "@/components/district/civic/HueDonut";
import AIInsightCard from "@/components/common/AIInsightCard";
import { getModuleSources } from "@/lib/constants/state-config";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { hueClass } from "@/lib/design/hues";
import { getPartyColor } from "@/lib/constants/party-colors";
import { getRoleDescriptionId, getRoleDescriptionIdForText } from "@/lib/constants/role-descriptions";
import ElectionSection, { findActiveElection, type ElectionEvent } from "@/components/district/ElectionSection";
import ModuleNews from "@/components/district/ModuleNews";
import MobileHint from "@/components/common/MobileHint";
import { useFormat, useModuleText } from "@/i18n/client";
import { scriptLang } from "@/lib/utils/script-lang";
import { useQuery } from "@tanstack/react-query";
import knDict from "@/dictionaries/kn.json";

type T = ReturnType<typeof useTranslations>;

/** Official websites for the sources named by getModuleSources("leadership"). */
const SOURCE_URLS: Record<string, string> = {
  "Election Commission of India (ECI)": "https://eci.gov.in",
};
/** Source names and update frequencies from getModuleSources() that have a translation. */
const SOURCE_KEY: Record<string, string> = { "District Administration": "districtAdministration" };
const FREQ_KEY: Record<string, string> = { "When the source publishes": "whenPublished" };

/** One emoji per level of government. */
const TIER_EMOJI: Record<number, string> = { 1: "🏛️", 2: "🗺️", 3: "🏢", 4: "🗳️", 5: "🏙️" };

interface TierMeta {
  label: string;
  /** Short name for the levels picture ("Country", "State", …). */
  short: string;
  emoji: string;
  hint: string;
}
function tierMeta(tier: number, t: T): TierMeta {
  if (TIER_EMOJI[tier]) {
    return {
      label: t(`tiers.${tier}.label`),
      short: t(`tiers.${tier}.short`),
      emoji: TIER_EMOJI[tier],
      hint: t(`tiers.${tier}.hint`),
    };
  }
  return { label: t("tiers.other.label", { n: tier }), short: t("tiers.other.short", { n: tier }), emoji: "👥", hint: "" };
}

/** Where a leader's record came from, and when it was last checked. */
function leaderProvenance(l: { source?: string | null; lastVerifiedAt?: string | null }, t: T, fmtDate: (iso: string) => string): string {
  let date: string | null = null;
  if (l.lastVerifiedAt && !Number.isNaN(new Date(l.lastVerifiedAt).getTime())) date = fmtDate(l.lastVerifiedAt);
  const src = (l.source ?? "").toLowerCase();
  if (src.startsWith("http")) return date ? t("provenance.newsVerified", { date }) : t("provenance.news");
  if (src.includes("manual-research")) return date ? t("provenance.researchVerified", { date }) : t("provenance.research");
  if (src.includes("seed") || src === "" || src === "manual" || !src) {
    return date ? t("provenance.seedVerified", { date }) : t("provenance.seed");
  }
  return date ? t("provenance.verified", { date }) : t("provenance.pending");
}

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
 * Picture 1: one bar per level of government, as long as the number of
 * people listed at that level (longest = most people). Bars grow in once;
 * the numbers are the same counts as the sections below.
 */
function LevelsPicture({ tiers, counts }: { tiers: number[]; counts: Record<number, number> }) {
  const t = useTranslations("page_leadership");
  const f = useFormat();
  const max = Math.max(1, ...tiers.map((tier) => counts[tier] ?? 0));
  const summary = tiers.map((tier) => `${tierMeta(tier, t).short}: ${f.number(counts[tier] ?? 0)}`).join(", ");
  return (
    <figure style={{ margin: 0 }}>
      <div role="img" aria-label={t("levelsAria", { summary })} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tiers.map((tier, i) => {
          const m = tierMeta(tier, t);
          const n = counts[tier] ?? 0;
          return (
            <div
              key={tier}
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
              <span className="ftp-num" style={{ fontSize: 15, color: "var(--hue-deep)", textAlign: "right" }}>{f.number(n)}</span>
            </div>
          );
        })}
      </div>
      <figcaption style={{ marginTop: 10, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
        {t("levelsCaption")}
      </figcaption>
    </figure>
  );
}

/**
 * Picture 2: the elected representatives (tier 4) by party, as last
 * reported. Drawn only when at least two representatives are listed; a
 * ring of one person says nothing.
 */
function PartyRing({ reps, asOf }: { reps: Leader[]; asOf: string | null }) {
  const t = useTranslations("page_leadership");
  const f = useFormat();
  if (reps.length < 2) return null;
  const counts = new Map<string, number>();
  for (const l of reps) {
    const party = l.party?.trim() || "";
    counts.set(party, (counts.get(party) ?? 0) + 1);
  }
  const slices = [...counts.entries()]
    .map(([party, value]) => ({
      key: party || "__none",
      label: party || t("partyNone"),
      value,
    }))
    .sort((a, b) => b.value - a.value);
  const parties = slices.filter((s) => s.key !== "__none").length;
  // No party recorded for anyone: nothing honest to draw.
  if (parties === 0) return null;
  const summary = slices.map((s) => `${s.label}: ${f.number(s.value)}`).join(", ");
  return (
    <div style={{ marginTop: 16 }}>
      <ChartCard
        title={t("partyTitle")}
        emoji="🗳️"
        units={t("partyUnits")}
        simple={t("partySimple", { n: f.number(reps.length), parties })}
        asOf={asOf}
        source={{ label: "ECI", href: SOURCE_URLS["Election Commission of India (ECI)"] }}
        table={slices.map((s) => ({ label: s.label, value: f.number(s.value) }))}
      >
        <HueDonut
          slices={slices}
          centerValue={f.number(reps.length)}
          centerLabel={t("partyCenter")}
          ariaLabel={t("partyAria", { summary })}
          otherLabel={t("partyOther")}
        />
      </ChartCard>
    </div>
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

function LeaderCard({ l, inElectionPeriod, emoji }: { l: Leader; inElectionPeriod?: boolean; emoji: string }) {
  const t = useTranslations("page_leadership");
  const f = useFormat();
  const tone = getPartyColor(l.party);
  const isPlaceholderName = l.name.startsWith("[");
  // A description stored on the record wins; when it is the standard text
  // for the role (the seed copies it), its translation is shown instead.
  const stored = l.roleDescription?.trim() || null;
  const roleId = stored ? getRoleDescriptionIdForText(stored) : getRoleDescriptionId(l.role);
  const desc = roleId && t.has(`roles.${roleId}`) ? t(`roles.${roleId}`) : stored ?? t("roleFallback");
  // The local-script role (e.g. ಜಿಲ್ಲಾಧಿಕಾರಿ) replaces the English one when it is in the reader's language.
  const role = l.roleLocal && scriptLang(l.roleLocal) === f.locale ? l.roleLocal : l.role;
  const fmtDate = (iso: string) => f.date(iso, { day: "2-digit", month: "short", year: "numeric" });

  return (
    <Card as="article" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <LeaderAvatar name={l.name} photoUrl={l.photoUrl} />
          {/* The level's emoji as a small badge on the avatar. */}
          <span
            className="ftp-icon-chip ftp-emoji"
            aria-hidden
            style={{ position: "absolute", right: -4, bottom: -4, width: 24, height: 24, fontSize: 13, borderRadius: 8, border: "2px solid var(--ftp-surface)" }}
          >
            {emoji}
          </span>
        </div>
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
            <div lang={scriptLang(l.nameLocal)} style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", fontFamily: "var(--font-regional)" }}>
              {l.nameLocal}
            </div>
          )}
          <div className="ftp-body" lang={role === l.roleLocal ? scriptLang(role) : undefined} style={{ color: "var(--ftp-text)", marginTop: 2 }}>
            {role}
          </div>
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
                <MobileHint hint={t("attribution")}>
                  <span>{l.party}</span>
                </MobileHint>
              </Pill>
              {inElectionPeriod && (
                <Pill tone="warn" icon={AlertTriangle} title={t("electionPeriodTitle")}>
                  {t("electionPeriod")}
                </Pill>
              )}
            </div>
          )}
        </div>
      </div>

      {(l.phone || l.email) && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 10, borderTop: "1px solid var(--ftp-border)" }}>
          {l.phone && (
            <a href={`tel:${l.phone}`} className="ftp-chip" style={CONTACT_LINK} aria-label={t("callAria", { name: l.name, phone: l.phone })}>
              <Phone size={14} aria-hidden /> <span className="ftp-num">{l.phone}</span>
            </a>
          )}
          {l.email && (
            <a href={`mailto:${l.email}`} className="ftp-chip" style={CONTACT_LINK} aria-label={t("emailAria", { name: l.name })}>
              <Mail size={14} aria-hidden /> {t("email")}
            </a>
          )}
        </div>
      )}

      <div style={{ marginTop: "auto", paddingTop: 4, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
        {leaderProvenance(l, t, fmtDate)}
      </div>
    </Card>
  );
}

function TierSection({ tier, leaders, inElectionPeriod }: { tier: number; leaders: Leader[]; inElectionPeriod?: boolean }) {
  const t = useTranslations("page_leadership");
  const meta = tierMeta(tier, t);
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
          {leaders.map((l) => <LeaderCard key={l.id} l={l} inElectionPeriod={inElectionPeriod} emoji={meta.emoji} />)}
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
  const t = useTranslations("page_leadership");
  const f = useFormat();
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useLeaders(district, state);
  const { data: aiInsight } = useAIInsight(district, "leadership");
  const leaders: Leader[] = data?.data ?? [];
  const [shareNote, setShareNote] = useState<string | null>(null);

  // Used for the election-period note + per-card "Election period" badge.
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
  for (const tier of tiers) byTier[tier].sort((a, b) => rank(a.role) - rank(b.role) || a.name.localeCompare(b.name));

  // Freshness = the most recent "last verified" date across all leaders.
  const asOf = leaders.reduce<string | null>(
    (best, l) => (l.lastVerifiedAt && (!best || l.lastVerifiedAt > best) ? l.lastVerifiedAt : best),
    null
  );
  const src = getModuleSources("leadership", state);
  // Local-script title comes from the dictionary (Kannada only for now).
  const titleLocal = state === "karnataka" ? knDict.modules.leadership : undefined;
  const electedCount = byTier[4]?.length ?? 0;
  const officerCount = byTier[3]?.length ?? 0;
  const b = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;

  const onShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: t("title"), url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareNote(t("linkCopied"));
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
        tier: tierMeta(l.tier, t).label,
        name: l.name,
        role: l.role,
        party: l.party ?? "",
        constituency: l.constituency ?? "",
        last_verified: l.lastVerifiedAt ?? "",
      }))
    );

  const resultDate =
    liveElection?.resultDate && !Number.isNaN(new Date(liveElection.resultDate).getTime())
      ? f.date(liveElection.resultDate, { day: "2-digit", month: "long", year: "numeric" })
      : null;

  return (
    <div className="module-page" style={{ padding: 24, maxWidth: "var(--ftp-reading-max)" }}>
      <PageHeader
        icon={Users}
        accent={getModuleAccent("leadership")}
        title={t("title")}
        titleLocal={titleLocal}
        description={t("description")}
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

      {/* One note on where the names come from (was two overlapping notes). */}
      <p role="note" className="ftp-body" style={{ display: "flex", alignItems: "flex-start", gap: 8, color: "var(--ftp-text-2)", marginBottom: 16 }}>
        <Info size={14} aria-hidden style={{ flexShrink: 0, marginTop: 3 }} />
        <span>{t("topNote")}</span>
      </p>

      {inElectionPeriod && liveElection && (
        <div role="alert" style={{ marginBottom: 16 }}>
          <Card padding={14}>
            <div className="ftp-body" style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "var(--ftp-text)" }}>
              <AlertTriangle size={16} aria-hidden style={{ color: "var(--ftp-danger)", flexShrink: 0, marginTop: 2 }} />
              <span>
                {t.rich(resultDate ? "electionAlertDate" : "electionAlert", {
                  label: liveElection.label,
                  date: resultDate ?? "",
                  b: (c) => <span style={{ fontWeight: 600, color: "var(--ftp-danger)" }}>{c}</span>,
                })}
              </span>
            </div>
          </Card>
        </div>
      )}

      <AIInsightCard module="leaders" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && leaders.length === 0 && (
        <EmptyState emoji="👥" title={t("emptyTitle")} body={t("emptyBody")} />
      )}

      {deduped.length > 0 && (
        <StatStrip cols={3}>
          <StatTile emoji="👥" label={t("tilePeople")} value={f.number(deduped.length)} asOf={asOf} />
          <StatTile emoji="🗳️" label={t("tileElected")} value={f.number(electedCount)} sub={t("tileElectedSub")} asOf={asOf} />
          <StatTile emoji="🏢" label={t("tileOfficers")} value={f.number(officerCount)} sub={t("tileOfficersSub")} asOf={asOf} />
        </StatStrip>
      )}

      {/* Picture 1: one plain sentence with the real counts, and a bar
          per level (drawn only when there are at least two levels). */}
      {deduped.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Card tinted padding={18}>
            <Explainer emoji="🧭">
              {t.rich("simple", { n: deduped.length, levels: tiers.length, b })}
              {electedCount > 0 && <> {t.rich("simpleElected", { n: electedCount, b })}</>}
              {officerCount > 0 && <> {t.rich("simpleOfficers", { n: officerCount, b })}</>}
            </Explainer>
            {tiers.length > 1 && (
              <LevelsPicture
                tiers={tiers}
                counts={Object.fromEntries(tiers.map((tier) => [tier, byTier[tier].length]))}
              />
            )}
          </Card>
        </div>
      )}

      {/* Picture 2: the elected representatives by party (as last reported). */}
      <PartyRing reps={byTier[4] ?? []} asOf={asOf} />

      {tiers.map((tier) => (
        <TierSection key={tier} tier={tier} leaders={byTier[tier]} inElectionPeriod={inElectionPeriod} />
      ))}

      {/* Election dates wear the Elections module's own hue. */}
      <div className={hueClass("elections")}>
        <ElectionSection stateSlug={state} />
      </div>

      {leaders.length > 0 && (
        <div role="note" style={{ marginTop: 28 }}>
          <Card>
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>
              {t.rich("noteParties", { b: (c) => <span style={{ fontWeight: 600, color: "var(--hue-deep)" }}>{c}</span> })}
            </p>
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 12 }}>
              {t.rich("noteOfficers", { b: (c) => <span style={{ fontWeight: 600, color: "var(--hue-deep)" }}>{c}</span> })}
            </p>
          </Card>
        </div>
      )}

      <SourcesFooter
        sources={src.sources.map((name) => ({
          name: SOURCE_KEY[name] ? t(`sourceNames.${SOURCE_KEY[name]}`) : name,
          url: SOURCE_URLS[name],
          frequency: FREQ_KEY[src.frequency] ? t(`freq.${FREQ_KEY[src.frequency]}`) : src.frequency,
        }))}
      />
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", fontSize: 11, lineHeight: "16px", marginTop: 8 }}>
        {t("notOfficial")}
      </p>

      <ModuleNews district={district} state={state} locale={locale} module="leaders" />

      <Toolbar label={t("toolbar")}>
        <ToolbarButton icon={Download} onClick={onCsv} disabled={deduped.length === 0}>
          {t("downloadCsv")}
        </ToolbarButton>
        <ToolbarButton icon={Share2} onClick={onShare}>
          {shareNote ?? t("share")}
        </ToolbarButton>
        <ToolbarButton icon={ArrowLeftRight} href={`/${locale}/compare?module=leadership&a=${district}`}>
          {t("compare")}
        </ToolbarButton>
      </Toolbar>
    </div>
  );
}

export default function LeadershipPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("leadership")}>
      <LeadershipPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
