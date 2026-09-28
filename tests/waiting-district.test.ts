/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// The district-request vote only counts real, not-yet-live districts
// (src/lib/waiting-district.ts): the /contribute chart shows these rows.
import { describe, expect, it } from "vitest";
import { INDIA_STATES } from "@/lib/constants/districts";
import { waitingDistrict } from "@/lib/waiting-district";

const locked = INDIA_STATES.flatMap((s) => s.districts.filter((d) => !d.active).map((d) => ({ s, d })));
const live = INDIA_STATES.flatMap((s) => s.districts.filter((d) => d.active).map((d) => ({ s, d })));

describe("waitingDistrict", () => {
  it("accepts every district the vote page lists, in the registry's spelling", () => {
    expect(locked.length).toBeGreaterThan(0);
    for (const { s, d } of locked) {
      expect(waitingDistrict(s.name, d.name), `${s.name}/${d.name}`).toEqual({ stateName: s.name, districtName: d.name });
    }
  });
  it("ignores case and outer spaces, and stores the registry spelling", () => {
    const { s, d } = locked[0];
    expect(waitingDistrict(`  ${s.name.toUpperCase()} `, d.name.toLowerCase())).toEqual({ stateName: s.name, districtName: d.name });
  });
  it("refuses live districts", () => {
    expect(live.length).toBeGreaterThan(0);
    for (const { s, d } of live) expect(waitingDistrict(s.name, d.name), `${s.name}/${d.name}`).toBeNull();
  });
  it("refuses junk, a district under the wrong state, and non-strings", () => {
    expect(waitingDistrict("x", "https://spam.example")).toBeNull();
    expect(waitingDistrict(locked[0].s.name, "Nowhere")).toBeNull();
    const other = INDIA_STATES.find((s) => s.name !== locked[0].s.name)!;
    expect(waitingDistrict(other.name, locked[0].d.name)).toBeNull();
    expect(waitingDistrict(undefined, locked[0].d.name)).toBeNull();
    expect(waitingDistrict(locked[0].s.name, 42)).toBeNull();
  });
});
