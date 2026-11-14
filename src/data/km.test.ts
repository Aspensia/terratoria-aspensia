import { expect, test } from "vitest";
import { PLACES, VOCABULARY } from "./catalog";
import { PLACE_KM, TAG_KM } from "./km";

test("every place has Khmer text, with the same number of differences and use cases as the English", () => {
  for (const p of PLACES) {
    const km = PLACE_KM[p.id];
    expect(km, p.id).toBeDefined();
    expect(km.summary.length, p.id).toBeGreaterThan(20);
    expect(km.differences?.length ?? 0, `${p.id} differences`).toBe(p.differences?.length ?? 0);
    expect(km.useCases?.length ?? 0, `${p.id} use cases`).toBe(p.useCases?.length ?? 0);
  }
});

test("every tag in the vocabulary has a Khmer label", () => {
  for (const tags of Object.values(VOCABULARY)) for (const t of tags) expect(TAG_KM[t], t).toBeTruthy();
});
