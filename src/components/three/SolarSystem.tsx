"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { atmosphere, disposeScene, glow, makeRenderer, planet, prefersReducedMotion, starfield, type TextureName } from "./space";

// Illustrative only: sizes, distances and speeds are chosen to look good, not to scale.
// Axial tilts (obliquity, degrees) and atmosphere tints are the real ones.
const PLANETS: { tex: TextureName; r: number; d: number; speed: number; phase: number; tilt: number; air?: string; normal?: TextureName; ring?: boolean }[] = [
  { tex: "venus", r: 0.42, d: 4.2, speed: 0.5, phase: 1.2, tilt: 177.4, air: "#ffd9a0" },
  { tex: "earth", r: 0.48, d: 6.2, speed: 0.36, phase: 4.1, tilt: 23.4, air: "#6cb6ff" },
  { tex: "mars", r: 0.34, d: 8.4, speed: 0.27, phase: 2.6, tilt: 25.2, air: "#ff9a6a", normal: "mars-normal" },
  { tex: "jupiter", r: 1.15, d: 12.5, speed: 0.13, phase: 0.4, tilt: 3.1, air: "#f3d9b0" },
  { tex: "saturn", r: 0.95, d: 17, speed: 0.09, phase: 5.3, tilt: 26.7, air: "#f0dcaa", ring: true },
  { tex: "neptune", r: 0.7, d: 22, speed: 0.05, phase: 3.2, tilt: 28.3, air: "#5d8cff" },
];

// Saturn's rings from their measured edges, in Saturn radii (60,268 km): C, B, Cassini Division, A with the Encke Gap, F.
const RING_IN = 74658 / 60268;
const RING_OUT = 140600 / 60268;
const RING_BANDS: [km: number, alpha: number][] = [
  [74658, 0.18], [92000, 0.82], [117580, 0.06], [122170, 0.62], [133420, 0.08], [133750, 0.62], [136775, 0], [140000, 0.5], [140400, 0],
];

/** Radial ring texture: opacity follows the real ring boundaries, with fine ringlets for texture. */
function saturnRing(r: number): THREE.Mesh {
  const W = 1024;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = 1;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(W, 1);
  for (let x = 0; x < W; x++) {
    const km = 74658 + (x / (W - 1)) * (140600 - 74658);
    let a = 0;
    for (const [edge, alpha] of RING_BANDS) if (km >= edge) a = alpha;
    const ringlets = 0.78 + 0.22 * Math.sin(x * 0.9) * Math.sin(x * 0.23 + 1.7); // illustrative fine structure
    const shade = 0.82 + 0.18 * Math.sin(x * 0.05);
    img.data.set([Math.round(226 * shade), Math.round(206 * shade), Math.round(168 * shade), Math.round(255 * a * ringlets)], x * 4);
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.RingGeometry(r * RING_IN, r * RING_OUT, 256, 1);
  // Map U across the ring's width so the texture runs from the inner to the outer edge.
  const pos = geo.attributes.position, uv = geo.attributes.uv, v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    uv.setXY(i, (v.length() / r - RING_IN) / (RING_OUT - RING_IN), 0.5);
  }
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false, color: 0xd9ccb0 }));
}

/** The Sun: animated granulation and limb darkening in a small shader. */
function sunMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { t: { value: 0 } },
    vertexShader: `varying vec3 vP; varying vec3 vN;
      void main(){ vP = position; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float t; varying vec3 vP; varying vec3 vN;
      float h(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
      float n(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
        return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x), mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x), f.y),
                   mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x), mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x), f.y), f.z); }
      float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++){ s += a*n(p); p *= 2.03; a *= 0.5; } return s; }
      void main(){
        float big = fbm(vP*1.6 + vec3(0.0, t*0.06, t*0.04));
        float gran = fbm(vP*7.0 - vec3(t*0.15));
        vec3 c = mix(vec3(0.95,0.26,0.02), vec3(1.0,0.7,0.22), smoothstep(0.3, 0.75, big));
        c += vec3(1.0,0.6,0.2) * (gran - 0.45) * 0.7;
        float mu = max(dot(vN, vec3(0.0,0.0,1.0)), 0.0);
        c *= 0.45 + 0.75*pow(mu, 0.5);
        gl_FragColor = vec4(c * 1.2, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

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
    scene.add(new THREE.AmbientLight(0xbfd4ff, 0.22));
    scene.add(new THREE.PointLight(0xfff1d6, 4, 0, 0));

    const sunMat = sunMaterial();
    const sun = new THREE.Mesh(new THREE.SphereGeometry(1.5, 96, 48), sunMat);
    sun.add(glow("rgba(255,190,100,0.8)", 7, 0.55), glow("rgba(255,140,60,0.45)", 20, 0.35));
    scene.add(sun);

    const orbitMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07 });
    const bodies = PLANETS.map((p) => {
      const pts = Array.from({ length: 129 }, (_, i) => new THREE.Vector3(Math.cos((i / 128) * Math.PI * 2) * p.d, 0, Math.sin((i / 128) * Math.PI * 2) * p.d));
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), orbitMat));
      // A tilted holder carries the spin axis; the globe spins inside it.
      const holder = new THREE.Group();
      holder.rotation.z = THREE.MathUtils.degToRad(p.tilt);
      const mesh = planet(p.tex, p.r, 128, p.normal, 1.4);
      holder.add(mesh);
      if (p.air) holder.add(atmosphere(p.r * 1.04, p.air, 4.2));
      if (p.ring) {
        const ring = saturnRing(p.r);
        ring.rotation.x = Math.PI / 2;
        holder.add(ring);
      }
      scene.add(holder);
      return { ...p, holder, mesh };
    });

    // The Moon circles Earth.
    const earth = bodies.find((b) => b.tex === "earth")!.holder;
    const moon = planet("moon", 0.13, 64, "moon-normal");
    scene.add(moon);

    // A soft bloom on the Sun. Skipped on small or touch screens to save battery.
    const lite = window.innerWidth < 700 || window.matchMedia("(hover: none)").matches;
    const composer = lite ? null : new EffectComposer(renderer);
    if (composer) {
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.5, 0.86));
      composer.addPass(new OutputPass());
    }
    const draw = () => (composer ? composer.render() : renderer.render(scene, camera));

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      composer?.setPixelRatio(renderer.getPixelRatio());
      composer?.setSize(w, h);
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
    const timer = new THREE.Timer();
    let frame = 0;
    const render = () => {
      timer.update();
      const t = still ? 20 : timer.getElapsed();
      for (const b of bodies) {
        const a = b.phase + t * b.speed * 0.25;
        b.holder.position.set(Math.cos(a) * b.d, 0, Math.sin(a) * b.d);
        b.mesh.rotation.y = t * 0.3;
      }
      const ma = t * 1.1;
      moon.position.copy(earth.position).add(new THREE.Vector3(Math.cos(ma) * 0.95, 0.12, Math.sin(ma) * 0.95));
      sun.rotation.y = t * 0.05;
      sunMat.uniforms.t.value = t;
      // Slow drift of the viewpoint; the system sits right of centre so the hero text stays readable.
      const drift = t * 0.02;
      lean.x += (lean.tx - lean.x) * 0.03;
      lean.y += (lean.ty - lean.y) * 0.03;
      camera.position.x = Math.sin(drift) * 4 + lean.x * 3;
      camera.position.y = 9 - lean.y * 2.5;
      camera.lookAt(-7 + Math.sin(drift) * 2, 0, 0);
      draw();
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
      composer?.dispose();
      renderer.dispose();
    };
  }, []);

  // Portalled to <body>: the page fade-in uses a transform, which would otherwise trap this fixed layer.
  return createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <canvas ref={ref} className="h-full w-full" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(8,9,11,0.9) 0%, rgba(8,9,11,0.58) 45%, rgba(8,9,11,0.1) 100%)" }} />
    </div>,
    document.body,
  );
}

