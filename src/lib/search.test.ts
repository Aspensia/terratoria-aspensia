import { expect, test } from "vitest";
import { matchesKeywords } from "./search";
import { getPlace } from "../data/catalog";

const atacama = getPlace("atacama-yungay")!;
const mauna = getPlace("mauna-loa")!;

test("matches words in the name, summary and documented characteristics", () => {
  expect(matchesKeywords(atacama, "desert")).toBe(true);
  expect(matchesKeywords(atacama, "Chile")).toBe(true);
  expect(matchesKeywords(mauna, "lava tubes")).toBe(true);
});

test("every keyword must match", () => {
  expect(matchesKeywords(atacama, "desert chile")).toBe(true);
  expect(matchesKeywords(atacama, "desert lava")).toBe(false);
});

test("keywords match from the start of a word, so 'ice' does not match 'practice'", () => {
  expect(matchesKeywords(mauna, "ice")).toBe(false);
});

test("an empty query matches everything", () => {
  expect(matchesKeywords(atacama, "  ")).toBe(true);
});
