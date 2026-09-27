/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  WeatherArt — one crafted picture per weather kind (v5.1 "Warm Calm")
// ═══════════════════════════════════════════════════════════════════════
//
//  Soft pastel illustrations in a 64 × 64 box: a gold sun with warm rays,
//  a white-to-sky cloud with a slate edge, sky-blue drops, a gold bolt, a
//  periwinkle moon with twinkling stars. They encode data (the forecast's
//  weather code, src/lib/weather/codes.ts), so they are pictures, not
//  decoration, and replace the emoji the old page used.
//
//  Colours: tokens and hue variables only. Each shape carries the hue
//  class it needs (`ftp-hue-yellow` for the sun, `ftp-hue-sky` for rain …)
//  and reads `--hue`, `--hue-pop`, `--hue-tint` through color-mix, so no
//  hex lives here and the palette follows globals.css.
//
//  Motion (only with `animated`): the sun turns very slowly, drops fall,
//  the cloud drifts, the bolt dims, stars twinkle. weather.module.css turns
//  every animation off under prefers-reduced-motion.
// ═══════════════════════════════════════════════════════════════════════
"use client";

import { useId } from "react";
import type { WeatherKind } from "@/lib/weather/codes";
import s from "./weather.module.css";

type Tone = "light" | "back" | "dark";

/** color-mix of the element's own hue variables (the shape sets the hue class). */
const mix = (a: string, pct: number, b: string) => `color-mix(in srgb, var(${a}) ${pct}%, ${b.startsWith("--") ? `var(${b})` : b})`;

const CLOUD_EDGE: Record<Tone, string> = {
  light: mix("--hue-pop", 60, "--hue"),
  back: mix("--hue-pop", 60, "--hue"),
  dark: mix("--hue-pop", 40, "--hue"),
};

/** The cloud outline: three bumps on a rounded base (local box 40 × 29). */
function CloudShape() {
  return (
    <>
      <circle cx={9} cy={20} r={9} />
      <circle cx={20} cy={12} r={12} />
      <circle cx={31} cy={19} r={9} />
      <rect x={0} y={16} width={40} height={13} rx={6.5} />
    </>
  );
}

function Cloud({ x, y, scale = 1, tone, id, animated }: { x: number; y: number; scale?: number; tone: Tone; id: string; animated: boolean }) {
  const gid = `${id}-cloud-${tone}`;
  return (
    <g className={animated ? s.bob : undefined}>
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <defs>
          <linearGradient id={gid} x1={0} y1={0} x2={0} y2={29} gradientUnits="userSpaceOnUse">
            {tone === "light" && (
              <>
                <stop offset="0" style={{ stopColor: "var(--ftp-surface)" }} />
                <stop offset="1" className="ftp-hue-sky" style={{ stopColor: mix("--hue-tint", 60, "--hue-pop") }} />
              </>
            )}
            {tone === "back" && (
              <>
                <stop offset="0" className="ftp-hue-slate" style={{ stopColor: "var(--hue-tint)" }} />
                <stop offset="1" className="ftp-hue-slate" style={{ stopColor: "var(--hue-pop)" }} />
              </>
            )}
            {tone === "dark" && (
              <>
                <stop offset="0" className="ftp-hue-slate" style={{ stopColor: mix("--hue-pop", 50, "var(--ftp-surface)") }} />
                <stop offset="1" className="ftp-hue-slate" style={{ stopColor: mix("--hue-pop", 80, "--hue") }} />
              </>
            )}
          </linearGradient>
        </defs>
        {/* Pass 1: the outline (its inner half is covered by pass 2). */}
        <g className="ftp-hue-slate" style={{ fill: "none", stroke: CLOUD_EDGE[tone], strokeWidth: 3 / scale }}>
          <CloudShape />
        </g>
        {/* Pass 2: the body, one gradient across every part. */}
        <g style={{ fill: `url(#${gid})` }}>
          <CloudShape />
        </g>
      </g>
    </g>
  );
}

function Sun({ cx, cy, r, id, animated }: { cx: number; cy: number; r: number; id: string; animated: boolean }) {
  const gid = `${id}-sun`;
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const r1 = r + 4.5;
    const r2 = r + 9.5;
    return { x1: cx + r1 * Math.cos(a), y1: cy + r1 * Math.sin(a), x2: cx + r2 * Math.cos(a), y2: cy + r2 * Math.sin(a) };
  });
  return (
    <g>
      <defs>
        <radialGradient id={gid} cx={cx - r * 0.3} cy={cy - r * 0.35} r={r * 1.35} gradientUnits="userSpaceOnUse">
          <stop offset="0" className="ftp-hue-yellow" style={{ stopColor: mix("--hue-pop", 55, "var(--ftp-surface)") }} />
          <stop offset="0.6" className="ftp-hue-yellow" style={{ stopColor: "var(--hue-pop)" }} />
          <stop offset="1" className="ftp-hue-amber" style={{ stopColor: mix("--hue-pop", 70, "--hue") }} />
        </radialGradient>
      </defs>
      <g className={`ftp-hue-amber${animated ? ` ${s.spin}` : ""}`} style={{ stroke: mix("--hue-pop", 55, "--hue"), strokeWidth: 3, strokeLinecap: "round" }}>
        {rays.map((l, i) => (
          <line key={i} x1={l.x1.toFixed(2)} y1={l.y1.toFixed(2)} x2={l.x2.toFixed(2)} y2={l.y2.toFixed(2)} />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={r} className="ftp-hue-amber" style={{ fill: `url(#${gid})`, stroke: mix("--hue-pop", 35, "--hue"), strokeWidth: 1.5 }} />
    </g>
  );
}

function Moon({ cx, cy, r, id, stars, animated }: { cx: number; cy: number; r: number; id: string; stars?: boolean; animated: boolean }) {
  const gid = `${id}-moon`;
  const mid = `${id}-moon-cut`;
  const sparkle = (x: number, y: number, k: number) =>
    `M${x} ${y - k}Q${x} ${y} ${x + k} ${y}Q${x} ${y} ${x} ${y + k}Q${x} ${y} ${x - k} ${y}Q${x} ${y} ${x} ${y - k}Z`;
  return (
    <g>
      <defs>
        <linearGradient id={gid} x1={cx - r} y1={cy - r} x2={cx + r} y2={cy + r} gradientUnits="userSpaceOnUse">
          <stop offset="0" className="ftp-hue-indigo" style={{ stopColor: "var(--hue-tint)" }} />
          <stop offset="1" className="ftp-hue-indigo" style={{ stopColor: "var(--hue-pop)" }} />
        </linearGradient>
        <mask id={mid} maskUnits="userSpaceOnUse" x={0} y={0} width={64} height={64}>
          <rect x={0} y={0} width={64} height={64} fill="white" />
          <circle cx={cx + r * 0.5} cy={cy - r * 0.38} r={r * 0.82} fill="black" />
        </mask>
      </defs>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        mask={`url(#${mid})`}
        className="ftp-hue-indigo"
        style={{ fill: `url(#${gid})`, stroke: mix("--hue-pop", 50, "--hue"), strokeWidth: 1.5 }}
      />
      {stars && (
        <g className="ftp-hue-yellow" style={{ fill: mix("--hue-pop", 70, "--hue") }}>
          <path d={sparkle(cx + r * 0.95, cy - r * 0.55, 3.2)} className={animated ? s.twinkle : undefined} />
          <path d={sparkle(cx + r * 1.35, cy + r * 0.25, 2.2)} className={animated ? s.twinkle : undefined} style={{ animationDelay: "1.1s" }} />
        </g>
      )}
    </g>
  );
}

/** A teardrop centred at (x, y), about 8 wide and 12 tall. */
const DROP = "M0 -6.5C2.4 -3.2 4 -0.6 4 1.9A4 4 0 0 1 -4 1.9C-4 -0.6 -2.4 -3.2 0 -6.5Z";

function Drops({ at, id, animated }: { at: [number, number][]; id: string; animated: boolean }) {
  const gid = `${id}-drop`;
  return (
    <g>
      <defs>
        <linearGradient id={gid} x1={0} y1={-6.5} x2={0} y2={6} gradientUnits="userSpaceOnUse">
          <stop offset="0" className="ftp-hue-sky" style={{ stopColor: "var(--hue-pop)" }} />
          <stop offset="1" className="ftp-hue-sky" style={{ stopColor: mix("--hue-pop", 35, "--hue") }} />
        </linearGradient>
      </defs>
      {at.map(([x, y], i) => (
        <g key={i} className={animated ? s.fall : undefined} style={animated ? { animationDelay: `${(i * 0.45).toFixed(2)}s` } : undefined}>
          <path d={DROP} transform={`translate(${x} ${y})`} style={{ fill: `url(#${gid})` }} />
        </g>
      ))}
    </g>
  );
}

function Streaks({ lines, animated, width = 3 }: { lines: [number, number, number, number][]; animated: boolean; width?: number }) {
  return (
    <g className="ftp-hue-sky" style={{ stroke: mix("--hue-pop", 35, "--hue"), strokeWidth: width, strokeLinecap: "round" }}>
      {lines.map(([x1, y1, x2, y2], i) => (
        <g key={i} className={animated ? s.fall : undefined} style={animated ? { animationDelay: `${(i * 0.3).toFixed(2)}s` } : undefined}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} />
        </g>
      ))}
    </g>
  );
}

function Bolt({ id, animated }: { id: string; animated: boolean }) {
  const gid = `${id}-bolt`;
  return (
    <g className={animated ? s.flash : undefined}>
      <defs>
        <linearGradient id={gid} x1={0} y1={32} x2={0} y2={60} gradientUnits="userSpaceOnUse">
          <stop offset="0" className="ftp-hue-yellow" style={{ stopColor: "var(--hue-pop)" }} />
          <stop offset="1" className="ftp-hue-amber" style={{ stopColor: mix("--hue-pop", 70, "--hue") }} />
        </linearGradient>
      </defs>
      <polygon
        points="33,31 41,31 36,41.5 42.5,41.5 28,60 31.5,47.5 25.5,47.5"
        className="ftp-hue-amber"
        style={{ fill: `url(#${gid})`, stroke: mix("--hue-pop", 35, "--hue"), strokeWidth: 1.5, strokeLinejoin: "round" }}
      />
    </g>
  );
}

function Flakes({ at }: { at: [number, number][] }) {
  return (
    <g className="ftp-hue-sky" style={{ stroke: mix("--hue-pop", 35, "--hue"), strokeWidth: 2, strokeLinecap: "round" }}>
      {at.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <line x1={-4} y1={0} x2={4} y2={0} />
          <line x1={-2} y1={-3.46} x2={2} y2={3.46} />
          <line x1={-2} y1={3.46} x2={2} y2={-3.46} />
        </g>
      ))}
    </g>
  );
}

function Lines({ rows, hue, animated }: { rows: [number, number, number][]; hue: "slate" | "amber"; animated: boolean }) {
  const color = hue === "slate" ? mix("--hue-pop", 55, "--hue") : mix("--hue-pop", 65, "--hue");
  return (
    <g className={`ftp-hue-${hue}${animated ? ` ${s.drift}` : ""}`} style={{ stroke: color, strokeWidth: 3.5, strokeLinecap: "round" }}>
      {rows.map(([x1, x2, y], i) => (
        <line key={i} x1={x1} y1={y} x2={x2} y2={y} />
      ))}
    </g>
  );
}

/**
 * @prop kind      Weather kind (src/lib/weather/codes.ts).
 * @prop night     Moon instead of sun for clear / mostly clear / partly cloudy.
 * @prop size      Pixels (the box is square).
 * @prop animated  Gentle motion (big pictures only; off under reduced motion).
 * @prop title     Accessible name; without it the picture is decorative (aria-hidden).
 */
export function WeatherArt({
  kind,
  night = false,
  size = 64,
  animated = false,
  title,
  style,
}: {
  kind: WeatherKind;
  night?: boolean;
  size?: number;
  animated?: boolean;
  title?: string;
  style?: React.CSSProperties;
}) {
  const id = `wx${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const a = animated;

  let body: React.ReactNode;
  switch (kind) {
    case "clear":
      body = night ? <Moon cx={30} cy={33} r={16} id={id} stars animated={a} /> : <Sun cx={32} cy={32} r={13} id={id} animated={a} />;
      break;
    case "mostlyClear":
      body = (
        <>
          {night ? <Moon cx={27} cy={27} r={14} id={id} stars animated={a} /> : <Sun cx={28} cy={28} r={11.5} id={id} animated={a} />}
          <Cloud x={29} y={36} scale={0.64} tone="light" id={id} animated={a} />
        </>
      );
      break;
    case "partly":
      body = (
        <>
          {night ? <Moon cx={24} cy={22} r={12.5} id={id} animated={a} /> : <Sun cx={24} cy={23} r={10} id={id} animated={a} />}
          <Cloud x={14} y={25} tone="light" id={id} animated={a} />
        </>
      );
      break;
    case "cloudy":
      body = (
        <>
          <Cloud x={6} y={12} scale={0.75} tone="back" id={id} animated={false} />
          <Cloud x={16} y={23} tone="light" id={id} animated={a} />
        </>
      );
      break;
    case "fog":
      body = (
        <>
          <Cloud x={13} y={9} scale={0.9} tone="light" id={id} animated={false} />
          <Lines rows={[[10, 44, 43], [20, 54, 50], [13, 40, 57]]} hue="slate" animated={a} />
        </>
      );
      break;
    case "haze":
      body = (
        <>
          <Sun cx={32} cy={28} r={12} id={id} animated={false} />
          <Lines rows={[[8, 40, 40], [22, 56, 47], [12, 46, 54]]} hue="amber" animated={a} />
        </>
      );
      break;
    case "drizzle":
      body = (
        <>
          <Cloud x={12} y={7} tone="light" id={id} animated={a} />
          <Streaks width={2.5} animated={a} lines={[[22, 43, 20.5, 47], [32, 43, 30.5, 47], [42, 43, 40.5, 47], [27, 51, 25.5, 55], [37, 51, 35.5, 55]]} />
        </>
      );
      break;
    case "rain":
      body = (
        <>
          <Cloud x={12} y={6} tone="dark" id={id} animated={a} />
          <Drops id={id} animated={a} at={[[22, 47], [32, 53], [42, 47]]} />
        </>
      );
      break;
    case "showers":
      body = (
        <>
          <Sun cx={45} cy={18} r={8} id={id} animated={a} />
          <Cloud x={8} y={14} scale={0.95} tone="light" id={id} animated={a} />
          <Drops id={id} animated={a} at={[[20, 51], [33, 55]]} />
        </>
      );
      break;
    case "heavyRain":
      body = (
        <>
          <Cloud x={12} y={5} tone="dark" id={id} animated={a} />
          <Streaks animated={a} lines={[[19, 41, 15.5, 50], [27, 41, 23.5, 53], [35, 41, 31.5, 50], [43, 41, 39.5, 53], [51, 41, 47.5, 50]]} />
        </>
      );
      break;
    case "thunder":
      body = (
        <>
          <Cloud x={12} y={4} tone="dark" id={id} animated={a} />
          <Drops id={id} animated={a} at={[[18, 45], [48, 47]]} />
          <Bolt id={id} animated={a} />
        </>
      );
      break;
    case "snow":
      body = (
        <>
          <Cloud x={12} y={7} tone="light" id={id} animated={a} />
          <Flakes at={[[22, 47], [32, 54], [42, 47]]} />
        </>
      );
      break;
    default:
      body = <Cloud x={12} y={18} tone="back" id={id} animated={false} />;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      style={{ display: "block", flexShrink: 0, overflow: "visible", ...style }}
    >
      {body}
    </svg>
  );
}
