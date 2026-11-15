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
float fbm(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < OCT; i++){ s += a*n3(p); p *= 2.02; a *= 0.5; } return s; }`;

/**
 * Tau Ceti e as a cloud world: banded zones broken into marbled swirls (two levels of domain warping),
 * a dimmer day side with a warm terminator and dark night side, and limb haze. AMAZE blends to hot pink-red,
 * covered in twinkling glints. Detail (noise octaves) follows Lite / Base Mode.
 */
function worldMaterial(octaves: number) {
  return new THREE.ShaderMaterial({
    defines: { OCT: octaves },
    uniforms: { t: { value: 0 }, amaze: { value: 0 } },
    vertexShader: `varying vec3 vP; varying vec3 vN; varying vec3 vW;
      void main(){ vP = position; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float t; uniform float amaze; varying vec3 vP; varying vec3 vN; varying vec3 vW;
      ${NOISE}
      void main(){
        vec3 sp = normalize(vP);
        vec3 p = sp * 2.6;
        // Latitude bands, bent by two levels of swirling flow.
        vec3 q = vec3(fbm(p + vec3(0.0, 0.0, t * 0.008)), fbm(p + vec3(5.2, 1.3, 2.8)), fbm(p + vec3(2.1, 7.7, 3.3)));
        vec3 r = vec3(fbm(p + 4.0 * q + vec3(1.7, 9.2, t * 0.01)), fbm(p + 4.0 * q + vec3(8.3, 2.8, 1.1)), fbm(p + 4.0 * q + vec3(3.1, 4.4, 6.6)));
        float band = sin(sp.y * 9.0 + r.x * 5.0 + q.y * 2.0);
        float f = fbm(p * 1.6 + 5.0 * r);
        float fine = fbm(sp * 22.0 + 3.0 * r);
        vec3 green = vec3(0.16, 0.42, 0.05), lime = vec3(0.62, 0.68, 0.08), amber = vec3(0.62, 0.3, 0.04);
        vec3 col = mix(green, lime, smoothstep(0.3, 0.75, f + band * 0.12));
        col = mix(col, amber, smoothstep(0.5, 0.85, r.z + band * 0.08) * 0.9);
        col *= 0.65 + 0.7 * fine; // fine eddies, the planet's signature marbling
        // AMAZE: red-leaning hot pink, with dense glints that twinkle at their own pace.
        vec3 pink = mix(vec3(0.82, 0.015, 0.035), vec3(1.0, 0.16, 0.12), smoothstep(0.25, 0.8, f)) * (0.8 + 0.4 * fine);
        vec3 cell = floor(sp * 420.0);
        float ph = h3(cell);
        float glint = step(0.965, ph) * pow(0.5 + 0.5 * sin(t * (3.0 + ph * 9.0) + ph * 40.0), 6.0);
        vec3 N = normalize(vN), L = normalize(-vW), V = normalize(cameraPosition - vW);
        float ndl = dot(N, L);
        float lit = smoothstep(-0.1, 0.25, ndl);
        // Warmer, dimmer light near the terminator, like late afternoon.
        vec3 sunCol = mix(vec3(1.0, 0.55, 0.3), vec3(1.0, 0.92, 0.8), smoothstep(0.0, 0.5, ndl));
        vec3 c = col * sunCol * (0.01 + 0.78 * max(ndl, 0.0)) * lit;
        // AMAZE: hot pink that glows on its own (the infested world shines), brightest on the day side.
        c = mix(c, pink * (0.12 + 1.25 * max(ndl, 0.0) * lit), amaze);
        float rim = pow(1.0 - max(dot(N, V), 0.0), 2.6);
        c += mix(vec3(0.55, 0.75, 0.25), vec3(1.0, 0.07, 0.08), amaze) * rim * (0.08 + 0.6 * lit) * 0.6;
        c += amaze * glint * vec3(1.0, 0.6, 0.55) * (0.6 + 1.4 * lit);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

/** Additive, twinkling point sprites (sparkles and the Petrova stream share it). */
function sparkleMaterial(color: string, size: number) {
  return new THREE.ShaderMaterial({
    uniforms: { t: { value: 0 }, k: { value: 0 }, c: { value: new THREE.Color(color) }, size: { value: size }, scale: { value: 1000 }, from: { value: new THREE.Vector3() }, to: { value: new THREE.Vector3() }, flow: { value: 0 } },
    vertexShader: `attribute float seed; uniform float t; uniform float size; uniform float scale; uniform vec3 from; uniform vec3 to; uniform float flow; varying float vTw;
      void main(){
        vec3 p = position;
        if (flow > 0.5) {
          // Stream: each particle travels from the star to the planet, then starts again.
          float u = fract(seed + t * (0.03 + 0.03 * fract(seed * 7.3)));
          p = mix(from, to, u) + position * (0.25 + 0.75 * u);
        }
        vTw = pow(0.5 + 0.5 * sin(t * (2.0 + fract(seed * 13.7) * 6.0) + seed * 60.0), 3.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = min(64.0, size * scale * (0.4 + vTw) / -mv.z); // size is in world units
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `uniform vec3 c; uniform float k; varying float vTw;
      void main(){
        vec2 d = gl_PointCoord - 0.5;
        float r = length(d);
        float core = exp(-r * r * 40.0);
        float star = max(0.0, 1.0 - abs(d.x) * 14.0) * max(0.0, 1.0 - abs(d.y) * 2.2) + max(0.0, 1.0 - abs(d.y) * 14.0) * max(0.0, 1.0 - abs(d.x) * 2.2);
        float a = k * (core + star * 0.6 * vTw) * (0.35 + vTw);
        gl_FragColor = vec4(c * a, a);
      }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

/**
 * AMAZE glitter hugging the planet: small soft discs (bokeh) with a brighter rim when `disc` is 1, tiny sharp
 * twinkles when 0. All drift slightly and fade with AMAZE.
 */
function glitterMaterial(color: string, size: number, disc: number) {
  return new THREE.ShaderMaterial({
    uniforms: { t: { value: 0 }, k: { value: 0 }, c: { value: new THREE.Color(color) }, size: { value: size }, scale: { value: 1000 }, disc: { value: disc } },
    vertexShader: `attribute float seed; uniform float t; uniform float size; uniform float scale; varying float vTw; varying float vS;
      void main(){
        vec3 p = position;
        p += vec3(sin(t * 0.07 + seed * 40.0), cos(t * 0.05 + seed * 23.0), sin(t * 0.06 + seed * 31.0)) * 0.006;
        vS = fract(seed * 17.3);
        vTw = 0.55 + 0.45 * sin(t * (0.6 + vS * 2.5) + seed * 50.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = min(36.0, size * (0.35 + 1.3 * vS * vS) * scale / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `uniform vec3 c; uniform float k; uniform float disc; varying float vTw; varying float vS;
      void main(){
        float r = length(gl_PointCoord - 0.5) * 2.0;
        if (r > 1.0) discard;
        float a = disc > 0.5
          ? (smoothstep(1.0, 0.86, r) * (0.55 + 0.4 * smoothstep(0.6, 0.92, r))) * (0.45 + 0.55 * vTw)
          : (exp(-r * r * 14.0) * 1.6 + exp(-r * r * 3.0) * 0.35) * vTw * vTw;
        vec3 col = mix(c, vec3(1.0, 0.72, 0.6), disc > 0.5 ? 0.12 * vS : 0.45 * vTw);
        gl_FragColor = vec4(col * a * k, a * k);
      }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
}

function points(n: number, place: (i: number, v: THREE.Vector3) => void) {
  const pos = new Float32Array(n * 3), seed = new Float32Array(n), v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    place(i, v);
    pos.set([v.x, v.y, v.z], i * 3);
    seed[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
  return g;
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

    const lowSpec = isLite() || window.matchMedia("(hover: none)").matches;
    const worldMat = worldMaterial(lowSpec ? 3 : 6);
    const world = new THREE.Mesh(new THREE.SphereGeometry(R, lowSpec ? 96 : 192, lowSpec ? 48 : 96), worldMat);
    const air = atmosphere(R * 1.03, "#8fbf4a", 3.4);
    const airColor = (air.material as THREE.ShaderMaterial).uniforms.c.value as THREE.Color;
    const e = new THREE.Group();
    e.add(world, air);
    scene.add(e);

    const craft = ship();
    craft.scale.setScalar(0.055);
    scene.add(craft);

    // AMAZE sparkles: a twinkling shell of glints hugging the planet.
    const glitterMat = sparkleMaterial("#ff3b3b", 0.005);
    const glitter = new THREE.Points(
      points(lowSpec ? 900 : 4000, (_, v) => v.randomDirection().multiplyScalar(R * (1.005 + Math.pow(Math.random(), 3) * 0.25))),
      glitterMat,
    );
    e.add(glitter);

    // Petrova line: a soft stream of red-pink glints flowing from Tau Ceti into the planet.
    const streamMat = sparkleMaterial("#ff2626", 0.045);
    streamMat.uniforms.flow.value = 1;
    const stream = new THREE.Points(points(lowSpec ? 900 : 3200, (_, v) => v.randomDirection().multiplyScalar(Math.pow(Math.random(), 2) * 0.22)), streamMat);
    stream.frustumCulled = false;
    scene.add(stream);

    // AMAZE glitter on the planet itself: small soft bokeh discs and fine dust in a thin shell around Tau Ceti e.
    const shell = (v: THREE.Vector3, h: number) => v.randomDirection().multiplyScalar(R * (1.01 + Math.pow(Math.random(), 2.5) * h));
    const bokehMat = glitterMaterial("#ff3a2e", 0.015, 1);
    const bokeh = new THREE.Points(points(lowSpec ? 60 : 180, (_, v) => shell(v, 0.04)), bokehMat);
    const dustMat = glitterMaterial("#ff5a40", 0.006, 0);
    const dust = new THREE.Points(points(lowSpec ? 400 : 1400, (_, v) => shell(v, 0.05)), dustMat);
    e.add(bokeh, dust);

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
      const px = (renderer.getDrawingBufferSize(new THREE.Vector2()).y * 0.5) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      glitterMat.uniforms.scale.value = streamMat.uniforms.scale.value = bokehMat.uniforms.scale.value = dustMat.uniforms.scale.value = px;
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

      // The ship flies a real low orbit (one lap every 90 seconds). The orbit is a dawn-dusk orbit: its
      // plane faces Tau Ceti, so the ship rides the day-night line and stays in sunlight, as real
      // Earth-observing satellites do.
      toStar.copy(e.position).negate().normalize();
      const n = toStar.clone().multiplyScalar(0.92).addScaledVector(yAxis, 0.4).normalize();
      const a = new THREE.Vector3().crossVectors(yAxis, n).normalize();
      const b = new THREE.Vector3().crossVectors(n, a);
      const th = (t / 90) * Math.PI * 2;
      U.copy(a).multiplyScalar(Math.cos(th)).addScaledVector(b, Math.sin(th));
      T.copy(a).multiplyScalar(-Math.sin(th)).addScaledVector(b, Math.cos(th));
      craft.position.copy(e.position).addScaledVector(U, R * 1.07);
      S.crossVectors(T, U).normalize();
      craft.quaternion.setFromRotationMatrix(m.makeBasis(T, U, S));

      // Camera hangs on the sunlit side, a few planet radii out and drifting slowly, so Tau Ceti e shows
      // nearly full with its swirling bands; the ship crosses in front of the planet and passes behind it.
      const side = new THREE.Vector3().crossVectors(yAxis, toStar).normalize();
      const view = toStar.clone().multiplyScalar(0.62).addScaledVector(yAxis, 0.3).addScaledVector(side, 0.55 + Math.sin(t * 0.02) * 0.15).normalize();
      camera.position.copy(e.position).addScaledVector(view, R * 3.3);
      camera.up.set(0, 1, 0);
      camera.lookAt(e.position);

      // AMAZE fades in and out smoothly.
      k += ((want.current ? 1 : 0) - k) * 0.04;

      worldMat.uniforms.t.value = t;
      worldMat.uniforms.amaze.value = k;
      airColor.setRGB(0.56 + 0.44 * k, 0.75 - 0.6 * k, 0.29 - 0.17 * k);
      for (const mat of [glitterMat, streamMat, bokehMat, dustMat]) {
        mat.uniforms.t.value = t;
        mat.uniforms.k.value = k;
      }
      glitter.visible = stream.visible = bokeh.visible = dust.visible = k > 0.01;
      // The stream runs from the star's surface to the planet's sunlit face.
      streamMat.uniforms.from.value.copy(toStar).multiplyScalar(-1.3);
      streamMat.uniforms.to.value.copy(e.position).addScaledVector(toStar, R * 0.95);

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
