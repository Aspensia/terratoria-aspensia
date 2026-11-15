"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useApp } from "../AppState";
import { atmosphere, disposeScene, latLonToVec3, makeRenderer, planet, prefersReducedMotion, starfield, type TextureName } from "./space";

export interface GlobeMarker {
  id: string;
  lat: number;
  lon: number;
  label: string;
  color: string;
  shape: "circle" | "diamond";
}

type World = "earth" | "moon" | "mars";

const ATMOSPHERE: Partial<Record<World, string>> = { earth: "#5fb4ff", mars: "#e08a5c" };
// Distant, non-interactive bodies that give the scene depth and parallax.
const BACKDROP: Record<World, { tex: TextureName; r: number; at: [number, number, number] }[]> = {
  earth: [
    { tex: "moon", r: 0.9, at: [-38, 10, -70] },
    { tex: "mars", r: 1.4, at: [70, -18, -150] },
  ],
  moon: [
    { tex: "earth", r: 3.2, at: [42, 14, -80] },
    { tex: "venus", r: 1.1, at: [-80, -20, -150] },
  ],
  mars: [
    { tex: "jupiter", r: 5, at: [-70, 22, -160] },
    { tex: "saturn", r: 3.4, at: [90, -26, -190] },
  ],
};

export function Globe({
  world,
  markers,
  selectedId,
  onSelect,
}: {
  world: World;
  markers: GlobeMarker[];
  selectedId: string | null;
  onSelect(id: string): void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const focus = useRef<(id: string | null) => void>(() => {});
  const panelOpen = useRef(false);
  panelOpen.current = !!selectedId;
  const reset = useRef<() => void>(() => {});
  const [failed, setFailed] = useState(false);
  const { t, tx } = useApp();

  useEffect(() => {
    const el = canvas.current;
    const box = wrap.current;
    if (!el || !box) return;
    const renderer = makeRenderer(el);
    if (!renderer) return setFailed(true);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 1000);
    const HOME_DIST = 3.4;
    camera.position.set(0, 0.6, HOME_DIST);

    scene.add(starfield());
    scene.add(new THREE.AmbientLight(0xffffff, world === "moon" ? 0.45 : 0.35));
    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(5, 2, 4);
    scene.add(sun);

    const globe = planet(world, 1, 160, world === "earth" ? undefined : (`${world}-normal` as TextureName));
    scene.add(globe);
    if (ATMOSPHERE[world]) scene.add(atmosphere(1.06, ATMOSPHERE[world]!));
    for (const b of BACKDROP[world]) {
      const m = planet(b.tex, b.r, 32, undefined, 1, true);
      m.position.set(...b.at);
      scene.add(m);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = false;
    controls.minDistance = 1.35;
    controls.maxDistance = 7;
    controls.rotateSpeed = 0.55;
    controls.zoomSpeed = 0.7;
    const still = prefersReducedMotion();
    controls.autoRotate = !still;
    controls.autoRotateSpeed = 0.35;
    controls.addEventListener("start", () => (controls.autoRotate = false));

    // Camera fly-to: ease the viewing direction and distance toward a target each frame.
    let target: { dir: THREE.Vector3; dist: number } | null = null;
    focus.current = (id) => {
      const m = markers.find((x) => x.id === id);
      if (!m) return;
      controls.autoRotate = false;
      target = { dir: latLonToVec3(m.lat, m.lon).normalize(), dist: 2.25 };
      if (still) {
        camera.position.copy(target.dir).multiplyScalar(target.dist);
        target = null;
      }
    };
    reset.current = () => {
      target = { dir: new THREE.Vector3(0, 0.18, 1).normalize(), dist: HOME_DIST };
    };

    const positions = new Map(markers.map((m) => [m.id, latLonToVec3(m.lat, m.lon, 1.005)]));
    const size = new THREE.Vector2();
    const tmp = new THREE.Vector3();
    const toCam = new THREE.Vector3();

    const resize = () => {
      const w = box.clientWidth, h = box.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(box);

    // When the data panel covers the right side (wide screens), slide the view left so the site stays visible.
    let shift = 0;
    let frame = 0;
    const tick = () => {
      const w = box.clientWidth, h = box.clientHeight;
      const want = panelOpen.current && w >= 768 ? 206 : 0;
      if (Math.abs(want - shift) > 0.5) {
        shift += (want - shift) * 0.1;
        camera.setViewOffset(w, h, shift, 0, w, h);
      } else if (shift !== want) {
        shift = want;
        if (want) camera.setViewOffset(w, h, shift, 0, w, h);
        else camera.clearViewOffset();
      }
      if (target) {
        const dir = camera.position.clone().normalize().lerp(target.dir, 0.075).normalize();
        const dist = THREE.MathUtils.lerp(camera.position.length(), target.dist, 0.075);
        camera.position.copy(dir.multiplyScalar(dist));
        if (camera.position.clone().normalize().angleTo(target.dir) < 0.002 && Math.abs(dist - target.dist) < 0.01) target = null;
      }
      controls.update();
      renderer.render(scene, camera);

      // Place the HTML markers over their 3D positions; hide those on the far side.
      renderer.getSize(size);
      for (const [id, p] of positions) {
        const btn = buttons.current.get(id);
        if (!btn) continue;
        toCam.copy(camera.position).sub(p).normalize();
        const facing = p.clone().normalize().dot(toCam);
        tmp.copy(p).project(camera);
        const x = (tmp.x * 0.5 + 0.5) * size.x;
        const y = (-tmp.y * 0.5 + 0.5) * size.y;
        const visible = facing > 0.08;
        btn.style.transform = `translate(${x}px, ${y}px)`;
        btn.style.opacity = visible ? String(Math.min(1, facing * 4)) : "0";
        btn.style.pointerEvents = visible ? "auto" : "none";
      }
      frame = requestAnimationFrame(tick);
    };
    // Draw only while the globe is on screen and the tab is visible.
    let onScreen = true;
    const onVis = () => {
      cancelAnimationFrame(frame);
      if (document.visibilityState === "visible" && onScreen) frame = requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", onVis);
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      onVis();
    });
    io.observe(box);
    tick();

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVis);
      io.disconnect();
      ro.disconnect();
      controls.dispose();
      disposeScene(scene);
      renderer.dispose();
    };
  }, [world, markers]);

  useEffect(() => {
    if (selectedId) focus.current(selectedId);
  }, [selectedId, world, markers]);

  if (failed) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted">
        {tx("3D view needs WebGL, which this browser has turned off. The location list still opens every site.", "ទិដ្ឋភាព 3D ត្រូវការ WebGL ដែលកម្មវិធីរុករកនេះបានបិទ។ បញ្ជីទីតាំងនៅតែអាចបើកគ្រប់ទីតាំងបាន។")}
      </div>
    );
  }

  return (
    <div ref={wrap} className="relative h-full w-full overflow-hidden">
      <canvas ref={canvas} className="block h-full w-full cursor-grab touch-none active:cursor-grabbing" aria-label={tx(`Interactive 3D globe of ${world === "earth" ? "Earth" : world === "moon" ? "the Moon" : "Mars"}`, `ផែនដីមូល 3D អន្តរកម្មនៃ${t(world)}`)} />
      <div className="pointer-events-none absolute inset-0">
        {markers.map((m) => (
          <button
            key={m.id}
            ref={(b) => {
              if (b) buttons.current.set(m.id, b);
              else buttons.current.delete(m.id);
            }}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => onSelect(m.id)}
            className={`marker ${m.id === selectedId ? "is-selected" : ""}`}
            style={{ ["--c" as string]: m.color, opacity: 0 }}
          >
            <span className={`dot ${m.shape === "diamond" ? "diamond" : ""}`} />
            <span className="tag">{m.label}</span>
          </button>
        ))}
      </div>
      <button type="button" className="btn absolute bottom-3 left-3" onClick={() => reset.current()}>
        {t("reset_view")}
      </button>
    </div>
  );
}
