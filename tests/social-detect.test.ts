/**
 * Unit tests for src/lib/social-detect.ts — platform detection for the
 * optional social link on the support checkout form.
 */
import { describe, it, expect } from "vitest";
import { detectSocialPlatform, validateSocialLink } from "@/lib/social-detect";

describe("detectSocialPlatform", () => {
  it("returns null for empty input", () => {
    expect(detectSocialPlatform("")).toBeNull();
  });

  it("recognises the four named platforms, case-insensitively", () => {
    expect(detectSocialPlatform("https://Instagram.com/jayanth_m_b")?.platform).toBe("instagram");
    expect(detectSocialPlatform("https://www.linkedin.com/in/x")?.platform).toBe("linkedin");
    expect(detectSocialPlatform("https://github.com/jayanthmb14")?.platform).toBe("github");
    expect(detectSocialPlatform("https://x.com/foo")?.platform).toBe("twitter");
    expect(detectSocialPlatform("https://twitter.com/foo")?.platform).toBe("twitter");
  });

  it("falls back to a generic website", () => {
    expect(detectSocialPlatform("https://example.org")).toEqual({ platform: "website", icon: "external-link" });
  });
});

describe("validateSocialLink", () => {
  it("treats blank input as valid and empty (the field is optional)", () => {
    expect(validateSocialLink("")).toEqual({ valid: true, platform: null, cleanUrl: null });
    expect(validateSocialLink("   ")).toEqual({ valid: true, platform: null, cleanUrl: null });
  });

  it("detects a full GitHub URL without a warning", () => {
    const r = validateSocialLink("https://github.com/jayanthmb14");
    expect(r.valid).toBe(true);
    expect(r.platform).toBe("github");
    expect(r.cleanUrl).toContain("github.com/jayanthmb14");
    expect(r.warning).toBeUndefined();
  });

  it("maps a bare @handle to Instagram", () => {
    const r = validateSocialLink("@jayanth_m_b");
    expect(r.valid).toBe(true);
    expect(r.platform).toBe("instagram");
    expect(r.cleanUrl).toContain("instagram.com/jayanth_m_b");
  });

  it("keeps an unknown domain as a generic website and adds the https scheme", () => {
    const r = validateSocialLink("myblog.example");
    expect(r.valid).toBe(true);
    expect(r.platform).toBe("website");
    expect(r.cleanUrl).toBe("https://myblog.example");
  });

  it("rejects input that is too short to be a handle or a link", () => {
    const r = validateSocialLink("ab");
    expect(r.valid).toBe(false);
    expect(r.cleanUrl).toBeNull();
    expect(r.warning).toBe("Invalid link format");
  });
});
