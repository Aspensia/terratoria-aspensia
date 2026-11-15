// Jump planning for the FLOW home-page runner (components/GeoRunner.tsx).
// The cube moves at `speed` px/s; a group of `n` spikes, each `unit` wide and 0.95 unit tall, starts `gap` px ahead
// of the cube's front edge. The jump must keep the cube in the air until its back edge has passed the last spike.

export const JUMP_HEIGHT = 2.4; // peak height in cube sizes, clear of the 0.95-unit spikes
const MARGIN = 0.35; // extra flight, in cube sizes, before and after the group

export function jumpFor(gap: number, n: number, unit: number, speed: number) {
  const distance = Math.max(0, gap) + n * unit + unit + MARGIN * unit; // front edge to past the last spike, plus the cube's width
  const duration = distance / speed;
  return { duration, height: JUMP_HEIGHT * unit, turns: Math.max(1, Math.round(duration * 3)) };
}

/** Height (px, positive up) of a jump of `height` and `duration` at time `s` after take-off. */
export const arc = (height: number, duration: number, s: number) => {
  const p = Math.min(1, Math.max(0, s / duration));
  return 4 * height * p * (1 - p);
};
