// node pipeline/run-moon-texture.mjs  →  public/textures/moon.png
// Global shaded relief of the Moon from LRO LOLA LDEM_16 (16 px/deg), for the 3D Moon globe.
// Output is equirectangular, 2048 x 1024, left edge at 180°W (the convention the globe expects).
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { crc32, deflateSync } from "node:zlib";
import { PRODUCTS, cachedFetch } from "./lib/fetch-dem.mjs";

const W = 2048, H = 1024;
const SRC_W = 5760, SRC_H = 2880, PPD = 16; // LDEM_16: left edge 0°E, top 90°N
const buf = await cachedFetch(`${PRODUCTS.moonCyl.base}/ldem_16.img`);
assert.equal(buf.length, SRC_W * SRC_H * 2, "unexpected LDEM_16 size");
const src = (c, r) => buf.readInt16LE((((r % SRC_H) + SRC_H) % SRC_H * SRC_W + (((c % SRC_W) + SRC_W) % SRC_W)) * 2) * 0.5;

// Resample to the output grid (lon -180..180) by averaging the source cells each output pixel covers.
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

// Hillshade (sun from the west at 35°) blended with height, so low basins read darker as on the real Moon.
const cellM = (2 * Math.PI * 1737400) / W;
let lo = Infinity, hi = -Infinity;
for (const v of z) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
const px = Buffer.alloc((W + 1) * H);
const sunAlt = (35 * Math.PI) / 180;
for (let y = 0; y < H; y++) {
  px[y * (W + 1)] = 0; // PNG filter byte: none
  const coslat = Math.max(0.05, Math.cos((((y + 0.5) / H) * 180 - 90) * (Math.PI / 180)));
  for (let x = 0; x < W; x++) {
    const at = (xx, yy) => z[Math.min(H - 1, Math.max(0, yy)) * W + ((xx + W) % W)];
    const dzdx = (at(x + 1, y) - at(x - 1, y)) / (2 * cellM * coslat);
    const dzdy = (at(x, y + 1) - at(x, y - 1)) / (2 * cellM);
    const k = 4; // shading exaggeration only; heights are not changed
    const shade = (Math.sin(sunAlt) + Math.cos(sunAlt) * k * dzdx) / Math.sqrt(1 + k * k * (dzdx * dzdx + dzdy * dzdy));
    const h = (z[y * W + x] - lo) / (hi - lo);
    const v = (0.35 + 0.65 * Math.max(0, Math.min(1, shade))) * (0.45 + 0.55 * h);
    px[y * (W + 1) + 1 + x] = Math.round(Math.max(0, Math.min(1, v)) * 255);
  }
}

const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0);
  return Buffer.concat([len, td, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 0; // 8-bit greyscale
const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(px, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);

// Self-check: South Pole-Aitken basin (about 53°S, 191°E) must be far lower than the highlands near 30°S, 10°E.
const sample = (lat, lonE) => z[Math.floor(((90 - lat) / 180) * H) * W + Math.floor((((((lonE + 180) % 360) + 360) % 360) / 360) * W)];
assert.ok(sample(-53, 191) < sample(-30, 10) - 3000, `SPA ${sample(-53, 191)} vs highlands ${sample(-30, 10)}`);
mkdirSync("public/textures", { recursive: true });
writeFileSync("public/textures/moon.png", png);
console.log("moon.png", W, "x", H, (png.length / 1e6).toFixed(1), "MB; relief", Math.round(lo), "to", Math.round(hi), "m");
