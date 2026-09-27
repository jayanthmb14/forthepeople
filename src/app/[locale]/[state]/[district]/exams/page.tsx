/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Exams & jobs — "Which government exams can I apply for, and when is
//  each date?"  (docs/LAYOUT.md recipe, docs/MODULE-MAP.md "Help for you")
// ═══════════════════════════════════════════════════════════════════════
//
//  ModulePage → PageHeader → AI summary → Explainer (one sentence: how many
//  are open now and the very next date) → 4 StatTiles → ONE picture: "Where
//  each exam is right now" (the six steps, with how many exams sit at each)
//  → who-runs-it Chips → the lists, as TapCards:
//      ⏰ Coming up         sorted by the next date, each with a CountdownBar
//                           ("Exam in 12 days") and the six-dot timeline
//                           with a 📍 Today pin
//      🗓️ Dates not out yet  active exams with no date announced
//      🏁 Finished           folded away behind a button
//  Tapping a card opens a DetailSheet: countdown, the full timeline with a
//  "Today" row, eligibility, age, fee, posts, pay, selection, who can apply,
//  news headlines that mention the exam (/api/data/exam-news), the sources,
//  and Apply / Official notice / Syllabus buttons.
//  → charts (ChartCard, 2 per row on laptop/PC): who runs the exams, and
//  government posts filled in the district → sources → related news →
//  Share / Compare.
//
//  Honesty: dates are the boards' dates as stored; a missing date says "Not
//  announced yet". Exams not confirmed by the news lately carry a warning.
//
//  i18n: page_exams (en / kn / hi). Exam titles, departments, fees, pay
//  scales and qualifications are data from the boards, shown as published.
"use client";
import { use, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { GraduationCap, ExternalLink, AlertTriangle, GitCompare } from "lucide-react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import ExamStepper from "@/components/district/ExamStepper";
import ModuleNews from "@/components/district/ModuleNews";
import {
  ModulePage, PageHeader, Section, Card, Pill, Chips, StatStrip, StatTile,
  LoadingShell, ErrorBlock, EmptyState, SourcesFooter, Toolbar, ToolbarButton, AsOfText,
} from "@/components/district/ui";
import { ChartCard, CountdownBar, Explainer, Gauge, HowItWorks } from "@/components/district/visuals";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import { RingMeter, ShareDonut, type DonutSlice } from "@/components/community/CommunityVisuals";
import { EmojiChip, TapCard } from "@/components/community/TapCard";
import { SharePageButton, cleanText, useNow, withScheme } from "@/components/community/pageTools";
import {
  EXAM_PHASES, PHASE_EMOJI, canApply, examPhase, lastPassedDate, nextExamStep,
  type ExamPhase, type ExamStep,
} from "@/components/community/examTimeline";
import { useDistrictData } from "@/hooks/useDistrictData";
import { useDistrictName, useFormat, useModuleText } from "@/i18n/client";
import { hueClass } from "@/lib/design/hues";

// ── Types ─────────────────────────────────────────────────
interface GovernmentExam {
  id: string;
  level: string;
  title: string;
  department: string;
  vacancies: number | null;
  qualification: string | null;
  ageLimit: string | null;
  applicationFee: string | null;
  selectionProcess: string | null;
  payScale: string | null;
  applyUrl: string | null;
  notificationUrl: string | null;
  syllabusUrl: string | null;
  status: string;
  announcedDate: string | null;
  startDate: string | null;
  endDate: string | null;
  admitCardDate: string | null;
  examDate: string | null;
  resultDate: string | null;
  shortName?: string | null;
  organizingBody?: string | null;
  category?: string | null;
  scope?: string | null;
  notificationDate?: string | null;
  sourceUrls?: string[] | null;
  lastVerifiedAt?: string | null;
  needsVerification?: boolean | null;
  updatedAt?: string | null;
}

interface DepartmentStaffing {
  id: string;
  module: string;
  department: string;
  roleName: string;
  sanctionedPosts: number;
  workingStrength: number;
  vacantPosts: number;
  asOfDate: string;
  sourceUrl: string | null;
}

interface ExamsResponse {
  stateExams: GovernmentExam[];
  districtExams: GovernmentExam[];
  staffing: DepartmentStaffing[];
}

interface ExamNewsItem {
  id: string;
  title: string;
  url: string;
  publisher: string | null;
  source: string;
  publishedAt: string;
  lang?: string;
}

type ExamCategory = "central" | "state" | "banking";

/** One exam with everything the page works out about it (once per render). */
interface ExamView {
  exam: GovernmentExam;
  phase: ExamPhase;
  next: ExamStep | null;
  category: ExamCategory;
  emoji: string;
  /** Short name for sentences ("SSC MTS 2026"), else the title. */
  name: string;
}

// ── Who runs it ───────────────────────────────────────────
const CATEGORY_EMOJI: Record<ExamCategory, string> = { central: "🏛️", state: "🏢", banking: "🏦" };

/** Central / state / banking: the stored category first, else the department name. */
function examCategory(e: GovernmentExam): ExamCategory {
  const c = (e.category ?? "").toUpperCase();
  if (c === "BANKING") return "banking";
  if (c === "STATE_PSC") return "state";
  if (c === "CENTRAL" || c === "RAILWAY" || c === "DEFENCE") return "central";
  const who = `${e.department} ${e.organizingBody ?? ""}`.toLowerCase();
  if (/bank|ibps|rbi|sbi|nabard/.test(who)) return "banking";
  if (/union public service|staff selection|railway|\bnta\b|upsc|\bssc\b|rrb|cbse/.test(who)) return "central";
  if (e.level === "national") return "central";
  return "state";
}

/** A picture for the kind of job: trains, uniforms and classrooms get their own. */
function examEmoji(e: GovernmentExam, category: ExamCategory): string {
  const c = (e.category ?? "").toUpperCase();
  const who = `${e.department} ${e.organizingBody ?? ""} ${e.title}`.toLowerCase();
  if (c === "RAILWAY" || /railway|\brrb\b/.test(who)) return "🚆";
  if (c === "DEFENCE" || /defence|army|navy|air force|\bnda\b|\bcds\b/.test(who)) return "🎖️";
  if (c === "TEACHING" || /teacher|\btet\b|ctet/.test(who)) return "👩‍🏫";
  if (/police|constable/.test(who)) return "👮";
  return CATEGORY_EMOJI[category];
}

/** Who can apply: the whole country, this state, or this district. */
function examReach(e: GovernmentExam): "national" | "state" | "district" {
  if (e.level === "district") return "district";
  if (e.level === "state" || (e.scope ?? "").toUpperCase() === "STATE") return "state";
  return "national";
}

/** The newest date in a list (ISO strings compare in time order). */
function newest(dates: Array<string | null | undefined>): string | null {
  let best: string | null = null;
  for (const d of dates) if (d && (!best || d > best)) best = d;
  return best;
}

/** The last date the exam reached, for sorting finished exams newest first. */
function lastKnownDate(e: GovernmentExam): string {
  return newest([e.resultDate, e.examDate, e.admitCardDate, e.endDate, e.startDate, e.notificationDate, e.announcedDate]) ?? "";
}

// ── Small pieces ──────────────────────────────────────────

/** Where the exam is now, as a pill: open = green, exam soon = amber, finished = grey, else the page hue. */
function PhasePill({ phase }: { phase: ExamPhase }) {
  const t = useTranslations("page_exams");
  const label = (
    <>
      <span className="ftp-emoji" aria-hidden>{PHASE_EMOJI[phase]}</span>
      {t(`phase.${phase}`)}
    </>
  );
  if (phase === "applyOpen") return <Pill tone="live">{label}</Pill>;
  if (phase === "examSoon") return <Pill tone="warn">{label}</Pill>;
  if (phase === "done") return <Pill tone="neutral">{label}</Pill>;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 24,
        padding: "0 10px",
        borderRadius: "var(--ftp-radius-pill)",
        background: "var(--hue-tint)",
        color: "var(--hue-deep)",
        fontSize: 11,
        lineHeight: "16px",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

/** "Not confirmed lately" warning for exams the news has not mentioned in a while. */
function UnverifiedPill({ exam }: { exam: GovernmentExam }) {
  const t = useTranslations("page_exams");
  const f = useFormat();
  if (!exam.needsVerification) return null;
  return (
    <Pill
      tone="warn"
      icon={AlertTriangle}
      title={exam.lastVerifiedAt ? t("unverifiedTitle", { when: f.ago(exam.lastVerifiedAt) }) : t("unverifiedNever")}
    >
      {t("unverified")}
    </Pill>
  );
}

/** The countdown to an exam's next date ("Exam in 12 days"), filling from the last date that passed. */
function ExamCountdown({ view, now, withName }: { view: ExamView; now: number; withName?: boolean }) {
  const t = useTranslations("page_exams");
  const f = useFormat();
  const next = view.next;
  if (!next || !next.date) return null;
  const when = t("whenLower", { n: next.days ?? 0 });
  const label = withName ? t(`countdown.${next.key}`, { name: view.name, when }) : t(`countdownShort.${next.key}`, { when });
  const start = lastPassedDate(view.exam, now) ?? new Date(now).toISOString();
  return (
    <CountdownBar
      start={start}
      target={next.date}
      label={label}
      sub={<span suppressHydrationWarning>{t("onDate", { date: f.date(next.date, { weekday: "short", day: "numeric", month: "long", year: "numeric" }) })}</span>}
    />
  );
}

/** One exam as a card; tapping it opens the detail sheet. */
function ExamCard({ view, now, onOpen }: { view: ExamView; now: number; onOpen: (v: ExamView) => void }) {
  const t = useTranslations("page_exams");
  const f = useFormat();
  const e = view.exam;
  return (
    <TapCard
      onOpen={() => onOpen(view)}
      leading={<EmojiChip emoji={view.emoji} />}
      title={e.title}
      subtitle={e.organizingBody ?? e.department}
      badge={
        <>
          <PhasePill phase={view.phase} />
          <UnverifiedPill exam={e} />
        </>
      }
      hint={t("details")}
      tinted={view.phase === "applyOpen"}
    >
      <ExamCountdown view={view} now={now} />
      <ExamStepper now={now} {...e} />
      {e.vacancies != null && e.vacancies > 0 && (
        <p style={{ margin: 0, fontSize: 13, lineHeight: "18px", color: "var(--ftp-text-2)" }}>
          <span className="ftp-emoji" aria-hidden>🪑 </span>
          {t.rich("postsLine", { n: e.vacancies, count: f.number(e.vacancies), b: (c) => <strong className="ftp-num" style={{ color: "var(--hue-deep)" }}>{c}</strong> })}
        </p>
      )}
    </TapCard>
  );
}

/** A heading inside the detail sheet. */
function SheetHeading({ emoji, children }: { emoji: string; children: React.ReactNode }) {
  return (
    <h3 className="ftp-display" style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, fontSize: 16, lineHeight: "22px", fontWeight: 650, color: "var(--hue-deep)" }}>
      <span className="ftp-emoji" aria-hidden>{emoji}</span>
      {children}
    </h3>
  );
}

const sheetButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  minHeight: 44,
  padding: "0 16px",
  borderRadius: "var(--ftp-radius-tile)",
  fontSize: 14,
  fontWeight: 650,
  textDecoration: "none",
  flex: "1 1 auto",
};

/** Everything about one exam, in the shared DetailSheet. */
function ExamSheet({
  view,
  now,
  news,
  newsLoading,
  newsError,
  onClose,
}: {
  view: ExamView;
  now: number;
  news: ExamNewsItem[];
  newsLoading: boolean;
  newsError: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("page_exams");
  const f = useFormat();
  const e = view.exam;
  const notGiven = t("notGiven");
  const sources = (Array.isArray(e.sourceUrls) ? e.sourceUrls : []).filter((u) => typeof u === "string" && u).slice(0, 3);
  const host = (u: string) => {
    try {
      return new URL(withScheme(u)).hostname.replace(/^www\./, "");
    } catch {
      return u;
    }
  };

  const footer = (
    <>
      {e.applyUrl && canApply(view.phase) && (
        <a href={withScheme(e.applyUrl)} target="_blank" rel="noopener noreferrer" style={{ ...sheetButton, background: "var(--hue)", color: "#fff", border: "1px solid var(--hue)" }}>
          <span className="ftp-emoji" aria-hidden>📝</span>
          {t("applyNow")}
          <ExternalLink size={14} aria-hidden />
        </a>
      )}
      {e.notificationUrl && (
        <a href={withScheme(e.notificationUrl)} target="_blank" rel="noopener noreferrer" style={{ ...sheetButton, background: "#fff", color: "var(--ftp-text)", border: "1px solid var(--ftp-border)" }}>
          <span className="ftp-emoji" aria-hidden>📄</span>
          {t("notification")}
          <ExternalLink size={14} aria-hidden />
        </a>
      )}
      {e.syllabusUrl && (
        <a href={withScheme(e.syllabusUrl)} target="_blank" rel="noopener noreferrer" style={{ ...sheetButton, background: "#fff", color: "var(--ftp-text)", border: "1px solid var(--ftp-border)" }}>
          <span className="ftp-emoji" aria-hidden>📚</span>
          {t("syllabus")}
          <ExternalLink size={14} aria-hidden />
        </a>
      )}
    </>
  );
  const hasFooter = Boolean((e.applyUrl && canApply(view.phase)) || e.notificationUrl || e.syllabusUrl);

  return (
    <DetailSheet
      open
      onClose={onClose}
      title={e.title}
      subtitle={e.organizingBody ?? e.department}
      emoji={view.emoji}
      hueClassName={hueClass("exams")}
      footer={hasFooter ? footer : undefined}
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <PhasePill phase={view.phase} />
        <UnverifiedPill exam={e} />
      </div>

      {view.next && (
        <div style={{ padding: 14, borderRadius: "var(--ftp-radius-card)", background: "var(--hue-tint)" }}>
          <ExamCountdown view={view} now={now} withName />
        </div>
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SheetHeading emoji="📅">{t("sheet.dates")}</SheetHeading>
        <ExamStepper now={now} variant="full" {...e} />
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SheetHeading emoji="📋">{t("sheet.facts")}</SheetHeading>
        <DetailList
          rows={[
            { emoji: "🪑", label: t("facts.vacancies"), value: e.vacancies != null ? <span className="ftp-num">{f.number(e.vacancies)}</span> : notGiven },
            { emoji: "🎓", label: t("facts.qualification"), value: e.qualification ?? notGiven },
            { emoji: "🎂", label: t("facts.ageLimit"), value: e.ageLimit ?? notGiven },
            { emoji: "💳", label: t("facts.fee"), value: e.applicationFee ?? notGiven },
            { emoji: "💰", label: t("facts.pay"), value: e.payScale },
            { emoji: "🧭", label: t("facts.selection"), value: e.selectionProcess },
            { emoji: "🗺️", label: t("facts.reach"), value: t(`reach.${examReach(e)}`) },
            { emoji: "🏛️", label: t("facts.department"), value: e.department },
          ]}
        />
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SheetHeading emoji="📰">{t("sheet.news")}</SheetHeading>
        {newsLoading ? (
          <LoadingShell rows={2} />
        ) : newsError ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--ftp-text-2)" }}>{t("sheet.newsError")}</p>
        ) : news.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{t("sheet.noNews")}</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {news.map((n) => (
              <li key={n.id}>
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    minHeight: 44,
                    padding: "10px 12px",
                    borderRadius: "var(--ftp-radius-tile)",
                    border: "1px solid var(--ftp-border)",
                    background: "#fff",
                    textDecoration: "none",
                    color: "var(--ftp-text)",
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span lang={n.lang} style={{ display: "block", fontSize: 14, lineHeight: "20px", fontWeight: 600 }}>{cleanText(n.title)}</span>
                    <span style={{ display: "block", marginTop: 2, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }} suppressHydrationWarning>
                      {t("newsMeta", { publisher: n.publisher ?? n.source, when: f.ago(n.publishedAt) })}
                    </span>
                  </span>
                  <ExternalLink size={14} aria-hidden style={{ color: "var(--hue)", flexShrink: 0, marginTop: 3 }} />
                  <span className="sr-only">{t("opensNewTab")}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <SheetHeading emoji="🔎">{t("sheet.source")}</SheetHeading>
        {e.lastVerifiedAt && (
          <p style={{ margin: 0, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }} suppressHydrationWarning>
            {t.rich("lastFromNews", { when: f.ago(e.lastVerifiedAt), n: (c) => <span className="ftp-num">{c}</span> })}
          </p>
        )}
        {sources.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {sources.map((u) => (
              <a
                key={u}
                href={withScheme(u)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, minHeight: 36, padding: "0 12px", borderRadius: 999, border: "1px solid var(--ftp-border)", fontSize: 12, fontWeight: 600, color: "var(--hue-deep)", textDecoration: "none", maxWidth: "100%" }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{host(u)}</span>
                <ExternalLink size={11} aria-hidden style={{ flexShrink: 0 }} />
              </a>
            ))}
          </div>
        )}
        <p style={{ margin: 0, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>
          <span className="ftp-emoji" aria-hidden>☝️ </span>
          {t("sheet.checkOfficial")}
        </p>
      </section>
    </DetailSheet>
  );
}

/** A titled grid of exam cards ("⏰ Coming up (4)"). */
function ExamList({
  title,
  emoji,
  views,
  now,
  onOpen,
  intro,
  action,
}: {
  title: string;
  emoji: string;
  views: ExamView[];
  now: number;
  onOpen: (v: ExamView) => void;
  intro?: string;
  action?: React.ReactNode;
}) {
  const t = useTranslations("page_exams");
  const f = useFormat();
  if (views.length === 0 && !action) return null;
  return (
    <Section
      emoji={emoji}
      title={
        <>
          {title}{" "}
          <span className="ftp-num" style={{ color: "var(--ftp-text-2)", fontWeight: 400 }}>{t("groupCount", { n: f.number(views.length) })}</span>
        </>
      }
      action={action}
    >
      {intro && <p className="ftp-prose" style={{ margin: "-4px 0 12px", fontSize: 14, lineHeight: "21px", color: "var(--ftp-text-2)" }}>{intro}</p>}
      {views.length > 0 && (
        <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "300px" }}>
          {views.map((v) => (
            <ExamCard key={v.exam.id} view={v} now={now} onOpen={onOpen} />
          ))}
        </div>
      )}
    </Section>
  );
}

// ── Page ──────────────────────────────────────────────────
function ExamsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_exams");
  const f = useFormat();
  const now = useNow();
  const base = `/${locale}/${state}/${district}`;
  const districtName = useDistrictName(state, district);

  const { data: apiResponse, isLoading, error } = useDistrictData<ExamsResponse>("exams", district, state);
  const examsData = apiResponse?.data;

  const [category, setCategory] = useState<"all" | ExamCategory>("all");
  const [showFinished, setShowFinished] = useState(false);
  const [selected, setSelected] = useState<ExamView | null>(null);
  const close = useCallback(() => setSelected(null), []);

  // Headlines that mention each exam: fetched only once someone opens an exam.
  const newsQ = useDistrictData<{ byExam: Record<string, ExamNewsItem[]> }>("exam-news", district, state, {
    enabled: Boolean(selected),
    staleTime: 30 * 60_000,
  });

  // An exam can come back in both lists (state-wide and district); show it once.
  const allExams = examsData
    ? Array.from(new Map([...(examsData.stateExams ?? []), ...(examsData.districtExams ?? [])].map((e) => [e.id, e])).values())
    : [];
  const views: ExamView[] = allExams.map((exam) => {
    const cat = examCategory(exam);
    return {
      exam,
      phase: examPhase(exam, now),
      next: nextExamStep(exam, now),
      category: cat,
      emoji: examEmoji(exam, cat),
      name: exam.shortName?.trim() || exam.title,
    };
  });
  const shown = category === "all" ? views : views.filter((v) => v.category === category);

  const comingUp = shown
    .filter((v) => v.next && v.phase !== "done")
    .sort((a, b) => (a.next?.days ?? 0) - (b.next?.days ?? 0) || a.name.localeCompare(b.name));
  const waiting = shown.filter((v) => !v.next && v.phase !== "done").sort((a, b) => a.name.localeCompare(b.name));
  const finished = shown.filter((v) => v.phase === "done").sort((a, b) => lastKnownDate(b.exam).localeCompare(lastKnownDate(a.exam)));

  // Headline numbers, from every exam (not the filter).
  const active = views.filter((v) => v.phase !== "done");
  const openNow = views.filter((v) => v.phase === "applyOpen").length;
  const soonest = views
    .filter((v) => v.next && v.phase !== "done")
    .sort((a, b) => (a.next?.days ?? 0) - (b.next?.days ?? 0))[0];
  const withPosts = active.filter((v) => typeof v.exam.vacancies === "number" && v.exam.vacancies > 0);
  const posts = withPosts.reduce((s, v) => s + (v.exam.vacancies ?? 0), 0);
  const finishedCount = views.length - active.length;
  const phaseCounts = EXAM_PHASES.map((p) => ({ phase: p, n: views.filter((v) => v.phase === p).length }));
  const dataAsOf = newest(allExams.map((e) => e.updatedAt ?? e.lastVerifiedAt));

  // Charts: who runs the exams; government posts filled here.
  const categoryCounts = (["central", "state", "banking"] as const)
    .map((c) => ({ key: c, count: views.filter((v) => v.category === c).length }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
  const whoSlices: DonutSlice[] = categoryCounts.map((c) => ({ key: c.key, label: t(`categoryShort.${c.key}`), value: c.count, emoji: CATEGORY_EMOJI[c.key] }));
  const topWho = categoryCounts[0];
  const showWho = categoryCounts.length >= 2 && views.length >= 3;

  const staffing = examsData?.staffing ?? [];
  const sanctioned = staffing.reduce((s, r) => s + r.sanctionedPosts, 0);
  const working = staffing.reduce((s, r) => s + r.workingStrength, 0);
  const vacant = staffing.reduce((s, r) => s + r.vacantPosts, 0);
  const filledShare = sanctioned > 0 ? working / sanctioned : 0;
  const staffingAsOf = newest(staffing.map((r) => r.asOfDate));
  const staffingSource = staffing.find((r) => r.sourceUrl)?.sourceUrl ?? null;
  const pctText = (p: number) => f.number(p, { style: "percent", maximumFractionDigits: 0 });

  const bold = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;
  const soonestText = soonest?.next
    ? t(`countdown.${soonest.next.key}`, { name: soonest.name, when: t("whenLower", { n: soonest.next.days ?? 0 }) })
    : null;

  return (
    <ModulePage>
      <PageHeader
        icon={GraduationCap}
        title={t("title")}
        description={t("description")}
        backHref={base}
        freshness={dataAsOf ? { asOf: dataAsOf, thresholdHours: 72 } : undefined}
        source={{ label: t("sourcePill") }}
      />
      <AIInsightCard module="exams" district={district} />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && (!examsData || views.length === 0) && (
        <EmptyState emoji="📝" title={t("noData")} body={t("noDataBody")} />
      )}

      {!isLoading && examsData && views.length > 0 && (
        <>
          <Explainer emoji="📝">
            {soonestText
              ? t.rich("simpleNext", { open: openNow, next: soonestText, b: bold })
              : t.rich("simpleNoNext", { open: openNow, b: bold })}
          </Explainer>

          <StatStrip cols={posts > 0 ? 4 : 3}>
            <StatTile emoji="📝" label={t("statOpen")} value={f.number(openNow)} sub={t("statOpenSub")} />
            <StatTile
              emoji="⏰"
              label={t("statNext")}
              value={soonest?.next ? (soonest.next.days === 0 ? t("todayWord") : f.number(soonest.next.days ?? 0)) : "—"}
              unit={soonest?.next && (soonest.next.days ?? 0) > 0 ? t("daysUnit", { n: soonest.next.days ?? 0 }) : undefined}
              sub={soonest?.next ? t("statNextSub", { name: soonest.name, step: t(`stepper.${soonest.next.key}`) }) : t("statNextNone")}
            />
            {posts > 0 && (
              <StatTile emoji="🪑" label={t("statPosts")} value={f.number(posts)} sub={t("statPostsSub", { n: withPosts.length })} />
            )}
            <StatTile emoji="🗂️" label={t("statTracked")} value={f.number(views.length)} sub={t("statTrackedSub", { n: finishedCount })} asOf={dataAsOf} />
          </StatStrip>

          {/* The one picture: the six steps, with how many exams sit at each today. */}
          <div style={{ marginTop: 20 }}>
            <Card tinted padding={18}>
              <HowItWorks
                title={
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="ftp-emoji" aria-hidden>🧭</span>
                    {t("stagesTitle")}
                  </span>
                }
                steps={phaseCounts.map(({ phase, n }) => ({
                  emoji: PHASE_EMOJI[phase],
                  title: t(`phase.${phase}`),
                  body: <span className="ftp-num">{t("phaseCount", { n, count: f.number(n) })}</span>,
                }))}
              />
            </Card>
          </div>

          {/* Who runs it */}
          <div style={{ marginTop: 20 }}>
            <Chips
              label={t("filterLabel")}
              value={category}
              onChange={(v) => setCategory(v as typeof category)}
              items={(["all", "central", "state", "banking"] as const).map((cat) => ({
                value: cat,
                label: cat === "all" ? t("categories.all") : `${CATEGORY_EMOJI[cat]} ${t(`categories.${cat}`)}`,
                count: cat === "all" ? views.length : views.filter((v) => v.category === cat).length,
              }))}
            />
          </div>

          <ExamList title={t("comingTitle")} emoji="⏰" views={comingUp} now={now} onOpen={setSelected} intro={t("comingIntro")} />
          <ExamList title={t("waitingTitle")} emoji="🗓️" views={waiting} now={now} onOpen={setSelected} intro={t("waitingIntro")} />
          {finished.length > 0 && (
            <ExamList
              title={t("finishedTitle")}
              emoji="🏁"
              views={showFinished ? finished : []}
              now={now}
              onOpen={setSelected}
              action={
                <ToolbarButton onClick={() => setShowFinished((x) => !x)}>
                  {showFinished ? t("hideFinished") : t("showFinished", { n: finished.length, count: f.number(finished.length) })}
                </ToolbarButton>
              }
            />
          )}
          {shown.length === 0 && (
            <div style={{ marginTop: 20 }}>
              <EmptyState emoji="🔍" title={t("noExams")} body={t("noExamsBody")} />
            </div>
          )}

          {/* Charts: 2 per row on laptop and PC, stacked on phones. */}
          {(showWho || sanctioned > 0) && (
            <Section emoji="📊" title={t("chartsTitle")}>
              <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "340px" }}>
                {showWho && topWho && (
                  <ChartCard
                    title={t("whoTitle")}
                    emoji="🧑‍🎓"
                    units={t("whoUnits")}
                    simple={t.rich("whoSimple", {
                      name: t(`categoryShort.${topWho.key}`),
                      n: f.number(topWho.count),
                      total: f.number(views.length),
                      b: (c) => <strong>{c}</strong>,
                    })}
                    asOf={dataAsOf}
                    source={{ label: t("sourcePill") }}
                    table={whoSlices.map((s) => ({ label: s.label, value: f.number(s.value) }))}
                  >
                    <ShareDonut
                      slices={whoSlices}
                      centerValue={f.number(views.length)}
                      centerLabel={t("examsWord", { n: views.length })}
                      ariaLabel={t("whoAria", { name: t(`categoryShort.${topWho.key}`), n: f.number(topWho.count), total: f.number(views.length) })}
                    />
                  </ChartCard>
                )}
                {sanctioned > 0 && (
                  <ChartCard
                    title={t("staffingTitle", { name: districtName })}
                    emoji="🪑"
                    units={t("staffingUnits")}
                    simple={t.rich("staffingSentence", { sanctioned: f.number(sanctioned), working: f.number(working), vacant: f.number(vacant), b: bold })}
                    asOf={staffingAsOf}
                    source={staffingSource ? { label: t("source"), href: withScheme(staffingSource) } : undefined}
                    table={staffing.map((s) => ({
                      label: `${s.roleName} (${s.department})`,
                      value: t("tableFilled", { working: f.number(s.workingStrength), sanctioned: f.number(s.sanctionedPosts) }),
                    }))}
                  >
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <Gauge value={filledShare * 100} label={t("gaugeLabel")} caption={t("gaugeCaption", { n: staffing.length })} size={200} />
                    </div>
                    <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "grid", gap: 8 }}>
                      {staffing.map((s) => {
                        const p = s.sanctionedPosts > 0 ? s.workingStrength / s.sanctionedPosts : 0;
                        const short = 1 - p > 0.3;
                        return (
                          <li key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                            <RingMeter pct={p * 100} size={44} color={short ? "var(--ftp-danger)" : "var(--hue)"} ariaLabel={t("ringAria", { role: s.roleName, pct: pctText(p) })} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--ftp-text)" }}>{s.roleName}</div>
                              <div className="ftp-num" style={{ fontSize: 12, lineHeight: "16px", color: short ? "var(--ftp-danger)" : "var(--ftp-text-2)" }}>
                                {t("rowCounts", { working: f.number(s.workingStrength), vacant: f.number(s.vacantPosts) })}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    {staffingAsOf && (
                      <div style={{ marginTop: 8 }}>
                        <AsOfText asOf={staffingAsOf} />
                      </div>
                    )}
                  </ChartCard>
                )}
              </div>
            </Section>
          )}
        </>
      )}

      <SourcesFooter
        sources={[
          { name: "UPSC", url: "https://upsc.gov.in", frequency: t("frequency") },
          { name: "SSC", url: "https://ssc.gov.in", frequency: t("frequency") },
          { name: t("sourceBoards"), frequency: t("frequency") },
          { name: t("sourceNews"), frequency: t("frequency") },
        ]}
      />

      {!isLoading && examsData && <ModuleNews district={district} state={state} locale={locale} module="exams" />}

      <Toolbar>
        <SharePageButton />
        <ToolbarButton icon={GitCompare} href={`/${locale}/compare?module=exams&a=${district}`}>
          {t("compare")}
        </ToolbarButton>
      </Toolbar>

      {selected && (
        <ExamSheet
          view={selected}
          now={now}
          news={newsQ.data?.data?.byExam?.[selected.exam.id] ?? []}
          newsLoading={newsQ.isLoading}
          newsError={Boolean(newsQ.error)}
          onClose={close}
        />
      )}
    </ModulePage>
  );
}

export default function ExamsPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("exams")}>
      <ExamsPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
