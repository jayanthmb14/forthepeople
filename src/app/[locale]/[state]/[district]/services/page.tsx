/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  How to get certificates — "How do I get this certificate or service,
//  what do I carry, what does it cost, and where do I go?"
//  (docs/LAYOUT.md recipe)
// ═══════════════════════════════════════════════════════════════════════
//
//  The answer: "We have 24 step-by-step guides for Mandya. 9 of them link
//  to an official page where you can apply online; for the rest, go to the
//  office named in the guide."
//
//  Order: PageHeader → Explainer → 4 tiles → the picture (10 laptops, lit
//  for the share you can start online, beside the four usual steps) →
//  search + kind chips → one card per guide. Tapping a card opens a
//  DetailSheet: where to go, fee, time taken, the guide's own steps as
//  pictures, a documents checklist to tick, the tip, and Apply online /
//  Find the office (Govt offices near you, searched for that office) →
//  link to Govt offices → charts (kinds of service, documents asked for
//  most) → news → sources.
//
//  Deep link: ?open=<guide id> opens that guide's sheet (the Govt offices
//  page links here). Data: useServices() (ServiceGuide rows; only active
//  ones are shown). Every word is in page_services (en / kn / hi); guide
//  names, offices, fees, documents and steps are data and stay as
//  published.
"use client";

import { use, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Briefcase } from "lucide-react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleNews from "@/components/district/ModuleNews";
import { useServices } from "@/hooks/useRealtimeData";
import type { ServiceGuide } from "@/hooks/useRealtimeData";
import { useDistrictName, useFormat, useModuleText } from "@/i18n/client";
import { Card, Chips, EmptyState, ErrorBlock, LoadingShell, ModulePage, PageHeader, Section, StatStrip, StatTile } from "@/components/district/ui";
import { ChartCard, Explainer, HowItWorks, Pictogram } from "@/components/district/visuals";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import { BarList, HueDonut, MUTED_SHADE, type DonutSegment } from "@/components/district/daily-services/HueCharts";
import {
  ActionLink,
  Checklist,
  Chip,
  LinkCard,
  MetaLine,
  PageEnd,
  SearchBox,
  SheetBlock,
  SheetNote,
  SheetSmall,
  TapCard,
  dataLang,
  extUrl,
  hostOf,
  searchRows,
} from "@/components/services-2/kit";

/** The API sends every column; the shared type leaves a few out. */
type Guide = ServiceGuide & { officeLocal?: string | null; onlinePortal?: string | null; updatedAt?: string | null };

/** How many categories the ring names before "Other kinds". */
const TOP_CATEGORIES = 5;
/** How many documents the bar list shows. */
const TOP_DOCUMENTS = 5;

const bold = (c: React.ReactNode) => <strong>{c}</strong>;

/** One emoji per guide, from keywords in its free-text category; 📄 otherwise. */
function categoryEmoji(category: string): string {
  const c = category.toLowerCase();
  if (/certif|caste|income|birth|death|domicile/.test(c)) return "📜";
  if (/land|revenue|property|survey|record/.test(c)) return "🗺️";
  if (/health|hospital|medical/.test(c)) return "🏥";
  if (/educat|school|scholar/.test(c)) return "🎓";
  if (/transport|licen|vehicle|driving/.test(c)) return "🚗";
  if (/water/.test(c)) return "🚰";
  if (/power|electric/.test(c)) return "⚡";
  if (/hous/.test(c)) return "🏠";
  if (/agri|farm/.test(c)) return "🌾";
  if (/police|safety/.test(c)) return "👮";
  if (/pension|welfare|social|ration/.test(c)) return "🤝";
  if (/tax|business|trade|shop/.test(c)) return "🧾";
  if (/identity|aadhaar|passport|voter/.test(c)) return "🪪";
  return "📄";
}

/** One picture per step of a guide, from words in the step (the step text stays as published). */
function stepEmoji(step: string): string {
  const s = step.toLowerCase();
  if (/\bpay|fee|₹|\brs\.?\s?\d|challan/.test(s)) return "💰";
  if (/verif|inspect|enquir|field visit|scrutin|check/.test(s)) return "🔎";
  if (/collect|issued|issue|deliver|receive|download|sms|certificate is|get your/.test(s)) return "✅";
  if (/document|upload|attach|photo|proof|aadhaar|copy of/.test(s)) return "📄";
  if (/online|website|portal|login|register|\bapp\b|seva|e-?district|mobile/.test(s)) return "💻";
  if (/visit|go to|office|counter|nadakacheri|tahsil|centre|center/.test(s)) return "🏢";
  if (/fill|form|apply|application/.test(s)) return "📝";
  return "👣";
}

/** The fee as published says it costs nothing ("Free", "Nil", "No fee"). */
function isFree(fees: string | null | undefined): boolean {
  return /^\s*(free|nil|no fee|free of cost)\s*\.?\s*$/i.test(fees ?? "");
}

/**
 * The documents most guides ask for. Each guide counts a document once;
 * names are matched ignoring case and extra spaces, and shown the way
 * they were first written. Only documents asked for by 2+ guides count.
 */
function topDocuments(guides: Guide[]): Array<{ key: string; label: string; count: number }> {
  const map = new Map<string, { label: string; count: number }>();
  for (const g of guides) {
    const seen = new Set<string>();
    for (const raw of g.documentsNeeded) {
      const label = raw.replace(/\s+/g, " ").trim();
      const key = label.toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const cur = map.get(key);
      if (cur) cur.count += 1;
      else map.set(key, { label, count: 1 });
    }
  }
  return [...map.entries()]
    .map(([key, v]) => ({ key, ...v }))
    .filter((d) => d.count >= 2)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, TOP_DOCUMENTS);
}

function ServicesPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const t = useTranslations("page_services");
  const f = useFormat();
  const mt = useModuleText();
  const districtName = useDistrictName(state, district);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data, isLoading, error } = useServices(district, state);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  // ?open=<id> from another page opens that guide straight away.
  const [openId, setOpenId] = useState<string | null>(() => searchParams.get("open"));

  const n = (v: number) => f.number(v);
  const pct = (share: number) => f.number(share, { style: "percent", maximumFractionDigits: 0 });

  const guides: Guide[] = ((data?.data ?? []) as Guide[]).filter((s) => s.active);
  const onlineCount = guides.filter((s) => Boolean(extUrl(s.onlineUrl))).length;
  const freeCount = guides.filter((s) => isFree(s.fees)).length;
  const officeCount = new Set(guides.map((s) => s.office.trim().toLowerCase()).filter(Boolean)).size;
  const onlineTenths = guides.length > 0 ? (onlineCount / guides.length) * 10 : 0;

  // Guides per category, biggest first (also the chip order).
  const categoryCounts = Object.entries(
    guides.reduce<Record<string, number>>((acc, s) => {
      acc[s.category] = (acc[s.category] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const byCategory = filter === "all" ? guides : guides.filter((s) => s.category === filter);
  const shown = searchRows(byCategory, search, (s) => [s.serviceName, s.serviceNameLocal, s.category, s.office, s.officeLocal]);

  // The ring: the top categories by name, the rest folded into "Other kinds".
  const otherCount = categoryCounts.slice(TOP_CATEGORIES).reduce((s, [, c]) => s + c, 0);
  const catSegments: DonutSegment[] = [
    ...categoryCounts.slice(0, TOP_CATEGORIES).map(([c, count]) => ({ key: c, label: c, value: count, display: n(count), emoji: categoryEmoji(c) })),
    ...(otherCount > 0 ? [{ key: "__other", label: t("cats.other"), value: otherCount, display: n(otherCount), emoji: "🗂️", color: MUTED_SHADE }] : []),
  ];
  const topCat = categoryCounts[0];
  const docs = topDocuments(guides);

  const open = guides.find((g) => g.id === openId) ?? null;
  const closeSheet = () => {
    setOpenId(null);
    // Drop ?open= so a refresh does not reopen the sheet.
    if (searchParams.get("open")) window.history.replaceState(null, "", pathname);
  };

  const openUrl = open ? extUrl(open.onlineUrl) : null;
  const officesHref = (office: string) => `${base}/offices?q=${encodeURIComponent(office)}`;

  return (
    <ModulePage>
      <PageHeader icon={Briefcase} emoji="🧾" title={mt.label("services")} description={t("description")} backHref={base} />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && guides.length === 0 && <NoDataCard module="services" district={district} state={state} />}

      {!isLoading && !error && guides.length > 0 && (
        <>
          {/* 2. The answer in one sentence. */}
          <Explainer emoji="🧭">
            {t.rich(onlineCount > 0 ? "explainer" : "explainerNone", { total: guides.length, online: n(onlineCount), district: districtName, b: bold })}
          </Explainer>

          {/* 3. Four big numbers. */}
          <StatStrip cols={4}>
            <StatTile emoji="📋" label={t("tiles.guides")} value={n(guides.length)} sub={t("tiles.guidesSub")} />
            <StatTile emoji="💻" label={t("tiles.online")} value={n(onlineCount)} sub={t("tiles.onlineSub")} />
            <StatTile emoji="🆓" label={t("tiles.free")} value={n(freeCount)} sub={t("tiles.freeSub")} />
            <StatTile emoji="🏢" label={t("tiles.offices")} value={n(officeCount)} sub={t("tiles.officesSub")} />
          </StatStrip>

          {/* 4. The picture: 10 laptops lit for the share you can start
              online, beside the four usual steps for any certificate. */}
          <div className="ftp-picture-row" style={{ marginTop: 16 }}>
            <Card tinted padding={18}>
              <p className="ftp-label" style={{ margin: "0 0 10px", color: "var(--hue-deep)" }}>
                {t("picture.title")}
              </p>
              <Pictogram filled={onlineTenths} emoji="💻" label={onlineCount === 0 ? t("pictogramNone") : t("pictogram", { n: Math.round(onlineTenths) })} />
            </Card>
            <Card tinted padding={18}>
              <HowItWorks
                title={t("usual.title")}
                steps={[
                  { emoji: "📄", title: t("usual.docs") },
                  { emoji: "📝", title: t("usual.apply") },
                  { emoji: "💰", title: t("usual.pay") },
                  { emoji: "✅", title: t("usual.collect") },
                ]}
              />
            </Card>
          </div>

          {/* 5. Find a guide; tap a card for everything. */}
          <Section title={t("list.title")} emoji="📋">
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <SearchBox id="guide-search" label={t("list.searchLabel")} placeholder={t("list.searchPlaceholder")} value={search} onChange={setSearch} />
              {categoryCounts.length > 1 && (
                <Chips
                  label={t("list.chipsLabel")}
                  value={filter}
                  onChange={setFilter}
                  items={[{ value: "all", label: t("list.all"), count: guides.length }, ...categoryCounts.map(([c, count]) => ({ value: c, label: c, count }))]}
                />
              )}
            </div>
            {shown.length === 0 ? (
              <EmptyState emoji="🔍" title={t("list.noMatch")} body={t("list.noMatchBody")} />
            ) : (
              <div className="ftp-grid">
                {shown.map((s) => (
                  <TapCard
                    key={s.id}
                    emoji={categoryEmoji(s.category)}
                    title={s.serviceName}
                    titleLang={dataLang(s.serviceName, locale)}
                    subtitle={s.serviceNameLocal ?? undefined}
                    subtitleLang={dataLang(s.serviceNameLocal, locale)}
                    hint={t("list.hint")}
                    onOpen={() => setOpenId(s.id)}
                  >
                    <MetaLine emoji="🏢" lang={dataLang(s.office, locale)}>
                      {s.office}
                    </MetaLine>
                    {s.fees && (
                      <MetaLine emoji="💰" lang={dataLang(s.fees, locale)} clamp={2}>
                        {s.fees}
                      </MetaLine>
                    )}
                    {s.timeline && (
                      <MetaLine emoji="⏱️" lang={dataLang(s.timeline, locale)} clamp={2}>
                        {s.timeline}
                      </MetaLine>
                    )}
                    <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {extUrl(s.onlineUrl) && <Chip emoji="💻">{t("list.online")}</Chip>}
                      {s.documentsNeeded.length > 0 && <Chip emoji="📄">{t("list.docs", { n: s.documentsNeeded.length })}</Chip>}
                      {s.steps.length > 0 && <Chip emoji="👣">{t("list.steps", { n: s.steps.length })}</Chip>}
                    </span>
                  </TapCard>
                ))}
              </div>
            )}
          </Section>

          <div style={{ marginTop: 20 }}>
            <LinkCard href={`${base}/offices`} emoji="🏢" title={t("toOffices.title")} body={t("toOffices.body")} />
          </div>

          {/* 6. Charts: which kinds of service, and which papers to carry. */}
          {(catSegments.length > 1 || docs.length > 0) && (
            <Section title={t("charts.title")} emoji="📊">
              <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "340px" }}>
                {catSegments.length > 1 && topCat && (
                  <ChartCard
                    title={t("cats.title")}
                    emoji="🗂️"
                    units={t("cats.units")}
                    simple={t.rich("cats.simple", { category: topCat[0], n: n(topCat[1]), total: n(guides.length), b: bold })}
                    table={catSegments.map((s) => ({ label: s.label, value: s.display }))}
                  >
                    <HueDonut segments={catSegments} center={n(guides.length)} centerSub={t("tiles.guides")} ariaLabel={t("cats.aria", { total: guides.length })} percentOf={pct} />
                  </ChartCard>
                )}
                {docs.length > 0 && (
                  <ChartCard
                    title={t("docs.title")}
                    emoji="📄"
                    units={t("docs.units")}
                    simple={t.rich("docs.simple", { doc: docs[0].label, n: n(docs[0].count), total: n(guides.length), b: bold })}
                    table={docs.map((d) => ({ label: d.label, value: t("docs.count", { n: n(d.count), total: n(guides.length) }) }))}
                  >
                    <BarList
                      items={docs.map((d) => ({
                        key: d.key,
                        label: d.label,
                        lang: dataLang(d.label, locale),
                        value: d.count,
                        display: t("docs.count", { n: n(d.count), total: n(guides.length) }),
                        emoji: "📄",
                      }))}
                    />
                  </ChartCard>
                )}
              </div>
            </Section>
          )}
        </>
      )}

      <ModuleNews district={district} state={state} locale={locale} module="services" />
      <PageEnd
        ns="page_services"
        sourceModule="services"
        moduleSlug="services"
        state={state}
        district={district}
        locale={locale}
        districtName={districtName}
        about={t("summary", { district: districtName })}
        shareText={t("share", { district: districtName, n: guides.length })}
      />

      {/* Everything about one guide. */}
      <DetailSheet
        open={!!open}
        onClose={closeSheet}
        title={open?.serviceName ?? ""}
        titleLang={open ? dataLang(open.serviceName, locale) : undefined}
        subtitle={open?.serviceNameLocal ? <span lang={dataLang(open.serviceNameLocal, locale)}>{open.serviceNameLocal}</span> : undefined}
        emoji={open ? categoryEmoji(open.category) : undefined}
        footer={
          open && (
            <>
              {openUrl && (
                <ActionLink href={openUrl} emoji="💻" primary newTab>
                  {t("sheet.apply")}
                </ActionLink>
              )}
              <ActionLink href={officesHref(open.office)} emoji="🏢" internal primary={!openUrl}>
                {t("sheet.findOffice")}
              </ActionLink>
            </>
          )
        }
      >
        {open && (
          <>
            <SheetNote emoji="🧭">
              {t.rich(openUrl ? "sheet.noteOnline" : "sheet.noteOffice", { office: open.office, docs: open.documentsNeeded.length, b: bold })}
            </SheetNote>
            <DetailList
              rows={[
                {
                  emoji: "🏢",
                  label: t("sheet.where"),
                  value: open.officeLocal && open.officeLocal !== open.office ? (
                    <>
                      {open.office}
                      <br />
                      <span lang={dataLang(open.officeLocal, locale)} style={{ color: "var(--hue-deep)" }}>
                        {open.officeLocal}
                      </span>
                    </>
                  ) : (
                    open.office
                  ),
                  lang: dataLang(open.office, locale),
                },
                { emoji: "💰", label: t("sheet.fee"), value: open.fees, lang: dataLang(open.fees, locale) },
                { emoji: "⏱️", label: t("sheet.time"), value: open.timeline, lang: dataLang(open.timeline, locale) },
                {
                  emoji: "💻",
                  label: t("sheet.online"),
                  value: openUrl ? (open.onlinePortal?.trim() || hostOf(openUrl)) : t("sheet.onlineNo"),
                },
                { emoji: "🗂️", label: t("sheet.kind"), value: open.category, lang: dataLang(open.category, locale) },
              ]}
            />

            {open.steps.length > 0 && (
              <SheetBlock emoji="👣" title={t("sheet.steps")}>
                <div lang={dataLang(open.steps[0], locale)}>
                  <HowItWorks steps={open.steps.map((s) => ({ emoji: stepEmoji(s), title: s }))} />
                </div>
              </SheetBlock>
            )}

            {open.documentsNeeded.length > 0 && (
              <SheetBlock emoji="📄" title={t("sheet.docs")}>
                <Checklist
                  key={open.id}
                  items={open.documentsNeeded}
                  lang={dataLang(open.documentsNeeded[0], locale)}
                  status={(done, total) => t("sheet.ready", { done, total })}
                />
              </SheetBlock>
            )}

            {open.tips && (
              <SheetBlock emoji="💡" title={t("sheet.tip")}>
                <p lang={dataLang(open.tips, locale)} className="ftp-body" style={{ margin: 0, fontSize: 14, lineHeight: "21px" }}>
                  {open.tips}
                </p>
              </SheetBlock>
            )}

            <SheetSmall>
              {t("sheet.check")}
              {open.updatedAt && (
                <>
                  {" · "}
                  <span suppressHydrationWarning>{t("sheet.updated", { date: f.date(open.updatedAt, { day: "numeric", month: "short", year: "numeric" }) })}</span>
                </>
              )}
            </SheetSmall>
          </>
        )}
      </DetailSheet>
    </ModulePage>
  );
}

export default function ServicesPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("services")}>
      <ServicesPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
