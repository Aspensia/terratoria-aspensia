"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { sunMaterial } from "./SolarSystem";
import { atmosphere, disposeScene, glow, isLite, loadTexture, makeRenderer, planet, prefersReducedMotion, starfield, type TextureName } from "./space";

// HAIL MARY theme, home page only. Tau Ceti (a G8 star 12 light-years away) with its four candidate
// planets from Feng et al. (2017), orbits in AU: g 0.133, h 0.243, e 0.538, f 1.334. Distances are
// compressed and sizes enlarged to read on screen. Tau Ceti e is shown green, as the theme asks.
const WORLDS: { name: string; au: number; r: number; tex: TextureName; tint: number; air?: string; speed: number; phase: number }[] = [
  { name: "g", au: 0.133, r: 0.32, tex: "venus", tint: 0xffd2a0, speed: 0.9, phase: 0.5 },
  { name: "h", au: 0.243, r: 0.3, tex: "mars", tint: 0xc9b6a6, speed: 0.6, phase: 2.4 },
  { name: "e", au: 0.538, r: 0.78, tex: "earth", tint: 0x8dff9e, air: "#7dffb0", speed: 0.32, phase: 4.2 },
  { name: "f", au: 1.334, r: 0.62, tex: "moon", tint: 0xbfe3ff, air: "#bfe3ff", speed: 0.14, phase: 1.1 },
];
const dist = (au: number) => 3 + au * 11;

/** A small original spacecraft: hull, spinning gravity ring, solar wings and an engine glow. */
function ship(): { group: THREE.Group; ring: THREE.Mesh } {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0xdfe4ea, metalness: 0.6, roughness: 0.35 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x3a4250, metalness: 0.4, roughness: 0.6 });
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.42, 16), metal);
  hull.rotation.z = Math.PI / 2;
  g.add(hull);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.09, 16), metal);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 0.255;
  g.add(nose);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.014, 8, 40), dark);
  ring.rotation.y = Math.PI / 2;
  ring.position.x = 0.05;
  g.add(ring);
  for (const s of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.004, 0.16), new THREE.MeshStandardMaterial({ color: 0x1d3a7a, metalness: 0.3, roughness: 0.4, emissive: 0x0a1a3a }));
    wing.position.set(-0.08, 0, s * 0.13);
    g.add(wing);
  }
  const flame = glow("rgba(120,180,255,0.95)", 0.22, 0.9);
  flame.position.x = -0.26;
  g.add(flame);
  return { group: g, ring };
}

/** Home page backdrop for the HAIL MARY theme song. */
export function TauCeti() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const renderer = makeRenderer(canvas);
    if (!renderer) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 1000);

    const milky = new THREE.Mesh(
      new THREE.SphereGeometry(330, 48, 24),
      new THREE.MeshBasicMaterial({ map: loadTexture("milkyway", true), side: THREE.BackSide, color: 0x8a8a8a, depthWrite: false }),
    );
    milky.rotation.set(1.1, 2.2, 0.2);
    scene.add(milky, starfield());
    scene.add(new THREE.AmbientLight(0xbfd4ff, 0.16));
    scene.add(new THREE.PointLight(0xffe2b8, 4.2, 0, 0));

    const starMat = sunMaterial();
    const star = new THREE.Mesh(new THREE.SphereGeometry(1.25, 64, 32), starMat);
    star.add(glow("rgba(255,200,120,0.85)", 6.5, 0.6), glow("rgba(255,150,70,0.45)", 18, 0.35));
    scene.add(star);

    const orbitMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 });
    const bodies = WORLDS.map((w) => {
      const d = dist(w.au);
      const pts = Array.from({ length: 129 }, (_, i) => new THREE.Vector3(Math.cos((i / 128) * Math.PI * 2) * d, 0, Math.sin((i / 128) * Math.PI * 2) * d));
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), orbitMat));
      const holder = new THREE.Group();
      const mesh = planet(w.tex, w.r, 96, undefined, 1, true);
      (mesh.material as THREE.MeshStandardMaterial).color.set(w.tint);
      holder.add(mesh);
      if (w.air) holder.add(atmosphere(w.r * 1.05, w.air, 3.6));
      scene.add(holder);
      return { ...w, d, holder, mesh };
    });
    const e = bodies.find((b) => b.name === "e")!;

    // The ship circles Tau Ceti e on a tilted orbit.
    const { group: craft, ring } = ship();
    const shipOrbit = new THREE.Group();
    shipOrbit.rotation.set(0.35, 0, 0.2);
    craft.scale.setScalar(1.7);
    shipOrbit.add(craft);
    e.holder.add(shipOrbit);
    const path = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(Array.from({ length: 97 }, (_, i) => new THREE.Vector3(Math.cos((i / 96) * Math.PI * 2) * 1.35, 0, Math.sin((i / 96) * Math.PI * 2) * 1.35))),
      new THREE.LineBasicMaterial({ color: 0x9fffc0, transparent: true, opacity: 0.18 }),
    );
    shipOrbit.add(path);

    const lite = isLite() || window.innerWidth < 700 || window.matchMedia("(hover: none)").matches;
    const composer = lite ? null : new EffectComposer(renderer);
    if (composer) {
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.5, 0.82));
      composer.addPass(new OutputPass());
    }
    const draw = () => (composer ? composer.render() : renderer.render(scene, camera));

    let wide = true;
    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      composer?.setPixelRatio(renderer.getPixelRatio());
      composer?.setSize(w, h);
      camera.aspect = w / h;
      wide = w > 900;
      // Shift the picture right on wide screens so the hero text keeps the left side.
      if (wide) camera.setViewOffset(w, h, -w * 0.18, 0, w, h);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const still = prefersReducedMotion();
    const timer = new THREE.Timer();
    const tmp = new THREE.Vector3();
    let frame = 0;
    const render = () => {
      timer.update();
      const t = still ? 12 : timer.getElapsed() + 12;
      for (const b of bodies) {
        const a = b.phase + t * b.speed * 0.12;
        b.holder.position.set(Math.cos(a) * b.d, 0, Math.sin(a) * b.d);
        b.mesh.rotation.y = t * 0.15;
      }
      const sa = t * 0.55;
      craft.position.set(Math.cos(sa) * 1.35, 0, Math.sin(sa) * 1.35);
      craft.rotation.y = -sa; // nose along the direction of travel
      ring.rotation.x = t * 1.5;
      starMat.uniforms.t.value = t;
      // Follow Tau Ceti e.
      tmp.copy(e.holder.position).normalize();
      // Side-on along the orbit, so the planet shows a lit half and the star stays in view.
      const side = new THREE.Vector3(-tmp.z, 0, tmp.x);
      // Inside the orbit and off to one side: the planet is seen about 40° from full, so mostly lit.
      camera.position.copy(e.holder.position).addScaledVector(tmp, -4).addScaledVector(side, 3.5 + Math.sin(t * 0.05) * 0.5).add(new THREE.Vector3(0, 0.8, 0));
      camera.lookAt(e.holder.position);
      draw();
      if (!still) frame = requestAnimationFrame(render);
    };
    const onVis = () => {
      cancelAnimationFrame(frame);
      if (document.visibilityState === "visible" && !still) frame = requestAnimationFrame(render);
    };
    document.addEventListener("visibilitychange", onVis);
    THREE.DefaultLoadingManager.onLoad = () => still && render();
    render();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      THREE.DefaultLoadingManager.onLoad = () => {};
      disposeScene(scene);
      composer?.dispose();
      renderer.dispose();
    };
  }, []);

  return createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <canvas ref={ref} className="h-full w-full" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(8,9,11,0.9) 0%, rgba(8,9,11,0.5) 42%, rgba(8,9,11,0.05) 100%)" }} />
    </div>,
    document.body,
  );
}
