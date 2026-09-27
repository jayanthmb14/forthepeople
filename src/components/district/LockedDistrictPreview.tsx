/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════
//  LockedDistrictPreview — the page for a district that is not live yet
//  (Design v3, CONCEPT-v3 §5).
// ═══════════════════════════════════════════════════════════
//
//  1. The same identity card a live district gets (name, local script,
//     Census numbers) with a "Not live yet" pill instead of a grade.
//  2. The vote block: "Not live yet · N people asked · Vote". The count
//     comes from GET /api/district-request?all=1 (the same list the
//     vote-district page uses); the button sends one vote with
//     POST /api/district-request and shows the new total.
//  3. Sponsor links (unchanged flows) and, when present, the names of
//     supporters already waiting for this district.
//  4. The module list, shown quietly so people can see what they will get.
//
//  The module count is read from the sidebar registry (getPlatformFacts),
//  never typed by hand.

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { HandHeart, Lock, ThumbsUp } from "lucide-react";
import { getTieredModules } from "@/lib/constants/sidebar-modules";
import { TIER_CONFIG } from "@/lib/constants/razorpay-plans";
import { getPlatformFacts } from "@/lib/platform-facts";
import { getStateConfig } from "@/lib/constants/state-config";
import { Card, Pill, Section } from "@/components/district/ui";
import DistrictIdentityCard from "@/components/district/DistrictIdentityCard";

interface Props {
  locale: string;
  stateSlug: string;
  districtSlug: string;
  stateName: string;
  districtName: string;
  districtNameLocal?: string;
  tagline?: string;
  population?: number | null;
  area?: number | null;
  talukCount?: number;
  literacy?: number | null;
}

interface Sponsor {
  id: string;
  name: string;
  tier: string;
}

interface DistrictRequestRow {
  stateName: string;
  districtName: string;
  requestCount: number;
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function LockedDistrictPreview({
  locale,
  stateSlug,
  districtSlug,
  stateName,
  districtName,
  districtNameLocal,
  tagline,
  population,
  area,
  talukCount,
  literacy,
}: Props) {
  // Supporters already waiting for this district (unchanged request).
  const { data } = useQuery<{ contributors: Sponsor[] }>({
    queryKey: ["district-sponsors", districtSlug, stateSlug],
    queryFn: () =>
      fetch(`/api/data/contributors?district=${districtSlug}&state=${stateSlug}`).then((r) => r.json()),
    staleTime: 120_000,
  });
  const sponsors = data?.contributors ?? [];

  // How many people have asked for this district.
  const { data: requests, isLoading: requestsLoading } = useQuery<{ all: DistrictRequestRow[] }>({
    queryKey: ["district-requests", "all"],
    queryFn: () => fetch(`/api/district-request?all=1`).then((r) => r.json()),
    staleTime: 60_000,
  });
  const serverCount =
    requests?.all?.find(
      (r) => r.stateName.toLowerCase() === stateName.toLowerCase() && r.districtName.toLowerCase() === districtName.toLowerCase(),
    )?.requestCount ?? 0;

  // Vote button state. After a vote we show the total the server returned.
  const [voteState, setVoteState] = useState<"idle" | "sending" | "done" | "error" | "limited">("idle");
  const [votedCount, setVotedCount] = useState<number | null>(null);
  const askedCount = votedCount ?? serverCount;

  async function vote() {
    setVoteState("sending");
    try {
      const res = await fetch("/api/district-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stateName, districtName }),
      });
      if (res.status === 429) {
        setVoteState("limited");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as { requestCount?: number };
      if (typeof json.requestCount === "number") setVotedCount(json.requestCount);
      setVoteState("done");
    } catch {
      setVoteState("error");
    }
  }

  const { modulesPerDistrict } = getPlatformFacts();
  const subUnitLabel = getStateConfig(stateSlug)?.subDistrictUnitPlural ?? "Taluks";
  const groups = getTieredModules();

  return (
    <div className="px-4 md:px-6 pt-6 pb-12" style={{ maxWidth: "calc(var(--ftp-reading-max) + 48px)" }}>
      {/* ═══ 1. Identity card ═══ */}
      <DistrictIdentityCard
        name={districtName}
        nameLocal={districtNameLocal}
        stateName={stateName}
        tagline={tagline}
        population={population}
        area={area}
        literacy={literacy}
        subUnitCount={talukCount || null}
        subUnitLabel={subUnitLabel}
        aside={<Pill tone="warn" icon={Lock}>Not live yet</Pill>}
      >
        {/* ═══ 2. Vote block ═══ */}
        <div
          style={{
            marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--ftp-border)",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p className="ftp-title">
              Not live yet ·{" "}
              {requestsLoading && votedCount === null ? (
                <span style={{ color: "var(--ftp-text-2)" }}>counting requests…</span>
              ) : (
                <>
                  <span className="ftp-num">{askedCount.toLocaleString("en-IN")}</span>{" "}
                  {askedCount === 1 ? "person has" : "people have"} asked for it
                </>
              )}
            </p>
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 2 }}>
              {modulesPerDistrict} data dashboards are waiting to be unlocked for {districtName}. The most-requested districts go live first.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={vote}
              disabled={voteState === "sending" || voteState === "done"}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                minHeight: 44, padding: "0 16px",
                borderRadius: "var(--ftp-radius-tile)", border: "1px solid var(--ftp-brand)",
                background: voteState === "done" ? "var(--ftp-brand-tint)" : "var(--ftp-brand)",
                color: voteState === "done" ? "var(--ftp-brand-deep)" : "var(--ftp-surface)",
                fontFamily: "var(--ftp-font-sans)", fontSize: 13, fontWeight: 500,
                cursor: voteState === "sending" || voteState === "done" ? "default" : "pointer",
              }}
            >
              <ThumbsUp size={16} aria-hidden />
              {voteState === "done" ? "Thanks — vote counted" : voteState === "sending" ? "Sending…" : `Vote for ${districtName}`}
            </button>
            <Link
              href={`/${locale}/vote-district`}
              style={{ fontSize: 13, color: "var(--ftp-brand)", textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}
            >
              See all requests
            </Link>
          </div>
        </div>
        <p role="status" aria-live="polite" style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: "6px 0 0", minHeight: 16 }}>
          {voteState === "limited"
            ? "Too many votes from this network in the last minute. Please try again shortly."
            : voteState === "error"
              ? "Could not record the vote. Please try again."
              : ""}
        </p>
      </DistrictIdentityCard>

      {/* ═══ 3. Sponsor ═══ */}
      <Section title={`Help bring ${districtName} online`}>
        <Card>
          <p className="ftp-body" style={{ marginBottom: 8 }}>
            Be the first to sponsor this district and your name will appear here when it launches.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <Link
              href={`/${locale}/support?tier=district&state=${stateSlug}&district=${districtSlug}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 13, fontWeight: 500, color: "var(--ftp-support)", textDecoration: "none" }}
            >
              <HandHeart size={16} aria-hidden />
              Sponsor {districtName} — {inr(TIER_CONFIG.district.amount)}/mo
            </Link>
            <Link href={`/${locale}/support?tier=state&state=${stateSlug}`} style={{ fontSize: 13, color: "var(--ftp-text-2)", textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}>
              or sponsor all of {stateName}
            </Link>
            <Link href={`/${locale}/support?tier=patron`} style={{ fontSize: 13, color: "var(--ftp-text-2)", textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}>
              or all of India
            </Link>
          </div>

          {sponsors.length > 0 && (
            <p className="ftp-body" style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--ftp-border)", color: "var(--ftp-text-2)" }}>
              <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{sponsors.length}</span>{" "}
              sponsor{sponsors.length !== 1 ? "s" : ""} waiting for {districtName}:{" "}
              <span style={{ color: "var(--ftp-text)" }}>{sponsors.map((s) => s.name).join(" · ")}</span>
            </p>
          )}
        </Card>
      </Section>

      {/* ═══ 4. What will be here ═══ */}
      <Section title="What you will get">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))",
            gap: 12,
            alignItems: "start",
          }}
        >
          {groups.map((group) => {
            const mods = group.modules.filter((m) => m.slug !== "overview" && m.slug !== "contributors");
            if (mods.length === 0) return null;
            return (
              <Card key={group.label} as="section" padding={0} aria-label={group.label}>
                <h3 className="ftp-label" style={{ padding: "12px 16px 4px" }}>{group.label}</h3>
                <ul style={{ listStyle: "none", margin: 0, padding: "0 0 8px" }}>
                  {mods.map((mod) => {
                    const Icon = mod.icon;
                    return (
                      <li key={mod.slug} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 16px", fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
                        <Icon size={16} aria-hidden style={{ flexShrink: 0 }} />
                        <span style={{ flex: 1, minWidth: 0 }}>{mod.label}</span>
                        <Lock size={12} aria-label="Locked" style={{ flexShrink: 0 }} />
                      </li>
                    );
                  })}
                </ul>
              </Card>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
