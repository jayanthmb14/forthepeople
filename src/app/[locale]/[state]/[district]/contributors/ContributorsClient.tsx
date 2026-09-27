/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════════════════
//  /[locale]/[state]/[district]/contributors — district supporters page
// ═══════════════════════════════════════════════════════════════════════
//
//  Design v4 "Rang" (docs/DESIGN-SYSTEM.md):
//    • PageHeader + StatStrip of emoji tiles (four honest counts, dated by
//      the fetch time).
//    • The pictures, counted from the same list that is shown below and
//      hidden when there are too few people to mean anything:
//        · an "In simple words" line and a pictogram of how many of every
//          10 supporters give every month;
//        · "How long monthly supporters have stayed": a ring of monthly
//          supporters by months of support (the same steps the badges use),
//          with a table view.
//    • Each tier is a kit Section with an emoji chip; contributors are Cards
//      in a grid with initials in the page hue. Each section shows the first
//      PREVIEW_COUNT people and a "View all" button opens the full, sorted
//      list in a dialog.
//    • Badge levels are Pills (tones from BADGE_TONE, shared with
//      /contributors) with a medal emoji; amounts use tabular figures.
//    • Prices in the "be the first" prompts come from TIER_CONFIG, the same
//      config the checkout uses, and the module count from getPlatformFacts().
//
//  i18n: interface text is in page_contributors (en + kn). Supporter names,
//  messages and the district/state names stored with each supporter are
//  data and are shown as saved. BadgeExplainer and CorporateSponsorBanner
//  are shared with /contributors and keep their own text.
//
//  UNCHANGED: the query (endpoint, keys, refresh rate), the "just paid"
//  auto-refresh, the tier filters, the modal contents and every support link.
//
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ExternalLink,
  Github,
  Instagram,
  Linkedin,
  Twitter,
  Users,
  X,
} from "lucide-react";
import { daysUntil } from "@/lib/contribution-expiry";
import { normalizeSocialLink } from "@/lib/social-link";
import { TIER_CONFIG } from "@/lib/constants/razorpay-plans";
import { getPlatformFacts } from "@/lib/platform-facts";
import { useFormat, usePlaceText } from "@/i18n/client";
import BadgeExplainer, { BADGE_TONE } from "@/components/common/BadgeExplainer";
import CorporateSponsorBanner from "@/components/common/CorporateSponsorBanner";
import {
  Card,
  EmptyState,
  LoadingShell,
  PageHeader,
  Pill,
  Section,
  StatStrip,
  StatTile,
  ToolbarButton,
} from "@/components/district/ui";
import { ChartCard, Explainer, Pictogram } from "@/components/district/visuals";
import { ShareDonut, type DonutSlice } from "@/components/community/CommunityVisuals";
import { useDistrictName } from "@/components/community/usePlaceName";

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

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
  website: ExternalLink,
};

/** A medal for each badge level (same keys as BADGE_TONE). */
const BADGE_EMOJI: Record<string, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  platinum: "💎",
};

/**
 * Months of monthly support → step, using the same thresholds as the
 * badges (3+ bronze, 6+ silver, 12+ gold, 24+ platinum).
 */
const TENURE_STEPS: Array<{ key: "new" | "bronze" | "silver" | "gold" | "platinum"; min: number; emoji: string }> = [
  { key: "new", min: 0, emoji: "🌱" },
  { key: "bronze", min: 3, emoji: "🥉" },
  { key: "silver", min: 6, emoji: "🥈" },
  { key: "gold", min: 12, emoji: "🥇" },
  { key: "platinum", min: 24, emoji: "💎" },
];

function tenureStep(months: number): (typeof TENURE_STEPS)[number]["key"] {
  let key: (typeof TENURE_STEPS)[number]["key"] = "new";
  for (const s of TENURE_STEPS) if (months >= s.min) key = s.key;
  return key;
}

/** Cards shown per section before "View all" (the old row also switched to "View all" above 6). */
const PREVIEW_COUNT = 6;

/** Fewer supporters than this and a "N of every 10" picture would mislead. */
const MIN_FOR_PICTURE = 3;

/** "₹99" style price for a tier, read from the checkout config. */
function useTierPrice() {
  const f = useFormat();
  return (key: string): string => {
    const t = TIER_CONFIG[key];
    return t ? `₹${f.number(t.amount)}` : "";
  };
}

/** One supporter: initials circle, name (+ social link), tier label, badge Pill, tenure, amount. */
function ContributorCard({ c }: { c: Contributor }) {
  const t = useTranslations("page_contributors");
  const f = useFormat();
  const place = usePlaceText();
  const SocialIcon = c.socialPlatform ? SOCIAL_ICONS[c.socialPlatform] : null;
  const safeLink = normalizeSocialLink(c.socialLink);
  const initials = c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  // "Mandya champion", "India patron"… (same rules as getContributorLabel).
  const stateLabel = c.stateSlug || c.stateName ? place.state(c.stateSlug ?? c.stateName, c.stateName ?? undefined) : "";
  const label =
    c.tier === "founder" ? t("label.founder")
      : c.tier === "patron" ? t("label.patron")
        : c.tier === "state" ? (stateLabel ? t("label.state", { name: stateLabel }) : t("label.stateGeneric"))
          : c.tier === "district" ? (c.districtName ? t("label.district", { name: c.districtName }) : t("label.districtGeneric"))
            : c.tier === "chai" ? t("label.chai")
              : t("label.supporter");

  // One-time gifts show how long they stay on the wall.
  let expiryLabel: string | null = null;
  if (!c.isRecurring) {
    const d = daysUntil(c.expiresAt);
    if (d !== null) {
      if (d <= 0) expiryLabel = t("expired");
      else if (d <= 14) expiryLabel = t("expiresIn", { n: d });
      else if (c.expiresAt) expiryLabel = t("activeUntil", { date: f.date(c.expiresAt, { day: "numeric", month: "short", year: "numeric" }) });
    }
  }
  const tenure = c.monthsActive > 0
    ? c.monthsActive >= 12
      ? t("tenureYM", { y: Math.floor(c.monthsActive / 12), m: c.monthsActive % 12 })
      : t("tenureM", { m: c.monthsActive })
    : null;
  const level = c.badgeLevel?.toLowerCase() ?? null;
  const medal = level ? BADGE_EMOJI[level] : undefined;

  return (
    <Card as="li" padding={14} style={{ display: "flex", alignItems: "flex-start", gap: 12, listStyle: "none" }}>
      <span
        aria-hidden
        className="ftp-display"
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          background: "linear-gradient(135deg, var(--hue-tint) 0%, color-mix(in srgb, var(--hue-pop) 45%, #fff) 100%)",
          border: "1px solid color-mix(in srgb, var(--hue) 22%, transparent)",
          color: "var(--hue-deep)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {initials}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          <span className="ftp-title" style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, overflowWrap: "anywhere" }}>{c.name}</span>
          {safeLink && (
            <a
              href={safeLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("profileAria", { name: c.name })}
              style={{ color: "var(--hue)", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28 }}
            >
              {SocialIcon ? <SocialIcon size={14} aria-hidden /> : <ExternalLink size={14} aria-hidden />}
            </a>
          )}
        </div>
        <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 2 }}>{label}</div>
        <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
          {c.badgeLevel && level && (
            <Pill tone={BADGE_TONE[level] ?? BADGE_TONE[c.badgeLevel] ?? "neutral"} style={{ height: 22 }}>
              {medal && <span className="ftp-emoji" aria-hidden>{medal}</span>}
              {t.has(`badge.${level}`) ? t(`badge.${level}`) : c.badgeLevel}
            </Pill>
          )}
          {tenure && <span className="ftp-num">{tenure}</span>}
          {!c.isRecurring && c.amount ? (
            <span className="ftp-num" style={{ color: "var(--hue-deep)" }}>₹{f.number(c.amount)}</span>
          ) : null}
        </div>
        {c.message && (
          <p
            title={c.message}
            style={{
              fontSize: 13,
              lineHeight: "20px",
              color: "var(--ftp-text-2)",
              margin: "8px 0 0",
              padding: "6px 10px",
              borderRadius: 10,
              background: "color-mix(in srgb, var(--hue-tint) 60%, #fff)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            &ldquo;{c.message}&rdquo;
          </p>
        )}
        {expiryLabel && (
          <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 4 }} suppressHydrationWarning>{expiryLabel}</div>
        )}
      </div>
    </Card>
  );
}

/** Grid of contributor cards (one column on phones). */
const LIST_GRID: React.CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
  gap: 10,
};

/**
 * One tier section: emoji + H2 + count + optional "View all" button, then a
 * grid of the first PREVIEW_COUNT people (or an honest empty prompt).
 */
function TierSection({
  title,
  emoji,
  list,
  loading,
  onViewAll,
  empty,
}: {
  title: string;
  emoji: string;
  list: Contributor[];
  loading?: boolean;
  onViewAll?: () => void;
  empty: React.ReactNode;
}) {
  const t = useTranslations("page_contributors");
  const f = useFormat();
  return (
    <Section
      emoji={emoji}
      title={
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {title}
          {list.length > 0 && (
            <span
              className="ftp-num"
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 24,
                padding: "0 10px",
                borderRadius: "var(--ftp-radius-pill)",
                background: "var(--hue-tint)",
                color: "var(--hue-deep)",
                fontSize: 13,
                lineHeight: "16px",
              }}
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
        <ul style={LIST_GRID}>
          {list.slice(0, PREVIEW_COUNT).map((c) => (
            <ContributorCard key={c.id} c={c} />
          ))}
        </ul>
      )}
    </Section>
  );
}

/** Full list for one tier in a dialog. Esc or the backdrop closes it. */
function ViewAllModal({
  title,
  contributors,
  onClose,
}: {
  title: string;
  contributors: Contributor[];
  onClose: () => void;
}) {
  const t = useTranslations("page_contributors");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        // Backdrop: the text colour at 45 % so it follows light and dark themes.
        background: "color-mix(in srgb, var(--ftp-text) 45%, transparent)",
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="viewall-title"
        style={{
          background: "var(--ftp-surface)",
          border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
          borderRadius: "var(--ftp-radius-card)",
          boxShadow: "var(--ftp-shadow-2)",
          width: "100%",
          maxWidth: 900,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "12px 16px",
            borderBottom: "1px solid color-mix(in srgb, var(--hue) 18%, var(--ftp-border))",
            background: "linear-gradient(135deg, var(--hue-tint) 0%, #fff 80%)",
          }}
        >
          <div>
            <h2 id="viewall-title" className="ftp-display" style={{ margin: 0, fontSize: 18, lineHeight: "24px", fontWeight: 650, color: "var(--hue-deep)" }}>{title}</h2>
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{t("sortedBy")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            style={{
              background: "none",
              border: "none",
              color: "var(--ftp-text-2)",
              cursor: "pointer",
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <X size={20} aria-hidden />
          </button>
        </div>
        <ul style={{ ...LIST_GRID, padding: 16, overflow: "auto" }}>
          {contributors.map((c) => (
            <ContributorCard key={c.id} c={c} />
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Honest empty prompt for a tier with nobody in it yet, with its support link. */
function EmptyTier({ title, emoji, cta, href }: { title: string; emoji: string; cta: string; href: string }) {
  return (
    <EmptyState
      emoji={emoji}
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

export default function ContributorsClient({
  locale,
  stateSlug,
  districtSlug,
  districtName: districtNameEn,
  stateName: stateNameEn,
  population,
}: Props) {
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
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [justPaid, queryClient]);

  const refreshRate = justPaid ? 15_000 : 120_000;

  const { data: districtData, isLoading: loadingDist, dataUpdatedAt } = useQuery<{ contributors: Contributor[]; total: number }>({
    queryKey: ["contributors-district", districtSlug, stateSlug],
    queryFn: () => fetch(`/api/data/contributors?district=${districtSlug}&state=${stateSlug}&limit=500`).then((r) => r.json()),
    staleTime: refreshRate,
  });

  const all = districtData?.contributors ?? [];
  const districtChampions = all.filter((c) => c.tier === "district");
  const stateChampions = all.filter((c) => c.tier === "state");
  const indiaPatrons = all.filter((c) => c.tier === "patron" || c.tier === "founder");
  const oneTimers = all.filter((c) => !c.isRecurring);
  const monthly = all.length - oneTimers.length;

  const [modalKey, setModalKey] = useState<null | "district" | "state" | "india" | "onetime">(null);
  const modalData =
    modalKey === "district" ? { title: t("modalDistrict", { n: f.number(districtChampions.length), name: districtName }), list: districtChampions }
      : modalKey === "state" ? { title: t("modalState", { n: f.number(stateChampions.length), name: stateName }), list: stateChampions }
        : modalKey === "india" ? { title: t("modalIndia", { n: f.number(indiaPatrons.length) }), list: indiaPatrons }
          : modalKey === "onetime" ? { title: t("modalOneTime", { n: f.number(oneTimers.length) }), list: oneTimers }
            : null;

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

  // Picture 2: monthly supporters by how long they have given (badge steps).
  const recurring = all.filter((c) => c.isRecurring);
  const tenureSlices: DonutSlice[] = TENURE_STEPS.map((s) => ({
    key: s.key,
    label: t(`tenure.${s.key}`),
    emoji: s.emoji,
    value: recurring.filter((c) => tenureStep(c.monthsActive ?? 0) === s.key).length,
  })).filter((s) => s.value > 0);
  const yearPlus = recurring.filter((c) => (c.monthsActive ?? 0) >= 12).length;
  const showTenure = recurring.length >= MIN_FOR_PICTURE && tenureSlices.length >= 2;

  const bold = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;
  const num = (c: React.ReactNode) => <span className="ftp-num">{c}</span>;

  return (
    <div className="px-4 md:px-6 pt-6 pb-12" style={{ maxWidth: "calc(var(--ftp-reading-max) + 48px)" }}>
      <PageHeader
        icon={Users}
        accent="pink"
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
        <div style={{ marginBottom: 16 }}>
          <StatStrip cols={4}>
            <StatTile emoji="🏅" label={t("statDistrict")} value={f.number(districtChampions.length)} asOf={fetchedAt} />
            <StatTile emoji="🏆" label={t("statState")} value={f.number(stateChampions.length)} asOf={fetchedAt} />
            <StatTile emoji="👑" label={t("statIndia")} value={f.number(indiaPatrons.length)} asOf={fetchedAt} />
            <StatTile emoji="🎁" label={t("statOneTime")} value={f.number(oneTimers.length)} asOf={fetchedAt} />
          </StatStrip>
        </div>
      )}

      {/* Picture 1: who keeps this page going, counted from the list below. */}
      {!loadingDist && all.length > 0 && (
        <Card tinted padding={18} style={{ marginBottom: 16 }}>
          <Explainer emoji="🤝">
            {t.rich("simple", {
              count: f.number(all.length),
              n: all.length,
              name: districtName,
              monthlyCount: f.number(monthly),
              monthly,
              b: bold,
            })}
          </Explainer>
          {all.length >= MIN_FOR_PICTURE && (
            <Pictogram filled={monthlyOfTen} emoji="🙋" label={t("monthlyPicto", { n: Math.round(monthlyOfTen) })} />
          )}
        </Card>
      )}

      {/* Picture 2: how long monthly supporters have stayed. */}
      {!loadingDist && showTenure && (
        <div style={{ marginBottom: 24 }}>
          <ChartCard
            title={t("tenureTitle")}
            emoji="⏳"
            units={t("tenureUnits")}
            simple={
              yearPlus > 0
                ? t.rich("tenureSimple", { year: f.number(yearPlus), total: f.number(recurring.length), b: bold })
                : t("tenureSimpleNone")
            }
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
      )}

      {/* Corporate sponsor slot (shared component, English text, so it gets the English name) */}
      <CorporateSponsorBanner districtName={districtNameEn} population={population} />

      <BadgeExplainer />

      <TierSection
        title={t("tierDistrict", { name: districtName })}
        emoji="🏅"
        list={districtChampions}
        loading={loadingDist}
        onViewAll={districtChampions.length > PREVIEW_COUNT ? () => setModalKey("district") : undefined}
        empty={
          <EmptyTier
            emoji="🏅"
            title={t("emptyDistrict", { name: districtName })}
            cta={t("ctaDistrict", { price: tierPrice("district") })}
            href={supportHref}
          />
        }
      />

      <TierSection
        title={t("tierState", { name: stateName })}
        emoji="🏆"
        list={stateChampions}
        loading={loadingDist}
        onViewAll={stateChampions.length > PREVIEW_COUNT ? () => setModalKey("state") : undefined}
        empty={
          <EmptyTier
            emoji="🏆"
            title={t("emptyState", { name: stateName })}
            cta={t("ctaState", { name: stateName, price: tierPrice("state") })}
            href={stateHref}
          />
        }
      />

      <TierSection
        title={t("tierIndia")}
        emoji="👑"
        list={indiaPatrons}
        loading={loadingDist}
        onViewAll={indiaPatrons.length > PREVIEW_COUNT ? () => setModalKey("india") : undefined}
        empty={
          <EmptyTier
            emoji="👑"
            title={t("emptyIndia")}
            cta={t("ctaIndia", { price: tierPrice("patron") })}
            href={patronHref}
          />
        }
      />

      {oneTimers.length > 0 && (
        <TierSection
          title={t("tierOneTime")}
          emoji="🎁"
          list={oneTimers}
          onViewAll={oneTimers.length > PREVIEW_COUNT ? () => setModalKey("onetime") : undefined}
          empty={null}
        />
      )}

      {/* Closing call to action: a tinted card with one primary button. */}
      <Card tinted style={{ marginTop: 32, textAlign: "center" }} padding={24}>
        <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 52, height: 52, fontSize: 26, borderRadius: 16, marginBottom: 12 }}>
          🤝
        </span>
        <h2 className="ftp-h2" style={{ marginBottom: 8 }}>
          {t.rich("ctaTitle", { name: districtName, price: tierPrice("district"), n: num })}
        </h2>
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 16, fontSize: 14, lineHeight: "21px" }}>
          {t.rich("ctaBody", { name: districtName, modules: f.number(MODULES_PER_DISTRICT), citizens, n: num })}
        </p>
        {/* Filled in the page hue by .ftp-btn-primary (globals.css). */}
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

      {modalData && (
        <ViewAllModal
          title={modalData.title}
          contributors={modalData.list}
          onClose={() => setModalKey(null)}
        />
      )}
    </div>
  );
}
