/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Features page — /features (client part; page.tsx adds the metadata)
//
// Session 17 v11 Phase F: Vote on existing ideas (top) + Share
// Your Idea form (bottom, anchored at #share-idea so the homepage
// thin-bar can deep-link to it). The form lives EXCLUSIVELY here
// — the homepage VoteFeaturesCTA is a compact thin bar + 3-line
// list that scrolls visitors to /features#share-idea.
//
// Design v4 "Rang" (violet): SiteHeader band, then two pictures from the
// same /api/features list —
//   • one plain sentence with the vote totals and 10 bulbs lit for the
//     share of ideas already built or being built;
//   • the five most-voted ideas as bars (only when two or more have votes);
// then Chips, idea cards (the idea's own emoji from the DB in a hue chip),
// and the share form in a tinted card. Voting logic, the API calls and the
// localStorage "already voted" list are unchanged.
// Text: "page_features" messages. Idea titles, descriptions and categories
// come from the database and are shown as stored.
// ═══════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, Clock, Lightbulb, ThumbsUp, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import SuggestionForm from "@/components/features/SuggestionForm";
import { Card, Chips, EmptyState, LoadingShell, Pill } from "@/components/district/ui";
import type { Tone } from "@/components/district/ui";
import { ChartCard, Explainer, Pictogram } from "@/components/district/visuals";
import SiteHeader from "@/components/site/SiteHeader";
import { BarList } from "@/components/site/SiteVisuals";
import { useFormat } from "@/i18n/client";

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
const STATUS_CONFIG: Record<Feature["status"], { icon: LucideIcon; tone: Tone }> = {
  proposed: { icon: Zap, tone: "neutral" },
  "in-progress": { icon: Clock, tone: "warn" },
  completed: { icon: CheckCircle, tone: "live" },
};

/** How many ideas the "most wanted" bars show. */
const TOP_IDEAS = 5;

/** "All" chip value (a real category can never be this). */
const ALL = "__all__";

/**
 * The idea's own emoji (admin-entered in the DB), or a bulb. Anything
 * longer than a short emoji sequence is ignored so stray text never shows.
 */
function ideaEmoji(icon: string | null | undefined): string {
  const s = (icon ?? "").trim();
  return s && s.length <= 8 && !/[A-Za-z0-9]/.test(s) ? s : "💡";
}

export default function FeaturesClient() {
  const t = useTranslations("page_features");
  return (
    <main className="ftp-hue-violet" style={{ background: "var(--ftp-bg)", minHeight: "calc(100vh - 56px)" }}>
      <div className="ftp-container" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <div style={{ maxWidth: 800 }}>
          <SiteHeader emoji="💡" icon={Lightbulb} title={t("title")} description={t("description")} />

          <VoteSection />

          <section id="share-idea" style={{ marginTop: 48, scrollMarginTop: 80 }}>
            <Card tinted padding={20}>
              <h2 className="ftp-h2" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 34, height: 34, fontSize: 18, borderRadius: 11 }}>
                  ✍️
                </span>
                {t("shareTitle")}
              </h2>
              <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "6px 0 16px" }}>{t("shareBody")}</p>
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
  const t = useTranslations("page_features");
  const { number } = useFormat();
  const b = (c: React.ReactNode) => <strong>{c}</strong>;
  const [features, setFeatures] = useState<Feature[]>([]);
  const [voted, setVoted] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try { return new Set(JSON.parse(localStorage.getItem("ftp_votes") ?? "[]") as string[]); }
    catch { return new Set(); }
  });
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(ALL);

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

  const categories = Array.from(new Set(features.map((f) => f.category)));
  const filtered = activeCategory === ALL ? features : features.filter((f) => f.category === activeCategory);
  const totalVotes = features.reduce((s, f) => s + f.votes, 0);
  // Picture 1: ideas that are built or being built, out of all listed ideas.
  const doneCount = features.filter((f) => f.status === "completed").length;
  const buildingCount = features.filter((f) => f.status === "in-progress").length;
  const shippedShare = features.length > 0 ? ((doneCount + buildingCount) / features.length) * 10 : 0;
  // Picture 2: the most-voted ideas.
  const topIdeas = [...features].filter((f) => f.votes > 0).sort((a, c) => c.votes - a.votes).slice(0, TOP_IDEAS);

  return (
    <>
      {!loading && features.length > 0 && (
        <div className={topIdeas.length >= 2 ? "ftp-picture-row" : undefined} style={{ marginBottom: 20 }}>
          <Card tinted padding={18}>
            <Explainer>
              {t.rich("simple", {
                votes: number(totalVotes),
                ideas: features.length,
                done: doneCount,
                building: buildingCount,
                b,
              })}
            </Explainer>
            <Pictogram filled={shippedShare} emoji="💡" label={t("pictoLabel", { n: Math.round(shippedShare) })} />
          </Card>
          {topIdeas.length >= 2 && (
            <ChartCard
              title={t("topTitle")}
              emoji="🏆"
              units={t("topUnits")}
              simple={t.rich("topSimple", { title: topIdeas[0].title, n: topIdeas[0].votes, b })}
              source={{ label: t("topSource") }}
              table={topIdeas.map((f) => ({ label: f.title, value: number(f.votes) }))}
            >
              <BarList
                rows={topIdeas.map((f) => ({
                  key: f.id,
                  label: f.title,
                  value: f.votes,
                  display: t("votes", { n: f.votes }),
                  emoji: ideaEmoji(f.icon),
                }))}
              />
            </ChartCard>
          )}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <Chips
          label={t("filterLabel")}
          items={[
            { value: ALL, label: t("all") },
            ...categories.map((cat) => ({
              value: cat,
              label: cat,
              count: features.filter((f) => f.category === cat).length,
            })),
          ]}
          value={activeCategory}
          onChange={setActiveCategory}
        />
      </div>

      {loading ? (
        <LoadingShell rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState emoji="💡" title={t("emptyTitle")} body={t("emptyBody")} />
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
                tinted={hasVoted}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  borderColor: hasVoted ? "var(--hue)" : "var(--ftp-border)",
                }}
              >
                <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 40, height: 40, fontSize: 20, borderRadius: 12 }}>
                  {ideaEmoji(feature.icon)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 className="ftp-display" style={{ margin: 0, fontSize: 17, lineHeight: 1.4, fontWeight: 650, color: "var(--ftp-text)" }}>
                    {feature.title}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", margin: "6px 0" }}>
                    <Pill tone="neutral">{feature.category}</Pill>
                    <Pill tone={statusConfig.tone} icon={statusConfig.icon}>{t(`status_${feature.status}`)}</Pill>
                  </div>
                  <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{feature.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleVote(feature.id)}
                  disabled={cannotVote || isVoting}
                  aria-pressed={hasVoted}
                  aria-label={t(hasVoted ? "votedAria" : "voteAria", { title: feature.title, n: feature.votes })}
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    width: 60,
                    minHeight: 60,
                    borderRadius: 14,
                    border: `1px solid ${hasVoted ? "var(--hue)" : "color-mix(in srgb, var(--hue) 30%, var(--ftp-border))"}`,
                    background: hasVoted ? "var(--hue)" : "var(--hue-tint)",
                    color: hasVoted ? "#fff" : "var(--hue-deep)",
                    cursor: cannotVote ? "default" : "pointer",
                    opacity: isVoting ? 0.7 : 1,
                  }}
                >
                  <ThumbsUp size={16} aria-hidden fill={hasVoted ? "currentColor" : "none"} />
                  <span className="ftp-num" style={{ fontSize: 14, lineHeight: "16px" }}>{number(feature.votes)}</span>
                </button>
              </Card>
            );
          })}
        </ul>
      )}
    </>
  );
}
