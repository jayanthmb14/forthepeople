/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Pieces of the "What you can do" page (responsibility):
//   TopicBars     the picture: this fortnight's news, by topic, as bars
//   TopicCard     "Because of what's in the news": one action per busy topic
//   TopicSheet    its detail: steps, why it is here, the headlines, helpline
//   ActionCard / ActionSheet   one researched action (why, who to tell, source)
//   AreaCard / AreaSheet       one area of the general guide (all its tips)
//   EmergencyCard              112 and 108, big tap-to-call buttons
// Text: "page_responsibility" namespace. Headlines, researched actions and
// the general guide are data and are shown as written.
"use client";

import { useTranslations } from "next-intl";
import { ChevronRight, ExternalLink, Globe, Phone } from "lucide-react";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
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

/** The card surface shared by the tappable cards on this page. */
const CARD_BUTTON: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: 8,
  width: "100%",
  minHeight: 44,
  padding: 16,
  textAlign: "left",
  font: "inherit",
  color: "var(--ftp-text)",
  cursor: "pointer",
  background: "var(--ftp-surface)",
  border: "1px solid var(--ftp-border)",
  borderRadius: "var(--ftp-radius-card)",
  boxShadow: "var(--ftp-shadow-1)",
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
        padding: "1px 8px",
        borderRadius: 999,
        background: "var(--hue)",
        color: "#fff",
        fontSize: 11,
        lineHeight: "18px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <span aria-hidden>📰</span>
      {t("inNews")}
    </span>
  );
}

// ── The picture ─────────────────────────────────────────────────────────

export function TopicBars({ topics, name, latestAt }: { topics: NewsTopicCount[]; name: string; latestAt: string | null }) {
  const t = useTranslations("page_responsibility");
  const f = useFormat();
  const shown = topics.slice(0, 6);
  const max = Math.max(1, ...shown.map((x) => x.count));
  const summary = shown.map((x) => `${t(`topics.${x.topic}.label`)}: ${f.number(x.count)}`).join(", ");
  return (
    <figure style={{ margin: 0 }}>
      <figcaption style={{ marginBottom: 12 }}>
        <span className="ftp-display" style={{ display: "block", fontSize: 18, lineHeight: "24px", fontWeight: 650, color: "var(--ftp-text)" }}>
          {t("newsPic.title")}
        </span>
        <span style={{ display: "block", marginTop: 2, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
          {t("newsPic.lead", { name })}
        </span>
      </figcaption>
      <div role="img" aria-label={t("newsPic.aria", { summary })} style={{ display: "grid", gap: 10 }}>
        {shown.map((x, i) => (
          <div
            key={x.topic}
            aria-hidden
            style={{ display: "grid", gridTemplateColumns: "32px minmax(0, 10em) minmax(40px, 1fr) 2.5em", alignItems: "center", gap: 10 }}
          >
            <span className="ftp-emoji" style={{ fontSize: 22, textAlign: "center" }}>
              {topicRule(x.topic)?.emoji ?? "📰"}
            </span>
            <span style={{ fontSize: 14, lineHeight: "18px", color: "var(--ftp-text)" }}>{t(`topics.${x.topic}.label`)}</span>
            <span style={{ display: "block", height: 14, borderRadius: 999, background: "color-mix(in srgb, var(--hue-tint) 70%, var(--ftp-surface-2))", overflow: "hidden" }}>
              <span
                className="ftp-grow-x"
                style={{
                  display: "block",
                  width: `${(x.count / max) * 100}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: "linear-gradient(90deg, var(--hue-pop), var(--hue))",
                  ["--i" as string]: i,
                }}
              />
            </span>
            <span className="ftp-num" style={{ fontSize: 16, fontWeight: 650, color: "var(--hue-deep)", textAlign: "right" }}>
              {f.number(x.count)}
            </span>
          </div>
        ))}
      </div>
      {latestAt && (
        <p style={{ margin: "10px 0 0", fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)" }}>
          {t("newsPic.newest", { date: f.date(latestAt, { day: "numeric", month: "short", year: "numeric" }) })}
        </p>
      )}
    </figure>
  );
}

// ── Because of what's in the news ───────────────────────────────────────

export function TopicCard({ x, onOpen }: { x: NewsTopicCount; onOpen: (x: NewsTopicCount) => void }) {
  const t = useTranslations("page_responsibility");
  const rule = topicRule(x.topic);
  const latest = x.headlines[0];
  const topic = t(`topics.${x.topic}.label`);
  return (
    <button
      type="button"
      onClick={() => onOpen(x)}
      className="ftp-card-link"
      aria-haspopup="dialog"
      style={{
        ...CARD_BUTTON,
        background: "linear-gradient(135deg, color-mix(in srgb, var(--hue) 9%, #fff) 0%, #fff 75%)",
        border: "1px solid color-mix(in srgb, var(--hue) 26%, var(--ftp-border))",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 48, height: 48, fontSize: 26, borderRadius: 14, background: "#fff" }}>
          {rule?.emoji ?? "📰"}
        </span>
        <span style={{ minWidth: 0 }}>
          <span className="ftp-display" style={{ display: "block", fontSize: 17, lineHeight: "22px", fontWeight: 650, color: "var(--ftp-text)" }}>
            {t(`topics.${x.topic}.action`)}
          </span>
          <span style={{ display: "block", fontSize: 13, lineHeight: "19px", color: "var(--hue-deep)", fontWeight: 600 }}>
            {t("card.whyNow", { n: x.count, topic })}
          </span>
        </span>
      </span>
      {latest && (
        <span style={{ fontSize: 13, lineHeight: "19px", color: "var(--ftp-text-2)" }}>
          <span style={{ fontWeight: 600 }}>{t("card.latest")} </span>
          <Clamp lines={2} lang={latest.lang}>
            “{latest.title}”
          </Clamp>
        </span>
      )}
      <span style={{ display: "inline-flex", alignItems: "center", gap: 2, alignSelf: "flex-end", fontSize: 13, fontWeight: 600, color: "var(--hue-deep)" }}>
        {t("card.open")}
        <ChevronRight size={14} aria-hidden />
      </span>
    </button>
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
      emoji={rule?.emoji ?? "📰"}
      hueClassName={SHEET_HUE}
      footer={footer}
    >
      <section>
        <h3 className="ftp-display" style={{ margin: "0 0 8px", fontSize: 16, lineHeight: "22px", fontWeight: 650 }}>
          <span aria-hidden>✅ </span>
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
          <span aria-hidden>🔎 </span>
          {t("sheet.whyTitle")}
        </h3>
        <p style={{ margin: 0, fontSize: 14, lineHeight: "21px", color: "var(--ftp-text-2)" }}>{t("sheet.why", { n: x.count, topic, name })}</p>
      </section>
      {x.headlines.length > 0 && (
        <section>
          <h3 className="ftp-display" style={{ margin: "0 0 8px", fontSize: 16, lineHeight: "22px", fontWeight: 650 }}>
            <span aria-hidden>📰 </span>
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

export function ActionCard({
  item,
  area,
  emoji,
  inNews,
  onOpen,
}: {
  item: ResearchItem;
  area: string;
  emoji: string;
  inNews: boolean;
  onOpen: () => void;
}) {
  const t = useTranslations("page_responsibility");
  return (
    <button type="button" onClick={onOpen} className="ftp-card-link" aria-haspopup="dialog" style={CARD_BUTTON}>
      <span style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 36, height: 36, fontSize: 18, borderRadius: 11 }}>
          {emoji}
        </span>
        <span style={{ fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)", flex: 1, minWidth: 0 }}>{area}</span>
        {inNews && <InNewsTag />}
      </span>
      <span className="ftp-title" style={{ fontWeight: 650, fontSize: 16, lineHeight: "22px" }}>
        {item.action}
      </span>
      <span style={{ fontSize: 13, lineHeight: "19px", color: "var(--ftp-text-2)" }}>
        <Clamp lines={2}>{item.whyRelevant}</Clamp>
      </span>
      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: "auto", fontSize: 12, lineHeight: "18px" }}>
        <span style={{ color: "var(--hue-deep)", fontWeight: 600, minWidth: 0 }}>
          {item.reportTo?.name ? (
            <>
              <span aria-hidden>📣 </span>
              {item.reportTo.name}
            </>
          ) : null}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontWeight: 600, color: "var(--hue-deep)", flexShrink: 0 }}>
          {t("card.details")}
          <ChevronRight size={14} aria-hidden />
        </span>
      </span>
    </button>
  );
}

export function ActionSheet({
  open,
  onClose,
}: {
  open: { item: ResearchItem; area: string; emoji: string } | null;
  onClose: () => void;
}) {
  const t = useTranslations("page_responsibility");
  if (!open) return null;
  const { item, area, emoji } = open;
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
    <DetailSheet open onClose={onClose} title={item.action} subtitle={area} emoji={emoji} hueClassName={SHEET_HUE} footer={footer}>
      <div
        style={{
          padding: "12px 14px",
          borderRadius: 14,
          background: "linear-gradient(135deg, var(--hue-tint) 0%, #fff 90%)",
          border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
        }}
      >
        <p style={{ margin: 0, fontSize: 12, lineHeight: "16px", fontWeight: 700, color: "var(--hue-deep)" }}>
          <span aria-hidden>💡 </span>
          {t("sheet.whyHere")}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 15, lineHeight: "23px" }}>{item.whyRelevant}</p>
      </div>
      <DetailList
        rows={[
          { emoji: "📣", label: t("sheet.who"), value: item.reportTo?.name },
          {
            emoji: "☎️",
            label: t("sheet.phone"),
            value: phone ? (
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="ftp-num" style={{ color: "var(--hue-deep)", fontWeight: 600 }}>
                {phone}
              </a>
            ) : null,
          },
          {
            emoji: "🌐",
            label: t("sheet.website"),
            value: url ? (
              <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--hue-deep)", fontWeight: 600 }}>
                {url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
              </a>
            ) : null,
          },
          { emoji: "📄", label: t("sheet.source"), value: item.sourceNotes },
        ]}
      />
      {(phone || url) && <p style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)" }}>{t("sheet.checkNote")}</p>}
    </DetailSheet>
  );
}

// ── The general guide (districts without researched actions) ───────────

export function AreaCard({
  title,
  emoji,
  items,
  inNews,
  onOpen,
}: {
  title: string;
  emoji: string;
  items: string[];
  inNews: boolean;
  onOpen: () => void;
}) {
  const t = useTranslations("page_responsibility");
  return (
    <button type="button" onClick={onOpen} className="ftp-card-link" aria-haspopup="dialog" style={CARD_BUTTON}>
      <span style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 44, height: 44, fontSize: 22, borderRadius: 13 }}>
          {emoji}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="ftp-title" style={{ display: "block", fontWeight: 650, fontSize: 16 }}>
            {title}
          </span>
          <span className="ftp-num" style={{ display: "block", fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)" }}>
            {t("area.count", { n: items.length })}
          </span>
        </span>
        {inNews && <InNewsTag />}
      </span>
      <span style={{ display: "grid", gap: 4, fontSize: 13, lineHeight: "19px", color: "var(--ftp-text-2)" }}>
        {items.slice(0, 2).map((it, i) => (
          <span key={i} style={{ display: "flex", gap: 6 }}>
            <span aria-hidden style={{ color: "var(--hue)" }}>•</span>
            <Clamp lines={2}>{it}</Clamp>
          </span>
        ))}
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 2, alignSelf: "flex-end", fontSize: 13, fontWeight: 600, color: "var(--hue-deep)" }}>
        {t("area.open")}
        <ChevronRight size={14} aria-hidden />
      </span>
    </button>
  );
}

export function AreaSheet({ open, onClose }: { open: { title: string; emoji: string; items: string[] } | null; onClose: () => void }) {
  const t = useTranslations("page_responsibility");
  if (!open) return null;
  return (
    <DetailSheet open onClose={onClose} title={open.title} subtitle={t("area.count", { n: open.items.length })} emoji={open.emoji} hueClassName={SHEET_HUE}>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
        {open.items.map((it, i) => (
          <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 15, lineHeight: "22px" }}>
            <span aria-hidden className="ftp-icon-chip" style={{ width: 24, height: 24, borderRadius: 8, marginTop: 1, fontSize: 13, fontWeight: 700 }}>
              ✓
            </span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
      <p style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)" }}>{t("sheet.checkNote")}</p>
    </DetailSheet>
  );
}

// ── Emergency ───────────────────────────────────────────────────────────

export function EmergencyCard() {
  const t = useTranslations("page_responsibility");
  const big: React.CSSProperties = {
    flex: "1 1 130px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minHeight: 88,
    padding: 12,
    borderRadius: 16,
    textDecoration: "none",
    background: "#fff",
    border: "1px solid color-mix(in srgb, var(--hue) 26%, var(--ftp-border))",
    color: "var(--ftp-text)",
  };
  return (
    <div
      style={{
        padding: 18,
        borderRadius: "var(--ftp-radius-card)",
        background: "linear-gradient(135deg, color-mix(in srgb, var(--hue) 9%, #fff) 0%, #fff 75%)",
        border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
        boxShadow: "var(--ftp-shadow-1)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div>
        <p className="ftp-display" style={{ margin: 0, fontSize: 17, lineHeight: "22px", fontWeight: 650 }}>
          <span aria-hidden>🚨 </span>
          {t("emergencyTitle")}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 14, lineHeight: "21px", color: "var(--ftp-text-2)" }}>{t("emergencyBody")}</p>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <a href="tel:112" className="ftp-card-link" style={big} aria-label={t("callAria", { name: t("emergency112"), number: "112" })}>
          <span className="ftp-bignum" style={{ fontSize: 32, lineHeight: 1, color: "var(--hue-deep)" }}>
            112
          </span>
          <span style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600 }}>{t("emergency112")}</span>
        </a>
        <a href="tel:108" className="ftp-card-link" style={big} aria-label={t("callAria", { name: t("emergency108"), number: "108" })}>
          <span className="ftp-bignum" style={{ fontSize: 32, lineHeight: 1, color: "var(--hue-deep)" }}>
            108
          </span>
          <span style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600 }}>{t("emergency108")}</span>
        </a>
      </div>
    </div>
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
