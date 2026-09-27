/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Exams & Jobs — Design v4 "Rang" module page (docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  PageHeader → AI summary → StatStrip of emoji tiles (totals, with the
//  data date) → the pictures:
//    · an "In simple words" line; when departments report staffing, a
//      pictogram of filled posts and a dial;
//    · "Who is hiring": a ring of the listed exams by who runs them
//      (central government, state government, banks), with a table view.
//  → category Chips → department staffing (one ring per department:
//  share of sanctioned posts filled) → exam cards grouped Open / Upcoming
//  / Closed → SourcesFooter → related news → Toolbar.
//
//  Each exam card: an emoji chip for who runs it, title + body, a status
//  pill, the date-driven ExamStepper, the facts a student needs
//  (vacancies, age, fees, pay…), the official links, and a provenance
//  line (last updated from news, source link). "Coming up" states use the
//  page hue; open / warning / closed keep their semantic colours. The one
//  "Apply now" button lives on the card (the stepper no longer repeats it).
//
//  i18n: interface text is in page_exams (en + kn). Exam titles, bodies,
//  departments, fees, pay scales and qualifications are data from the
//  boards and are shown as published.
//
"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import ExamStepper from "@/components/district/ExamStepper";
import {
  PageHeader, Section, Card, Pill, Chips, StatStrip, StatTile,
  LoadingShell, ErrorBlock, EmptyState, SourcesFooter, Toolbar, ToolbarButton,
  AsOfText, SourcePill,
} from "@/components/district/ui";
import type { Tone } from "@/components/district/ui";
import { ChartCard, Explainer, Gauge, Pictogram } from "@/components/district/visuals";
import { RingMeter, ShareDonut, type DonutSlice } from "@/components/community/CommunityVisuals";
import { useDistrictData } from "@/hooks/useDistrictData";
import { useFormat, useModuleText } from "@/i18n/client";
import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { GraduationCap, ExternalLink, AlertTriangle, Share2, GitCompare } from "lucide-react";
import ModuleNews from "@/components/district/ModuleNews";

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
  // News-driven fields (April 2026)
  shortName?: string | null;
  organizingBody?: string | null;
  category?: string | null;
  scope?: string | null;
  notificationDate?: string | null;
  sourceUrls?: string[] | null;
  lastVerifiedAt?: string | null;
  needsVerification?: boolean | null;
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
  summary: {
    totalStateExams: number;
    totalDistrictExams: number;
    openExams: number;
    upcomingExams: number;
    totalStaffingRecords: number;
  };
}

type ExamCategory = "central" | "state" | "banking";

// ── Status → pill tone. Covers legacy lowercase + news-sourced uppercase.
// The label is page_exams.status.<key>. "brand" here means "coming up" and
// is drawn in the page hue (see StatusPill).
const STATUS_TONE: Record<string, Tone> = {
  // legacy
  upcoming: "brand",
  open: "live",
  closed: "neutral",
  results: "warn",
  // news-driven
  NOTIFICATION_OUT: "brand",
  APPLICATIONS_OPEN: "live",
  APPLICATIONS_CLOSED: "neutral",
  ADMIT_CARD_OUT: "warn",
  EXAM_SCHEDULED: "danger",
  RESULT_PENDING: "warn",
  RESULT_OUT: "warn",
  COMPLETED: "neutral",
};

/** Who runs the exam → emoji chip (card, ring and legend). */
const CATEGORY_EMOJI: Record<ExamCategory, string> = {
  central: "🏛️",
  state: "🏢",
  banking: "🏦",
};

// Bucket an exam into open / upcoming / closed for section grouping.
function examBucket(e: GovernmentExam): "open" | "upcoming" | "closed" {
  const s = e.status;
  if (s === "open" || s === "APPLICATIONS_OPEN" || s === "ADMIT_CARD_OUT" || s === "EXAM_SCHEDULED") return "open";
  if (s === "closed" || s === "APPLICATIONS_CLOSED" || s === "results" || s === "RESULT_PENDING" || s === "RESULT_OUT" || s === "COMPLETED") return "closed";
  return "upcoming"; // upcoming, NOTIFICATION_OUT, anything unknown
}

/** Central / state / banking, read from the department name. */
function getExamCategory(exam: GovernmentExam): ExamCategory {
  const dept = exam.department.toLowerCase();
  if (/bank|reserve bank|ibps|rbi|sbi|nabard/i.test(dept)) return "banking";
  if (/union public service|staff selection|railway|nta|upsc|ssc|rrb|cbse/i.test(dept)) return "central";
  return "state";
}

/** Make sure a stored URL has a scheme before we link to it. */
function withScheme(url: string): string {
  return url.startsWith("http") ? url : `https://${url}`;
}

/** Tone for a staffing fill rate: >30 % vacant = danger, ≥70 % filled = live, else warn. */
function fillTone(filledPct: number): Tone {
  if (100 - filledPct > 30) return "danger";
  if (filledPct >= 70) return "live";
  return "warn";
}

/** Ring colour for each fill tone (semantic tokens). */
const TONE_RING: Partial<Record<Tone, string>> = {
  danger: "var(--ftp-danger)",
  live: "var(--ftp-live)",
  warn: "var(--ftp-warn)",
};

/** The newest date in a list (ISO strings compare in time order). */
function newest(dates: Array<string | null | undefined>): string | null {
  let best: string | null = null;
  for (const d of dates) if (d && (!best || d > best)) best = d;
  return best;
}

/** A pill in the page hue — used for "coming up" statuses and module names. */
function HuePill({ children, dot }: { children: React.ReactNode; dot?: boolean }) {
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
        fontSize: 12,
        lineHeight: "16px",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {dot && <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--hue)", flexShrink: 0 }} />}
      {children}
    </span>
  );
}

/** Status pill: "coming up" in the page hue, everything else in its semantic tone. */
function StatusPill({ status }: { status: string }) {
  const t = useTranslations("page_exams");
  const key = STATUS_TONE[status] ? status : "upcoming";
  const tone = STATUS_TONE[key];
  const label = t(`status.${key}`);
  if (tone === "brand") return <HuePill dot>{label}</HuePill>;
  return <Pill tone={tone} dot>{label}</Pill>;
}

const num = (c: React.ReactNode) => <span className="ftp-num">{c}</span>;

// ── Staffing (all departments that report sanctioned vs filled posts) ──
function StaffingSection({ staffing }: { staffing: DepartmentStaffing[] }) {
  const t = useTranslations("page_exams");
  const f = useFormat();
  if (!staffing.length) return null;

  return (
    <Section title={t("staffingTitle")} emoji="🏛️">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))", gap: 12 }}>
        {staffing.map((s) => {
          const filledPct = s.sanctionedPosts > 0
            ? Math.round((s.workingStrength / s.sanctionedPosts) * 100)
            : 0;
          const vacantPct = 100 - filledPct;
          const dangerLevel = vacantPct > 30;
          const tone = fillTone(filledPct);
          const pctText = f.number(filledPct / 100, { style: "percent", maximumFractionDigits: 0 });

          return (
            <Card key={s.id} padding={14}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <RingMeter
                  pct={filledPct}
                  size={62}
                  color={TONE_RING[tone] ?? "var(--hue)"}
                  ariaLabel={t("ringAria", { role: s.roleName, pct: pctText })}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)" }}>{s.roleName}</div>
                      <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{s.department}</div>
                    </div>
                    {dangerLevel ? <Pill tone="danger">{s.module}</Pill> : <HuePill>{s.module}</HuePill>}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: 8, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                    <span>
                      {t.rich("filledOf", {
                        working: f.number(s.workingStrength),
                        sanctioned: f.number(s.sanctionedPosts),
                        n: (c) => <span className="ftp-num" style={{ color: "var(--hue-deep)" }}>{c}</span>,
                      })}
                    </span>
                    <span style={{ color: dangerLevel ? "var(--ftp-danger)" : "var(--ftp-text-2)" }}>
                      {t.rich("vacantLine", {
                        vacant: f.number(s.vacantPosts),
                        pct: f.number(vacantPct / 100, { style: "percent", maximumFractionDigits: 0 }),
                        n: num,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {(s.asOfDate || s.sourceUrl) && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  {s.asOfDate && <AsOfText asOf={s.asOfDate} />}
                  {s.sourceUrl && <SourcePill label={t("source")} href={withScheme(s.sourceUrl)} />}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </Section>
  );
}

// ── Exam detail card ───────────────────────────────────────
function ExamCard({ exam }: { exam: GovernmentExam }) {
  const t = useTranslations("page_exams");
  const f = useFormat();
  const firstSource = Array.isArray(exam.sourceUrls) && exam.sourceUrls.length > 0 ? exam.sourceUrls[0] : null;
  const category = getExamCategory(exam);

  // Link buttons under the facts. "Apply" is the one filled button (page hue).
  const linkBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    padding: "0 14px",
    borderRadius: "var(--ftp-radius-tile)",
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "none",
  };
  const linkStyle: React.CSSProperties = {
    ...linkBase,
    border: "1px solid var(--ftp-border)",
    background: "var(--ftp-surface)",
    color: "var(--ftp-text)",
  };

  const facts = [
    { key: "vacancies", value: exam.vacancies != null ? f.number(exam.vacancies) : t("tba"), mono: true },
    { key: "ageLimit", value: exam.ageLimit ?? "—", mono: false },
    { key: "qualification", value: exam.qualification ?? "—", mono: false },
    { key: "fee", value: exam.applicationFee ?? "—", mono: false },
    { key: "pay", value: exam.payScale ?? "—", mono: false },
    { key: "selection", value: exam.selectionProcess ?? "—", mono: false },
  ];

  return (
    <Card as="article" padding={20} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header row: who runs it, title, status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 180 }}>
          <span
            className="ftp-icon-chip ftp-emoji"
            title={t(`categoryShort.${category}`)}
            aria-hidden
            style={{ width: 38, height: 38, fontSize: 20, borderRadius: 12 }}
          >
            {CATEGORY_EMOJI[category]}
          </span>
          <div style={{ minWidth: 0 }}>
            <h3 className="ftp-display" style={{ margin: "0 0 2px", fontSize: 17, lineHeight: "23px", fontWeight: 650, color: "var(--ftp-text)" }}>{exam.title}</h3>
            <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{exam.organizingBody ?? exam.department}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <StatusPill status={exam.status} />
          {exam.needsVerification && (
            <Pill
              tone="warn"
              icon={AlertTriangle}
              title={exam.lastVerifiedAt ? t("unverifiedTitle", { when: f.ago(exam.lastVerifiedAt) }) : t("unverifiedNever")}
            >
              {t("unverified")}
            </Pill>
          )}
        </div>
      </div>

      {/* Stepper — on a soft hue wash */}
      <div style={{ margin: "0 0 14px", padding: "12px 10px", borderRadius: "var(--ftp-radius-tile)", background: "color-mix(in srgb, var(--hue-tint) 60%, #fff)" }}>
        <ExamStepper
          status={exam.status}
          announcedDate={exam.announcedDate}
          notificationDate={exam.notificationDate ?? null}
          startDate={exam.startDate}
          endDate={exam.endDate}
          admitCardDate={exam.admitCardDate}
          examDate={exam.examDate}
          resultDate={exam.resultDate}
        />
      </div>

      {/* Student perspective grid */}
      <dl style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px 16px", margin: "0 0 14px" }}>
        {facts.map((item) => (
          <div key={item.key} style={{ minWidth: 0 }}>
            <dt className="ftp-label" style={{ marginBottom: 2 }}>{t(`facts.${item.key}`)}</dt>
            <dd
              className={item.mono ? "ftp-num" : undefined}
              style={{ margin: 0, fontSize: item.mono ? 15 : 13, lineHeight: "20px", color: item.mono ? "var(--hue-deep)" : "var(--ftp-text)", overflowWrap: "anywhere" }}
            >
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* Action links */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: "auto" }}>
        {exam.applyUrl && examBucket(exam) !== "closed" && (
          <a
            href={withScheme(exam.applyUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="ftp-btn-primary"
            style={{ ...linkBase, borderWidth: 1, borderStyle: "solid", color: "#fff" }}
          >
            {t("applyNow")} <ExternalLink size={14} aria-hidden />
          </a>
        )}
        {exam.notificationUrl && (
          <a href={withScheme(exam.notificationUrl)} target="_blank" rel="noopener noreferrer" className="ftp-btn-secondary" style={linkStyle}>
            {t("notification")} <ExternalLink size={14} aria-hidden />
          </a>
        )}
        {exam.syllabusUrl && (
          <a href={withScheme(exam.syllabusUrl)} target="_blank" rel="noopener noreferrer" className="ftp-btn-secondary" style={linkStyle}>
            {t("syllabus")} <ExternalLink size={14} aria-hidden />
          </a>
        )}
      </div>

      {/* Provenance footer — last verified + source link */}
      {(exam.lastVerifiedAt || firstSource) && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: "1px solid var(--ftp-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            flexWrap: "wrap",
            fontSize: 12,
            lineHeight: "16px",
            color: "var(--ftp-text-2)",
          }}
        >
          {exam.lastVerifiedAt && (
            <span suppressHydrationWarning>{t.rich("lastFromNews", { when: f.ago(exam.lastVerifiedAt), n: num })}</span>
          )}
          {firstSource && (
            <a
              href={withScheme(firstSource)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--hue-deep)", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3, minHeight: 32 }}
            >
              {t("source")} <ExternalLink size={11} aria-hidden />
            </a>
          )}
        </div>
      )}
    </Card>
  );
}

/** Grid of exam cards under one heading ("Applications open (3)"). */
function ExamGroup({ title, emoji, exams }: { title: string; emoji: string; exams: GovernmentExam[] }) {
  const t = useTranslations("page_exams");
  const f = useFormat();
  if (exams.length === 0) return null;
  return (
    <Section
      emoji={emoji}
      title={
        <>
          {title}{" "}
          <span className="ftp-num" style={{ color: "var(--ftp-text-2)", fontWeight: 400 }}>{t("groupCount", { n: f.number(exams.length) })}</span>
        </>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))", gap: 16 }}>
        {exams.map((e) => (
          <ExamCard key={e.id} exam={e} />
        ))}
      </div>
    </Section>
  );
}

/** Share button: the phone's share sheet when available, else copy the link. */
function SharePageButton() {
  const tf = useTranslations("pageFooter");
  const [copied, setCopied] = useState(false);
  function share() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: document.title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => {});
    }
  }
  return <ToolbarButton icon={Share2} onClick={share}>{copied ? tf("copied") : tf("share")}</ToolbarButton>;
}

// ── Inner page ────────────────────────────────────────────
function ExamsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_exams");
  const f = useFormat();
  const base = `/${locale}/${state}/${district}`;

  const { data: apiResponse, isLoading, error } = useDistrictData<ExamsResponse>("exams", district, state);
  const examsData = apiResponse?.data;
  const meta = apiResponse?.meta;

  const [examCategory, setExamCategory] = useState<"all" | ExamCategory>("all");

  const allExamsRaw = examsData ? [...(examsData.stateExams ?? []), ...(examsData.districtExams ?? [])] : [];

  const allExams = examCategory === "all"
    ? allExamsRaw
    : allExamsRaw.filter((e) => getExamCategory(e) === examCategory);

  const openExams = allExams.filter((e) => examBucket(e) === "open");
  const upcomingExams = allExams.filter((e) => examBucket(e) === "upcoming");
  const closedExams = allExams.filter((e) => examBucket(e) === "closed");

  const categories = ["all", "central", "state", "banking"] as const;

  // Picture 1: posts filled across every department that reports its
  // staffing (the same rows as the cards below). Nothing is estimated.
  const staffing = examsData?.staffing ?? [];
  const sanctioned = staffing.reduce((s, r) => s + r.sanctionedPosts, 0);
  const working = staffing.reduce((s, r) => s + r.workingStrength, 0);
  const vacant = staffing.reduce((s, r) => s + r.vacantPosts, 0);
  const filledShare = sanctioned > 0 ? working / sanctioned : 0;
  const staffingAsOf = newest(staffing.map((r) => r.asOfDate));
  const openNow = examsData?.summary.openExams ?? 0;
  const comingUp = examsData?.summary.upcomingExams ?? 0;
  const totalExams = examsData ? examsData.summary.totalStateExams + examsData.summary.totalDistrictExams : 0;

  // Picture 2: who runs the exams listed here (all of them, not the filter).
  const categoryCounts = (["central", "state", "banking"] as const)
    .map((c) => ({ key: c, count: allExamsRaw.filter((e) => getExamCategory(e) === c).length }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
  const whoSlices: DonutSlice[] = categoryCounts.map((c) => ({
    key: c.key,
    label: t(`categoryShort.${c.key}`),
    value: c.count,
    emoji: CATEGORY_EMOJI[c.key],
  }));
  const topWho = categoryCounts[0];
  // Two kinds at least and a few exams, or the ring says nothing.
  const showWho = categoryCounts.length >= 2 && allExamsRaw.length >= 3;
  const newestExamUpdate = newest(allExamsRaw.map((e) => e.lastVerifiedAt));

  const bold = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;
  const examsSentence = t.rich("examsSentence", { open: openNow, upcoming: comingUp, b: bold });

  return (
    <div className="ftp-container" style={{ maxWidth: "var(--ftp-reading-max)", margin: 0, paddingTop: 24, paddingBottom: 48 }}>
      <PageHeader
        icon={GraduationCap}
        title={t("title")}
        description={t("description")}
        backHref={base}
        accent={getModuleAccent("exams")}
        freshness={meta?.lastUpdated ? { asOf: meta.lastUpdated } : undefined}
        source={{ label: t("sourcePill") }}
      />
      <AIInsightCard module="exams" district={district} />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && !examsData && (
        <EmptyState emoji="📝" title={t("noData")} body={t("noDataBody")} />
      )}

      {!isLoading && examsData && (
        <>
          {/* Summary stats */}
          <StatStrip cols={4}>
            <StatTile emoji="📝" label={t("statTotal")} value={f.number(totalExams)} asOf={meta?.lastUpdated} />
            <StatTile emoji="✅" label={t("statOpen")} value={f.number(examsData.summary.openExams)} />
            <StatTile emoji="📅" label={t("statUpcoming")} value={f.number(examsData.summary.upcomingExams)} />
            <StatTile emoji="🏛️" label={t("statStaffing")} value={f.number(examsData.summary.totalStaffingRecords)} />
          </StatStrip>

          {/* Picture 1. With staffing: explainer + pictogram of filled
              posts, and a dial. Without: the exam sentence on its own. */}
          {sanctioned > 0 ? (
            <div className="ftp-picture-row" style={{ marginTop: 16 }}>
              <Card tinted padding={18}>
                <Explainer emoji="🪑">
                  {t.rich("staffingSentence", {
                    sanctioned: f.number(sanctioned),
                    working: f.number(working),
                    vacant: f.number(vacant),
                    b: bold,
                  })}{" "}
                  {examsSentence}
                </Explainer>
                <Pictogram
                  filled={filledShare * 10}
                  emoji="🧑‍💼"
                  label={t("staffingPicto", { n: Math.round(filledShare * 10) })}
                />
              </Card>
              <Card tinted padding={18} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Gauge value={filledShare * 100} label={t("gaugeLabel")} caption={t("gaugeCaption", { n: staffing.length })} />
                {staffingAsOf && <AsOfText asOf={staffingAsOf} />}
              </Card>
            </div>
          ) : totalExams > 0 ? (
            <div style={{ marginTop: 16 }}>
              <Explainer emoji="📝">{examsSentence}</Explainer>
            </div>
          ) : null}

          {/* Picture 2: who is hiring. */}
          {showWho && topWho && (
            <div style={{ marginTop: 16 }}>
              <ChartCard
                title={t("whoTitle")}
                emoji="🧑‍🎓"
                units={t("whoUnits")}
                simple={t.rich("whoSimple", {
                  name: t(`categoryShort.${topWho.key}`),
                  n: f.number(topWho.count),
                  total: f.number(allExamsRaw.length),
                  b: (c) => <strong>{c}</strong>,
                })}
                asOf={meta?.lastUpdated ?? newestExamUpdate}
                source={{ label: t("sourcePill") }}
                table={whoSlices.map((s) => ({ label: s.label, value: f.number(s.value) }))}
              >
                <ShareDonut
                  slices={whoSlices}
                  centerValue={f.number(allExamsRaw.length)}
                  centerLabel={t("examsWord", { n: allExamsRaw.length })}
                  ariaLabel={t("whoAria", {
                    name: t(`categoryShort.${topWho.key}`),
                    n: f.number(topWho.count),
                    total: f.number(allExamsRaw.length),
                  })}
                />
              </ChartCard>
            </div>
          )}

          {/* Category filter */}
          <div style={{ marginTop: 20 }}>
            <Chips
              label={t("filterLabel")}
              value={examCategory}
              onChange={(v) => setExamCategory(v as typeof examCategory)}
              items={categories.map((cat) => ({
                value: cat,
                label: t(`categories.${cat}`),
                count: cat === "all" ? undefined : allExamsRaw.filter((e) => getExamCategory(e) === cat).length,
              }))}
            />
          </div>

          {/* Staffing */}
          <StaffingSection staffing={staffing} />

          <ExamGroup title={t("groupOpen")} emoji="✅" exams={openExams} />
          <ExamGroup title={t("groupUpcoming")} emoji="📅" exams={upcomingExams} />
          <ExamGroup title={t("groupClosed")} emoji="🏁" exams={closedExams} />

          {!allExams.length && (
            <div style={{ marginTop: 24 }}>
              <EmptyState emoji="📭" title={t("noExams")} body={t("noExamsBody")} />
            </div>
          )}
        </>
      )}

      <SourcesFooter
        sources={[
          { name: "UPSC", url: "https://upsc.gov.in", frequency: t("frequency") },
          { name: "SSC", url: "https://ssc.gov.in", frequency: t("frequency") },
          { name: t("sourceBoards"), frequency: t("frequency") },
        ]}
      />

      {!isLoading && examsData && (
        <ModuleNews district={district} state={state} locale={locale} module="exams" />
      )}

      <Toolbar>
        <SharePageButton />
        <ToolbarButton icon={GitCompare} href={`/${locale}/compare?module=exams&a=${district}`}>
          {t("compare")}
        </ToolbarButton>
      </Toolbar>
    </div>
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
