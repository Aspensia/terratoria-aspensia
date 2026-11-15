import { describe, expect, test } from "vitest";
import { EARTH_SITES, REFERENCES } from "../data/catalog";
import { makeFlashcards } from "./flashcards";

describe("flashcards", () => {
  const cards = makeFlashcards();

  test("one card per reference region and per Earth site, each with unique id", () => {
    expect(cards.length).toBe(REFERENCES.length + EARTH_SITES.length);
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
  });

  test("every side has English and Khmer text", () => {
    for (const c of cards)
      for (const t of [c.title, c.question, c.answer, c.detail]) {
        expect(t.en.length).toBeGreaterThan(2);
        expect(t.km).toMatch(/[\u1780-\u17FF]|[A-Za-z]/);
      }
  });

  test("the question never contains the answer", () => {
    for (const c of cards) expect(c.question.en).not.toContain(c.answer.en.split(" · ")[0]);
  });
});
