import { describe, expect, test } from "vitest";
import { aggregate, explain, scoreAll, scoreDimension } from "./scoring";
import { DIMENSIONS, type Place, type TerrainMetrics, type Weights } from "./types";

const terrain = (over: Partial<TerrainMetrics> = {}): TerrainMetrics => ({
  windowKm: 60,
  baselineM: 463,
  validFraction: 1,
  slopeBinsDeg: [0, 2, 5, 10, 15, 20, 30, 90],
  slopeHist: [0.3, 0.3, 0.2, 0.1, 0.05, 0.03, 0.02],
  slopeMedianDeg: 4,
  slopeP90Deg: 12,
  reliefM: 1000,
  roughnessM: 20,
  hypsometricIntegral: 0.5,
  profile: { distKm: [0, 1], elevM: [0, 1] },
  ...over,
});

const full = (over: Partial<Place> = {}): Place => ({
  id: "p",
  body: "earth",
  name: "P",
  lat: 0,
  lon: 0,
  category: "volcanic",
  summary: "",
  terrain: terrain(),
  climate: { meanK: 250, maxK: 290, minK: 210, windMs: 5, basis: "measured", cite: "x" },
  attributes: {
    geology: { tags: ["basalt", "lava_flows"], cites: ["c"] },
    thermal: { tags: ["high_insolation"], cites: ["c"] },
    water_ice: { tags: ["ground_ice"], cites: ["c"] },
    dust_wind: { tags: ["dunes"], cites: ["c"] },
    biology: { tags: ["endoliths"], cites: ["c"] },
    subsurface: { tags: ["lava_tubes"], cites: ["c"] },
    operations: { tags: ["rover_tested"], cites: ["c"] },
  },
  ...over,
});

const even: Weights = Object.fromEntries(DIMENSIONS.map((d) => [d, 50])) as Weights;

describe("scoreDimension", () => {
  test("identical places score 100 on every dimension with data", () => {
    for (const r of scoreAll(full(), full())) expect(r.score).toBeCloseTo(100, 5);
  });

  test("no shared tags scores 0 on literature basis", () => {
    const site = full({ attributes: { geology: { tags: ["granite"], cites: ["c"] } } });
    const r = scoreDimension("geology", full(), site);
    expect(r.score).toBe(0);
    expect(r.basis).toBe("literature");
    expect(r.quality).toBeGreaterThan(0);
  });

  test("a dimension missing on one side is unknown, not zero", () => {
    const r = scoreDimension("biology", full(), full({ attributes: {} }));
    expect(r.score).toBeNull();
    expect(r.basis).toBe("none");
  });

  test("terrain quality scales with the valid data fraction", () => {
    const r = scoreDimension("terrain", full(), full({ terrain: terrain({ validFraction: 0.6 }) }));
    expect(r.quality).toBeCloseTo(0.6, 5);
  });

  test("terrain with half the relief scores lower than identical terrain", () => {
    const r = scoreDimension("terrain", full(), full({ terrain: terrain({ reliefM: 500 }) }));
    expect(r.score).toBeCloseTo(87.5, 5);
  });

  test("thermal uses literature quality when one side is literature", () => {
    const ref = full({ climate: { meanK: 250, maxK: 290, minK: 210, basis: "literature", cite: "x" } });
    // No illumination tags on the site, so only the climate comparison counts.
    const r = scoreDimension("thermal", ref, full({ attributes: {} }));
    expect(r.quality).toBeCloseTo(0.7, 5);
    expect(r.basis).toBe("mixed");
  });
});

describe("aggregate", () => {
  test("a missing dimension does not change the index", () => {
    const withAll = scoreAll(full(), full({ terrain: terrain({ reliefM: 500 }) }));
    const withoutBio = scoreAll(
      full(),
      full({
        terrain: terrain({ reliefM: 500 }),
        attributes: { ...full().attributes, biology: undefined },
      }),
    );
    const noBioWeight = { ...even, biology: 0 };
    expect(aggregate(withoutBio, even).index).toBeCloseTo(aggregate(withAll, noBioWeight).index!, 8);
    expect(aggregate(withoutBio, even).coverage).toBeCloseTo(7 / 8, 8);
  });

  test("fewer than three valid dimensions gives no index", () => {
    const site = full({ terrain: undefined, climate: undefined, attributes: { geology: full().attributes.geology } });
    const a = aggregate(scoreAll(full(), site), even);
    expect(a.valid).toBe(1);
    expect(a.index).toBeNull();
  });

  test("all weights zero gives null, not NaN", () => {
    const zero = Object.fromEntries(DIMENSIONS.map((d) => [d, 0])) as Weights;
    expect(aggregate(scoreAll(full(), full()), zero).index).toBeNull();
  });

  test("raising a weight where B beats A reorders A and B", () => {
    const ref = full();
    const a = full({ id: "a", attributes: { ...full().attributes, subsurface: { tags: ["karst"], cites: ["c"] } } });
    const b = full({ id: "b", terrain: terrain({ reliefM: 400, roughnessM: 8 }) });
    const idx = (p: Place, w: Weights) => aggregate(scoreAll(ref, p), w).index!;
    const terrainHeavy = { ...even, terrain: 100, subsurface: 1 };
    const subsurfaceHeavy = { ...even, terrain: 1, subsurface: 100 };
    expect(idx(a, terrainHeavy)).toBeGreaterThan(idx(b, terrainHeavy));
    expect(idx(b, subsurfaceHeavy)).toBeGreaterThan(idx(a, subsurfaceHeavy));
  });
});

describe("explain", () => {
  test("buckets by score and keeps unknowns separate", () => {
    const site = full({
      terrain: terrain({ reliefM: 500 }),
      attributes: { geology: { tags: ["granite"], cites: ["c"] } },
    });
    const e = explain(scoreAll(full(), site));
    expect(e.strong.map((r) => r.id)).toContain("terrain");
    expect(e.weak.map((r) => r.id)).toContain("geology");
    expect(e.unknown.map((r) => r.id)).toContain("biology");
  });
});
