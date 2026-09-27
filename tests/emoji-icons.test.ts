/**
 * Design v5 "Calm" — the kit draws Lucide icons instead of emoji.
 * src/lib/design/emoji-icons.ts maps the emoji old call sites pass.
 */
import { describe, it, expect } from "vitest";
import { Coins, Landmark, Users, Vote, CloudRain } from "lucide-react";
import { emojiIcon } from "@/lib/design/emoji-icons";

describe("emojiIcon", () => {
  it("maps common kit emoji to their icons", () => {
    expect(emojiIcon("💰")).toBe(Coins);
    expect(emojiIcon("👨‍👩‍👧")).toBe(Users);
    expect(emojiIcon("🌧️")).toBe(CloudRain);
  });
  it("matches with or without the U+FE0F presentation selector", () => {
    expect(emojiIcon("🏛️")).toBe(Landmark);
    expect(emojiIcon("🏛")).toBe(Landmark);
    expect(emojiIcon("🗳️")).toBe(Vote);
    expect(emojiIcon(" 🗳 ")).toBe(Vote);
  });
  it("returns null for empty or unmapped input (the kit then draws nothing)", () => {
    expect(emojiIcon(undefined)).toBeNull();
    expect(emojiIcon("")).toBeNull();
    expect(emojiIcon("🦄")).toBeNull();
  });
});
