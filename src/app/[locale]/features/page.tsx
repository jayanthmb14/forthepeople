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
// ═══════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { ThumbsUp, CheckCircle, Clock, Zap } from "lucide-react";
import SuggestionForm from "@/components/features/SuggestionForm";

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

const CATEGORY_COLORS: Record<string, string> = {
  Accessibility:  "#0891B2",
  Community:      "#16A34A",
  Data:           "#2563EB",
  Transparency:   "#DC2626",
  Expansion:      "#D97706",
};

const STATUS_CONFIG = {
  proposed:    { label: "Proposed",    icon: Zap,         color: "#6B6B6B" },
  "in-progress": { label: "In Progress", icon: Clock,       color: "#D97706" },
  completed:   { label: "Completed",   icon: CheckCircle, color: "#16A34A" },
};

export default function FeaturesPage() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px 48px" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🗳️</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
          Help Shape ForThePeople.in
        </h1>
        <p style={{ fontSize: 15, color: "#6B6B6B", lineHeight: 1.6, maxWidth: 500, margin: "0 auto" }}>
          Vote for the features you want most, or scroll down to share
          your own idea. The highest-voted features get built first.
        </p>
      </div>

      <VoteSection />

      <section
        id="share-idea"
        style={{
          marginTop: 48,
          scrollMarginTop: 80,
          padding: "20px 22px",
          background: "#FFFFFF",
          border: "1px solid #E8E8E4",
          borderRadius: 14,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden="true">💡</span>
          Share your idea
        </h2>
        <p style={{ fontSize: 13, color: "#6B6B6B", margin: "0 0 16px" }}>
          Have a feature in mind that&apos;s not listed? Suggest it below — we
          review every submission.
        </p>
        <SuggestionForm />
      </section>
    </div>
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

  return (
    <>
      {!loading && (
        <div style={{ textAlign: "center", fontSize: 13, color: "#9B9B9B", marginBottom: 16 }}>
          {features.reduce((s, f) => s + f.votes, 0).toLocaleString("en-IN")} total votes across {features.length} ideas
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20, justifyContent: "center" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: "6px 14px", borderRadius: 20,
              border: `1px solid ${activeCategory === cat ? "#2563EB" : "#E8E8E4"}`,
              background: activeCategory === cat ? "#EFF6FF" : "#FFFFFF",
              color: activeCategory === cat ? "#2563EB" : "#6B6B6B",
              fontSize: 13, fontWeight: activeCategory === cat ? 600 : 400,
              cursor: "pointer", minHeight: 36,
            }}
          >
            {cat !== "All" && (
              <span style={{
                display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                background: CATEGORY_COLORS[cat] ?? "#9B9B9B", marginRight: 5,
              }} />
            )}
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#9B9B9B", padding: "48px 0" }}>Loading features…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((feature) => {
            const hasVoted = voted.has(feature.id);
            const isVoting = voting === feature.id;
            const statusConfig = STATUS_CONFIG[feature.status];
            const StatusIcon = statusConfig.icon;
            const catColor = CATEGORY_COLORS[feature.category] ?? "#9B9B9B";
            return (
              <div key={feature.id} style={{
                background: "#FFFFFF",
                border: `1px solid ${hasVoted ? "#BFDBFE" : "#E8E8E4"}`,
                borderRadius: 14, padding: "16px 20px",
                display: "flex", alignItems: "flex-start", gap: 16,
              }}>
                <div style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{feature.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A" }}>{feature.title}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 10,
                      background: `${catColor}15`, color: catColor,
                    }}>{feature.category}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: statusConfig.color }}>
                      <StatusIcon size={11} />
                      {statusConfig.label}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "#6B6B6B", lineHeight: 1.5, margin: 0 }}>{feature.description}</p>
                </div>
                <div style={{ flexShrink: 0, textAlign: "center" }}>
                  <button
                    onClick={() => handleVote(feature.id)}
                    disabled={hasVoted || feature.status === "completed" || isVoting}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center",
                      padding: "10px 14px", borderRadius: 10,
                      border: `1.5px solid ${hasVoted ? "#2563EB" : "#E8E8E4"}`,
                      background: hasVoted ? "#EFF6FF" : "#FAFAF8",
                      color: hasVoted ? "#2563EB" : "#6B6B6B",
                      cursor: hasVoted || feature.status === "completed" ? "default" : "pointer",
                      minWidth: 56, minHeight: 56, opacity: isVoting ? 0.7 : 1,
                    }}
                  >
                    <ThumbsUp size={16} fill={hasVoted ? "#2563EB" : "none"} />
                    <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                      {feature.votes}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

