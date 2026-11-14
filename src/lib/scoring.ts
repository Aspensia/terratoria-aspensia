// Exploratory Analogue Similarity Index. Pure functions; no UI imports.
// Every rule here is documented on the Data and Methods page — keep them in step.
import {
  DIMENSIONS,
  type Aggregate,
  type Basis,
  type DimensionId,
  type DimensionResult,
  type Place,
  type Weights,
} from "./types";

export const MIN_VALID_DIMENSIONS = 3;
const Q_TAGS = 0.6;
const Q_CLIMATE_MEASURED = 0.9;
const Q_CLIMATE_LITERATURE = 0.7;

interface Part {
  score: number;
  quality: number;
  weight: number;
  basis: "measured" | "literature";
  evidence: string[];
}

const ratio = (a: number, b: number) => {
  const hi = Math.max(Math.abs(a), Math.abs(b));
  return hi === 0 ? 100 : (100 * Math.min(Math.abs(a), Math.abs(b))) / hi;
};
const decay = (delta: number, scale: number) => 100 * Math.exp(-Math.abs(delta) / scale);
const f = (n: number, d = 0) => n.toFixed(d);
const label = (t: string) => t.replace(/_/g, " ");

function tagPart(id: DimensionId, ref: Place, site: Place, weight = 1): Part | null {
  const r = ref.attributes[id];
  const s = site.attributes[id];
  if (!r || !s || r.tags.length === 0) return null;
  const shared = r.tags.filter((t) => s.tags.includes(t));
  const missing = r.tags.filter((t) => !s.tags.includes(t));
  const evidence = [];
  if (shared.length) evidence.push(`Shared: ${shared.map(label).join(", ")}`);
  if (missing.length) evidence.push(`Not reproduced on Earth site: ${missing.map(label).join(", ")}`);
  return {
    score: (100 * shared.length) / r.tags.length,
    quality: Q_TAGS,
    weight,
    basis: "literature",
    evidence,
  };
}

function terrainPart(ref: Place, site: Place): Part | null {
  const a = ref.terrain;
  const b = site.terrain;
  if (!a || !b) return null;
  const l1 = a.slopeHist.reduce((sum, v, i) => sum + Math.abs(v - (b.slopeHist[i] ?? 0)), 0);
  const hist = 100 * (1 - l1 / 2);
  const relief = ratio(a.reliefM, b.reliefM);
  const rough = ratio(a.roughnessM, b.roughnessM);
  const hyps = 100 * (1 - Math.abs(a.hypsometricIntegral - b.hypsometricIntegral));
  return {
    score: (hist + relief + rough + hyps) / 4,
    quality: Math.min(a.validFraction, b.validFraction),
    weight: 1,
    basis: "measured",
    evidence: [
      `Slope distribution overlap ${f(hist)}% (median ${f(b.slopeMedianDeg, 1)}° vs ${f(a.slopeMedianDeg, 1)}°)`,
      `Local relief ${f(b.reliefM)} m vs ${f(a.reliefM)} m`,
      `Roughness ${f(b.roughnessM, 1)} m vs ${f(a.roughnessM, 1)} m at a ${f(a.baselineM)} m baseline`,
      `Hypsometric integral ${f(b.hypsometricIntegral, 2)} vs ${f(a.hypsometricIntegral, 2)}`,
    ],
  };
}

function climatePart(ref: Place, site: Place): Part | null {
  const a = ref.climate;
  const b = site.climate;
  if (!a || !b) return null;
  const measured = a.basis === "measured" && b.basis === "measured";
  const rangeA = a.maxK - a.minK;
  const rangeB = b.maxK - b.minK;
  return {
    score: (decay(a.meanK - b.meanK, 60) + decay(rangeA - rangeB, 80)) / 2,
    quality: measured ? Q_CLIMATE_MEASURED : Q_CLIMATE_LITERATURE,
    weight: 3,
    basis: measured ? "measured" : "literature",
    evidence: [
      `Mean surface temperature ${f(b.meanK)} K vs ${f(a.meanK)} K`,
      `Temperature range ${f(rangeB)} K vs ${f(rangeA)} K`,
    ],
  };
}

function windPart(ref: Place, site: Place): Part | null {
  const a = ref.climate?.windMs;
  const b = site.climate?.windMs;
  if (a == null || b == null) return null;
  const measured = ref.climate!.basis === "measured" && site.climate!.basis === "measured";
  return {
    score: ratio(a, b),
    quality: measured ? Q_CLIMATE_MEASURED : Q_CLIMATE_LITERATURE,
    weight: 1,
    basis: measured ? "measured" : "literature",
    evidence: [`Mean near-surface wind ${f(b, 1)} m/s vs ${f(a, 1)} m/s`],
  };
}

function mobilityPart(ref: Place, site: Place): Part | null {
  const a = ref.terrain;
  const b = site.terrain;
  if (!a || !b) return null;
  return {
    score: decay(a.slopeP90Deg - b.slopeP90Deg, 10),
    quality: Math.min(a.validFraction, b.validFraction),
    weight: 1,
    basis: "measured",
    evidence: [`90th-percentile slope ${f(b.slopeP90Deg, 1)}° vs ${f(a.slopeP90Deg, 1)}°`],
  };
}

const METHODS: Record<DimensionId, string> = {
  terrain:
    "Mean of four measured comparisons on DEMs resampled to a common baseline: slope-histogram overlap, local relief ratio, roughness ratio and hypsometric integral difference.",
  geology: "Share of the reference region's documented geological characteristics also documented at the Earth site.",
  thermal:
    "Mean surface temperature difference (60 K scale) and temperature-range difference (80 K scale), blended 75/25 with shared illumination characteristics where documented.",
  water_ice: "Share of the reference region's documented water, ice and volatile characteristics also documented at the Earth site.",
  dust_wind: "Shared aeolian and dust characteristics, blended 50/50 with the ratio of mean near-surface wind speeds where both are available.",
  biology: "Share of the habitability and biosignature-relevant characteristics of the reference region that the Earth site lets researchers study.",
  subsurface: "Share of the reference region's documented subsurface features (caves, lava tubes, pits) also documented at the Earth site.",
  operations: "Shared operational characteristics from field campaigns, blended 50/50 with similarity of steep-slope (90th percentile) terrain.",
};

function combine(id: DimensionId, required: (Part | null)[], optional: (Part | null)[] = []): DimensionResult {
  const base = required.filter((p): p is Part => p !== null);
  if (base.length === 0) {
    return { id, score: null, quality: 0, basis: "none", method: METHODS[id], evidence: [] };
  }
  const parts = [...base, ...optional.filter((p): p is Part => p !== null)];
  const total = parts.reduce((s, p) => s + p.weight, 0);
  const bases = new Set(parts.map((p) => p.basis));
  const basis: Basis = bases.size > 1 ? "mixed" : parts[0].basis;
  return {
    id,
    score: parts.reduce((s, p) => s + p.score * p.weight, 0) / total,
    quality: parts.reduce((s, p) => s + p.quality * p.weight, 0) / total,
    basis,
    method: METHODS[id],
    evidence: parts.flatMap((p) => p.evidence),
  };
}

export function scoreDimension(id: DimensionId, ref: Place, site: Place): DimensionResult {
  switch (id) {
    case "terrain":
      return combine(id, [terrainPart(ref, site)]);
    case "thermal": {
      const r = combine(id, [climatePart(ref, site)], [tagPart(id, ref, site)]);
      // One literature-derived side makes the whole comparison mixed-basis.
      if (r.score !== null && (ref.climate!.basis !== site.climate!.basis)) r.basis = "mixed";
      return r;
    }
    case "dust_wind":
      return combine(id, [tagPart(id, ref, site)], [windPart(ref, site)]);
    case "operations": {
      const tags = tagPart(id, ref, site);
      const mob = mobilityPart(ref, site);
      if (tags) return combine(id, [tags], [mob]);
      // No documented field history: slope alone is weak evidence, so halve its quality.
      const r = combine(id, [mob]);
      if (r.score !== null) {
        r.quality *= 0.5;
        r.evidence.push("No documented field campaigns; based on slope similarity only");
      }
      return r;
    }
    default:
      return combine(id, [tagPart(id, ref, site)]);
  }
}

export function scoreAll(ref: Place, site: Place): DimensionResult[] {
  return DIMENSIONS.map((id) => scoreDimension(id, ref, site));
}

export function aggregate(results: DimensionResult[], w: Weights): Aggregate {
  const known = results.filter((r) => r.score !== null);
  const used = known.filter((r) => (w[r.id] ?? 0) > 0);
  const denom = used.reduce((s, r) => s + w[r.id] * r.quality, 0);
  const coverage = known.length / DIMENSIONS.length;
  if (used.length < MIN_VALID_DIMENSIONS || denom === 0) {
    return { index: null, coverage, valid: used.length };
  }
  const num = used.reduce((s, r) => s + w[r.id] * r.quality * (r.score as number), 0);
  return { index: num / denom, coverage, valid: used.length };
}

export function explain(results: DimensionResult[]) {
  const known = results.filter((r) => r.score !== null);
  return {
    strong: known.filter((r) => r.score! >= 70),
    moderate: known.filter((r) => r.score! >= 40 && r.score! < 70),
    weak: known.filter((r) => r.score! < 40),
    unknown: results.filter((r) => r.score === null),
  };
}
