/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Hospitals & health — Layout v4.1 (docs/LAYOUT.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  The question: "Where do I go when someone is sick, whom do I call, and
//  are there enough doctors?"
//  The answer, in one sentence: "Mandya has 4 hospitals and health
//  centres listed here. In an emergency, call 108 for a free ambulance."
//
//  Data:
//   • Hospitals and health centres: the district's government offices
//     (/api/data/offices) whose type, department or name is about health
//     (hospital, PHC, CHC, clinic, Health & Family Welfare …). Public
//     Health Engineering (water works) is left out. Beds and doctors per
//     hospital are not in any table yet, so the sheet never shows them.
//   • Staff: sanctioned vs working posts (useStaffing, with its own date).
//   • Helplines, schemes and the care ladder are national reference text.
//
//  Page: header → the answer → the two emergency numbers → tiles → one
//  picture (where to go for care, a staircase from the village centre to
//  the district hospital) → hospital cards (tap → address, phone to call,
//  directions, hours, services) → staff posts → schemes → more helplines
//  → AI insight → news, share (sources are in the layout's verification panel).
//
//  Text: page_health (en/kn/hi). Hospital names, types, addresses and
//  services are data and stay as published; scheme names are proper nouns.
"use client";
import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { Building2, ExternalLink, Heart, Home, Hospital, Phone, Pill as PillIcon, Stethoscope, type LucideIcon } from "lucide-react";
import { useDistrictData } from "@/hooks/useDistrictData";
import {
  ModulePage,
  PageHeader,
  Section,
  Card,
  Chips,
  Pill,
  StatTile,
  StatStrip,
  EmptyState,
  LoadingShell,
  ToolbarButton,
} from "@/components/district/ui";
import { Explainer } from "@/components/district/visuals";
import { DetailSheet, DetailList } from "@/components/district/DetailSheet";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import StaffingSection, { useStaffing } from "@/components/district/daily-services/StaffingSection";
import { fitGrid, TapCard, SearchBox, MoreButton, ActionLink, SheetNote, SheetHeading, TagList, matches, mapsUrl, telHref, useNow, usePlaceName } from "@/components/services-1/kit";
import PageEnd from "@/components/services-1/PageEnd";
import { IconChip } from "@/components/district/page-kit";
import { getStateConfig } from "@/lib/constants/state-config";
import { hueClass } from "@/lib/design/hues";
import { useDistrictName, useFormat, useModuleText, usePlaceText } from "@/i18n/client";

/** A government office row as the offices API returns it (Prisma GovOffice). */
interface Office {
  id: string;
  name: string;
  nameLocal?: string | null;
  department: string;
  type: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  headName?: string | null;
  headDesignation?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  mondayHours?: string | null;
  tuesdayHours?: string | null;
  wednesdayHours?: string | null;
  thursdayHours?: string | null;
  fridayHours?: string | null;
  saturdayHours?: string | null;
  sundayHours?: string | null;
  lunchBreak?: string | null;
  services?: string[] | null;
  holidays?: string | null;
  notes?: string | null;
  active?: boolean;
}

/** Health places: hospitals, health centres, clinics and the health department. */
const HEALTH_RE = /hospital|health|medical|\bphc\b|\bchc\b|clinic|dispensary|a+rogya|maternity|ayush|nursing|sub-?cent(re|er)/i;
/** …but not the water-works department that shares the word "health". */
const NOT_HEALTH_RE = /public health engineering|\bphed\b/i;

function isHealthPlace(o: Office): boolean {
  if (o.active === false) return false;
  const text = `${o.type} ${o.department} ${o.name}`;
  return HEALTH_RE.test(text) && !NOT_HEALTH_RE.test(text);
}

/** A plain Lucide marker for the kind of place (hospital, health centre, clinic, office). */
function placeIcon(o: Office): LucideIcon {
  const text = `${o.type} ${o.name}`;
  if (/hospital|medical college/i.test(text)) return Hospital;
  if (/\bphc\b|\bchc\b|health cent|sub-?cent/i.test(text)) return Stethoscope;
  if (/clinic|dispensary/i.test(text)) return PillIcon;
  return Building2;
}

/** Opening hours, Monday first, from the row's day fields. */
const DAY_FIELDS = ["mondayHours", "tuesdayHours", "wednesdayHours", "thursdayHours", "fridayHours", "saturdayHours", "sundayHours"] as const;
/** A date on each weekday (1 Jan 2024 was a Monday), for Intl day names. */
const dayDate = (i: number) => new Date(Date.UTC(2024, 0, 1 + i, 6, 30));
const WEEKDAY_IST = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "short" });
const WEEKDAY_INDEX: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

// Static health helplines for India — national numbers only.
// `urgent` ones are the two big buttons under the answer.
const HELPLINES = [
  { id: "ambulance", number: "108", urgent: true },
  { id: "emergency", number: "112", urgent: true },
  { id: "icall", number: "9152987821" },
  { id: "poison", number: "1800-116-117" },
  { id: "ayushman", number: "14555" },
  { id: "nhh", number: "1800-180-1104" },
];

/** A scheme card: `name` is the official name (not translated), `id` keys its description. */
interface HealthScheme {
  id: string;
  name: string;
  url: string | null;
}

const NATIONAL_SCHEMES: HealthScheme[] = [
  { id: "pmjay", name: "Ayushman Bharat PM-JAY", url: "https://pmjay.gov.in" },
  { id: "jsy", name: "Janani Suraksha Yojana", url: null },
  { id: "rbsk", name: "RBSK (Rashtriya Bal Swasthya Karyakram)", url: null },
];

const STATE_HEALTH_SCHEMES: Record<string, HealthScheme> = {
  karnataka: { id: "karnataka", name: "Arogya Karnataka", url: "https://arogyakarnataka.gov.in" },
  telangana: { id: "telangana", name: "Aarogyasri", url: "https://aarogyasri.telangana.gov.in" },
  "tamil-nadu": { id: "tamil-nadu", name: "CMCHIS", url: null },
  delhi: { id: "delhi", name: "Delhi Arogya Kosh", url: null },
  maharashtra: { id: "maharashtra", name: "MJPJAY", url: null },
  "west-bengal": { id: "west-bengal", name: "Swasthya Sathi", url: null },
  "uttar-pradesh": { id: "uttar-pradesh", name: "Ayushman Bharat UP", url: null },
};

/** The state's name for its secondary hospitals → message key. */
const SUB_HOSPITAL_KEY: Record<string, string> = {
  "Taluk Hospitals": "taluk",
  "Area Hospitals": "area",
  "Zonal Hospitals": "zonal",
  "Sub-District Hospitals": "subDistrict",
  "Block Hospitals": "block",
  "Community Health Centres": "chc",
};

/** Step colours for the care staircase, lightest (village) to deepest (district). */
const STEP_BG = [
  "var(--hue-tint)",
  "color-mix(in srgb, var(--hue-pop) 55%, #fff)",
  "var(--hue-pop)",
  "linear-gradient(160deg, var(--hue) 0%, var(--hue-deep) 100%)",
];

/** Cards shown before "Show all". */
const FIRST_SHOWN = 24;

/** A helpline as a big tel: card (44 px+ tall); the phone icon says "tap to call". */
function HelplineCard({ number, name, ariaLabel, urgent }: { number: string; name: string; ariaLabel: string; urgent?: boolean }) {
  return (
    <a
      href={telHref(number)}
      className="ftp-card-link"
      aria-label={ariaLabel}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        minHeight: urgent ? 64 : 48,
        padding: urgent ? "14px 16px" : "12px 14px",
        background: urgent ? "linear-gradient(135deg, color-mix(in srgb, var(--hue) 14%, #fff) 0%, #fff 75%)" : "var(--ftp-surface)",
        border: urgent ? "2px solid color-mix(in srgb, var(--hue) 45%, var(--ftp-border))" : "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
        boxShadow: "var(--ftp-shadow-1)",
        textDecoration: "none",
        color: "var(--ftp-text)",
      }}
    >
      <IconChip icon={Phone} size={urgent ? 44 : 36} />
      <span style={{ display: "block", minWidth: 0 }}>
        <span className="ftp-bignum" style={{ display: "block", fontSize: urgent ? 28 : 18, lineHeight: 1.1, color: urgent ? "var(--ftp-danger)" : "var(--hue-deep)" }}>
          {number}
        </span>
        <span style={{ display: "block", fontSize: 13, lineHeight: 1.45, color: "var(--ftp-text-2)" }}>{name}</span>
      </span>
    </a>
  );
}

function HealthPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_health");
  const tUnit = useTranslations("subUnitOne");
  const f = useFormat();
  const mt = useModuleText();
  const placeText = usePlaceText();
  const place = usePlaceName();
  const districtName = useDistrictName(state, district);
  const base = `/${locale}/${state}/${district}`;
  const now = useNow();
  const { data: officeData, isLoading: officesLoading } = useDistrictData<Office[]>("offices", district, state);
  const staff = useStaffing("health", district, state);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [limit, setLimit] = useState(FIRST_SHOWN);
  const [openId, setOpenId] = useState<string | null>(null);

  const bNum = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;
  const pct = (n: number) => f.number(n / 100, { style: "percent", maximumFractionDigits: 0 });

  // Hospitals and health centres listed for the district.
  const places = (officeData?.data ?? []).filter(isHealthPlace);
  const types = Array.from(new Set(places.map((p) => p.type).filter(Boolean)));
  const listed = places
    .filter((p) => typeFilter === "all" || p.type === typeFilter)
    .filter((p) => matches(query, p.name, p.nameLocal, p.type, p.address, ...(p.services ?? [])));
  const shown = listed.slice(0, limit);
  const open = places.find((p) => p.id === openId) ?? null;

  // Today's hours (India time) from the row's own day field.
  const todayIndex = now ? WEEKDAY_INDEX[WEEKDAY_IST.format(new Date(now))] : -1;
  const todayHours = (p: Office) => (todayIndex >= 0 ? p[DAY_FIELDS[todayIndex]] ?? null : null);
  const dayLong = DAY_FIELDS.map((_, i) => f.date(dayDate(i), { weekday: "long" }));

  const stateScheme = STATE_HEALTH_SCHEMES[state];
  const schemes = [
    ...NATIONAL_SCHEMES.map((s) => ({ ...s, tag: t("schemes.central") })),
    ...(stateScheme ? [{ ...stateScheme, tag: t("schemes.stateScheme", { state: placeText.state(state) }) }] : []),
  ];

  // The care staircase: village → district, with the state's own names.
  const config = getStateConfig(state);
  const subLabelEn = config?.healthSubLabel ?? "Taluk Hospitals";
  const subKey = SUB_HOSPITAL_KEY[subLabelEn];
  const unitEn = config?.subDistrictUnit ?? "Taluk";
  const unit = tUnit.has(unitEn) ? tUnit(unitEn) : unitEn;
  const steps = [
    { key: "subCentre", icon: Home, title: t("care.subCentre"), desc: t("care.subCentreDesc") },
    { key: "phc", icon: Stethoscope, title: t("care.phc"), desc: t("care.phcDesc") },
    { key: "sub", icon: Building2, title: subKey ? t(`care.sub.${subKey}`) : subLabelEn, desc: t("care.subDesc", { unit }) },
    { key: "district", icon: Hospital, title: t("care.district"), desc: t("care.districtDesc") },
  ];

  const urgent = HELPLINES.filter((h) => h.urgent);
  const others = HELPLINES.filter((h) => !h.urgent);
  const staffTenths = staff.sanctioned > 0 ? Math.round((staff.working / staff.sanctioned) * 10) : null;

  return (
    <ModulePage>
      <PageHeader
        icon={Heart}
        title={mt.label("health")}
        description={t("description")}
        backHref={base}
        freshness={staff.asOf ? { asOf: staff.asOf, thresholdHours: 24 * 30 } : undefined}
      />

      {/* 1. The answer in one sentence. */}
      <Explainer>
        {places.length > 0
          ? t.rich("answer.hospitals", { count: places.length, n: f.number(places.length), district: districtName, b: bNum })
          : t.rich("answer.noHospitals", { b: bNum })}
        {staffTenths !== null && <> {t.rich("answer.staff", { n: f.number(staffTenths), b: bNum })}</>}
      </Explainer>

      {/* The two numbers everyone should know, as big call buttons. */}
      <div role="group" aria-label={t("emergency.aria")} style={fitGrid(220)}>
        {urgent.map((h) => {
          const name = t(`helplines.${h.id}`);
          return <HelplineCard key={h.id} number={h.number} name={name} ariaLabel={t("helplines.call", { name, number: h.number })} urgent />;
        })}
      </div>

      {/* 2. Big numbers, only from real rows (the staff posts carry them;
            a lone hospital count is already in the answer). */}
      {staff.rows.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <StatStrip>
            {places.length > 0 && <StatTile label={t("tiles.places")} value={f.number(places.length)} sub={t("tiles.placesSub")} />}
            {staff.rows.length > 0 && (
              <StatTile label={t("tiles.filled")} value={staff.filledPct} unit="%" sub={t("tiles.filledSub", { pct: pct(100 - staff.filledPct) })} asOf={staff.asOf} />
            )}
            {staff.rows.length > 0 && (
              <StatTile label={t("tiles.working")} value={f.number(staff.working)} sub={t("tiles.workingSub", { n: f.number(staff.sanctioned) })} asOf={staff.asOf} />
            )}
            {staff.rows.length > 0 && (
              <StatTile label={t("tiles.vacant")} value={f.number(staff.vacant)} sub={staff.shortage ? t("tiles.shortage") : undefined} asOf={staff.asOf} />
            )}
          </StatStrip>
        </div>
      )}

      {/* 3. One picture: where to go for care, as a staircase. */}
      <Section title={t("care.title")}>
        <Card tinted padding={18}>
          <p className="ftp-body ftp-prose" style={{ margin: "0 0 16px", color: "var(--ftp-text-2)" }}>
            {t("care.hint")}
          </p>
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(150px, 100%), 1fr))", gap: 14 }}>
            {steps.map((s, i) => (
              <li key={s.key} style={{ minWidth: 0 }}>
                {/* Every step sits on the same floor; each one is taller. */}
                <div aria-hidden style={{ height: 150, display: "flex", alignItems: "flex-end" }}>
                  <div
                    className="ftp-grow-y"
                    style={{
                      width: "100%",
                      height: 66 + i * 28,
                      borderRadius: "18px 18px 6px 6px",
                      background: STEP_BG[i],
                      border: i === 0 ? "1px solid color-mix(in srgb, var(--hue) 25%, var(--ftp-border))" : "none",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      paddingTop: 14,
                      ["--i" as string]: i,
                    }}
                  >
                    <s.icon size={28} strokeWidth={1.75} style={{ color: i === 3 ? "#fff" : "var(--hue-deep)" }} />
                  </div>
                </div>
                <div className="ftp-title" style={{ fontSize: 15, lineHeight: 1.4, fontWeight: 600, marginTop: 10 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ftp-text-2)", marginTop: 2 }}>{s.desc}</div>
              </li>
            ))}
          </ol>
          {/* Private hospitals sit beside the public ladder, not on it. */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginTop: 18, paddingTop: 14, borderTop: "1px dashed color-mix(in srgb, var(--hue) 30%, var(--ftp-border))" }}>
            <IconChip icon={Building2} size={32} />
            <div style={{ minWidth: 0 }}>
              <div className="ftp-title" style={{ fontSize: 14, lineHeight: 1.45, fontWeight: 600 }}>{t("care.private")}</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ftp-text-2)" }}>{t("care.privateDesc")}</div>
            </div>
          </div>
        </Card>
      </Section>

      {/* 4. Hospitals and health centres; tap one for everything about it. */}
      <Section title={t("list.title")}>
        {officesLoading ? (
          <LoadingShell rows={3} />
        ) : places.length === 0 ? (
          <EmptyState
            title={t("list.empty", { district: districtName })}
            body={t("list.emptyBody")}
            action={
              <ToolbarButton icon={ExternalLink} href="https://nhm.gov.in" external>
                {t("list.emptyButton")}
              </ToolbarButton>
            }
          />
        ) : (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", marginBottom: 12 }}>
              <SearchBox
                id="health-search"
                label={t("list.searchLabel")}
                placeholder={t("list.searchPlaceholder")}
                value={query}
                onChange={(v) => {
                  setQuery(v);
                  setLimit(FIRST_SHOWN);
                }}
              />
            </div>
            {types.length >= 2 && (
              <div style={{ marginBottom: 12 }}>
                <Chips
                  label={t("list.typeAria")}
                  value={typeFilter}
                  onChange={(v) => {
                    setTypeFilter(v);
                    setLimit(FIRST_SHOWN);
                  }}
                  items={[
                    { value: "all", label: t("list.all"), count: places.length },
                    ...types.map((ty) => ({ value: ty, label: ty, count: places.filter((p) => p.type === ty).length })),
                  ]}
                />
              </div>
            )}
            {listed.length === 0 ? (
              <EmptyState title={t("list.noMatch", { query })} body={t("list.noMatchBody")} />
            ) : (
              <>
                <div className="ftp-grid">
                  {shown.map((p) => {
                    const nm = place(p.name, p.nameLocal);
                    const today = todayHours(p);
                    return (
                      <TapCard
                        key={p.id}
                        icon={placeIcon(p)}
                        title={nm.text}
                        titleLang={nm.lang}
                        subtitle={p.type}
                        hint={t("list.open")}
                        onOpen={() => setOpenId(p.id)}
                      >
                        <span style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, lineHeight: 1.5, color: "var(--ftp-text-2)" }}>
                          {p.address && <span style={{ overflowWrap: "anywhere" }}>{p.address}</span>}
                          <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {today && <Pill tone="live">{t("list.today", { hours: today })}</Pill>}
                            {p.phone && <Pill>{t("list.hasPhone")}</Pill>}
                            {(p.services?.length ?? 0) > 0 && <Pill>{t("list.services", { count: p.services?.length ?? 0, n: f.number(p.services?.length ?? 0) })}</Pill>}
                          </span>
                        </span>
                      </TapCard>
                    );
                  })}
                </div>
                <MoreButton shown={shown.length} total={listed.length} label={t("list.showAll", { n: f.number(listed.length) })} onClick={() => setLimit(listed.length)} />
              </>
            )}
          </>
        )}
      </Section>

      {/* 5. Are the doctors' and nurses' posts filled? (nothing without rows) */}
      <StaffingSection module="health" district={district} state={state} />

      {/* 6. Health schemes — national + the state's own. */}
      <Section title={t("schemes.title")}>
        <div className="ftp-grid">
          {schemes.map((s, i) => (
            <Card key={s.id} as="article" tinted={i === 0}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <Pill>{s.tag}</Pill>
                  <h3 className="ftp-title" style={{ fontWeight: 600, marginTop: 6 }}>{s.name}</h3>
                  <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "4px 0 0" }}>{t(`schemes.desc.${s.id}`)}</p>
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, minHeight: 44, fontSize: 14, fontWeight: 600, color: "var(--hue-deep)", textDecoration: "none" }}
                    >
                      {t("schemes.site")} <ExternalLink size={13} aria-hidden />
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* 7. More helplines — each card is a tel: link. */}
      <Section title={t("helplines.title")}>
        <div style={fitGrid(220)}>
          {others.map((h) => {
            const name = t(`helplines.${h.id}`);
            return <HelplineCard key={h.id} number={h.number} name={name} ariaLabel={t("helplines.call", { name, number: h.number })} />;
          })}
        </div>
      </Section>

      <div style={{ marginTop: 24 }}>
        <AIInsightCard module="health" district={district} />
      </div>

      <PageEnd ns="page_health" module="health" locale={locale} state={state} district={district} shareText={t("end.share", { district: districtName })} />

      {/* The sheet: everything about one hospital or health centre. */}
      <DetailSheet
        open={open !== null}
        onClose={() => setOpenId(null)}
        hueClassName={hueClass("health")}
        title={open ? place(open.name, open.nameLocal).text : ""}
        titleLang={open ? place(open.name, open.nameLocal).lang : undefined}
        subtitle={open?.type}
        footer={
          open ? (
            <>
              {open.phone && (
                <ActionLink href={telHref(open.phone)} primary ariaLabel={t("sheet.callAria", { number: open.phone })}>
                  {t("sheet.call")}
                </ActionLink>
              )}
              <ActionLink href={mapsUrl(`${open.name}, ${open.address}`, open.latitude, open.longitude)} primary={!open.phone} newTab>
                {t("sheet.directions")}
              </ActionLink>
              {open.website && (
                <ActionLink href={open.website.startsWith("http") ? open.website : `https://${open.website}`} newTab>
                  {t("sheet.site")}
                </ActionLink>
              )}
            </>
          ) : undefined
        }
      >
        {open && (
          <>
            <SheetNote>
              {todayHours(open) ? t.rich("sheet.today", { hours: todayHours(open) ?? "", b: bNum }) : t("sheet.callFirst")}
            </SheetNote>
            <DetailList
              rows={[
                { label: t("sheet.kind"), value: open.type },
                { label: t("sheet.department"), value: open.department },
                { label: t("sheet.address"), value: open.address },
                {
                  label: t("sheet.phone"),
                  value: open.phone ? (
                    <a href={telHref(open.phone)} className="ftp-num" style={{ color: "var(--hue-deep)", fontWeight: 600 }}>
                      {open.phone}
                    </a>
                  ) : null,
                },
                {
                  label: t("sheet.email"),
                  value: open.email ? (
                    <a href={`mailto:${open.email}`} style={{ color: "var(--hue-deep)" }}>
                      {open.email}
                    </a>
                  ) : null,
                },
                {
                  label: t("sheet.head"),
                  value: open.headName ? (open.headDesignation ? t("sheet.headValue", { name: open.headName, role: open.headDesignation }) : open.headName) : null,
                },
                { label: t("sheet.lunch"), value: open.lunchBreak },
                { label: t("sheet.holidays"), value: open.holidays },
                { label: t("sheet.notes"), value: open.notes },
              ]}
            />
            {(open.services?.length ?? 0) > 0 && (
              <>
                <SheetHeading>{t("sheet.services")}</SheetHeading>
                <TagList items={open.services ?? []} />
              </>
            )}
            {DAY_FIELDS.some((d) => open[d]) && (
              <>
                <SheetHeading>{t("sheet.hours")}</SheetHeading>
                <DetailList
                  rows={DAY_FIELDS.map((d, i) => ({
                    label: i === todayIndex ? t("sheet.dayToday", { day: dayLong[i] }) : dayLong[i],
                    value: open[d] ? <span className="ftp-num">{open[d]}</span> : null,
                  }))}
                />
              </>
            )}
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--ftp-text-2)" }}>{t("sheet.note")}</p>
          </>
        )}
      </DetailSheet>
    </ModulePage>
  );
}

export default function HealthPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("health")}>
      <HealthPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
