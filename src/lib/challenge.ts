// Mission Challenge: quiz rounds generated from the real catalogue, measurements and scores.
// Within one game no place, Earth site option or head-to-head pairing is used twice.
import { EARTH_SITES, PLACES, REFERENCES } from "../data/catalog";
import { BALANCED } from "../data/presets";
import { aggregate, scoreAll } from "./scoring";
import type { Body, Place } from "./types";

export type DuelMetric = "steeper" | "rougher" | "relief" | "colder";

export type Round =
  | { kind: "world"; place: Place; answer: Body }
  | { kind: "analogue"; ref: Place; options: Place[]; scores: number[]; answer: string }
  | { kind: "duel"; metric: DuelMetric; a: Place; b: Place; answer: string; question: Text; unit: Text; value: (p: Place) => number };

/** Text in both interface languages. */
export type Text = { en: string; km: string };

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
  // Choose among worlds that still have unseen places, so the Moon and Mars come up but never repeat.
  const unseen = (b: Body) => PLACES.filter((p) => p.body === b && p.terrain && !used.has(p.id));
  const bodies = (["earth", "moon", "mars"] as Body[]).filter((b) => unseen(b).length > 0);
  const body = pickOne(rand, bodies);
  const place = pickOne(rand, unseen(body));
  used.add(place.id);
  return { kind: "world", place, answer: body };
}

const MIN_MARGIN = 3; // the winner must clearly beat the runner-up

function analogueRound(rand: () => number, ref: Place, usedSites: Set<string>): Round {
  for (let attempt = 0; attempt < 400; attempt++) {
    const pool = EARTH_SITES.filter((s) => !usedSites.has(s.id));
    const options: Place[] = [];
    while (options.length < 3) {
      const s = pickOne(rand, pool);
      if (!options.includes(s)) options.push(s);
    }
    const scores = options.map((o) => aggregate(scoreAll(ref, o), BALANCED).index);
    if (scores.some((s) => s === null)) continue;
    const sorted = [...(scores as number[])].sort((a, b) => b - a);
    if (sorted[0] - sorted[1] < MIN_MARGIN) continue;
    options.forEach((o) => usedSites.add(o.id));
    return { kind: "analogue", ref, options, scores: scores as number[], answer: options[scores.indexOf(sorted[0])].id };
  }
  throw new Error("could not build a fair analogue round");
}

const DUELS: Record<DuelMetric, { question: Text; unit: Text; value: (p: Place) => number | undefined }> = {
  steeper: {
    question: { en: "Which place has steeper ground?", km: "តើទីតាំងណាមានដីចោតជាង?" },
    unit: { en: "° median slope", km: "° ជម្រាលមធ្យម" },
    value: (p) => p.terrain?.slopeMedianDeg,
  },
  rougher: {
    question: { en: "Which place has rougher ground?", km: "តើទីតាំងណាមានដីរដិបរដុបជាង?" },
    unit: { en: "m roughness", km: "ម. ភាពរដិបរដុប" },
    value: (p) => p.terrain?.roughnessM,
  },
  relief: {
    question: { en: "Which place has the bigger height difference?", km: "តើទីតាំងណាមានកម្ពស់ខុសគ្នាធំជាង?" },
    unit: { en: "m local relief", km: "ម. កម្ពស់ខុសគ្នាក្នុងតំបន់" },
    value: (p) => p.terrain?.reliefM,
  },
  colder: {
    question: { en: "Which place is colder on average?", km: "តើទីតាំងណាត្រជាក់ជាងជាមធ្យម?" },
    unit: { en: "K mean surface temperature", km: "K សីតុណ្ហភាពផ្ទៃមធ្យម" },
    value: (p) => p.climate?.meanK,
  },
};

function duelRound(rand: () => number, usedDuel: Set<string>): Round {
  for (let attempt = 0; attempt < 400; attempt++) {
    const metric = pickOne(rand, Object.keys(DUELS) as DuelMetric[]);
    const d = DUELS[metric];
    const pool = PLACES.filter((p) => d.value(p) !== undefined && !usedDuel.has(p.id));
    const a = pickOne(rand, pool);
    const b = pickOne(rand, pool);
    if (a === b) continue;
    const [va, vb] = [d.value(a)!, d.value(b)!];
    // Fair question: the two values must differ by at least 15%.
    if (Math.abs(va - vb) < 0.15 * Math.max(Math.abs(va), Math.abs(vb))) continue;
    usedDuel.add(a.id).add(b.id);
    const answer = (metric === "colder" ? va < vb : va > vb) ? a.id : b.id;
    return { kind: "duel", metric, a, b, answer, question: d.question, unit: d.unit, value: (p) => d.value(p)! };
  }
  throw new Error("could not build a fair duel round");
}

export function makeGame(rand: () => number, rounds = 10): Round[] {
  const usedWorld = new Set<string>();
  const usedSites = new Set<string>();
  const usedDuel = new Set<string>();
  // Visit the reference regions in a shuffled order so analogue questions rotate through all four.
  const refs = [...REFERENCES].sort(() => rand() - 0.5);
  let r = 0;
  return Array.from({ length: rounds }, (_, i) => {
    if (i % 3 === 0) return worldRound(rand, usedWorld);
    if (i % 3 === 1) return analogueRound(rand, refs[r++ % refs.length], usedSites);
    return duelRound(rand, usedDuel);
  });
}

const RANKS_KM: Record<string, string> = {
  "Flight Director": "នាយកការហោះហើរ",
  "Mission Specialist": "អ្នកឯកទេសបេសកកម្ម",
  "Field Geologist": "អ្នកភូគព្ភវិទ្យាទីវាល",
  Cadet: "សិក្ខាកាម",
};

export function rankTitle(score: number, total: number, lang: "en" | "km" = "en"): string {
  const k = score / total;
  const en = k >= 0.9 ? "Flight Director" : k >= 0.7 ? "Mission Specialist" : k >= 0.4 ? "Field Geologist" : "Cadet";
  return lang === "km" ? RANKS_KM[en] : en;
}

/** A hint never gives the answer away: it removes one wrong option, or (head-to-head) reveals one of the two values. */
export type Hint = { kind: "remove"; id: string } | { kind: "reveal"; id: string };

export function hintFor(round: Round, rand: () => number = Math.random): Hint {
  if (round.kind === "duel") return { kind: "reveal", id: round.a.id };
  const ids = round.kind === "world" ? ["earth", "moon", "mars"] : round.options.map((o) => o.id);
  return { kind: "remove", id: pickOne(rand, ids.filter((id) => id !== round.answer)) };
}
