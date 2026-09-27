/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it } from "vitest";
import { dedupeStories } from "@/lib/news-dedupe";

const n = (title: string, publishedAt: string) => ({ title, publishedAt });

describe("dedupeStories (real Mandya headlines, Sept 2026)", () => {
  it("collapses one story told by several outlets", () => {
    const out = dedupeStories(
      [
        n("India News | Karnataka: Lokayukta Raids in Mandya, Kalaburagi over Alleged Disproportionate Assets Cases", "2026-09-22T05:46Z"),
        n("Karnataka: Lokayukta raids in Mandya, Kalaburagi over alleged disproportionate assets cases", "2026-09-22T05:33Z"),
        n("Karnataka Lokayukta raids Mandya, Kalaburagi over assets claims", "2026-09-22T05:32Z"),
      ],
      ["mandya"],
    );
    expect(out).toHaveLength(1);
    expect(out[0].title.startsWith("India News")).toBe(false);
  });

  it("keeps a follow-up that is a different angle", () => {
    const out = dedupeStories(
      [
        n("Mandya road accident: Woman techie dies after car falls from flyover", "2026-09-19T03:26Z"),
        n("Car Falls From Bengaluru-Mysuru Expressway Flyover in Mandya; Woman Dead", "2026-09-18T11:35Z"),
        n("Karnataka: Woman dies after car falls from Bengaluru-Mysuru expressway flyover in Mandya", "2026-09-18T10:31Z"),
        n("Mandya: Car falls from Bengaluru-Mysuru Expressway flyover, woman seriously injured", "2026-09-18T09:45Z"),
      ],
      ["mandya"],
    );
    expect(out.map((r) => r.publishedAt)).toEqual(["2026-09-19T03:26Z", "2026-09-18T11:35Z"]);
  });

  it("does not merge different stories that share a few words", () => {
    const out = dedupeStories(
      [
        n("Upa Lokayukta registers case against MIMS, Mandya jail authorities", "2026-09-19T17:01Z"),
        n("Upa Lokayukta registers suo moto cases against DHO, THO, doctors and PDO in Mandya", "2026-09-16T17:42Z"),
        n("3 of family killed as milk tanker rams scooter in Karnataka's Mandya, driver detained", "2026-09-15T11:58Z"),
        n("Three killed after milk tanker rams into motorcyle in Karnataka's Mandya district", "2026-09-15T06:19Z"),
      ],
      ["mandya"],
    );
    expect(out).toHaveLength(3); // the two tanker reports are one story
  });
});
