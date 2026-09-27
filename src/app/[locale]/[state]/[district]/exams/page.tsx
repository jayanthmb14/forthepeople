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
//  ModulePage → PageHeader → Explainer (how many are open now, the very
//  next CONFIRMED date, and how many are not confirmed) → 4 StatTiles →
//  ONE picture: "How sure are these dates?" (confirmed / not confirmed /
//  finished) → who-runs-it Chips → the lists, as TapCards:
//      Coming up             confirmed exams, sorted by the next date, each
//                            with a CountdownBar ("Exam in 12 days") and
//                            the six-dot timeline
//      Dates not confirmed   active exams we could not re-check against an
//                            official notice in the last 30 days: no
//                            countdown, no "open", a clear note
//      Dates not out yet     confirmed exams with no date announced
//      Finished              folded away behind a button
//  Tapping a card opens a DetailSheet: countdown, the full timeline with a
//  "Today" row, eligibility, age, fee, posts, pay, selection, who can apply,
//  news headlines that mention the exam (/api/data/exam-news), the sources,
//  and Apply / Official notice / Syllabus buttons.
//  → charts (ChartCard, 2 per row on laptop/PC): who runs the exams, and
//  government posts filled in the district → AI insight → Share / Compare
//  → related news. Sources live in the district shell's verification
//  panel; reports go through the site-wide "Report a problem" button.
//
//  Honesty (v5): dates are the boards' dates as stored; a missing date says
//  "Not announced yet". An exam shows as "open", and gets a countdown, only
//  when its dates were re-checked in the last 30 days AND it has an
//  official link (examConfirmation in community/examTimeline.ts).
//  Everything else says "Dates not confirmed". No emoji.
//
//  i18n: page_exams (en / kn / hi). Exam titles, departments, fees, pay
//  scales and qualifications are data from the boards, shown as published.
"use client";
import { use, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, CalendarClock, CircleCheck, ExternalLink, GraduationCap, Users } from "lucide-react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import ExamStepper from "@/components/district/ExamStepper";
import ModuleNews from "@/components/district/ModuleNews";
import {
  ModulePage, PageHeader, Section, Card, Pill, Chips, StatStrip, StatTile,
  LoadingShell, ErrorBlock, EmptyState, ToolbarButton, AsOfText,
} from "@/components/district/ui";
import { ChartCard, CountdownBar, Explainer, Gauge } from "@/components/district/visuals";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import { RingMeter, ShareDonut, type DonutSlice } from "@/components/community/CommunityVisuals";
import { TapCard } from "@/components/community/TapCard";
import { cleanText, useNow, withScheme } from "@/components/community/pageTools";
import {
  CONFIRM_DAYS, canApply, examConfirmation, examPhase, lastPassedDate, nextExamStep,
  type ExamConfirmation, type ExamPhase, type ExamStep,
} from "@/components/community/examTimeline";
import { CalmNote } from "@/components/district/calm-parts";
import { StageBar } from "@/components/money/visuals";
import MoneyToolbar from "@/components/money/MoneyToolbar";
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
  /** Are the dates re-checked (≤ 30 days) and backed by an official link? */
  confirm: ExamConfirmation;
  /** Short name for sentences ("SSC MTS 2026"), else the title. */
  name: string;
}

// ── Who runs it ───────────────────────────────────────────
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

/**
 * Where the exam is now, as a pill. Honesty first: an active exam whose
 * dates are not confirmed says "Dates not confirmed" (calm amber) instead
 * of "Applications open" or "Exam soon".
 */
function PhasePill({ phase, confirmed }: { phase: ExamPhase; confirmed: boolean }) {
  const t = useTranslations("page_exams");
  if (!confirmed && phase !== "done") {
    return (
      <Pill tone="warn" icon={AlertTriangle} title={t("v5.unconfirmedHint")}>
        {t("v5.notConfirmed")}
      </Pill>
    );
  }
  const label = t(`phase.${phase}`);
  if (phase === "applyOpen") return <Pill tone="live">{label}</Pill>;
  if (phase === "examSoon") return <Pill tone="brand">{label}</Pill>;
  return <Pill tone="neutral">{label}</Pill>;
}

/** "Last checked 96 days ago" / "Not checked against an official notice yet". */
function CheckedLine({ confirm }: { confirm: ExamConfirmation }) {
  const t = useTranslations("page_exams");
  return (
    <p style={{ margin: 0, fontSize: 12, lineHeight: "17px", color: "var(--ftp-text-2)" }}>
      {confirm.checkedDays === null ? t("v5.neverChecked") : t("v5.checked", { n: confirm.checkedDays })}
      {!confirm.officialUrl && <> · {t("v5.noOfficialLink")}</>}
    </p>
  );
}

/** The countdown to an exam's next date ("Exam in 12 days"), filling from the last date that passed. */
function ExamCountdown({ view, now, withName }: { view: ExamView; now: number; withName?: boolean }) {
  const t = useTranslations("page_exams");
  const f = useFormat();
  const next = view.next;
  // Countdowns only for confirmed dates.
  if (!view.confirm.confirmed || !next || !next.date) return null;
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
      title={e.title}
      subtitle={e.organizingBody ?? e.department}
      badge={<PhasePill phase={view.phase} confirmed={view.confirm.confirmed} />}
      hint={t("details")}
    >
      {view.confirm.confirmed ? (
        <>
          <ExamCountdown view={view} now={now} />
          <ExamStepper now={now} {...e} />
        </>
      ) : (
        view.phase !== "done" && <CheckedLine confirm={view.confirm} />
      )}
      {/* Posts only for a confirmed exam: unchecked rows carried an older cycle's count (Sept 2026 audit). */}
      {view.confirm.confirmed && e.vacancies != null && e.vacancies > 0 && (
        <p style={{ margin: 0, fontSize: 13, lineHeight: "18px", color: "var(--ftp-text-2)" }}>
          {t.rich("postsLine", { n: e.vacancies, count: f.number(e.vacancies), b: (c) => <strong className="ftp-num" style={{ color: "var(--hue-deep)" }}>{c}</strong> })}
        </p>
      )}
    </TapCard>
  );
}

/** A heading inside the detail sheet. */
function SheetHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="ftp-display" style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, fontSize: 16, lineHeight: "22px", fontWeight: 650, color: "var(--hue-deep)" }}>
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
  const confirmed = view.confirm.confirmed;
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
      {e.applyUrl && confirmed && canApply(view.phase) && (
        <a href={withScheme(e.applyUrl)} target="_blank" rel="noopener noreferrer" style={{ ...sheetButton, background: "var(--hue)", color: "#fff", border: "1px solid var(--hue)" }}>
          {t("applyNow")}
          <ExternalLink size={14} aria-hidden />
        </a>
      )}
      {e.notificationUrl && (
        <a href={withScheme(e.notificationUrl)} target="_blank" rel="noopener noreferrer" style={{ ...sheetButton, background: "#fff", color: "var(--ftp-text)", border: "1px solid var(--ftp-border)" }}>
          {view.confirm.officialUrl === e.notificationUrl ? t("notification") : t("v5.noticeLink")}
          <ExternalLink size={14} aria-hidden />
        </a>
      )}
      {e.syllabusUrl && (
        <a href={withScheme(e.syllabusUrl)} target="_blank" rel="noopener noreferrer" style={{ ...sheetButton, background: "#fff", color: "var(--ftp-text)", border: "1px solid var(--ftp-border)" }}>
          {t("syllabus")}
          <ExternalLink size={14} aria-hidden />
        </a>
      )}
    </>
  );
  const hasFooter = Boolean((e.applyUrl && confirmed && canApply(view.phase)) || e.notificationUrl || e.syllabusUrl);

  return (
    <DetailSheet
      open
      onClose={onClose}
      title={e.title}
      subtitle={e.organizingBody ?? e.department}
      hueClassName={hueClass("exams")}
      footer={hasFooter ? footer : undefined}
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <PhasePill phase={view.phase} confirmed={confirmed} />
      </div>

      {!confirmed && view.phase !== "done" && (
        <CalmNote tone="warn" icon={AlertTriangle}>
          <strong>{t("v5.notConfirmed")}.</strong> {t("v5.datesAsStored")}
          <div style={{ marginTop: 4 }}>
            <CheckedLine confirm={view.confirm} />
          </div>
        </CalmNote>
      )}

      {confirmed && view.next && (
        <div style={{ padding: 14, borderRadius: "var(--ftp-radius-card)", background: "var(--hue-tint)" }}>
          <ExamCountdown view={view} now={now} withName />
        </div>
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SheetHeading>{t("sheet.dates")}</SheetHeading>
        <ExamStepper now={now} variant="full" relative={confirmed} {...e} />
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SheetHeading>{t("sheet.facts")}</SheetHeading>
        <DetailList
          rows={[
            { label: t("facts.vacancies"), value: confirmed && e.vacancies != null ? <span className="ftp-num">{f.number(e.vacancies)}</span> : notGiven },
            { label: t("facts.qualification"), value: e.qualification ?? notGiven },
            { label: t("facts.ageLimit"), value: e.ageLimit ?? notGiven },
            { label: t("facts.fee"), value: e.applicationFee ?? notGiven },
            { label: t("facts.pay"), value: e.payScale },
            { label: t("facts.selection"), value: e.selectionProcess },
            { label: t("facts.reach"), value: t(`reach.${examReach(e)}`) },
            { label: t("facts.department"), value: e.department },
          ]}
        />
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SheetHeading>{t("sheet.news")}</SheetHeading>
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
        <SheetHeading>{t("sheet.source")}</SheetHeading>
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
        <CalmNote>{t("sheet.checkOfficial")}</CalmNote>
      </section>
    </DetailSheet>
  );
}

/** A titled grid of exam cards ("Coming up (4)"). */
function ExamList({
  title,
  views,
  now,
  onOpen,
  intro,
  action,
  count,
}: {
  title: string;
  views: ExamView[];
  now: number;
  onOpen: (v: ExamView) => void;
  intro?: string;
  action?: React.ReactNode;
  /** The group's size when the cards are folded away (views is then empty). */
  count?: number;
}) {
  const t = useTranslations("page_exams");
  const f = useFormat();
  if (views.length === 0 && !action) return null;
  return (
    <Section
      title={
        <>
          {title}{" "}
          <span className="ftp-num" style={{ color: "var(--ftp-text-2)", fontWeight: 400 }}>{t("groupCount", { n: f.number(count ?? views.length) })}</span>
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
      confirm: examConfirmation(exam, now),
      name: exam.shortName?.trim() || exam.title,
    };
  });
  const shown = category === "all" ? views : views.filter((v) => v.category === category);

  // Only CONFIRMED exams can be "coming up" (with a countdown) or "open".
  const comingUp = shown
    .filter((v) => v.confirm.confirmed && v.next && v.phase !== "done")
    .sort((a, b) => (a.next?.days ?? 0) - (b.next?.days ?? 0) || a.name.localeCompare(b.name));
  const unconfirmed = shown
    .filter((v) => !v.confirm.confirmed && v.phase !== "done")
    .sort((a, b) => (a.confirm.checkedDays ?? Infinity) - (b.confirm.checkedDays ?? Infinity) || a.name.localeCompare(b.name));
  const waiting = shown.filter((v) => v.confirm.confirmed && !v.next && v.phase !== "done").sort((a, b) => a.name.localeCompare(b.name));
  const finished = shown.filter((v) => v.phase === "done").sort((a, b) => lastKnownDate(b.exam).localeCompare(lastKnownDate(a.exam)));

  // Headline numbers, from every exam (not the filter), confirmed ones only.
  const active = views.filter((v) => v.phase !== "done");
  const activeConfirmed = active.filter((v) => v.confirm.confirmed);
  const unconfirmedCount = active.length - activeConfirmed.length;
  const openNow = activeConfirmed.filter((v) => v.phase === "applyOpen").length;
  const soonest = activeConfirmed.filter((v) => v.next).sort((a, b) => (a.next?.days ?? 0) - (b.next?.days ?? 0))[0];
  const withPosts = activeConfirmed.filter((v) => typeof v.exam.vacancies === "number" && v.exam.vacancies > 0);
  const posts = withPosts.reduce((s, v) => s + (v.exam.vacancies ?? 0), 0);
  const finishedCount = views.length - active.length;
  // The page date is the newest time anyone CHECKED an exam (not a nightly date roll-over).
  const dataAsOf = newest(allExams.map((e) => e.lastVerifiedAt));

  // Charts: who runs the exams; government posts filled here.
  const categoryCounts = (["central", "state", "banking"] as const)
    .map((c) => ({ key: c, count: views.filter((v) => v.category === c).length }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
  const whoSlices: DonutSlice[] = categoryCounts.map((c) => ({ key: c.key, label: t(`categoryShort.${c.key}`), value: c.count }));
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
  const sureParts = [
    { key: "confirmed", label: t("v5.bar.confirmed"), value: activeConfirmed.length, fill: "var(--hue-deep)" },
    { key: "unconfirmed", label: t("v5.bar.unconfirmed"), value: unconfirmedCount, fill: "var(--ftp-warn)" },
    { key: "finished", label: t("v5.bar.finished"), value: finishedCount, fill: "var(--ftp-border-strong)" },
  ];

  return (
    <ModulePage>
      <PageHeader
        icon={GraduationCap}
        title={t("title")}
        description={t("description")}
        freshness={dataAsOf ? { asOf: dataAsOf, thresholdHours: CONFIRM_DAYS * 24 } : undefined}
        source={{ label: t("sourcePill") }}
      />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && (!examsData || views.length === 0) && (
        <EmptyState title={t("noData")} body={t("noDataBody")} />
      )}

      {!isLoading && examsData && views.length > 0 && (
        <>
          <Explainer>
            {activeConfirmed.length === 0
              ? t.rich("v5.explainerNone", { total: views.length, b: bold })
              : soonestText
                ? t.rich("simpleNext", { open: openNow, next: soonestText, b: bold })
                : t.rich("simpleNoNext", { open: openNow, b: bold })}
            {activeConfirmed.length > 0 && unconfirmedCount > 0 && <> {t.rich("v5.explainerSome", { n: unconfirmedCount, b: bold })}</>}
          </Explainer>

          <StatStrip cols={4}>
            <StatTile icon={CircleCheck} label={t("statOpen")} value={f.number(openNow)} sub={t("v5.statOpenSub")} />
            <StatTile
              icon={CalendarClock}
              label={t("statNext")}
              value={soonest?.next ? (soonest.next.days === 0 ? t("todayWord") : f.number(soonest.next.days ?? 0)) : "—"}
              unit={soonest?.next && (soonest.next.days ?? 0) > 0 ? t("daysUnit", { n: soonest.next.days ?? 0 }) : undefined}
              sub={soonest?.next ? t("statNextSub", { name: soonest.name, step: t(`stepper.${soonest.next.key}`) }) : t("statNextNone")}
            />
            {posts > 0 ? (
              <StatTile icon={Users} label={t("statPosts")} value={f.number(posts)} sub={t("statPostsSub", { n: withPosts.length })} />
            ) : (
              <StatTile icon={AlertTriangle} label={t("v5.notConfirmed")} value={f.number(unconfirmedCount)} sub={t("v5.statUnconfirmedSub")} />
            )}
            <StatTile icon={GraduationCap} label={t("statTracked")} value={f.number(views.length)} sub={t("statTrackedSub", { n: finishedCount })} asOf={dataAsOf} />
          </StatStrip>

          {/* The one picture: how sure are these dates? */}
          <Card padding={18} style={{ marginTop: 20 }}>
            <p className="ftp-title" style={{ margin: "0 0 12px", fontWeight: 650 }}>{t("v5.bar.title")}</p>
            <StageBar
              parts={sureParts}
              format={(n) => f.number(n)}
              ariaLabel={t("v5.bar.aria", { confirmed: activeConfirmed.length, unconfirmed: unconfirmedCount, finished: finishedCount })}
            />
          </Card>

          {/* Who runs it */}
          <div style={{ marginTop: 20 }}>
            <Chips
              label={t("filterLabel")}
              value={category}
              onChange={(v) => setCategory(v as typeof category)}
              items={(["all", "central", "state", "banking"] as const).map((cat) => ({
                value: cat,
                label: t(`categories.${cat}`),
                count: cat === "all" ? views.length : views.filter((v) => v.category === cat).length,
              }))}
            />
          </div>

          <ExamList title={t("comingTitle")} views={comingUp} now={now} onOpen={setSelected} intro={t("comingIntro")} />
          <ExamList title={t("v5.unconfirmedTitle")} views={unconfirmed} now={now} onOpen={setSelected} intro={t("v5.unconfirmedIntro")} />
          <ExamList title={t("waitingTitle")} views={waiting} now={now} onOpen={setSelected} intro={t("waitingIntro")} />
          {finished.length > 0 && (
            <ExamList
              title={t("finishedTitle")}
              views={showFinished ? finished : []}
              count={finished.length}
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
              <EmptyState title={t("noExams")} body={t("noExamsBody")} />
            </div>
          )}

          {/* Charts: 2 per row on laptop and PC, stacked on phones. */}
          {(showWho || sanctioned > 0) && (
            <Section title={t("chartsTitle")}>
              <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "340px" }}>
                {showWho && topWho && (
                  <ChartCard
                    title={t("whoTitle")}
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
                            <RingMeter pct={p * 100} size={44} color={short ? "var(--ftp-warn)" : "var(--hue)"} ariaLabel={t("ringAria", { role: s.roleName, pct: pctText(p) })} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--ftp-text)" }}>{s.roleName}</div>
                              <div className="ftp-num" style={{ fontSize: 12, lineHeight: "16px", color: short ? "var(--ftp-warn)" : "var(--ftp-text-2)" }}>
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

      <div style={{ marginTop: 24 }}>
        <AIInsightCard module="exams" district={district} />
      </div>

      <MoneyToolbar shareTitle={t("title")} compareHref={`/${locale}/compare?module=exams&a=${district}`} />

      {!isLoading && examsData && <ModuleNews district={district} state={state} locale={locale} module="exams" />}

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
