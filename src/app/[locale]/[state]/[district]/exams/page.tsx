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
//  data date) → the picture (an "In simple words" line; when departments
//  report staffing, a pictogram of filled posts and a dial) → category
//  Chips → department staffing (sanctioned vs filled) → exam cards grouped
//  Open / Upcoming / Closed → SourcesFooter → related news → Toolbar.
//
//  Each exam card: title + body, a status pill, the date-driven
//  ExamStepper, the facts a student needs (vacancies, age, fees, pay…),
//  the official links, and a provenance line (last updated from news,
//  source link). "Coming up" states use the page hue; open / warning /
//  closed keep their semantic colours.
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
  AsOfText, SourcePill,
} from "@/components/district/ui";
import type { Tone } from "@/components/district/ui";
import { Explainer, Gauge, Pictogram } from "@/components/district/visuals";
import { useDistrictData } from "@/hooks/useDistrictData";
import { use, useState } from "react";
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

// ── Status → pill tone + label. Covers legacy lowercase + news-sourced uppercase ──
// "brand" here means "coming up" and is drawn in the page hue (see StatusPill).
const STATUS_CONFIG: Record<string, { tone: Tone; label: string }> = {
  // legacy
  upcoming:            { tone: "brand",   label: "Upcoming" },
  open:                { tone: "live",    label: "Applications open" },
  closed:              { tone: "neutral", label: "Closed" },
  results:             { tone: "warn",    label: "Results out" },
  // news-driven
  NOTIFICATION_OUT:    { tone: "brand",   label: "Notification out" },
  APPLICATIONS_OPEN:   { tone: "live",    label: "Applications open" },
  APPLICATIONS_CLOSED: { tone: "neutral", label: "Applications closed" },
  ADMIT_CARD_OUT:      { tone: "warn",    label: "Admit card out" },
  EXAM_SCHEDULED:      { tone: "danger",  label: "Exam scheduled" },
  RESULT_PENDING:      { tone: "warn",    label: "Result pending" },
  RESULT_OUT:          { tone: "warn",    label: "Result out" },
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
function StatusPill({ tone, label }: { tone: Tone; label: string }) {
  if (tone === "brand") return <HuePill dot>{label}</HuePill>;
  return <Pill tone={tone} dot>{label}</Pill>;
}

// ── Staffing (all departments that report sanctioned vs filled posts) ──
function StaffingSection({ staffing }: { staffing: DepartmentStaffing[] }) {
  if (!staffing.length) return null;

  return (
    <Section title="Posts sanctioned and filled, by department" emoji="🏛️">
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
                  <div style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)" }}>{s.roleName}</div>
                  <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{s.department}</div>
                </div>
                {dangerLevel ? <Pill tone="danger">{s.module}</Pill> : <HuePill>{s.module}</HuePill>}
              </div>

              <ProgressBar pct={filledPct} tone={tone} height={8} />

              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: 6, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                <span>
                  Filled <span className="ftp-num" style={{ color: "var(--hue-deep)" }}>{s.workingStrength}</span>
                  {" of "}<span className="ftp-num">{s.sanctionedPosts}</span>
                </span>
                <span style={{ color: dangerLevel ? "var(--ftp-danger)" : "var(--ftp-text-2)" }}>
                  Vacant <span className="ftp-num">{s.vacantPosts}</span> (<span className="ftp-num">{vacantPct}%</span>)
                </span>
              </div>

              {(s.asOfDate || s.sourceUrl) && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  {s.asOfDate && <AsOfText asOf={s.asOfDate} />}
                  {s.sourceUrl && <SourcePill label="Source" href={withScheme(s.sourceUrl)} />}
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
function ExamCard({ exam, isStateLevel }: { exam: GovernmentExam; isStateLevel: boolean }) {
  void isStateLevel;
  const cfg = STATUS_CONFIG[exam.status] ?? STATUS_CONFIG.upcoming;
  const firstSource = Array.isArray(exam.sourceUrls) && exam.sourceUrls.length > 0 ? exam.sourceUrls[0] : null;

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

  return (
    <Card as="article" padding={20} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <h3 className="ftp-display" style={{ margin: "0 0 2px", fontSize: 17, lineHeight: "23px", fontWeight: 650, color: "var(--ftp-text)" }}>{exam.title}</h3>
          <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{exam.organizingBody ?? exam.department}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <StatusPill tone={cfg.tone} label={cfg.label} />
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
          applyUrl={exam.applyUrl}
        />
      </div>

      {/* Student perspective grid */}
      <dl style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px 16px", margin: "0 0 14px" }}>
        {[
          { label: "Vacancies", value: exam.vacancies?.toLocaleString("en-IN") ?? "TBA", mono: true },
          { label: "Age limit", value: exam.ageLimit ?? "—", mono: false },
          { label: "Qualification", value: exam.qualification ?? "—", mono: false },
          { label: "Application fee", value: exam.applicationFee ?? "—", mono: false },
          { label: "Pay scale", value: exam.payScale ?? "—", mono: false },
          { label: "Selection", value: exam.selectionProcess ?? "—", mono: false },
        ].map((item) => (
          <div key={item.label} style={{ minWidth: 0 }}>
            <dt className="ftp-label" style={{ marginBottom: 2 }}>{item.label}</dt>
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
              style={{ color: "var(--hue-deep)", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}
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
function ExamGroup({ title, emoji, exams }: { title: string; emoji: string; exams: GovernmentExam[] }) {
  if (exams.length === 0) return null;
  return (
    <Section
      emoji={emoji}
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

  // The picture: posts filled across every department that reports its
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

  const examsSentence = (
    <>
      <strong>{openNow}</strong> government {openNow === 1 ? "exam is" : "exams are"} open for applications right now, and{" "}
      <strong>{comingUp}</strong> more {comingUp === 1 ? "is" : "are"} coming up.
    </>
  );

  return (
    <div className="ftp-container" style={{ maxWidth: "var(--ftp-reading-max)", margin: 0, paddingTop: 24, paddingBottom: 48 }}>
      <PageHeader
        icon={GraduationCap}
        title="Exams & Jobs"
        description="Government exam notifications, eligibility, fees, and department staffing data"
        backHref={base}
        accent={getModuleAccent("exams")}
        freshness={meta?.lastUpdated ? { asOf: meta.lastUpdated } : undefined}
        source={{ label: "UPSC, SSC, state PSC" }}
      />
      <AIInsightCard module="exams" district={district} />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && !examsData && (
        <EmptyState emoji="📝" title="No exam data available yet." body="Notifications appear here once the recruitment boards publish them." />
      )}

      {!isLoading && examsData && (
        <>
          {/* Summary stats */}
          <StatStrip cols={4}>
            <StatTile emoji="📝" label="Total exams" value={totalExams} asOf={meta?.lastUpdated} />
            <StatTile emoji="✅" label="Open now" value={examsData.summary.openExams} />
            <StatTile emoji="📅" label="Upcoming" value={examsData.summary.upcomingExams} />
            <StatTile emoji="🏛️" label="Staffing records" value={examsData.summary.totalStaffingRecords} />
          </StatStrip>

          {/* The picture. With staffing: explainer + pictogram of filled
              posts, and a dial. Without: the exam sentence on its own. */}
          {sanctioned > 0 ? (
            <div className="ftp-picture-row" style={{ marginTop: 16 }}>
              <Card tinted padding={18}>
                <Explainer title="In simple words" emoji="🪑">
                  Of the <strong className="ftp-num">{sanctioned.toLocaleString("en-IN")}</strong> government posts listed here,{" "}
                  <strong className="ftp-num">{working.toLocaleString("en-IN")}</strong> have someone working in them and{" "}
                  <strong className="ftp-num">{vacant.toLocaleString("en-IN")}</strong> are empty. {examsSentence}
                </Explainer>
                <Pictogram
                  filled={filledShare * 10}
                  emoji="🧑‍💼"
                  label={`About ${Math.round(filledShare * 10)} of every 10 approved posts have someone in them.`}
                />
              </Card>
              <Card tinted padding={18} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Gauge value={filledShare * 100} label="Posts filled" caption={`Posts filled across ${staffing.length} staffing ${staffing.length === 1 ? "record" : "records"}`} />
                {staffingAsOf && <AsOfText asOf={staffingAsOf} />}
              </Card>
            </div>
          ) : totalExams > 0 ? (
            <div style={{ marginTop: 16 }}>
              <Explainer title="In simple words" emoji="📝">{examsSentence}</Explainer>
            </div>
          ) : null}

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
          <StaffingSection staffing={staffing} />

          <ExamGroup title="Applications open" emoji="✅" exams={openExams} />
          <ExamGroup title="Upcoming exams" emoji="📅" exams={upcomingExams} />
          <ExamGroup title="Closed or results out" emoji="🏁" exams={closedExams} />

          {!allExams.length && (
            <div style={{ marginTop: 24 }}>
              <EmptyState emoji="📭" title="No exam notifications yet." body="Check back after the next data update." />
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
