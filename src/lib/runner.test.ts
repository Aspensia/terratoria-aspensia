import { describe, expect, test } from "vitest";
import { arc, jumpFor } from "./runner";

describe("runner jump", () => {
  const unit = 30, speed = unit * 9;
  test("the cube is above every spike for as long as it overlaps the group", () => {
    for (const n of [1, 2, 3]) {
      for (const gap of [0.15 * unit, 0.5 * unit, 0.9 * unit]) {
        const j = jumpFor(gap, n, unit, speed);
        // Sample the flight: whenever any part of the cube is over a spike, its bottom must be above that spike.
        for (let s = 0; s <= j.duration; s += 0.002) {
          const front = speed * s; // cube front edge, relative to take-off
          const back = front - unit;
          for (let k = 0; k < n; k++) {
            const left = gap + k * unit, right = left + unit, tipX = left + unit / 2;
            if (front < left || back > right) continue;
            // Spike height under the cube's nearest point to the tip.
            const xNear = Math.min(Math.max(tipX, back), front);
            const spike = 0.95 * unit * (1 - Math.abs(xNear - tipX) / (unit / 2));
            expect(arc(j.height, j.duration, s), `n=${n} gap=${gap} s=${s.toFixed(3)}`).toBeGreaterThan(spike - 0.5);
          }
        }
        expect(speed * j.duration - unit).toBeGreaterThan(gap + n * unit); // lands past the last spike
      }
    }
  });
});
