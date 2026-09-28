/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Pieces of the "What you can do" page (responsibility). v5.5 (owner, 28 Sep
// 2026: "organise it better", mostly white): white cards and plain lists,
// colour only on small things (a number, a check mark, a link).
//   TopicChart    the picture: this fortnight's news, by topic (ChartCard)
//   WhoToCall     four numbers most people need, tap to call, and a link
//                 to "Helplines & your rights" for the rest
//   TopicList     "Because of what's in the news": one numbered row per
//                 busy topic; TopicSheet has the steps, why and headlines
//   AreaChecklist the general guide: one card per area, every tip shown
//   ResearchArea  researched actions of one area: what, why, whom to tell,
//                 call / website inline; ActionSheet has the source
//   ProjectionCard "What <district> can become"
// No emoji: topics and areas are words; only "who to tell" keeps a small
// Lucide megaphone.
// Text: "page_responsibility" namespace. Headlines, researched actions and
// the general guide are data and are shown as written.
"use client";

import { useTranslations } from "next-intl";
import { Check, ChevronRight, ExternalLink, Globe, Megaphone, Phone } from "lucide-react";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import { ChartCard } from "@/components/district/visuals";
import { getHelplines } from "@/components/district/civic/CitizenParts";
import { useFormat, useModuleText } from "@/i18n/client";
import { hueClass } from "@/lib/design/hues";
import { topicRule, type NewsTopicId } from "@/lib/civic/news-topics";
import type { NewsTopicCount } from "@/app/api/data/responsibility-news/route";

export type ResearchItem = {
  action: string;
  whyRelevant: string;
  reportTo: { name: string | null; url: string | null; phone: string | null };
  sourceNotes: string | null;
};

const SHEET_HUE = hueClass("responsibility");

/** Steps per topic in the dictionary (topics.<id>.step1 … step3). */
const STEPS = ["step1", "step2", "step3"] as const;

/** The white card every block on this page sits in. */
const WHITE_CARD: React.CSSProperties = {
  background: "var(--ftp-surface)",
  border: "1px solid var(--ftp-border)",
  borderRadius: "var(--ftp-radius-card)",
  boxShadow: "var(--ftp-shadow-1)",
  minWidth: 0,
};

/** The small grey number at the start of a numbered row. */
const STEP_NUMBER: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--ftp-surface-2)",
  color: "var(--ftp-text-2)",
  fontSize: 13,
  fontWeight: 700,
};

/** A quiet inline link (call, website, details) with a 44 px tap height. */
const INLINE_LINK: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  minHeight: 44,
  fontSize: 13,
  fontWeight: 600,
  color: "var(--hue-deep)",
  textDecoration: "none",
};

/** A 44 px action link for sheet footers. */
export function SheetLink({ href, icon: Icon, children, primary }: { href: string; icon: typeof Phone; children: React.ReactNode; primary?: boolean }) {
  const external = /^https?:/.test(href);
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      style={{
        flex: "1 1 150px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 44,
        padding: "0 16px",
        borderRadius: 12,
        border: `1px solid ${primary ? "var(--hue)" : "var(--ftp-border)"}`,
        background: primary ? "var(--hue)" : "var(--ftp-surface)",
        color: primary ? "#fff" : "var(--ftp-text)",
        fontSize: 15,
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      <Icon size={18} aria-hidden />
      {children}
    </a>
  );
}

function Clamp({ lines, children, lang }: { lines: number; children: React.ReactNode; lang?: string }) {
  return (
    <span
      lang={lang}
      style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: lines, overflow: "hidden" }}
    >
      {children}
    </span>
  );
}

/** "In the news" tag on areas that the news lifted to the top. */
export function InNewsTag() {
  const t = useTranslations("page_responsibility");
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "0 8px",
        borderRadius: 999,
        border: "1px solid color-mix(in srgb, var(--hue) 35%, var(--ftp-border))",
        background: "var(--ftp-surface)",
        color: "var(--hue-deep)",
        fontSize: 12,
        lineHeight: "18px",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {t("inNews")}
    </span>
  );
}

// ── The picture: this fortnight's news, by topic ────────────────────────

/** A plain bar chart in a ChartCard (white card, the chart blue, a table view). */
export function TopicChart({ topics, name, latestAt }: { topics: NewsTopicCount[]; name: string; latestAt: string | null }) {
  const t = useTranslations("page_responsibility");
  const f = useFormat();
  const shown = topics.slice(0, 6);
  const max = Math.max(1, ...shown.map((x) => x.count));
  const summary = shown.map((x) => `${t(`topics.${x.topic}.label`)}: ${f.number(x.count)}`).join(", ");
  return (
    <ChartCard
      title={t("newsPic.title")}
      units={t("newsPic.lead", { name })}
      asOf={latestAt}
      table={shown.map((x) => ({ label: t(`topics.${x.topic}.label`), value: f.number(x.count) }))}
    >
      <div role="img" aria-label={t("newsPic.aria", { summary })} style={{ display: "grid", gap: 10 }}>
        {shown.map((x, i) => (
          <div
            key={x.topic}
            aria-hidden
            style={{ display: "grid", gridTemplateColumns: "minmax(0, 10em) minmax(40px, 1fr) 2.5em", alignItems: "center", gap: 10 }}
          >
            <span style={{ fontSize: 14, lineHeight: "18px", color: "var(--ftp-text)" }}>{t(`topics.${x.topic}.label`)}</span>
            <span style={{ display: "block", height: 10, borderRadius: 999, background: "var(--ftp-surface-2)", overflow: "hidden" }}>
              <span
                className="ftp-grow-x"
                style={{
                  display: "block",
                  width: `${(x.count / max) * 100}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: i === 0 ? "var(--hue)" : "color-mix(in srgb, var(--hue) 62%, var(--ftp-surface))",
                  ["--i" as string]: i,
                }}
              />
            </span>
            <span className="ftp-num" style={{ fontSize: 15, fontWeight: 650, color: "var(--ftp-text)", textAlign: "right" }}>
              {f.number(x.count)}
            </span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

// ── Who to call (short list; the full list is on "Helplines & your rights") ──

/** The numbers most people need, from the Helplines page's own list. */
const QUICK_HELPLINES = ["national", "ambulance", "women", "cyber"];

export function WhoToCall({ state, base }: { state: string; base: string }) {
  const t = useTranslations("page_responsibility");
  const tc = useTranslations("page_citizen-corner");
  const lines = getHelplines(state).filter((h) => QUICK_HELPLINES.includes(h.key));
  return (
    <section aria-labelledby="who-to-call" style={{ ...WHITE_CARD, padding: 18, display: "flex", flexDirection: "column" }}>
      <h3 id="who-to-call" style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 700, color: "var(--ftp-text)" }}>
        {t("whoToCall.title")}
      </h3>
      <p style={{ margin: "2px 0 8px", fontSize: 13, lineHeight: "19px", color: "var(--ftp-text-2)" }}>{t("whoToCall.lead")}</p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {lines.map((h, i) => {
          const name = tc(`helplines.${h.key}.name`);
          return (
            <li key={h.key} style={{ borderTop: i === 0 ? "none" : "1px solid var(--ftp-border)" }}>
              <a
                href={`tel:${h.number.replace(/[^\d+]/g, "")}`}
                aria-label={tc("callAria", { name, number: h.number })}
                style={{
                  display: "grid",
                  gridTemplateColumns: "4.5em minmax(0, 1fr) auto",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 44,
                  padding: "6px 0",
                  textDecoration: "none",
                  color: "var(--ftp-text)",
                }}
              >
                <span className="ftp-num" style={{ fontSize: 17, lineHeight: "22px", fontWeight: 700, color: "var(--hue-deep)" }}>
                  {h.number}
                </span>
                <span style={{ fontSize: 14, lineHeight: "20px" }}>{name}</span>
                <Phone size={16} aria-hidden style={{ color: "var(--hue)" }} />
              </a>
            </li>
          );
        })}
      </ul>
      <a
        href={`${base}/citizen-corner`}
        style={{ display: "inline-flex", alignItems: "center", gap: 2, minHeight: 44, marginTop: "auto", fontSize: 14, fontWeight: 600, color: "var(--hue-deep)", textDecoration: "none" }}
      >
        {t("whoToCall.more")}
        <ChevronRight size={16} aria-hidden />
      </a>
    </section>
  );
}

// ── Because of what's in the news: one row per busy topic ───────────────

/** One white card holding a short list; each row opens the topic's steps. */
export function TopicList({ topics, onOpen }: { topics: NewsTopicCount[]; onOpen: (x: NewsTopicCount) => void }) {
  const t = useTranslations("page_responsibility");
  return (
    <ol style={{ ...WHITE_CARD, listStyle: "none", margin: 0, padding: "4px 0" }}>
      {topics.map((x, i) => {
        const latest = x.headlines[0];
        const topic = t(`topics.${x.topic}.label`);
        return (
          <li key={x.topic} style={{ borderTop: i === 0 ? "none" : "1px solid var(--ftp-border)" }}>
            <button
              type="button"
              onClick={() => onOpen(x)}
              aria-haspopup="dialog"
              className="ftp-dt-row"
              style={{
                display: "grid",
                gridTemplateColumns: "28px minmax(0, 1fr) auto",
                alignItems: "start",
                gap: 12,
                width: "100%",
                minHeight: 44,
                padding: "14px 16px",
                border: "none",
                background: "transparent",
                textAlign: "left",
                font: "inherit",
                color: "var(--ftp-text)",
                cursor: "pointer",
              }}
            >
              <span aria-hidden className="ftp-num" style={STEP_NUMBER}>
                {i + 1}
              </span>
              <span style={{ minWidth: 0, display: "grid", gap: 2 }}>
                <span style={{ fontSize: 15, lineHeight: "22px", fontWeight: 650 }}>{t(`topics.${x.topic}.action`)}</span>
                <span style={{ fontSize: 13, lineHeight: "19px", color: "var(--ftp-text-2)" }}>{t("card.whyNow", { n: x.count, topic })}</span>
                {latest && (
                  <span style={{ fontSize: 13, lineHeight: "19px", color: "var(--ftp-text-2)" }}>
                    <Clamp lines={1}>
                      <span style={{ fontWeight: 600 }}>{t("card.latest")} </span>
                      <span lang={latest.lang}>“{latest.title}”</span>
                    </Clamp>
                  </span>
                )}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 2, marginTop: 1, fontSize: 13, lineHeight: "20px", fontWeight: 600, color: "var(--hue-deep)", whiteSpace: "nowrap" }}>
                {t("card.open")}
                <ChevronRight size={14} aria-hidden />
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function TopicSheet({ x, onClose, name, base }: { x: NewsTopicCount | null; onClose: () => void; name: string; base: string }) {
  const t = useTranslations("page_responsibility");
  const f = useFormat();
  const mt = useModuleText();
  if (!x) return null;
  const rule = topicRule(x.topic);
  const topic = t(`topics.${x.topic}.label`);
  const footer =
    rule?.helpline || rule?.site || rule?.module ? (
      <>
        {rule?.helpline && (
          <SheetLink href={`tel:${rule.helpline}`} icon={Phone} primary>
            {t("sheet.call", { number: rule.helpline })}
          </SheetLink>
        )}
        {rule?.site && (
          <SheetLink href={rule.site} icon={Globe} primary={!rule.helpline}>
            {t("sheet.site")}
          </SheetLink>
        )}
        {rule?.module && (
          <SheetLink href={`${base}/${rule.module}`} icon={ChevronRight} primary={!rule.helpline && !rule.site}>
            {t("sheet.moreOn", { module: mt.label(rule.module) })}
          </SheetLink>
        )}
      </>
    ) : undefined;
  return (
    <DetailSheet
      open
      onClose={onClose}
      title={t(`topics.${x.topic}.action`)}
      subtitle={t("card.whyNow", { n: x.count, topic })}
      hueClassName={SHEET_HUE}
      footer={footer}
    >
      <section>
        <h3 className="ftp-display" style={{ margin: "0 0 8px", fontSize: 16, lineHeight: "22px", fontWeight: 650 }}>
          {t("sheet.stepsTitle")}
        </h3>
        <ol style={{ margin: 0, paddingInlineStart: 0, listStyle: "none", display: "grid", gap: 8 }}>
          {STEPS.map((k, i) => (
            <li key={k} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 15, lineHeight: "22px" }}>
              <span
                aria-hidden
                className="ftp-num"
                style={{
                  flexShrink: 0,
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--hue)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </span>
              <span>{t(`topics.${x.topic}.${k}`)}</span>
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h3 className="ftp-display" style={{ margin: "0 0 4px", fontSize: 16, lineHeight: "22px", fontWeight: 650 }}>
          {t("sheet.whyTitle")}
        </h3>
        <p style={{ margin: 0, fontSize: 14, lineHeight: "21px", color: "var(--ftp-text-2)" }}>{t("sheet.why", { n: x.count, topic, name })}</p>
      </section>
      {x.headlines.length > 0 && (
        <section>
          <h3 className="ftp-display" style={{ margin: "0 0 8px", fontSize: 16, lineHeight: "22px", fontWeight: 650 }}>
            {t("sheet.newsTitle")}
          </h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
            {x.headlines.map((h) => {
              const who = h.publisher?.trim() || h.source;
              const when = f.date(h.publishedAt, { day: "numeric", month: "short", year: "numeric" });
              return (
                <li key={h.id}>
                  <a
                    href={h.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ftp-card-link"
                    aria-label={`${h.title}. ${t("sheet.openStory", { source: who, date: when })}`}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      minHeight: 44,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid var(--ftp-border)",
                      background: "var(--ftp-surface)",
                      textDecoration: "none",
                      color: "var(--ftp-text)",
                    }}
                  >
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span lang={h.lang} style={{ display: "block", fontSize: 14, lineHeight: "20px", fontWeight: 600 }}>
                        {h.title}
                      </span>
                      <span style={{ display: "block", marginTop: 2, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                        {who} · <span className="ftp-num">{when}</span>
                      </span>
                    </span>
                    <ExternalLink size={14} aria-hidden style={{ flexShrink: 0, marginTop: 3, color: "var(--hue)" }} />
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </DetailSheet>
  );
}

// ── Researched actions (district-specific) ─────────────────────────────

export function ActionSheet({
  open,
  onClose,
}: {
  open: { item: ResearchItem; area: string } | null;
  onClose: () => void;
}) {
  const t = useTranslations("page_responsibility");
  if (!open) return null;
  const { item, area } = open;
  const phone = item.reportTo?.phone ?? null;
  const url = item.reportTo?.url ?? null;
  const footer =
    phone || url ? (
      <>
        {phone && (
          <SheetLink href={`tel:${phone.replace(/[^\d+]/g, "")}`} icon={Phone} primary>
            {t("sheet.call", { number: phone })}
          </SheetLink>
        )}
        {url && (
          <SheetLink href={url} icon={Globe} primary={!phone}>
            {t("sheet.visitPortal")}
          </SheetLink>
        )}
      </>
    ) : undefined;
  return (
    <DetailSheet open onClose={onClose} title={item.action} subtitle={area} hueClassName={SHEET_HUE} footer={footer}>
      <div
        style={{
          padding: "12px 14px",
          borderRadius: 14,
          background: "var(--ftp-surface-2)",
          border: "1px solid var(--ftp-border)",
        }}
      >
        <p style={{ margin: 0, fontSize: 12, lineHeight: "16px", fontWeight: 700, color: "var(--hue-deep)" }}>
          {t("sheet.whyHere")}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 15, lineHeight: "23px" }}>{item.whyRelevant}</p>
      </div>
      <DetailList
        rows={[
          { label: t("sheet.who"), value: item.reportTo?.name },
          {
            label: t("sheet.phone"),
            value: phone ? (
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="ftp-num" style={{ color: "var(--hue-deep)", fontWeight: 600 }}>
                {phone}
              </a>
            ) : null,
          },
          {
            label: t("sheet.website"),
            value: url ? (
              <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--hue-deep)", fontWeight: 600 }}>
                {url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
              </a>
            ) : null,
          },
          { label: t("sheet.source"), value: item.sourceNotes },
        ]}
      />
      {(phone || url) && <p style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)" }}>{t("sheet.checkNote")}</p>}
    </DetailSheet>
  );
}

// ── All the things you can do: one white card per area ─────────────────

/** Title row of an area card: name, how many things, and "In the news". */
function AreaHead({ title, n, inNews }: { title: string; n: number; inNews: boolean }) {
  const t = useTranslations("page_responsibility");
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
      <h3 style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 700, color: "var(--ftp-text)" }}>{title}</h3>
      <span className="ftp-num" style={{ fontSize: 13, lineHeight: "18px", color: "var(--ftp-text-2)" }}>
        {t("area.count", { n })}
      </span>
      {inNews && <InNewsTag />}
    </div>
  );
}

/** General guide: every tip of one area, as a checklist (nothing hidden behind a tap). */
export function AreaChecklist({ title, items, inNews }: { title: string; items: string[]; inNews: boolean }) {
  return (
    <section style={{ ...WHITE_CARD, padding: "16px 18px" }}>
      <AreaHead title={title} n={items.length} inNews={inNews} />
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: "grid", gridTemplateColumns: "18px minmax(0, 1fr)", gap: 8, fontSize: 14, lineHeight: "21px", color: "var(--ftp-text)" }}>
            <Check size={16} strokeWidth={2.25} aria-hidden style={{ marginTop: 2, color: "var(--hue)" }} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Researched actions of one area: each row says what to do, why, and whom
 * to tell (with a tap-to-call number and the website when we have them);
 * "Details" opens the sheet with the source.
 */
export function ResearchArea({
  title,
  items,
  inNews,
  onOpen,
}: {
  title: string;
  items: ResearchItem[];
  inNews: boolean;
  onOpen: (item: ResearchItem) => void;
}) {
  const t = useTranslations("page_responsibility");
  return (
    <section style={{ ...WHITE_CARD, padding: "16px 18px 6px" }}>
      <AreaHead title={title} n={items.length} inNews={inNews} />
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((item, i) => {
          const phone = item.reportTo?.phone ?? null;
          const url = item.reportTo?.url ?? null;
          return (
            <li key={i} style={{ padding: "12px 0", borderTop: "1px solid var(--ftp-border)", display: "grid", gap: 4 }}>
              <span style={{ fontSize: 15, lineHeight: "22px", fontWeight: 650, color: "var(--ftp-text)" }}>{item.action}</span>
              <span style={{ fontSize: 13, lineHeight: "19px", color: "var(--ftp-text-2)" }}>
                <Clamp lines={2}>{item.whyRelevant}</Clamp>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "0 14px", flexWrap: "wrap", fontSize: 13, lineHeight: "18px" }}>
                {item.reportTo?.name && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, minWidth: 0, color: "var(--ftp-text)" }}>
                    <Megaphone size={13} aria-hidden style={{ color: "var(--hue)", flexShrink: 0 }} />
                    <span>
                      <span style={{ color: "var(--ftp-text-2)" }}>{t("row.tell")} </span>
                      {item.reportTo.name}
                    </span>
                  </span>
                )}
                {phone && (
                  <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="ftp-num" style={INLINE_LINK}>
                    <Phone size={13} aria-hidden />
                    {phone}
                  </a>
                )}
                {url && (
                  <a href={url} target="_blank" rel="noopener noreferrer" style={INLINE_LINK}>
                    <Globe size={13} aria-hidden />
                    {t("sheet.website")}
                  </a>
                )}
                <button type="button" onClick={() => onOpen(item)} aria-haspopup="dialog" style={{ ...INLINE_LINK, border: "none", background: "transparent", padding: 0, font: "inherit", cursor: "pointer", marginInlineStart: "auto" }}>
                  {t("card.details")}
                  <ChevronRight size={14} aria-hidden />
                </button>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** "What {district} can become": the general guide's goals, in a quiet white card. */
export function ProjectionCard({ title, lead, items }: { title: string; lead: string; items: string[] }) {
  return (
    <section style={{ ...WHITE_CARD, padding: "16px 18px" }}>
      <h3 style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 700, color: "var(--ftp-text)" }}>{title}</h3>
      <p style={{ margin: "2px 0 10px", fontSize: 13, lineHeight: "19px", color: "var(--ftp-text-2)" }}>{lead}</p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: "grid", gridTemplateColumns: "14px minmax(0, 1fr)", gap: 8, fontSize: 14, lineHeight: "21px" }}>
            <span aria-hidden style={{ width: 6, height: 6, marginTop: 8, borderRadius: 999, background: "var(--hue)" }} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** For a topic id, its translated label (used by the page's Explainer and tiles). */
export function useTopicText() {
  const t = useTranslations("page_responsibility");
  return {
    label: (id: NewsTopicId) => t(`topics.${id}.label`),
    action: (id: NewsTopicId) => t(`topics.${id}.action`),
  };
}
