/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Exams & Jobs — Design v3 "Civic Ledger" module page (CONCEPT-v3 §5)
// ═══════════════════════════════════════════════════════════════════════
//
//  PageHeader → AI summary → StatStrip (totals, with the data date) →
//  category Chips → department staffing (sanctioned vs filled) → exam
//  cards grouped Open / Upcoming / Closed → SourcesFooter → related news
//  → Toolbar (Share, Compare).
//
//  Each exam card: title + body, a status Pill, the date-driven
//  ExamStepper, the facts a student needs (vacancies, age, fees, pay…),
//  the official links, and a provenance line ("Last updated from news …",
//  Source ↗). Status colour only ever appears as a Pill — never a stripe.
//
"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import { getModuleSources } from "@/lib/constants/state-config";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import ExamStepper from "@/components/district/ExamStepper";
import {
  PageHeader, Section, Card, Pill, Chips, StatStrip, StatTile, ProgressBar,
  LoadingShell, ErrorBlock, EmptyState, SourcesFooter, Toolbar, ToolbarButton,
} from "@/components/district/ui";
import type { Tone } from "@/components/district/ui";
import { useDistrictData } from "@/hooks/useDistrictData";
import { use, useState } from "react";
import { BookOpen, GraduationCap, ExternalLink, Users, Landmark, AlertTriangle, Share2, GitCompare, ClipboardList } from "lucide-react";
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

// ── Status → Pill tone + label. Covers legacy lowercase + news-sourced uppercase ──
const STATUS_CONFIG: Record<string, { tone: Tone; label: string }> = {
  // legacy
  upcoming:            { tone: "brand",   label: "Upcoming" },
  open:                { tone: "live",    label: "Applications Open" },
  closed:              { tone: "neutral", label: "Closed" },
  results:             { tone: "warn",    label: "Results Out" },
  // news-driven
  NOTIFICATION_OUT:    { tone: "brand",   label: "Notification Out" },
  APPLICATIONS_OPEN:   { tone: "live",    label: "Applications Open" },
  APPLICATIONS_CLOSED: { tone: "neutral", label: "Applications Closed" },
  ADMIT_CARD_OUT:      { tone: "warn",    label: "Admit Card Out" },
  EXAM_SCHEDULED:      { tone: "danger",  label: "Exam Scheduled" },
  RESULT_PENDING:      { tone: "warn",    label: "Result Pending" },
  RESULT_OUT:          { tone: "warn",    label: "Result Out" },
  COMPLETED:           { tone: "neutral", label: "Completed" },
};

// Bucket an exam into open / upcoming / closed for section grouping.
function examBucket(e: GovernmentExam): "open" | "upcoming" | "closed" {
  const s = e.status;
  if (s === "open" || s === "APPLICATIONS_OPEN" || s === "ADMIT_CARD_OUT" || s === "EXAM_SCHEDULED") return "open";
  if (s === "closed" || s === "APPLICATIONS_CLOSED" || s === "results" || s === "RESULT_PENDING" || s === "RESULT_OUT" || s === "COMPLETED") return "closed";
  return "upcoming"; // upcoming, NOTIFICATION_OUT, anything unknown
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "";
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN");
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

// ── Staffing (all departments that report sanctioned vs filled posts) ──
function StaffingSection({ staffing }: { staffing: DepartmentStaffing[] }) {
  if (!staffing.length) return null;

  return (
    <Section
      title={
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Landmark size={18} aria-hidden style={{ color: "var(--ftp-text-2)" }} />
          Sanctioned vs. filled (department staffing)
        </span>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(220px, 100%), 1fr))", gap: 12 }}>
        {staffing.map((s) => {
          const filledPct = s.sanctionedPosts > 0
            ? Math.round((s.workingStrength / s.sanctionedPosts) * 100)
            : 0;
          const vacantPct = 100 - filledPct;
          const dangerLevel = vacantPct > 30;
          const tone = fillTone(filledPct);

          return (
            <Card key={s.id} padding={14}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, lineHeight: "20px", fontWeight: 500, color: "var(--ftp-text)" }}>{s.roleName}</div>
                  <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{s.department}</div>
                </div>
                <Pill tone={dangerLevel ? "danger" : "neutral"}>{s.module}</Pill>
              </div>

              <ProgressBar pct={filledPct} tone={tone} />

              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: 6, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                <span>
                  Filled: <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{s.workingStrength}</span>
                  /<span className="ftp-num">{s.sanctionedPosts}</span>
                </span>
                <span style={{ color: dangerLevel ? "var(--ftp-danger)" : "var(--ftp-text-2)" }}>
                  Vacant: <span className="ftp-num">{s.vacantPosts}</span> (<span className="ftp-num">{vacantPct}%</span>)
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}

// ── Exam detail card ───────────────────────────────────────
function ExamCard({ exam, isStateLevel }: { exam: GovernmentExam; isStateLevel: boolean }) {
  void isStateLevel;
  const cfg = STATUS_CONFIG[exam.status] ?? STATUS_CONFIG.upcoming;
  const firstSource = Array.isArray(exam.sourceUrls) && exam.sourceUrls.length > 0 ? exam.sourceUrls[0] : null;

  // Link buttons under the facts. "Apply" is the one primary (filled) button.
  const linkStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    padding: "0 14px",
    borderRadius: "var(--ftp-radius-tile)",
    border: "1px solid var(--ftp-border)",
    background: "var(--ftp-surface)",
    color: "var(--ftp-text)",
    fontSize: 13,
    fontWeight: 500,
    textDecoration: "none",
  };

  return (
    <Card as="article" padding={20} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <h3 className="ftp-title" style={{ marginBottom: 2 }}>{exam.title}</h3>
          <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{exam.organizingBody ?? exam.department}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <Pill tone={cfg.tone} dot>{cfg.label}</Pill>
          {exam.needsVerification && (
            <Pill
              tone="warn"
              icon={AlertTriangle}
              title={`Last verified ${exam.lastVerifiedAt ? relativeTime(exam.lastVerifiedAt) : "—"}. No recent news confirmation.`}
            >
              Unverified
            </Pill>
          )}
        </div>
      </div>

      {/* Stepper — separated by hairlines, not a tinted box */}
      <div style={{ margin: "0 0 14px", padding: "12px 0", borderTop: "1px solid var(--ftp-border)", borderBottom: "1px solid var(--ftp-border)" }}>
        <ExamStepper
          status={exam.status}
          announcedDate={exam.announcedDate}
          notificationDate={exam.notificationDate ?? null}
          startDate={exam.startDate}
          endDate={exam.endDate}
          admitCardDate={exam.admitCardDate}
          examDate={exam.examDate}
          resultDate={exam.resultDate}
          applyUrl={exam.applyUrl}
        />
      </div>

      {/* Student perspective grid */}
      <dl style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px 16px", margin: "0 0 14px" }}>
        {[
          { label: "Vacancies", value: exam.vacancies?.toLocaleString("en-IN") ?? "TBA", mono: true },
          { label: "Age Limit", value: exam.ageLimit ?? "—", mono: false },
          { label: "Qualification", value: exam.qualification ?? "—", mono: false },
          { label: "Application Fee", value: exam.applicationFee ?? "—", mono: false },
          { label: "Pay Scale", value: exam.payScale ?? "—", mono: false },
          { label: "Selection", value: exam.selectionProcess ?? "—", mono: false },
        ].map((item) => (
          <div key={item.label} style={{ minWidth: 0 }}>
            <dt className="ftp-label" style={{ marginBottom: 2 }}>{item.label}</dt>
            <dd className={item.mono ? "ftp-num" : undefined} style={{ margin: 0, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)", overflowWrap: "anywhere" }}>
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
            style={{ ...linkStyle, background: "var(--ftp-brand)", borderColor: "var(--ftp-brand)", color: "var(--ftp-surface)" }}
          >
            Apply now <ExternalLink size={14} aria-hidden />
          </a>
        )}
        {exam.notificationUrl && (
          <a href={withScheme(exam.notificationUrl)} target="_blank" rel="noopener noreferrer" className="ftp-btn-secondary" style={linkStyle}>
            Notification <ExternalLink size={14} aria-hidden />
          </a>
        )}
        {exam.syllabusUrl && (
          <a href={withScheme(exam.syllabusUrl)} target="_blank" rel="noopener noreferrer" className="ftp-btn-secondary" style={linkStyle}>
            Syllabus <ExternalLink size={14} aria-hidden />
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
            fontSize: 11,
            lineHeight: "16px",
            color: "var(--ftp-text-2)",
          }}
        >
          {exam.lastVerifiedAt && (
            <span>Last updated from news: <span className="ftp-num">{relativeTime(exam.lastVerifiedAt)}</span></span>
          )}
          {firstSource && (
            <a
              href={withScheme(firstSource)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--ftp-brand)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}
            >
              Source <ExternalLink size={11} aria-hidden />
            </a>
          )}
        </div>
      )}
    </Card>
  );
}

/** Grid of exam cards under one heading ("Applications open (3)"). */
function ExamGroup({ title, exams }: { title: string; exams: GovernmentExam[] }) {
  if (exams.length === 0) return null;
  return (
    <Section
      title={
        <>
          {title} <span className="ftp-num" style={{ color: "var(--ftp-text-2)", fontWeight: 400 }}>({exams.length})</span>
        </>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))", gap: 16 }}>
        {exams.map((e) => (
          <ExamCard key={e.id} exam={e} isStateLevel={e.level === "state"} />
        ))}
      </div>
    </Section>
  );
}

/** Share button: the phone's share sheet when available, else copy the link. */
function SharePageButton() {
  const [copied, setCopied] = useState(false);
  function share() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: document.title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => {});
    }
  }
  return <ToolbarButton icon={Share2} onClick={share}>{copied ? "Link copied" : "Share"}</ToolbarButton>;
}

// ── Inner page ────────────────────────────────────────────
function ExamsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;

  const { data: apiResponse, isLoading, error } = useDistrictData<ExamsResponse>("exams", district, state);
  const examsData = apiResponse?.data;
  const meta = apiResponse?.meta;
  const sources = getModuleSources("exams", state);

  const [examCategory, setExamCategory] = useState<"all" | "central" | "state" | "banking">("all");

  const allExamsRaw = examsData ? [...(examsData.stateExams ?? []), ...(examsData.districtExams ?? [])] : [];

  function getExamCategory(exam: GovernmentExam): "central" | "state" | "banking" {
    const dept = exam.department.toLowerCase();
    if (/bank|reserve bank|ibps|rbi|sbi|nabard/i.test(dept)) return "banking";
    if (/union public service|staff selection|railway|nta|upsc|ssc|rrb|cbse/i.test(dept)) return "central";
    return "state";
  }

  const allExams = examCategory === "all"
    ? allExamsRaw
    : allExamsRaw.filter((e) => getExamCategory(e) === examCategory);

  const openExams = allExams.filter((e) => examBucket(e) === "open");
  const upcomingExams = allExams.filter((e) => examBucket(e) === "upcoming");
  const closedExams = allExams.filter((e) => examBucket(e) === "closed");

  const categories = [
    { id: "all", label: "All" },
    { id: "central", label: "Central (UPSC, SSC, NTA)" },
    { id: "state", label: "State PSC" },
    { id: "banking", label: "Banking (IBPS, SBI)" },
  ] as const;

  return (
    <div className="ftp-container" style={{ maxWidth: "var(--ftp-reading-max)", margin: 0, paddingTop: 24, paddingBottom: 48 }}>
      <PageHeader
        icon={GraduationCap}
        title="Exams & Jobs"
        description="Government exam notifications, eligibility, fees, and department staffing data"
        backHref={base}
        accent={getModuleAccent("exams")}
        freshness={meta?.lastUpdated ? { asOf: meta.lastUpdated } : undefined}
        source={{ label: "UPSC · SSC · State PSC" }}
      />
      <AIInsightCard module="exams" district={district} />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && !examsData && (
        <EmptyState title="No exam data available yet." body="Notifications appear here once the recruitment boards publish them." />
      )}

      {!isLoading && examsData && (
        <>
          {/* Summary stats */}
          <StatStrip cols={4}>
            <StatTile icon={BookOpen} label="Total exams" value={examsData.summary.totalStateExams + examsData.summary.totalDistrictExams} asOf={meta?.lastUpdated} />
            <StatTile icon={GraduationCap} label="Open now" value={examsData.summary.openExams} />
            <StatTile icon={ClipboardList} label="Upcoming" value={examsData.summary.upcomingExams} />
            <StatTile icon={Users} label="Staffing records" value={examsData.summary.totalStaffingRecords} />
          </StatStrip>

          {/* Category filter */}
          <div style={{ marginTop: 20 }}>
            <Chips
              label="Filter exams by category"
              value={examCategory}
              onChange={(v) => setExamCategory(v as typeof examCategory)}
              items={categories.map((cat) => ({
                value: cat.id,
                label: cat.label,
                count: cat.id === "all" ? undefined : allExamsRaw.filter((e) => getExamCategory(e) === cat.id).length,
              }))}
            />
          </div>

          {/* Staffing */}
          <StaffingSection staffing={examsData.staffing ?? []} />

          <ExamGroup title="Applications open" exams={openExams} />
          <ExamGroup title="Upcoming exams" exams={upcomingExams} />
          <ExamGroup title="Closed / results" exams={closedExams} />

          {!allExams.length && (
            <div style={{ marginTop: 24 }}>
              <EmptyState title="No exam notifications yet." body="Check back after the next data update." />
            </div>
          )}
        </>
      )}

      <SourcesFooter sources={sources.sources.map((name) => ({ name, frequency: sources.frequency }))} />

      {!isLoading && examsData && (
        <ModuleNews district={district} state={state} locale={locale} module="exams" />
      )}

      <Toolbar>
        <SharePageButton />
        <ToolbarButton icon={GitCompare} href={`/${locale}/compare?module=exams&a=${district}`}>
          Compare with another district
        </ToolbarButton>
      </Toolbar>
    </div>
  );
}

export default function ExamsPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Exams & Jobs">
      <ExamsPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
