// Mission Challenge: quiz rounds generated from the real catalogue and scores.
import { EARTH_SITES, PLACES, REFERENCES } from "../data/catalog";
import { BALANCED } from "../data/presets";
import { aggregate, scoreAll } from "./scoring";
import type { Body, Place } from "./types";

export type Round =
  | { kind: "world"; place: Place; answer: Body }
  | { kind: "analogue"; ref: Place; options: Place[]; scores: number[]; answer: string };

/** Small deterministic PRNG (mulberry32) so a game can be replayed from its seed. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pickOne = <T,>(rand: () => number, xs: T[]): T => xs[Math.floor(rand() * xs.length)];

function worldRound(rand: () => number, used: Set<string>): Round {
  // Choose the world first, so the Moon and Mars come up as often as Earth.
  const body = pickOne(rand, ["earth", "moon", "mars"] as Body[]);
  const pool = PLACES.filter((p) => p.body === body && p.terrain);
  const fresh = pool.filter((p) => !used.has(p.id));
  const place = pickOne(rand, fresh.length ? fresh : pool);
  used.add(place.id);
  return { kind: "world", place, answer: body };
}

const MIN_MARGIN = 3; // the winner must clearly beat the runner-up

function analogueRound(rand: () => number): Round {
  for (let attempt = 0; attempt < 200; attempt++) {
    const ref = pickOne(rand, REFERENCES);
    const options: Place[] = [];
    while (options.length < 3) {
      const s = pickOne(rand, EARTH_SITES);
      if (!options.includes(s)) options.push(s);
    }
    const scores = options.map((o) => aggregate(scoreAll(ref, o), BALANCED).index);
    if (scores.some((s) => s === null)) continue;
    const sorted = [...(scores as number[])].sort((a, b) => b - a);
    if (sorted[0] - sorted[1] < MIN_MARGIN) continue;
    const answer = options[scores.indexOf(sorted[0])].id;
    return { kind: "analogue", ref, options, scores: scores as number[], answer };
  }
  throw new Error("could not build a fair analogue round");
}

export function makeGame(rand: () => number, rounds = 10): Round[] {
  const used = new Set<string>();
  return Array.from({ length: rounds }, (_, i) => (i % 2 === 0 ? worldRound(rand, used) : analogueRound(rand)));
}

export function rankTitle(score: number, total: number): string {
  const k = score / total;
  if (k >= 0.9) return "Flight Director";
  if (k >= 0.7) return "Mission Specialist";
  if (k >= 0.4) return "Field Geologist";
  return "Cadet";
}
