/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Ask the government (File RTI) — a three-step wizard
// ═══════════════════════════════════════════════════════════════════════
//  The question: "How do I ask a government office for information, and
//  when must it answer?"
//
//    PageHeader → Explainer (what an RTI is, 30 days, how many ready
//    letters we hold) → 4 StatTiles (ready letters, fee, 30 days, free for
//    BPL) → the wizard:
//      1 Pick a topic   ready-made letters as tap cards, plus "write my own"
//      2 Copy the letter  the PIO's address, the letter (and the same letter
//                         in the local language), a tip, Copy
//      3 Send it        by post / by hand, or online (RTI Online is for
//                       central government offices)
//    → ONE picture: "after you send it" — the four time limits in the RTI
//      Act as numbered steps, plus "when did you send it?" → the reply and
//      appeal dates on a countdown (worked out in the browser, never sent)
//    → Share. No emoji. The RTI replies tracker is linked by the layout's
//    "See also"; sources are in its verification panel.
//
//  Templates: useRTI() → data.templates (active ones only). The letters are
//  shown as the office published them; the "write my own" letter is in the
//  reader's language (an RTI may be written in English, Hindi or the
//  official language of the area: RTI Act, section 6(1)).
//  Words: src/dictionaries/<locale>/page_file-rti.json.
"use client";

import type React from "react";
import { use, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FilePen, Copy, Check, PenLine } from "lucide-react";
import { useRTI, type RtiTemplate } from "@/hooks/useRealtimeData";
import { ModulePage, PageHeader, StatStrip, StatTile, Section, Card, LoadingShell, ErrorBlock, SourcePill } from "@/components/district/ui";
import { CountdownBar, Explainer } from "@/components/district/visuals";
import { CardChip, CardList, SheetAction } from "@/components/accountability/AccountabilityKit";
import { TapCard } from "@/components/services-1/kit";
import { PageActions } from "@/components/district/page-kit";
import { getStateConfig } from "@/lib/constants/state-config";
import { getLanguage } from "@/i18n/languages";
import { useDistrictName, useFormat, useModuleText } from "@/i18n/client";
import { scriptLang } from "@/lib/utils/script-lang";

const RTI_ONLINE = "https://rtionline.gov.in";
const RTI_ACT = "https://rti.gov.in";
const DAY = 86_400_000;
/** Section 7(1): reply within 30 days. Section 19(1): first appeal within 30 days after that. */
const REPLY_DAYS = 30;
const APPEAL_DAYS = 30;
/** The "write my own" choice in step 1. */
const OWN = "__own__";

type Step = 1 | 2 | 3;

const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

/** "₹10", "Rs. 10", "10" → "10". */
function feeNumber(fee: string | null | undefined): string {
  return String(fee ?? "").replace(/^\s*(₹|Rs\.?|INR)\s*/i, "").trim() || "0";
}

/** The wizard's progress bar: three numbered steps; later ones unlock after step 1. */
function Stepper({ step, canGo, onGo }: { step: Step; canGo: boolean; onGo: (s: Step) => void }) {
  const t = useTranslations("page_file-rti");
  const items: Array<{ n: Step; label: string }> = [
    { n: 1, label: t("stepPick") },
    { n: 2, label: t("stepCopy") },
    { n: 3, label: t("stepSend") },
  ];
  return (
    <ol
      aria-label={t("stepsAria")}
      style={{ listStyle: "none", margin: "0 0 18px", padding: 0, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}
    >
      {items.map((it) => {
        const current = it.n === step;
        const done = it.n < step;
        const enabled = it.n === 1 || canGo;
        return (
          <li key={it.n} style={{ minWidth: 0 }}>
            <button
              type="button"
              disabled={!enabled}
              aria-current={current ? "step" : undefined}
              onClick={() => onGo(it.n)}
              style={{
                width: "100%",
                minHeight: 56,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                padding: "8px 6px",
                borderRadius: 14,
                border: `1px solid ${current ? "var(--hue)" : "color-mix(in srgb, var(--hue) 20%, var(--ftp-border))"}`,
                background: current ? "var(--hue)" : done ? "var(--hue-tint)" : "var(--ftp-surface)",
                color: current ? "#fff" : enabled ? "var(--hue-deep)" : "var(--ftp-text-2)",
                cursor: enabled ? "pointer" : "not-allowed",
                opacity: enabled ? 1 : 0.6,
                font: "inherit",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, lineHeight: "16px", fontWeight: 700 }}>
                {done && <Check size={13} aria-hidden />}
                {t("stepN", { n: it.n })}
              </span>
              <span style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, textAlign: "center" }}>{it.label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** What happens after you send it: numbered steps in a row (a column on phones). */
function Steps({ steps }: { steps: Array<{ title: React.ReactNode; body?: React.ReactNode }> }) {
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(150px, 100%), 1fr))" }}>
      {steps.map((st, i) => (
        <li
          key={i}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            padding: 12,
            borderRadius: 14,
            background: "var(--ftp-surface)",
            border: "1px solid var(--ftp-border)",
          }}
        >
          <span
            aria-hidden
            className="ftp-num"
            style={{ width: 24, height: 24, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--hue)", color: "#fff", fontSize: 12, fontWeight: 700 }}
          >
            {i + 1}
          </span>
          <span style={{ fontWeight: 650, fontSize: 14, lineHeight: "20px", color: "var(--hue-deep)" }}>{st.title}</span>
          {st.body && <span style={{ fontSize: 13, lineHeight: "19px", color: "var(--ftp-text-2)" }}>{st.body}</span>}
        </li>
      ))}
    </ol>
  );
}

/** A labelled text box for a letter (scrolls when long). */
function LetterBox({ label, text, lang }: { label: string; text: string; lang?: string }) {
  return (
    <div>
      <p className="ftp-label" style={{ marginBottom: 6 }}>
        {label}
      </p>
      <div
        lang={lang}
        tabIndex={0}
        style={{
          background: "var(--ftp-surface)",
          border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
          borderRadius: 12,
          padding: 14,
          fontSize: 15,
          lineHeight: 1.7,
          color: "var(--ftp-text)",
          whiteSpace: "pre-wrap",
          maxHeight: 320,
          overflowY: "auto",
          overflowWrap: "anywhere",
        }}
      >
        {text}
      </div>
    </div>
  );
}

export default function FileRTIPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_file-rti");
  const ta = useTranslations("page_accountability");
  const f = useFormat();
  const mt = useModuleText();
  const districtName = useDistrictName(state, district);
  const base = `/${locale}/${state}/${district}`;
  const stateConfig = getStateConfig(state, district);
  const commission = stateConfig?.stateInformationCommission ?? t("stateCommission");
  const { data, isLoading, error } = useRTI(district, state);
  const [step, setStep] = useState<Step>(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sentOn, setSentOn] = useState("");
  const wizardRef = useRef<HTMLDivElement>(null);

  const templates = (data?.data?.templates ?? []).filter((tpl) => tpl.active);
  const tpl: RtiTemplate | null = selected && selected !== OWN ? templates.find((x) => x.id === selected) ?? null : null;
  const own = selected === OWN;
  const fees = templates.map((x) => Number(feeNumber(x.feeAmount))).filter((n) => Number.isFinite(n) && n > 0);
  const minFee = fees.length > 0 ? Math.min(...fees) : null;
  const maxFee = fees.length > 0 ? Math.max(...fees) : null;

  // The letter the reader will copy.
  const ownLetter = t("ownLetter");
  const letter = tpl ? tpl.templateText : own ? ownLetter : "";
  const localLetter = tpl?.templateTextLocal ?? null;
  const localLang = scriptLang(localLetter);

  const goTo = (s: Step) => {
    setStep(s);
    setCopied(false);
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    wizardRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };
  const pick = (id: string) => {
    setSelected(id);
    goTo(2);
  };
  const copy = () => {
    if (!letter) return;
    navigator.clipboard
      .writeText(letter)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => setCopied(false));
  };

  // "When did you send it?" → the reply and first-appeal dates.
  const sent = sentOn ? new Date(`${sentOn}T00:00:00+05:30`) : null;
  const validSent = sent && !Number.isNaN(sent.getTime()) ? sent : null;
  const replyBy = validSent ? new Date(validSent.getTime() + REPLY_DAYS * DAY) : null;
  const appealBy = replyBy ? new Date(replyBy.getTime() + APPEAL_DAYS * DAY) : null;
  const longDate = (d: Date) => f.date(d, { day: "numeric", month: "long", year: "numeric" });

  const timeline = [
    { title: t("tl1Title"), body: t("tl1Body") },
    { title: t("tl2Title"), body: t("tl2Body") },
    { title: t("tl3Title"), body: t("tl3Body") },
    { title: t("tl4Title"), body: t.rich("tl4Body", { commission, b: bold }) },
  ];

  const pioLine = tpl ? [tpl.pioName, tpl.pioAddress].filter(Boolean).join(",\n") : null;

  return (
    <ModulePage>
      <PageHeader
        icon={FilePen}
        title={mt.label("file-rti")}
        description={mt.description("file-rti")}
        backHref={base}
        source={{ label: t("actSource"), href: RTI_ACT }}
      />

      <Explainer>
        {t("explain")}{" "}
        {templates.length > 0
          ? t.rich("explainLetters", { n: templates.length, district: districtName, b: bold })
          : t("explainOwn")}
      </Explainer>

      <StatStrip>
        {templates.length > 0 && <StatTile label={t("tileLetters")} value={f.number(templates.length)} sub={t("tileLettersSub", { district: districtName })} />}
        {minFee !== null && maxFee !== null && (
          <StatTile
            label={t("tileFee")}
            value={minFee === maxFee ? `₹${f.number(minFee)}` : `₹${f.number(minFee)}–${f.number(maxFee)}`}
            sub={t("tileFeeSub")}
            countUp={false}
          />
        )}
        <StatTile label={t("tileReply")} value={f.number(REPLY_DAYS)} unit={t("daysUnit")} sub={t("tileReplySub")} />
        <StatTile label={t("tileBpl")} value={t("tileBplValue")} sub={t("tileBplSub")} countUp={false} />
      </StatStrip>

      {/* The wizard. */}
      <div ref={wizardRef} style={{ scrollMarginTop: 80 }}>
        <Section title={t("wizardTitle")}>
          <Card tinted padding={18}>
            <Stepper step={step} canGo={selected !== null} onGo={goTo} />

            {step === 1 && (
              <div>
                <h3 className="ftp-display" style={{ margin: "0 0 4px", fontSize: 19, lineHeight: 1.35, fontWeight: 650 }}>
                  {t("pickTitle")}
                </h3>
                <p className="ftp-body" style={{ margin: "0 0 14px", color: "var(--ftp-text-2)", fontSize: 14 }}>
                  {t("pickHint")}
                </p>
                {isLoading && <LoadingShell rows={3} />}
                {error && <ErrorBlock />}
                {!isLoading && (
                  <CardList label={t("pickTitle")} min={240}>
                    {templates.map((x) => (
                      <li key={x.id} style={{ listStyle: "none", minWidth: 0, display: "flex" }}>
                        <TapCard
                          title={x.topic}
                          titleLang="en"
                          subtitle={x.topicLocal ? <span lang={scriptLang(x.topicLocal)}>{x.topicLocal}</span> : x.department}
                          hint={ta("seeDetails")}
                          onOpen={() => pick(x.id)}
                        >
                          <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {x.topicLocal && <CardChip>{x.department}</CardChip>}
                            <CardChip>{t("fee", { fee: `₹${feeNumber(x.feeAmount)}` })}</CardChip>
                          </span>
                        </TapCard>
                      </li>
                    ))}
                    <li style={{ listStyle: "none", minWidth: 0, display: "flex" }}>
                      <TapCard icon={PenLine} title={t("ownTitle")} subtitle={t("ownSub")} hint={ta("seeDetails")} onOpen={() => pick(OWN)} />
                    </li>
                  </CardList>
                )}
              </div>
            )}

            {step === 2 && (tpl || own) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h3 className="ftp-display" style={{ margin: 0, fontSize: 19, lineHeight: 1.35, fontWeight: 650 }}>
                  {tpl ? t("letterTitle", { topic: tpl.topic }) : t("ownLetterTitle")}
                </h3>
                {pioLine && (
                  <div>
                    <p className="ftp-label" style={{ marginBottom: 6 }}>
                      {t("to")}
                    </p>
                    <p lang="en" style={{ margin: 0, fontSize: 15, lineHeight: 1.6, whiteSpace: "pre-line" }}>
                      {pioLine}
                    </p>
                  </div>
                )}
                {own && (
                  <p className="ftp-body" style={{ fontSize: 14, lineHeight: 1.6 }}>
                    {t("ownHow")}
                  </p>
                )}
                <LetterBox label={t("applicationText")} text={letter} lang={tpl ? scriptLang(letter) ?? "en" : undefined} />
                {localLetter && (
                  <LetterBox label={t("inLanguage", { language: getLanguage(localLang).native })} text={localLetter} lang={localLang} />
                )}
                {tpl?.tips && (
                  <p style={{ margin: 0, display: "flex", gap: 10, fontSize: 14, lineHeight: 1.6 }}>
                    <span>
                      <strong>{t("tip")}: </strong>
                      <span lang="en">{tpl.tips}</span>
                    </span>
                  </p>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={copy}
                    className="ftp-btn-primary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      minHeight: 48,
                      padding: "0 18px",
                      flex: "1 1 180px",
                      borderRadius: 12,
                      border: "1px solid var(--hue)",
                      color: "#fff",
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "var(--ftp-font-sans)",
                    }}
                  >
                    {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
                    {copied ? t("copied") : t("copyText")}
                  </button>
                  <SheetAction onClick={() => goTo(3)} quiet>
                    {t("nextSend")}
                  </SheetAction>
                </div>
                <p aria-live="polite" className="sr-only">
                  {copied ? t("copiedLive") : ""}
                </p>
                <button
                  type="button"
                  onClick={() => goTo(1)}
                  style={{ alignSelf: "flex-start", minHeight: 44, background: "none", border: 0, padding: 0, color: "var(--hue-deep)", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "var(--ftp-font-sans)" }}
                >
                  ← {t("backToTopics")}
                </button>
              </div>
            )}

            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h3 className="ftp-display" style={{ margin: 0, fontSize: 19, lineHeight: 1.35, fontWeight: 650 }}>
                  {t("sendTitle")}
                </h3>
                <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "280px" } as React.CSSProperties}>
                  <Card padding={16}>
                    <p className="ftp-display" style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 650 }}>
                      {t("postTitle")}
                    </p>
                    <p className="ftp-body" style={{ margin: "0 0 10px", color: "var(--ftp-text-2)", fontSize: 14 }}>
                      {t("postWho")}
                    </p>
                    <ol style={{ margin: 0, paddingInlineStart: 20, display: "flex", flexDirection: "column", gap: 6, fontSize: 14, lineHeight: 1.6 }}>
                      <li>{t("post1")}</li>
                      <li>{tpl ? t("post2Fee", { fee: `₹${feeNumber(tpl.feeAmount)}` }) : t("post2")}</li>
                      <li>{t("post3")}</li>
                      <li>{t("post4")}</li>
                    </ol>
                  </Card>
                  <Card padding={16}>
                    <p className="ftp-display" style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 650 }}>
                      {t("onlineTitle")}
                    </p>
                    <p className="ftp-body" style={{ margin: "0 0 12px", color: "var(--ftp-text-2)", fontSize: 14 }}>
                      {t("onlineWho")}
                    </p>
                    <SheetAction href={RTI_ONLINE} external>
                      {t("fileOnline")}
                    </SheetAction>
                  </Card>
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{t("bplNote")}</p>
                <button
                  type="button"
                  onClick={() => goTo(2)}
                  style={{ alignSelf: "flex-start", minHeight: 44, background: "none", border: 0, padding: 0, color: "var(--hue-deep)", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "var(--ftp-font-sans)" }}
                >
                  ← {t("backToLetter")}
                </button>
              </div>
            )}
          </Card>
        </Section>
      </div>

      {/* ONE picture: what happens after you send it (the RTI Act's time limits). */}
      <Section title={t("timelineTitle")}>
        <Card tinted padding={18}>
          <p className="ftp-prose" style={{ margin: "0 0 14px", fontSize: 15, lineHeight: 1.6 }}>
            {t("timelineSimple")}
          </p>
          <Steps steps={timeline} />
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px dashed color-mix(in srgb, var(--hue) 30%, var(--ftp-border))" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 15, fontWeight: 600 }}>
              <span>{t("sentOnLabel")}</span>
              <input
                type="date"
                value={sentOn}
                onChange={(e) => setSentOn(e.target.value)}
                style={{
                  minHeight: 44,
                  padding: "0 12px",
                  borderRadius: 12,
                  border: "1px solid color-mix(in srgb, var(--hue) 25%, var(--ftp-border))",
                  background: "var(--ftp-surface)",
                  fontFamily: "var(--ftp-font-sans)",
                  fontSize: 15,
                  color: "var(--ftp-text)",
                }}
              />
            </label>
            {validSent && replyBy && appealBy ? (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <CountdownBar start={validSent} target={replyBy} label={t("replyBy", { date: longDate(replyBy) })} />
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{t.rich("appealBy", { date: longDate(appealBy), b: bold })}</p>
              </div>
            ) : (
              <p className="ftp-body" style={{ margin: "8px 0 0", color: "var(--ftp-text-2)", fontSize: 13 }}>
                {t("sentOnHint")}
              </p>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <SourcePill label={t("actSource")} href={RTI_ACT} />
            {stateConfig?.rtiPortalUrl && <SourcePill label={commission} href={stateConfig.rtiPortalUrl} />}
          </div>
        </Card>
      </Section>

      <div style={{ marginTop: 28 }}>
        <PageActions locale={locale} district={district} moduleSlug="file-rti" compare={false} />
      </div>
    </ModulePage>
  );
}
