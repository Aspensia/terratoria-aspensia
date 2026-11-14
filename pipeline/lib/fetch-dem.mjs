// Reads a 60 km elevation window at a common 463 m baseline for Earth, Moon or Mars.
// Sources are open archives read over HTTP; downloads are cached in pipeline/.cache.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fromArrayBuffer } from "geotiff";

const CACHE = join(dirname(fileURLToPath(import.meta.url)), "..", ".cache");
mkdirSync(CACHE, { recursive: true });

export const CELL_M = 463; // MOLA MEGDR 128 px/deg pixel at Mars' equator
export const N = 130; // 130 x 463 m = 60.2 km
const RADIUS_M = { earth: 6371000, moon: 1737400, mars: 3396190 };
const PDS = "https://pds-geosciences.wustl.edu";

export const PRODUCTS = {
  earth: {
    product: "Copernicus DEM GLO-90 (DSM, COG)",
    base: "https://copernicus-dem-90m.s3.amazonaws.com",
  },
  mars: {
    product: "MGS MOLA MEGDR 128 px/deg topography (megt, v2.0)",
    base: `${PDS}/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg128`,
  },
  moonCyl: {
    product: "LRO LOLA GDR LDEM_64 (64 px/deg, v3.1)",
    base: `${PDS}/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img`,
  },
  moonSouth: {
    product: "LRO LOLA GDR LDEM_80S_80M (south polar stereographic, 80 m)",
    base: `${PDS}/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img`,
  },
};

export async function cachedFetch(url, range) {
  const key = createHash("sha1").update(url + (range ?? "")).digest("hex");
  const file = join(CACHE, key);
  if (existsSync(file)) {
    const buf = readFileSync(file);
    return buf.length ? buf : null;
  }
  const res = await fetch(url, { headers: range ? { Range: range } : {}, signal: AbortSignal.timeout(180000) });
  if (res.status === 404 || res.status === 403) {
    writeFileSync(file, Buffer.alloc(0)); // remember "no such tile"
    return null;
  }
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(file, buf);
  return buf;
}

const bilinear = (get, x, y) => {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = x - x0, fy = y - y0;
  const a = get(x0, y0), b = get(x0 + 1, y0), c = get(x0, y0 + 1), d = get(x0 + 1, y0 + 1);
  if (![a, b, c, d].every(Number.isFinite)) return NaN;
  return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
};

// ---- Raw PDS image blocks (full-width rows fetched with one HTTP Range request) ----
async function rowBlock(url, width, row0, row1, littleEndian, scale) {
  const buf = await cachedFetch(url, `bytes=${row0 * width * 2}-${(row1 + 1) * width * 2 - 1}`);
  if (!buf) throw new Error(`missing ${url}`);
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  return (col, row) => {
    if (row < row0 || row > row1 || col < 0 || col >= width) return NaN;
    return view.getInt16(((row - row0) * width + col) * 2, littleEndian) * scale;
  };
}

// ---- Earth: Copernicus GLO-90 one-degree tiles ----
const earthTiles = new Map();
const pad = (v, n) => String(Math.abs(v)).padStart(n, "0");
export function earthTileUrl(latFloor, lonFloor) {
  const name = `Copernicus_DSM_COG_30_${latFloor < 0 ? "S" : "N"}${pad(latFloor, 2)}_00_${lonFloor < 0 ? "W" : "E"}${pad(lonFloor, 3)}_00_DEM`;
  return `${PRODUCTS.earth.base}/${name}/${name}.tif`;
}
async function loadEarthTile(latFloor, lonFloor) {
  const key = `${latFloor},${lonFloor}`;
  if (earthTiles.has(key)) return;
  const buf = await cachedFetch(earthTileUrl(latFloor, lonFloor));
  if (!buf) return void earthTiles.set(key, null); // open ocean or unreleased tile
  const tiff = await fromArrayBuffer(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  const img = await tiff.getImage();
  const [data] = await img.readRasters();
  earthTiles.set(key, { data, w: img.getWidth(), h: img.getHeight(), bbox: img.getBoundingBox() });
}
function sampleEarth(lat, lon) {
  const t = earthTiles.get(`${Math.floor(lat)},${Math.floor(lon)}`);
  if (!t) return NaN;
  const [west, south, east, north] = t.bbox;
  const x = Math.min(Math.max(((lon - west) / (east - west)) * t.w - 0.5, 0), t.w - 1.001);
  const y = Math.min(Math.max(((north - lat) / (north - south)) * t.h - 0.5, 0), t.h - 1.001);
  // shortcut: Copernicus DEM stores open water as exactly 0 m, so 0 is treated as nodata;
  // upgrade to the WBM water-mask layer if a site has real land at exactly sea level.
  const get = (c, r) => {
    const v = t.data[r * t.w + c];
    return v === 0 ? NaN : v;
  };
  return bilinear(get, x, y);
}

/** Returns { grid, n, cellM, product, url } for a target { body, lat, lon }. lon is east-positive. */
export async function readWindow(target) {
  const { body, lat } = target;
  const lon = body === "earth" ? target.lon : ((target.lon % 360) + 360) % 360;
  const R = RADIUS_M[body];
  const half = (N * CELL_M) / 2;
  const mPerDegLat = (R * Math.PI) / 180;
  const mPerDegLon = mPerDegLat * Math.cos((lat * Math.PI) / 180);
  let sample, product, url, sub;

  if (body === "earth") {
    const dLat = half / mPerDegLat + 0.01, dLon = half / mPerDegLon + 0.01;
    for (let la = Math.floor(lat - dLat); la <= Math.floor(lat + dLat); la++)
      for (let lo = Math.floor(lon - dLon); lo <= Math.floor(lon + dLon); lo++) await loadEarthTile(la, lo);
    sample = (dx, dy) => sampleEarth(lat + dy / mPerDegLat, lon + dx / mPerDegLon);
    ({ product } = PRODUCTS.earth);
    url = earthTileUrl(Math.floor(lat), Math.floor(lon));
    sub = 3;
  } else if (body === "mars") {
    const ppd = 128, width = 11520, lines = 5632;
    const top = lat >= 44 ? 88 : lat >= 0 ? 44 : lat >= -44 ? 0 : -44;
    const west = Math.floor(lon / 90) * 90;
    const name = `megt${pad(top, 2)}${top > 0 ? "n" : top < 0 ? "s" : "n"}${pad(west, 3)}hb.img`;
    url = `${PRODUCTS.mars.base}/${name}`;
    const rowOf = (la) => (top - la) * ppd - 0.5;
    const r0 = Math.max(0, Math.floor(rowOf(lat + half / mPerDegLat)) - 2);
    const r1 = Math.min(lines - 1, Math.ceil(rowOf(lat - half / mPerDegLat)) + 2);
    const get = await rowBlock(url, width, r0, r1, false, 1);
    sample = (dx, dy) => bilinear(get, (lon + dx / mPerDegLon - west) * ppd - 0.5, rowOf(lat + dy / mPerDegLat));
    ({ product } = PRODUCTS.mars);
    sub = 1;
  } else if (lat <= -80.5) {
    const scale = 80, off = 3799.5, size = 7600;
    const r = 2 * R * Math.tan(((90 + lat) / 2) * (Math.PI / 180));
    const x0 = r * Math.sin((lon * Math.PI) / 180), y0 = r * Math.cos((lon * Math.PI) / 180);
    url = `${PRODUCTS.moonSouth.base}/ldem_80s_80m.img`;
    const r0 = Math.max(0, Math.floor(off - (y0 + half) / scale) - 2);
    const r1 = Math.min(size - 1, Math.ceil(off - (y0 - half) / scale) + 2);
    const get = await rowBlock(url, size, r0, r1, true, 0.5);
    // Near the pole the stereographic plane is locally true to scale, so the window is cut in map metres.
    sample = (dx, dy) => bilinear(get, off + (x0 + dx) / scale, off - (y0 + dy) / scale);
    ({ product } = PRODUCTS.moonSouth);
    sub = 3;
  } else {
    const ppd = 64, width = 23040, lines = 11520;
    url = `${PRODUCTS.moonCyl.base}/ldem_64.img`;
    const rowOf = (la) => (90 - la) * ppd - 0.5;
    const r0 = Math.max(0, Math.floor(rowOf(lat + half / mPerDegLat)) - 2);
    const r1 = Math.min(lines - 1, Math.ceil(rowOf(lat - half / mPerDegLat)) + 2);
    const get = await rowBlock(url, width, r0, r1, true, 0.5);
    sample = (dx, dy) => bilinear(get, (lon + dx / mPerDegLon) * ppd - 0.5, rowOf(lat + dy / mPerDegLat));
    ({ product } = PRODUCTS.moonCyl);
    sub = 1;
  }

  // Block-average `sub` x `sub` samples per output cell so finer sources are aggregated, not aliased.
  const grid = new Float32Array(N * N);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      let sum = 0, cnt = 0;
      for (let i = 0; i < sub; i++) {
        for (let j = 0; j < sub; j++) {
          const dx = -half + (c + (j + 0.5) / sub) * CELL_M;
          const dy = half - (r + (i + 0.5) / sub) * CELL_M;
          const v = sample(dx, dy);
          if (Number.isFinite(v)) { sum += v; cnt++; }
        }
      }
      grid[r * N + c] = cnt >= (sub * sub) / 2 ? sum / cnt : NaN;
    }
  }
  return { grid, n: N, cellM: CELL_M, product, url };
}
