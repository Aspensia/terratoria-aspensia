// Terrain metrics for one square elevation window. Pure; NaN marks nodata.
export const SLOPE_BINS_DEG = [0, 2, 5, 10, 15, 20, 30, 90];
const MIN_VALID = 0.5;

const quantile = (sorted, q) => {
  if (sorted.length === 0) return NaN;
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
};
const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

export function terrainMetrics(grid, n, cellM) {
  const z = (r, c) => grid[r * n + c];
  const valid = [];
  for (let i = 0; i < grid.length; i++) if (Number.isFinite(grid[i])) valid.push(grid[i]);
  const validFraction = valid.length / grid.length;
  if (validFraction < MIN_VALID) return null;

  // Horn (1981) 3x3 slope, only where all nine cells are valid.
  const slopes = [];
  for (let r = 1; r < n - 1; r++) {
    for (let c = 1; c < n - 1; c++) {
      const a = z(r - 1, c - 1), b = z(r - 1, c), cc = z(r - 1, c + 1);
      const d = z(r, c - 1), e = z(r, c), f = z(r, c + 1);
      const g = z(r + 1, c - 1), h = z(r + 1, c), i = z(r + 1, c + 1);
      if (![a, b, cc, d, e, f, g, h, i].every(Number.isFinite)) continue;
      const dzdx = (cc + 2 * f + i - (a + 2 * d + g)) / (8 * cellM);
      const dzdy = (g + 2 * h + i - (a + 2 * b + cc)) / (8 * cellM);
      slopes.push((Math.atan(Math.hypot(dzdx, dzdy)) * 180) / Math.PI);
    }
  }
  if (slopes.length === 0) return null;
  slopes.sort((x, y) => x - y);
  const hist = new Array(SLOPE_BINS_DEG.length - 1).fill(0);
  for (const s of slopes) {
    let b = hist.length - 1;
    for (let k = 0; k < hist.length; k++) {
      if (s < SLOPE_BINS_DEG[k + 1]) { b = k; break; }
    }
    hist[b]++;
  }

  // Roughness: std of elevation minus its 5x5 neighbourhood mean (full windows only).
  let sumSq = 0;
  let count = 0;
  for (let r = 2; r < n - 2; r++) {
    for (let c = 2; c < n - 2; c++) {
      let sum = 0;
      let ok = true;
      for (let dr = -2; dr <= 2 && ok; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const v = z(r + dr, c + dc);
          if (!Number.isFinite(v)) { ok = false; break; }
          sum += v;
        }
      }
      if (!ok) continue;
      const resid = z(r, c) - sum / 25;
      sumSq += resid * resid;
      count++;
    }
  }

  valid.sort((x, y) => x - y);
  const min = valid[0];
  const max = valid[valid.length - 1];
  const mean = valid.reduce((s, v) => s + v, 0) / valid.length;

  const mid = Math.floor(n / 2);
  const distKm = [];
  const elevM = [];
  for (let c = 0; c < n; c++) {
    distKm.push(round((c * cellM) / 1000, 2));
    const v = z(mid, c);
    elevM.push(Number.isFinite(v) ? Math.round(v - mean) : null);
  }

  return {
    windowKm: round((n * cellM) / 1000, 1),
    baselineM: cellM,
    validFraction: round(validFraction, 3),
    slopeBinsDeg: SLOPE_BINS_DEG,
    slopeHist: hist.map((h) => h / slopes.length),
    slopeMedianDeg: round(quantile(slopes, 0.5)),
    slopeP90Deg: round(quantile(slopes, 0.9)),
    reliefM: Math.round(quantile(valid, 0.98) - quantile(valid, 0.02)),
    roughnessM: count ? round(Math.sqrt(sumSq / count)) : 0,
    hypsometricIntegral: max === min ? 0.5 : round((mean - min) / (max - min), 3),
    meanElevM: Math.round(mean),
    profile: { distKm, elevM },
  };
}
