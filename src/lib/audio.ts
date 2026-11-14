// Procedural sound: every sound is synthesised with the Web Audio API, so there are no files to fail.
// Browsers block audio until the first user gesture; unlock() is called on that gesture.

export type Sfx = "hover" | "click" | "open" | "close" | "select";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let wantAmbient = false;
let ambientStop: (() => void) | null = null;
let lastHover = 0;

export function isMuted() {
  return muted;
}

export function setMuted(m: boolean) {
  muted = m;
  if (ctx && master) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.08);
}

/** Creates or resumes the audio context. Must run inside a user gesture. */
export function unlock() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  if (wantAmbient && !ambientStop) startAmbient();
}

function tone(freq: number, to: number, dur: number, type: OscillatorType, peak: number, delay = 0) {
  if (!ctx || !master || ctx.state !== "running") return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const f = ctx.createBiquadFilter();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  f.type = "lowpass";
  f.frequency.value = 4200;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(f).connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export function sfx(kind: Sfx) {
  if (muted || !ctx) return;
  switch (kind) {
    case "hover": {
      const now = performance.now();
      if (now - lastHover < 70) return; // sweeping across a row of buttons should not chatter
      lastHover = now;
      return tone(2400, 2600, 0.035, "sine", 0.012);
    }
    case "click":
      return tone(1320, 660, 0.07, "triangle", 0.035);
    case "select":
      tone(880, 880, 0.09, "sine", 0.04);
      return tone(1320, 1320, 0.14, "sine", 0.03, 0.07);
    case "open":
      return tone(320, 960, 0.22, "sine", 0.03);
    case "close":
      return tone(900, 300, 0.18, "sine", 0.025);
  }
}

function startAmbient() {
  if (!ctx || !master) return;
  const c = ctx;
  const out = c.createGain();
  out.gain.value = 0;
  out.gain.setTargetAtTime(0.05, c.currentTime, 2.5); // slow fade in
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 420;
  lp.Q.value = 0.7;
  lp.connect(out).connect(master);

  // Detuned low drone (A1 with a fifth and an octave).
  const oscs = [55, 55.3, 82.4, 110.2].map((f, i) => {
    const o = c.createOscillator();
    o.type = i < 2 ? "sawtooth" : "sine";
    o.frequency.value = f;
    const g = c.createGain();
    g.gain.value = i < 2 ? 0.18 : 0.3;
    o.connect(g).connect(lp);
    o.start();
    return o;
  });
  // Slow filter sweep so the drone breathes.
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.frequency.value = 0.045;
  lfoGain.gain.value = 220;
  lfo.connect(lfoGain).connect(lp.frequency);
  lfo.start();
  // Soft filtered noise, like distant solar wind.
  const noise = c.createBufferSource();
  const buf = c.createBuffer(1, c.sampleRate * 4, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  noise.buffer = buf;
  noise.loop = true;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 600;
  bp.Q.value = 0.4;
  const ng = c.createGain();
  ng.gain.value = 0.05;
  noise.connect(bp).connect(ng).connect(out);
  noise.start();

  ambientStop = () => {
    out.gain.setTargetAtTime(0, c.currentTime, 0.6);
    const stopAt = c.currentTime + 3;
    [...oscs, lfo, noise].forEach((n) => n.stop(stopAt));
    ambientStop = null;
  };
}

/** Home-page drone. Starts after the first user gesture if requested before it. */
export function ambient(on: boolean) {
  wantAmbient = on;
  if (on && ctx?.state === "running" && !ambientStop) startAmbient();
  if (!on && ambientStop) ambientStop();
}
