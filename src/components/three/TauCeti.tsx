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
// planets from Feng et al. (2017), orbits in AU: g 0.133, h 0.243, e 0.538, f 1.334 (compressed here).
// The camera rides just behind a small ship in low orbit over Tau Ceti e, shown as a swirling
// yellow-green-orange world. AMAZE turns it sparkling pink and lights the Petrova line from the star.
const OTHERS: { au: number; r: number; tex: TextureName; tint: number; speed: number; phase: number }[] = [
  { au: 0.133, r: 0.32, tex: "venus", tint: 0xffd2a0, speed: 0.9, phase: 0.5 },
  { au: 0.243, r: 0.3, tex: "mars", tint: 0xc9b6a6, speed: 0.6, phase: 2.4 },
  { au: 1.334, r: 0.62, tex: "moon", tint: 0xbfe3ff, speed: 0.14, phase: 1.1 },
];
const dist = (au: number) => 3 + au * 11;
const E_DIST = dist(0.538);
const R = 0.78; // Tau Ceti e

const NOISE = `
float h3(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x), mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x), f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x), mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x), f.y), f.z); }
float fbm(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ s += a*n3(p); p *= 2.02; a *= 0.5; } return s; }`;

/** Swirling cloud world: domain-warped noise in green, yellow and orange; AMAZE blends to sparkling pink. */
function worldMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { t: { value: 0 }, amaze: { value: 0 } },
    vertexShader: `varying vec3 vP; varying vec3 vN; varying vec3 vW;
      void main(){ vP = position; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float t; uniform float amaze; varying vec3 vP; varying vec3 vN; varying vec3 vW;
      ${NOISE}
      void main(){
        vec3 p = normalize(vP) * 2.4;
        vec3 q = vec3(fbm(p + vec3(0.0, t * 0.01, 0.0)), fbm(p + vec3(5.2, 1.3, 2.8)), fbm(p + vec3(2.1, 7.7, 3.3)));
        vec3 r = vec3(fbm(p + 3.6 * q + vec3(1.7, 9.2, t * 0.012)), fbm(p + 3.6 * q + vec3(8.3, 2.8, 1.1)), 0.0);
        float f = fbm(p + 4.2 * r.xyy);
        vec3 col = mix(vec3(0.3, 0.72, 0.1), vec3(0.93, 0.96, 0.2), smoothstep(0.32, 0.72, f));
        col = mix(col, vec3(0.93, 0.48, 0.07), smoothstep(0.52, 0.82, r.x) * 0.85);
        vec3 pink = mix(vec3(0.78, 0.12, 0.46), vec3(1.0, 0.56, 0.82), smoothstep(0.3, 0.8, f));
        float spark = step(0.988, h3(floor(normalize(vP) * 320.0) + floor(t * 7.0))) * (0.6 + 0.4 * sin(t * 20.0 + f * 30.0));
        col = mix(col, pink, amaze);
        vec3 N = normalize(vN), L = normalize(-vW), V = normalize(cameraPosition - vW);
        float ndl = dot(N, L);
        float lit = smoothstep(-0.12, 0.3, ndl);
        vec3 c = col * (0.015 + 1.15 * max(ndl, 0.0)) * lit;
        float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
        c += mix(vec3(0.8, 0.95, 0.35), vec3(1.0, 0.45, 0.8), amaze) * rim * (0.15 + 0.85 * lit) * 0.55;
        c += amaze * spark * vec3(1.0, 0.75, 0.95) * (0.35 + lit);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

/** An original long, modular hard-SF craft built along +X: command module, habitats, tanks, radiators, solar wings, engine. */
function ship(): THREE.Group {
  const g = new THREE.Group();
  const hull = new THREE.MeshStandardMaterial({ color: 0xd9dde2, metalness: 0.35, roughness: 0.55 });
  const band = new THREE.MeshStandardMaterial({ color: 0x2a2f36, metalness: 0.3, roughness: 0.7 });
  const foil = new THREE.MeshStandardMaterial({ color: 0xb08a3a, metalness: 0.8, roughness: 0.35 });
  const solar = new THREE.MeshStandardMaterial({ color: 0x1b2a44, metalness: 0.5, roughness: 0.3, emissive: 0x050a14 });
  const cyl = (r: number, len: number, x: number, m: THREE.Material) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 24), m);
    c.rotation.z = Math.PI / 2;
    c.position.x = x;
    g.add(c);
    return c;
  };
  const spine = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.018, 0.018), band);
  g.add(spine);
  cyl(0.042, 0.13, 0.43, hull); // command module
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.042, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), hull);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 0.495;
  g.add(nose);
  cyl(0.058, 0.17, 0.26, hull); // habitat A
  cyl(0.06, 0.012, 0.26, band);
  cyl(0.058, 0.17, 0.08, hull); // habitat B
  cyl(0.06, 0.02, 0.08, foil);
  for (const [y, z] of [[0.05, 0.05], [-0.05, 0.05], [0.05, -0.05], [-0.05, -0.05]]) {
    const tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, 0.14, 6, 16), hull); // propellant tanks
    tank.rotation.z = Math.PI / 2;
    tank.position.set(-0.13, y, z);
    g.add(tank);
  }
  for (const s of [-1, 1]) {
    const rad = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.004), new THREE.MeshStandardMaterial({ color: 0xeef1f4, metalness: 0.1, roughness: 0.8 }));
    rad.position.set(0.0, s * 0.1, 0); // radiators, edge-on to the Sun
    g.add(rad);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.003, 0.42), solar);
    wing.position.set(-0.34, 0, s * 0.25); // solar wings
    g.add(wing);
  }
  const bell = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.09, 24, 1, true), band);
  bell.rotation.z = Math.PI / 2;
  bell.position.x = -0.53;
  g.add(bell);
  const plume = glow("rgba(140,190,255,0.95)", 0.16, 0.8);
  plume.position.x = -0.6;
  g.add(plume);
  return g;
}

/** Home page backdrop for the HAIL MARY theme song. `amaze` fades the planet to pink and shows the Petrova line. */
export function TauCeti({ amaze = false }: { amaze?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const want = useRef(amaze);
  want.current = amaze;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const renderer = makeRenderer(canvas);
    if (!renderer) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.002, 600);

    const milky = new THREE.Mesh(
      new THREE.SphereGeometry(330, 48, 24),
      new THREE.MeshBasicMaterial({ map: loadTexture("milkyway", true), side: THREE.BackSide, color: 0x8a8a8a, depthWrite: false }),
    );
    milky.rotation.set(1.1, 2.2, 0.2);
    scene.add(milky, starfield());
    scene.add(new THREE.AmbientLight(0xbfd4ff, 0.12));
    scene.add(new THREE.PointLight(0xffe2b8, 4.2, 0, 0));

    const starMat = sunMaterial();
    const star = new THREE.Mesh(new THREE.SphereGeometry(1.25, 64, 32), starMat);
    star.add(glow("rgba(255,200,120,0.85)", 6.5, 0.6), glow("rgba(255,150,70,0.45)", 18, 0.35));
    scene.add(star);

    const others = OTHERS.map((w) => {
      const m = planet(w.tex, w.r, 64, undefined, 1, true);
      (m.material as THREE.MeshStandardMaterial).color.set(w.tint);
      scene.add(m);
      return { ...w, m };
    });

    const worldMat = worldMaterial();
    const world = new THREE.Mesh(new THREE.SphereGeometry(R, isLite() ? 96 : 192, isLite() ? 48 : 96), worldMat);
    const air = atmosphere(R * 1.035, "#c8ff7a", 3.2);
    const airColor = (air.material as THREE.ShaderMaterial).uniforms.c.value as THREE.Color;
    const e = new THREE.Group();
    e.add(world, air);
    scene.add(e);

    const craft = ship();
    craft.scale.setScalar(0.055);
    scene.add(craft);

    // Petrova line: a faint red-pink beam from the star into the planet, shimmering along its length.
    const beamMat = new THREE.ShaderMaterial({
      uniforms: { t: { value: 0 }, k: { value: 0 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform float t; uniform float k; varying vec2 vUv;
        float h(float x){ return fract(sin(x * 91.7) * 43758.5); }
        void main(){
          float edge = 1.0 - abs(vUv.x - 0.5) * 2.0;
          float shimmer = 0.6 + 0.4 * sin(vUv.y * 140.0 - t * 6.0) * sin(vUv.y * 37.0 + t * 2.0);
          float grain = step(0.97, h(floor(vUv.y * 900.0) + floor(t * 10.0)));
          float a = k * pow(edge, 2.5) * (0.35 * shimmer + grain * 0.9);
          gl_FragColor = vec4(vec3(1.0, 0.25, 0.55) * a, a);
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.05, 1, 24, 1, true), beamMat);
    scene.add(beam);

    const lite = isLite() || window.innerWidth < 700 || window.matchMedia("(hover: none)").matches;
    const composer = lite ? null : new EffectComposer(renderer);
    if (composer) {
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.5, 0.82));
      composer.addPass(new OutputPass());
    }
    const draw = () => (composer ? composer.render() : renderer.render(scene, camera));

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      composer?.setPixelRatio(renderer.getPixelRatio());
      composer?.setSize(w, h);
      camera.aspect = w / h;
      // Shift the picture right on wide screens so the hero text keeps the left side.
      if (w > 900) camera.setViewOffset(w, h, -w * 0.16, 0, w, h);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const still = prefersReducedMotion();
    const timer = new THREE.Timer();
    const toStar = new THREE.Vector3(), T = new THREE.Vector3(), U = new THREE.Vector3(), S = new THREE.Vector3(), m = new THREE.Matrix4();
    const yAxis = new THREE.Vector3(0, 1, 0);
    let frame = 0, k = want.current ? 1 : 0;
    const render = () => {
      timer.update();
      const t = still ? 12 : timer.getElapsed() + 12;
      const ea = 4.2 + t * 0.006;
      e.position.set(Math.cos(ea) * E_DIST, 0, Math.sin(ea) * E_DIST);
      world.rotation.y = t * 0.02;
      for (const o of others) {
        const a = o.phase + t * o.speed * 0.02;
        o.m.position.set(Math.cos(a) * dist(o.au), 0, Math.sin(a) * dist(o.au));
      }

      // The ship holds a low orbit over the day side, drifting slowly along it.
      toStar.copy(e.position).negate().normalize();
      const sideways = new THREE.Vector3().crossVectors(yAxis, toStar).normalize();
      // About 75° from the point under the star: Tau Ceti hangs low over the horizon ahead.
      const ang = 1.3 + Math.sin(t * 0.03) * 0.08;
      U.copy(toStar).multiplyScalar(Math.cos(ang)).addScaledVector(sideways, Math.sin(ang)).normalize();
      U.y = 0.18;
      U.normalize();
      craft.position.copy(e.position).addScaledVector(U, R * 1.07);
      T.copy(toStar).addScaledVector(U, -toStar.dot(U)).normalize(); // flying toward the star
      S.crossVectors(T, U).normalize();
      craft.quaternion.setFromRotationMatrix(m.makeBasis(T, U, S));

      // Camera just behind and above the ship: the planet's curve fills the lower frame.
      camera.position.copy(craft.position).addScaledVector(T, -0.12).addScaledVector(U, 0.035).addScaledVector(S, 0.06 + Math.sin(t * 0.07) * 0.01);
      camera.up.copy(U);
      // AMAZE fades in and out smoothly.
      k += ((want.current ? 1 : 0) - k) * 0.04;
      camera.lookAt(craft.position.clone().addScaledVector(T, 0.06).addScaledVector(U, 0.005));

      worldMat.uniforms.t.value = t;
      worldMat.uniforms.amaze.value = k;
      airColor.setRGB(0.78 + 0.22 * k, 1 - 0.55 * k, 0.48 + 0.32 * k);
      beamMat.uniforms.t.value = t;
      beamMat.uniforms.k.value = k;
      beam.visible = k > 0.01;
      // Stretch the beam from the star's surface to the planet.
      const from = toStar.clone().multiplyScalar(-1.25);
      const to = e.position.clone().addScaledVector(toStar, R * 0.9);
      beam.position.copy(from).add(to).multiplyScalar(0.5);
      beam.scale.set(1, from.distanceTo(to), 1);
      beam.quaternion.setFromUnitVectors(yAxis, to.clone().sub(from).normalize());

      starMat.uniforms.t.value = t;
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
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(8,9,11,0.88) 0%, rgba(8,9,11,0.45) 42%, rgba(8,9,11,0.02) 100%)" }} />
    </div>,
    document.body,
  );
}
