import { describe, expect, test } from "vitest";
import { GRAVITY, START, landingScore, step, verdict, type Lander } from "./lander";

/** Free-fall, then full thrust from the height where a constant burn just stops the lander. */
function suicideBurn(g: number): Lander {
  let s = START;
  const dt = 1 / 120;
  while (s.alt > 0) {
    const stopDist = (s.v * s.v) / (2 * (13 - g));
    s = step(s, g, s.v > 1 && s.alt <= stopDist + 0.5, dt);
  }
  return s;
}

describe("touchdown lander", () => {
  test("falling with the engine off speeds up by g", () => {
    const s = step({ alt: 100, v: 0, fuel: 100 }, GRAVITY.moon, false, 1);
    expect(s.v).toBeCloseTo(1.62);
    expect(s.fuel).toBe(100);
  });

  test("firing slows the fall and burns fuel; an empty tank cannot fire", () => {
    const s = step({ alt: 100, v: 5, fuel: 100 }, GRAVITY.moon, true, 1);
    expect(s.v).toBeLessThan(5);
    expect(s.fuel).toBeLessThan(100);
    expect(step({ alt: 100, v: 5, fuel: 0 }, GRAVITY.moon, true, 1).v).toBeGreaterThan(5);
  });

  test("a soft landing is possible on every world, Earth included", () => {
    for (const g of Object.values(GRAVITY)) {
      const end = suicideBurn(g);
      expect(verdict(end.v), `g=${g}`).not.toBe("crash");
      expect(end.fuel, `g=${g}`).toBeGreaterThan(0);
    }
  });

  test("scores reward soft landings and spare fuel", () => {
    expect(landingScore(2, 40)).toBe(140);
    expect(landingScore(4, 40)).toBe(70);
    expect(landingScore(9, 40)).toBe(0);
  });
});
