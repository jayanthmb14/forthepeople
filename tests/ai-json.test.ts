/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// JSON extraction from model answers (src/lib/ai-json.ts). Every case here
// is a shape a real model has returned.
import { describe, expect, it } from "vitest";
import { AIJSONError, asArray, extractJSON, stripReasoning } from "@/lib/ai-json";

describe("extractJSON", () => {
  it("parses a bare object and a bare array", () => {
    expect(extractJSON('{"a":1}')).toEqual({ a: 1 });
    expect(extractJSON("[1,2,3]")).toEqual([1, 2, 3]);
    expect(extractJSON('[{"title":"x"}]', "array")).toEqual([{ title: "x" }]);
  });

  it("strips markdown fences", () => {
    expect(extractJSON('```json\n{"severity":"good"}\n```')).toEqual({ severity: "good" });
    expect(extractJSON('Here you go:\n```\n[{"t":1}]\n```\nThanks')).toEqual([{ t: 1 }]);
  });

  it("finds JSON after a preamble or leaked reasoning", () => {
    const text = 'Okay, the user wants a classification. Let me think.\n{"targetModule":"water","confidence":0.9}';
    expect(extractJSON(text, "object")).toEqual({ targetModule: "water", confidence: 0.9 });
  });

  it("drops <think> blocks", () => {
    const text = '<think>The article {maybe} mentions [1] dams</think>{"module":"water"}';
    expect(extractJSON(text, "object")).toEqual({ module: "water" });
    expect(stripReasoning("<think>abc</think> hi")).toBe("hi");
  });

  it("prefers the largest piece, so a citation like [1] never wins", () => {
    const text = 'Based on article [1], here is the answer: {"headline":"Dam full","relevantNewsIndices":[1]}';
    expect(extractJSON(text)).toEqual({ headline: "Dam full", relevantNewsIndices: [1] });
  });

  it("honours braces inside strings", () => {
    const text = 'Answer: {"summary":"uses } and { and ] inside","ok":true}';
    expect(extractJSON(text, "object")).toEqual({ summary: "uses } and { and ] inside", ok: true });
  });

  it("repairs trailing commas", () => {
    expect(extractJSON('{"a":[1,2,],"b":3,}')).toEqual({ a: [1, 2], b: 3 });
  });

  it("respects the requested shape", () => {
    expect(() => extractJSON("[1,2]", "object")).toThrow(AIJSONError);
    expect(() => extractJSON('{"tips":[1]}', "array")).toThrow(AIJSONError);
  });

  it("throws on empty or JSON-free answers", () => {
    expect(() => extractJSON("")).toThrow(AIJSONError);
    expect(() => extractJSON("Okay, the user just")).toThrow(AIJSONError);
    expect(() => extractJSON("<think>only thinking</think>")).toThrow(AIJSONError);
  });
});

describe("asArray", () => {
  it("accepts a bare array or an object wrapping one list", () => {
    expect(asArray([1, 2])).toEqual([1, 2]);
    expect(asArray({ tips: [1, 2] }, "tips")).toEqual([1, 2]);
    expect(asArray({ items: [3] })).toEqual([3]);
  });

  it("returns [] when there is no single list", () => {
    expect(asArray({ a: [1], b: [2] })).toEqual([]);
    expect(asArray(null)).toEqual([]);
    expect(asArray("x")).toEqual([]);
  });
});
