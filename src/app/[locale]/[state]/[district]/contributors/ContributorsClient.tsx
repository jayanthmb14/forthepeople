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
//  Design v3 "Civic Ledger" (2026-09-27):
//    • PageHeader + StatStrip (four honest counts, dated by the fetch time).
//    • Each tier is a kit Section; contributors are Cards in a grid. The
//      old auto-scrolling marquee is gone (v3 allows no decorative motion),
//      so each section shows the first PREVIEW_COUNT people and a
//      "View all" button opens the full, sorted list in a dialog.
//    • Badge levels are Pills (tones from BADGE_TONE, shared with
//      /contributors); amounts are mono; no emoji, no gradients, no shadows.
//    • Prices in the "be the first" prompts come from TIER_CONFIG, the same
//      config the checkout uses, and the module count from getPlatformFacts().
//
//  UNCHANGED: the query (endpoint, keys, refresh rate), the "just paid"
//  auto-refresh, the tier filters, the modal contents and every support link.
//
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Github,
  Instagram,
  Linkedin,
  Twitter,
  Users,
  X,
} from "lucide-react";
import { getContributorLabel } from "@/lib/contributor-label";
import { formatExpiryLabel } from "@/lib/contribution-expiry";
import { normalizeSocialLink } from "@/lib/social-link";
import { TIER_CONFIG } from "@/lib/constants/razorpay-plans";
import { getPlatformFacts } from "@/lib/platform-facts";
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

/** Cards shown per section before "View all" (the old row also switched to "View all" above 6). */
const PREVIEW_COUNT = 6;

/** "₹99" style price for a tier, read from the checkout config. */
function tierPrice(key: string): string {
  const t = TIER_CONFIG[key];
  return t ? `₹${t.amount.toLocaleString("en-IN")}` : "";
}

/** One supporter: initials circle, name (+ social link), tier label, badge Pill, tenure, amount. */
function ContributorCard({ c }: { c: Contributor }) {
  const SocialIcon = c.socialPlatform ? SOCIAL_ICONS[c.socialPlatform] : null;
  const safeLink = normalizeSocialLink(c.socialLink);
  const initials = c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const label = getContributorLabel(c.tier, c.districtName, c.stateName);
  const expiryLabel = c.isRecurring ? null : formatExpiryLabel(c.expiresAt);
  const tenure = c.monthsActive > 0
    ? c.monthsActive >= 12
      ? `${Math.floor(c.monthsActive / 12)}y ${c.monthsActive % 12}mo`
      : `${c.monthsActive}mo`
    : null;

  return (
    <Card as="li" padding={14} style={{ display: "flex", alignItems: "flex-start", gap: 10, listStyle: "none" }}>
      <span
        aria-hidden
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "var(--ftp-surface-2)",
          color: "var(--ftp-text-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        {initials}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          <span className="ftp-title" style={{ fontSize: 14, lineHeight: "20px", overflowWrap: "anywhere" }}>{c.name}</span>
          {safeLink && (
            <a
              href={safeLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${c.name}'s profile`}
              style={{ color: "var(--ftp-text-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28 }}
            >
              {SocialIcon ? <SocialIcon size={14} aria-hidden /> : <ExternalLink size={14} aria-hidden />}
            </a>
          )}
        </div>
        <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 2 }}>{label}</div>
        <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
          {c.badgeLevel && (
            <Pill tone={BADGE_TONE[c.badgeLevel] ?? "neutral"} style={{ height: 20, textTransform: "capitalize" }}>
              {c.badgeLevel}
            </Pill>
          )}
          {tenure && <span className="ftp-num">{tenure}</span>}
          {!c.isRecurring && c.amount ? (
            <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>₹{c.amount.toLocaleString("en-IN")}</span>
          ) : null}
        </div>
        {c.message && (
          <p
            title={c.message}
            style={{
              fontSize: 13,
              lineHeight: "20px",
              color: "var(--ftp-text-2)",
              margin: "6px 0 0",
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
          <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 4 }}>{expiryLabel}</div>
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
 * One tier section: H2 + count Pill + optional "View all" button, then a grid
 * of the first PREVIEW_COUNT people (or an honest empty prompt).
 */
function TierSection({
  title,
  list,
  loading,
  onViewAll,
  empty,
}: {
  title: string;
  list: Contributor[];
  loading?: boolean;
  onViewAll?: () => void;
  empty: React.ReactNode;
}) {
  return (
    <Section
      title={
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {title}
          {list.length > 0 && (
            <Pill tone="neutral">
              <span className="ftp-num">{list.length.toLocaleString("en-IN")}</span>
            </Pill>
          )}
        </span>
      }
      action={
        onViewAll ? (
          <ToolbarButton onClick={onViewAll} ariaLabel={`View all ${list.length} ${title}`}>
            View all
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
          border: "1px solid var(--ftp-border)",
          borderRadius: "var(--ftp-radius-card)",
          width: "100%",
          maxWidth: 900,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "12px 16px",
            borderBottom: "1px solid var(--ftp-border)",
          }}
        >
          <div>
            <h2 id="viewall-title" className="ftp-title">{title}</h2>
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>Sorted by amount (highest first)</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
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
function EmptyTier({ title, cta, href }: { title: string; cta: string; href: string }) {
  return (
    <EmptyState
      title={title}
      action={
        <Link
          href={href}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 13, fontWeight: 500, color: "var(--ftp-brand)", textDecoration: "none" }}
        >
          {cta}
          <ArrowRight size={14} aria-hidden />
        </Link>
      }
    />
  );
}

export default function ContributorsClient({
  locale,
  stateSlug,
  districtSlug,
  districtName,
  stateName,
  population,
}: Props) {
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

  const [modalKey, setModalKey] = useState<null | "district" | "state" | "india" | "onetime">(null);
  const modalData = useMemo(() => {
    switch (modalKey) {
      case "district": return { title: `All ${districtChampions.length.toLocaleString("en-IN")} ${districtName} Champions`, list: districtChampions };
      case "state": return { title: `All ${stateChampions.length.toLocaleString("en-IN")} ${stateName} Champions`, list: stateChampions };
      case "india": return { title: `All ${indiaPatrons.length.toLocaleString("en-IN")} India Patrons & Royal Contributors`, list: indiaPatrons };
      case "onetime": return { title: `All ${oneTimers.length.toLocaleString("en-IN")} One-Time Supporters`, list: oneTimers };
      default: return null;
    }
  }, [modalKey, districtChampions, stateChampions, indiaPatrons, oneTimers, districtName, stateName]);

  const supportHref = `/${locale}/support?tier=district&state=${stateSlug}&district=${districtSlug}`;
  const stateHref = `/${locale}/support?tier=state&state=${stateSlug}`;
  const patronHref = `/${locale}/support?tier=patron`;

  // The counts are only as fresh as the last fetch, so we date them with it.
  const fetchedAt = dataUpdatedAt > 0 ? new Date(dataUpdatedAt) : null;
  const citizens =
    population && population > 0
      ? population >= 100_000
        ? `${(population / 100_000).toFixed(1)} lakh citizens`
        : `${population.toLocaleString("en-IN")} citizens`
      : "every citizen";

  return (
    <div className="px-4 md:px-6 pt-6 pb-12" style={{ maxWidth: "calc(var(--ftp-reading-max) + 48px)" }}>
      <PageHeader
        icon={Users}
        accent="pink"
        title={`${districtName} Contributors`}
        description={`People who keep ${districtName}'s data free and accessible to every citizen.`}
        backHref={`/${locale}/${stateSlug}/${districtSlug}`}
        backLabel={`${stateName} · ${districtName}`}
        freshness={fetchedAt ? { asOf: fetchedAt } : undefined}
      />

      {showBanner && (
        <Card role="status" style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 24 }}>
          <CheckCircle2 size={18} aria-hidden style={{ color: "var(--ftp-live)", flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="ftp-title" style={{ color: "var(--ftp-live-text)" }}>Your contribution is being processed.</p>
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>
              It will appear here within a minute. This page refreshes itself every 15 seconds for the next 3 minutes.
            </p>
          </div>
        </Card>
      )}

      {!loadingDist && (
        <div style={{ marginBottom: 24 }}>
          <StatStrip cols={4}>
            <StatTile label="District Champions" value={districtChampions.length.toLocaleString("en-IN")} asOf={fetchedAt} />
            <StatTile label="State Champions" value={stateChampions.length.toLocaleString("en-IN")} asOf={fetchedAt} />
            <StatTile label="India Patrons" value={indiaPatrons.length.toLocaleString("en-IN")} asOf={fetchedAt} />
            <StatTile label="One-time" value={oneTimers.length.toLocaleString("en-IN")} asOf={fetchedAt} />
          </StatStrip>
        </div>
      )}

      {/* Corporate sponsor slot (component unchanged) */}
      <CorporateSponsorBanner districtName={districtName} population={population} />

      <BadgeExplainer />

      <TierSection
        title={`${districtName} Champions`}
        list={districtChampions}
        loading={loadingDist}
        onViewAll={districtChampions.length > PREVIEW_COUNT ? () => setModalKey("district") : undefined}
        empty={
          <EmptyTier
            title={`No ${districtName} Champions yet.`}
            cta={`Be the first, from ${tierPrice("district")}/month`}
            href={supportHref}
          />
        }
      />

      <TierSection
        title={`${stateName} Champions`}
        list={stateChampions}
        loading={loadingDist}
        onViewAll={stateChampions.length > PREVIEW_COUNT ? () => setModalKey("state") : undefined}
        empty={
          <EmptyTier
            title={`No ${stateName} Champions yet.`}
            cta={`Sponsor all of ${stateName}, from ${tierPrice("state")}/month`}
            href={stateHref}
          />
        }
      />

      <TierSection
        title="India Patrons & Royal Contributors"
        list={indiaPatrons}
        loading={loadingDist}
        onViewAll={indiaPatrons.length > PREVIEW_COUNT ? () => setModalKey("india") : undefined}
        empty={
          <EmptyTier
            title="No India Patrons yet."
            cta={`Become an India Patron, from ${tierPrice("patron")}/month`}
            href={patronHref}
          />
        }
      />

      {oneTimers.length > 0 && (
        <TierSection
          title="One-Time Supporters"
          list={oneTimers}
          onViewAll={oneTimers.length > PREVIEW_COUNT ? () => setModalKey("onetime") : undefined}
          empty={null}
        />
      )}

      {/* Closing call to action: a plain card with one primary button. */}
      <Card style={{ marginTop: 32, textAlign: "center" }} padding={24}>
        <h2 className="ftp-h2" style={{ marginBottom: 8 }}>
          Support {districtName}&apos;s data, from <span className="ftp-num">{tierPrice("district")}</span>/month
        </h2>
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 16 }}>
          Every rupee keeps {districtName}&apos;s <span className="ftp-num">{MODULES_PER_DISTRICT}</span> dashboards free for {citizens}.
        </p>
        <Link
          href={supportHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            minHeight: 44,
            padding: "0 20px",
            background: "var(--ftp-brand)",
            color: "var(--ftp-surface)",
            borderRadius: "var(--ftp-radius-tile)",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Become a Champion
          <ArrowRight size={14} aria-hidden />
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
