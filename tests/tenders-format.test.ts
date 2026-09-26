/**
 * Unit tests for src/lib/tenders/format.ts — client-safe formatting helpers
 * used by every Tenders page. Pure functions, no DB.
 */
import { describe, it, expect } from "vitest";
import { formatInr, serializeForJson, assertFactualCopy, tenderError } from "@/lib/tenders/format";

describe("formatInr", () => {
  it("returns an em dash for empty, zero or invalid values", () => {
    expect(formatInr(null)).toBe("—");
    expect(formatInr(undefined)).toBe("—");
    expect(formatInr("")).toBe("—");
    expect(formatInr(0)).toBe("—");
    expect(formatInr(-5)).toBe("—");
    expect(formatInr("not a number")).toBe("—");
  });

  it("formats small amounts with Indian digit grouping", () => {
    expect(formatInr(500)).toBe("₹500");
  });

  it("uses k / L / Cr suffixes at the Indian thresholds", () => {
    expect(formatInr(1500)).toBe("₹1.5k");
    expect(formatInr(2_50_000)).toBe("₹2.50 L");
    expect(formatInr(1_25_00_000)).toBe("₹1.25 Cr");
  });

  it("accepts bigint and numeric strings (Prisma BigInt columns)", () => {
    expect(formatInr(BigInt(100000))).toBe("₹1.00 L");
    expect(formatInr("250000")).toBe("₹2.50 L");
  });
});

describe("serializeForJson", () => {
  it("converts bigint to string and Date to ISO, recursively", () => {
    const input = {
      id: "t1",
      value: BigInt(123),
      publishedAt: new Date("2026-01-02T03:04:05.000Z"),
      awards: [{ amount: BigInt(7) }],
      nothing: null,
    };
    expect(serializeForJson(input)).toEqual({
      id: "t1",
      value: "123",
      publishedAt: "2026-01-02T03:04:05.000Z",
      awards: [{ amount: "7" }],
      nothing: null,
    });
  });

  it("passes primitives through untouched", () => {
    expect(serializeForJson(42)).toBe(42);
    expect(serializeForJson("x")).toBe("x");
    expect(serializeForJson(undefined)).toBeUndefined();
  });
});

describe("assertFactualCopy", () => {
  it("throws on banned adjectives (case-insensitive)", () => {
    expect(() => assertFactualCopy("This looks Suspicious", "test")).toThrow(/Banned adjective/);
    expect(() => assertFactualCopy("possible cartel", "test")).toThrow();
  });

  it("allows neutral factual language", () => {
    expect(() => assertFactualCopy("Single bidder. Publish to close: 12 days.", "test")).not.toThrow();
  });
});

describe("tenderError", () => {
  it("builds a uniform error envelope with a default 400 status", () => {
    expect(tenderError("NOT_FOUND", "no such tender", 404)).toEqual({
      error: { code: "NOT_FOUND", message: "no such tender" },
      status: 404,
    });
    expect(tenderError("BAD", "x").status).toBe(400);
  });
});
