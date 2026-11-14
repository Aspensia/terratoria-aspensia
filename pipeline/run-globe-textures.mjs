// node pipeline/run-globe-textures.mjs  →  public/textures/{moon,moon-normal,mars-normal}.png
// Global maps for the 3D globes, built from mission elevation data:
//   Moon: LRO LOLA LDEM_16 (16 px/deg). Mars: MGS MOLA MEGDR 16 px/deg.
// The colour map shows slope and height; the normal maps let the 3D sun light the real relief.
// All outputs are equirectangular, left edge at 180°W. The site serves them as JPEG (see README).
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { crc32, deflateSync } from "node:zlib";
import { PRODUCTS, cachedFetch } from "./lib/fetch-dem.mjs";

const W = 2048, H = 1024;
const SOURCES = {
  moon: { url: `${PRODUCTS.moonCyl.base}/ldem_16.img`, little: true, scale: 0.5, radius: 1737400, k: 3 },
  mars: { url: "https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg016/megt90n000eb.img", little: false, scale: 1, radius: 3396190, k: 4 },
};
const SRC_W = 5760, SRC_H = 2880, PPD = 16; // both: left edge 0°E, top 90°N

async function heights({ url, little, scale }) {
  const buf = await cachedFetch(url);
  assert.equal(buf.length, SRC_W * SRC_H * 2, `unexpected size for ${url}`);
  const read = little ? (o) => buf.readInt16LE(o) : (o) => buf.readInt16BE(o);
  const src = (c, r) => read(((Math.min(SRC_H - 1, Math.max(0, r)) * SRC_W) + (((c % SRC_W) + SRC_W) % SRC_W)) * 2) * scale;
  // Average the source cells under each output pixel; output lon runs -180..180.
  const z = new Float32Array(W * H);
  const step = SRC_W / W;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const lon = -180 + ((x + 0.5) / W) * 360;
      const c0 = Math.floor(((lon + 360) % 360) * PPD - step / 2);
      const r0 = Math.floor(y * step);
      let s = 0, n = 0;
      for (let dr = 0; dr < Math.ceil(step); dr++) for (let dc = 0; dc < Math.ceil(step); dc++) { s += src(c0 + dc, r0 + dr); n++; }
      z[y * W + x] = s / n;
    }
  }
  return z;
}

const at = (z, x, y) => z[Math.min(H - 1, Math.max(0, y)) * W + ((x + W) % W)];
const coslat = (y) => Math.max(0.1, Math.cos((((y + 0.5) / H) * 180 - 90) * (Math.PI / 180)));

/** Slopes east and north (dimensionless) at a pixel. */
function slopes(z, x, y, radius) {
  const cell = (2 * Math.PI * radius) / W;
  return {
    east: (at(z, x + 1, y) - at(z, x - 1, y)) / (2 * cell * coslat(y)),
    north: (at(z, x, y - 1) - at(z, x, y + 1)) / (2 * cell), // row index grows southward
  };
}

function png(width, height, channels, pixel) {
  const row = width * channels + 1;
  const raw = Buffer.alloc(row * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) pixel(x, y, raw, y * row + 1 + x * channels);
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = channels === 3 ? 2 : 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

// Tangent-space normal map, OpenGL convention (green = north), as three.js expects.
const normalMap = (z, { radius, k }) =>
  png(W, H, 3, (x, y, out, o) => {
    const { east, north } = slopes(z, x, y, radius);
    const nx = -east * k, ny = -north * k, len = Math.hypot(nx, ny, 1);
    out[o] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
    out[o + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
    out[o + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
  });

const sample = (z, lat, lonE) => z[Math.floor(((90 - lat) / 180) * H) * W + Math.floor((((((lonE + 180) % 360) + 360) % 360) / 360) * W)];
mkdirSync("public/textures", { recursive: true });

const moon = await heights(SOURCES.moon);
// Self-check: South Pole-Aitken basin is kilometres below the southern highlands.
assert.ok(sample(moon, -53, 191) < sample(moon, -30, 10) - 3000, "Moon heights look wrong");
let lo = Infinity, hi = -Infinity;
for (const v of moon) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
// Colour: brightness falls with slope (no sun direction baked in, the 3D sun adds that) and with depth.
writeFileSync(
  "public/textures/moon.png",
  png(W, H, 1, (x, y, out, o) => {
    const { east, north } = slopes(moon, x, y, SOURCES.moon.radius);
    const flat = 1 / Math.sqrt(1 + 9 * (east * east + north * north));
    const h = (at(moon, x, y) - lo) / (hi - lo);
    out[o] = Math.round(Math.min(1, (0.55 + 0.45 * flat) * (0.5 + 0.5 * h)) * 255);
  }),
);
writeFileSync("public/textures/moon-normal.png", normalMap(moon, SOURCES.moon));

const mars = await heights(SOURCES.mars);
// Self-check: Olympus Mons summit above 15 km, Hellas floor below -6 km (MOLA datum).
assert.ok(sample(mars, 18.65, 226.2) > 15000, `Olympus ${sample(mars, 18.65, 226.2)}`);
assert.ok(sample(mars, -42.4, 70.5) < -6000, `Hellas ${sample(mars, -42.4, 70.5)}`);
writeFileSync("public/textures/mars-normal.png", normalMap(mars, SOURCES.mars));
console.log("wrote moon.png, moon-normal.png, mars-normal.png at", W, "x", H);
