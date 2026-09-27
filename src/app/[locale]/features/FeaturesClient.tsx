/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Features page — /features (client part; page.tsx adds the metadata)
//
// The question it answers: "What is being built next, and how do I ask
// for something?"
//
// Session 17 v11 Phase F: Vote on existing ideas (top) + Share Your Idea
// form (bottom, anchored at #share-idea so the homepage thin-bar can
// deep-link to it). The form lives EXCLUSIVELY here.
//
// Design v4.1 (violet), docs/LAYOUT.md recipe inside <ModulePage>:
//   1. SiteHeader band
//   2. The answer in one sentence (Explainer) from the /api/features list
//   3. Emoji tiles: ideas, votes, built, being built
//   4. Pictures: 10 bulbs lit for the share of ideas built or being built,
//      and the five most-voted ideas as bars (two or more with votes)
//   5. Category Chips, then the ideas as cards on .ftp-grid (1–3 across).
//      Tapping an idea opens a DetailSheet with the whole description,
//      category, status, votes and the vote button; the card keeps its own
//      vote button too.
//   6. The share form beside "What happens to your idea" (HowItWorks
//      steps) on laptop / PC, stacked on phones.
// Voting logic, the API calls and the localStorage "already voted" list
// are unchanged. Text: "page_features" messages. Idea titles,
// descriptions and categories come from the database and are shown as
// stored.
// ═══════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, Clock, Lightbulb, ThumbsUp, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import SuggestionForm from "@/components/features/SuggestionForm";
import { Card, Chips, EmptyState, LoadingShell, ModulePage, Pill, StatStrip, StatTile } from "@/components/district/ui";
import type { Tone } from "@/components/district/ui";
import { ChartCard, Explainer, HowItWorks, Pictogram } from "@/components/district/visuals";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
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
const STATUS_CONFIG: Record<Feature["status"], { icon: LucideIcon; tone: Tone; emoji: string }> = {
  proposed: { icon: Zap, tone: "neutral", emoji: "💭" },
  "in-progress": { icon: Clock, tone: "warn", emoji: "🛠️" },
  completed: { icon: CheckCircle, tone: "live", emoji: "✅" },
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
      <ModulePage>
        <SiteHeader emoji="💡" icon={Lightbulb} title={t("title")} description={t("description")} />

        <VoteSection />

        <section id="share-idea" style={{ marginTop: 40, scrollMarginTop: 80 }}>
          <div className="ftp-picture-row" style={{ alignItems: "start" }}>
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
            <Card padding={18}>
              <HowItWorks
                title={t("howTitle")}
                steps={[
                  { emoji: "✍️", title: t("step_share"), body: t("step_shareBody") },
                  { emoji: "🔎", title: t("step_review"), body: t("step_reviewBody") },
                  { emoji: "🗳️", title: t("step_vote"), body: t("step_voteBody") },
                  { emoji: "🛠️", title: t("step_build"), body: t("step_buildBody") },
                ]}
              />
            </Card>
          </div>
        </section>
      </ModulePage>
    </main>
  );
}

/** The vote button (on the card and in the sheet): thumbs up + count. */
function VoteButton({
  feature,
  hasVoted,
  isVoting,
  onVote,
  wide,
}: {
  feature: Feature;
  hasVoted: boolean;
  isVoting: boolean;
  onVote: () => void;
  /** The sheet's version: a full labelled button instead of the square. */
  wide?: boolean;
}) {
  const t = useTranslations("page_features");
  const { number } = useFormat();
  const cannotVote = hasVoted || feature.status === "completed";
  return (
    <button
      type="button"
      onClick={onVote}
      disabled={cannotVote || isVoting}
      aria-pressed={hasVoted}
      aria-label={wide ? undefined : t(hasVoted ? "votedAria" : "voteAria", { title: feature.title, n: feature.votes })}
      style={{
        flexShrink: 0,
        display: "flex",
        flexDirection: wide ? "row" : "column",
        alignItems: "center",
        justifyContent: "center",
        gap: wide ? 8 : 4,
        width: wide ? "100%" : 60,
        minHeight: wide ? 48 : 60,
        padding: wide ? "0 16px" : 0,
        borderRadius: 14,
        border: `1px solid ${hasVoted ? "var(--hue)" : "color-mix(in srgb, var(--hue) 30%, var(--ftp-border))"}`,
        background: hasVoted ? "var(--hue)" : "var(--hue-tint)",
        color: hasVoted ? "#fff" : "var(--hue-deep)",
        cursor: cannotVote ? "default" : "pointer",
        opacity: isVoting ? 0.7 : 1,
        fontFamily: "inherit",
        fontSize: 15,
        fontWeight: 600,
      }}
    >
      <ThumbsUp size={16} aria-hidden fill={hasVoted ? "currentColor" : "none"} />
      <span className="ftp-num" style={{ fontSize: 14, lineHeight: "16px" }}>{number(feature.votes)}</span>
      {wide && (
        <span>
          {feature.status === "completed" ? t("doneButton") : hasVoted ? t("votedButton") : t("voteButton")}
        </span>
      )}
    </button>
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
  const [openId, setOpenId] = useState<string | null>(null);

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
  const ready = !loading;

  const open = openId ? features.find((f) => f.id === openId) ?? null : null;

  return (
    <>
      {/* 2. The answer in one sentence */}
      {ready && features.length > 0 && (
        <Explainer>
          {t.rich("simple", {
            votes: number(totalVotes),
            ideas: features.length,
            done: doneCount,
            building: buildingCount,
            b,
          })}
        </Explainer>
      )}

      {/* 3. Numbers — "—" while loading, never a fake 0 */}
      <StatStrip cols={4}>
        <StatTile emoji="💡" label={t("tileIdeas")} value={ready ? number(features.length) : "—"} />
        <StatTile emoji="🗳️" label={t("tileVotes")} value={ready ? number(totalVotes) : "—"} />
        <StatTile emoji="✅" label={t("tileDone")} value={ready ? number(doneCount) : "—"} />
        <StatTile emoji="🛠️" label={t("tileBuilding")} value={ready ? number(buildingCount) : "—"} />
      </StatStrip>

      {/* 4. The pictures */}
      {ready && features.length > 0 && (
        <div className={topIdeas.length >= 2 ? "ftp-picture-row" : undefined} style={{ margin: "16px 0 24px" }}>
          <ChartCard title={t("pictoTitle")} emoji="💡" units={t("pictoUnits")}>
            <Pictogram filled={shippedShare} emoji="💡" label={t("pictoLabel", { n: Math.round(shippedShare) })} />
          </ChartCard>
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

      {/* 5. Filter + the ideas */}
      <div style={{ margin: "24px 0 16px" }}>
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
        {ready && features.length > 0 && (
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", fontSize: 14, marginTop: 10 }}>{t("tapHint")}</p>
        )}
      </div>

      {loading ? (
        <LoadingShell rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState emoji="💡" title={t("emptyTitle")} body={t("emptyBody")} />
      ) : (
        <ul className="ftp-grid" style={{ listStyle: "none", margin: 0, padding: 0, gap: 12, ["--ftp-grid-min" as string]: "340px" } as React.CSSProperties}>
          {filtered.map((feature) => {
            const hasVoted = voted.has(feature.id);
            const statusConfig = STATUS_CONFIG[feature.status];
            return (
              <Card
                key={feature.id}
                as="li"
                padding={0}
                tinted={hasVoted}
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  borderColor: hasVoted ? "var(--hue)" : "var(--ftp-border)",
                  height: "100%",
                }}
              >
                {/* The tap area: opens the idea's sheet */}
                <button
                  type="button"
                  onClick={() => setOpenId(feature.id)}
                  aria-haspopup="dialog"
                  aria-label={t("openDetails", { title: feature.title })}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    padding: 16,
                    background: "none",
                    border: "none",
                    textAlign: "start",
                    font: "inherit",
                    color: "inherit",
                    cursor: "pointer",
                    borderRadius: "var(--ftp-radius-card)",
                  }}
                >
                  <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 40, height: 40, fontSize: 20, borderRadius: 12 }}>
                    {ideaEmoji(feature.icon)}
                  </span>
                  <span style={{ flex: 1, minWidth: 0, display: "block" }}>
                    <span className="ftp-display" style={{ display: "block", fontSize: 17, lineHeight: 1.4, fontWeight: 650, color: "var(--ftp-text)" }}>
                      {feature.title}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", margin: "6px 0" }}>
                      <Pill tone="neutral">{feature.category}</Pill>
                      <Pill tone={statusConfig.tone} icon={statusConfig.icon}>{t(`status_${feature.status}`)}</Pill>
                    </span>
                    <span
                      className="ftp-body"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        color: "var(--ftp-text-2)",
                      }}
                    >
                      {feature.description}
                    </span>
                  </span>
                </button>
                <span style={{ padding: "16px 16px 16px 0", display: "flex" }}>
                  <VoteButton
                    feature={feature}
                    hasVoted={hasVoted}
                    isVoting={voting === feature.id}
                    onVote={() => handleVote(feature.id)}
                  />
                </span>
              </Card>
            );
          })}
        </ul>
      )}

      {/* The idea's detail sheet */}
      <DetailSheet
        open={!!open}
        onClose={() => setOpenId(null)}
        hueClassName="ftp-hue-violet"
        emoji={open ? ideaEmoji(open.icon) : undefined}
        title={open?.title ?? ""}
        subtitle={open ? t(`status_${open.status}`) : undefined}
        footer={
          open && (
            <VoteButton
              wide
              feature={open}
              hasVoted={voted.has(open.id)}
              isVoting={voting === open.id}
              onVote={() => handleVote(open.id)}
            />
          )
        }
      >
        {open && (
          <>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: "var(--ftp-text)", whiteSpace: "pre-line" }}>{open.description}</p>
            <DetailList
              rows={[
                { emoji: "🏷️", label: t("rowCategory"), value: open.category },
                { emoji: STATUS_CONFIG[open.status].emoji, label: t("rowStatus"), value: t(`status_${open.status}`) },
                { emoji: "🗳️", label: t("rowVotes"), value: t("votes", { n: open.votes }) },
              ]}
            />
          </>
        )}
      </DetailSheet>
    </>
  );
}
