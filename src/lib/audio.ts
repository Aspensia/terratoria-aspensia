// Procedural sound: every sound is synthesised with the Web Audio API, so there are no files to fail.
// The palette is bright and friendly: major-key notes, soft sine tones and a short echo.
// Browsers block audio until the first user gesture; unlock() is called on that gesture.

export type Sfx = "hover" | "click" | "open" | "close" | "select" | "correct" | "wrong";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let echo: GainNode | null = null; // send into a short feedback delay, for a little sparkle
let muted = false;
let volume = 0.7;
const level = () => (muted ? 0 : volume);
let wantAmbient = false;
let ambientStop: (() => void) | null = null;
let lastHover = 0;

// C major pentatonic: every combination sounds pleasant together.
const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];

export function isMuted() {
  return muted;
}

export function setMuted(m: boolean) {
  muted = m;
  if (ctx && master) master.gain.setTargetAtTime(level(), ctx.currentTime, 0.08);
}

/** Master volume, 0–1 (the Settings slider). */
export function setVolume(v: number) {
  volume = Math.min(1, Math.max(0, v));
  if (ctx && master) master.gain.setTargetAtTime(level(), ctx.currentTime, 0.05);
}

/** Creates or resumes the audio context. Must run inside a user gesture. */
export function unlock() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = level();
    master.connect(ctx.destination);
    // Echo: delay with soft feedback, high frequencies rolled off so repeats stay gentle.
    echo = ctx.createGain();
    echo.gain.value = 0.28;
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.19;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const damp = ctx.createBiquadFilter();
    damp.type = "lowpass";
    damp.frequency.value = 3200;
    echo.connect(delay).connect(damp).connect(fb).connect(delay);
    damp.connect(master);
  }
  if (ctx.state === "suspended") void ctx.resume();
  if (wantAmbient && !ambientStop) startAmbient();
}

/** One soft note: sine (or triangle) with a quick attack and a smooth decay, optional pitch glide. */
function note(freq: number, { dur = 0.18, peak = 0.05, to = freq, delay = 0, type = "sine" as OscillatorType, wet = true } = {}) {
  if (!ctx || !master || ctx.state !== "running") return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to !== freq) osc.frequency.exponentialRampToValueAtTime(to, t + dur * 0.6);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(master);
  if (wet && echo) g.connect(echo);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

export function sfx(kind: Sfx) {
  if (muted || !ctx) return;
  switch (kind) {
    case "hover": {
      const now = performance.now();
      if (now - lastHover < 60) return; // sweeping across a row of buttons should not chatter
      lastHover = now;
      return note(pick(PENTA.slice(3)) * 2, { dur: 0.07, peak: 0.012, wet: false });
    }
    case "click": // bubbly "pop": a quick upward glide
      note(380, { to: 980, dur: 0.11, peak: 0.07 });
      return note(1960, { dur: 0.06, peak: 0.015, delay: 0.03, wet: false });
    case "select": // happy two-note chime
      note(PENTA[2], { dur: 0.25, peak: 0.05 });
      return note(PENTA[5], { dur: 0.35, peak: 0.045, delay: 0.08 });
    case "open": // rising sparkle
      [0, 2, 4, 5].forEach((k, i) => note(PENTA[k], { dur: 0.22, peak: 0.035, delay: i * 0.045 }));
      return;
    case "close": // gentle step down
      note(PENTA[4], { dur: 0.16, peak: 0.035 });
      return note(PENTA[1], { dur: 0.22, peak: 0.03, delay: 0.07 });
    case "correct": // little fanfare: C-E-G-C
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, { dur: 0.32, peak: 0.06, delay: i * 0.085, type: "triangle" }));
      return;
    case "wrong": // soft, friendly "boop-boop", not a buzzer
      note(392, { to: 330, dur: 0.18, peak: 0.05, type: "triangle" });
      return note(330, { to: 262, dur: 0.26, peak: 0.045, delay: 0.16, type: "triangle" });
  }
}

// A licensed recording can replace the synthesised theme: put the file in public/audio/ and set its path here,
// e.g. "/audio/ambient.mp3". Only use music the team has permission to publish.
const AMBIENT_FILE: string | null = null;

// Slow cinematic progression: Cmaj9 → Am9 → Fmaj7(#11) → G6sus, one chord every 9 s.
const CHORDS = [
  [130.81, 196.0, 246.94, 293.66, 329.63],
  [110.0, 164.81, 196.0, 246.94, 261.63],
  [87.31, 130.81, 164.81, 220.0, 246.94],
  [98.0, 146.83, 164.81, 220.0, 261.63],
];

/** Long, soft reverb tail from decaying stereo noise: the "space" in the sound. */
function reverb(c: AudioContext, seconds = 3.2) {
  const len = Math.floor(c.sampleRate * seconds);
  const ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  const conv = c.createConvolver();
  conv.buffer = ir;
  return conv;
}

function startAmbient() {
  if (!ctx || !master) return;
  const c = ctx;
  const out = c.createGain();
  out.gain.value = 0;
  out.gain.setTargetAtTime(AMBIENT_FILE ? 0.5 : 0.09, c.currentTime, 2); // slow fade in
  out.connect(master);

  if (AMBIENT_FILE) {
    const el = new Audio(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${AMBIENT_FILE}`);
    el.loop = true;
    c.createMediaElementSource(el).connect(out);
    void el.play();
    ambientStop = () => {
      out.gain.setTargetAtTime(0, c.currentTime, 0.5);
      setTimeout(() => el.pause(), 2500);
      ambientStop = null;
    };
    return;
  }

  const room = reverb(c);
  const wet = c.createGain();
  wet.gain.value = 0.7;
  room.connect(wet).connect(out);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 950;
  lp.Q.value = 0.4;
  lp.connect(out);
  lp.connect(room);

  // Pad: five voices that glide from chord to chord, each breathing at its own slow rate.
  const voices = CHORDS[0].map((f, i) => {
    const o = c.createOscillator();
    o.type = i % 2 ? "triangle" : "sine";
    o.frequency.value = f;
    o.detune.value = (i - 2) * 5;
    const g = c.createGain();
    g.gain.value = 0.11;
    const lfo = c.createOscillator();
    const depth = c.createGain();
    lfo.frequency.value = 0.05 + i * 0.017;
    depth.gain.value = 0.05;
    lfo.connect(depth).connect(g.gain);
    o.connect(g).connect(lp);
    o.start();
    lfo.start();
    return { o, lfo };
  });

  let step = 0;
  const change = setInterval(() => {
    step = (step + 1) % CHORDS.length;
    voices.forEach((v, i) => v.o.frequency.setTargetAtTime(CHORDS[step][i], c.currentTime, 1.4));
  }, 9000);

  // Piano-like melody: a soft, slowly decaying note from the current chord, two octaves up, into the reverb.
  let melody: ReturnType<typeof setTimeout>;
  const play = () => {
    if (!muted && c.state === "running") {
      const t = c.currentTime;
      const f = pick(CHORDS[step].slice(1)) * (Math.random() < 0.7 ? 4 : 2);
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.06, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
      o.connect(g);
      g.connect(room);
      g.connect(out);
      o.start(t);
      o.stop(t + 3.3);
    }
    melody = setTimeout(play, 1600 + Math.random() * 2800);
  };
  melody = setTimeout(play, 2500);

  ambientStop = () => {
    clearTimeout(melody);
    clearInterval(change);
    out.gain.setTargetAtTime(0, c.currentTime, 0.5);
    const stopAt = c.currentTime + 3;
    voices.forEach((v) => (v.o.stop(stopAt), v.lfo.stop(stopAt)));
    ambientStop = null;
  };
}

/** Theme music for the whole site. Starts after the first user gesture if requested before it. */
export function ambient(on: boolean) {
  wantAmbient = on;
  if (on && ctx?.state === "running" && !ambientStop) startAmbient();
  if (!on && ambientStop) ambientStop();
}
