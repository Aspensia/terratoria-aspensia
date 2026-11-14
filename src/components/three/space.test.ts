import { expect, test } from "vitest";
import { latLonToVec3 } from "./space";

// The globe textures put 180°W at the left edge; THREE.SphereGeometry maps that edge to -X.
test("0°N 0°E faces +X, 90°W faces +Z, 90°E faces -Z", () => {
  const a = latLonToVec3(0, 0);
  expect(a.x).toBeCloseTo(1);
  expect(latLonToVec3(0, -90).z).toBeCloseTo(1);
  expect(latLonToVec3(0, 90).z).toBeCloseTo(-1);
});

test("poles sit on the Y axis", () => {
  expect(latLonToVec3(90, 123).y).toBeCloseTo(1);
  expect(latLonToVec3(-89.67, 129.78).y).toBeCloseTo(-1, 3);
});

test("0–360°E longitudes match their -180–180 equivalents", () => {
  const a = latLonToVec3(18.4, 239.6);
  const b = latLonToVec3(18.4, -120.4);
  expect(a.distanceTo(b)).toBeLessThan(1e-9);
});
