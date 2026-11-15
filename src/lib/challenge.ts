// Mission Challenge: quiz rounds generated from the real catalogue, measurements and scores.
// Within one game no place, Earth site option or head-to-head pairing is used twice.
import { EARTH_SITES, PLACES, REFERENCES } from "../data/catalog";
import { BALANCED } from "../data/presets";
import { aggregate, scoreAll } from "./scoring";
import { local, tagLabel } from "../data/km";
import { DIMENSION_LABEL, type Lang } from "./i18n";
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

/**
 * Two clues per round, gentle first. Neither names the answer: they point at it through the data
 * (temperature, geology, the best-matching dimension, a measured value, latitude or type of place).
 */
export function cluesFor(round: Round): [Text, Text] {
  const both = (f: (lang: Lang) => string): Text => ({ en: f("en"), km: f("km") });
  const num = (n: number, lang: Lang) => (lang === "km" ? toKmDigits(String(n)) : String(n));

  if (round.kind === "world") {
    const p = round.place;
    const tags = [...(p.attributes.geology?.tags ?? []), ...(p.attributes.thermal?.tags ?? [])].slice(0, 3);
    const temp = p.climate?.meanK;
    const first =
      temp !== undefined
        ? both((l) => (l === "km" ? `សីតុណ្ហភាពផ្ទៃជាមធ្យមនៅទីនេះប្រហែល ${num(Math.round(temp - 273.15), l)} °C។` : `The average surface temperature here is about ${Math.round(temp - 273.15)} °C.`))
        : both((l) => (l === "km" ? `ជម្រាលមធ្យមនៃដីនេះគឺ ${num(+p.terrain!.slopeMedianDeg.toFixed(1), l)}°។` : `The ground here has a median slope of ${p.terrain!.slopeMedianDeg.toFixed(1)}°.`));
    const second = both((l) => {
      const list = tags.map((t) => tagLabel(t, l)).join(l === "km" ? " និង " : ", ");
      return l === "km" ? `អ្នកវិទ្យាសាស្ត្របានកត់ត្រាលក្ខណៈទាំងនេះនៅទីនេះ៖ ${list}។` : `Scientists have documented these features here: ${list}.`;
    });
    return [first, second];
  }

  if (round.kind === "analogue") {
    const best = round.options.find((o) => o.id === round.answer)!;
    const top = scoreAll(round.ref, best)
      .filter((d) => d.score !== null)
      .sort((x, y) => (y.score ?? 0) - (x.score ?? 0))[0];
    const first = both((l) =>
      l === "km"
        ? `ទីតាំងដែលត្រូវគ្នាបំផុត ស្រដៀងខ្លាំងបំផុតក្នុងផ្នែក «${DIMENSION_LABEL.km[top.id]}»។`
        : `The best match is most alike in "${DIMENSION_LABEL.en[top.id].toLowerCase()}".`,
    );
    const second = both((l) =>
      best.lat >= 0
        ? l === "km" ? "វាស្ថិតនៅអឌ្ឍគោលខាងជើង។" : "It lies in the northern hemisphere."
        : l === "km" ? "វាស្ថិតនៅអឌ្ឍគោលខាងត្បូង។" : "It lies in the southern hemisphere.",
    );
    return [first, second];
  }

  const { a, metric } = round;
  const win = round.answer === a.id ? a : round.b;
  const digits = metric === "steeper" || metric === "rougher" ? 1 : 0;
  const first = both((l) => `${local(a, l).name}: ${num(+round.value(a).toFixed(digits), l)} ${round.unit[l]}`);
  const traits = (win.attributes.geology?.tags ?? []).slice(0, 3);
  const second =
    metric === "colder" || traits.length === 0
      ? both((l) => {
          const deg = Math.round(Math.abs(win.lat));
          return l === "km" ? `ចម្លើយស្ថិតនៅប្រហែល ${num(deg, l)}° ពីខ្សែអេក្វាទ័រ។` : `The answer lies about ${deg}° from the equator.`;
        })
      : both((l) => {
          const list = traits.map((t) => tagLabel(t, l)).join(l === "km" ? " និង " : ", ");
          return l === "km" ? `ដីរបស់ចម្លើយមាន៖ ${list}។` : `The answer's ground has: ${list}.`;
        });
  return [first, second];
}

const toKmDigits = (s: string) => s.replace(/[0-9]/g, (d) => "០១២៣៤៥៦៧៨៩"[+d]);

/**
 * Hints per round. Three-option rounds: 1 a clue, 2 crosses out a wrong option, 3 reveals the answer for
 * no point. Head-to-head rounds have only two options, so: 1 a clue, 2 reveals the answer for no point.
 */
export const hintCount = (round: Round) => (round.kind === "duel" ? 2 : 3);

/** The wrong option the second hint crosses out. Head-to-head rounds have only two options, so none. */
export function strikeFor(round: Round, rand: () => number = Math.random): string | null {
  if (round.kind === "duel") return null;
  const ids = round.kind === "world" ? ["earth", "moon", "mars"] : round.options.map((o) => o.id);
  return pickOne(rand, ids.filter((id) => id !== round.answer));
}
