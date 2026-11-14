"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { disposeScene, glow, makeRenderer, planet, prefersReducedMotion, starfield, type TextureName } from "./space";

// Illustrative only: sizes, distances and speeds are chosen to look good, not to scale.
const PLANETS: { tex: TextureName; r: number; d: number; speed: number; phase: number; ring?: boolean }[] = [
  { tex: "venus", r: 0.42, d: 4.2, speed: 0.5, phase: 1.2 },
  { tex: "earth", r: 0.48, d: 6.2, speed: 0.36, phase: 4.1 },
  { tex: "mars", r: 0.34, d: 8.4, speed: 0.27, phase: 2.6 },
  { tex: "jupiter", r: 1.15, d: 12.5, speed: 0.13, phase: 0.4 },
  { tex: "saturn", r: 0.95, d: 17, speed: 0.09, phase: 5.3, ring: true },
  { tex: "neptune", r: 0.7, d: 22, speed: 0.05, phase: 3.2 },
];

/** Ambient, non-interactive solar system drawn behind the home page. */
export function SolarSystem() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const renderer = makeRenderer(canvas);
    if (!renderer) return; // no WebGL: the CSS gradient background remains
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1000);

    scene.add(starfield());
    scene.add(new THREE.AmbientLight(0xffffff, 0.12));
    scene.add(new THREE.PointLight(0xfff1d6, 3.2, 0, 0));

    const sun = new THREE.Mesh(new THREE.SphereGeometry(1.5, 48, 24), new THREE.MeshBasicMaterial({ color: 0xffd58a }));
    sun.add(glow("rgba(255,200,110,0.9)", 9, 0.9), glow("rgba(255,150,60,0.5)", 22, 0.5));
    scene.add(sun);

    const orbitMat = new THREE.LineBasicMaterial({ color: 0x6cc4ff, transparent: true, opacity: 0.12 });
    const bodies = PLANETS.map((p) => {
      const pts = Array.from({ length: 129 }, (_, i) => new THREE.Vector3(Math.cos((i / 128) * Math.PI * 2) * p.d, 0, Math.sin((i / 128) * Math.PI * 2) * p.d));
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), orbitMat));
      const mesh = planet(p.tex, p.r, 48);
      mesh.rotation.z = 0.35;
      if (p.ring) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(p.r * 1.35, p.r * 2.3, 96),
          new THREE.MeshBasicMaterial({ color: 0xd8c39a, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }),
        );
        ring.rotation.x = Math.PI / 2.4;
        mesh.add(ring);
      }
      scene.add(mesh);
      return { ...p, mesh };
    });

    // The Moon circles Earth.
    const earth = bodies.find((b) => b.tex === "earth")!.mesh;
    const moon = planet("moon", 0.13, 32);
    scene.add(moon);

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Narrow screens: pull back so the outer planets stay in view.
      camera.position.set(0, 9, w < 700 ? 40 : 28);
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const still = prefersReducedMotion();
    // Gentle parallax: the view leans toward the pointer. The scene itself never takes clicks.
    const lean = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      lean.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      lean.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (!still) window.addEventListener("pointermove", onMove);
    const clock = new THREE.Clock();
    let frame = 0;
    const render = () => {
      const t = still ? 20 : clock.getElapsedTime();
      for (const b of bodies) {
        const a = b.phase + t * b.speed * 0.25;
        b.mesh.position.set(Math.cos(a) * b.d, 0, Math.sin(a) * b.d);
        b.mesh.rotation.y = t * 0.3;
      }
      const ma = t * 1.1;
      moon.position.copy(earth.position).add(new THREE.Vector3(Math.cos(ma) * 0.95, 0.12, Math.sin(ma) * 0.95));
      sun.rotation.y = t * 0.05;
      // Slow drift of the viewpoint; the system sits right of centre so the hero text stays readable.
      const drift = t * 0.02;
      lean.x += (lean.tx - lean.x) * 0.03;
      lean.y += (lean.ty - lean.y) * 0.03;
      camera.position.x = Math.sin(drift) * 4 + lean.x * 3;
      camera.position.y = 9 - lean.y * 2.5;
      camera.lookAt(-7 + Math.sin(drift) * 2, 0, 0);
      renderer.render(scene, camera);
      if (!still) frame = requestAnimationFrame(render);
    };
    const onVis = () => {
      cancelAnimationFrame(frame);
      if (document.visibilityState === "visible" && !still) frame = requestAnimationFrame(render);
    };
    document.addEventListener("visibilitychange", onVis);
    THREE.DefaultLoadingManager.onLoad = () => still && render(); // reduced motion: one frame once textures arrive
    render();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      THREE.DefaultLoadingManager.onLoad = () => {};
      disposeScene(scene);
      renderer.dispose();
    };
  }, []);

  // Portalled to <body>: the page fade-in uses a transform, which would otherwise trap this fixed layer.
  return createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <canvas ref={ref} className="h-full w-full" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(4,7,15,0.88) 0%, rgba(4,7,15,0.55) 45%, rgba(4,7,15,0.1) 100%)" }} />
    </div>,
    document.body,
  );
}

