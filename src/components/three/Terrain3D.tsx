"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Body } from "@/lib/types";
import { disposeScene, makeRenderer, prefersReducedMotion } from "./space";

export interface Grid {
  n: number;
  cellM: number;
  z: (number | null)[];
}

// Height colour ramps per world, low to high. Only for reading the shape; not true surface colour.
const RAMPS: Record<Body, string[]> = {
  earth: ["#24402e", "#56703f", "#a8925f", "#d9ccb0", "#f4f1ea"],
  moon: ["#2e3138", "#5d626d", "#959ba6", "#d0d5de"],
  mars: ["#3b170e", "#7c3420", "#c06a3a", "#e3a26b", "#f6d6ad"],
};
const WATER = new THREE.Color("#0d2a4a");

function ramp(stops: string[], k: number, out: THREE.Color) {
  const cs = stops.map((s) => new THREE.Color(s));
  const x = Math.max(0, Math.min(0.9999, k)) * (cs.length - 1);
  const i = Math.floor(x);
  return out.copy(cs[i]).lerp(cs[i + 1], x - i);
}

/** The 60 km analysis window as a real 3D surface. Exaggeration only stretches height; the footprint stays true. */
export function Terrain3D({ grid, body, label }: { grid: Grid; body: Body; label: string }) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [exag, setExag] = useState(2);
  const exagRef = useRef<(e: number) => void>(() => {});
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = canvas.current, wrap = box.current;
    if (!el || !wrap) return;
    const renderer = makeRenderer(el);
    if (!renderer) return setFailed(true);
    const { n, cellM, z } = grid;
    const sizeKm = ((n - 1) * cellM) / 1000;

    const valid = z.filter((v): v is number => v !== null);
    const lo = Math.min(...valid), hi = Math.max(...valid);
    const mean = valid.reduce((a, b) => a + b, 0) / valid.length;

    const geo = new THREE.PlaneGeometry(sizeKm, sizeKm, n - 1, n - 1);
    geo.rotateX(-Math.PI / 2); // row 0 (north) ends up at the back
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const v = z[i];
      (v === null ? c.copy(WATER) : ramp(RAMPS[body], (v - lo) / (hi - lo || 1), c)).toArray(colors, i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 })));
    // Faint 10 km grid just under the lowest point gives a sense of scale.
    const g = new THREE.GridHelper(sizeKm, 6, 0x6cc4ff, 0x6cc4ff);
    (g.material as THREE.Material).opacity = 0.12;
    (g.material as THREE.Material).transparent = true;
    scene.add(g);
    const setHeights = (e: number) => {
      for (let i = 0; i < pos.count; i++) pos.setY(i, ((z[i] ?? lo) - mean) / 1000 * e);
      pos.needsUpdate = true;
      geo.computeVertexNormals();
      g.position.y = ((lo - mean) / 1000) * e - 0.3;
    };
    setHeights(exag);
    exagRef.current = setHeights;
    scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x1a1208, 0.55));
    const sun = new THREE.DirectionalLight(0xffffff, 2.6);
    sun.position.set(-40, 45, -30); // from the north-west, like the 2D relief
    scene.add(sun);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 1000);
    camera.position.set(0, sizeKm * 0.75, sizeKm * 1.05);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.minDistance = sizeKm * 0.35;
    controls.maxDistance = sizeKm * 2.2;
    controls.autoRotate = !prefersReducedMotion();
    controls.autoRotateSpeed = 0.8;
    controls.addEventListener("start", () => (controls.autoRotate = false));

    const resize = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // Only animate while on screen (the compare page can show four of these).
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(wrap);
    let frame = 0;
    const tick = () => {
      if (visible) {
        controls.update();
        renderer.render(scene, camera);
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      controls.dispose();
      disposeScene(scene);
      renderer.dispose();
    };
    // exag is applied through exagRef so the scene is not rebuilt on every slider move
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, body]);

  useEffect(() => exagRef.current(exag), [exag]);

  if (failed) return <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted">3D view needs WebGL.</div>;
  return (
    <div ref={box} className="absolute inset-0">
      <canvas ref={canvas} className="h-full w-full cursor-grab touch-none active:cursor-grabbing" role="img" aria-label={`3D terrain of ${label}, drag to rotate`} />
      <label className="absolute bottom-2 left-2 right-12 flex items-center gap-2 rounded-lg bg-black/60 px-2 py-1 text-[11px] text-white backdrop-blur">
        <span className="whitespace-nowrap">Height ×{exag}</span>
        <input type="range" min={1} max={6} step={0.5} value={exag} onChange={(e) => setExag(Number(e.target.value))} className="w-full" aria-label="Vertical exaggeration" />
      </label>
    </div>
  );
}
