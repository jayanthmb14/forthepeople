#!/usr/bin/env node
/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Rewind polygon rings in public/geo/*.json for d3-geo (react-simple-maps).
 *
 * GeoJSON (RFC 7946) winds outer rings counter-clockwise. d3-geo works on
 * the sphere and reads a counter-clockwise outer ring as "everything EXCEPT
 * this shape" — the map paints the whole frame grey and shrinks the state to
 * a speck. DataMeet's state files use RFC winding, so every state map except
 * Karnataka rendered inside-out (Sept 2026).
 *
 * This makes outer rings clockwise and holes counter-clockwise (d3's
 * convention). Idempotent; keeps each file's formatting (minified or not).
 *
 *   node scripts/rewind-geo.mjs            # fix files in place
 *   node scripts/rewind-geo.mjs --check    # exit 1 if any file needs fixing
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "geo");
const CHECK = process.argv.includes("--check");

/** Planar signed area in lon/lat; > 0 means counter-clockwise. */
function signedArea(ring) {
  let s = 0;
  for (let i = 0; i < ring.length - 1; i++) s += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return s / 2;
}

/** Outer ring clockwise, holes counter-clockwise. Returns true if anything changed. */
function rewindPolygon(rings) {
  let changed = false;
  rings.forEach((ring, i) => {
    const wantCw = i === 0;
    const isCw = signedArea(ring) < 0;
    if (ring.length > 3 && isCw !== wantCw) {
      ring.reverse();
      changed = true;
    }
  });
  return changed;
}

let fixed = 0;
for (const name of readdirSync(DIR).filter((n) => n.endsWith(".json")).sort()) {
  const path = join(DIR, name);
  const raw = readFileSync(path, "utf8");
  const geo = JSON.parse(raw);
  if (geo.type !== "FeatureCollection") continue;
  let changed = 0;
  for (const f of geo.features) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === "Polygon" && rewindPolygon(g.coordinates)) changed++;
    if (g.type === "MultiPolygon") for (const p of g.coordinates) if (rewindPolygon(p)) changed++;
  }
  if (!changed) continue;
  fixed++;
  console.log(`${CHECK ? "needs rewind" : "rewound"}: ${name} (${changed} polygons)`);
  if (!CHECK) {
    const pretty = raw.trimEnd().includes("\n");
    writeFileSync(path, (pretty ? JSON.stringify(geo, null, 2) : JSON.stringify(geo)) + (raw.endsWith("\n") ? "\n" : ""));
  }
}
console.log(fixed ? `${fixed} file(s) ${CHECK ? "need fixing" : "fixed"}.` : "All geo files already use d3 winding.");
if (CHECK && fixed) process.exit(1);
