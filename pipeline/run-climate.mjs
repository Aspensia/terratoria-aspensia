// node pipeline/run-climate.mjs  →  src/data/generated/climate.json
// Earth: NASA POWER climatology (MERRA-2 based). Moon: LRO Diviner Global Cumulative Product.
// Mars: no open gridded product was processed; Jezero uses a cited in-situ summary, Arsia is left unknown.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { TARGETS } from "./targets.mjs";

const retrieved = new Date().toISOString().slice(0, 10);
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

async function power(t) {
  const url = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=TS,TS_MAX,TS_MIN,WS10M&community=AG&longitude=${t.lon}&latitude=${t.lat}&format=JSON`;
  const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`POWER ${res.status}`);
  const j = await res.json();
  const p = j.properties.parameter;
  const vals = [p.TS.ANN, p.TS_MAX.ANN, p.TS_MIN.ANN, p.WS10M.ANN];
  if (vals.some((v) => v === undefined || v <= -900)) throw new Error("POWER fill value");
  return {
    meanK: round(p.TS.ANN + 273.15),
    maxK: round(p.TS_MAX.ANN + 273.15),
    minK: round(p.TS_MIN.ANN + 273.15),
    windMs: round(p.WS10M.ANN, 2),
    basis: "measured",
    cite: "NASA POWER climatology (MERRA-2), Earth skin temperature TS / TS_MAX / TS_MIN and 10 m wind WS10M, annual values at the 0.5° x 0.625° grid cell containing the site",
    product: "NASA POWER Climatology API",
    url: "https://power.larc.nasa.gov/",
    retrieved,
  };
}

// Diviner GCP: ASCII, 113-byte fixed rows, ordered lon (720) > lat (20 per 10° band) > local time (96).
const GCP = "https://pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/data_derived_gcp";
const ROW = 113;
async function diviner(t) {
  const lonE = ((t.lon + 180) % 360) - 180;
  const bandMin = Math.min(80, Math.floor(t.lat / 10) * 10);
  const name = (v) => `${String(Math.abs(v)).padStart(2, "0")}${v < 0 ? "s" : "n"}`;
  // Band names run low-to-high, e.g. 10n20n, 10s00s, 90s80s.
  const file = bandMin < 0 ? `${name(bandMin)}${bandMin + 10 === 0 ? "00s" : name(bandMin + 10)}` : `${name(bandMin)}${name(bandMin + 10)}`;
  const url = `${GCP}/global_cumul_avg_cyl_${file}_002.tab`;
  const lonIdx = Math.floor((lonE + 180) / 0.5);
  const latIdx = Math.floor((t.lat - bandMin) / 0.5);
  const first = 1 + lonIdx * 20 * 96 + latIdx * 96;
  const res = await fetch(url, {
    headers: { Range: `bytes=${first * ROW}-${(first + 96) * ROW - 1}` },
    signal: AbortSignal.timeout(60000),
  });
  if (res.status !== 206) throw new Error(`Diviner ${res.status}`);
  const rows = (await res.text()).trim().split("\n").map((l) => l.split(",").map(Number));
  assert.equal(rows.length, 96);
  // Guard the byte arithmetic: the bin we landed on must contain the target.
  assert.ok(Math.abs(rows[0][0] - lonE) <= 0.25 + 1e-6 && Math.abs(rows[0][1] - t.lat) <= 0.25 + 1e-6, `bin ${rows[0][0]},${rows[0][1]}`);
  const tbol = rows.map((r) => r[10]).filter((v) => v > 0);
  if (tbol.length < 48) throw new Error(`only ${tbol.length}/96 local-time bins observed`);
  return {
    meanK: round(tbol.reduce((a, b) => a + b, 0) / tbol.length),
    maxK: round(Math.max(...tbol)),
    minK: round(Math.min(...tbol)),
    basis: "measured",
    cite: `LRO Diviner Global Cumulative Product (LRO-L-DLRE-5-GCP-V1.0), bolometric brightness temperature in the 0.5° bin at ${rows[0][1]}°, ${rows[0][0]}°E over ${tbol.length}/96 local-time bins, 2009-07-05 to 2015-04-01 (Williams et al., 2017)`,
    product: "LRO Diviner GCP global_cumul_avg_cyl",
    url,
    retrieved,
  };
}

const LITERATURE = {
  "mars-jezero": {
    meanK: 218,
    maxK: 245.5,
    minK: 190.5,
    basis: "literature",
    cite: "Mars 2020 MEDA near-surface air temperature at Jezero: mean about -55 °C with a typical 50-60 K daily swing (Rodriguez-Manfredi et al., 2023). Air temperature at 1.45 m, not surface skin temperature.",
    product: "Published in-situ summary",
    url: "https://doi.org/10.1038/s41561-022-01084-0",
    retrieved,
  },
};

const out = {};
for (const t of TARGETS) {
  try {
    out[t.id] = t.body === "earth" ? await power(t) : t.body === "moon" ? await diviner(t) : (LITERATURE[t.id] ?? null);
    const c = out[t.id];
    console.log(t.id, c ? `${c.minK}–${c.maxK} K mean ${c.meanK} ${c.windMs ?? ""} [${c.basis}]` : "no data");
  } catch (e) {
    out[t.id] = null;
    console.log(t.id, "FAILED", e.message);
  }
}
mkdirSync("src/data/generated", { recursive: true });
writeFileSync("src/data/generated/climate.json", JSON.stringify(out, null, 1));
