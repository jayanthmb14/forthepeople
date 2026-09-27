/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// File RTI page — Design v4 "Rang" module recipe (see the finance page).
// A citizen picks a topic, sees the ready-made RTI application (English +
// local language when we have it), copies it and files it online.
//   PageHeader → "In simple words" card with the three steps → topic list
//   (an emoji chip per topic) → the chosen application → "after you file"
//   timeline (the time limits in the RTI Act) → sources.
// Templates come from useRTI() → data.templates (only `active` ones shown).
// Every word on the page comes from src/dictionaries/<locale>/page_file-rti.json;
// the letters themselves are shown as the office published them.

"use client";
import type React from "react";
import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Copy, Check, ExternalLink } from "lucide-react";
import { useRTI } from "@/hooks/useRealtimeData";
import { PageHeader, Section, Card, Pill, LoadingShell, ErrorBlock, EmptyState, SourcePill } from "@/components/district/ui";
import { Explainer } from "@/components/district/visuals";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { getDistrict } from "@/lib/constants/districts";
import { getStateConfig } from "@/lib/constants/state-config";
import { useModuleText } from "@/i18n/client";
import { scriptLang } from "@/lib/utils/script-lang";

/** Page wrapper: the container (24 px sides, 16 on phones) at reading width. */
const PAGE_STYLE: React.CSSProperties = { paddingTop: 24, paddingBottom: 32, maxWidth: "var(--ftp-reading-max)" };

/** Shared 44 px button shape (easy to tap on phones). Colours come from the
    .ftp-btn-primary / .ftp-btn-secondary classes so hover works. */
const BUTTON_BASE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  minHeight: 44,
  padding: "0 16px",
  borderRadius: "var(--ftp-radius-tile)",
  borderWidth: 1,
  borderStyle: "solid",
  fontFamily: "var(--ftp-font-sans)",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  textDecoration: "none",
};

/** The quiet (bordered) button: surface background, text colour. */
const BUTTON_SECONDARY: React.CSSProperties = {
  ...BUTTON_BASE,
  borderColor: "var(--ftp-border)",
  background: "var(--ftp-surface)",
  color: "var(--ftp-text)",
};

const RTI_ONLINE = "https://rtionline.gov.in";

/** Bold text inside translated sentences (t.rich "<b>…</b>"). */
const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

/** Small sentence-case label above a block (12 px, text-2). */
function BlockLabel({ children }: { children: React.ReactNode }) {
  return <div className="ftp-label" style={{ marginBottom: 4 }}>{children}</div>;
}

/**
 * An emoji for a letter's topic, picked from words in its English topic and
 * office name (the templates are stored in English). First match wins.
 */
const TOPIC_EMOJI: Array<[RegExp, string]> = [
  [/metro|rail/i, "🚇"],
  [/police|fir\b|crime/i, "👮"],
  [/dam\b|cauvery|reservoir/i, "🌊"],
  [/drain|waterlogging|storm/i, "🌧️"],
  [/water|jal\b|wssb/i, "🚰"],
  [/electric|power|bescom|uppcl|tgspdcl|discom/i, "💡"],
  [/road|pothole|pwd|highway/i, "🛣️"],
  [/tender|contractor/i, "📑"],
  [/tax/i, "🧾"],
  [/building|construction|plan approval|permission/i, "🏗️"],
  [/housing|allotment|awas|pmay/i, "🏠"],
  [/land|7\/12|record|survey/i, "🗺️"],
  [/school|education/i, "🏫"],
  [/hospital|health/i, "🏥"],
  [/forest|eco/i, "🌳"],
  [/heritage|palace/i, "🏛️"],
  [/sugar|farmer|crop|agri/i, "🌾"],
  [/ration|pds/i, "🍚"],
  [/pension/i, "👵"],
  [/budget|expenditure|fund|payment|smart city/i, "💰"],
];

function topicEmoji(topic: string, department: string): string {
  const text = `${topic} ${department}`;
  return TOPIC_EMOJI.find(([re]) => re.test(text))?.[1] ?? "📄";
}

/** The three steps of filing an RTI — a real sequence, so it is numbered. */
const STEPS: Array<{ emoji: string; key: "stepPick" | "stepCopy" | "stepFile" }> = [
  { emoji: "👆", key: "stepPick" },
  { emoji: "📋", key: "stepCopy" },
  { emoji: "📮", key: "stepFile" },
];

function RtiSteps() {
  const t = useTranslations("page_file-rti");
  return (
    <ol
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))",
        gap: 10,
      }}
    >
      {STEPS.map((s, i) => (
        <li
          key={s.key}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: "var(--ftp-radius-tile)",
            background: "var(--ftp-surface)",
            border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
          }}
        >
          <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 34, height: 34, fontSize: 18, borderRadius: 11 }}>
            {s.emoji}
          </span>
          <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span className="ftp-num" style={{ fontSize: 12, lineHeight: "16px", color: "var(--hue-deep)" }}>
              {t("stepN", { n: i + 1 })}
            </span>
            <span style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)" }}>{t(s.key)}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * After you file — the four time limits in the RTI Act, 2005 (sections 7
 * and 19). Law, not data, so it holds no district numbers.
 */
function AfterYouFile({ commission, commissionUrl }: { commission: string; commissionUrl: string | null }) {
  const t = useTranslations("page_file-rti");
  const stages: Array<{ emoji: string; when: string; title: string; body: React.ReactNode }> = [
    { emoji: "📮", when: t("tl1When"), title: t("tl1Title"), body: t("tl1Body") },
    { emoji: "📬", when: t("tl2When"), title: t("tl2Title"), body: t("tl2Body") },
    { emoji: "🧑‍⚖️", when: t("tl3When"), title: t("tl3Title"), body: t("tl3Body") },
    { emoji: "🏛️", when: t("tl4When"), title: t("tl4Title"), body: t.rich("tl4Body", { commission, b: bold }) },
  ];
  return (
    <Section title={t("timelineTitle")} emoji="⏱️">
      <Card tinted padding={18}>
        <p className="ftp-body" style={{ margin: "0 0 14px", fontSize: 14, lineHeight: "21px" }}>
          <span aria-hidden>👉 </span>
          {t("timelineSimple")}
        </p>
        <ol
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 185px), 1fr))",
            gap: 12,
          }}
        >
          {stages.map((s, i) => (
            <li
              key={s.title}
              className="ftp-pop"
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: "14px 14px 16px",
                borderRadius: "var(--ftp-radius-tile)",
                background: "var(--ftp-surface)",
                border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
                boxShadow: "var(--ftp-shadow-1)",
                ["--i" as string]: i,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  className="ftp-icon-chip ftp-emoji"
                  aria-hidden
                  style={{ width: 40, height: 40, fontSize: 21, borderRadius: 13 }}
                >
                  {s.emoji}
                </span>
                <span className="ftp-num" style={{ fontSize: 12, lineHeight: "16px", color: "var(--hue-deep)" }}>
                  {t("stepN", { n: i + 1 })}
                </span>
              </div>
              <span
                style={{
                  alignSelf: "flex-start",
                  padding: "2px 10px",
                  borderRadius: 999,
                  background: i === 0 ? "var(--hue-tint)" : "linear-gradient(90deg, var(--hue), var(--hue-deep))",
                  color: i === 0 ? "var(--hue-deep)" : "#fff",
                  fontSize: 12,
                  lineHeight: "18px",
                  fontWeight: 600,
                }}
              >
                {s.when}
              </span>
              <span className="ftp-display" style={{ fontSize: 16, lineHeight: "22px", fontWeight: 600, color: "var(--ftp-text)" }}>
                {s.title}
              </span>
              <span className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{s.body}</span>
            </li>
          ))}
        </ol>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          <SourcePill label={t("actSource")} href="https://rti.gov.in" />
          {commissionUrl && <SourcePill label={commission} href={commissionUrl} />}
        </div>
      </Card>
    </Section>
  );
}

export default function FileRTIPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_file-rti");
  const mt = useModuleText();
  const base = `/${locale}/${state}/${district}`;
  const districtInfo = getDistrict(state, district);
  // In sentences, use the district's local name when the page is in its language.
  const districtName =
    districtInfo?.nameLocal && scriptLang(districtInfo.nameLocal) === locale
      ? districtInfo.nameLocal
      : districtInfo?.name ?? district.replace(/-/g, " ");
  const stateConfig = getStateConfig(state);
  const commission = stateConfig?.stateInformationCommission ?? t("stateCommission");
  const { data, isLoading, error } = useRTI(district, state);
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const templates = (data?.data?.templates ?? []).filter((tpl) => tpl.active);
  const selectedTpl = templates.find((tpl) => tpl.id === selected);

  const handleCopy = () => {
    if (!selectedTpl) return;
    navigator.clipboard
      .writeText(selectedTpl.templateText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setCopied(false));
  };

  // The local-language heading: Kannada for Karnataka (where the templates
  // were written), a neutral phrase elsewhere. Never machine-translated.
  const localHeading = state === "karnataka" ? t("inKannada") : t("inLocalLanguage");

  const fileOnline = (
    <a href={RTI_ONLINE} target="_blank" rel="noopener noreferrer" className="ftp-btn ftp-btn-secondary" style={BUTTON_SECONDARY}>
      {t("fileOnline")} <ExternalLink size={12} aria-hidden />
    </a>
  );

  return (
    <div className="ftp-container" style={PAGE_STYLE}>
      <PageHeader
        icon={FileText}
        title={mt.label("file-rti")}
        description={mt.description("file-rti")}
        backHref={base}
        accent={getModuleAccent("file-rti")}
        source={{ label: "rtionline.gov.in", href: RTI_ONLINE }}
      />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && templates.length === 0 && (
        <EmptyState emoji="📜" title={t("emptyTitle", { district: districtName })} body={t("emptyBody")} action={fileOnline} />
      )}

      {/* The picture: what an RTI is, and the three steps on this page. The
          count is the number of ready-made letters we actually hold. */}
      {!isLoading && templates.length > 0 && (
        <Card tinted padding={18} style={{ marginBottom: 8 }}>
          <Explainer emoji="📜">{t.rich("explain", { n: templates.length, district: districtName, b: bold })}</Explainer>
          <RtiSteps />
        </Card>
      )}

      {!isLoading && templates.length > 0 && (
        // One column on phones; two side by side once a template is open on wider screens.
        <div
          style={{
            display: "grid",
            gridTemplateColumns: selected ? "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" : "1fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* Template list */}
          <Section title={t("chooseTopic")} emoji="🗂️">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {templates.map((tpl) => {
                const isActive = selected === tpl.id;
                const fee = String(tpl.feeAmount ?? "").replace(/^\s*(₹|Rs\.?)\s*/i, "") || "0";
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setSelected(tpl.id === selected ? null : tpl.id)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "12px 14px",
                      minHeight: 44,
                      borderRadius: "var(--ftp-radius-card)",
                      textAlign: "left",
                      cursor: "pointer",
                      background: isActive ? "linear-gradient(135deg, var(--hue-tint) 0%, var(--ftp-surface) 85%)" : "var(--ftp-surface)",
                      border: `1px solid ${isActive ? "var(--hue)" : "var(--ftp-border)"}`,
                      boxShadow: isActive ? "inset 3px 0 0 var(--hue), var(--ftp-shadow-1)" : "var(--ftp-shadow-1)",
                      color: "var(--ftp-text)",
                      fontFamily: "var(--ftp-font-sans)",
                      transition: "background-color 150ms ease, border-color 150ms ease",
                    }}
                  >
                    <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 38, height: 38, fontSize: 20, borderRadius: 12 }}>
                      {topicEmoji(tpl.topic, tpl.department)}
                    </span>
                    <span style={{ display: "block", minWidth: 0 }}>
                      <span className="ftp-title" style={{ display: "block" }}>{tpl.topic}</span>
                      {tpl.topicLocal && (
                        <span
                          lang={scriptLang(tpl.topicLocal)}
                          style={{ display: "block", fontSize: 13, lineHeight: "20px", color: "var(--hue-deep)", fontFamily: "var(--font-regional)" }}
                        >
                          {tpl.topicLocal}
                        </span>
                      )}
                      <span className="ftp-body" style={{ display: "block", color: "var(--ftp-text-2)", marginTop: 2 }}>
                        {t("pio", { department: tpl.department })}
                      </span>
                      <span style={{ display: "block", marginTop: 6 }}>
                        <Pill style={{ background: "var(--hue-tint)", color: "var(--hue-deep)" }}>
                          {t("fee", { fee: `₹${fee}` })}
                        </Pill>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Selected template */}
          {selectedTpl && (
            <Section title={t("yourApplication")} emoji="📝">
              <Card tinted>
                <div style={{ marginBottom: 12 }}>
                  <BlockLabel>{t("to")}</BlockLabel>
                  <div className="ftp-body" style={{ whiteSpace: "pre-line" }}>
                    {selectedTpl.pioName && `${selectedTpl.pioName},\n`}
                    {selectedTpl.pioAddress}
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <BlockLabel>{t("applicationText")}</BlockLabel>
                  <div
                    lang={scriptLang(selectedTpl.templateText) ?? "en"}
                    style={{
                      background: "var(--ftp-surface)",
                      border: "1px solid color-mix(in srgb, var(--hue) 18%, var(--ftp-border))",
                      borderRadius: "var(--ftp-radius-tile)",
                      padding: 12,
                      fontFamily: "var(--ftp-font-sans)",
                      fontSize: 13,
                      lineHeight: "22px",
                      fontWeight: 400,
                      color: "var(--ftp-text)",
                      whiteSpace: "pre-wrap",
                      maxHeight: 280,
                      overflowY: "auto",
                    }}
                  >
                    {selectedTpl.templateText}
                  </div>
                </div>

                {selectedTpl.templateTextLocal && (
                  <div style={{ marginBottom: 12 }}>
                    <BlockLabel>{localHeading}</BlockLabel>
                    <div
                      lang={scriptLang(selectedTpl.templateTextLocal)}
                      style={{
                        background: "var(--ftp-surface)",
                        border: "1px solid color-mix(in srgb, var(--hue) 18%, var(--ftp-border))",
                        borderRadius: "var(--ftp-radius-tile)",
                        padding: 12,
                        fontSize: 13,
                        lineHeight: "22px",
                        color: "var(--ftp-text)",
                        fontFamily: "var(--font-regional)",
                        maxHeight: 160,
                        overflowY: "auto",
                      }}
                    >
                      {selectedTpl.templateTextLocal}
                    </div>
                  </div>
                )}

                {/* Tip */}
                {selectedTpl.tips && (
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
                    <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 28, height: 28, fontSize: 15, borderRadius: 9 }}>
                      💡
                    </span>
                    <div>
                      <BlockLabel>{t("tip")}</BlockLabel>
                      <div className="ftp-body">{selectedTpl.tips}</div>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" onClick={handleCopy} className="ftp-btn ftp-btn-primary" style={{ ...BUTTON_BASE, color: "var(--ftp-surface)" }}>
                    {copied ? (
                      <>
                        <Check size={14} aria-hidden /> {t("copied")}
                      </>
                    ) : (
                      <>
                        <Copy size={14} aria-hidden /> {t("copyText")}
                      </>
                    )}
                  </button>
                  {fileOnline}
                </div>
                <p aria-live="polite" className="sr-only">
                  {copied ? t("copiedLive") : ""}
                </p>
              </Card>
            </Section>
          )}
        </div>
      )}

      {/* What happens after filing — shown whenever the page has loaded,
          because the time limits apply to every RTI, templated or not. */}
      {!isLoading && <AfterYouFile commission={commission} commissionUrl={stateConfig?.rtiPortalUrl ?? null} />}

      <ModulePageFooter
        moduleSlug="rti"
        locale={locale}
        state={state}
        district={district}
        showCompare={false}
        sourceUrls={{ "RTI Online Portal": RTI_ONLINE }}
      />
    </div>
  );
}
