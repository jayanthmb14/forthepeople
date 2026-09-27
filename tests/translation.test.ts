/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { contentLocale, sourceHash, translationTargets, isMissingTable } from "@/lib/translation/content";
import { getTranslationProvider } from "@/lib/translation/providers";
import { ROUTED_LOCALES } from "@/i18n/languages";

const KEYS = [
  "TRANSLATION_PROVIDER", "BHASHINI_USER_ID", "BHASHINI_API_KEY", "GOOGLE_TRANSLATE_API_KEY",
  "SARVAM_API_KEY", "TRANSLATION_EXTRA_LOCALES",
];

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("contentLocale", () => {
  it("returns null for English, unknown and planned codes", () => {
    expect(contentLocale("en")).toBeNull();
    expect(contentLocale(null)).toBeNull();
    expect(contentLocale("xx")).toBeNull();
    expect(contentLocale("hi")).toBe(ROUTED_LOCALES.includes("hi") ? "hi" : null);
  });
  it("accepts routed non-English codes", () => {
    for (const c of ROUTED_LOCALES.filter((c) => c !== "en")) expect(contentLocale(c)).toBe(c);
  });
});

describe("sourceHash", () => {
  it("is stable, ignores outer whitespace, and changes with the text", () => {
    expect(sourceHash("Dam level rises")).toBe(sourceHash("  Dam level rises \n"));
    expect(sourceHash("Dam level rises")).not.toBe(sourceHash("Dam level falls"));
    expect(sourceHash("x")).toHaveLength(16);
  });
});

describe("translationTargets", () => {
  it("never includes English and adds valid extra locales only", () => {
    vi.stubEnv("TRANSLATION_EXTRA_LOCALES", "hi, ta ,en,zz");
    const t = translationTargets();
    expect(t).not.toContain("en");
    expect(t).toContain("hi");
    expect(t).toContain("ta");
    expect(t).not.toContain("zz");
    expect(new Set(t).size).toBe(t.length);
  });
});

describe("isMissingTable", () => {
  it("recognises Prisma's missing-table error", () => {
    expect(isMissingTable({ code: "P2021" })).toBe(true);
    expect(isMissingTable(new Error("timeout"))).toBe(false);
  });
});

describe("getTranslationProvider", () => {
  it("is off without any key", () => {
    for (const k of KEYS) vi.stubEnv(k, "");
    expect(getTranslationProvider()).toBeNull();
  });
  it("auto-picks the provider whose key is set, and honours an explicit choice", () => {
    for (const k of KEYS) vi.stubEnv(k, "");
    vi.stubEnv("GOOGLE_TRANSLATE_API_KEY", "test-key");
    expect(getTranslationProvider()?.name).toBe("google");
    vi.stubEnv("TRANSLATION_PROVIDER", "sarvam");
    expect(getTranslationProvider()).toBeNull(); // chosen provider has no key
    vi.stubEnv("TRANSLATION_PROVIDER", "off");
    expect(getTranslationProvider()).toBeNull();
  });
  it("google: sends one batched request and maps Konkani to gom", async () => {
    for (const k of KEYS) vi.stubEnv(k, "");
    vi.stubEnv("GOOGLE_TRANSLATE_API_KEY", "test-key");
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      return new Response(
        JSON.stringify({ data: { translations: body.q.map((q: string) => ({ translatedText: `[${body.target}] ${q}` })) } }),
        { status: 200 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const out = await getTranslationProvider()!.translate(["a", "b"], "kok");
    expect(out).toEqual(["[gom] a", "[gom] b"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("rejects a short or empty response instead of storing it", async () => {
    for (const k of KEYS) vi.stubEnv(k, "");
    vi.stubEnv("GOOGLE_TRANSLATE_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: { translations: [{ translatedText: "" }] } }))));
    await expect(getTranslationProvider()!.translate(["a"], "kn")).rejects.toThrow();
  });
});
