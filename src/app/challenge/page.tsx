"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/components/AppState";
import { fmtCoord, useCountUp } from "@/components/Bits";
import { ReliefCanvas } from "@/components/ReliefCanvas";
import { sfx } from "@/lib/audio";
import { confetti } from "@/lib/fx";
import { makeGame, rankTitle, seeded, type Round } from "@/lib/challenge";
import type { Key } from "@/lib/i18n";
import type { Body } from "@/lib/types";

const ROUNDS = 10;
const BEST_KEY = "terratoria.challenge.best";
const WORLDS: Body[] = ["earth", "moon", "mars"];

const readBest = () => {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
};

function Score({ value }: { value: number }) {
  const shown = useCountUp(value, 500) ?? 0;
  return <span className="font-mono tabular-nums">{shown.toFixed(0)}</span>;
}

export default function ChallengePage() {
  const { t } = useApp();
  const [seed, setSeed] = useState<number | null>(null);
  const [game, setGame] = useState<Round[]>([]);
  const [i, setI] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [best, setBest] = useState(0);

  const start = useCallback(() => {
    const s = Math.floor(Math.random() * 1e9);
    setSeed(s);
    setGame(makeGame(seeded(s), ROUNDS));
    setI(0);
    setChoice(null);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
  }, []);

  useEffect(() => {
    setBest(readBest());
    start();
  }, [start]);

  const round = game[i];
  const done = game.length > 0 && i >= game.length;

  const answer = useCallback(
    (c: string, at?: { x: number; y: number }) => {
      if (!round || choice) return;
      setChoice(c);
      const right = c === round.answer;
      sfx(right ? "correct" : "wrong");
      if (right) confetti(at?.x ?? window.innerWidth / 2, at?.y ?? window.innerHeight / 2);
      setScore((s) => s + (right ? 1 : 0));
      setStreak((s) => {
        const n = right ? s + 1 : 0;
        setBestStreak((b) => Math.max(b, n));
        return n;
      });
    },
    [round, choice],
  );

  const next = useCallback(() => {
    setChoice(null);
    setI((x) => x + 1);
  }, []);

  useEffect(() => {
    if (!done) return;
    if (score > best) {
      setBest(score);
      try {
        window.localStorage.setItem(BEST_KEY, String(score));
      } catch {
        // best score simply not remembered
      }
    }
  }, [done, score, best]);

  // Keyboard: 1–3 to answer, Enter or → for the next round.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as Element).closest?.("input, select, textarea")) return;
      if (!round) return;
      const opts = round.kind === "world" ? WORLDS : round.kind === "duel" ? [round.a.id, round.b.id] : round.options.map((o) => o.id);
      const n = Number(e.key);
      if (!choice && n >= 1 && n <= opts.length) answer(opts[n - 1]);
      else if (choice && (e.key === "Enter" || e.key === "ArrowRight")) next();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [round, choice, answer, next]);

  if (seed === null) return <div className="card h-96 animate-pulse" />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Mission Challenge</p>
          <h1 className="text-3xl font-semibold tracking-tight">Can you read another world?</h1>
          <p className="text-sm text-muted">Ten rounds built from the same data as the rankings. Keys 1–3 answer, Enter continues.</p>
        </div>
        <dl className="flex gap-5 text-sm">
          <div>
            <dt className="label">Score</dt>
            <dd className="text-2xl">
              <Score value={score} />
              <span className="text-sm text-muted"> / {ROUNDS}</span>
            </dd>
          </div>
          <div>
            <dt className="label">Streak</dt>
            <dd className="font-mono text-2xl">{streak}</dd>
          </div>
          <div>
            <dt className="label">Best</dt>
            <dd className="font-mono text-2xl">{best}</dd>
          </div>
        </dl>
      </header>

      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--panel-2)]" role="progressbar" aria-valuemin={0} aria-valuemax={ROUNDS} aria-valuenow={Math.min(i, ROUNDS)} aria-label="Progress">
        <div className="bar-fill h-full rounded-full" style={{ width: `${(Math.min(i + (choice ? 1 : 0), ROUNDS) / ROUNDS) * 100}%`, animation: "none" }} />
      </div>

      {done ? (
        <section className="card page-enter p-8 text-center">
          <p className="label">Mission complete</p>
          <p className="mt-2 font-mono text-6xl">
            <Score value={score} />
            <span className="text-2xl text-muted">/{ROUNDS}</span>
          </p>
          <p className="mt-2 text-2xl font-semibold">{rankTitle(score, ROUNDS)}</p>
          <p className="mt-1 text-sm text-muted">Best streak {bestStreak}. Personal best {best}.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" className="btn btn-primary px-5 py-2.5 text-base" onClick={start}>
              Play again
            </button>
            <Link href="/explore/" className="btn px-5 py-2.5 text-base">
              {t("explore_3d")}
            </Link>
          </div>
        </section>
      ) : round?.kind === "world" ? (
        <section key={i} className="card page-enter grid gap-6 p-5 md:grid-cols-[minmax(0,360px)_1fr]">
          <div>
            <ReliefCanvas place={round.place} blind={!choice} />
          </div>
          <div className="flex flex-col">
            <p className="label">
              Round {i + 1} · Which world is this?
            </p>
            <p className="mt-1 text-sm text-muted">A 60 km patch of real elevation data, shaded the same way for every world. Look at the craters, slopes and how rough the ground is.</p>
            <div className="mt-4 grid gap-2">
              {WORLDS.map((w, k) => {
                const state = !choice ? "" : w === round.answer ? "border-[var(--ok)] ring-2 ring-[var(--ok)]" : w === choice ? "border-[var(--warn)] opacity-80" : "opacity-50";
                return (
                  <button key={w} type="button" disabled={!!choice} onClick={(e) => answer(w, { x: e.clientX, y: e.clientY })} className={`btn justify-between py-3 text-base ${state}`}>
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: `var(--${w})` }} aria-hidden="true" />
                      {t(w as Key)}
                    </span>
                    <span className="font-mono text-xs text-muted">{k + 1}</span>
                  </button>
                );
              })}
            </div>
            {choice && (
              <div className="page-enter mt-4 rounded-xl border border-line p-4 text-sm" role="status">
                <p className="text-base font-semibold">{choice === round.answer ? "Correct." : `Not quite: this is ${t(round.answer as Key)}.`}</p>
                <p className="mt-1">
                  <strong>{round.place.name}</strong> <span className="text-muted">({fmtCoord(round.place)})</span>
                </p>
                <p className="mt-1 text-muted">
                  Median slope {round.place.terrain!.slopeMedianDeg.toFixed(1)}°, relief {round.place.terrain!.reliefM} m, roughness {round.place.terrain!.roughnessM.toFixed(0)} m.
                </p>
                <button type="button" className="btn btn-primary mt-3" onClick={next}>
                  Next round →
                </button>
              </div>
            )}
          </div>
        </section>
      ) : round?.kind === "duel" ? (
        <section key={i} className="card page-enter space-y-4 p-5">
          <div>
            <p className="label">Round {i + 1} · Head to head</p>
            <h2 className="mt-1 text-xl font-semibold">{round.question}</h2>
            <p className="text-sm text-muted">Measured from mission elevation and temperature data, not guessed.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[round.a, round.b].map((p, k) => {
              const right = p.id === round.answer;
              const state = !choice ? "" : right ? "border-[var(--ok)] ring-2 ring-[var(--ok)]" : p.id === choice ? "border-[var(--warn)]" : "opacity-60";
              return (
                <button key={p.id} type="button" disabled={!!choice} onClick={(e) => answer(p.id, { x: e.clientX, y: e.clientY })} className={`card card-hover p-5 text-left disabled:cursor-default ${state}`}>
                  <span className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-2 text-lg font-semibold">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: `var(--${p.body})` }} aria-hidden="true" />
                      {p.name}
                    </span>
                    <span className="font-mono text-xs text-muted">{k + 1}</span>
                  </span>
                  <span className="block text-xs text-muted">
                    {t(p.body as Key)} · {p.country ?? p.category}
                  </span>
                  {choice && (
                    <span className="mt-3 block font-mono text-2xl">
                      {round.value(p).toFixed(round.metric === "steeper" || round.metric === "rougher" ? 1 : 0)}
                      <span className="ml-1 text-xs text-muted">{round.unit}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {choice && (
            <div className="page-enter flex flex-wrap items-center justify-between gap-3" role="status">
              <p className="font-semibold">{choice === round.answer ? "Correct!" : "Not quite."} The numbers come straight from the Terratoria data pipeline.</p>
              <button type="button" className="btn btn-primary" onClick={next}>
                Next round →
              </button>
            </div>
          )}
        </section>
      ) : round ? (
        <section key={i} className="card page-enter space-y-4 p-5">
          <div>
            <p className="label">
              Round {i + 1} · Pick the best analogue
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              Which Earth site is most like {round.ref.name} ({t(round.ref.body as Key)})?
            </h2>
            <p className="text-sm text-muted">{round.ref.summary}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {round.options.map((o, k) => {
              const right = o.id === round.answer;
              const state = !choice ? "" : right ? "border-[var(--ok)] ring-2 ring-[var(--ok)]" : o.id === choice ? "border-[var(--warn)]" : "opacity-60";
              return (
                <button key={o.id} type="button" disabled={!!choice} onClick={(e) => answer(o.id, { x: e.clientX, y: e.clientY })} className={`card card-hover p-4 text-left disabled:cursor-default ${state}`}>
                  <span className="flex items-start justify-between gap-2">
                    <span className="font-semibold">{o.name}</span>
                    <span className="font-mono text-xs text-muted">{k + 1}</span>
                  </span>
                  <span className="block text-xs text-muted">
                    {o.country} · {o.category}
                  </span>
                  {choice && (
                    <span className="mt-3 block">
                      <span className="flex items-baseline justify-between text-sm">
                        <span className="text-muted">Similarity index</span>
                        <span className="text-lg">
                          <Score value={round.scores[k]} />
                        </span>
                      </span>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded bg-[var(--panel-2)]">
                        <span className="bar-fill block h-full rounded" style={{ width: `${round.scores[k]}%` }} />
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {choice && (
            <div className="page-enter flex flex-wrap items-center justify-between gap-3" role="status">
              <p className="font-semibold">{choice === round.answer ? "Correct." : "Not quite."} Scores use balanced weights across all eight dimensions.</p>
              <div className="flex gap-2">
                <Link className="btn" href={`/site/?id=${round.answer}&ref=${round.ref.id}`}>
                  Why? Open the evidence
                </Link>
                <button type="button" className="btn btn-primary" onClick={next}>
                  Next round →
                </button>
              </div>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
