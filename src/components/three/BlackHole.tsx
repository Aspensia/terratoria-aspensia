"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { isLite, loadTexture, makeRenderer, prefersReducedMotion } from "./space";

// Ray-traced Schwarzschild black hole (INTERSTELLAR theme, home page only).
// Each pixel's light ray is bent with the photon-orbit equation a = -1.5 h² r / |r|⁵ (units of the
// Schwarzschild radius), so the far side of the accretion disk appears lifted over and under the shadow.
// The disk is hotter inside, turns with Keplerian speed and is Doppler-brightened on the approaching side.
const FRAG = `
precision highp float;
uniform float t; uniform vec2 res; uniform float shift; uniform sampler2D sky; uniform float steps;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < OCT; i++){ s += a*noise(p); p *= 2.07; a *= 0.5; } return s; }
float h3(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x), mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x), f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x), mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x), f.y), f.z); }
float fbm3(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < OCT; i++){ s += a*n3(p); p *= 2.03; a *= 0.5; } return s; }
mat3 look(vec3 ro, vec3 ta){ vec3 f = normalize(ta-ro), r = normalize(cross(vec3(0,1,0), f)); return mat3(r, cross(f, r), f); }

vec3 background(vec3 d){
  vec2 uv = vec2(atan(d.z, d.x) / 6.2831853 + 0.5, acos(clamp(d.y, -1.0, 1.0)) / 3.14159265);
  vec3 c = texture2D(sky, uv).rgb * 0.55;
  vec2 g = uv * vec2(900.0, 450.0);
  float s = hash(floor(g));
  c += vec3(0.9, 0.95, 1.0) * step(0.9975, s) * smoothstep(0.5, 0.0, length(fract(g) - 0.5)) * 1.6;
  return c;
}

void main(){
  vec2 uv = (gl_FragCoord.xy * 2.0 - res) / res.y;
  uv.x -= shift;
  // Close, nearly edge-on view: the disk sweeps across the frame and its far side arcs over the shadow.
  float a = t * 0.012;
  vec3 ro = vec3(sin(a) * 9.0, 0.55 + 0.12 * sin(t * 0.05), cos(a) * 9.0);
  vec3 rd = look(ro, vec3(0.0, 0.15, 0.0)) * normalize(vec3(uv, 1.55));
  vec3 pos = ro, vel = rd;
  float h2 = dot(cross(pos, vel), cross(pos, vel));
  vec3 col = vec3(0.0);
  float trans = 1.0, minR = 100.0;
  for (int i = 0; i < 260; i++){
    if (float(i) >= steps) break;
    float r = length(pos);
    if (r < 1.0){ trans = 0.0; break; }
    if (r > 40.0) break;
    minR = min(minR, r);
    float dt = clamp(0.07 * r * r / 4.0, 0.03, 1.0);
    vec3 prev = pos;
    vel += -1.5 * h2 * pos / pow(r, 5.0) * dt;
    pos += vel * dt;
    if (prev.y * pos.y < 0.0){
      vec3 p = mix(prev, pos, prev.y / (prev.y - pos.y));
      float rr = length(p.xz);
      if (rr > 3.0 && rr < 15.0){
        // Gas orbits at Keplerian speed (faster inside), sped up for drama; texture is stretched along each orbit.
        float phi = atan(p.z, p.x);
        float ang = phi + t * 7.0 / pow(rr, 1.5);
        vec3 qp = vec3(cos(ang) * 1.6, sin(ang) * 1.6, rr * 2.2);
        float n = fbm3(qp + vec3(0.0, 0.0, 0.0));
        float fil = fbm3(vec3(cos(ang) * 3.2, sin(ang) * 3.2, rr * 4.2) + n * 2.2); // thin orbital filaments
        float lanes = smoothstep(0.25, 0.65, fbm3(vec3(cos(ang) * 2.5, sin(ang) * 2.5, rr * 4.0))); // darker dust lanes
        float dens = smoothstep(3.0, 3.6, rr) * (1.0 - smoothstep(9.0, 15.0, rr)) * (0.2 + 0.8 * n) * (0.45 + 0.9 * fil) * (0.55 + 0.45 * lanes);
        float temp = clamp((rr - 3.0) / 10.0, 0.0, 1.0);
        vec3 hot = mix(vec3(1.0, 0.86, 0.66) * 3.2, vec3(0.95, 0.4, 0.1) * 1.2, pow(temp, 0.5));
        vec3 vdir = normalize(vec3(-p.z, 0.0, p.x));
        float beta = 0.7 / sqrt(rr);
        float doppler = pow(max(0.12, 1.0 + beta * dot(vdir, -normalize(vel))), 3.0);
        col += trans * hot * dens * doppler * 0.9;
        trans *= 1.0 - clamp(dens * 0.85, 0.0, 0.95);
      }
    }
  }
  col += trans * background(normalize(vel));
  // Soft glow from light that skimmed the photon sphere (r = 1.5) on its way out.
  col += trans * vec3(1.0, 0.82, 0.62) * exp(-(minR - 1.5) * 2.2) * 0.35;
  col = 1.0 - exp(-col * 0.95);
  col *= vec3(1.04, 0.95, 0.84); // warm grade
  gl_FragColor = vec4(pow(col, vec3(0.9)), 1.0);
}`;

/** Home page backdrop for the INTERSTELLAR theme song. */
export function BlackHole() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const renderer = makeRenderer(canvas);
    if (!renderer) return;
    const lite = isLite() || window.matchMedia("(hover: none)").matches;
    // The ray tracer is per pixel, so it renders below screen resolution and is scaled up.
    renderer.setPixelRatio(lite ? 0.4 : 0.7);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      t: { value: 0 },
      res: { value: new THREE.Vector2() },
      shift: { value: 0 },
      sky: { value: loadTexture("milkyway", true) },
      steps: { value: lite ? 90 : 200 },
    };
    const mat = new THREE.ShaderMaterial({ uniforms, defines: { OCT: lite ? 3 : 5 }, vertexShader: "void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }", fragmentShader: FRAG });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    scene.add(quad);

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      renderer.getDrawingBufferSize(uniforms.res.value);
      // Wide screens: put the hole right of centre so the hero text stays readable.
      uniforms.shift.value = w > 900 ? 0.75 : 0;
    };
    resize();
    window.addEventListener("resize", resize);

    const still = prefersReducedMotion();
    const timer = new THREE.Timer();
    let frame = 0;
    const render = () => {
      timer.update();
      uniforms.t.value = still ? 30 : timer.getElapsed() + 30;
      renderer.render(scene, camera);
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
      uniforms.sky.value.dispose();
      quad.geometry.dispose();
      mat.dispose();
      renderer.dispose();
    };
  }, []);

  return createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-black">
      <canvas ref={ref} className="h-full w-full" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(8,9,11,0.88) 0%, rgba(8,9,11,0.45) 42%, rgba(8,9,11,0) 70%)" }} />
    </div>,
    document.body,
  );
}
