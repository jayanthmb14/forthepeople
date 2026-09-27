/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  DistrictBar — the ONE bar under the site header on every district page
// ═══════════════════════════════════════════════════════════════════════
//
//   PC     [ Karnataka ▾ › Mandya ▾ › All taluks ▾ ]   Sunday, 27 Sep 2026 · 9:42 pm IST   ● 3 of 5 live feeds up to date
//   Phone  [ Karnataka ▾ › Mandya ▾ › All taluks ▾ ]  [ Topics / Weather & rain ▾ ]
//          Sun, 27 Sep · 9:42 pm IST            ● 3 of 5 live feeds up to date   (thin line, scrolls away)
//
//  • 48 px, sticky right under the 56 px header on every width.
//  • Left: state › district › taluk switchers (DistrictBreadcrumb, bar
//    variant). Phones and tablets switch in a bottom sheet, PCs in a
//    dropdown. On a phone the crumbs scroll sideways inside the bar.
//  • Right, below 1024 px (no sidebar): one button that shows the page you
//    are on and opens the topics drawer (MobileDistrictDrawer).
//  • Right, from 1024 px (v5.1): the day, date and time in India (a clock
//    that ticks once a minute, useMinuteClock) and the live-feed summary —
//    a green dot when all fast feeds are current, amber when any is late.
//    Hover or focus shows each feed with its age; the link jumps to the
//    verification section (#verify).
//  • Below 1024 px the same two details sit in one thin line under the bar
//    (not sticky), in short form.
//
//  Replaces (v5): the per-second ticking clock / always-red "Data behind"
//  strip, the phone breadcrumb strip, the module bar that also showed on
//  PCs, and the breadcrumb inside the site header.
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, ChevronDown } from "lucide-react";
import DistrictBreadcrumb from "@/components/district/DistrictBreadcrumb";
import { MobileDistrictDrawer } from "@/components/district/MobileDistrictDrawer";
import { INDIA_STATES, getDistrict, getState } from "@/lib/constants/districts";
import { getStateConfig } from "@/lib/constants/state-config";
import { placeName } from "@/i18n/place-name";
import { useFormat, useModuleText, usePlaceText } from "@/i18n/client";
import { useFreshness, type DatasetFreshness, type FreshnessResult } from "@/hooks/useFreshness";
import { LIVE_FEED_KEYS } from "@/lib/freshness";
import { districtRoute } from "./path";
import { useMinuteClock } from "./useIstClock";

/** Window event other entry points can fire to open the topics drawer. */
export const OPEN_MODULES_EVENT = "ftp:open-modules-drawer";

interface Props {
  locale: string;
  stateSlug: string;
  districtSlug: string;
}

// Module-scope builders (plain functions, no hooks).
function peerStates() {
  return INDIA_STATES.map((s) => ({
    slug: s.slug,
    name: s.name,
    nameLocal: s.nameLocal,
    isLive: s.districts.some((d) => d.active),
  })).sort((a, b) => (a.isLive !== b.isLive ? (a.isLive ? -1 : 1) : a.name.localeCompare(b.name)));
}

function peerDistricts(stateSlug: string) {
  return (getState(stateSlug)?.districts ?? [])
    .map((d) => ({ slug: d.slug, name: d.name, nameLocal: d.nameLocal, isLive: d.active === true }))
    .sort((a, b) => (a.isLive !== b.isLive ? (a.isLive ? -1 : 1) : a.name.localeCompare(b.name)));
}

/** "Sunday, 27 Sep 2026 · 9:42 pm IST" (PC) or "Sun, 27 Sep · 9:42 pm IST" (phone). */
function IstClock({ short = false }: { short?: boolean }) {
  const t = useTranslations("page_district-shell");
  const f = useFormat();
  const now = useMinuteClock();
  // Before mount there is no time yet: keep the space so nothing jumps.
  if (now === null) return <span className="ftp-dbar-clock" aria-hidden />;
  const date = f.date(now, short
    ? { weekday: "short", day: "numeric", month: "short" }
    : { weekday: "long", day: "numeric", month: "short", year: "numeric" });
  const time = t("bar.time", { time: f.time(now, { hour: "numeric", minute: "2-digit" }) });
  return (
    <span className="ftp-dbar-clock" role="timer" aria-live="off" aria-label={t("bar.clockAria", { date, time })}>
      {!short && <CalendarDays size={14} aria-hidden />}
      <span>{date}</span>
      <span className="ftp-dbar-dot-sep" aria-hidden>·</span>
      <span className="ftp-dbar-time">{time}</span>
    </span>
  );
}

type FreshState = "loading" | "all" | "some" | "none";

/** The live-feed summary: a coloured dot + "3 of 5 live feeds up to date". */
function FreshSummary({ fresh, districtName, popover }: { fresh: FreshnessResult; districtName: string; popover: boolean }) {
  const t = useTranslations("page_shell");
  const td = useTranslations("page_district-shell");
  const tv = useTranslations("page_verify");
  const f = useFormat();
  const live = fresh.live;
  const state: FreshState =
    live && live.total > 0
      ? live.current === live.total
        ? "all"
        : "some"
      : fresh.loading && !fresh.error
        ? "loading"
        : "none";
  const text =
    state === "all"
      ? t("bar.liveFeedsAll", { total: live!.total })
      : state === "some"
        ? t("bar.liveFeeds", { current: live!.current, total: live!.total })
        : state === "loading"
          ? td("bar.checking")
          : t("bar.howFresh");

  // The feeds behind the summary (same filter as the API's live count).
  const feeds = fresh.datasets.filter((d) => LIVE_FEED_KEYS.includes(d.key) && d.status !== "not_collected");
  const feedStatus = (d: DatasetFreshness): string => {
    if (d.status === "current") {
      const when = d.dataDate ?? d.lastChecked;
      return when ? f.ago(when) : td("bar.feedCurrent");
    }
    if (d.status === "late") return tv("status.late", { n: d.lateByDays ?? d.ageDays ?? 1 });
    return td("bar.feedNoDate");
  };
  const tipId = `ftp-dbar-feeds-${popover ? "pc" : "m"}`;
  // Nothing collected here (a district that is not live yet) or the check
  // failed: no pill — it would point at a verification section with nothing in it.
  if (state === "none") return null;

  return (
    <span className="ftp-dbar-freshwrap">
      <a
        href="#verify"
        className="ftp-dbar-fresh"
        data-state={state}
        aria-describedby={popover && feeds.length > 0 ? tipId : undefined}
      >
        <span className="ftp-dbar-light" aria-hidden />
        <span className="ftp-dbar-fresh-text">{text}</span>
      </a>
      {popover && feeds.length > 0 && (
        <span id={tipId} role="tooltip" className="ftp-dbar-feeds">
          <span className="ftp-dbar-feeds-title">{td("bar.feedsTitle", { district: districtName })}</span>
          {feeds.map((d) => (
            <span key={d.key} className="ftp-dbar-feed" data-status={d.status}>
              <span className="ftp-dbar-light" aria-hidden />
              <span className="ftp-dbar-feed-name">{tv(`dataset.${d.key}`)}</span>
              <span className="ftp-dbar-feed-age">{feedStatus(d)}</span>
            </span>
          ))}
          <span className="ftp-dbar-feeds-more">{td("bar.feedsMore")}</span>
        </span>
      )}
    </span>
  );
}

export default function DistrictBar({ locale, stateSlug, districtSlug }: Props) {
  const t = useTranslations("page_shell");
  const tu = useTranslations("subUnits");
  const mt = useModuleText();
  const place = usePlaceText();
  const lang = useLocale();
  const pathname = usePathname();
  const route = districtRoute(pathname);
  const fresh = useFreshness(stateSlug, districtSlug);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Other components can still open the drawer with a window event.
  useEffect(() => {
    const onOpen = () => setDrawerOpen(true);
    window.addEventListener(OPEN_MODULES_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_MODULES_EVENT, onOpen);
  }, []);

  const stateData = getState(stateSlug);
  const districtData = getDistrict(stateSlug, districtSlug);
  if (!stateData || !districtData) return null;

  const districtLabel = placeName(districtData, lang);
  const config = getStateConfig(stateSlug, districtSlug);
  const unitsEn = config?.subDistrictUnitPlural ?? "Taluks";
  // Lower-casing is a no-op for Indic scripts and gives "All taluks" in English.
  const units = (tu.has(unitsEn) ? tu(unitsEn) : unitsEn).toLocaleLowerCase(lang);
  const taluk = route.taluk ? districtData.taluks.find((x) => x.slug === route.taluk) : undefined;
  const taluks = districtData.taluks.map((x) => ({ slug: x.slug, name: placeName(x, lang), nameLocal: x.nameLocal }));
  const pageName = taluk ? placeName(taluk, lang) : mt.label(route.module ?? "overview");

  return (
    <>
      <div className="ftp-dbar" role="region" aria-label={t("bar.aria")}>
        <div className="ftp-dbar-inner">
          <div className="ftp-dbar-crumbs">
            <DistrictBreadcrumb
              variant="bar"
              locale={locale}
              stateSlug={stateSlug}
              stateName={place.state(stateSlug, stateData.name)}
              districtSlug={districtSlug}
              districtName={districtLabel}
              peerLiveStates={peerStates()}
              peerLiveDistricts={peerDistricts(stateSlug)}
              taluks={taluks}
              currentTalukSlug={taluk?.slug}
              currentTalukName={taluk ? placeName(taluk, lang) : undefined}
              subdivisionLabel={config?.subDistrictUnit ?? "Sub-district"}
              allSubLabel={t("bar.allSub", { units })}
            />
          </div>

          {/* Phones and tablets: the page you are on + the topics drawer. */}
          <button
            type="button"
            className="ftp-dbar-topics"
            onClick={() => setDrawerOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={drawerOpen}
            aria-label={t("bar.openTopics", { page: pageName })}
          >
            <span className="ftp-dbar-topics-text">
              <span className="ftp-dbar-topics-label">{t("bar.topics")}</span>
              <span className="ftp-dbar-topics-page">{pageName}</span>
            </span>
            <ChevronDown size={16} aria-hidden />
          </button>

          {/* Laptops and PCs: day, date and time in India + the live-feed summary. */}
          <div className="ftp-dbar-status">
            <IstClock />
            <FreshSummary fresh={fresh} districtName={districtLabel} popover />
          </div>
        </div>
      </div>

      {/* Phones and tablets: the same two details in one thin line (scrolls away). */}
      <div className="ftp-dbar-sub">
        <IstClock short />
        <FreshSummary fresh={fresh} districtName={districtLabel} popover={false} />
      </div>

      <MobileDistrictDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        locale={locale}
        stateSlug={stateSlug}
        districtSlug={districtSlug}
        districtName={districtLabel}
        activeSlug={route.module ?? undefined}
      />
    </>
  );
}
