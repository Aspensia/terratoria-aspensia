import { describe, expect, test } from "vitest";
import { EARTH_SITES, PLACES, REFERENCES, VOCABULARY, getPlace } from "./catalog";
import { DATASETS } from "./datasets";
import { PRESETS } from "./presets";
import { aggregate, scoreAll } from "../lib/scoring";
import { DIMENSIONS, type DimensionId } from "../lib/types";

describe("catalogue integrity", () => {
  test("ids are unique and coordinates are in range", () => {
    expect(new Set(PLACES.map((p) => p.id)).size).toBe(PLACES.length);
    for (const p of PLACES) {
      expect(Math.abs(p.lat)).toBeLessThanOrEqual(90);
      expect(p.lon).toBeGreaterThanOrEqual(-180);
      expect(p.lon).toBeLessThanOrEqual(360);
    }
  });

  test("there are 4 reference regions, two per world, and at least 12 Earth sites", () => {
    expect(REFERENCES.filter((p) => p.body === "moon")).toHaveLength(2);
    expect(REFERENCES.filter((p) => p.body === "mars")).toHaveLength(2);
    expect(EARTH_SITES.length).toBeGreaterThanOrEqual(12);
  });

  test("every tag is in the vocabulary and every tag set is cited", () => {
    for (const p of PLACES) {
      for (const [dim, set] of Object.entries(p.attributes)) {
        expect(set!.cites.length, `${p.id}.${dim} cites`).toBeGreaterThan(0);
        for (const tag of set!.tags) {
          expect(VOCABULARY[dim as DimensionId], `${p.id}.${dim}`).toContain(tag);
        }
      }
    }
  });

  test("every Earth site has a status with a source", () => {
    for (const p of EARTH_SITES) {
      expect(p.status, p.id).toBeDefined();
      expect(p.statusCite, p.id).toBeTruthy();
    }
  });

  test("pipeline output is merged: references have terrain, Earth sites have climate", () => {
    for (const p of REFERENCES) expect(p.terrain, p.id).toBeDefined();
    for (const p of EARTH_SITES) expect(p.climate, p.id).toBeDefined();
    expect(getPlace("moon-shackleton")!.climate!.basis).toBe("measured");
  });

  test("use cases only point at real dimensions", () => {
    for (const p of EARTH_SITES)
      for (const u of p.useCases ?? []) for (const d of u.because) expect(DIMENSIONS).toContain(d);
  });

  test("getPlace returns undefined for an unknown id", () => {
    expect(getPlace("nope")).toBeUndefined();
  });
});

describe("presets and datasets", () => {
  test("six presets, each covering all eight dimensions", () => {
    expect(PRESETS).toHaveLength(6);
    for (const p of PRESETS) for (const d of DIMENSIONS) expect(typeof p.weights[d]).toBe("number");
  });

  test("every dataset has an access link and a processing level", () => {
    for (const d of DATASETS) {
      expect(d.url).toMatch(/^https:\/\//);
      expect(["raw", "processed", "derived", "literature"]).toContain(d.level);
    }
  });
});

describe("real comparison runs", () => {
  test("every reference region produces an index for at least five Earth sites", () => {
    const even = Object.fromEntries(DIMENSIONS.map((d) => [d, 50])) as Record<DimensionId, number>;
    for (const ref of REFERENCES) {
      const ranked = EARTH_SITES.map((s) => aggregate(scoreAll(ref, s), even)).filter((a) => a.index !== null);
      expect(ranked.length, ref.id).toBeGreaterThanOrEqual(5);
      for (const a of ranked) {
        expect(a.index!).toBeGreaterThanOrEqual(0);
        expect(a.index!).toBeLessThanOrEqual(100);
      }
    }
  });

  test("a site without terrain data (Lanzarote) is unknown on terrain, not zero", () => {
    const r = scoreAll(getPlace("moon-marius")!, getPlace("lanzarote")!).find((x) => x.id === "terrain")!;
    expect(r.score).toBeNull();
  });
});
