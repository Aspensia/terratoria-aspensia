"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { jumpFor } from "@/lib/runner";

// FLOW theme, home page only: an original geometry run in a monochrome steel palette. A white cube slides
// along a dark floor and jumps clean over every group of faceted spikes, under a soft glowing orb with
// drifting shards. Everything pulses to a 128 BPM beat. Lite Mode drops glow blur and halves the shards.
const BPM = 128;
const SKY_TOP = "#262c3b", SKY_LOW = "#8790a8", INK = "#161a24", FACE_L = "#454e64", FACE_R = "#262c3a", EDGE = "rgba(214,222,238,0.55)";

interface Group { x: number; n: number }
interface Shard { x: number; y: number; s: number; rot: number; spin: number; depth: number; vx: number; vy: number }

export function GeoRunner() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    const x = c?.getContext("2d");
    if (!c || !x) return;
    const lite = document.documentElement.dataset.perf === "lite" || window.matchMedia("(hover: none)").matches;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, floor = 0, unit = 0, speed = 0;
    const shards: Shard[] = [];
    const groups: Group[] = [];
    const trail: { x: number; y: number; r: number; a: number }[] = [];
    const gap = () => unit * (7 + Math.random() * 6);

    const resize = () => {
      const dpr = lite ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      c.width = W * dpr;
      c.height = H * dpr;
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      floor = H * 0.8;
      unit = Math.max(26, Math.min(44, W / 34));
      speed = unit * 9;
      shards.length = 0;
      for (let i = 0; i < (lite ? 12 : 26); i++) {
        const depth = 0.2 + Math.random() * 0.8;
        shards.push({ x: Math.random() * W, y: Math.random() * floor * 0.85, s: 8 + depth * 26, rot: Math.random() * 6.3, spin: (Math.random() - 0.5) * 1.2, depth, vx: -(20 + depth * 60), vy: 6 + Math.random() * 14 });
      }
      groups.length = 0;
      for (let gx = W * 0.8; gx < W * 2.4; gx += gap()) groups.push({ x: gx, n: 1 + Math.floor(Math.random() * 3) });
    };
    resize();
    window.addEventListener("resize", resize);

    const tri = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => {
      x.beginPath();
      x.moveTo(ax, ay);
      x.lineTo(bx, by);
      x.lineTo(cx, cy);
      x.closePath();
    };

    const player = { y: 0, rot: 0, jump: null as null | { t0: number; dur: number; h: number; r0: number; turns: number } };
    const px = () => W * 0.6;
    let last = performance.now(), frame = 0, scroll = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      scroll += speed * dt;
      const beat = Math.exp(-(((t * BPM) / 60) % 1) * 5);

      // Sky and the glowing orb with slow rays.
      const sky = x.createLinearGradient(0, 0, 0, floor);
      sky.addColorStop(0, SKY_TOP);
      sky.addColorStop(1, SKY_LOW);
      x.fillStyle = sky;
      x.fillRect(0, 0, W, H);
      const ox = W * 0.74, oy = floor - H * 0.3, or = H * 0.2;
      x.save();
      x.translate(ox, oy);
      x.rotate(t * 0.03);
      x.fillStyle = "rgba(255,255,255,0.05)";
      for (let i = 0; i < 9; i++) {
        x.rotate((Math.PI * 2) / 9);
        tri(0, 0, -or * 0.35, -H * 1.4, or * 0.35, -H * 1.4);
        x.fill();
      }
      x.restore();
      const halo = x.createRadialGradient(ox, oy, or * 0.6, ox, oy, or * 2.6);
      halo.addColorStop(0, `rgba(240,244,255,${0.5 + beat * 0.15})`);
      halo.addColorStop(1, "rgba(240,244,255,0)");
      x.fillStyle = halo;
      x.fillRect(0, 0, W, H);
      x.fillStyle = `rgba(250,252,255,${0.9 + beat * 0.1})`;
      x.beginPath();
      x.arc(ox, oy, or, 0, Math.PI * 2);
      x.fill();

      // Drifting shards: dark slivers with a lit edge.
      for (const s of shards) {
        s.x += s.vx * dt;
        s.y += s.vy * dt * 0.3;
        s.rot += s.spin * dt;
        if (s.x < -40) (s.x = W + 40), (s.y = Math.random() * floor * 0.85);
        x.save();
        x.translate(s.x, s.y);
        x.rotate(s.rot);
        x.globalAlpha = 0.45 + s.depth * 0.55;
        x.fillStyle = INK;
        tri(-s.s, s.s * 0.3, s.s, 0, -s.s * 0.4, -s.s * 0.35);
        x.fill();
        x.strokeStyle = EDGE;
        x.lineWidth = 1;
        x.stroke();
        x.restore();
      }
      x.globalAlpha = 1;

      // Floor with scrolling tiles.
      x.fillStyle = INK;
      x.fillRect(0, floor, W, H - floor);
      x.strokeStyle = "rgba(200,208,226,0.12)";
      x.lineWidth = 1;
      for (let tx = -(scroll % (unit * 2)); tx < W; tx += unit * 2) x.strokeRect(tx, floor + 6, unit * 2, unit * 2);
      if (!lite) {
        x.shadowColor = "rgba(235,240,255,0.9)";
        x.shadowBlur = 10 + beat * 12;
      }
      x.strokeStyle = `rgba(235,240,255,${0.75 + beat * 0.25})`;
      x.lineWidth = 2.5;
      x.beginPath();
      x.moveTo(0, floor);
      x.lineTo(W, floor);
      x.stroke();
      x.shadowBlur = 0;

      // Spike groups: two-tone faceted triangles; recycled once off screen.
      let next: Group | null = null;
      const front = px() + unit / 2;
      for (const g of groups) {
        g.x -= speed * dt;
        if (g.x + g.n * unit < 0) {
          g.x = Math.max(W, ...groups.map((o) => o.x + o.n * unit)) + gap();
          g.n = 1 + Math.floor(Math.random() * 3);
        }
        for (let k = 0; k < g.n; k++) {
          const bx = g.x + k * unit, tip = floor - unit * 0.95;
          x.fillStyle = FACE_L;
          tri(bx, floor, bx + unit / 2, tip, bx + unit / 2, floor);
          x.fill();
          x.fillStyle = FACE_R;
          tri(bx + unit / 2, tip, bx + unit, floor, bx + unit / 2, floor);
          x.fill();
          x.strokeStyle = EDGE;
          x.lineWidth = 1.2;
          tri(bx, floor, bx + unit / 2, tip, bx + unit, floor);
          x.stroke();
        }
        if (g.x + g.n * unit > px() - unit / 2 && (!next || g.x < next.x)) next = g;
      }

      // Jump: start just before the group; the arc is timed to land past its last spike.
      if (!player.jump && next && next.x - front < unit * 0.9 && next.x - front > unit * 0.15) {
        const j = jumpFor(next.x - front, next.n, unit, speed);
        player.jump = { t0: t, dur: j.duration, h: j.height, r0: player.rot, turns: j.turns };
      }
      if (player.jump) {
        const p = Math.min(1, (t - player.jump.t0) / player.jump.dur);
        player.y = -4 * player.jump.h * p * (1 - p);
        player.rot = player.jump.r0 + (Math.PI / 2) * player.jump.turns * p;
        if (p >= 1) player.jump = null;
      }

      // The cube and its fading trail.
      const cy = floor - unit / 2 + player.y;
      trail.push({ x: px(), y: cy, r: player.rot, a: 1 });
      if (trail.length > (lite ? 7 : 14)) trail.shift();
      for (const p of trail) {
        p.x -= speed * dt;
        p.a *= 0.84;
        x.save();
        x.translate(p.x, p.y);
        x.rotate(p.r);
        x.strokeStyle = `rgba(235,240,255,${p.a * 0.35})`;
        x.lineWidth = 1.5;
        x.strokeRect(-unit / 2.6, -unit / 2.6, unit / 1.3, unit / 1.3);
        x.restore();
      }
      x.save();
      x.translate(px(), cy);
      x.rotate(player.rot);
      x.fillStyle = "#eef2fa";
      x.fillRect(-unit / 2, -unit / 2, unit, unit);
      x.fillStyle = INK;
      x.fillRect(-unit / 4, -unit / 4, unit / 2, unit / 2);
      x.fillStyle = "#eef2fa";
      x.fillRect(-unit / 9, -unit / 9, unit / 4.5, unit / 4.5);
      x.strokeStyle = INK;
      x.lineWidth = 2;
      x.strokeRect(-unit / 2, -unit / 2, unit, unit);
      x.restore();

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
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(8,9,11,0.82) 0%, rgba(8,9,11,0.4) 40%, rgba(8,9,11,0) 66%)" }} />
    </div>,
    document.body,
  );
}
