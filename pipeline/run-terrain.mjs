// node pipeline/run-terrain.mjs  →  src/data/generated/terrain.json
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { readWindow } from "./lib/fetch-dem.mjs";
import { terrainMetrics } from "./lib/terrain.mjs";
import { TARGETS } from "./targets.mjs";

const centre = (w) => w.grid[Math.floor(w.n / 2) * w.n + Math.floor(w.n / 2)];
const range = (w) => {
  let lo = Infinity, hi = -Infinity;
  for (const v of w.grid) if (Number.isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  return [lo, hi];
};

// Sanity checks against independently known values before any metric is trusted.
async function selfCheck() {
  const mk = await readWindow({ body: "earth", lat: 19.4721, lon: -155.5922 }); // Mauna Loa summit, 4169 m
  assert.ok(Math.abs(centre(mk) - 4169) < 4169 * 0.1, `Mauna Loa summit read ${centre(mk)}`);
  const jz = await readWindow({ body: "mars", lat: 18.44, lon: 77.45 }); // Jezero floor, about -2.6 km (MOLA)
  assert.ok(Math.abs(centre(jz) + 2600) < 260, `Jezero floor read ${centre(jz)}`);
  const sh = await readWindow({ body: "moon", lat: -89.67, lon: 129.78 }); // Shackleton, ~4.2 km deep
  const [lo, hi] = range(sh);
  assert.ok(centre(sh) < -2300, `Shackleton floor read ${centre(sh)}`);
  assert.ok(hi - lo > 3500, `Shackleton window relief ${hi - lo}`);
  const mh = await readWindow({ body: "moon", lat: 14.09, lon: 303.23 }); // Marius Hills, about -1.8 km
  assert.ok(centre(mh) < -1000 && centre(mh) > -2600, `Marius Hills read ${centre(mh)}`);
  console.log("self-check ok", { maunaLoa: centre(mk), jezero: centre(jz), shackleton: centre(sh), marius: centre(mh) });
}

await selfCheck();
const retrieved = new Date().toISOString().slice(0, 10);
const out = {};
for (const t of TARGETS) {
  try {
    const w = await readWindow(t);
    const m = terrainMetrics(w.grid, w.n, w.cellM);
    if (m) {
      // Elevation grid for the side-by-side shaded-relief view (metres, null = nodata).
      mkdirSync("public/grids", { recursive: true });
      writeFileSync(`public/grids/${t.id}.json`, JSON.stringify({ n: w.n, cellM: w.cellM, z: Array.from(w.grid, (v) => (Number.isFinite(v) ? Math.round(v) : null)) }));
    }
    out[t.id] = m ? { ...m, product: w.product, url: w.url, retrieved } : null;
    console.log(t.id, m ? `slope50 ${m.slopeMedianDeg} relief ${m.reliefM} rough ${m.roughnessM} valid ${m.validFraction}` : "insufficient valid data");
  } catch (e) {
    out[t.id] = null;
    console.log(t.id, "FAILED", e.message);
  }
}
mkdirSync("src/data/generated", { recursive: true });
writeFileSync("src/data/generated/terrain.json", JSON.stringify(out));
