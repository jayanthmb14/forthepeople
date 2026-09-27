/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  DrillDownMap — the interactive India map (home page)
// ═══════════════════════════════════════════════════════════════════════
//
//  - Every state is drawn in one of four soft pastel land tones (neighbours
//    never share one), without the district seams inside it, over a soft
//    outline along the coast; it opens its own page (/[locale]/[state])
//    and turns a clearer brand blue on hover or tap. States are never
//    painted "live": only districts are (DESIGN-SYSTEM §2).
//  - Each live district is a pin in its own hue with a slow "ping" and a
//    small name beside it (right, left, above or below — wherever it fits;
//    a name that does not fit appears once you zoom in). Pins keep the same
//    size on every screen (a 40 px touch target). Pins that sit close
//    together (Bengaluru Urban, Mandya, Mysuru) fan out on a small ring in
//    their own compass order, tied to their real place by a thin line
//    (pin-layout.ts).
//  - A pin shows the caller's card (renderCard) — on hover, keyboard focus
//    or a tap. With a mouse a click opens the district; on a touch screen
//    the first tap shows the card and the second opens the district (the
//    card also has its own "Open" link). States work the same way.
//  - Zoom: the + / − / reset buttons (top left, over the sea), a pinch on a phone, ctrl + scroll or
//    a trackpad pinch on a laptop. A plain one-finger swipe or scroll
//    wheel still scrolls the page (the map never traps it); once zoomed
//    in, one finger pans the map.
//  - Pins are real links (Tab reaches them, Enter opens the district).
//  - Reduced motion: no ping.
//
//  All words come from the caller (`labels`), so the map has no text of
//  its own. Colours: mapTheme.tsx (shapes) and drilldown.module.css (pins).
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ComposableMap, Geographies, Geography, Line, Marker, ZoomableGroup } from "react-simple-maps";
import { Minus, Plus, RotateCcw, X, ArrowRight } from "lucide-react";
import { DISTRICT_CENTROIDS } from "@/lib/geo/district-centroids";
import { getDistrictHue, type Hue } from "@/lib/design/hues";
import { INDIA_STATE_TONE, indiaStateStyle, MAP_CARD_STYLE } from "@/components/map/mapTheme";
import { INDIA_STATES } from "@/lib/constants/districts";
import { INDIA_STATE_NAME_TO_SLUG } from "@/lib/geo/aliases";
import { MAP_CENTER, MAP_H, MAP_SCALE, MAP_W, UNITS_PER_DEG, fanOut, placeLabels, project, type LabelSide } from "./pin-layout";
import styles from "./drilldown.module.css";

/** One live-district pin, with its badge position fanned out if crowded. */
export interface MapPin {
  /** "<stateSlug>/<districtSlug>" */
  key: string;
  slug: string;
  name: string;
  stateSlug: string;
  stateName: string;
  lat: number;
  lng: number;
  pinLat: number;
  pinLng: number;
  moved: boolean;
  hue: Hue;
}

/** A live district before crowded pins are spread (fanOut adds pinLat / pinLng / moved). */
type BasePin = Omit<MapPin, "pinLat" | "pinLng" | "moved">;

const BASE_PINS: BasePin[] = INDIA_STATES.flatMap((st) =>
  st.districts.flatMap((d) => {
    const c = d.active ? DISTRICT_CENTROIDS[`${st.slug}/${d.slug}`] : undefined;
    return c
      ? [{ key: `${st.slug}/${d.slug}`, slug: d.slug, name: d.name, stateSlug: st.slug, stateName: st.name, lat: c.lat, lng: c.lng, hue: getDistrictHue(d.slug) }]
      : [];
  }),
);

/** Live districts per state slug (for the state tooltip). */
const LIVE_PER_STATE = BASE_PINS.reduce<Record<string, number>>((m, p) => {
  m[p.stateSlug] = (m[p.stateSlug] ?? 0) + 1;
  return m;
}, {});

const DEFAULT_CENTER: [number, number] = MAP_CENTER;
const MAX_ZOOM = 6;

/** Pin geometry in screen pixels (the pin group is scaled so these hold at any width or zoom). */
const PIN = { hit: 20, halo: 11, dot: 7, core: 2.6, ring: 10, ping: 7, label: 11.5, labelGap: 11 } as const;
/** Pins closer than this many pixels (at full view) are spread on a ring of this radius. */
const CROWD_PX = 30;
const RING_PX = 24;

export interface DrillDownLabels {
  /** Accessible name of the whole map. */
  map: string;
  zoomIn: string;
  zoomOut: string;
  reset: string;
  close: string;
  /** A pin's accessible name, e.g. "Mandya, Karnataka: open its dashboards". */
  pin: (pin: MapPin) => string;
  /** The short name drawn beside a pin, e.g. "Mandya"; no names are drawn without it. */
  pinName?: (pin: MapPin) => string;
  /** A state's name in the page language. */
  stateName: (slug: string, fallback: string) => string;
  /** The line under a state's name, e.g. "3 live districts · open the state page". */
  stateHint: (liveDistricts: number) => string;
  /** The link in a tapped state's tooltip, e.g. "Open Karnataka". */
  stateOpen: (name: string) => string;
}

/** Where something sits inside the map box, and the box's size. */
interface Spot {
  x: number;
  y: number;
  w: number;
  h: number;
}

type Selection =
  | ({ kind: "pin"; key: string; pinned: boolean } & Spot)
  | ({ kind: "state"; slug: string; name: string; pinned: boolean } & Spot)
  | null;

export interface DrillDownMapProps {
  locale: string;
  labels: DrillDownLabels;
  /** The card for a live district (its facts and an "Open" link). */
  renderCard?: (pin: MapPin) => React.ReactNode;
}

export default function DrillDownMap({ locale, labels, renderCard }: DrillDownMapProps) {
  const router = useRouter();
  const wrap = useRef<HTMLDivElement>(null);
  const pointer = useRef<string>("mouse");
  /** When the last pointer went down: a focus right after it came from a tap or click, not the keyboard. */
  const lastDown = useRef(0);
  const hideTimer = useRef<number | null>(null);
  const [sel, setSel] = useState<Selection>(null);
  const [view, setView] = useState<{ center: [number, number]; zoom: number }>({ center: DEFAULT_CENTER, zoom: 1 });
  const zoomRef = useRef(1);
  useEffect(() => {
    zoomRef.current = view.zoom;
  }, [view.zoom]);

  // The map's drawn width: pins, names and gaps are sized in screen pixels.
  const [boxW, setBoxW] = useState(480);
  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0]?.contentRect.width ?? 0);
      if (w > 0) setBoxW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  /** Map units per screen pixel at full view (rounded so a small resize does not re-lay the pins). */
  const unitsPerPx = Math.round((MAP_W / boxW) * 20) / 20;

  const pins: MapPin[] = useMemo(
    () => fanOut(BASE_PINS, Math.max(1.6, (CROWD_PX * unitsPerPx) / UNITS_PER_DEG), Math.max(1.9, (RING_PX * unitsPerPx) / UNITS_PER_DEG)),
    [unitsPerPx],
  );

  // Names beside the pins: a side each where it fits, at this width and zoom.
  const pinName = labels.pinName;
  const names = useMemo(() => new Map(pins.map((p) => [p.key, pinName ? pinName(p) : ""])), [pins, pinName]);
  const sides: Record<string, LabelSide | null> = useMemo(() => {
    if (!pinName) return {};
    const toPx = view.zoom / unitsPerPx;
    const [cx, cy] = project(view.center[0], view.center[1]);
    const items = pins.map((p) => {
      const [x, y] = project(p.pinLng, p.pinLat);
      return { key: p.key, x: MAP_W / 2 / unitsPerPx + (x - cx) * toPx, y: MAP_H / 2 / unitsPerPx + (y - cy) * toPx, name: names.get(p.key) ?? "" };
    });
    return placeLabels(items, {
      font: PIN.label,
      dot: PIN.halo,
      gap: PIN.labelGap,
      bounds: { w: MAP_W / unitsPerPx, h: MAP_H / unitsPerPx },
      // The zoom buttons, top left (8 px in, three 40 px buttons; 36 px on phones).
      avoid: [{ x0: 0, y0: 0, x1: 54, y1: 134 }],
    });
  }, [pins, names, pinName, unitsPerPx, view.zoom, view.center]);

  const districtHref = (p: MapPin) => `/${locale}/${p.stateSlug}/${p.slug}`;
  const stateHref = (slug: string) => `/${locale}/${slug}`;

  const cancelHide = () => {
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    hideTimer.current = null;
  };
  const hideSoon = () => {
    cancelHide();
    hideTimer.current = window.setTimeout(() => {
      setSel((s) => (s && !s.pinned ? null : s));
    }, 220);
  };
  useEffect(() => () => cancelHide(), []);

  // Escape closes the card.
  useEffect(() => {
    if (!sel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel]);

  /** The centre of an element (a pin's dot) inside the map box. */
  const spotOf = useCallback((el: Element): Spot => {
    const box = wrap.current?.getBoundingClientRect();
    const r = (el.querySelector("[data-dot]") ?? el).getBoundingClientRect();
    if (!box) return { x: 0, y: 0, w: 0, h: 0 };
    return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top, w: box.width, h: box.height };
  }, []);

  /** Show a pin's card. A card that was pinned (tapped) stays pinned when
   *  focus or hover reaches the same pin again (a tap also focuses it). */
  const selectPin = (pin: MapPin, el: Element, pinned: boolean) => {
    cancelHide();
    const spot = spotOf(el);
    setSel((prev) => ({
      kind: "pin",
      key: pin.key,
      pinned: pinned || (prev?.kind === "pin" && prev.key === pin.key && prev.pinned),
      ...spot,
    }));
  };

  const onPinClick = (e: React.MouseEvent, pin: MapPin) => {
    e.preventDefault();
    const touch = pointer.current === "touch" || pointer.current === "pen";
    const already = sel?.kind === "pin" && sel.key === pin.key && sel.pinned;
    if (touch && !already) {
      selectPin(pin, e.currentTarget, true);
      return;
    }
    router.push(districtHref(pin));
  };

  const stateAt = (e: React.MouseEvent): Spot => {
    const box = wrap.current?.getBoundingClientRect();
    return box ? { x: e.clientX - box.left, y: e.clientY - box.top, w: box.width, h: box.height } : { x: 0, y: 0, w: 0, h: 0 };
  };

  const onStateClick = (e: React.MouseEvent, slug: string, name: string) => {
    const touch = pointer.current === "touch" || pointer.current === "pen";
    const already = sel?.kind === "state" && sel.slug === slug && sel.pinned;
    if (touch && !already) {
      setSel({ kind: "state", slug, name, ...stateAt(e), pinned: true });
      return;
    }
    router.push(stateHref(slug));
  };

  // Zoom: wheel only with ctrl/⌘ (trackpad pinch sends ctrl), touch only
  // with two fingers or once zoomed in, drag only once zoomed in.
  const filterZoomEvent = useCallback((ev: Event) => {
    const e = ev as MouseEvent & TouchEvent & WheelEvent;
    if (e.type === "wheel") return e.ctrlKey || e.metaKey;
    if (e.type === "touchstart") return (e.touches?.length ?? 0) > 1 || zoomRef.current > 1.01;
    if (e.type === "mousedown") return zoomRef.current > 1.01 && !e.button;
    if (e.type === "dblclick") return true;
    return !e.button;
  }, []);

  const zoomTo = (z: number) => {
    const zoom = Math.min(MAX_ZOOM, Math.max(1, Math.round(z * 100) / 100));
    setSel(null);
    setView((v) => ({ center: zoom === 1 ? DEFAULT_CENTER : v.center, zoom }));
  };

  const selectedPin = sel?.kind === "pin" ? pins.find((p) => p.key === sel.key) ?? null : null;
  /** Map units per screen pixel inside the zoomed group: pins and names are drawn in pixels. */
  const pinScale = unitsPerPx / view.zoom;
  // On narrow screens (phones) the card docks to the edge of the map away
  // from the pin: the bottom for a northern pin, the top for a southern one.
  const dock: "top" | "bottom" | null = sel && sel.w < 420 ? (sel.y > sel.h / 2 ? "top" : "bottom") : null;
  const cardStyle: React.CSSProperties =
    sel?.kind !== "pin" || dock
      ? MAP_CARD_STYLE
      : {
          ...MAP_CARD_STYLE,
          left: Math.max(8, Math.min(sel.x - 136, sel.w - 280)),
          ...(sel.y < 230 ? { top: sel.y + 22 } : { bottom: sel.h - sel.y + 22 }),
        };

  return (
    <div
      ref={wrap}
      className={styles.wrap}
      data-zoomed={view.zoom > 1.01 ? "true" : "false"}
      onPointerDown={(e) => {
        pointer.current = e.pointerType;
        lastDown.current = e.timeStamp;
        // A tap on the sea (the SVG itself) closes the card.
        if ((e.target as Element).tagName === "svg") setSel(null);
      }}
    >
      <ComposableMap
        projection="geoMercator"
        // Mainland India plus the Andaman & Nicobar Islands fill the
        // 800 × 900 box.
        projectionConfig={{ center: DEFAULT_CENTER, scale: MAP_SCALE }}
        width={MAP_W}
        height={MAP_H}
        className={styles.svg}
        role="group"
        aria-label={labels.map}
      >
        <ZoomableGroup
          center={view.center}
          zoom={view.zoom}
          minZoom={1}
          maxZoom={MAX_ZOOM}
          // The typings say the filter gets an SVG element; react-simple-maps
          // actually passes the d3 zoom event (dist/index.js filterFunc).
          filterZoomEvent={filterZoomEvent as unknown as (element: SVGElement) => boolean}
          onMoveStart={() => setSel(null)}
          onMoveEnd={({ coordinates, zoom }: { coordinates: [number, number]; zoom: number }) => {
            if (Math.abs(zoom - zoomRef.current) > 0.01 || zoom > 1.01) setView({ center: coordinates, zoom });
          }}
        >
          <g aria-hidden="true">
            <Geographies geography="/geo/india-states.json?v=4">
              {({ geographies }: { geographies: Array<{ rsmKey: string; svgPath?: string; properties: Record<string, string> }> }) => [
                // A soft outline along the coast and borders, under the states
                // (their fills cover it inside; their white strokes part them).
                ...geographies.map((geo) => (geo.svgPath ? <path key={`coast-${geo.rsmKey}`} d={geo.svgPath} className={styles.coast} /> : null)),
                ...geographies.map((geo) => {
                  const geoName: string = geo.properties?.name ?? geo.properties?.NAME_1 ?? "";
                  const slug = INDIA_STATE_NAME_TO_SLUG[geoName];
                  const state = slug ? INDIA_STATES.find((s) => s.slug === slug) : undefined;
                  const name = state ? labels.stateName(state.slug, state.name) : geoName;
                  const on = sel?.kind === "state" && sel.slug === slug;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      tabIndex={-1}
                      data-live={slug && LIVE_PER_STATE[slug] ? "true" : undefined}
                      onClick={(e: React.MouseEvent) => state && onStateClick(e, state.slug, name)}
                      onMouseMove={(e: React.MouseEvent) => {
                        if (!state || pointer.current !== "mouse") return;
                        if (sel?.kind === "pin" || (sel?.kind === "state" && sel.pinned && sel.slug !== state.slug)) return;
                        cancelHide();
                        setSel({ kind: "state", slug: state.slug, name, ...stateAt(e), pinned: false });
                      }}
                      onMouseLeave={() => {
                        if (sel?.kind === "state" && !sel.pinned) setSel(null);
                      }}
                      className={styles.state}
                      style={indiaStateStyle(on, INDIA_STATE_TONE[geoName] ?? 0)}
                    />
                  );
                }),
              ]}
            </Geographies>
          </g>

          {pins.map((pin, i) => {
            const on = sel?.kind === "pin" && sel.key === pin.key;
            const side = sides[pin.key] ?? null;
            const name = side ? names.get(pin.key) : "";
            const g = PIN.labelGap;
            const text =
              side === "right"
                ? { x: g, y: 0, anchor: "start" as const, baseline: "central" as const }
                : side === "left"
                  ? { x: -g, y: 0, anchor: "end" as const, baseline: "central" as const }
                  : side === "top"
                    ? { x: 0, y: -g - 2, anchor: "middle" as const, baseline: "auto" as const }
                    : { x: 0, y: g + 2, anchor: "middle" as const, baseline: "hanging" as const };
            return (
              <g key={pin.key} className={`ftp-hue-${pin.hue}`}>
                {pin.moved && (
                  <>
                    <Line from={[pin.lng, pin.lat]} to={[pin.pinLng, pin.pinLat]} className={styles.leader} strokeWidth={1.5 * pinScale} />
                    <Marker coordinates={[pin.lng, pin.lat]}>
                      <circle r={2.4 * pinScale} className={styles.anchor} />
                    </Marker>
                  </>
                )}
                <Marker coordinates={[pin.pinLng, pin.pinLat]}>
                  <a
                    href={districtHref(pin)}
                    aria-label={labels.pin(pin)}
                    className={styles.pin}
                    data-on={on ? "true" : undefined}
                    onClick={(e) => onPinClick(e, pin)}
                    onMouseEnter={(e) => pointer.current === "mouse" && selectPin(pin, e.currentTarget, false)}
                    onMouseLeave={() => pointer.current === "mouse" && hideSoon()}
                    onFocus={(e) => {
                      // Keyboard focus shows the card. A tap also focuses the
                      // pin, but there the click decides (showing the card on
                      // focus would put it under the finger before the click).
                      if (e.timeStamp - lastDown.current > 800) selectPin(pin, e.currentTarget, false);
                    }}
                    onBlur={(e) => {
                      if (!wrap.current?.contains(e.relatedTarget as Node | null)) hideSoon();
                    }}
                  >
                    <g transform={`scale(${pinScale})`}>
                      {/* An invisible, larger target for fingers (40 px) */}
                      <circle r={PIN.hit} className={styles.pinHit} />
                      <circle r={PIN.ping} className={styles.pinPing} style={{ animationDelay: `${(i % 5) * 0.55}s` }} />
                      <circle r={PIN.halo} className={styles.pinHalo} />
                      <circle r={PIN.dot} className={styles.pinDot} data-dot="" />
                      <circle r={PIN.core} className={styles.pinCore} />
                      <circle r={PIN.ring} className={styles.pinRing} />
                      {name ? (
                        <text
                          x={text.x}
                          y={text.y}
                          textAnchor={text.anchor}
                          dominantBaseline={text.baseline}
                          className={styles.pinLabel}
                          style={{ fontSize: PIN.label }}
                          aria-hidden="true"
                        >
                          {name}
                        </text>
                      ) : null}
                    </g>
                  </a>
                </Marker>
              </g>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      <div className={styles.zoom}>
        <button type="button" className={styles.zoomBtn} onClick={() => zoomTo(view.zoom * 1.6)} disabled={view.zoom >= MAX_ZOOM} aria-label={labels.zoomIn} title={labels.zoomIn}>
          <Plus size={18} aria-hidden />
        </button>
        <button type="button" className={styles.zoomBtn} onClick={() => zoomTo(view.zoom / 1.6)} disabled={view.zoom <= 1} aria-label={labels.zoomOut} title={labels.zoomOut}>
          <Minus size={18} aria-hidden />
        </button>
        <button type="button" className={styles.zoomBtn} onClick={() => zoomTo(1)} disabled={view.zoom <= 1} aria-label={labels.reset} title={labels.reset}>
          <RotateCcw size={16} aria-hidden />
        </button>
      </div>

      {/* A live district's card */}
      {selectedPin && renderCard && (
        <div
          className={styles.card}
          data-dock={dock ?? undefined}
          style={cardStyle}
          onMouseEnter={cancelHide}
          onMouseLeave={() => pointer.current === "mouse" && hideSoon()}
        >
          {sel?.kind === "pin" && sel.pinned && (
            <button type="button" className={styles.close} onClick={() => setSel(null)} aria-label={labels.close}>
              <X size={16} aria-hidden />
            </button>
          )}
          {renderCard(selectedPin)}
        </div>
      )}

      {/* A state's tooltip (a tapped state also offers its link) */}
      {sel?.kind === "state" && (
        <div
          className={styles.tip}
          data-pinned={sel.pinned ? "true" : undefined}
          style={{
            ...MAP_CARD_STYLE,
            left: Math.max(8, Math.min(sel.x + 12, sel.w - 250)),
            top: Math.max(8, sel.y - (sel.pinned ? 96 : 64)),
          }}
        >
          <span className={styles.tipName}>{sel.name}</span>
          <span className={styles.tipHint}>{labels.stateHint(LIVE_PER_STATE[sel.slug] ?? 0)}</span>
          {sel.pinned && (
            <a
              href={stateHref(sel.slug)}
              className={styles.tipOpen}
              onClick={(e) => {
                e.preventDefault();
                router.push(stateHref(sel.slug));
              }}
            >
              {labels.stateOpen(sel.name)}
              <ArrowRight size={15} aria-hidden />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
