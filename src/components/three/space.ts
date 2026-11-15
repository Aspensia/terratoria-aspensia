// Shared Three.js building blocks for the home background and the 3D explorers.
import * as THREE from "three";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export type TextureName = "earth" | "earth-night" | "moon" | "mars" | "venus" | "jupiter" | "saturn" | "neptune" | "stars" | "milkyway" | "moon-normal" | "mars-normal";
export const textureUrl = (name: TextureName, small = false) => `${BASE}/textures/${small ? "sm/" : ""}${name}.jpg`;

/** Lite Mode (Settings): smaller textures, fewer polygons, 1x pixel ratio. Set on <html> before first paint. */
export const isLite = () => typeof document !== "undefined" && document.documentElement.dataset.perf === "lite";

const loader = new THREE.TextureLoader();
/** `small` loads the 1024 px copy in textures/sm/: right for bodies that never fill the screen, and always used in Lite Mode. */
export function loadTexture(name: TextureName, small = false): THREE.Texture {
  const t = loader.load(textureUrl(name, small || isLite()));
  // Normal maps hold directions, not colours, so they must stay linear.
  t.colorSpace = name.endsWith("-normal") ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = isLite() ? 1 : 8;
  return t;
}

/**
 * Point on a sphere for an equirectangular texture whose left edge is 180°W (all textures here).
 * Matches THREE.SphereGeometry's UV layout: lon 0 → +X, lon 90°W → +Z.
 */
export function latLonToVec3(lat: number, lon: number, r = 1): THREE.Vector3 {
  const lonW = lon > 180 ? lon - 360 : lon; // Moon and Mars catalogue longitudes are 0–360°E
  const theta = ((90 - lat) * Math.PI) / 180;
  const phi = ((lonW + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.cos(phi) * Math.sin(theta), r * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta));
}

export function planet(name: TextureName, radius: number, segments = 64, normal?: TextureName, relief = 1, small = false): THREE.Mesh {
  if (isLite()) segments = Math.min(segments, 64);
  const mat = new THREE.MeshStandardMaterial({ map: loadTexture(name, small), roughness: 1, metalness: 0 });
  if (normal) {
    mat.normalMap = loadTexture(normal, small);
    mat.normalScale.set(relief, relief);
  }
  return new THREE.Mesh(new THREE.SphereGeometry(radius, segments, segments / 2), mat);
}

/** Hipparcos star map on a huge inner sphere, plus a layer of point stars for depth. */
export function starfield(radius = 300): THREE.Group {
  const g = new THREE.Group();
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 48, 24),
    new THREE.MeshBasicMaterial({ map: loadTexture("stars"), side: THREE.BackSide, color: 0x7d8aa3, depthWrite: false }),
  );
  g.add(sky);
  const n = isLite() ? 600 : 1400;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(radius * (0.35 + Math.random() * 0.55));
    pos.set([v.x, v.y, v.z], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xcfe2ff, size: 0.9, sizeAttenuation: true, transparent: true, opacity: 0.8, depthWrite: false })));
  return g;
}

/** Soft additive glow sprite, drawn once into a small canvas. */
export function glow(color: string, size: number, strength = 1): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, color);
  grad.addColorStop(0.25, color);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, transparent: true, opacity: strength, depthWrite: false }));
  s.scale.set(size, size, 1);
  return s;
}

/** Thin rim of light around a planet (Fresnel term on a slightly larger back-facing sphere). */
export function atmosphere(radius: number, color: string, power = 3.2): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 64, 32),
    new THREE.ShaderMaterial({
      uniforms: { c: { value: new THREE.Color(color) }, p: { value: power } },
      vertexShader: "varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform vec3 c; uniform float p; varying vec3 vN; void main(){ float i = pow(0.72 - dot(vN, vec3(0.0,0.0,1.0)), p); gl_FragColor = vec4(c, 1.0) * i; }",
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );
}

export function disposeScene(scene: THREE.Object3D) {
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    for (const mat of mats) {
      for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose();
      mat.dispose();
    }
  });
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Creates a renderer, or returns null when WebGL is unavailable so callers can show a fallback. */
export function makeRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer | null {
  try {
    const lite = isLite();
    const r = new THREE.WebGLRenderer({ canvas, antialias: !lite, alpha: true, powerPreference: lite ? "low-power" : "high-performance" });
    r.setPixelRatio(lite ? 1 : Math.min(window.devicePixelRatio, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    return r;
  } catch {
    return null;
  }
}
