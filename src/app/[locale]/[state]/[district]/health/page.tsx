/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Health — Design v4 "Rang" module page (docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  Mostly reference content (helplines, schemes, the kinds of hospitals a
//  district has) plus the sanctioned-vs-filled staffing numbers, which
//  carry their own "as of" date. Phone numbers are real tel: links with
//  44 px tap targets on phones.
//
//  Pictures:
//    1. the staffing section draws ten health workers with the filled
//       share lit, a dial, and the roles with the most empty posts, from
//       the real sanctioned and working counts (nothing without rows);
//    2. "Where to go for care": the public health system as a staircase,
//       from the village sub-centre up to the district hospital. It is a
//       diagram of how referral works, with no numbers in it.
//
//  Text: every sentence comes from the "page_health" messages. Scheme and
//  helpline names that are proper nouns (Ayushman Bharat, iCALL) stay as
//  they are.
"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import { getStateConfig } from "@/lib/constants/state-config";
import ModuleNews from "@/components/district/ModuleNews";
import { use } from "react";
import { useTranslations } from "next-intl";
import { Heart, ExternalLink } from "lucide-react";
import { PageHeader, Section, Card, Pill, ToolbarButton } from "@/components/district/ui";
import StaffingSection from "@/components/district/daily-services/StaffingSection";
import { ModulePage, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { useDistrictName } from "@/components/district/daily-services/district-name";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { useModuleText, usePlaceText } from "@/i18n/client";

// Static health helplines for India — national numbers only.
// `urgent` marks the life-safety numbers, shown in the danger colour.
const HELPLINES = [
  { id: "emergency", number: "112", urgent: true, emoji: "🆘" },
  { id: "ambulance", number: "108", urgent: true, emoji: "🚑" },
  { id: "icall", number: "9152987821", emoji: "💬" },
  { id: "poison", number: "1800-116-117", emoji: "🧪" },
  { id: "ayushman", number: "14555", emoji: "🪪" },
  { id: "nhh", number: "1800-180-1104", emoji: "📞" },
];

/** A scheme card: `name` is the official name (not translated), `id` keys its description. */
interface HealthScheme {
  id: string;
  name: string;
  url: string | null;
}

// National schemes — shown in every district.
const NATIONAL_SCHEMES: HealthScheme[] = [
  { id: "pmjay", name: "Ayushman Bharat PM-JAY", url: "https://pmjay.gov.in" },
  { id: "jsy", name: "Janani Suraksha Yojana", url: null },
  { id: "rbsk", name: "RBSK (Rashtriya Bal Swasthya Karyakram)", url: null },
];

// State schemes — keyed by state slug; the description key is the slug.
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

/** Small emoji chip used on helpline cards and scheme cards. */
function EmojiChip({ emoji, size = 36 }: { emoji: string; size?: number }) {
  return (
    <span
      className="ftp-icon-chip ftp-emoji"
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size / 2), borderRadius: Math.round(size / 3) }}
    >
      {emoji}
    </span>
  );
}

function HealthPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_health");
  const tUnit = useTranslations("subUnitOne");
  const mt = useModuleText();
  const place = usePlaceText();
  const districtName = useDistrictName(state, district);
  const base = `/${locale}/${state}/${district}`;

  const stateScheme = STATE_HEALTH_SCHEMES[state];
  const schemes = [
    ...NATIONAL_SCHEMES.map((s) => ({ ...s, tag: t("schemes.central") })),
    ...(stateScheme ? [{ ...stateScheme, tag: t("schemes.stateScheme", { state: place.state(state) }) }] : []),
  ];

  // The care staircase: village → district, with the state's own name
  // for the middle hospitals and for its sub-district unit.
  const config = getStateConfig(state);
  const subLabelEn = config?.healthSubLabel ?? "Taluk Hospitals";
  const subKey = SUB_HOSPITAL_KEY[subLabelEn];
  const unitEn = config?.subDistrictUnit ?? "Taluk";
  const unit = tUnit.has(unitEn) ? tUnit(unitEn) : unitEn;
  const steps = [
    { key: "subCentre", emoji: "🏡", title: t("care.subCentre"), desc: t("care.subCentreDesc") },
    { key: "phc", emoji: "🩺", title: t("care.phc"), desc: t("care.phcDesc") },
    { key: "sub", emoji: "🏨", title: subKey ? t(`care.sub.${subKey}`) : subLabelEn, desc: t("care.subDesc", { unit }) },
    { key: "district", emoji: "🏥", title: t("care.district"), desc: t("care.districtDesc") },
  ];

  return (
    <ModulePage>
      <PageHeader
        icon={Heart}
        title={t("title")}
        description={t("description")}
        backHref={base}
        accent={getModuleAccent("health")}
      />

      <AIInsightCard module="health" district={district} />

      {/* Sanctioned vs. filled staffing, with the page's picture
          (renders nothing when there is no data). */}
      <StaffingSection module="health" district={district} state={state} emoji="🩺" personEmoji="🧑‍⚕️" picture />

      {/* Emergency helplines — each card is a tel: link. */}
      <Section title={t("helplines.title")} emoji="🚑">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {HELPLINES.map((h) => {
            const name = t(`helplines.${h.id}`);
            return (
              <a
                key={h.id}
                href={`tel:${h.number}`}
                className="ftp-card-link"
                aria-label={t("helplines.call", { name, number: h.number })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  minHeight: 44,
                  padding: "12px 14px",
                  background: h.urgent
                    ? "linear-gradient(135deg, color-mix(in srgb, var(--hue) 8%, #fff) 0%, #fff 72%)"
                    : "var(--ftp-surface)",
                  border: h.urgent
                    ? "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))"
                    : "1px solid var(--ftp-border)",
                  borderRadius: "var(--ftp-radius-card)",
                  boxShadow: "var(--ftp-shadow-1)",
                  textDecoration: "none",
                }}
              >
                <EmojiChip emoji={h.emoji} />
                <div style={{ minWidth: 0 }}>
                  <div className="ftp-num" style={{ fontSize: 18, lineHeight: "24px", color: h.urgent ? "var(--ftp-danger)" : "var(--hue-deep)" }}>
                    {h.number}
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)" }}>{name}</div>
                </div>
              </a>
            );
          })}
        </div>
      </Section>

      {/* Where to go for care: the public health system as a staircase. */}
      <Section title={t("care.title")} emoji="🪜">
        <Card tinted padding={18}>
          <p className="ftp-body" style={{ margin: "0 0 16px", color: "var(--ftp-text-2)", maxWidth: 680 }}>
            {t("care.hint")}
          </p>
          <ol
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 14,
            }}
          >
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
                    <span className="ftp-emoji" style={{ fontSize: 30 }}>
                      {s.emoji}
                    </span>
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
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              marginTop: 18,
              paddingTop: 14,
              borderTop: "1px dashed color-mix(in srgb, var(--hue) 30%, var(--ftp-border))",
            }}
          >
            <EmojiChip emoji="🏢" size={32} />
            <div style={{ minWidth: 0 }}>
              <div className="ftp-title" style={{ fontSize: 14, lineHeight: 1.45, fontWeight: 600 }}>{t("care.private")}</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ftp-text-2)" }}>{t("care.privateDesc")}</div>
            </div>
          </div>
        </Card>
      </Section>

      {/* Health schemes — national + state-specific. */}
      <Section title={t("schemes.title")} emoji="🛡️">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {schemes.map((s, i) => (
            <Card key={s.id} as="article" tinted={i === 0}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <EmojiChip emoji={s.id === "jsy" ? "🤱" : s.id === "rbsk" ? "🧒" : "🛡️"} size={36} />
                <div style={{ minWidth: 0 }}>
                  <Pill>{s.tag}</Pill>
                  <h3 className="ftp-title" style={{ fontWeight: 600, marginTop: 6 }}>{s.name}</h3>
                  <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "4px 0 0" }}>{t(`schemes.desc.${s.id}`)}</p>
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, minHeight: 32, marginTop: 8, fontSize: 13, fontWeight: 600, color: "var(--hue-deep)", textDecoration: "none" }}
                    >
                      {t("schemes.site")} <ExternalLink size={12} aria-hidden />
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Find a hospital on the NHM portal. */}
      <Card tinted style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <EmojiChip emoji="📍" />
          <div style={{ minWidth: 0 }}>
            <div className="ftp-title" style={{ fontWeight: 600 }}>{t("nhm.title")}</div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ftp-text-2)" }}>{t("nhm.body")}</div>
          </div>
        </div>
        <ToolbarButton icon={ExternalLink} href="https://nhm.gov.in" external>
          {t("nhm.button")}
        </ToolbarButton>
      </Card>

      <ModuleSources module="health" state={state} />
      <ModuleNews district={district} state={state} locale={locale} module="health" />
      <ModuleToolbar
        locale={locale}
        district={district}
        moduleSlug="health"
        moduleLabel={mt.label("health")}
        shareText={t("share", { district: districtName })}
      />
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
