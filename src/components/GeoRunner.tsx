"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// FLOW theme, home page only: an original neon geometry run. A cube slides over a scrolling floor and
// hops over spikes on its own, while outlined shapes drift and pulse to a 128 BPM beat. Drawn in 2D canvas.
const BPM = 128;

interface Spike { x: number; n: number }
interface Shape { x: number; y: number; s: number; rot: number; spin: number; depth: number; sides: number }

export function GeoRunner() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    const x = c?.getContext("2d");
    if (!c || !x) return;
    const lite = document.documentElement.dataset.perf === "lite" || window.matchMedia("(hover: none)").matches;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, floor = 0, unit = 0;
    const shapes: Shape[] = [];
    const spikes: Spike[] = [];
    const trail: { x: number; y: number; r: number; a: number }[] = [];

    const resize = () => {
      const dpr = lite ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      c.width = W * dpr;
      c.height = H * dpr;
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      floor = H * 0.8;
      unit = Math.max(26, Math.min(44, W / 34));
      shapes.length = 0;
      for (let i = 0; i < (lite ? 10 : 18); i++)
        shapes.push({ x: Math.random() * W, y: Math.random() * floor * 0.9, s: 20 + Math.random() * 120, rot: Math.random() * 6.3, spin: (Math.random() - 0.5) * 0.4, depth: 0.15 + Math.random() * 0.6, sides: Math.random() < 0.5 ? 4 : 3 });
      spikes.length = 0;
      for (let sx = W * 0.75; sx < W * 2.2; sx += unit * (6 + Math.random() * 7)) spikes.push({ x: sx, n: 1 + Math.floor(Math.random() * 3) });
    };
    resize();
    window.addEventListener("resize", resize);

    const poly = (cx: number, cy: number, r: number, rot: number, sides: number) => {
      x.beginPath();
      for (let i = 0; i <= sides; i++) {
        const a = rot + (i / sides) * Math.PI * 2;
        const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
        if (i) x.lineTo(px, py);
        else x.moveTo(px, py);
      }
    };

    // The cube: auto-jumps when a spike group comes close, turning a quarter in the air.
    const player = { y: 0, vy: 0, rot: 0, air: false };
    const px = () => W * 0.62;
    let last = performance.now(), frame = 0, scroll = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const speed = unit * 9;
      scroll += speed * dt;
      const beat = Math.exp(-((t * BPM) / 60 % 1) * 5); // 1 on the beat, decaying
      const hue = (t * 12) % 360;

      // Background: deep gradient that breathes with the beat.
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, `hsl(${(hue + 250) % 360} 70% ${6 + beat * 3}%)`);
      g.addColorStop(1, `hsl(${(hue + 200) % 360} 80% ${3 + beat * 2}%)`);
      x.fillStyle = g;
      x.fillRect(0, 0, W, H);

      // Drifting outlined shapes (parallax).
      x.lineWidth = 2;
      for (const s of shapes) {
        s.x -= speed * s.depth * 0.18 * dt;
        s.rot += s.spin * dt;
        if (s.x < -s.s) s.x = W + s.s;
        x.strokeStyle = `hsla(${(hue + s.depth * 200) % 360} 100% 70% / ${0.08 + s.depth * 0.25 + beat * 0.12})`;
        poly(s.x, s.y, s.s * (1 + beat * 0.06), s.rot, s.sides);
        x.stroke();
      }

      // Floor: glowing line and moving chevron tiles.
      x.fillStyle = `hsl(${(hue + 220) % 360} 70% 7%)`;
      x.fillRect(0, floor, W, H - floor);
      x.strokeStyle = `hsla(${(hue + 180) % 360} 100% 70% / 0.5)`;
      for (let tx = -(scroll % (unit * 2)); tx < W; tx += unit * 2) {
        x.strokeRect(tx, floor + 6, unit * 2, unit * 2);
      }
      if (!lite) {
        x.shadowColor = `hsl(${(hue + 180) % 360} 100% 65%)`;
        x.shadowBlur = 14 + beat * 14;
      }
      x.strokeStyle = `hsl(${(hue + 180) % 360} 100% ${70 + beat * 20}%)`;
      x.lineWidth = 3;
      x.beginPath();
      x.moveTo(0, floor);
      x.lineTo(W, floor);
      x.stroke();

      // Spikes scroll in from the right and are recycled.
      let nearest = Infinity;
      x.fillStyle = `hsla(${(hue + 300) % 360} 100% 60% / 0.25)`;
      x.strokeStyle = `hsl(${(hue + 300) % 360} 100% 70%)`;
      x.lineWidth = 2.5;
      for (const sp of spikes) {
        sp.x -= speed * dt;
        if (sp.x + sp.n * unit < 0) {
          sp.x = Math.max(W, Math.max(...spikes.map((o) => o.x)) + unit * (6 + Math.random() * 7));
          sp.n = 1 + Math.floor(Math.random() * 3);
        }
        for (let k = 0; k < sp.n; k++) {
          const bx = sp.x + k * unit;
          x.beginPath();
          x.moveTo(bx, floor);
          x.lineTo(bx + unit / 2, floor - unit * 0.95);
          x.lineTo(bx + unit, floor);
          x.closePath();
          x.fill();
          x.stroke();
        }
        const d = sp.x - (px() + unit / 2);
        if (d > -sp.n * unit && d < nearest) nearest = d;
      }

      // Jump physics: launch so the arc clears the spike group.
      const grav = unit * 70;
      if (!player.air && nearest < unit * 1.3 && nearest > 0) {
        player.vy = -Math.sqrt(2 * grav * unit * 2.3);
        player.air = true;
      }
      if (player.air) {
        player.vy += grav * dt;
        player.y += player.vy * dt;
        player.rot += (Math.PI / 2) * dt * 2.6;
        if (player.y >= 0) {
          player.y = 0;
          player.vy = 0;
          player.air = false;
          player.rot = Math.round(player.rot / (Math.PI / 2)) * (Math.PI / 2);
        }
      }
      const cy = floor - unit / 2 + player.y;
      trail.push({ x: px(), y: cy, r: player.rot, a: 1 });
      if (trail.length > (lite ? 8 : 16)) trail.shift();
      for (const p of trail) {
        p.x -= speed * dt;
        p.a *= 0.86;
        x.strokeStyle = `hsla(${(hue + 160) % 360} 100% 70% / ${p.a * 0.5})`;
        x.lineWidth = 2;
        x.save();
        x.translate(p.x, p.y);
        x.rotate(p.r);
        x.strokeRect(-unit / 2.6, -unit / 2.6, unit / 1.3, unit / 1.3);
        x.restore();
      }
      x.save();
      x.translate(px(), cy);
      x.rotate(player.rot);
      x.fillStyle = `hsl(${(hue + 160) % 360} 100% 55%)`;
      x.fillRect(-unit / 2, -unit / 2, unit, unit);
      x.fillStyle = `hsl(${(hue + 160) % 360} 100% 85%)`;
      x.fillRect(-unit / 4, -unit / 4, unit / 2, unit / 2);
      x.strokeStyle = "#ffffff";
      x.lineWidth = 2;
      x.strokeRect(-unit / 2, -unit / 2, unit, unit);
      x.restore();
      x.shadowBlur = 0;

      if (!still) frame = requestAnimationFrame(tick);
    };
    const onVis = () => {
      cancelAnimationFrame(frame);
      last = performance.now();
      if (document.visibilityState === "visible" && !still) frame = requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", onVis);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <canvas ref={ref} className="h-full w-full" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(8,9,11,0.82) 0%, rgba(8,9,11,0.45) 42%, rgba(8,9,11,0) 70%)" }} />
    </div>,
    document.body,
  );
}
