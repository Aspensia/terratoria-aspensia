"use client";

import { useEffect, useRef } from "react";
import { textureUrl } from "./three/space";

// Star colours by spectral class (approximate sRGB of black-body light), weighted toward the common white and yellow stars.
const STAR_COLOURS: [number, number, number, number][] = [
  [155, 176, 255, 0.03],
  [180, 200, 255, 0.1],
  [215, 225, 255, 0.22],
  [250, 248, 255, 0.3],
  [255, 242, 228, 0.18],
  [255, 214, 170, 0.12],
  [255, 190, 130, 0.05],
];
// Meteor glow: most look white; magnesium and nickel give green, sodium gives orange.
const METEOR_TINTS = ["255,255,255", "225,245,255", "205,255,215", "255,226,190"];

const LAYER = { position: "fixed", pointerEvents: "none" } as const;

type Star = { x: number; y: number; r: number; a: number; c: string; tw: number; ph: number; big: boolean };
type Meteor = { x: number; y: number; dx: number; dy: number; speed: number; len: number; life: number; born: number; width: number; tint: string; fire: boolean };

const pick = () => {
  let u = Math.random();
  for (const [r, g, b, w] of STAR_COLOURS) if ((u -= w) <= 0) return `${r},${g},${b}`;
  return "250,248,255";
};

/** Fixed space backdrop behind every page: the real Milky Way, twinkling stars and the occasional shooting star. */
export function SpaceBackdrop() {
  const starsRef = useRef<HTMLCanvasElement>(null);
  const meteorRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const sc = starsRef.current, mc = meteorRef.current;
    if (!sc || !mc) return;
    const sx = sc.getContext("2d"), mx = mc.getContext("2d");
    if (!sx || !mx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = 1;
    let stars: Star[] = [];
    const meteors: Meteor[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      for (const c of [sc, mc]) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      sx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((w * h) / (w < 700 ? 3200 : 2400));
      stars = Array.from({ length: n }, () => {
        const b = Math.pow(Math.random(), 3.2); // many faint stars, few bright ones
        return { x: Math.random() * w, y: Math.random() * h, r: 0.3 + b * 1.35, a: 0.25 + b * 0.75, c: pick(), tw: 0.6 + Math.random() * 2.2, ph: Math.random() * 6.3, big: b > 0.82 };
      });
      drawStars(0);
    };

    const drawStars = (t: number) => {
      sx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const a = still ? s.a : s.a * (0.72 + 0.28 * Math.sin(t * s.tw + s.ph));
        if (s.big) {
          const g = sx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
          g.addColorStop(0, `rgba(${s.c},${a * 0.55})`);
          g.addColorStop(1, `rgba(${s.c},0)`);
          sx.fillStyle = g;
          sx.fillRect(s.x - s.r * 5, s.y - s.r * 5, s.r * 10, s.r * 10);
          // Faint four-point diffraction spikes, as a telescope camera records bright stars.
          sx.strokeStyle = `rgba(${s.c},${a * 0.28})`;
          sx.lineWidth = 0.6;
          const k = s.r * 6;
          sx.beginPath();
          sx.moveTo(s.x - k, s.y);
          sx.lineTo(s.x + k, s.y);
          sx.moveTo(s.x, s.y - k);
          sx.lineTo(s.x, s.y + k);
          sx.stroke();
        }
        sx.fillStyle = `rgba(${s.c},${a})`;
        sx.beginPath();
        sx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        sx.fill();
      }
    };

    const spawn = (now: number) => {
      const fire = Math.random() < 0.07;
      const dir = Math.random() < 0.5 ? 1 : -1;
      const theta = ((16 + Math.random() * 34) * Math.PI) / 180;
      const scale = Math.min(1.2, Math.max(0.55, w / 1440));
      meteors.push({
        x: dir > 0 ? Math.random() * w * 0.75 : w * 0.25 + Math.random() * w * 0.75,
        y: Math.random() * h * 0.55,
        dx: Math.cos(theta) * dir,
        dy: Math.sin(theta),
        speed: (fire ? 650 : 950 + Math.random() * 900) * scale,
        len: (fire ? 360 + Math.random() * 240 : 120 + Math.random() * 200) * scale,
        life: fire ? 1.5 + Math.random() * 0.5 : 0.45 + Math.random() * 0.55,
        born: now,
        width: fire ? 2.6 : 1.1 + Math.random() * 0.7,
        tint: fire ? (Math.random() < 0.5 ? "200,255,210" : "255,215,170") : METEOR_TINTS[Math.floor(Math.random() * METEOR_TINTS.length)],
        fire,
      });
    };

    const drawMeteor = (m: Meteor, now: number) => {
      // A meteor spawned by a timer can be a few ms newer than this frame's timestamp; never let age go negative.
      const age = Math.max(0, (now - m.born) / 1000);
      const p = age / m.life;
      if (p >= 1) return false;
      // Brightens fast, burns, then fades; small flicker as it ablates.
      const env = Math.pow(Math.sin(Math.PI * Math.min(1, p * 1.15)), 0.8) * (0.85 + 0.15 * Math.sin(age * 60));
      const hx = m.x + m.dx * m.speed * age, hy = m.y + m.dy * m.speed * age;
      const tail = m.len * Math.min(1, 0.25 + p * 2.2);
      const tx = hx - m.dx * tail, ty = hy - m.dy * tail;
      const nx = -m.dy, ny = m.dx; // perpendicular, for a tapered trail
      const g = mx.createLinearGradient(hx, hy, tx, ty);
      g.addColorStop(0, `rgba(255,255,255,${0.95 * env})`);
      g.addColorStop(0.08, `rgba(${m.tint},${0.75 * env})`);
      g.addColorStop(1, `rgba(${m.tint},0)`);
      mx.fillStyle = g;
      mx.beginPath();
      mx.moveTo(hx + nx * m.width, hy + ny * m.width);
      mx.lineTo(tx, ty);
      mx.lineTo(hx - nx * m.width, hy - ny * m.width);
      mx.closePath();
      mx.fill();
      const r = m.width * (m.fire ? 7 : 4.5);
      const head = mx.createRadialGradient(hx, hy, 0, hx, hy, r);
      head.addColorStop(0, `rgba(255,255,255,${env})`);
      head.addColorStop(0.35, `rgba(${m.tint},${0.45 * env})`);
      head.addColorStop(1, `rgba(${m.tint},0)`);
      mx.fillStyle = head;
      mx.fillRect(hx - r, hy - r, r * 2, r * 2);
      if (m.fire) {
        // A bright fireball sheds glowing fragments along its path.
        for (let i = 1; i <= 5; i++) {
          const f = tail * (i / 6) * (0.9 + 0.2 * Math.sin(i * 7.1 + age * 9));
          mx.fillStyle = `rgba(${m.tint},${env * (0.5 - i * 0.07)})`;
          mx.fillRect(hx - m.dx * f + nx * Math.sin(i * 3) * 2, hy - m.dy * f + ny * Math.sin(i * 3) * 2, 1.6, 1.6);
        }
      }
      return true;
    };

    resize();
    window.addEventListener("resize", resize);
    if (still) return () => window.removeEventListener("resize", resize);

    let frame = 0, lastStars = 0, timer = 0;
    const loop = (now: number) => {
      if (now - lastStars > 66) {
        drawStars(now / 1000); // twinkle at about 15 fps; it is slow, so this is plenty
        lastStars = now;
      }
      mx.clearRect(0, 0, w, h);
      for (let i = meteors.length - 1; i >= 0; i--) if (!drawMeteor(meteors[i], now)) meteors.splice(i, 1);
      frame = requestAnimationFrame(loop);
    };
    const schedule = () => {
      timer = window.setTimeout(() => {
        if (document.visibilityState === "visible") {
          const now = performance.now();
          spawn(now);
          if (Math.random() < 0.18) window.setTimeout(() => spawn(performance.now()), 180 + Math.random() * 500); // meteors sometimes come in pairs
        }
        schedule();
      }, 2200 + Math.random() * 6500);
    };
    const onVis = () => {
      cancelAnimationFrame(frame);
      if (document.visibilityState === "visible") frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    schedule();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Positioning is inline so the layers can never fall into the page flow, even if the stylesheet is stale or slow.
  return (
    <div aria-hidden="true" className="space-backdrop no-print">
      <div className="space-milkyway" style={{ ...LAYER, inset: "-30%", zIndex: -20, opacity: 0.4, backgroundImage: `url(${textureUrl("milkyway")})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      <canvas ref={starsRef} className="space-stars" style={{ ...LAYER, inset: 0, width: "100%", height: "100%", zIndex: -19 }} />
      <canvas ref={meteorRef} className="space-meteors" style={{ ...LAYER, inset: 0, width: "100%", height: "100%", zIndex: -5 }} />
    </div>
  );
}
