/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Local industries — the cards and DetailSheets (v4.1).
//   IndustryCard / IndustrySheet   one listed place (IT park, heritage site,
//                                  factory, market…) from LocalIndustry.
//                                  The sheet shows every stored detail,
//                                  the source and date, and Directions when
//                                  the row has a map point.
//   FactoryCard / FactorySheet     one sugar factory with its crushing
//                                  seasons (cards, never a sideways table),
//                                  money still owed to farmers, and Call /
//                                  Directions.
// Detail keys we know get a translated label and number formatting; any
// other key is shown with its own name, as published. Words live in
// "page_industries".
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { MapPin, Navigation, Phone } from "lucide-react";
import { Pill } from "@/components/district/ui";
import { DetailSheet, DetailList } from "@/components/district/DetailSheet";
import { hueClass } from "@/lib/design/hues";
import { useFormat } from "@/i18n/client";
import { useMoney } from "@/components/money/useMoney";
import { CardHead, HueTag, SheetHighlight, SheetLink, SheetSection, TagRow, TapCard, sourceParts } from "@/components/money/TapCard";
import type { SugarFactory } from "@/hooks/useRealtimeData";

export interface LocalIndustry {
  id: string;
  name: string;
  nameLocal?: string | null;
  category?: string | null;
  location?: string | null;
  taluk?: string | null;
  type?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  source?: string | null;
  details?: Record<string, unknown> | null;
  updatedAt?: string | null;
}

/** A factory row as the API sends it (seasons carry a few more fields than the hook type). */
export type FactoryRow = Omit<SugarFactory, "seasonData"> & {
  latitude?: number | null;
  longitude?: number | null;
  updatedAt?: string | null;
  seasonData: Array<
    SugarFactory["seasonData"][number] & { crushingStarted?: string | null; crushingEnded?: string | null; source?: string | null }
  >;
};

const CRORE = 10_000_000;

/** "IT Park" → "itpark" (message key for a glossary word). */
export const glossKey = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");

/** A positive number from a details field ("8,00,000", 800000), or null. */
export function numeric(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v.replace(/[,+\s]/g, "")) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** People working there: the reported count, else the estimate. */
export function jobsOf(p: LocalIndustry): number | null {
  return numeric(p.details?.employees) ?? numeric(p.details?.employmentEstimate);
}
export function visitorsOf(p: LocalIndustry): number | null {
  return numeric(p.details?.visitorsPerYear) ?? numeric(p.details?.visitors_annual);
}
export function companiesOf(p: LocalIndustry): number | null {
  return numeric(p.details?.companies);
}

/** One emoji per kind of place, from words in its category / type. */
export function industryEmoji(p: { category?: string | null; type?: string | null }): string {
  const c = `${p.category ?? ""} ${p.type ?? ""}`.toLowerCase();
  if (/\bit\b|it park|tech|software|gcc/.test(c)) return "💻";
  if (/pharma|biotech|health/.test(c)) return "🧪";
  if (/financ|bank|exchange/.test(c)) return "🏦";
  if (/market|commercial|retail|trade/.test(c)) return "🛍️";
  if (/handicraft|silk|craft|textile|weav/.test(c)) return "🧵";
  if (/heritage|palace|temple|fort/.test(c)) return "🏛️";
  if (/touris|wildlife|park|zoo/.test(c)) return "🧳";
  if (/port|logistic/.test(c)) return "⚓";
  if (/auto|vehicle/.test(c)) return "🚗";
  if (/sugar/.test(c)) return "🍬";
  if (/manufactur|industr|factory|engineering/.test(c)) return "🏭";
  if (/startup/.test(c)) return "🚀";
  return "🏢";
}

/** Translated glossary word (category, factory type, season status), else the text as published. */
export function useGloss() {
  const t = useTranslations("page_industries");
  const f = useFormat();
  return (group: "cat" | "factoryType" | "seasonStatus", raw: string | null | undefined, fallback?: (s: string) => string) => {
    if (!raw) return "";
    const key = `${group}.${glossKey(raw)}`;
    if (f.locale !== "en" && t.has(key)) return t(key);
    return fallback ? fallback(raw) : raw;
  };
}

/** Google Maps link for a map point, or null. */
function mapsUrl(lat?: number | null, lng?: number | null): string | null {
  if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** Detail keys we show elsewhere or never show (bookkeeping fields from data scripts). */
const SKIP_KEYS = new Set([
  "description", "phone", "filledFields", "missingPhones", "createdVia", "patchedFields", "fromTier", "toTier",
  "hasData", "dupeRemoved", "removed", "reason", "missing", "results", "message",
]);

/** Keys with a translated label (page_industries.dk.<key>). */
const KNOWN_KEYS = new Set([
  "employees", "employmentEstimate", "established", "founded", "built", "area", "area_acres", "area_sqft", "companies",
  "developer", "anchor_tenants", "keyTenants", "annual_revenue_cr", "revenue_cr", "revenue", "visitors_annual",
  "visitorsPerYear", "entry_fee", "entry_fee_adult", "entry_adult", "entryfee", "builtUpArea", "products", "sectors",
  "major_sectors", "exports_usd_mn", "exports_usd_bn", "export_countries", "style", "height_ft", "illumination_days", "tier",
]);

/** "annual_revenue_cr" → "Annual revenue cr" for keys without a label. */
function humanKey(k: string): string {
  const s = k.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Every stored detail as DetailList rows: known keys translated and formatted, others as published. */
function useDetailRows() {
  const t = useTranslations("page_industries");
  const m = useMoney();
  return (details: Record<string, unknown> | null | undefined) => {
    const rows: { label: React.ReactNode; value: React.ReactNode; lang?: string }[] = [];
    for (const [k, raw] of Object.entries(details ?? {})) {
      if (SKIP_KEYS.has(k) || raw === null || raw === undefined || raw === "") continue;
      if (typeof raw === "object" && !Array.isArray(raw)) continue;
      const known = KNOWN_KEYS.has(k);
      const n = typeof raw === "number" ? raw : null;
      let value: React.ReactNode;
      if (Array.isArray(raw)) value = raw.join(", ");
      else if (n !== null && /_cr$/.test(k)) value = m.crore(n, n < 100 ? 1 : 0);
      else if (n !== null && /^(established|founded|built)$/.test(k)) value = String(n);
      else if (n !== null) value = m.num(n);
      else value = String(raw);
      rows.push({ label: known ? t(`dk.${k}`) : humanKey(k), value, lang: typeof raw === "string" && !known ? "en" : undefined });
    }
    return rows;
  };
}

// ── LocalIndustry ─────────────────────────────────────────

export function IndustryCard({ p, onOpen }: { p: LocalIndustry; onOpen: () => void }) {
  const t = useTranslations("page_industries");
  const m = useMoney();
  const gloss = useGloss();
  const jobs = jobsOf(p);
  const visitors = visitorsOf(p);
  const companies = companiesOf(p);
  // One headline number: jobs, else visitors, else companies.
  const fact =
    jobs !== null
      ? { label: numeric(p.details?.employees) !== null ? t("facts.employees") : t("facts.jobsEstimate"), value: m.num(jobs) }
      : visitors !== null
        ? { label: t("facts.visitors"), value: m.num(visitors) }
        : companies !== null
          ? { label: t("facts.companies"), value: m.num(companies) }
          : null;
  const kind = gloss("cat", p.type || p.category);
  return (
    <TapCard onOpen={onOpen} ariaLabel={t("local.cardAria", { name: p.name })} more={t("local.more")}>
      <CardHead emoji={industryEmoji(p)} title={p.name} titleLocal={p.nameLocal} />
      <TagRow>
        {kind && <HueTag>{kind}</HueTag>}
        {p.location && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", minWidth: 0 }}>
            <MapPin size={12} aria-hidden style={{ color: "var(--hue)", flexShrink: 0 }} />
            <span style={{ overflowWrap: "anywhere" }}>{p.location}</span>
          </span>
        )}
      </TagRow>
      {fact && (
        <span>
          <span className="ftp-label" style={{ display: "block" }}>{fact.label}</span>
          <span className="ftp-num" style={{ fontSize: 17, lineHeight: "24px", fontWeight: 650, color: "var(--hue-deep)" }}>{fact.value}</span>
        </span>
      )}
    </TapCard>
  );
}

export function IndustrySheet({ p, onClose }: { p: LocalIndustry | null; onClose: () => void }) {
  const t = useTranslations("page_industries");
  const f = useFormat();
  const gloss = useGloss();
  const detailRows = useDetailRows();
  if (!p) return null;
  const description = typeof p.details?.description === "string" ? p.details.description : null;
  const phone = typeof p.details?.phone === "string" ? p.details.phone : null;
  const map = mapsUrl(p.latitude, p.longitude);
  const src = sourceParts(p.source);
  const extra = detailRows(p.details);
  return (
    <DetailSheet
      open
      onClose={onClose}
      title={p.name}
      subtitle={[gloss("cat", p.category), p.type && p.type !== p.category ? gloss("cat", p.type) : null].filter(Boolean).join(" · ")}
      emoji={industryEmoji(p)}
      hueClassName={hueClass("industries")}
      footer={
        map || phone ? (
          <>
            {phone && (
              <SheetLink href={`tel:${phone.replace(/\s/g, "")}`} primary external={false} icon={<Phone size={16} aria-hidden />}>
                {t("sheet.call")}
              </SheetLink>
            )}
            {map && (
              <SheetLink href={map} primary={!phone} icon={<Navigation size={16} aria-hidden />}>
                {t("sheet.directions")}
              </SheetLink>
            )}
          </>
        ) : undefined
      }
    >
      {p.nameLocal && <p className="ftp-body" style={{ fontSize: 15, color: "var(--hue-deep)" }}>{p.nameLocal}</p>}
      {description && (
        <SheetHighlight emoji="📖" label={t("sheet.about")} lang="en">
          {description}
        </SheetHighlight>
      )}
      <DetailList
        rows={[
          { emoji: "🗂️", label: t("sheet.category"), value: gloss("cat", p.category) || null },
          { emoji: "🏷️", label: t("sheet.type"), value: p.type && p.type !== p.category ? gloss("cat", p.type) : null },
          { emoji: "📍", label: t("sheet.location"), value: p.location || null },
          { emoji: "🗺️", label: t("sheet.taluk"), value: p.taluk || null },
          { emoji: "📞", label: t("sheet.phone"), value: phone },
        ]}
      />
      {extra.length > 0 && (
        <SheetSection emoji="🧾" title={t("sheet.details")}>
          <DetailList rows={extra} />
        </SheetSection>
      )}
      <DetailList
        rows={[
          {
            emoji: "🔗",
            label: t("sheet.source"),
            value: src.name ? (
              src.url ? (
                <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--hue-deep)", fontWeight: 600 }}>
                  {src.name}
                </a>
              ) : (
                src.name
              )
            ) : null,
          },
          { emoji: "🕒", label: t("sheet.updated"), value: p.updatedAt ? f.date(p.updatedAt, { day: "numeric", month: "short", year: "numeric" }) : null },
        ]}
      />
    </DetailSheet>
  );
}

// ── Sugar factories ───────────────────────────────────────

/** "completed" → "Completed" (status words arrive in lower case). */
export function sentenceCase(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

export function FactoryCard({ f: fac, onOpen }: { f: FactoryRow; onOpen: () => void }) {
  const t = useTranslations("page_industries");
  const m = useMoney();
  const gloss = useGloss();
  const latest = fac.seasonData[0];
  const owed = latest?.totalArrears ?? 0;
  return (
    <TapCard onOpen={onOpen} ariaLabel={t("local.cardAria", { name: fac.name })} more={t("local.more")}>
      <CardHead
        emoji="🏭"
        title={fac.name}
        titleLocal={fac.nameLocal}
        side={
          latest ? (
            <Pill tone={latest.status.toLowerCase() === "completed" ? "live" : "warn"} dot>
              {gloss("seasonStatus", latest.status, sentenceCase)}
            </Pill>
          ) : undefined
        }
      />
      <TagRow>
        <HueTag>{gloss("factoryType", fac.type)}</HueTag>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
          <MapPin size={12} aria-hidden style={{ color: "var(--hue)" }} />
          {fac.location}
          {fac.taluk ? `, ${fac.taluk}` : ""}
        </span>
      </TagRow>
      {latest && (
        <span style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <span>
            <span className="ftp-label" style={{ display: "block" }}>{t("sugar.sheet.arrears")}</span>
            <span className="ftp-num" style={{ fontSize: 17, lineHeight: "24px", fontWeight: 650, color: owed > 0 ? "var(--ftp-danger)" : "var(--ftp-live-text)" }}>
              {latest.totalArrears == null ? "—" : owed > 0 ? m.crore(owed / CRORE, 2) : t("sugar.paid")}
            </span>
          </span>
          <span>
            <span className="ftp-label" style={{ display: "block" }}>{t("sugar.sheet.farmers")}</span>
            <span className="ftp-num" style={{ fontSize: 17, lineHeight: "24px", fontWeight: 650, color: "var(--hue-deep)" }}>
              {latest.farmersCount ? m.num(latest.farmersCount) : "—"}
            </span>
          </span>
        </span>
      )}
      {latest && <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{t("season", { season: latest.season })}</span>}
    </TapCard>
  );
}

export function FactorySheet({ f: fac, onClose }: { f: FactoryRow | null; onClose: () => void }) {
  const t = useTranslations("page_industries");
  const fmt = useFormat();
  const m = useMoney();
  const gloss = useGloss();
  if (!fac) return null;
  const latest = fac.seasonData[0];
  const owed = latest?.totalArrears ?? null;
  const map = mapsUrl(fac.latitude, fac.longitude);
  const date = (iso?: string | null) => (iso ? fmt.date(iso, { day: "numeric", month: "short", year: "numeric" }) : null);
  return (
    <DetailSheet
      open
      onClose={onClose}
      title={fac.name}
      subtitle={[gloss("factoryType", fac.type), fac.taluk ? `${fac.location}, ${fac.taluk}` : fac.location].filter(Boolean).join(" · ")}
      emoji="🏭"
      hueClassName={hueClass("industries")}
      footer={
        fac.phone || map ? (
          <>
            {fac.phone && (
              <SheetLink href={`tel:${fac.phone.replace(/\s/g, "")}`} primary external={false} icon={<Phone size={16} aria-hidden />}>
                {t("sheet.call")}
              </SheetLink>
            )}
            {map && (
              <SheetLink href={map} primary={!fac.phone} icon={<Navigation size={16} aria-hidden />}>
                {t("sheet.directions")}
              </SheetLink>
            )}
          </>
        ) : undefined
      }
    >
      {fac.nameLocal && <p className="ftp-body" style={{ fontSize: 15, color: "var(--hue-deep)" }}>{fac.nameLocal}</p>}
      {latest && (
        <SheetHighlight emoji={owed && owed > 0 ? "💸" : "✅"} label={t("sugar.sheet.owed", { season: latest.season })}>
          {owed == null ? t("sugar.sheet.owedUnknown") : owed > 0 ? m.crore(owed / CRORE, 2) : t("sugar.sheet.owedNone")}
        </SheetHighlight>
      )}
      <DetailList
        rows={[
          { emoji: "🏷️", label: t("sheet.type"), value: gloss("factoryType", fac.type) || null },
          { emoji: "📍", label: t("sheet.location"), value: fac.location },
          { emoji: "🗺️", label: t("sheet.taluk"), value: fac.taluk || null },
          { emoji: "⚙️", label: t("sugar.sheet.capacity"), value: fac.capacity ? t("sugar.sheet.capacityValue", { n: m.num(fac.capacity) }) : null },
          { emoji: "📞", label: t("sheet.phone"), value: fac.phone || null },
        ]}
      />
      {fac.seasonData.length > 0 && (
        <SheetSection emoji="🌾" title={t("sugar.sheet.seasons")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {fac.seasonData.map((s) => (
              <div
                key={s.id}
                style={{ padding: 12, borderRadius: 14, border: "1px solid color-mix(in srgb, var(--hue) 20%, var(--ftp-border))", background: "linear-gradient(135deg, var(--hue-tint) 0%, #fff 90%)" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <strong className="ftp-title">{t("season", { season: s.season })}</strong>
                  <Pill tone={s.status.toLowerCase() === "completed" ? "live" : "warn"} dot>
                    {gloss("seasonStatus", s.status, sentenceCase)}
                  </Pill>
                </div>
                <DetailList
                  rows={[
                    { label: t("sugar.sheet.cane"), value: s.totalCaneCrushed ? t("units.tonnes", { n: m.num(s.totalCaneCrushed) }) : null },
                    { label: t("sugar.sheet.sugar"), value: s.sugarProduced ? t("units.tonnes", { n: m.num(s.sugarProduced) }) : null },
                    { label: t("sugar.sheet.recovery"), value: s.recoveryPct ? `${fmt.number(s.recoveryPct, { maximumFractionDigits: 2 })}%` : null },
                    { label: t("sugar.sheet.frp"), value: s.frpRate ? m.rupees(s.frpRate) : null },
                    { label: t("sugar.sheet.sap"), value: s.sapRate ? m.rupees(s.sapRate) : null },
                    {
                      label: t("sugar.sheet.arrears"),
                      value:
                        s.totalArrears == null ? null : (
                          <span style={{ color: s.totalArrears > 0 ? "var(--ftp-danger)" : "var(--ftp-live-text)", fontWeight: 600 }}>
                            {s.totalArrears > 0 ? m.crore(s.totalArrears / CRORE, 2) : t("sugar.paid")}
                          </span>
                        ),
                    },
                    { label: t("sugar.sheet.farmers"), value: s.farmersCount ? m.num(s.farmersCount) : null },
                    { label: t("sugar.sheet.started"), value: date(s.crushingStarted) },
                    { label: t("sugar.sheet.ended"), value: date(s.crushingEnded) },
                    { label: t("sheet.source"), value: s.source || null },
                  ]}
                />
              </div>
            ))}
          </div>
        </SheetSection>
      )}
      {fac.updatedAt && (
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>
          {t("sheet.updatedLine", { date: date(fac.updatedAt) ?? "" })}
        </p>
      )}
    </DetailSheet>
  );
}
