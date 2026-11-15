import { describe, expect, test } from "vitest";
import { makeGame, rankTitle, seeded, type Round } from "./challenge";
import { BALANCED } from "../data/presets";
import { aggregate, scoreAll } from "./scoring";

const of = <K extends Round["kind"]>(g: Round[], k: K) => g.filter((r): r is Extract<Round, { kind: K }> => r.kind === k);

describe("challenge rounds", () => {
  const game = makeGame(seeded(42), 10);

  test("a game mixes three kinds of question", () => {
    expect(game).toHaveLength(10);
    expect(of(game, "world").length).toBeGreaterThanOrEqual(3);
    expect(of(game, "analogue").length).toBeGreaterThanOrEqual(3);
    expect(of(game, "duel").length).toBeGreaterThanOrEqual(3);
  });

  test("no question repeats within a game, across many seeds", () => {
    for (let s = 1; s <= 200; s++) {
      const g = makeGame(seeded(s), 10);
      const worlds = of(g, "world").map((r) => r.place.id);
      expect(new Set(worlds).size, `seed ${s} world`).toBe(worlds.length);
      const options = of(g, "analogue").flatMap((r) => r.options.map((o) => o.id));
      expect(new Set(options).size, `seed ${s} analogue options`).toBe(options.length);
      const duels = of(g, "duel").map((r) => `${r.metric}:${r.a.id}:${r.b.id}`);
      expect(new Set(duels).size, `seed ${s} duel`).toBe(duels.length);
    }
  });

  test("world rounds use a place with terrain and the answer is its world", () => {
    for (const r of of(game, "world")) {
      expect(r.place.terrain).toBeDefined();
      expect(r.answer).toBe(r.place.body);
    }
  });

  test("analogue rounds: three distinct sites and the answer clearly has the highest index", () => {
    for (const r of of(game, "analogue")) {
      expect(new Set(r.options.map((o) => o.id)).size).toBe(3);
      const idx = r.options.map((o) => aggregate(scoreAll(r.ref, o), BALANCED).index!);
      expect(r.answer).toBe(r.options[idx.indexOf(Math.max(...idx))].id);
      const sorted = [...idx].sort((a, b) => b - a);
      expect(sorted[0] - sorted[1]).toBeGreaterThanOrEqual(3);
    }
  });

  test("duel answers are the place with the larger (or colder) measured value", () => {
    for (const r of of(game, "duel")) {
      const [va, vb] = [r.value(r.a), r.value(r.b)];
      const winner = r.metric === "colder" ? (va < vb ? r.a : r.b) : va > vb ? r.a : r.b;
      expect(r.answer).toBe(winner.id);
      expect(Math.abs(va - vb)).toBeGreaterThan(0);
    }
  });

  test("the same seed gives the same game", () => {
    const ids = (g: Round[]) => g.map((r) => (r.kind === "world" ? r.place.id : r.kind === "analogue" ? r.ref.id : r.a.id + r.b.id));
    expect(ids(makeGame(seeded(7), 6))).toEqual(ids(makeGame(seeded(7), 6)));
  });

  test("rank titles cover the whole score range", () => {
    expect(rankTitle(0, 10)).toBe("Cadet");
    expect(rankTitle(10, 10)).toBe("Flight Director");
  });
});

describe("hints", () => {
  test("every round has two clues in both languages that never name the answer", async () => {
    const { cluesFor } = await import("./challenge");
    const { local } = await import("../data/km");
    for (let s = 1; s <= 50; s++) {
      for (const r of makeGame(seeded(s), 10)) {
        const clues = cluesFor(r);
        expect(clues).toHaveLength(2);
        for (const c of clues) {
          expect(c.en.length).toBeGreaterThan(10);
          expect(c.km).toMatch(/[ក-៿]/);
          if (r.kind === "world") expect(c.en.toLowerCase()).not.toMatch(/(earth|moon|mars)/);
          if (r.kind === "analogue") expect(c.en).not.toContain(local(r.options.find((o) => o.id === r.answer)!, "en").name);
        }
        // Head-to-head: the first clue shows one measured value, the other place stays hidden.
        if (r.kind === "duel") expect(clues[0].en).not.toContain(local(r.b, "en").name);
      }
    }
  });

  test("the cross-out hint never strikes the right answer, and never on head-to-head rounds", async () => {
    const { strikeFor } = await import("./challenge");
    for (let s = 1; s <= 50; s++) {
      for (const r of makeGame(seeded(s), 10)) {
        const id = strikeFor(r, seeded(s));
        if (r.kind === "duel") expect(id).toBeNull();
        else expect(id).not.toBe(r.answer);
      }
    }
  });
});
