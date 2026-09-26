/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources } from "@/lib/constants/state-config";
import ExamStepper from "@/components/district/ExamStepper";
import { ModuleHeader, SectionLabel, LoadingShell, ErrorBlock, EmptyBlock } from "@/components/district/ui";
import { useDistrictData } from "@/hooks/useDistrictData";
import { use, useState } from "react";
import { BookOpen, GraduationCap, ExternalLink, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

// ── Status config — covers both legacy lowercase + news-sourced uppercase ──
const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  // legacy
  upcoming:            { color: "#2563EB", bg: "#EFF6FF", label: "Upcoming" },
  open:                { color: "#16A34A", bg: "#DCFCE7", label: "Applications Open" },
  closed:              { color: "#6B7280", bg: "#F3F4F6", label: "Closed" },
  results:             { color: "#D97706", bg: "#FEF3C7", label: "Results Out" },
  // news-driven
  NOTIFICATION_OUT:    { color: "#2563EB", bg: "#EFF6FF", label: "Notification Out" },
  APPLICATIONS_OPEN:   { color: "#16A34A", bg: "#DCFCE7", label: "Applications Open" },
  APPLICATIONS_CLOSED: { color: "#6B7280", bg: "#F3F4F6", label: "Applications Closed" },
  ADMIT_CARD_OUT:      { color: "#D97706", bg: "#FEF3C7", label: "Admit Card Out" },
  EXAM_SCHEDULED:      { color: "#DC2626", bg: "#FEF2F2", label: "Exam Scheduled" },
  RESULT_PENDING:      { color: "#D97706", bg: "#FEF3C7", label: "Result Pending" },
  RESULT_OUT:          { color: "#D97706", bg: "#FEF3C7", label: "Result Out" },
  COMPLETED:           { color: "#6B7280", bg: "#F3F4F6", label: "Completed" },
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

// ── Staffing widget ────────────────────────────────────────
function StaffingWidget({ staffing }: { staffing: DepartmentStaffing[] }) {
  if (!staffing.length) return null;

  return (
    <div style={{
      background: "#FFF",
      border: "1px solid #E8E8E4",
      borderRadius: 14,
      padding: "16px 20px",
      marginBottom: 24,
    }}>
      <SectionLabel>🏛️ Sanctioned vs. Filled (Department Staffing)</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
        {staffing.map((s) => {
          const filledPct = s.sanctionedPosts > 0
            ? Math.round((s.workingStrength / s.sanctionedPosts) * 100)
            : 0;
          const vacantPct = 100 - filledPct;
          const dangerLevel = vacantPct > 30;

          const barColor = dangerLevel ? "#DC2626" : filledPct >= 70 ? "#16A34A" : "#D97706";

          const moduleColors: Record<string, string> = {
            health: "#DC2626", police: "#2563EB", schools: "#7C3AED",
          };
          const accent = moduleColors[s.module] ?? "#6B7280";

          return (
            <div key={s.id} style={{
              border: `1px solid ${accent}25`,
              borderRadius: 10,
              padding: "12px 14px",
              background: `${accent}05`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>{s.roleName}</div>
                  <div style={{ fontSize: 10, color: "#9B9B9B" }}>{s.department}</div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: dangerLevel ? "#DC2626" : accent,
                  background: dangerLevel ? "#FEE2E2" : `${accent}15`,
                  padding: "2px 6px", borderRadius: 20,
                }}>
                  {s.module}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ background: "#F0F0EC", borderRadius: 4, height: 6, overflow: "hidden", marginBottom: 6 }}>
                <div style={{
                  background: barColor,
                  width: `${filledPct}%`,
                  height: "100%",
                  borderRadius: 4,
                  transition: "width 600ms ease",
                }} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6B7280" }}>
                <span className="font-data" style={{ fontFamily: "var(--font-mono)" }}>
                  Filled: <strong style={{ color: "#1A1A1A" }}>{s.workingStrength}</strong>/{s.sanctionedPosts}
                </span>
                <span style={{
                  color: dangerLevel ? "#DC2626" : "#9B9B9B",
                  fontWeight: dangerLevel ? 700 : 400,
                }}>
                  Vacant: {s.vacantPosts} ({vacantPct}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Exam detail card ───────────────────────────────────────
function ExamCard({ exam, isStateLevel }: { exam: GovernmentExam; isStateLevel: boolean }) {
  void isStateLevel;
  const cfg = STATUS_CONFIG[exam.status] ?? STATUS_CONFIG.upcoming;
  const firstSource = Array.isArray(exam.sourceUrls) && exam.sourceUrls.length > 0 ? exam.sourceUrls[0] : null;

  return (
    <div style={{
      background: "#FFF",
      border: "1px solid #E8E8E4",
      borderRadius: 14,
      padding: "18px 20px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      display: "flex",
      flexDirection: "column",
      gap: 0,
      minWidth: 0,
      overflow: "hidden",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.3, marginBottom: 3 }}>
            {exam.title}
          </div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>{exam.organizingBody ?? exam.department}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: cfg.color,
            background: cfg.bg,
            padding: "3px 10px",
            borderRadius: 20,
            border: `1px solid ${cfg.color}30`,
            whiteSpace: "nowrap",
          }}>
            {cfg.label}
          </span>
          {exam.needsVerification && (
            <span
              title={`Last verified ${exam.lastVerifiedAt ? relativeTime(exam.lastVerifiedAt) : "—"}. No recent news confirmation.`}
              style={{
                fontSize: 10, fontWeight: 600, color: "#A16207",
                background: "#FEFCE8", border: "1px solid #FDE68A",
                padding: "2px 8px", borderRadius: 10,
              }}
            >
              ⚠ Unverified
            </span>
          )}
        </div>
      </div>

      {/* Stepper */}
      <div style={{ marginBottom: 14, padding: "12px 8px", background: "#FAFAF8", borderRadius: 10 }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px 16px", marginBottom: 12 }}>
        {[
          { label: "Vacancies", value: exam.vacancies?.toLocaleString("en-IN") ?? "TBA", mono: true },
          { label: "Age Limit", value: exam.ageLimit ?? "—", mono: false },
          { label: "Qualification", value: exam.qualification ?? "—", mono: false },
          { label: "Application Fee", value: exam.applicationFee ?? "—", mono: false },
          { label: "Pay Scale", value: exam.payScale ?? "—", mono: false },
          { label: "Selection", value: exam.selectionProcess ?? "—", mono: false },
        ].map((item) => (
          <div key={item.label}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#9B9B9B", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 2 }}>
              {item.label}
            </div>
            <div style={{
              fontSize: 12,
              color: "#374151",
              fontFamily: item.mono ? "var(--font-mono)" : "inherit",
              fontWeight: item.mono ? 600 : 400,
            }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: "auto" }}>
        {exam.applyUrl && examBucket(exam) !== "closed" && (
          <a
            href={exam.applyUrl.startsWith("http") ? exam.applyUrl : `https://${exam.applyUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "7px 14px",
              background: "#16A34A",
              color: "#FFF",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Apply Now <ExternalLink size={11} />
          </a>
        )}
        {exam.notificationUrl && (
          <a
            href={exam.notificationUrl.startsWith("http") ? exam.notificationUrl : `https://${exam.notificationUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "7px 14px",
              background: "#EFF6FF",
              color: "#2563EB",
              border: "1px solid #BFDBFE",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Notification <ExternalLink size={11} />
          </a>
        )}
        {exam.syllabusUrl && (
          <a
            href={exam.syllabusUrl.startsWith("http") ? exam.syllabusUrl : `https://${exam.syllabusUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "7px 14px",
              background: "#F5F3FF",
              color: "#7C3AED",
              border: "1px solid #DDD6FE",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Syllabus <ExternalLink size={11} />
          </a>
        )}
      </div>

      {/* Provenance footer — last verified + source link */}
      {(exam.lastVerifiedAt || firstSource) && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: "1px solid #F0F0EC",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            flexWrap: "wrap",
            fontSize: 11,
            color: "#9B9B9B",
          }}
        >
          {exam.lastVerifiedAt && (
            <span>Last updated from news: {relativeTime(exam.lastVerifiedAt)}</span>
          )}
          {firstSource && (
            <a
              href={firstSource.startsWith("http") ? firstSource : `https://${firstSource}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#2563EB", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}
            >
              Source <ExternalLink size={10} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── Stats row ─────────────────────────────────────────────
function StatsRow({ summary }: { summary: ExamsResponse["summary"] }) {
  const stats = [
    { icon: BookOpen, label: "Total Exams", value: summary.totalStateExams + summary.totalDistrictExams, color: "#2563EB" },
    { icon: GraduationCap, label: "Open Now", value: summary.openExams, color: "#16A34A" },
    { icon: Users, label: "Upcoming", value: summary.upcomingExams, color: "#D97706" },
    { icon: Users, label: "Staffing Records", value: summary.totalStaffingRecords, color: "#7C3AED" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 24 }}>
      {stats.map((s) => (
        <div key={s.label} style={{
          background: "#FFF",
          border: "1px solid #E8E8E4",
          borderRadius: 12,
          padding: "14px 16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <s.icon size={14} style={{ color: s.color }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: "#9B9B9B", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {s.label}
            </span>
          </div>
          <div className="font-data" style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A", fontFamily: "var(--font-mono)" }}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Inner page ────────────────────────────────────────────
function ExamsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;

  const { data: apiResponse, isLoading, error } = useDistrictData<ExamsResponse>("exams", district, state);
  const examsData = apiResponse?.data;
  const meta = apiResponse?.meta;

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

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader
        icon={GraduationCap as LucideIcon}
        title="Exams & Jobs"
        description="Government exam notifications, eligibility, fees, and department staffing data"
        backHref={base}
      />
      {(() => { const _src = getModuleSources("exams", state); return <DataSourceBanner moduleName="exams" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="exams" district={district} />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && !examsData && <EmptyBlock icon="📝" message="No exam data available yet" />}

      {!isLoading && examsData && (
        <>
          {/* Summary stats */}
          <StatsRow summary={examsData.summary} />

          {/* Category filter */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {([
              { id: "all", label: "All" },
              { id: "central", label: "Central (UPSC, SSC, NTA)" },
              { id: "state", label: "State PSC" },
              { id: "banking", label: "Banking (IBPS, SBI)" },
            ] as const).map((cat) => (
              <button key={cat.id} onClick={() => setExamCategory(cat.id)} style={{
                padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: examCategory === cat.id ? "#2563EB" : "#F5F5F0",
                color: examCategory === cat.id ? "#FFF" : "#6B6B6B",
                border: examCategory === cat.id ? "1px solid #2563EB" : "1px solid #E8E8E4",
              }}>
                {cat.label}
                {cat.id !== "all" && ` (${allExamsRaw.filter((e) => getExamCategory(e) === cat.id).length})`}
              </button>
            ))}
          </div>

          {/* Staffing widget */}
          <StaffingWidget staffing={examsData.staffing ?? []} />

          {/* Open exams */}
          {openExams.length > 0 && (
            <>
              <SectionLabel>🟢 Applications Open ({openExams.length})</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))", gap: 14, marginBottom: 28 }}>
                {openExams.map((e) => (
                  <ExamCard key={e.id} exam={e} isStateLevel={e.level === "state"} />
                ))}
              </div>
            </>
          )}

          {/* Upcoming exams */}
          {upcomingExams.length > 0 && (
            <>
              <SectionLabel>📋 Upcoming Exams ({upcomingExams.length})</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))", gap: 14, marginBottom: 28 }}>
                {upcomingExams.map((e) => (
                  <ExamCard key={e.id} exam={e} isStateLevel={e.level === "state"} />
                ))}
              </div>
            </>
          )}

          {/* Closed / Results */}
          {closedExams.length > 0 && (
            <>
              <SectionLabel>🔒 Closed / Results ({closedExams.length})</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))", gap: 14, marginBottom: 28 }}>
                {closedExams.map((e) => (
                  <ExamCard key={e.id} exam={e} isStateLevel={e.level === "state"} />
                ))}
              </div>
            </>
          )}

          {!allExams.length && (
            <EmptyBlock icon="📝" message="No exam notifications yet. Check back after the next data update." />
          )}

          <ModuleNews district={district} state={state} locale={locale} module="exams" />
        </>
      )}
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
