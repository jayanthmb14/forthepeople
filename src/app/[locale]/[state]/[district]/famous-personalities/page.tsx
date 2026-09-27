/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Famous Personalities — Design v4 "Rang" module page (docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  PageHeader → AI summary → StatStrip of emoji tiles → the pictures, all
//  counted from the list below:
//    · an "In simple words" line, a pictogram of how many were born here,
//      and one bar per field;
//    · "When they were born": one dot per person at the decade (or, for
//      very long spans, the century) of their birth, born-here dots in the
//      page hue and the rest lighter, with a table view.
//  → search + field Chips → "Born in <district>" and "Associated with
//  <district>" card grids → SourcesFooter (Wikipedia, CC-BY-SA) → related
//  news → Toolbar.
//
//  Avatars: the Wikipedia photo when there is one, otherwise a tile in the
//  page hue with the emoji for the person's field and their initials.
//
//  i18n: interface text and field names are in page_famous-personalities
//  (en + kn). Names, bios, "notable for" lines and birthplaces are data
//  and are shown as saved.
//
"use client";
import { use, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ExternalLink, MapPin, Search, Share2, GitCompare, Star } from "lucide-react";
import { useFamousPersonalities, type FamousPersonality } from "@/hooks/useRealtimeData";
import {
  PageHeader, Section, Card, Chips, StatStrip, StatTile, LoadingShell, ErrorBlock,
  EmptyState, ProgressBar, SourcesFooter, Toolbar, ToolbarButton,
} from "@/components/district/ui";
import { ChartCard, Explainer, Pictogram } from "@/components/district/visuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleNews from "@/components/district/ModuleNews";
import { useDistrictName } from "@/components/community/usePlaceName";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { useFormat } from "@/i18n/client";

/** A person as the API returns them (bornInDistrict is set by the API). */
type Person = FamousPersonality & { bornInDistrict?: boolean };

/** The page_famous-personalities translator, handed to small helpers. */
type T = ReturnType<typeof useTranslations>;

// Field → emoji (shown on the initials avatar, the field chip and the bars).
const CATEGORY_EMOJI: Record<string, string> = {
  Politician: "🏛️",
  Scientist:  "🔬",
  Artist:     "🎨",
  Writer:     "✍️",
  Athlete:    "🏅",
  Activist:   "📣",
  Business:   "💼",
  Military:   "🎖️",
  Spiritual:  "🙏",
  Educator:   "📚",
  Film:       "🎬",
  Music:      "🎵",
  Other:      "🌟",
};

/** Emoji for a field; unknown fields get the module star. */
function fieldEmoji(category: string): string {
  return CATEGORY_EMOJI[category] ?? "🌟";
}

/** Translated field name; an unknown field is shown as saved. */
function fieldLabel(t: T, category: string): string {
  const key = `fields.${category}`;
  return t.has(key) ? t(key) : category;
}

function PersonalityAvatar({
  name,
  photoUrl,
  category,
}: {
  name: string;
  photoUrl?: string | null;
  category: string;
}) {
  const [imgError, setImgError] = useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (photoUrl && !imgError) {
    return (
      <div
        style={{
          width: 76, height: 76, borderRadius: 18, flexShrink: 0,
          overflow: "hidden",
          border: "2px solid color-mix(in srgb, var(--hue) 35%, #fff)",
          background: "var(--hue-tint)",
          boxShadow: "0 8px 18px -12px color-mix(in srgb, var(--hue) 80%, transparent)",
        }}
      >
        <Image
          src={photoUrl}
          alt={name}
          width={76}
          height={76}
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
        width: 76, height: 76, borderRadius: 18, flexShrink: 0,
        background: "linear-gradient(135deg, var(--hue-tint) 0%, color-mix(in srgb, var(--hue-pop) 50%, #fff) 100%)",
        border: "1px solid color-mix(in srgb, var(--hue) 25%, transparent)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 4,
      }}
    >
      <span className="ftp-emoji" style={{ fontSize: 26 }}>{fieldEmoji(category)}</span>
      <span className="ftp-display" style={{ fontSize: 12, lineHeight: "14px", fontWeight: 700, color: "var(--hue-deep)" }}>{initials}</span>
    </div>
  );
}

function PersonalityCard({ p }: { p: Person }) {
  const t = useTranslations("page_famous-personalities");
  return (
    <Card as="article" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header: avatar + name */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <PersonalityAvatar name={p.name} photoUrl={p.photoUrl} category={p.category} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="ftp-display" style={{ margin: 0, fontSize: 17, lineHeight: "23px", fontWeight: 650, color: "var(--ftp-text)" }}>{p.name}</h3>
          {p.nameLocal && (
            <div lang="und" style={{ fontSize: 14, lineHeight: "20px", color: "var(--hue-deep)", marginTop: 2 }}>
              {p.nameLocal}
            </div>
          )}
          {/* Years and birthplace */}
          {p.birthYear && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 4 }}>
              <span className="ftp-num" style={{ fontWeight: 500 }}>
                {p.deathYear
                  ? t("yearsLived", { from: String(p.birthYear), to: String(p.deathYear) })
                  : t("yearsPresent", { from: String(p.birthYear) })}
              </span>
              {p.birthPlace && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <MapPin size={12} aria-hidden style={{ color: "var(--hue)" }} />
                  {p.birthPlace}
                </span>
              )}
            </div>
          )}
          {/* Field chip + notable for */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
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
              <span className="ftp-emoji" aria-hidden style={{ fontSize: 13 }}>{fieldEmoji(p.category)}</span>
              {fieldLabel(t, p.category)}
            </span>
            {p.notable && (
              <span
                style={{
                  display: "inline-block",
                  padding: "3px 10px",
                  borderRadius: 12,
                  background: "var(--hue-tint)",
                  color: "var(--hue-deep)",
                  fontSize: 12,
                  lineHeight: "18px",
                  fontWeight: 600,
                }}
              >
                {p.notable}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{p.bio}</p>

      {/* Wikipedia link */}
      {p.wikiUrl && (
        <a
          href={p.wikiUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, minHeight: 32,
            fontSize: 13, fontWeight: 600, color: "var(--hue-deep)", textDecoration: "none",
          }}
        >
          <ExternalLink size={14} aria-hidden style={{ color: "var(--hue)" }} /> {t("readWiki")}
        </a>
      )}

      {/* Photo credit */}
      {p.photoCredit && (
        <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
          {t("photoCredit", { credit: p.photoCredit })}
        </div>
      )}
    </Card>
  );
}

/**
 * BirthTimeline — one dot per person at the decade they were born (or the
 * century, when the list spans more than 600 years), stacked upwards.
 * Born-here dots are the page hue; the rest use the lighter pop shade.
 * Hovering a dot shows the name and year.
 */
function BirthTimeline({ people, ariaLabel }: { people: Array<Person & { birthYear: number }>; ariaLabel: string }) {
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

  const colW = Math.max(12, Math.min(44, 620 / cols));
  const r = Math.min(colW * 0.36, 9);
  const rowH = r * 2 + 3;
  const padX = 16;
  const axisH = 26;
  const width = cols * colW + padX * 2;
  const baseY = maxRows * rowH + 10;
  const height = baseY + axisH;
  // Year labels: every column when there are few, else every 50 / 500 years.
  const labelEvery = cols <= 8 ? step : step === 10 ? 50 : 500;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", minWidth: Math.min(width, 520), height: "auto", maxHeight: 320, display: "block" }}
      >
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
              {col.map((p, i) => (
                <circle
                  key={p.id}
                  className="ftp-pop"
                  cx={cx}
                  cy={baseY - r - 3 - i * rowH}
                  r={r}
                  fill={p.bornInDistrict ? "var(--hue)" : "var(--hue-pop)"}
                  stroke="#fff"
                  strokeWidth={1.5}
                  style={{ transformBox: "fill-box", transformOrigin: "center", ["--i" as string]: ci }}
                >
                  <title>{t("timelineDot", { name: p.name, year: String(p.birthYear) })}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Share button: the phone's share sheet when available, else copy the link. */
function SharePageButton() {
  const tf = useTranslations("pageFooter");
  const [copied, setCopied] = useState(false);
  function share() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: document.title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => {});
    }
  }
  return <ToolbarButton icon={Share2} onClick={share}>{copied ? tf("copied") : tf("share")}</ToolbarButton>;
}

export default function FamousPersonalitiesPage({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string }>;
}) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_famous-personalities");
  const f = useFormat();
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useFamousPersonalities(district, state);
  const personalities = (data?.data ?? []) as Person[];
  const districtLabel = useDistrictName(state, district);

  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const categories = Array.from(new Set(personalities.map((p) => p.category))).sort();

  const filtered = personalities.filter((p) => {
    const matchCat = filter === "all" || p.category === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(q) ||
      (p.nameLocal ?? "").toLowerCase().includes(q) ||
      p.bio.toLowerCase().includes(q) ||
      (p.notable ?? "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  // Split into born in district vs roots in district
  const bornHere = filtered.filter((p) => p.bornInDistrict === true);
  const rootsHere = filtered.filter((p) => p.bornInDistrict !== true);
  const bornTotal = personalities.filter((p) => p.bornInDistrict === true).length;

  const gridCols = "repeat(auto-fill, minmax(min(300px, 100%), 1fr))";

  // Picture 1: people per field, biggest first (counted from the list).
  const fieldCounts = categories
    .map((cat) => ({ category: cat, count: personalities.filter((p) => p.category === cat).length }))
    .sort((a, b) => b.count - a.count);
  const topFields = fieldCounts.slice(0, 3).map((fc) => fieldLabel(t, fc.category));
  const bornOfTen = personalities.length > 0 ? (bornTotal / personalities.length) * 10 : 0;
  // A "N of every 10" picture needs a few people behind it.
  const showPicture = personalities.length >= 3;

  // Picture 2: when they were born (only people with a birth year).
  const dated = personalities
    .filter((p): p is Person & { birthYear: number } => typeof p.birthYear === "number")
    .sort((a, b) => a.birthYear - b.birthYear);
  const undated = personalities.length - dated.length;
  const showTimeline = dated.length >= 3 && dated[0].birthYear !== dated[dated.length - 1].birthYear;
  const firstBorn = dated[0];
  const lastBorn = dated[dated.length - 1];

  const bold = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;

  return (
    <div className="ftp-container" style={{ maxWidth: "var(--ftp-reading-max)", margin: 0, paddingTop: 24, paddingBottom: 48 }}>
      <PageHeader
        icon={Star}
        title={t("title")}
        description={t("description")}
        backHref={base}
        accent={getModuleAccent("famous-personalities")}
        // The data date of the list (not the time the page was served).
        freshness={data?.meta?.lastUpdated ? { asOf: data.meta.lastUpdated } : undefined}
        source={{ label: "Wikipedia (CC-BY-SA)" }}
      />
      <AIInsightCard module="famous-personalities" district={district} />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && (
        <>
          {personalities.length > 0 && (
            <StatStrip cols={3}>
              <StatTile emoji="🌟" label={t("statPeople")} value={f.number(personalities.length)} />
              <StatTile emoji="🏡" label={t("statBorn", { name: districtLabel })} value={f.number(bornTotal)} />
              <StatTile
                emoji="🧭"
                label={t("statFields")}
                value={f.number(categories.length)}
                sub={topFields.length > 0 ? new Intl.ListFormat(f.intl, { style: "narrow", type: "unit" }).format(topFields) : undefined}
              />
            </StatStrip>
          )}

          {showPicture && (
            <div className="ftp-picture-row" style={{ marginTop: 16 }}>
              <Card tinted padding={18}>
                <Explainer emoji="🌟">
                  {t.rich("simple", { count: personalities.length, name: districtLabel, born: bornTotal, b: bold })}
                </Explainer>
                <Pictogram filled={bornOfTen} emoji="🧑" label={t("bornPicto", { n: Math.round(bornOfTen), name: districtLabel })} />
              </Card>
              <Card tinted padding={18}>
                <p className="ftp-display" style={{ margin: "0 0 12px", fontSize: 16, lineHeight: "22px", fontWeight: 650, color: "var(--hue-deep)" }}>
                  {t("knownFor")}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {fieldCounts.slice(0, 5).map((fc) => (
                    <div key={fc.category} style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                      <span className="ftp-emoji" aria-hidden style={{ fontSize: 18, marginBottom: 1 }}>{fieldEmoji(fc.category)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <ProgressBar
                          value={fc.count}
                          max={personalities.length}
                          label={t("fieldBar", { field: fieldLabel(t, fc.category), n: f.number(fc.count) })}
                          height={8}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {fieldCounts.length > 5 && (
                  <p style={{ margin: "10px 0 0", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                    {t("moreFields", { n: fieldCounts.length - 5 })}
                  </p>
                )}
              </Card>
            </div>
          )}

          {showTimeline && firstBorn && lastBorn && (
            <div style={{ marginTop: 16 }}>
              <ChartCard
                title={t("timelineTitle")}
                emoji="🕰️"
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
                  ariaLabel={t("timelineAria", {
                    n: f.number(dated.length),
                    first: String(firstBorn.birthYear),
                    last: String(lastBorn.birthYear),
                  })}
                />
                {undated > 0 && (
                  <p style={{ margin: "8px 0 0", fontSize: 12, lineHeight: "17px", color: "var(--ftp-text-2)" }}>
                    {t("timelineMissing", { n: undated })}
                  </p>
                )}
              </ChartCard>
            </div>
          )}

          {/* Search + filter bar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, margin: "20px 0 4px" }}>
            <label style={{ position: "relative", display: "block" }}>
              <span className="sr-only">{t("searchLabel")}</span>
              <Search
                size={16}
                aria-hidden
                style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--hue)" }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                type="search"
                style={{
                  width: "100%", minHeight: 46, padding: "0 14px 0 40px",
                  border: "1px solid color-mix(in srgb, var(--hue) 25%, var(--ftp-border))", borderRadius: 999,
                  fontFamily: "var(--ftp-font-sans)", fontSize: 14,
                  color: "var(--ftp-text)", background: "var(--ftp-surface)",
                  boxShadow: "var(--ftp-shadow-1)",
                }}
              />
            </label>
            {categories.length > 0 && (
              <Chips
                label={t("filterLabel")}
                value={filter}
                onChange={setFilter}
                items={[
                  { value: "all", label: t("all"), count: personalities.length },
                  ...categories.map((cat) => ({
                    value: cat,
                    label: fieldLabel(t, cat),
                    count: personalities.filter((p) => p.category === cat).length,
                  })),
                ]}
              />
            )}
          </div>

          {filtered.length === 0 && (
            <div style={{ marginTop: 20 }}>
              <EmptyState
                emoji={personalities.length === 0 ? "🌟" : "🔍"}
                title={personalities.length === 0 ? t("noneListed", { name: districtLabel }) : t("noneFound")}
                body={personalities.length === 0 ? undefined : t("tryDifferent")}
              />
            </div>
          )}

          {/* Section 1: Born in district */}
          {bornHere.length > 0 && (
            <Section
              emoji="🏡"
              title={
                <>
                  {t("bornIn", { name: districtLabel })}{" "}
                  <span className="ftp-num" style={{ color: "var(--ftp-text-2)", fontWeight: 400 }}>{t("count", { n: f.number(bornHere.length) })}</span>
                </>
              }
            >
              <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 12 }}>
                {bornHere.map((p) => (
                  <PersonalityCard key={p.id} p={p} />
                ))}
              </div>
            </Section>
          )}

          {/* Section 2: Roots in / associated with district */}
          {rootsHere.length > 0 && (
            <Section
              emoji="🔗"
              title={
                <>
                  {t("associated", { name: districtLabel })}{" "}
                  <span className="ftp-num" style={{ color: "var(--ftp-text-2)", fontWeight: 400 }}>{t("count", { n: f.number(rootsHere.length) })}</span>
                </>
              }
            >
              <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 12 }}>
                {t("associatedBody", { name: districtLabel })}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 12 }}>
                {rootsHere.map((p) => (
                  <PersonalityCard key={p.id} p={p} />
                ))}
              </div>
            </Section>
          )}
        </>
      )}

      <SourcesFooter
        sources={[{ name: "Wikipedia (CC-BY-SA)", url: "https://en.wikipedia.org", frequency: t("frequency") }]}
      />
      <ModuleNews district={district} state={state} locale={locale} module="famous-personalities" />
      <Toolbar>
        <SharePageButton />
        <ToolbarButton icon={GitCompare} href={`/${locale}/compare?module=famous-personalities&a=${district}`}>
          {t("compare")}
        </ToolbarButton>
      </Toolbar>
    </div>
  );
}
