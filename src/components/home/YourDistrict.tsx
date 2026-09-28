/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  YourDistrict — "Your district": pick one, see a few of its live figures
// ═══════════════════════════════════════════════════════════════════════
//
//   Your district
//   Pick a district to see a few of its latest figures.
//   (Bengaluru Urban) (Chennai) (Hyderabad) (Mandya) …        ← tabs
//   ┌ panel ───────────────────────────────────────────────────────────┐
//   │ Mandya · Karnataka                    [Open Mandya dashboard →]  │
//   │ ┌ Weather now ┐ ┌ Latest news ──┐ ┌ District head ┐ ┌ Report card ┐ │
//   │ │ (pic) 27°   │ │ Headline …    │ │ Dr Kumar      │ │ B+          │ │
//   │ │ Partly…     │ │               │ │ Deputy Comm…  │ │ 71 out of 100│ │
//   │ │ Open-Meteo ·│ │ The Hindu · 2h│ │ Checked 12 Sep│ │ Sep 2026    │ │
//   │ └─────────────┘ └───────────────┘ └───────────────┘ └─────────────┘ │
//   └──────────────────────────────────────────────────────────────────┘
//
//  The June site's "Live data right now" chip tabs, in the new look. The
//  tabs are every live district the page loaded from the database (never a
//  typed list). Each card links to its dashboard page and reads the same
//  public APIs those pages use:
//    Weather now    /api/data/weather + /api/data/forecast, the overview
//                   tile's rule (your-district.ts → pickWeatherNow)
//    Latest news    /api/data/news (the stored translation on /hi, /kn)
//    District head  /api/data/leaders (src/lib/leader-roles.ts), with the
//                   date the name was last checked
//    Report card    /api/data/glance — only while the grade is current
//  Every card shows its source or date. A call that fails or comes back
//  empty shows "Not available right now" — never a guessed number. Nothing
//  is fetched until the section is near the screen. Tabs: arrow keys,
//  Home and End move between districts (role=tablist); the panel
//  cross-fades in 140 ms (none under "reduce motion").
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ArrowRight, ClipboardCheck, Newspaper, Thermometer, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useDistrictData } from "@/hooks/useDistrictData";
import type { Leader, NewsItem, WeatherReading } from "@/hooks/useRealtimeData";
import type { GlanceData } from "@/components/district/shell/glance-types";
import { useForecast } from "@/lib/weather/use-forecast";
import { FORECAST_SOURCES } from "@/lib/weather/forecast";
import { WeatherArt } from "@/components/weather/WeatherArt";
import { useWeatherText } from "@/components/weather/useWeatherText";
import { getDistrict } from "@/lib/constants/districts";
import { placeName } from "@/i18n/place-name";
import { useFormat, usePlaceText } from "@/i18n/client";
import { useMinute } from "./home-clock";
import { pickDistrictHead, pickHeadline, pickWeatherNow } from "./your-district";
import type { HomeDistrict } from "./home-types";
import styles from "./home.module.css";

type CardState = "loading" | "empty" | "ready";

export default function YourDistrict({ locale, districts }: { locale: string; districts: HomeDistrict[] }) {
  const t = useTranslations("page_home");
  const place = usePlaceText();
  const [active, setActive] = useState(0);
  const [near, setNear] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Fetch only when the section is close to the screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (districts.length === 0) return null;
  const idx = Math.min(active, districts.length - 1);
  const d = districts[idx];
  const nameOf = (x: HomeDistrict) => {
    const reg = getDistrict(x.stateSlug, x.slug);
    return reg ? placeName(reg, locale) : x.name;
  };
  const name = nameOf(d);

  const select = (i: number) => {
    const n = (i + districts.length) % districts.length;
    setActive(n);
    tabRefs.current[n]?.focus();
  };
  const onKey = (e: React.KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowRight: idx + 1, ArrowDown: idx + 1, ArrowLeft: idx - 1, ArrowUp: idx - 1, Home: 0, End: districts.length - 1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    select(keys[e.key]);
  };

  return (
    <section ref={sectionRef} aria-labelledby="home-yours" className={styles.bandAlt} data-reveal>
      <div className="ftp-container">
        <div className={styles.sectionHead}>
          <h2 id="home-yours" className={styles.h2}>
            {t("yours.title")}
          </h2>
          <p className={styles.sectionNote}>{t("yours.lead")}</p>
        </div>

        <div role="tablist" aria-label={t("yours.tabs")} className={styles.ydTabs} onKeyDown={onKey}>
          {districts.map((x, i) => (
            <button
              key={`${x.stateSlug}/${x.slug}`}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`yd-tab-${x.slug}`}
              aria-selected={i === idx}
              aria-controls="yd-panel"
              tabIndex={i === idx ? 0 : -1}
              className={styles.ydTab}
              onClick={() => setActive(i)}
            >
              {nameOf(x)}
            </button>
          ))}
        </div>

        <div role="tabpanel" id="yd-panel" aria-labelledby={`yd-tab-${d.slug}`} className={styles.ydPanel} key={`${d.stateSlug}/${d.slug}`}>
          <div className={styles.ydHead}>
            <p className={styles.ydName}>
              <strong>{name}</strong>
              <span className={styles.ydState}>{place.state(d.stateSlug, d.stateName)}</span>
            </p>
            <Link href={`/${locale}/${d.stateSlug}/${d.slug}`} className={styles.ydOpen}>
              {t("yours.open", { name })}
              <ArrowRight size={17} aria-hidden />
            </Link>
          </div>
          <DistrictCards locale={locale} stateSlug={near ? d.stateSlug : ""} districtSlug={d.slug} realState={d.stateSlug} />
        </div>
      </div>
    </section>
  );
}

/** The four cards for one district. `stateSlug` is empty until the section is near the screen (no fetch yet). */
function DistrictCards({ locale, stateSlug, districtSlug, realState }: { locale: string; stateSlug: string; districtSlug: string; realState: string }) {
  const t = useTranslations("page_home");
  const f = useFormat();
  const w = useWeatherText();
  const minute = useMinute();
  const base = `/${locale}/${realState}/${districtSlug}`;

  const weather = useDistrictData<WeatherReading[]>("weather", districtSlug, stateSlug);
  const forecast = useForecast(stateSlug, stateSlug ? districtSlug : "");
  const news = useDistrictData<NewsItem[]>("news", districtSlug, stateSlug);
  const leaders = useDistrictData<Leader[]>("leaders", districtSlug, stateSlug);
  const glance = useQuery<GlanceData>({
    queryKey: ["glance", stateSlug, districtSlug],
    queryFn: async () => {
      const res = await fetch(`/api/data/glance?district=${encodeURIComponent(districtSlug)}&state=${encodeURIComponent(stateSlug)}`);
      if (!res.ok) throw new Error(`glance ${res.status}`);
      return res.json();
    },
    enabled: Boolean(stateSlug),
    staleTime: 10 * 60_000,
  });

  const waiting = !stateSlug;
  const state = (q: { isPending: boolean; isError: boolean }, ready: boolean): CardState =>
    ready ? "ready" : waiting || (q.isPending && !q.isError) ? "loading" : "empty";

  // Weather now
  const primary = forecast.data?.primary ?? null;
  const now =
    minute === null
      ? null
      : pickWeatherNow(weather.data?.data?.[0], primary?.current ?? null, primary ? FORECAST_SOURCES[primary.source].label : null, minute);
  const weatherState: CardState = now
    ? "ready"
    : waiting || minute === null || (weather.isPending && !weather.isError) || (forecast.isPending && !forecast.isError)
      ? "loading"
      : "empty";

  const story = pickHeadline(news.data?.data);
  const head = pickDistrictHead(leaders.data?.data);
  const grade = glance.data?.grade ?? null;

  return (
    <ul className={styles.ydGrid}>
      <Card href={`${base}/weather`} icon={Thermometer} title={t("yours.weather")} state={weatherState} loading={t("yours.loading")} empty={t("yours.empty")}>
        {now && (
          <>
            <span className={styles.ydWeather}>
              <WeatherArt kind={now.kind} night={now.night} size={36} />
              <span className={styles.ydValue}>{w.deg(now.temp)}</span>
            </span>
            <span className={styles.ydSub}>{w.kindLabel(now.kind, now.night)}</span>
            <span className={styles.ydFoot}>{t("yours.sourceTime", { source: now.source, time: w.time(now.time) })}</span>
          </>
        )}
      </Card>

      <Card href={`${base}/news`} icon={Newspaper} title={t("yours.news")} state={state(news, Boolean(story))} loading={t("yours.loading")} empty={t("yours.empty")}>
        {story && (
          <>
            <span className={styles.ydHeadline}>{story.title}</span>
            <span className={styles.ydFoot}>
              {story.source ? `${story.source} · ` : ""}
              {f.ago(story.publishedAt)}
            </span>
          </>
        )}
      </Card>

      <Card href={`${base}/leadership`} icon={UserRound} title={t("yours.head")} state={state(leaders, Boolean(head))} loading={t("yours.loading")} empty={t("yours.empty")}>
        {head && (
          <>
            <span className={styles.ydPerson}>
              {head.leader.name}
              {head.more > 0 && <span className={styles.ydMore}>+{f.number(head.more)}</span>}
            </span>
            <span className={styles.ydSub} lang={head.leader.roleLocal && locale !== "en" ? undefined : "en"}>
              {(locale !== "en" && head.leader.roleLocal) || head.leader.role}
            </span>
            <span className={styles.ydFoot}>
              {head.leader.lastVerifiedAt
                ? t("yours.checked", { date: f.date(head.leader.lastVerifiedAt, { day: "numeric", month: "short", year: "numeric" }) })
                : t("yours.undated")}
            </span>
          </>
        )}
      </Card>

      <Card href={`${base}#health-score`} icon={ClipboardCheck} title={t("yours.grade")} state={state(glance, Boolean(grade))} loading={t("yours.loading")} empty={t("yours.empty")}>
        {grade && (
          <>
            <span className={styles.ydValue}>{grade.grade}</span>
            <span className={styles.ydSub}>{t("yours.gradeScore", { score: f.number(grade.score, { maximumFractionDigits: 1 }) })}</span>
            <span className={styles.ydFoot}>{f.date(grade.generatedAt, { month: "short", year: "numeric" })}</span>
          </>
        )}
      </Card>
    </ul>
  );
}

function Card({
  href,
  icon: Icon,
  title,
  state,
  loading,
  empty,
  children,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  state: CardState;
  loading: string;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <li className={styles.ydItem}>
      <Link href={href} className={styles.ydCard} aria-busy={state === "loading" || undefined}>
        <span className={styles.ydCardHead}>
          <span className={styles.ydIcon} aria-hidden>
            <Icon size={16} />
          </span>
          {title}
        </span>
        {state === "ready" ? (
          children
        ) : state === "loading" ? (
          <span className={styles.ydSkeleton}>
            <span className="sr-only">{loading}</span>
          </span>
        ) : (
          <span className={styles.ydEmpty}>{empty}</span>
        )}
      </Link>
    </li>
  );
}
