/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Famous people — "Who are the well-known people from my district?"
//  (docs/LAYOUT.md recipe; docs/MODULE-MAP.md "Know your district")
// ═══════════════════════════════════════════════════════════════════════
//
//  ModulePage → PageHeader → Explainer (how many, how many born here, the
//  biggest field) → 4 StatTiles → ONE picture: 10 people (Lucide), the ones
//  born here lit up → "Known for": a tile per field (name, count, a bar)
//  that is also the filter, plus search → the people as TapCards (photo or
//  initials, name, local name, years, field, one line of what
//  they are known for) in "Born in …" and "Linked to …" groups → tapping a
//  person opens a DetailSheet with the photo, the full biography, birth and
//  death years, birthplace, whether they were born here, field, the photo
//  credit and "Read on Wikipedia" → "When they were born": a dot per person
//  (tap a dot for that person) → AI summary → related news → Share /
//  Compare. Wikipedia (CC-BY-SA) is credited in the header and each sheet;
//  the page-wide sources list is the layout's verification panel.
//
//  i18n: page_famous-personalities (en / kn / hi). Names, bios, "known for"
//  lines and birthplaces are data, shown as saved (English on Wikipedia).
"use client";
import { use, useCallback, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ExternalLink, Search, Star, User } from "lucide-react";
import { useFamousPersonalities, type FamousPersonality } from "@/hooks/useRealtimeData";
import {
  ModulePage, PageHeader, Section, Card, StatStrip, StatTile, LoadingShell, ErrorBlock,
  EmptyState,
} from "@/components/district/ui";
import { ChartCard, Explainer } from "@/components/district/visuals";
import { IconPictogram, PageActions } from "@/components/district/page-kit";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import { TapCard } from "@/components/community/TapCard";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleNews from "@/components/district/ModuleNews";
import { hueClass } from "@/lib/design/hues";
import { useDistrictName, useFormat } from "@/i18n/client";

/** A person as the API returns them (bornInDistrict is set by the API). */
type Person = FamousPersonality & { bornInDistrict?: boolean };

/** The page_famous-personalities translator, handed to small helpers. */
type T = ReturnType<typeof useTranslations>;

/** Translated field name; an unknown field is shown as saved. */
function fieldLabel(t: T, category: string): string {
  const key = `fields.${category}`;
  return t.has(key) ? t(key) : category;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** The Wikipedia photo when there is one, else a soft tile with the person's initials. */
function Avatar({ p, size }: { p: Person; size: number }) {
  const [imgError, setImgError] = useState(false);
  const radius = Math.round(size * 0.26);
  if (p.photoUrl && !imgError) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          flexShrink: 0,
          overflow: "hidden",
          border: "2px solid color-mix(in srgb, var(--hue) 35%, var(--ftp-surface))",
          background: "var(--hue-tint)",
        }}
      >
        <Image
          src={p.photoUrl}
          alt=""
          width={size}
          height={size}
          onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          unoptimized
        />
      </div>
    );
  }
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flexShrink: 0,
        background: "var(--hue-tint)",
        border: "1px solid color-mix(in srgb, var(--hue) 25%, transparent)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <span style={{ fontSize: Math.max(12, Math.round(size * 0.3)), lineHeight: 1, fontWeight: 700, color: "var(--hue-deep)" }}>
        {initialsOf(p.name)}
      </span>
    </div>
  );
}

/** "1920–2001" or "Born 1947". Never claims someone is alive. */
function useYears() {
  const t = useTranslations("page_famous-personalities");
  return (p: Person): string | null => {
    if (!p.birthYear) return null;
    return p.deathYear ? t("yearsLived", { from: String(p.birthYear), to: String(p.deathYear) }) : t("yearsBorn", { from: String(p.birthYear) });
  };
}

/** The field as a small chip: "Art". */
function FieldChip({ category }: { category: string }) {
  const t = useTranslations("page_famous-personalities");
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 10px",
        borderRadius: 999,
        background: "#fff",
        border: "1px solid color-mix(in srgb, var(--hue) 30%, var(--ftp-border))",
        color: "var(--hue-deep)",
        fontSize: 12,
        lineHeight: "18px",
        fontWeight: 600,
      }}
    >
      {fieldLabel(t, category)}
    </span>
  );
}

/** One person as a card; tapping it opens the detail sheet. */
function PersonCard({ p, onOpen }: { p: Person; onOpen: (p: Person) => void }) {
  const t = useTranslations("page_famous-personalities");
  const years = useYears()(p);
  return (
    <TapCard
      onOpen={() => onOpen(p)}
      leading={<Avatar p={p} size={64} />}
      title={p.name}
      subtitle={
        <>
          {p.nameLocal && <span lang="und" style={{ color: "var(--hue-deep)", fontWeight: 600 }}>{p.nameLocal}</span>}
          {p.nameLocal && years && " · "}
          {years && <span className="ftp-num" style={{ fontWeight: 500 }}>{years}</span>}
        </>
      }
      hint={t("details")}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <FieldChip category={p.category} />
      </div>
      {(p.notable || p.bio) && (
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: "20px",
            color: "var(--ftp-text-2)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {p.notable ?? p.bio}
        </p>
      )}
    </TapCard>
  );
}

/** Everything about one person. */
function PersonSheet({ p, districtLabel, onClose }: { p: Person; districtLabel: string; onClose: () => void }) {
  const t = useTranslations("page_famous-personalities");
  const years = useYears()(p);
  return (
    <DetailSheet
      open
      onClose={onClose}
      title={p.name}
      subtitle={
        <>
          {p.nameLocal && <span lang="und" style={{ color: "var(--hue-deep)", fontWeight: 600 }}>{p.nameLocal}</span>}
          {p.nameLocal && years && " · "}
          {years && <span className="ftp-num">{years}</span>}
        </>
      }
      media={<Avatar p={p} size={72} />}
      hueClassName={hueClass("famous-personalities")}
      footer={
        p.wikiUrl ? (
          <a
            href={p.wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              minHeight: 44,
              padding: "0 16px",
              borderRadius: "var(--ftp-radius-tile)",
              background: "var(--hue)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 650,
              textDecoration: "none",
              flex: "1 1 auto",
            }}
          >
            {t("readWiki")}
            <ExternalLink size={14} aria-hidden />
          </a>
        ) : undefined
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <FieldChip category={p.category} />
      </div>
      {p.notable && (
        <p style={{ margin: 0, padding: "10px 12px", borderRadius: 12, background: "var(--ftp-surface)", border: "1px solid var(--ftp-border)", boxShadow: "inset 3px 0 0 var(--hue)", color: "var(--hue-deep)", fontSize: 14, lineHeight: "21px", fontWeight: 600 }}>
          {p.notable}
        </p>
      )}
      {p.bio && <p className="ftp-prose" style={{ margin: 0, fontSize: 15, lineHeight: "24px", color: "var(--ftp-text)" }}>{p.bio}</p>}
      <DetailList
        rows={[
          { label: t("sheet.born"), value: p.birthYear ? <span className="ftp-num">{p.birthYear}</span> : t("sheet.notRecorded") },
          { label: t("sheet.died"), value: p.deathYear ? <span className="ftp-num">{p.deathYear}</span> : null },
          { label: t("sheet.birthPlace"), value: p.birthPlace ?? t("sheet.notRecorded") },
          {
            label: t("sheet.bornHere", { name: districtLabel }),
            value: p.bornInDistrict ? t("sheet.yes") : t("sheet.noLinked"),
          },
          { label: t("sheet.photo"), value: p.photoUrl ? p.photoCredit ?? t("sheet.photoWiki") : null },
        ]}
      />
      <p style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)" }}>{t("sheet.license")}</p>
    </DetailSheet>
  );
}

/** One field tile ("Art 4"): part of the picture and the filter. */
function FieldTile({ label, count, total, active, onClick }: { label: string; count: number; total: number; active: boolean; onClick: () => void }) {
  const f = useFormat();
  const share = total > 0 ? count / total : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="ftp-card-link"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minHeight: 44,
        padding: "12px 12px 10px",
        borderRadius: 14,
        border: `${active ? 2 : 1}px solid ${active ? "var(--hue)" : "var(--ftp-border)"}`,
        background: active ? "var(--hue-tint)" : "var(--ftp-surface)",
        cursor: "pointer",
        textAlign: "start",
        font: "inherit",
        color: "var(--ftp-text)",
        minWidth: 0,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: "18px", fontWeight: 650, overflowWrap: "anywhere" }}>{label}</span>
        <span className="ftp-bignum" style={{ fontSize: 20, lineHeight: 1, color: "var(--hue-deep)" }}>{f.number(count)}</span>
      </span>
      <span aria-hidden style={{ height: 6, borderRadius: 99, background: "var(--ftp-surface-2)", overflow: "hidden" }}>
        <span className="ftp-grow-x" style={{ display: "block", height: "100%", width: `${Math.max(4, Math.round(share * 100))}%`, borderRadius: 99, background: "var(--hue)" }} />
      </span>
    </button>
  );
}

/**
 * BirthTimeline — one dot per person at the decade they were born (or the
 * century, when the list spans more than 600 years), stacked upwards.
 * Born-here dots are the page hue; the rest are lighter. Each dot is a
 * button that opens that person's sheet.
 */
function BirthTimeline({
  people,
  ariaLabel,
  onOpen,
}: {
  people: Array<Person & { birthYear: number }>;
  ariaLabel: string;
  onOpen: (p: Person) => void;
}) {
  const t = useTranslations("page_famous-personalities");
  const first = people[0].birthYear;
  const last = people[people.length - 1].birthYear;
  const step = last - first > 600 ? 100 : 10;
  const bucket = (y: number) => Math.floor(y / step) * step;
  const start = bucket(first);
  const cols = (bucket(last) - start) / step + 1;
  const columns: Array<Array<Person & { birthYear: number }>> = Array.from({ length: cols }, () => []);
  for (const p of people) columns[(bucket(p.birthYear) - start) / step].push(p);
  const maxRows = Math.max(...columns.map((c) => c.length));

  const colW = Math.max(14, Math.min(44, 620 / cols));
  const r = Math.min(colW * 0.38, 10);
  const rowH = r * 2 + 3;
  const padX = 16;
  const axisH = 26;
  const width = cols * colW + padX * 2;
  const baseY = maxRows * rowH + 10;
  const height = baseY + axisH;
  const labelEvery = cols <= 8 ? step : step === 10 ? 50 : 500;

  return (
    <svg role="group" aria-label={ariaLabel} viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", maxHeight: 320, display: "block" }}>
      <line x1={padX / 2} x2={width - padX / 2} y1={baseY} y2={baseY} stroke="var(--ftp-border-strong)" strokeWidth={1} />
      {columns.map((col, ci) => {
        const year = start + ci * step;
        const cx = padX + ci * colW + colW / 2;
        return (
          <g key={year}>
            {year % labelEvery === 0 && (
              <>
                <line x1={cx} x2={cx} y1={baseY} y2={baseY + 5} stroke="var(--ftp-border-strong)" strokeWidth={1} />
                <text x={cx} y={baseY + 18} textAnchor="middle" style={{ fontSize: 11, fill: "var(--ftp-text-2)", fontFamily: "var(--ftp-font-sans)" }}>
                  {year}
                </text>
              </>
            )}
            {col.map((p, i) => {
              const label = t("timelineDot", { name: p.name, year: String(p.birthYear) });
              return (
                <circle
                  key={p.id}
                  className="ftp-pop"
                  role="button"
                  tabIndex={0}
                  aria-label={label}
                  onClick={() => onOpen(p)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpen(p);
                    }
                  }}
                  cx={cx}
                  cy={baseY - r - 3 - i * rowH}
                  r={r}
                  fill={p.bornInDistrict ? "var(--hue)" : "var(--hue-pop)"}
                  stroke="#fff"
                  strokeWidth={1.5}
                  style={{ cursor: "pointer", transformBox: "fill-box", transformOrigin: "center", ["--i" as string]: ci }}
                >
                  <title>{label}</title>
                </circle>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

export default function FamousPersonalitiesPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_famous-personalities");
  const f = useFormat();
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useFamousPersonalities(district, state);
  const personalities = (data?.data ?? []) as Person[];
  const districtLabel = useDistrictName(state, district);

  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Person | null>(null);
  const close = useCallback(() => setSelected(null), []);

  // Fields, biggest first (counted from the list).
  const fieldCounts = Array.from(
    personalities.reduce((m, p) => m.set(p.category, (m.get(p.category) ?? 0) + 1), new Map<string, number>()),
    ([category, count]) => ({ category, count }),
  ).sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
  const activeField = filter === "all" || fieldCounts.some((c) => c.category === filter) ? filter : "all";

  const q = search.trim().toLowerCase();
  const filtered = personalities.filter((p) => {
    const matchCat = activeField === "all" || p.category === activeField;
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.nameLocal ?? "").toLowerCase().includes(q) ||
      p.bio.toLowerCase().includes(q) ||
      (p.notable ?? "").toLowerCase().includes(q) ||
      (p.birthPlace ?? "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });
  const bornHere = filtered.filter((p) => p.bornInDistrict === true);
  const rootsHere = filtered.filter((p) => p.bornInDistrict !== true);
  const bornTotal = personalities.filter((p) => p.bornInDistrict === true).length;
  const bornOfTen = personalities.length > 0 ? (bornTotal / personalities.length) * 10 : 0;
  const topFields = fieldCounts.slice(0, 3).map((fc) => fieldLabel(t, fc.category));

  // When they were born (people with a birth year).
  const dated = personalities
    .filter((p): p is Person & { birthYear: number } => typeof p.birthYear === "number")
    .sort((a, b) => a.birthYear - b.birthYear);
  const undated = personalities.length - dated.length;
  const firstBorn = dated[0];
  const lastBorn = dated[dated.length - 1];
  const showTimeline = dated.length >= 3 && firstBorn.birthYear !== lastBorn.birthYear;

  const bold = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;
  const listFormat = new Intl.ListFormat(f.intl, { style: "narrow", type: "unit" });

  return (
    <ModulePage>
      <PageHeader
        icon={Star}
        title={t("title")}
        description={t("description")}
        backHref={base}
        // The data date of the list (not the time the page was served).
        freshness={data?.meta?.lastUpdated ? { asOf: data.meta.lastUpdated, thresholdHours: 24 * 90 } : undefined}
        source={{ label: "Wikipedia (CC-BY-SA)", href: "https://en.wikipedia.org" }}
      />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && personalities.length === 0 && (
        <EmptyState title={t("noneListed", { name: districtLabel })} body={t("noneListedBody")} />
      )}

      {!isLoading && !error && personalities.length > 0 && (
        <>
          <Explainer>
            {t.rich("simple", {
              count: personalities.length,
              name: districtLabel,
              born: bornTotal,
              field: fieldCounts[0] ? fieldLabel(t, fieldCounts[0].category) : "",
              b: bold,
            })}
          </Explainer>

          <StatStrip cols={showTimeline ? 4 : 3}>
            <StatTile label={t("statPeople")} value={f.number(personalities.length)} />
            <StatTile label={t("statBorn", { name: districtLabel })} value={f.number(bornTotal)} />
            <StatTile label={t("statFields")} value={f.number(fieldCounts.length)} sub={topFields.length > 0 ? listFormat.format(topFields) : undefined} />
            {showTimeline && (
              <StatTile
                label={t("statYears")}
                value={`${firstBorn.birthYear}–${lastBorn.birthYear}`}
                countUp={false}
                sub={t("statYearsSub", { n: dated.length })}
              />
            )}
          </StatStrip>

          {/* The one picture: of every 10 people listed, how many were born here. */}
          {personalities.length >= 3 && (
            <div style={{ marginTop: 20 }}>
              <Card tinted padding={18}>
                <IconPictogram icon={User} filled={bornOfTen} label={t("bornPicto", { n: Math.round(bornOfTen), name: districtLabel })} />
              </Card>
            </div>
          )}

          {/* Known for: the field tiles (also the filter) and search. */}
          <Section title={t("knownFor")}>
            <div role="group" aria-label={t("filterLabel")} className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "160px", gap: 10 }}>
              <FieldTile label={t("all")} count={personalities.length} total={personalities.length} active={activeField === "all"} onClick={() => setFilter("all")} />
              {fieldCounts.map((fc) => (
                <FieldTile
                  key={fc.category}
                  label={fieldLabel(t, fc.category)}
                  count={fc.count}
                  total={personalities.length}
                  active={activeField === fc.category}
                  onClick={() => setFilter(fc.category)}
                />
              ))}
            </div>
            <label style={{ position: "relative", display: "block", marginTop: 14, maxWidth: 560 }}>
              <span className="sr-only">{t("searchLabel")}</span>
              <Search size={16} aria-hidden style={{ position: "absolute", insetInlineStart: 14, top: "50%", transform: "translateY(-50%)", color: "var(--hue)" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                type="search"
                style={{
                  width: "100%",
                  minHeight: 46,
                  paddingInline: "40px 14px",
                  border: "1px solid color-mix(in srgb, var(--hue) 25%, var(--ftp-border))",
                  borderRadius: 999,
                  fontFamily: "var(--ftp-font-sans)",
                  fontSize: 15,
                  color: "var(--ftp-text)",
                  background: "var(--ftp-surface)",
                  boxShadow: "var(--ftp-shadow-1)",
                  boxSizing: "border-box",
                }}
              />
            </label>
          </Section>

          {filtered.length === 0 && (
            <div style={{ marginTop: 20 }}>
              <EmptyState title={t("noneFound")} body={t("tryDifferent")} />
            </div>
          )}

          {bornHere.length > 0 && (
            <Section
              title={
                <>
                  {t("bornIn", { name: districtLabel })}{" "}
                  <span className="ftp-num" style={{ color: "var(--ftp-text-2)", fontWeight: 400 }}>{t("count", { n: f.number(bornHere.length) })}</span>
                </>
              }
            >
              <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "300px" }}>
                {bornHere.map((p) => (
                  <PersonCard key={p.id} p={p} onOpen={setSelected} />
                ))}
              </div>
            </Section>
          )}

          {rootsHere.length > 0 && (
            <Section
              title={
                <>
                  {t("associated", { name: districtLabel })}{" "}
                  <span className="ftp-num" style={{ color: "var(--ftp-text-2)", fontWeight: 400 }}>{t("count", { n: f.number(rootsHere.length) })}</span>
                </>
              }
            >
              <p className="ftp-prose" style={{ margin: "-4px 0 12px", fontSize: 14, lineHeight: "21px", color: "var(--ftp-text-2)" }}>
                {t("associatedBody", { name: districtLabel })}
              </p>
              <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "300px" }}>
                {rootsHere.map((p) => (
                  <PersonCard key={p.id} p={p} onOpen={setSelected} />
                ))}
              </div>
            </Section>
          )}

          {showTimeline && (
            <Section title={t("chartsTitle")}>
              <ChartCard
                title={t("timelineTitle")}
                units={lastBorn.birthYear - firstBorn.birthYear > 600 ? t("timelineUnitsCentury") : t("timelineUnits")}
                simple={t.rich("timelineSimple", {
                  first: String(firstBorn.birthYear),
                  firstName: firstBorn.name,
                  last: String(lastBorn.birthYear),
                  lastName: lastBorn.name,
                  b: bold,
                })}
                legend={[
                  ...(dated.some((p) => p.bornInDistrict) ? [{ label: t("bornIn", { name: districtLabel }), swatch: "var(--hue)" }] : []),
                  ...(dated.some((p) => !p.bornInDistrict) ? [{ label: t("associated", { name: districtLabel }), swatch: "var(--hue-pop)" }] : []),
                ]}
                source={{ label: "Wikipedia (CC-BY-SA)", href: "https://en.wikipedia.org" }}
                asOf={data?.meta?.lastUpdated}
                table={dated.map((p) => ({ label: p.name, value: String(p.birthYear) }))}
              >
                <BirthTimeline
                  people={dated}
                  onOpen={setSelected}
                  ariaLabel={t("timelineAria", { n: f.number(dated.length), first: String(firstBorn.birthYear), last: String(lastBorn.birthYear) })}
                />
                <p style={{ margin: "8px 0 0", fontSize: 12, lineHeight: "17px", color: "var(--ftp-text-2)" }}>
                  {t("timelineTap")}
                  {undated > 0 && <> {t("timelineMissing", { n: undated })}</>}
                </p>
              </ChartCard>
            </Section>
          )}
        </>
      )}

      {!isLoading && personalities.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <AIInsightCard module="famous-personalities" district={district} />
        </div>
      )}
      <ModuleNews district={district} state={state} locale={locale} module="famous-personalities" />
      <div style={{ marginTop: 28 }}>
        <PageActions locale={locale} district={district} moduleSlug="famous-personalities" />
      </div>

      {selected && <PersonSheet p={selected} districtLabel={districtLabel} onClose={close} />}
    </ModulePage>
  );
}
