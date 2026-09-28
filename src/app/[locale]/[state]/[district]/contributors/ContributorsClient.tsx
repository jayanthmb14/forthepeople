/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════════════════
//  /[locale]/[state]/[district]/contributors — "Who keeps this district's
//  page free?"  (docs/LAYOUT.md recipe; docs/MODULE-MAP.md "Supporters")
// ═══════════════════════════════════════════════════════════════════════
//
//  ModulePage → PageHeader → Explainer (how many people support it, how
//  many every month) → 4 StatTiles (dated by the fetch) → ONE picture: 10
//  people, the monthly givers lit → the tiers as Sections of TapCards
//  (initials, name, label, badge). Tapping a supporter opens a DetailSheet
//  with their full message, badge, how long they have given, the gift,
//  when they joined, when a one-time gift leaves the wall, and their
//  profile link. "View all" opens the same sheet with the whole tier; a
//  name there opens that person (with a way back to the list).
//  → "How long monthly supporters have stayed" (ring) → the corporate
//  sponsor slot and badge rules (shared components) → one call to action.
//
//  Prices in the "be the first" prompts come from TIER_CONFIG (the checkout
//  config) and the module count from getPlatformFacts().
//
//  i18n: page_contributors (en / kn / hi). Supporter names, messages and
//  the place names stored with each supporter are data, shown as saved.
//  BadgeExplainer and CorporateSponsorBanner are shared with /contributors
//  and keep their own text.
//
//  UNCHANGED: the query (endpoint, keys, refresh rate), the "just paid"
//  auto-refresh and every support link.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, ExternalLink, Github, Instagram, Linkedin, Twitter, Users } from "lucide-react";
import { daysUntil } from "@/lib/contribution-expiry";
import { normalizeSocialLink } from "@/lib/social-link";
import { TIER_CONFIG } from "@/lib/constants/razorpay-plans";
import { getPlatformFacts } from "@/lib/platform-facts";
import { hueClass } from "@/lib/design/hues";
import { useDistrictName, useFormat, usePlaceText } from "@/i18n/client";
import BadgeExplainer, { BADGE_TONE } from "@/components/common/BadgeExplainer";
import CorporateSponsorBanner from "@/components/common/CorporateSponsorBanner";
import { Card, EmptyState, LoadingShell, ModulePage, PageHeader, Pill, Section, StatStrip, StatTile, ToolbarButton } from "@/components/district/ui";
import { ChartCard, Explainer } from "@/components/district/visuals";
import { IconPictogram } from "@/components/district/page-kit";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import { ShareDonut, type DonutSlice } from "@/components/community/CommunityVisuals";
import { TapCard } from "@/components/community/TapCard";
import { useSheetState } from "@/components/community/pageTools";

/** How many modules each district page carries (from the module registry). */
const { modulesPerDistrict: MODULES_PER_DISTRICT } = getPlatformFacts();

interface Contributor {
  id: string;
  name: string;
  amount: number | null;
  tier: string;
  badgeType: string | null;
  badgeLevel: string | null;
  socialLink: string | null;
  socialPlatform: string | null;
  districtId: string | null;
  stateId: string | null;
  districtName: string | null;
  stateName: string | null;
  districtSlug: string | null;
  stateSlug: string | null;
  isRecurring: boolean;
  monthsActive: number;
  message: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface Props {
  locale: string;
  stateSlug: string;
  districtSlug: string;
  districtName: string;
  stateName: string;
  population?: number | null;
}

type TierKey = "district" | "state" | "india" | "onetime";
type SheetState = { kind: "list"; tier: TierKey } | { kind: "person"; c: Contributor; from?: TierKey } | null;

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
  website: ExternalLink,
};

/** Months of monthly support → step (badge thresholds: 3+ bronze, 6+ silver, 12+ gold, 24+ platinum). */
const TENURE_STEPS: Array<{ key: "new" | "bronze" | "silver" | "gold" | "platinum"; min: number }> = [
  { key: "new", min: 0 },
  { key: "bronze", min: 3 },
  { key: "silver", min: 6 },
  { key: "gold", min: 12 },
  { key: "platinum", min: 24 },
];

function tenureStep(months: number): (typeof TENURE_STEPS)[number]["key"] {
  let key: (typeof TENURE_STEPS)[number]["key"] = "new";
  for (const s of TENURE_STEPS) if (months >= s.min) key = s.key;
  return key;
}

/** Cards shown per tier before "View all". */
const PREVIEW_COUNT = 6;
/** Fewer supporters than this and a "N of every 10" picture would mislead. */
const MIN_FOR_PICTURE = 3;

/** "₹99" style price for a tier, read from the checkout config. */
function useTierPrice() {
  const f = useFormat();
  return (key: string): string => {
    const tc = TIER_CONFIG[key];
    return tc ? `₹${f.number(tc.amount)}` : "";
  };
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Everything the page says about one supporter (label, tenure, expiry…), in the page language. */
function useSupporterText() {
  const t = useTranslations("page_contributors");
  const f = useFormat();
  const place = usePlaceText();
  return (c: Contributor) => {
    const stateLabel = c.stateSlug || c.stateName ? place.state(c.stateSlug ?? c.stateName, c.stateName ?? undefined) : "";
    const label =
      c.tier === "founder"
        ? t("label.founder")
        : c.tier === "patron"
          ? t("label.patron")
          : c.tier === "state"
            ? stateLabel
              ? t("label.state", { name: stateLabel })
              : t("label.stateGeneric")
            : c.tier === "district"
              ? c.districtName
                ? t("label.district", { name: c.districtName })
                : t("label.districtGeneric")
              : c.tier === "chai"
                ? t("label.chai")
                : t("label.supporter");
    let expiry: string | null = null;
    if (!c.isRecurring) {
      const d = daysUntil(c.expiresAt);
      if (d !== null) {
        if (d <= 0) expiry = t("expired");
        else if (d <= 14) expiry = t("expiresIn", { n: d });
        else if (c.expiresAt) expiry = t("activeUntil", { date: f.date(c.expiresAt, { day: "numeric", month: "short", year: "numeric" }) });
      }
    }
    const tenure =
      c.monthsActive > 0
        ? c.monthsActive >= 12
          ? t("tenureYM", { y: Math.floor(c.monthsActive / 12), m: c.monthsActive % 12 })
          : t("tenureM", { m: c.monthsActive })
        : null;
    const level = c.badgeLevel?.toLowerCase() ?? null;
    const badge = level ? (t.has(`badge.${level}`) ? t(`badge.${level}`) : c.badgeLevel) : null;
    return { label, expiry, tenure, level, badge };
  };
}

/** Initials in a tile in the page hue. */
function Initials({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="ftp-display"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.35),
        background: "var(--hue-tint)",
        border: "1px solid color-mix(in srgb, var(--hue) 22%, transparent)",
        color: "var(--hue-deep)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.38),
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initialsOf(name)}
    </span>
  );
}

/** The badge as a Pill in its tone (the word says the level; no medal emoji). */
function BadgePill({ c }: { c: Contributor }) {
  const text = useSupporterText()(c);
  if (!c.badgeLevel || !text.level) return null;
  return (
    <Pill tone={BADGE_TONE[text.level] ?? BADGE_TONE[c.badgeLevel] ?? "neutral"} style={{ height: 22 }}>
      {text.badge}
    </Pill>
  );
}

/** One supporter as a card; tapping it opens their sheet. */
function ContributorCard({ c, onOpen }: { c: Contributor; onOpen: (c: Contributor) => void }) {
  const t = useTranslations("page_contributors");
  const f = useFormat();
  const text = useSupporterText()(c);
  return (
    <TapCard
      onOpen={() => onOpen(c)}
      leading={<Initials name={c.name} />}
      title={c.name}
      subtitle={text.label}
      badge={<BadgePill c={c} />}
      hint={t("details")}
      style={{ gap: 8 }}
    >
      {(text.tenure || (!c.isRecurring && c.amount)) && (
        <div className="ftp-num" style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
          {text.tenure && <span>{t("givingFor", { time: text.tenure })}</span>}
          {!c.isRecurring && c.amount ? <span style={{ color: "var(--hue-deep)" }}>₹{f.number(c.amount)}</span> : null}
        </div>
      )}
      {c.message && (
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: "20px",
            color: "var(--ftp-text-2)",
            padding: "6px 10px",
            borderRadius: 10,
            background: "var(--ftp-surface-2)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          &ldquo;{c.message}&rdquo;
        </p>
      )}
    </TapCard>
  );
}

/** One supporter's sheet body. */
function SupporterDetails({ c }: { c: Contributor }) {
  const t = useTranslations("page_contributors");
  const f = useFormat();
  const text = useSupporterText()(c);
  const safeLink = normalizeSocialLink(c.socialLink);
  const SocialIcon = c.socialPlatform ? SOCIAL_ICONS[c.socialPlatform] : null;
  return (
    <>
      {c.message && (
        <p style={{ margin: 0, padding: "12px 14px", borderRadius: 14, background: "var(--ftp-surface)", border: "1px solid var(--ftp-border)", boxShadow: "inset 3px 0 0 var(--hue)", color: "var(--ftp-text)", fontSize: 15, lineHeight: "23px" }}>
          &ldquo;{c.message}&rdquo;
        </p>
      )}
      <DetailList
        rows={[
          { label: t("sheet.role"), value: text.label },
          { label: t("sheet.badge"), value: c.badgeLevel ? <BadgePill c={c} /> : null },
          { label: t("sheet.how"), value: c.isRecurring ? t("sheet.monthly") : t("sheet.oneTime") },
          { label: t("sheet.givingFor"), value: text.tenure },
          { label: t("sheet.gift"), value: !c.isRecurring && c.amount ? <span className="ftp-num">₹{f.number(c.amount)}</span> : null },
          { label: t("sheet.joined"), value: <span suppressHydrationWarning>{f.date(c.createdAt, { day: "numeric", month: "long", year: "numeric" })}</span> },
          { label: t("sheet.onWall"), value: text.expiry ? <span suppressHydrationWarning>{text.expiry}</span> : null },
          {
            label: t("sheet.profile"),
            value: safeLink ? (
              <a
                href={safeLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("profileAria", { name: c.name })}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 32, color: "var(--hue-deep)", fontWeight: 600, textDecoration: "none" }}
              >
                {SocialIcon ? <SocialIcon size={14} aria-hidden /> : <ExternalLink size={14} aria-hidden />}
                {c.socialPlatform && t.has(`social.${c.socialPlatform}`) ? t(`social.${c.socialPlatform}`) : t("social.website")}
              </a>
            ) : null,
          },
        ]}
      />
    </>
  );
}

/** One tier: H2 + count + "View all", then the first PREVIEW_COUNT cards (or an honest prompt). */
function TierSection({
  title,
  list,
  loading,
  onViewAll,
  onOpen,
  empty,
}: {
  title: string;
  list: Contributor[];
  loading?: boolean;
  onViewAll?: () => void;
  onOpen: (c: Contributor) => void;
  empty: React.ReactNode;
}) {
  const t = useTranslations("page_contributors");
  const f = useFormat();
  return (
    <Section
      title={
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {title}
          {list.length > 0 && (
            <span
              className="ftp-num"
              style={{ display: "inline-flex", alignItems: "center", height: 24, padding: "0 10px", borderRadius: "var(--ftp-radius-pill)", background: "var(--hue-tint)", color: "var(--hue-deep)", fontSize: 13, lineHeight: "16px" }}
            >
              {f.number(list.length)}
            </span>
          )}
        </span>
      }
      action={
        onViewAll ? (
          <ToolbarButton onClick={onViewAll} ariaLabel={t("viewAllAria", { n: f.number(list.length), title })}>
            {t("viewAll")}
          </ToolbarButton>
        ) : undefined
      }
    >
      {loading ? (
        <LoadingShell rows={2} />
      ) : list.length === 0 ? (
        empty
      ) : (
        <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "260px", gap: 12 }}>
          {list.slice(0, PREVIEW_COUNT).map((c) => (
            <ContributorCard key={c.id} c={c} onOpen={onOpen} />
          ))}
        </div>
      )}
    </Section>
  );
}

/** Honest empty prompt for a tier with nobody in it yet, with its support link. */
function EmptyTier({ title, cta, href }: { title: string; cta: string; href: string }) {
  return (
    <EmptyState
      title={title}
      action={
        <Link
          href={href}
          style={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 14, fontWeight: 600, color: "var(--hue-deep)", textDecoration: "underline", textUnderlineOffset: 3 }}
        >
          {cta}
        </Link>
      }
    />
  );
}

export default function ContributorsClient({ locale, stateSlug, districtSlug, districtName: districtNameEn, stateName: stateNameEn, population }: Props) {
  const t = useTranslations("page_contributors");
  const f = useFormat();
  const place = usePlaceText();
  const tierPrice = useTierPrice();
  const districtName = useDistrictName(stateSlug, districtSlug, districtNameEn);
  const stateName = place.state(stateSlug, stateNameEn);
  const searchParams = useSearchParams();
  const justPaid = searchParams.get("just_paid") === "true";
  const queryClient = useQueryClient();
  const [showBanner, setShowBanner] = useState(justPaid);
  const [sheet, setSheet, close] = useSheetState<NonNullable<SheetState>>();

  // After a payment, refetch every 15 s for 3 minutes so the new name shows up.
  useEffect(() => {
    if (!justPaid) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["contributors-district"] });
      queryClient.invalidateQueries({ queryKey: ["contributors-all"] });
    }, 15_000);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setShowBanner(false);
    }, 180_000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [justPaid, queryClient]);

  const refreshRate = justPaid ? 15_000 : 120_000;

  const { data: districtData, isLoading: loadingDist, dataUpdatedAt } = useQuery<{ contributors: Contributor[]; total: number }>({
    queryKey: ["contributors-district", districtSlug, stateSlug],
    queryFn: () => fetch(`/api/data/contributors?district=${districtSlug}&state=${stateSlug}&limit=500`).then((r) => r.json()),
    staleTime: refreshRate,
  });

  const all = districtData?.contributors ?? [];
  const tiers: Record<TierKey, Contributor[]> = {
    district: all.filter((c) => c.tier === "district"),
    state: all.filter((c) => c.tier === "state"),
    india: all.filter((c) => c.tier === "patron" || c.tier === "founder"),
    onetime: all.filter((c) => !c.isRecurring),
  };
  const monthly = all.length - tiers.onetime.length;

  const tierTitle: Record<TierKey, string> = {
    district: t("tierDistrict", { name: districtName }),
    state: t("tierState", { name: stateName }),
    india: t("tierIndia"),
    onetime: t("tierOneTime"),
  };
  const listTitle: Record<TierKey, string> = {
    district: t("modalDistrict", { n: f.number(tiers.district.length), name: districtName }),
    state: t("modalState", { n: f.number(tiers.state.length), name: stateName }),
    india: t("modalIndia", { n: f.number(tiers.india.length) }),
    onetime: t("modalOneTime", { n: f.number(tiers.onetime.length) }),
  };

  const supportHref = `/${locale}/support?tier=district&state=${stateSlug}&district=${districtSlug}`;
  const stateHref = `/${locale}/support?tier=state&state=${stateSlug}`;
  const patronHref = `/${locale}/support?tier=patron`;

  // The counts are only as fresh as the last fetch, so we date them with it.
  const fetchedAt = dataUpdatedAt > 0 ? new Date(dataUpdatedAt) : null;
  const citizens =
    population && population > 0
      ? population >= 100_000
        ? t("citizensLakh", { n: f.number(population / 100_000, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })
        : t("citizensCount", { n: f.number(population) })
      : t("everyCitizen");

  const monthlyOfTen = all.length > 0 ? (monthly / all.length) * 10 : 0;

  // Monthly supporters by how long they have given (badge steps).
  const recurring = all.filter((c) => c.isRecurring);
  const tenureSlices: DonutSlice[] = TENURE_STEPS.map((s) => ({
    key: s.key,
    label: t(`tenure.${s.key}`),
    value: recurring.filter((c) => tenureStep(c.monthsActive ?? 0) === s.key).length,
  })).filter((s) => s.value > 0);
  const yearPlus = recurring.filter((c) => (c.monthsActive ?? 0) >= 12).length;
  const showTenure = recurring.length >= MIN_FOR_PICTURE && tenureSlices.length >= 2;

  const bold = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;
  const num = (c: React.ReactNode) => <span className="ftp-num">{c}</span>;
  const openPerson = (c: Contributor, from?: TierKey) => setSheet({ kind: "person", c, from });

  return (
    <ModulePage>
      <PageHeader
        icon={Users}
        title={t("title", { name: districtName })}
        description={t("description", { name: districtName })}
        backHref={`/${locale}/${stateSlug}/${districtSlug}`}
        backLabel={t("back", { name: districtName })}
        freshness={fetchedAt ? { asOf: fetchedAt } : undefined}
      />

      {showBanner && (
        <Card role="status" style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 24 }}>
          <CheckCircle2 size={18} aria-hidden style={{ color: "var(--ftp-live)", flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="ftp-title" style={{ color: "var(--ftp-live-text)" }}>{t("processingTitle")}</p>
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{t("processingBody")}</p>
          </div>
        </Card>
      )}

      {!loadingDist && (
        <Explainer>
          {all.length > 0
            ? t.rich("simple", { count: f.number(all.length), n: all.length, name: districtName, monthlyCount: f.number(monthly), monthly, b: bold })
            : t("simpleNone", { name: districtName })}
        </Explainer>
      )}

      {!loadingDist && (
        <StatStrip cols={4}>
          <StatTile label={t("statDistrict")} value={f.number(tiers.district.length)} asOf={fetchedAt} />
          <StatTile label={t("statState")} value={f.number(tiers.state.length)} asOf={fetchedAt} />
          <StatTile label={t("statIndia")} value={f.number(tiers.india.length)} asOf={fetchedAt} />
          <StatTile label={t("statOneTime")} value={f.number(tiers.onetime.length)} asOf={fetchedAt} />
        </StatStrip>
      )}

      {/* The one picture: of every 10 supporters, how many give every month. */}
      {!loadingDist && all.length >= MIN_FOR_PICTURE && (
        <div style={{ marginTop: 20 }}>
          <Card tinted padding={18}>
            <IconPictogram icon={Users} filled={monthlyOfTen} label={t("monthlyPicto", { n: Math.round(monthlyOfTen) })} />
          </Card>
        </div>
      )}

      <TierSection
        title={tierTitle.district}
        list={tiers.district}
        loading={loadingDist}
        onOpen={(c) => openPerson(c)}
        onViewAll={tiers.district.length > PREVIEW_COUNT ? () => setSheet({ kind: "list", tier: "district" }) : undefined}
        empty={<EmptyTier title={t("emptyDistrict", { name: districtName })} cta={t("ctaDistrict", { price: tierPrice("district") })} href={supportHref} />}
      />
      <TierSection
        title={tierTitle.state}
        list={tiers.state}
        loading={loadingDist}
        onOpen={(c) => openPerson(c)}
        onViewAll={tiers.state.length > PREVIEW_COUNT ? () => setSheet({ kind: "list", tier: "state" }) : undefined}
        empty={<EmptyTier title={t("emptyState", { name: stateName })} cta={t("ctaState", { name: stateName, price: tierPrice("state") })} href={stateHref} />}
      />
      <TierSection
        title={tierTitle.india}
        list={tiers.india}
        loading={loadingDist}
        onOpen={(c) => openPerson(c)}
        onViewAll={tiers.india.length > PREVIEW_COUNT ? () => setSheet({ kind: "list", tier: "india" }) : undefined}
        empty={<EmptyTier title={t("emptyIndia")} cta={t("ctaIndia", { price: tierPrice("patron") })} href={patronHref} />}
      />
      {tiers.onetime.length > 0 && (
        <TierSection
          title={tierTitle.onetime}
          list={tiers.onetime}
          onOpen={(c) => openPerson(c)}
          onViewAll={tiers.onetime.length > PREVIEW_COUNT ? () => setSheet({ kind: "list", tier: "onetime" }) : undefined}
          empty={null}
        />
      )}

      {!loadingDist && showTenure && (
        <Section title={t("chartsTitle")}>
          <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "340px" }}>
            <ChartCard
              title={t("tenureTitle")}
              units={t("tenureUnits")}
              simple={yearPlus > 0 ? t.rich("tenureSimple", { year: f.number(yearPlus), total: f.number(recurring.length), b: bold }) : t("tenureSimpleNone")}
              asOf={fetchedAt}
              source={{ label: t("sourceOwn") }}
              table={tenureSlices.map((s) => ({ label: s.label, value: f.number(s.value) }))}
            >
              <ShareDonut
                slices={tenureSlices}
                centerValue={f.number(recurring.length)}
                centerLabel={t("supportersWord", { n: recurring.length })}
                ariaLabel={t("tenureAria", { year: f.number(yearPlus), total: f.number(recurring.length) })}
              />
            </ChartCard>
          </div>
        </Section>
      )}

      {/* Corporate sponsor slot and badge rules (shared components, their own text). */}
      <div style={{ marginTop: 28 }}>
        <CorporateSponsorBanner districtName={districtNameEn} population={population} />
        <BadgeExplainer />
      </div>

      {/* Closing call to action: a tinted card with one primary button. */}
      <Card tinted style={{ marginTop: 32, textAlign: "center" }} padding={24}>
        <h2 className="ftp-h2" style={{ marginBottom: 8 }}>
          {t.rich("ctaTitle", { name: districtName, price: tierPrice("district"), n: num })}
        </h2>
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 16, fontSize: 14, lineHeight: "21px" }}>
          {t.rich("ctaBody", { name: districtName, modules: f.number(MODULES_PER_DISTRICT), citizens, n: num })}
        </p>
        <Link
          href={supportHref}
          className="ftp-btn ftp-btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 44,
            padding: "0 22px",
            borderRadius: "var(--ftp-radius-tile)",
            borderWidth: 1,
            borderStyle: "solid",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          {t("ctaButton")}
        </Link>
      </Card>

      {sheet?.kind === "list" && (
        <DetailSheet open onClose={close} title={listTitle[sheet.tier]} subtitle={t("sortedBy")} hueClassName={hueClass("contributors")}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {tiers[sheet.tier].map((c) => (
              <li key={c.id}>
                <SupporterRow c={c} onOpen={() => openPerson(c, sheet.tier)} />
              </li>
            ))}
          </ul>
        </DetailSheet>
      )}
      {sheet?.kind === "person" && (
        <DetailSheet
          open
          onClose={close}
          title={sheet.c.name}
          media={<Initials name={sheet.c.name} size={48} />}
          hueClassName={hueClass("contributors")}
          footer={
            <>
              {sheet.from && (
                <button
                  type="button"
                  onClick={() => setSheet({ kind: "list", tier: sheet.from as TierKey })}
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 44, padding: "0 14px", borderRadius: "var(--ftp-radius-tile)", border: "1px solid var(--ftp-border)", background: "#fff", color: "var(--ftp-text)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--ftp-font-sans)" }}
                >
                  <ArrowLeft size={14} aria-hidden />
                  {t("backToList")}
                </button>
              )}
              <Link
                href={supportHref}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 44, padding: "0 16px", borderRadius: "var(--ftp-radius-tile)", background: "var(--hue)", color: "#fff", fontSize: 14, fontWeight: 650, textDecoration: "none", flex: "1 1 auto" }}
              >
                {t("joinThem", { name: districtName })}
              </Link>
            </>
          }
        >
          <SupporterDetails c={sheet.c} />
        </DetailSheet>
      )}
    </ModulePage>
  );
}

/** A compact row in the "View all" sheet; tapping it opens that supporter. */
function SupporterRow({ c, onOpen }: { c: Contributor; onOpen: () => void }) {
  const f = useFormat();
  const text = useSupporterText()(c);
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        minHeight: 56,
        padding: "8px 10px",
        borderRadius: 12,
        border: "1px solid var(--ftp-border)",
        background: "#fff",
        cursor: "pointer",
        textAlign: "start",
        font: "inherit",
        color: "var(--ftp-text)",
      }}
    >
      <Initials name={c.name} size={36} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14, lineHeight: "20px", fontWeight: 600, overflowWrap: "anywhere" }}>{c.name}</span>
        <span style={{ display: "block", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
          {text.label}
          {text.tenure ? ` · ${text.tenure}` : ""}
        </span>
      </span>
      {!c.isRecurring && c.amount ? <span className="ftp-num" style={{ fontSize: 13, color: "var(--hue-deep)" }}>₹{f.number(c.amount)}</span> : null}
    </button>
  );
}
