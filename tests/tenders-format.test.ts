/**
 * Unit tests for src/lib/tenders/format.ts — client-safe helpers used by the
 * Tenders routes and components. Pure functions, no DB.
 */
import { describe, it, expect } from "vitest";
import { serializeForJson, assertFactualCopy } from "@/lib/tenders/format";

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
