/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * First-visit tour: memory, offer rule, routes, step filtering, placement.
 * Pure helpers only (no DOM, no DB).
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  TOUR_STORAGE_KEY,
  parseTourMemory,
  readTourMemory,
  saveTourOutcome,
  shouldAutoOffer,
  withOutcome,
} from "@/lib/tour/memory";
import { tourKindForPath } from "@/lib/tour/route";
import { DISTRICT_STEPS, HOME_STEPS, TOUR_STEPS, availableSteps, tourSelector } from "@/lib/tour/steps";
import { placeCard, scrollDelta, spotlightRect } from "@/lib/tour/placement";
import { INDIA_STATES } from "@/lib/constants/districts";

class FakeStorage {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.has(k) ? this.data.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, String(v));
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}
class ThrowingStorage {
  getItem(): string | null {
    throw new Error("blocked");
  }
  setItem() {
    throw new Error("blocked");
  }
  removeItem() {
    throw new Error("blocked");
  }
}

describe("tour memory", () => {
  it("parses only known kinds and outcomes", () => {
    expect(parseTourMemory(null)).toEqual({});
    expect(parseTourMemory("not json")).toEqual({});
    expect(parseTourMemory("[1,2]")).toEqual({});
    expect(parseTourMemory(JSON.stringify({ home: "done", district: "nope", other: "done", at: "x" }))).toEqual({ home: "done", at: "x" });
  });

  it("records an outcome with a timestamp and keeps the other tour", () => {
    const now = new Date("2026-09-28T10:00:00.000Z");
    const m = withOutcome({ home: "skipped" }, "district", "done", now);
    expect(m).toEqual({ home: "skipped", district: "done", at: "2026-09-28T10:00:00.000Z" });
  });

  it("round-trips through storage under the versioned key", () => {
    const s = new FakeStorage();
    expect(readTourMemory(s)).toEqual({ ok: true, memory: {} });
    expect(saveTourOutcome(s, "home", "offered-dismissed")).toBe(true);
    expect(saveTourOutcome(s, "home", "done")).toBe(true);
    expect(JSON.parse(s.getItem(TOUR_STORAGE_KEY)!).home).toBe("done");
    expect(readTourMemory(s).memory.home).toBe("done");
  });

  it("reports blocked or missing storage instead of throwing", () => {
    expect(readTourMemory(new ThrowingStorage())).toEqual({ ok: false, memory: {} });
    expect(readTourMemory(null)).toEqual({ ok: false, memory: {} });
    expect(saveTourOutcome(new ThrowingStorage(), "home", "done")).toBe(false);
  });
});

describe("when to offer a tour", () => {
  const base = { kind: "home" as const, memory: {}, storageOk: true, offeredThisSession: false, acceptedThisSession: false };

  it("offers on a first visit", () => {
    expect(shouldAutoOffer(base)).toBe(true);
  });

  it("never offers again once anything is stored for that tour", () => {
    for (const outcome of ["done", "skipped", "offered-dismissed"] as const) {
      expect(shouldAutoOffer({ ...base, memory: { home: outcome } })).toBe(false);
    }
    // …but the other tour is still its own first time.
    expect(shouldAutoOffer({ ...base, kind: "district", memory: { home: "done" }, offeredThisSession: true, acceptedThisSession: true })).toBe(true);
  });

  it("never offers when storage is blocked (would nag on every page)", () => {
    expect(shouldAutoOffer({ ...base, storageOk: false })).toBe(false);
  });

  it("offers at most one card per session unless the visitor took a tour", () => {
    expect(shouldAutoOffer({ ...base, kind: "district", memory: { home: "offered-dismissed" }, offeredThisSession: true })).toBe(false);
    expect(shouldAutoOffer({ ...base, kind: "district", memory: { home: "done" }, offeredThisSession: true, acceptedThisSession: true })).toBe(true);
  });
});

describe("which pages have a tour", () => {
  const live = INDIA_STATES.flatMap((s) => s.districts.filter((d) => d.active).map((d) => ({ state: s.slug, district: d.slug })));
  const locked = INDIA_STATES.flatMap((s) => s.districts.filter((d) => !d.active).map((d) => ({ state: s.slug, district: d.slug })));

  it("home in every routed language", () => {
    expect(tourKindForPath("/en")).toBe("home");
    expect(tourKindForPath("/kn/")).toBe("home");
    expect(tourKindForPath("/xx")).toBeNull();
    expect(tourKindForPath("")).toBeNull();
  });

  it("every page of a live district", () => {
    expect(live.length).toBeGreaterThan(0);
    const { state, district } = live[0];
    expect(tourKindForPath(`/en/${state}/${district}`)).toBe("district");
    expect(tourKindForPath(`/hi/${state}/${district}/weather`)).toBe("district");
    expect(tourKindForPath(`/en/${state}/${district}/some-taluk/some-village`)).toBe("district");
  });

  it("not on other pages, locked districts or unknown addresses", () => {
    for (const p of ["/en/admin", "/en/admin/login", "/en/support", "/en/support/thank-you", "/en/india", "/en/india/water", "/en/about", "/en/karnataka", "/en/karnataka/not-a-district"]) {
      expect(tourKindForPath(p), p).toBeNull();
    }
    if (locked[0]) expect(tourKindForPath(`/en/${locked[0].state}/${locked[0].district}`)).toBeNull();
  });
});

describe("tour steps", () => {
  it("are short: at most six steps per tour", () => {
    expect(HOME_STEPS.length).toBeLessThanOrEqual(6);
    expect(DISTRICT_STEPS.length).toBeLessThanOrEqual(6);
  });

  it("drop steps whose target is missing, keeping the order", () => {
    const present = new Set(["home-search", "home-map", "support"]);
    expect(availableSteps(HOME_STEPS, (t) => present.has(t)).map((s) => s.id)).toEqual(["search", "map", "support"]);
    expect(availableSteps(HOME_STEPS, () => false)).toEqual([]);
  });

  it("build a plain attribute selector", () => {
    expect(tourSelector("home-search")).toBe('[data-tour="home-search"]');
  });

  it("have a title and a short body (at most two sentences) in en, hi and kn", () => {
    for (const locale of ["en", "hi", "kn"]) {
      const msgs = JSON.parse(readFileSync(join(__dirname, "..", "src", "dictionaries", locale, "page_tour.json"), "utf8"));
      for (const [kind, steps] of Object.entries(TOUR_STEPS)) {
        for (const s of steps) {
          const m = msgs[kind]?.[s.id];
          expect(m?.title, `${locale} ${kind}.${s.id}.title`).toBeTruthy();
          expect(m?.body, `${locale} ${kind}.${s.id}.body`).toBeTruthy();
          const sentences = String(m.body).split(/[.!?।](?:\s|$)/).filter((x: string) => x.trim()).length;
          expect(sentences, `${locale} ${kind}.${s.id}.body`).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it("are anchored in the code: every target appears as a data-tour attribute", () => {
    const dirs = ["components", "app"].map((d) => `"${join(__dirname, "..", "src", d)}"`).join(" ");
    const found = execSync(`grep -rhoE --include='*.tsx' 'data-tour="[a-z-]+"' ${dirs} || true`).toString();
    for (const steps of Object.values(TOUR_STEPS)) {
      for (const s of steps) expect(found, s.target).toContain(`data-tour="${s.target}"`);
    }
  });
});

describe("tour placement", () => {
  const desk = { width: 1440, height: 900 };
  const phone = { width: 390, height: 844 };
  const card = { width: 340, height: 190 };

  it("pads and clips the spotlight to the screen", () => {
    expect(spotlightRect({ top: 100, left: 100, width: 200, height: 50 }, desk)).toEqual({ top: 92, left: 92, width: 216, height: 66 });
    expect(spotlightRect({ top: -20, left: 0, width: 100, height: 40 }, desk)).toEqual({ top: 0, left: 0, width: 108, height: 28 });
    expect(spotlightRect({ top: 2000, left: 0, width: 100, height: 40 }, desk)).toBeNull();
  });

  it("puts the card below, then above, then beside the target", () => {
    expect(placeCard({ top: 100, left: 500, width: 300, height: 60 }, card, desk).placement).toBe("below");
    expect(placeCard({ top: 650, left: 500, width: 300, height: 60 }, card, desk).placement).toBe("above");
    expect(placeCard({ top: 60, left: 40, width: 700, height: 780 }, card, desk).placement).toBe("right");
    expect(placeCard({ top: 60, left: 700, width: 700, height: 780 }, card, desk).placement).toBe("left");
    expect(placeCard({ top: 0, left: 0, width: 1440, height: 900 }, card, desk).placement).toBe("dock-bottom");
  });

  it("keeps the card on screen", () => {
    const p = placeCard({ top: 10, left: 1400, width: 30, height: 30 }, card, desk);
    expect(p.left + card.width).toBeLessThanOrEqual(desk.width - 12);
    expect(p.left).toBeGreaterThanOrEqual(12);
  });

  it("docks the card on phones, at the top when the target is at the bottom", () => {
    const top = placeCard({ top: 100, left: 20, width: 300, height: 50 }, card, phone);
    expect(top.placement).toBe("dock-bottom");
    expect(top.width).toBe(phone.width - 24);
    const flag = placeCard({ top: 780, left: 330, width: 44, height: 44 }, card, phone);
    expect(flag.placement).toBe("dock-top");
    expect(placeCard(null, card, phone).placement).toBe("dock-bottom");
  });

  it("scrolls only when the target is not in the free band", () => {
    expect(scrollDelta({ top: 200, left: 0, width: 100, height: 100 }, 900, 110, 0)).toBe(0);
    // Below the fold: centred in the band.
    const d = scrollDelta({ top: 1500, left: 0, width: 100, height: 100 }, 900, 110, 0);
    expect(1500 - d + 50).toBeCloseTo((110 + 900) / 2, 0);
    // Taller than the band: its top goes just under the sticky bars.
    expect(scrollDelta({ top: 1500, left: 0, width: 100, height: 2000 }, 900, 110, 0)).toBe(1500 - 8 - 110);
    // A docked card on a phone takes the bottom of the screen.
    expect(scrollDelta({ top: 600, left: 0, width: 100, height: 100 }, 844, 110, 230)).not.toBe(0);
  });
});
