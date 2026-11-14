import { describe, expect, test } from "vitest";
import { makeGame, rankTitle, seeded } from "./challenge";
import { BALANCED } from "../data/presets";
import { aggregate, scoreAll } from "./scoring";

describe("challenge rounds", () => {
  const game = makeGame(seeded(42), 10);

  test("a game has the requested number of rounds and alternates the two kinds", () => {
    expect(game).toHaveLength(10);
    expect(game.filter((r) => r.kind === "world").length).toBe(5);
    expect(game.filter((r) => r.kind === "analogue").length).toBe(5);
  });

  test("world rounds use a place with terrain and the answer is its world", () => {
    for (const r of game) if (r.kind === "world") {
      expect(r.place.terrain).toBeDefined();
      expect(r.answer).toBe(r.place.body);
    }
  });

  test("analogue rounds offer three distinct Earth sites and the answer has the highest index", () => {
    for (const r of game) if (r.kind === "analogue") {
      expect(new Set(r.options.map((o) => o.id)).size).toBe(3);
      const idx = r.options.map((o) => aggregate(scoreAll(r.ref, o), BALANCED).index!);
      const best = r.options[idx.indexOf(Math.max(...idx))];
      expect(r.answer).toBe(best.id);
      // Fair question: the winner is clearly ahead of the runner-up.
      const sorted = [...idx].sort((a, b) => b - a);
      expect(sorted[0] - sorted[1]).toBeGreaterThanOrEqual(3);
    }
  });

  test("the same seed gives the same game", () => {
    const a = makeGame(seeded(7), 6).map((r) => (r.kind === "world" ? r.place.id : r.ref.id));
    const b = makeGame(seeded(7), 6).map((r) => (r.kind === "world" ? r.place.id : r.ref.id));
    expect(a).toEqual(b);
  });

  test("rank titles cover the whole score range", () => {
    expect(rankTitle(0, 10)).toBe("Cadet");
    expect(rankTitle(10, 10)).toBe("Flight Director");
  });
});
