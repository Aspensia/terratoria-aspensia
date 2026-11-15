import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EARTH_SITES } from "./catalog";
import { SITE_PHOTOS } from "./photos";

describe("site photography", () => {
  const earth = new Set(EARTH_SITES.map((s) => s.id));

  it("only covers Earth sites", () => {
    for (const id of Object.keys(SITE_PHOTOS)) expect(earth.has(id), id).toBe(true);
  });

  it("every photo has both image files, English and Khmer captions, a credit, a Commons source and a free licence", () => {
    for (const [id, list] of Object.entries(SITE_PHOTOS)) {
      for (const p of list) {
        expect(existsSync(`public/photos/${id}/${p.file}.webp`), `${id}/${p.file}`).toBe(true);
        expect(existsSync(`public/photos/${id}/${p.file}-sm.webp`), `${id}/${p.file}-sm`).toBe(true);
        expect(p.caption.length).toBeGreaterThan(10);
        expect(p.captionKm).toMatch(/[ក-៿]/); // Khmer script
        expect(p.credit).toMatch(/\S/);
        expect(p.source).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
        expect(p.license).toMatch(/^(Public domain|CC0|CC BY(-SA)?( [0-9.]+)?( [a-z]{2,3})?)$/i);
        expect(p.license).not.toMatch(/NC|ND/);
      }
    }
  });
});
