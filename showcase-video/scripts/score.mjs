// Procedural score for the 30 s showcase, rendered offline to assets/audio/score.wav (48 kHz, 16-bit stereo).
// Space pad in the site's ALPHA style + pulse + whooshes on cuts + telemetry blips on UI events + riser into the end card.
// Deterministic: seeded noise, so every run writes the same file.
import { mkdirSync, writeFileSync } from "node:fs";

const SR = 48000, DUR = 30, N = SR * DUR;
const L = new Float32Array(N), R = new Float32Array(N);
let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const add = (i, l, r = l) => { if (i >= 0 && i < N) { L[i] += l; R[i] += r; } };

// Shot boundaries and on-screen events (seconds), from SPEC.md.
const CUTS = [4, 8, 13, 17, 23, 26];
const BLIPS = [[1.25, 1320], [2.55, 1760], [10.0, 1568], [10.3, 2093], [17.55, 1175], [18.95, 1568], [20.35, 1760], [21.75, 1318], [24.05, 1568], [26.75, 2093]];

// 1. Pad: four slow chords (C major pentatonic voicings), detuned saws through a one-pole low-pass, 2 s attack.
const CHORDS = [[130.81, 196.0, 261.63, 329.63], [110.0, 164.81, 220.0, 293.66], [146.83, 220.0, 293.66, 392.0], [130.81, 196.0, 261.63, 392.0]];
for (let c = 0; c < 8; c++) {
  const t0 = c * 3.75, t1 = t0 + 4.6, chord = CHORDS[c % 4];
  let lpL = 0, lpR = 0;
  for (let i = Math.floor(t0 * SR); i < Math.min(N, t1 * SR); i++) {
    const t = i / SR - t0;
    const env = Math.min(1, t / 1.6) * Math.min(1, (t1 - t0 - t) / 1.2);
    let sL = 0, sR = 0;
    for (const f of chord) {
      const saw = (ph) => 2 * (ph - Math.floor(ph + 0.5));
      sL += saw(f * 0.997 * (t + t0)) + 0.6 * Math.sin(2 * Math.PI * f * (t + t0));
      sR += saw(f * 1.003 * (t + t0)) + 0.6 * Math.sin(2 * Math.PI * f * (t + t0));
    }
    const cut = 0.035 + 0.02 * Math.sin((t + t0) * 0.7);
    lpL += cut * (sL - lpL); lpR += cut * (sR - lpR);
    add(i, lpL * env * 0.05, lpR * env * 0.05);
  }
}

// 2. Pulse from 4 s: soft sub kick each beat (120 bpm) and quiet ticks on off-beats; drops out 27.5–28 before the hit.
for (let b = 4; b < 28; b += 0.5) {
  if (b >= 27.5) continue;
  const i0 = Math.floor(b * SR);
  for (let k = 0; k < SR * 0.35; k++) {
    const t = k / SR, f = 48 + 70 * Math.exp(-t * 30);
    add(i0 + k, Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 9) * 0.32);
  }
  const j0 = Math.floor((b + 0.25) * SR);
  let hp = 0, prev = 0;
  for (let k = 0; k < SR * 0.05; k++) {
    const n = rnd(); hp = 0.9 * (hp + n - prev); prev = n;
    const g = hp * Math.exp(-k / SR * 90) * 0.05;
    add(j0 + k, g * 0.8, g);
  }
}

// 3. Whooshes on cuts: band-passed noise sweeping up then down, peaking on the cut. Three takes rotated.
CUTS.forEach((cut, n) => {
  const len = 0.7 + 0.1 * (n % 3), start = cut - len * 0.62;
  let lp = 0, bp = 0;
  for (let k = 0; k < len * SR; k++) {
    const t = k / len / SR;
    const env = Math.sin(Math.PI * Math.pow(t, 0.8)) ** 2;
    const fc = 0.02 + 0.18 * Math.sin(Math.PI * t) * (1 + 0.3 * (n % 3));
    const x = rnd();
    lp += fc * (x - lp); bp += fc * (lp - bp);
    const pan = (n % 2 ? -1 : 1) * (t - 0.5);
    const s = (lp - bp) * env * 0.55;
    add(Math.floor(start * SR) + k, s * (1 - pan * 0.6), s * (1 + pan * 0.6));
  }
});

// 4. Telemetry blips: two quick sine chirps with a tiny echo.
for (const [t0, f] of BLIPS) {
  for (const [dt, g, ff] of [[0, 0.16, f], [0.07, 0.11, f * 1.5], [0.19, 0.05, f * 1.5]]) {
    const i0 = Math.floor((t0 + dt) * SR);
    for (let k = 0; k < SR * 0.09; k++) {
      const t = k / SR;
      add(i0 + k, Math.sin(2 * Math.PI * ff * t) * Math.exp(-t * 45) * g);
    }
  }
}

// 5. Riser 26.4 → 28.0 into the end-card hit at 28.0, then a long shimmer tail.
for (let i = Math.floor(26.4 * SR); i < 28 * SR; i++) {
  const t = (i / SR - 26.4) / 1.6;
  add(i, (rnd() * 0.5 * t * t + Math.sin(2 * Math.PI * (200 + 700 * t * t) * (i / SR)) * 0.25 * t) * 0.35);
}
for (let k = 0; k < SR * 2; k++) {
  const t = k / SR, i = Math.floor(28 * SR) + k;
  const boom = Math.sin(2 * Math.PI * (40 + 60 * Math.exp(-t * 12)) * t) * Math.exp(-t * 2.4) * 0.9;
  const shimmer = [1046.5, 1318.5, 1568, 2093].reduce((s, f, j) => s + Math.sin(2 * Math.PI * f * t + j) * Math.exp(-t * (1.6 + j * 0.4)), 0) * 0.07;
  add(i, boom + shimmer * (1 + 0.2 * Math.sin(t * 9)), boom + shimmer * (1 - 0.2 * Math.sin(t * 9)));
}

// Fades and peak normalise to -1 dBFS.
for (let i = 0; i < N; i++) {
  const t = i / SR, g = Math.min(1, t / 0.4) * Math.min(1, (DUR - t) / 1.2);
  L[i] *= g; R[i] *= g;
}
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const k = 0.891 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * k)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * k)) * 32767), 46 + i * 4);
}
mkdirSync(new URL("../assets/audio/", import.meta.url), { recursive: true });
writeFileSync(new URL("../assets/audio/score.wav", import.meta.url), buf);
console.log("score.wav written, peak scale", k.toFixed(3));
