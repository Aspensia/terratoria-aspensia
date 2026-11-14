// Procedural sound: every sound is synthesised with the Web Audio API, so there are no files to fail.
// The palette is bright and friendly: major-key notes, soft sine tones and a short echo.
// Browsers block audio until the first user gesture; unlock() is called on that gesture.

export type Sfx = "hover" | "click" | "open" | "close" | "select" | "correct" | "wrong";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let echo: GainNode | null = null; // send into a short feedback delay, for a little sparkle
let muted = false;
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

function startAmbient() {
  if (!ctx || !master) return;
  const c = ctx;
  const out = c.createGain();
  out.gain.value = 0;
  out.gain.setTargetAtTime(0.06, c.currentTime, 2); // slow fade in
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1800;
  lp.connect(out).connect(master);

  // Warm, open pad: C major add9 voiced high enough to feel airy, never rumbling.
  const pad = [261.63, 329.63, 392.0, 587.33].map((f, i) => {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    o.detune.value = (i - 1.5) * 4;
    const g = c.createGain();
    g.gain.value = 0.16;
    // Each voice swells at its own slow rate, so the chord gently breathes.
    const lfo = c.createOscillator();
    const depth = c.createGain();
    lfo.frequency.value = 0.07 + i * 0.023;
    depth.gain.value = 0.08;
    lfo.connect(depth).connect(g.gain);
    o.connect(g).connect(lp);
    o.start();
    lfo.start();
    return [o, lfo];
  });

  // Twinkles: a random high pentatonic chime every couple of seconds, through the echo.
  let twinkle: ReturnType<typeof setTimeout>;
  const sparkle = () => {
    if (!muted) note(pick(PENTA) * (Math.random() < 0.4 ? 2 : 1), { dur: 1.2, peak: 0.018 });
    twinkle = setTimeout(sparkle, 1400 + Math.random() * 2600);
  };
  twinkle = setTimeout(sparkle, 1200);

  ambientStop = () => {
    clearTimeout(twinkle);
    out.gain.setTargetAtTime(0, c.currentTime, 0.5);
    const stopAt = c.currentTime + 3;
    pad.flat().forEach((n) => n.stop(stopAt));
    ambientStop = null;
  };
}

/** Home-page ambience. Starts after the first user gesture if requested before it. */
export function ambient(on: boolean) {
  wantAmbient = on;
  if (on && ctx?.state === "running" && !ambientStop) startAmbient();
  if (!on && ambientStop) ambientStop();
}
