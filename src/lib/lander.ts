// Touchdown minigame: a one-dimensional rocket landing. Same lander and engine on every world;
// only gravity changes, so players feel why landing on the Moon is easier than on Mars or Earth.

export const GRAVITY = { moon: 1.62, mars: 3.71, earth: 9.81 } as const; // m/s², NASA fact sheets
export type LanderWorld = keyof typeof GRAVITY;
export const THRUST = 13; // m/s² from the engine at full throttle
export const BURN = 9; // fuel units per second of firing

export interface Lander {
  alt: number; // m above the ground
  v: number; // m/s, positive is downward
  fuel: number; // 0–100
}

export const START: Lander = { alt: 120, v: 4, fuel: 100 };

export function step(s: Lander, g: number, firing: boolean, dt: number): Lander {
  const on = firing && s.fuel > 0;
  const v = s.v + (g - (on ? THRUST : 0)) * dt;
  return { alt: Math.max(0, s.alt - v * dt), v, fuel: Math.max(0, s.fuel - (on ? BURN * dt : 0)) };
}

export type Verdict = "soft" | "hard" | "crash";
export const verdict = (v: number): Verdict => (v <= 2.5 ? "soft" : v <= 5 ? "hard" : "crash");
export const landingScore = (v: number, fuel: number) => {
  const k = verdict(v);
  return k === "soft" ? 100 + Math.round(fuel) : k === "hard" ? 50 + Math.round(fuel / 2) : 0;
};
