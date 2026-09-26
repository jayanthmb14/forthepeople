/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Instagram, Linkedin, Github, Twitter, ExternalLink, X } from "lucide-react";
import { BADGE_COLORS } from "@/lib/badge-level";
import { getContributorLabel } from "@/lib/contributor-label";
import { formatExpiryLabel } from "@/lib/contribution-expiry";
import { normalizeSocialLink } from "@/lib/social-link";
import BadgeExplainer from "@/components/common/BadgeExplainer";
import CorporateSponsorBanner from "@/components/common/CorporateSponsorBanner";

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

function ContributorCard({ c }: { c: Contributor }) {
  const badgeColors = c.badgeLevel ? BADGE_COLORS[c.badgeLevel] : null;
  const SocialIcon = c.socialPlatform ? SOCIAL_ICONS[c.socialPlatform] : null;
  const initials = c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const label = getContributorLabel(c.tier, c.districtName, c.stateName);
  const expiryLabel = c.isRecurring ? null : formatExpiryLabel(c.expiresAt);
  const tenure = c.monthsActive > 0
    ? c.monthsActive >= 12
      ? `${Math.floor(c.monthsActive / 12)}y ${c.monthsActive % 12}mo`
      : `${c.monthsActive}mo`
    : null;

  const nameContent = (
    <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{c.name}</span>
  );

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: `1.5px solid ${badgeColors?.border ?? "#E8E8E4"}`,
        borderRadius: 12,
        padding: "14px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        minWidth: 240,
        width: 260,
        flex: "0 0 auto",
        scrollSnapAlign: "start",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: badgeColors?.bg ?? "#F5F5F0",
          color: badgeColors?.text ?? "#6B6B6B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 700,
          flexShrink: 0,
          border: badgeColors ? `2px solid ${badgeColors.border}` : "1px solid #E8E8E4",
        }}
      >
        {initials}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {normalizeSocialLink(c.socialLink) ? (
            <a
              href={normalizeSocialLink(c.socialLink)!}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 4 }}
            >
              {nameContent}
              {SocialIcon && <SocialIcon size={13} color="#6B6B6B" />}
            </a>
          ) : (
            nameContent
          )}
        </div>
        <div style={{ fontSize: 11, color: "#6B6B6B", marginTop: 2, fontWeight: 500 }}>
          {label}
        </div>
        <div style={{ fontSize: 10, color: "#9B9B9B", display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginTop: 3 }}>
          {c.badgeLevel && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: "1px 5px",
                borderRadius: 4,
                background: badgeColors?.bg,
                color: badgeColors?.text,
                textTransform: "uppercase",
              }}
            >
              {c.badgeLevel}
            </span>
          )}
          {tenure && <span>· {tenure}</span>}
          {!c.isRecurring && c.amount && (
            <span style={{ fontWeight: 700, color: "#2563EB", fontFamily: "var(--font-mono, monospace)" }}>
              · ₹{c.amount.toLocaleString("en-IN")}
            </span>
          )}
        </div>
        {c.message && (
          <div
            title={c.message}
            style={{
              fontSize: 11,
              color: "#9B9B9B",
              marginTop: 6,
              fontStyle: "italic",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            &ldquo;{c.message}&rdquo;
          </div>
        )}
        {expiryLabel && (
          <div style={{ fontSize: 10, color: "#9B9B9B", marginTop: 5 }}>{expiryLabel}</div>
        )}
      </div>
    </div>
  );
}

const INITIAL_VISIBLE = 30;
const MAX_RENDERED = 60; // cap rendered cards so the loop track stays small

function ScrollableRow({
  contributors,
  emptyState,
}: {
  contributors: Contributor[];
  emptyState: React.ReactNode;
}) {
  const slice = useMemo(
    () => contributors.slice(0, Math.min(INITIAL_VISIBLE, MAX_RENDERED)),
    [contributors]
  );
  // Only auto-scroll when there are enough cards to need it (~4+ fills a row).
  const shouldLoop = slice.length >= 4;
  const track = shouldLoop ? [...slice, ...slice] : slice;

  if (contributors.length === 0) {
    return <div>{emptyState}</div>;
  }

  return (
    <div
      className="scroll-row-viewport"
      style={{
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        className={shouldLoop ? "scroll-row-track scroll-row-track--looping" : "scroll-row-track"}
        style={{
          display: "flex",
          gap: 10,
          width: shouldLoop ? "max-content" : undefined,
          overflowX: shouldLoop ? "visible" : "auto",
          scrollSnapType: shouldLoop ? undefined : "x mandatory",
          paddingBottom: 6,
          scrollbarWidth: "thin",
        }}
      >
        {track.map((c, i) => (
          <ContributorCard key={`${c.id}-${i}`} c={c} />
        ))}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  count,
  onViewAll,
}: {
  title: string;
  count: number;
  onViewAll?: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.2px", margin: 0 }}>
        {title}
      </h2>
      {count > 0 && (
        onViewAll ? (
          <button
            onClick={onViewAll}
            title="Click to view all"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              color: "#2563EB",
              textDecoration: "underline",
              textDecorationStyle: "dotted",
              marginLeft: 2,
            }}
          >
            {count.toLocaleString("en-IN")}
          </button>
        ) : (
          <span style={{ fontSize: 12, color: "#9B9B9B", fontWeight: 500 }}>
            {count.toLocaleString("en-IN")}
          </span>
        )
      )}
    </div>
  );
}

function SectionLoading() {
  return <div style={{ padding: 20, textAlign: "center", color: "#9B9B9B", fontSize: 13 }}>Loading...</div>;
}

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
        background: "rgba(0,0,0,0.45)",
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        className="viewall-modal-content"
        style={{
          background: "#FFFFFF",
          borderRadius: 14,
          width: "100%",
          maxWidth: 900,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #F0F0EC",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>{title}</div>
            <div style={{ fontSize: 12, color: "#9B9B9B", marginTop: 2 }}>
              Sorted by amount (highest first)
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              color: "#6B6B6B",
              cursor: "pointer",
              padding: 6,
              display: "flex",
            }}
          >
            <X size={20} />
          </button>
        </div>
        <div
          className="viewall-modal-grid"
          style={{
            padding: 20,
            overflow: "auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 10,
          }}
        >
          {contributors.map((c) => (
            <ContributorCard key={c.id} c={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyCTA({ text, href, accent }: { text: string; href: string; accent: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "22px 18px",
        background: "#FAFAF8",
        border: `2px dashed ${accent}`,
        borderRadius: 12,
        textDecoration: "none",
        color: accent,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {text}
    </Link>
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

  const { data: districtData, isLoading: loadingDist } = useQuery<{ contributors: Contributor[]; total: number }>({
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

  return (
    <div style={{ padding: "24px 28px", maxWidth: 980 }}>
      <style>{`
        @keyframes ftp-row-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .scroll-row-track--looping {
          animation: ftp-row-scroll 90s linear infinite;
          will-change: transform;
        }
        .scroll-row-viewport:hover .scroll-row-track--looping {
          animation-play-state: paused;
        }
        @media (max-width: 768px) {
          .scroll-row-track--looping { animation-duration: 60s; }
        }
        @media (prefers-reduced-motion: reduce) {
          .scroll-row-track--looping {
            animation: none;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
          }
        }
        @media (max-width: 600px) {
          .viewall-modal-content {
            max-width: 100% !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
            height: 100vh;
          }
          .viewall-modal-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "#9B9B9B", marginBottom: 4 }}>
          {stateName} → {districtName}
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.4px", margin: 0 }}>
          {districtName} Contributors
        </h1>
        <p style={{ fontSize: 13, color: "#6B6B6B", marginTop: 4 }}>
          People who keep {districtName}&apos;s data free and accessible to every citizen.
        </p>
      </div>

      {showBanner && (
        <div style={{
          background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10,
          padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>🎉</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#15803D" }}>Your contribution is being processed!</div>
            <div style={{ fontSize: 12, color: "#16A34A" }}>It will appear here within a minute. This page auto-refreshes.</div>
          </div>
        </div>
      )}

      {/* Section 1: Corporate Sponsor Banner */}
      <CorporateSponsorBanner districtName={districtName} population={population} />

      <BadgeExplainer />

      {/* Section 2: District Champions */}
      <div style={{ marginTop: 28, marginBottom: 28 }}>
        <SectionHeader
          title={`🏛️ ${districtName} Champions`}
          count={districtChampions.length}
          onViewAll={districtChampions.length > 6 ? () => setModalKey("district") : undefined}
        />
        {loadingDist ? (
          <SectionLoading />
        ) : (
          <ScrollableRow
            contributors={districtChampions}
            emptyState={<EmptyCTA text={`Be the first ${districtName} Champion → from ₹99/mo`} href={supportHref} accent="#2563EB" />}
          />
        )}
      </div>

      {/* Section 3: State Champions */}
      <div style={{ marginBottom: 28 }}>
        <SectionHeader
          title={`🇮🇳 ${stateName} Champions`}
          count={stateChampions.length}
          onViewAll={stateChampions.length > 6 ? () => setModalKey("state") : undefined}
        />
        {loadingDist ? (
          <SectionLoading />
        ) : (
          <ScrollableRow
            contributors={stateChampions}
            emptyState={<EmptyCTA text={`Sponsor all of ${stateName} → from ₹999/mo`} href={stateHref} accent="#7C3AED" />}
          />
        )}
      </div>

      {/* Section 4: India Patrons & Royal Contributors */}
      <div style={{ marginBottom: 28 }}>
        <SectionHeader
          title="👑 India Patrons & Royal Contributors"
          count={indiaPatrons.length}
          onViewAll={indiaPatrons.length > 6 ? () => setModalKey("india") : undefined}
        />
        {loadingDist ? (
          <SectionLoading />
        ) : (
          <ScrollableRow
            contributors={indiaPatrons}
            emptyState={<EmptyCTA text="Become an India Patron → from ₹9,999/mo" href={patronHref} accent="#DC2626" />}
          />
        )}
      </div>

      {/* Section 5: One-Time Supporters */}
      {oneTimers.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionHeader
            title="💝 One-Time Supporters"
            count={oneTimers.length}
            onViewAll={oneTimers.length > 6 ? () => setModalKey("onetime") : undefined}
          />
          <ScrollableRow
            contributors={oneTimers}
            emptyState={null}
          />
        </div>
      )}

      {/* Section 6: Bottom CTA */}
      <Link
        href={supportHref}
        style={{
          display: "block",
          background: "linear-gradient(135deg, #EFF6FF, #F0FDF4)",
          border: "2px solid #BFDBFE",
          borderRadius: 16,
          padding: "24px 28px",
          textDecoration: "none",
          marginTop: 32,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
          Support {districtName}&apos;s Data — from ₹99/mo
        </div>
        <div style={{ fontSize: 13, color: "#4B4B4B", lineHeight: 1.6, marginBottom: 14 }}>
          Every rupee keeps {districtName}&apos;s 29 dashboards free for{" "}
          {population && population > 0
            ? population >= 100_000
              ? `${(population / 100_000).toFixed(1)} lakh citizens`
              : `${population.toLocaleString("en-IN")} citizens`
            : "every citizen"}.
        </div>
        <div
          style={{
            display: "inline-block",
            padding: "10px 22px",
            background: "#2563EB",
            color: "#fff",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Become a Champion →
        </div>
      </Link>

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
