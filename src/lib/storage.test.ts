import { expect, test } from "vitest";
import { parseWeights, readSaved, serializeWeights, toggleId, writeSaved } from "./storage";
import { BALANCED } from "../data/presets";

const throwing = {
  getItem() {
    throw new Error("blocked");
  },
  setItem() {
    throw new Error("blocked");
  },
};

test("storage that throws reads as an empty list and writing does not throw", () => {
  expect(readSaved(throwing, ["a"])).toEqual([]);
  expect(() => writeSaved(throwing, ["a"])).not.toThrow();
});

test("no storage at all reads as an empty list", () => {
  expect(readSaved(undefined, ["a"])).toEqual([]);
});

test("stale and malformed entries are dropped", () => {
  const store = { getItem: () => JSON.stringify(["a", "gone", 7, "b"]), setItem() {} };
  expect(readSaved(store, ["a", "b", "c"])).toEqual(["a", "b"]);
  expect(readSaved({ getItem: () => "{not json", setItem() {} }, ["a"])).toEqual([]);
});

test("toggleId adds then removes", () => {
  expect(toggleId([], "a")).toEqual(["a"]);
  expect(toggleId(["a", "b"], "a")).toEqual(["b"]);
});

test("weights survive a round trip through the URL", () => {
  const w = { ...BALANCED, terrain: 100, biology: 0 };
  expect(parseWeights(serializeWeights(w))).toEqual(w);
});

test("a malformed weight string falls back to balanced weights", () => {
  expect(parseWeights("1,2,banana")).toEqual(BALANCED);
  expect(parseWeights(null)).toEqual(BALANCED);
  expect(parseWeights("999,-5,50,50,50,50,50,50").terrain).toBe(100);
  expect(parseWeights("999,-5,50,50,50,50,50,50").geology).toBe(0);
});
