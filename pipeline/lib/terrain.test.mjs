import assert from "node:assert/strict";
import { test } from "node:test";
import { terrainMetrics } from "./terrain.mjs";

const N = 40;
const CELL = 463;
const make = (fn) => {
  const g = new Float32Array(N * N);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) g[r * N + c] = fn(r, c);
  return g;
};

test("a 10% grade plane has a 5.71 degree median slope and no roughness", () => {
  const m = terrainMetrics(make((r, c) => c * CELL * 0.1), N, CELL);
  assert.ok(Math.abs(m.slopeMedianDeg - 5.71) < 0.05, `median ${m.slopeMedianDeg}`);
  assert.ok(m.roughnessM < 0.01, `roughness ${m.roughnessM}`);
  assert.ok(Math.abs(m.hypsometricIntegral - 0.5) < 0.01);
});

test("a flat grid has zero relief and all slopes in the first bin", () => {
  const m = terrainMetrics(make(() => 100), N, CELL);
  assert.equal(m.reliefM, 0);
  assert.equal(m.slopeHist[0], 1);
  assert.equal(m.hypsometricIntegral, 0.5);
});

test("the slope histogram sums to 1", () => {
  const m = terrainMetrics(make((r, c) => 300 * Math.sin(r / 3) * Math.cos(c / 4)), N, CELL);
  const sum = m.slopeHist.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9);
  assert.equal(m.slopeHist.length, m.slopeBinsDeg.length - 1);
});

test("a window that is 60% nodata yields no metrics", () => {
  const g = make((r, c) => (r < N * 0.6 ? NaN : c));
  assert.equal(terrainMetrics(g, N, CELL), null);
});

test("a window that is 10% nodata still yields metrics and reports the valid fraction", () => {
  const g = make((r, c) => (r < N * 0.1 ? NaN : c * 10));
  const m = terrainMetrics(g, N, CELL);
  assert.ok(m);
  assert.ok(Math.abs(m.validFraction - 0.9) < 0.001);
  assert.ok(Number.isFinite(m.slopeMedianDeg));
});

test("the profile is relative to the mean and spans the window", () => {
  const m = terrainMetrics(make((r, c) => 1000 + c), N, CELL);
  assert.equal(m.profile.distKm.length, N);
  const mean = m.profile.elevM.reduce((a, b) => a + b, 0) / N;
  assert.ok(Math.abs(mean) < 1);
});
