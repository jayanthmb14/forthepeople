/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Features page — /features
//
// Session 17 v11 Phase F: Vote on existing ideas (top) + Share
// Your Idea form (bottom, anchored at #share-idea so the homepage
// thin-bar can deep-link to it). The form lives EXCLUSIVELY here
// — the homepage VoteFeaturesCTA is a compact thin bar + 3-line
// list that scrolls visitors to /features#share-idea.
//
// Design v3 (2026-09-27): PageHeader + Chips + Card + Pill from the
// kit, token colours only, Lucide icons only. The per-feature `icon`
// field (an emoji stored in the DB) is no longer drawn. Voting logic,
// the API calls and the localStorage "already voted" list are unchanged.
// ═══════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, Lightbulb, ThumbsUp, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import SuggestionForm from "@/components/features/SuggestionForm";
import { Card, Chips, EmptyState, LoadingShell, PageHeader, Pill } from "@/components/district/ui";
import type { Tone } from "@/components/district/ui";

interface Feature {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  votes: number;
  status: "proposed" | "in-progress" | "completed";
  priority: number;
}

/** Status → Pill tone + icon. Colour shows only as the pill's text/dot. */
const STATUS_CONFIG: Record<Feature["status"], { label: string; icon: LucideIcon; tone: Tone }> = {
  proposed: { label: "Proposed", icon: Zap, tone: "neutral" },
  "in-progress": { label: "In Progress", icon: Clock, tone: "warn" },
  completed: { label: "Completed", icon: CheckCircle, tone: "live" },
};

export default function FeaturesPage() {
  return (
    <main style={{ background: "var(--ftp-bg)", minHeight: "calc(100vh - 56px)" }}>
      <div className="ftp-container" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <div style={{ maxWidth: 800 }}>
          <PageHeader
            icon={Lightbulb}
            accent="purple"
            title="Help shape ForThePeople.in"
            description="Vote for the features you want most, or scroll down to share your own idea. The highest-voted features get built first."
          />

          <VoteSection />

          <section id="share-idea" style={{ marginTop: 48, scrollMarginTop: 80 }}>
            <Card padding={20}>
              <h2 className="ftp-h2" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Lightbulb size={20} aria-hidden style={{ color: "var(--ftp-features)" }} />
                Share your idea
              </h2>
              <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "4px 0 16px" }}>
                Have a feature in mind that&apos;s not listed? Suggest it below — we review every submission.
              </p>
              <SuggestionForm />
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}

// ═══ Vote section (was VoteTab) ══════════════════════════════
function VoteSection() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [voted, setVoted] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try { return new Set(JSON.parse(localStorage.getItem("ftp_votes") ?? "[]") as string[]); }
    catch { return new Set(); }
  });
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  useEffect(() => {
    fetch("/api/features")
      .then((r) => r.json())
      .then((d: { features: Feature[] }) => {
        setFeatures(d.features ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleVote(featureId: string) {
    if (voted.has(featureId) || voting) return;
    setVoting(featureId);
    try {
      const res = await fetch(`/api/features?id=${featureId}`, { method: "POST" });
      const data = await res.json() as { success?: boolean; votes?: number; error?: string };
      if (res.ok && data.success) {
        setFeatures((prev) => prev.map((f) => f.id === featureId ? { ...f, votes: data.votes ?? f.votes + 1 } : f));
        const newVoted = new Set(voted);
        newVoted.add(featureId);
        setVoted(newVoted);
        localStorage.setItem("ftp_votes", JSON.stringify([...newVoted]));
      }
    } catch { /* ignore */ }
    setVoting(null);
  }

  const categories = ["All", ...Array.from(new Set(features.map((f) => f.category)))];
  const filtered = activeCategory === "All" ? features : features.filter((f) => f.category === activeCategory);
  const totalVotes = features.reduce((s, f) => s + f.votes, 0);

  return (
    <>
      {!loading && (
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 12 }}>
          <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{totalVotes.toLocaleString("en-IN")}</span> total votes across{" "}
          <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{features.length}</span> ideas
        </p>
      )}

      <div style={{ marginBottom: 20 }}>
        <Chips
          label="Filter ideas by category"
          items={categories.map((cat) => ({
            value: cat,
            label: cat,
            count: cat === "All" ? undefined : features.filter((f) => f.category === cat).length,
          }))}
          value={activeCategory}
          onChange={setActiveCategory}
        />
      </div>

      {loading ? (
        <LoadingShell rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No ideas listed yet." body="Be the first — share yours in the form below." />
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((feature) => {
            const hasVoted = voted.has(feature.id);
            const isVoting = voting === feature.id;
            const statusConfig = STATUS_CONFIG[feature.status];
            const cannotVote = hasVoted || feature.status === "completed";
            return (
              <Card
                key={feature.id}
                as="li"
                padding={16}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                  borderColor: hasVoted ? "var(--ftp-brand)" : "var(--ftp-border)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 className="ftp-title">{feature.title}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", margin: "6px 0" }}>
                    <Pill tone="neutral">{feature.category}</Pill>
                    <Pill tone={statusConfig.tone} icon={statusConfig.icon}>{statusConfig.label}</Pill>
                  </div>
                  <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{feature.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleVote(feature.id)}
                  disabled={cannotVote || isVoting}
                  aria-pressed={hasVoted}
                  aria-label={`${hasVoted ? "You voted for" : "Vote for"} ${feature.title}. ${feature.votes} votes.`}
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    width: 56,
                    minHeight: 56,
                    borderRadius: "var(--ftp-radius-tile)",
                    border: `1px solid ${hasVoted ? "var(--ftp-brand)" : "var(--ftp-border)"}`,
                    background: hasVoted ? "var(--ftp-brand-tint)" : "var(--ftp-surface)",
                    color: hasVoted ? "var(--ftp-brand)" : "var(--ftp-text-2)",
                    cursor: cannotVote ? "default" : "pointer",
                    opacity: isVoting ? 0.7 : 1,
                  }}
                >
                  <ThumbsUp size={16} aria-hidden fill={hasVoted ? "currentColor" : "none"} />
                  <span className="ftp-num" style={{ fontSize: 13, lineHeight: "16px" }}>{feature.votes}</span>
                </button>
              </Card>
            );
          })}
        </ul>
      )}
    </>
  );
}
