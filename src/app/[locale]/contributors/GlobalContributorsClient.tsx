/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════════════════
//  /contributors — "The people behind the platform"
// ═══════════════════════════════════════════════════════════════════════
//
//  The question it answers: "Who keeps this site free, and which districts
//  do they back?"
//
//  Design v5 "calm" (Sept 2026), docs/LAYOUT.md recipe inside <ModulePage>:
//    1. Plain header (no band, no emoji) with one quiet "Become a
//       supporter" link.
//    2. The All-India supporters line — the Founding Builder first, as the
//       support page promises ("your name first, on every page").
//    3. The answer in one sentence, from the district rankings.
//    4. Three numbers (no emoji). While a count is still loading its tile
//       shows "—", never a fake 0.
//    5. Filter Chips, then the supporters as tap cards on .ftp-grid (2–4
//       across). Tapping a supporter opens a DetailSheet with everything
//       they chose to make public.
//    6. The district ranking list (links to each district's supporters).
//    7. How badges work (BadgeExplainer), sources footer.
//  Removed in v5: the pink band and emoji, the pictogram and the bar chart
//  (both repeated the ranking list), "Why it matters" (it claimed updates
//  "every 5 to 30 minutes from official government portals"), the growth
//  chart and the closing call-to-action card (the header link is enough).
//  All queries, filters and pagination behave exactly as before.
//  v5.1 ("Warm Calm"): each supporter card, its avatar and the detail sheet
//  wear the supporter's plan colour — one-time rose, District blue, State
//  teal, All-India violet, Founding Builder gold — the same colours as the
//  plan cards on /support (src/components/support/tier-look.ts).
//  Text: "page_site-contributors" messages; supporter badges from
//  "page_site.tier". Names of people, districts and states stay as stored.
//
import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Lock } from "lucide-react";
import { normalizeSocialLink } from "@/lib/social-link";
import BadgeExplainer, { BADGE_TONE } from "@/components/common/BadgeExplainer";
import { getTotalActiveDistrictCount } from "@/lib/constants/districts";
import { TIER_CONFIG } from "@/lib/constants/razorpay-plans";
import {
  Card,
  Chips,
  LoadingShell,
  ModulePage,
  Pill,
  Section,
  SourcesFooter,
  StatStrip,
  StatTile,
  ToolbarButton,
} from "@/components/district/ui";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import PlainPageHeader from "@/components/site/PlainPageHeader";
import TapCard from "@/components/site/TapCard";
import NationalSupporters from "@/components/support/NationalSupporters";
import { isFoundingBuilder, placementLevel } from "@/components/support/placement";
import SupporterAvatar from "@/components/support/SupporterAvatar";
import { supporterTierKey, tierHueClass } from "@/components/support/tier-look";
import { publicName } from "@/components/support/public-name";
import look from "@/components/support/look.module.css";
import { tierLabel } from "@/components/site/tier-label";
import { useFormat } from "@/i18n/client";

interface Contributor {
  id: string;
  name: string;
  amount: number | null;
  tier: string;
  badgeType: string | null;
  badgeLevel: string | null;
  socialLink: string | null;
  socialPlatform: string | null;
  monthsActive: number;
  message: string | null;
  createdAt: string;
  districtName?: string | null;
  stateName?: string | null;
  /** Set here: the stored name is not shown (anonymous, or contact details). */
  hidden?: boolean;
}

interface DistrictRanking {
  districtName: string;
  districtSlug: string;
  stateName: string;
  stateSlug: string;
  active: boolean;
  count: number;
  monthlyTotal: number;
}

/** What the open sheet shows: the supporter, and how the list showed them. */
interface OpenEntry {
  c: Contributor;
  rank?: number;
  showAmount?: boolean;
}

const FILTERS = ["all", "patron", "state", "district", "founder", "one-time"] as const;

type Tr = (key: string, values?: Record<string, string | number>) => string;

/**
 * Names safe to show: "Anonymous" and any phone number or e-mail stored as a
 * name become the translated "Anonymous" / "Supporter" (public-name.ts).
 * /api/data/contributors does not mask contact details yet.
 */
function maskNames(list: Contributor[], tsup: Tr): Contributor[] {
  return list.map((c) => {
    const shown = publicName(c.name);
    if (shown === c.name) return c;
    return { ...c, name: shown ?? (c.name === "Anonymous" ? tsup("anonymous") : tsup("supporter")), hidden: !shown };
  });
}

/**
 * The badge line under a name. Founder- and patron-level gifts are labelled
 * by what they gave (a one-time ₹50,000 gift is the Founding Builder), in
 * the same words as the support page; everything else uses page_site.tier.
 */
function supporterLabel(ts: Tr, tsup: Tr, c: Contributor): string {
  if (isFoundingBuilder(c)) return tsup("banner_founder");
  if (placementLevel(c) === "india") return tsup("banner_patron");
  return tierLabel(ts, c.tier, c.districtName, c.stateName);
}

/** 26 px circle with the rank number; the top three are filled with the hue. */
function RankBadge({ rank }: { rank: number }) {
  const t = useTranslations("page_site-contributors");
  return (
    <span
      className="ftp-num"
      aria-label={t("rank", { n: rank })}
      style={{
        width: 26,
        height: 26,
        borderRadius: "50%",
        background: rank <= 3 ? "var(--hue)" : "var(--hue-tint)",
        color: rank <= 3 ? "#fff" : "var(--hue-deep)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        flexShrink: 0,
      }}
    >
      {rank}
    </span>
  );
}

/** Round initials avatar in the supporter's plan colour (gold ring for the Founding Builder). */
function Initials({ c, size = 40 }: { c: Contributor; size?: number }) {
  return <SupporterAvatar name={c.name} tier={supporterTierKey(c)} size={size} anonymous={!!c.hidden} />;
}

/** One supporter as a tap card: rank, initials, name, badge line. Opens the detail sheet. */
function ContributorCard({
  c,
  rank,
  showAmount,
  extra,
  onOpen,
}: {
  c: Contributor;
  rank?: number;
  showAmount?: boolean;
  /** Extra Pills shown after the name (e.g. New, Longest). */
  extra?: React.ReactNode;
  onOpen: () => void;
}) {
  const t = useTranslations("page_site-contributors");
  const ts = useTranslations("page_site");
  const tsup = useTranslations("page_support");
  const { number } = useFormat();
  const badgeKey = c.badgeLevel ? `badge_${c.badgeLevel}` : null;

  const tier = supporterTierKey(c);
  return (
    <li style={{ listStyle: "none", minWidth: 0 }} className={`${tierHueClass(tier)} ${look.metal}`}>
      <TapCard onClick={onOpen} label={t("openDetails", { name: c.name })} padding={12} tinted>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {rank !== undefined && <RankBadge rank={rank} />}
          <Initials c={c} />
          <span style={{ minWidth: 0, flex: 1, display: "block" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span className="ftp-title" style={{ fontSize: 14, lineHeight: 1.45, fontWeight: 600, overflowWrap: "anywhere" }}>{c.name}</span>
              {extra}
            </span>
            <span style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
              <span style={{ color: tier === "founder" ? "var(--sup-gold-deep)" : "var(--hue-deep)", fontWeight: 600 }}>{supporterLabel(ts, tsup, c)}</span>
              {showAmount && c.amount && (
                <span className="ftp-num" style={{ color: "var(--hue-deep)" }}>₹{number(c.amount)}</span>
              )}
              {c.monthsActive > 0 && <span className="ftp-num">{t("months", { n: c.monthsActive })}</span>}
              {c.badgeLevel && (
                <Pill tone={BADGE_TONE[c.badgeLevel] ?? "neutral"} style={{ height: 20 }}>
                  {badgeKey && t.has(badgeKey) ? t(badgeKey) : c.badgeLevel}
                </Pill>
              )}
            </span>
          </span>
        </span>
      </TapCard>
    </li>
  );
}

/** One honest sentence when a list is empty. */
const EMPTY: React.CSSProperties = { margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--ftp-text-2)" };

/** Grid of contributor cards: one column on phones, 2–4 on wider screens. */
const LIST_GRID: React.CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  gap: 10,
  ["--ftp-grid-min" as string]: "290px",
} as React.CSSProperties;

export default function GlobalContributorsClient({ locale }: { locale: string }) {
  const t = useTranslations("page_site-contributors");
  const ts = useTranslations("page_site");
  const tsup = useTranslations("page_support");
  const { number, date } = useFormat();
  const inr = (n: number) => `₹${number(n)}`;
  const championAmount = inr(TIER_CONFIG.district.amount);
  const initialFilter = typeof window !== "undefined"
    ? (new URLSearchParams(window.location.search).get("filter") ?? "all")
    : "all";
  const validFilter = (FILTERS as readonly string[]).includes(initialFilter) ? initialFilter : "all";
  const [filter, setFilter] = useState(validFilter);
  const [openEntry, setOpenEntry] = useState<OpenEntry | null>(null);

  const PAGE_SIZE = 50;
  const [page, setPage] = useState(1);
  // A new filter starts again from the first page.
  const changeFilter = (next: string) => {
    setFilter(next);
    setPage(1);
  };
  // "New" pills compare against the time the page opened (one clock read).
  const [openedAt] = useState(() => Date.now());

  const { data: leaderboard, isLoading: loadingLb } = useQuery<{ contributors: Contributor[] }>({
    queryKey: ["contributors-leaderboard"],
    queryFn: () => fetch("/api/data/contributors?type=leaderboard&limit=10").then((r) => r.json()),
    staleTime: 120_000,
  });

  const limit = PAGE_SIZE * page;
  const { data: allData, isLoading: loadingAll } = useQuery<{
    subscribers: Contributor[];
    oneTime: Contributor[];
    subscribersTotal?: number;
    oneTimeTotal?: number;
  }>({
    queryKey: ["contributors-all-global", limit],
    queryFn: () => fetch(`/api/data/contributors?limit=${limit}`).then((r) => r.json()),
    staleTime: 120_000,
  });

  const { data: rankingsData } = useQuery<{ rankings: DistrictRanking[]; awaitingLaunch: DistrictRanking[] }>({
    queryKey: ["district-rankings"],
    queryFn: () => fetch("/api/data/contributors?type=district-rankings").then((r) => r.json()),
    staleTime: 120_000,
  });

  const leaders = useMemo(() => maskNames(leaderboard?.contributors ?? [], tsup), [leaderboard, tsup]);
  const subscribers = useMemo(() => maskNames(allData?.subscribers ?? [], tsup), [allData, tsup]);
  const oneTimers = useMemo(() => maskNames(allData?.oneTime ?? [], tsup), [allData, tsup]);
  const subscribersTotal = allData?.subscribersTotal ?? subscribers.length;
  const oneTimeTotal = allData?.oneTimeTotal ?? oneTimers.length;
  const rankings = rankingsData?.rankings ?? [];
  const awaitingLaunch = rankingsData?.awaitingLaunch ?? [];

  // Hero stats
  const totalContributors = subscribersTotal + oneTimeTotal;
  const activeSubscribers = subscribersTotal;
  const districtsSponsored = rankings.length;
  const activeDistrictCount = getTotalActiveDistrictCount();

  // The one-sentence answer: live districts with at least one monthly district champion.
  const championed = rankings.filter((r) => r.active && r.count > 0).length;

  // Longest-tenure contributor (for the Longest pill) — computed from the leaderboard top.
  const longestId = leaders[0]?.id ?? null;
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const isRecentlyJoined = (createdAt: string) => {
    const ms = Date.parse(createdAt);
    return !Number.isNaN(ms) && openedAt - ms < SEVEN_DAYS;
  };

  // Apply filter
  const filteredLeaders = useMemo(() => {
    if (filter === "all" || filter === "one-time") return leaders;
    return leaders.filter((c) => c.tier === filter);
  }, [leaders, filter]);

  const filteredSubscribers = useMemo(() => {
    if (filter === "all" || filter === "one-time") return subscribers;
    return subscribers.filter((c) => c.tier === filter);
  }, [subscribers, filter]);

  const filteredOneTimers = useMemo(() => {
    if (filter === "one-time" || filter === "all") return oneTimers;
    // Founder and patron gifts are often one-time (the founding gift is), so
    // those two filters include them.
    if (filter === "founder") return oneTimers.filter((c) => isFoundingBuilder(c));
    if (filter === "patron") return oneTimers.filter((c) => placementLevel(c) === "india" && !isFoundingBuilder(c));
    return [];
  }, [oneTimers, filter]);

  const canLoadMore =
    filter === "one-time"
      ? oneTimers.length < oneTimeTotal
      : filter === "all"
        ? subscribers.length < subscribersTotal || oneTimers.length < oneTimeTotal
        : subscribers.length < subscribersTotal && filteredSubscribers.length >= 0;

  const showLeaderboard = filter === "all" || (filter !== "one-time" && filteredLeaders.length > 0);
  const showSubscribers = filter !== "one-time" && filteredSubscribers.length > 0;
  const showOneTime = filter === "all" || filter === "one-time" || filteredOneTimers.length > 0;
  const nothingInFilter = !loadingAll && !loadingLb && !showLeaderboard && !showSubscribers && !showOneTime;

  const b = (c: React.ReactNode) => <strong style={{ fontWeight: 600, color: "var(--ftp-text)" }}>{c}</strong>;

  const TEXT_LINK: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "none",
    fontFamily: "inherit",
  };
  const JOIN_LINK: React.CSSProperties = {
    ...TEXT_LINK,
    padding: "0 18px",
    background: "var(--ftp-brand)",
    color: "#fff",
    borderRadius: "var(--ftp-radius-tile)",
  };

  // The open sheet's supporter.
  const oc = openEntry?.c ?? null;
  const ocLink = oc ? normalizeSocialLink(oc.socialLink) : null;
  const ocBadgeKey = oc?.badgeLevel ? `badge_${oc.badgeLevel}` : null;
  const ocPlace = oc
    ? oc.districtName && oc.stateName
      ? t("districtPlace", { district: oc.districtName, state: oc.stateName })
      : oc.stateName ?? oc.districtName ?? null
    : null;
  const ocJoined = oc && !Number.isNaN(Date.parse(oc.createdAt)) ? date(oc.createdAt, { day: "numeric", month: "long", year: "numeric" }) : null;

  return (
    <main className="ftp-hue-blue" style={{ background: "var(--ftp-bg)", minHeight: "calc(100vh - 56px)", paddingBottom: 48 }}>
      <ModulePage>
        {/* ── 1. Header ─────────────────────────────────────────────── */}
        <PlainPageHeader title={t("title")} description={t("description")} backHref={`/${locale}`}>
          <Link href={`/${locale}/support`} style={JOIN_LINK}>
            {t("join", { amount: championAmount })}
          </Link>
        </PlainPageHeader>

        {/* ── 2. All-India supporters, the Founding Builder first ───── */}
        <NationalSupporters style={{ marginBottom: 16 }} />

        {/* ── 3. The answer in one sentence ─────────────────────────── */}
        {rankingsData && activeDistrictCount > 0 && (
          <p style={{ margin: "0 0 16px", fontSize: 16, lineHeight: 1.6, color: "var(--ftp-text-2)", maxWidth: "72ch" }}>
            {championed === 0
              ? t.rich("simpleNone", { live: activeDistrictCount, b })
              : t.rich("simpleSome", { n: championed, live: activeDistrictCount, b })}
          </p>
        )}

        {/* ── 4. Numbers ────────────────────────────────────────────── */}
        <StatStrip cols={3}>
          <StatTile label={t("tileTotal")} value={loadingAll ? "—" : number(totalContributors)} />
          <StatTile label={t("tileMonthly")} value={loadingAll ? "—" : number(activeSubscribers)} />
          <StatTile label={t("tileDistricts")} value={rankingsData ? number(districtsSponsored) : "—"} />
        </StatStrip>

        {/* ── 5. Filters + the supporter lists ──────────────────────── */}
        <div style={{ margin: "24px 0 4px" }}>
          <Chips
            label={t("filterLabel")}
            items={FILTERS.map((key) => ({ value: key, label: t(`filter_${key}`) }))}
            value={filter}
            onChange={changeFilter}
          />
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", fontSize: 14, marginTop: 10 }}>{t("tapHint")}</p>
        </div>

        {nothingInFilter && <p style={{ ...EMPTY, margin: "16px 0" }}>{t("filterEmpty")}</p>}

        {showLeaderboard && (
          <Section title={t("leaderTitle")}>
            {loadingLb ? (
              <LoadingShell rows={3} />
            ) : filteredLeaders.length === 0 ? (
              <p style={EMPTY}>{t("leaderEmpty")}</p>
            ) : (
              <ul className="ftp-grid" style={LIST_GRID}>
                {filteredLeaders.map((c, i) => {
                  const isLongest = c.id === longestId;
                  const isNew = isRecentlyJoined(c.createdAt);
                  return (
                    <ContributorCard
                      key={c.id}
                      c={c}
                      rank={i + 1}
                      onOpen={() => setOpenEntry({ c, rank: i + 1 })}
                      extra={
                        <>
                          {isNew && <Pill tone="brand">{t("pillNew")}</Pill>}
                          {isLongest && <Pill tone="warn">{t("pillLongest")}</Pill>}
                        </>
                      }
                    />
                  );
                })}
              </ul>
            )}
          </Section>
        )}

        {/* ── Active subscribers ─────────────────────────────────── */}
        {showSubscribers && (
          <Section
            title={t("subsTitle")}
            action={
              <span className="ftp-num" style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>
                {t("total", { n: number(filter === "all" ? subscribersTotal : filteredSubscribers.length) })}
              </span>
            }
          >
            <ul className="ftp-grid" style={LIST_GRID}>
              {filteredSubscribers.map((c) => (
                <ContributorCard key={c.id} c={c} onOpen={() => setOpenEntry({ c })} />
              ))}
            </ul>
          </Section>
        )}

        {/* ── One-time contributors ──────────────────────────────── */}
        {showOneTime && (
          <Section
            title={t("oneTimeTitle")}
            action={
              // No "0 total" while the list is still loading.
              loadingAll ? undefined : (
                <span className="ftp-num" style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>
                  {t("total", { n: number(oneTimeTotal) })}
                </span>
              )
            }
          >
            {loadingAll ? (
              <LoadingShell rows={3} />
            ) : filteredOneTimers.length === 0 ? (
              <p style={EMPTY}>{t("oneTimeEmpty")}</p>
            ) : (
              <ul className="ftp-grid" style={LIST_GRID}>
                {filteredOneTimers.map((c) => (
                  <ContributorCard key={c.id} c={c} showAmount onOpen={() => setOpenEntry({ c, showAmount: true })} />
                ))}
              </ul>
            )}
          </Section>
        )}

        {/* ── Load more ──────────────────────────────────────────── */}
        {canLoadMore && !loadingAll && (
          <div style={{ textAlign: "center", margin: "24px 0 32px" }}>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              className="ftp-btn ftp-btn-secondary"
              style={{
                ...TEXT_LINK,
                padding: "0 20px",
                background: "var(--ftp-surface)",
                border: "1px solid color-mix(in srgb, var(--hue) 30%, var(--ftp-border))",
                color: "var(--hue-deep)",
                borderRadius: "var(--ftp-radius-tile)",
                cursor: "pointer",
              }}
            >
              {t("loadMore", { n: PAGE_SIZE })}
            </button>
            <p className="ftp-num" style={{ marginTop: 6, fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)" }}>
              {t("showing", { shown: number(subscribers.length + oneTimers.length), total: number(subscribersTotal + oneTimeTotal) })}
            </p>
          </div>
        )}

        {/* ── 6. Most supported districts (the full list) ────────────── */}
        {filter === "all" && (rankings.length > 0 || awaitingLaunch.length > 0) && (
          <Section title={t("districtsTitle")}>
            <Card padding={16}>
              <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {rankings.map((r, i) => (
                  <li
                    key={r.districtSlug}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                      padding: "6px 0",
                      borderBottom: i < rankings.length - 1 ? "1px solid var(--ftp-border)" : undefined,
                    }}
                  >
                    <RankBadge rank={i + 1} />
                    <Link
                      href={`/${locale}/${r.stateSlug}/${r.districtSlug}/contributors`}
                      style={{ flex: "1 1 160px", minWidth: 0, minHeight: 44, display: "inline-flex", alignItems: "center", fontSize: 14, fontWeight: 600, color: "var(--ftp-text)", textDecoration: "none" }}
                    >
                      {t("districtPlace", { district: r.districtName, state: r.stateName })}
                    </Link>
                    <span className="ftp-num" style={{ fontSize: 13, color: "var(--ftp-text-2)", whiteSpace: "nowrap" }}>
                      {t("contributors", { n: r.count })}
                    </span>
                    <span className="ftp-num" style={{ fontSize: 14, color: "var(--ftp-text)", whiteSpace: "nowrap" }}>
                      {t("perMonth", { amount: inr(r.monthlyTotal) })}
                    </span>
                  </li>
                ))}
              </ol>

              {awaitingLaunch.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--ftp-border)" }}>
                  <p className="ftp-label" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                    <Lock size={12} aria-hidden /> {t("awaiting")}
                  </p>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {awaitingLaunch.map((r) => (
                      <li key={r.districtSlug} className="ftp-body" style={{ color: "var(--ftp-text-2)", padding: "4px 0", display: "flex", alignItems: "center", gap: 6 }}>
                        <Lock size={12} aria-hidden style={{ flexShrink: 0 }} />
                        <span>
                          {t("awaitingRow", { place: t("districtPlace", { district: r.districtName, state: r.stateName }), n: r.count })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </Section>
        )}

        {/* ── 7. How badges work ─────────────────────────────────── */}
        <div style={{ marginTop: 32 }}>
          <BadgeExplainer />
        </div>

        <p style={{ margin: "24px 0 0" }}>
          <Link href={`/${locale}/support`} style={{ ...TEXT_LINK, color: "var(--ftp-brand)" }}>
            {t("ctaButton")}
          </Link>
        </p>

        <SourcesFooter sources={[{ name: t("srcRecords") }]} />
      </ModulePage>

      {/* ── The supporter detail sheet ───────────────────────────── */}
      <DetailSheet
        open={!!oc}
        onClose={() => setOpenEntry(null)}
        hueClassName={oc ? `${tierHueClass(supporterTierKey(oc))} ${look.metal}` : "ftp-hue-blue"}
        media={oc ? <Initials c={oc} size={48} /> : undefined}
        title={oc?.name ?? ""}
        subtitle={oc ? supporterLabel(ts, tsup, oc) : undefined}
        footer={
          ocLink ? (
            <ToolbarButton href={ocLink} external icon={ExternalLink}>
              {t("openProfile")}
            </ToolbarButton>
          ) : undefined
        }
      >
        {oc && (
          <>
            <DetailList
              rows={[
                { label: t("rowRank"), value: openEntry?.rank ? <span className="ftp-num">{number(openEntry.rank)}</span> : null },
                {
                  label: t("rowBadge"),
                  value: oc.badgeLevel ? (ocBadgeKey && t.has(ocBadgeKey) ? t(ocBadgeKey) : oc.badgeLevel) : null,
                },
                { label: t("rowPlace"), value: ocPlace },
                { label: t("rowMonths"), value: oc.monthsActive > 0 ? t("months", { n: oc.monthsActive }) : null },
                {
                  label: t("rowAmount"),
                  value: openEntry?.showAmount && oc.amount ? <span className="ftp-num">{inr(oc.amount)}</span> : null,
                },
                { label: t("rowJoined"), value: ocJoined },
              ]}
            />
            {oc.message && (
              <blockquote
                style={{
                  margin: 0,
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: "var(--hue-tint)",
                  borderInlineStart: "4px solid var(--hue)",
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: "var(--ftp-text)",
                }}
              >
                <span className="ftp-label" style={{ display: "block", marginBottom: 4, color: "var(--hue-deep)" }}>
                  {t("rowMessage")}
                </span>
                {oc.message}
              </blockquote>
            )}
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "var(--ftp-text-2)" }}>{t("sheetPrivacy")}</p>
          </>
        )}
      </DetailSheet>
    </main>
  );
}
