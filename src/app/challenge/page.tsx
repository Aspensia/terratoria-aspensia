"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useApp } from "@/components/AppState";
import { fmtCoord, useCountUp } from "@/components/Bits";
import { ReliefCanvas } from "@/components/ReliefCanvas";
import { sfx } from "@/lib/audio";
import { confetti } from "@/lib/fx";
import { hintFor, makeGame, rankTitle, seeded, type Hint, type Round } from "@/lib/challenge";
import { GRAVITY, START, THRUST, THRUST_RANGE, landingScore, step, verdict, type Lander, type LanderWorld } from "@/lib/lander";
import { local } from "@/data/km";
import type { Key } from "@/lib/i18n";
import type { Body } from "@/lib/types";

const ROUNDS = 10;
const RUSH_SECONDS = 60;
const WORLDS: Body[] = ["earth", "moon", "mars"];

const readNum = (key: string) => {
  try {
    return Number(window.localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
};
const writeNum = (key: string, n: number) => {
  try {
    window.localStorage.setItem(key, String(n));
  } catch {
    // best score simply not remembered
  }
};

function Score({ value }: { value: number }) {
  const shown = useCountUp(value, 500) ?? 0;
  return <span className="font-mono tabular-nums">{shown.toFixed(0)}</span>;
}

const optionIds = (r: Round) => (r.kind === "world" ? WORLDS : r.kind === "duel" ? [r.a.id, r.b.id] : r.options.map((o) => o.id));

function HintButton({ used, disabled, onHint, cost }: { used: boolean; disabled: boolean; onHint(): void; cost?: string }) {
  const { tx } = useApp();
  return (
    <button type="button" className="btn hint-btn" disabled={used || disabled} onClick={onHint} aria-label={tx("Hint: remove one wrong answer or reveal a value", "តម្រុយ៖ ដកចម្លើយខុសមួយចេញ ឬបង្ហាញតម្លៃមួយ")}>
      <span aria-hidden="true">💡</span> {used ? tx("Hint used", "បានប្រើតម្រុយ") : tx("Hint", "តម្រុយ")}
      {cost && !used && <span className="text-xs text-muted">{cost}</span>}
    </button>
  );
}

/** One question. Shared by the 10-round quiz and the 60-second rush. Keys 1–3 answer. */
function RoundView({ round, n, choice, hint, onAnswer, after }: { round: Round; n: number; choice: string | null; hint: Hint | null; onAnswer(c: string, at?: { x: number; y: number }): void; after?: ReactNode }) {
  const { t, tx, lang } = useApp();
  const gone = (id: string) => hint?.kind === "remove" && hint.id === id && !choice;

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as Element).closest?.("input, select, textarea")) return;
      const opts = optionIds(round);
      const k = Number(e.key);
      if (!choice && k >= 1 && k <= opts.length && !gone(opts[k - 1])) onAnswer(opts[k - 1]);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const mark = (id: string, right: boolean) => (!choice ? "" : right ? "border-[var(--ok)] ring-2 ring-[var(--ok)]" : id === choice ? "border-[var(--warn)] opacity-80" : "opacity-50");

  if (round.kind === "world")
    return (
      <section key={n} className="card page-enter grid gap-6 p-5 md:grid-cols-[minmax(0,360px)_1fr]">
        <div>
          <ReliefCanvas place={round.place} blind={!choice} />
        </div>
        <div className="flex flex-col">
          <p className="label">{tx(`Round ${n} · Which world is this?`, `ជុំទី ${n} · តើនេះជាពិភពណា?`)}</p>
          <p className="mt-1 text-sm text-muted">{tx("A 60 km patch of real elevation data, shaded the same way for every world. Look at the craters, slopes and how rough the ground is.", "ផ្ទៃដី ៦០ គ.ម. ពីទិន្នន័យកម្ពស់ពិតប្រាកដ ដែលដាក់ស្រមោលដូចគ្នាសម្រាប់គ្រប់ពិភព។ សូមមើលរណ្តៅ ជម្រាល និងភាពរដិបរដុបនៃដី។")}</p>
          <div className="mt-4 grid gap-2">
            {WORLDS.map((w, k) => (
              <button key={w} type="button" disabled={!!choice || gone(w)} onClick={(e) => onAnswer(w, { x: e.clientX, y: e.clientY })} className={`btn justify-between py-3 text-base ${mark(w, w === round.answer)} ${gone(w) ? "is-struck" : ""}`}>
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: `var(--${w})` }} aria-hidden="true" />
                  {t(w as Key)}
                </span>
                <span className="font-mono text-xs text-muted">{k + 1}</span>
              </button>
            ))}
          </div>
          {choice && (
            <div className="page-enter mt-4 rounded-xl border border-line p-4 text-sm" role="status">
              <p className="text-base font-semibold">{choice === round.answer ? tx("Correct!", "ត្រឹមត្រូវ!") : tx(`Not quite: this is ${t(round.answer as Key)}.`, `មិនទាន់ត្រូវទេ៖ នេះគឺ${t(round.answer as Key)}។`)}</p>
              <p className="mt-1">
                <strong>{local(round.place, lang).name}</strong> <span className="text-muted">({fmtCoord(round.place)})</span>
              </p>
              <p className="mt-1 text-muted">
                {tx(
                  `Median slope ${round.place.terrain!.slopeMedianDeg.toFixed(1)}°, relief ${round.place.terrain!.reliefM} m, roughness ${round.place.terrain!.roughnessM.toFixed(0)} m.`,
                  `ជម្រាលមធ្យម ${round.place.terrain!.slopeMedianDeg.toFixed(1)}° កម្ពស់ខុសគ្នា ${round.place.terrain!.reliefM} ម. ភាពរដិបរដុប ${round.place.terrain!.roughnessM.toFixed(0)} ម.។`,
                )}
              </p>
              {after}
            </div>
          )}
        </div>
      </section>
    );

  if (round.kind === "duel")
    return (
      <section key={n} className="card page-enter space-y-4 p-5">
        <div>
          <p className="label">{tx(`Round ${n} · Head to head`, `ជុំទី ${n} · ប្រកួតមួយទល់មួយ`)}</p>
          <h2 className="mt-1 text-xl font-semibold">{round.question[lang]}</h2>
          <p className="text-sm text-muted">{tx("Measured from mission elevation and temperature data, not guessed.", "វាស់ពីទិន្នន័យកម្ពស់ និងសីតុណ្ហភាពរបស់បេសកកម្ម មិនមែនទាយទេ។")}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[round.a, round.b].map((p, k) => (
            <button key={p.id} type="button" disabled={!!choice} onClick={(e) => onAnswer(p.id, { x: e.clientX, y: e.clientY })} className={`card card-hover p-5 text-left disabled:cursor-default ${mark(p.id, p.id === round.answer)}`}>
              <span className="flex items-start justify-between gap-2">
                <span className="flex items-center gap-2 text-lg font-semibold">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: `var(--${p.body})` }} aria-hidden="true" />
                  {local(p, lang).name}
                </span>
                <span className="font-mono text-xs text-muted">{k + 1}</span>
              </span>
              <span className="block text-xs text-muted">
                {t(p.body as Key)} · {local(p, lang).country ?? local(p, lang).category}
              </span>
              {(choice || (hint?.kind === "reveal" && hint.id === p.id)) && (
                <span className="mt-3 block font-mono text-2xl">
                  {round.value(p).toFixed(round.metric === "steeper" || round.metric === "rougher" ? 1 : 0)}
                  <span className="ml-1 text-xs text-muted">{round.unit[lang]}</span>
                </span>
              )}
            </button>
          ))}
        </div>
        {choice && (
          <div className="page-enter flex flex-wrap items-center justify-between gap-3" role="status">
            <p className="font-semibold">
              {choice === round.answer ? tx("Correct!", "ត្រឹមត្រូវ!") : tx("Not quite.", "មិនទាន់ត្រូវទេ។")} {tx("The numbers come straight from the Terratoria data pipeline.", "តួលេខទាំងនេះមកពីប្រព័ន្ធដំណើរការទិន្នន័យរបស់ Terratoria ផ្ទាល់។")}
            </p>
            {after}
          </div>
        )}
      </section>
    );

  return (
    <section key={n} className="card page-enter space-y-4 p-5">
      <div>
        <p className="label">{tx(`Round ${n} · Pick the best analogue`, `ជុំទី ${n} · ជ្រើសរើសទីតាំងស្រដៀងល្អបំផុត`)}</p>
        <h2 className="mt-1 text-xl font-semibold">
          {tx(`Which Earth site is most like ${round.ref.name} (${t(round.ref.body as Key)})?`, `តើទីតាំងផែនដីមួយណាស្រដៀងនឹង ${local(round.ref, lang).name} (${t(round.ref.body as Key)}) ជាងគេ?`)}
        </h2>
        <p className="text-sm text-muted">{local(round.ref, lang).summary}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {round.options.map((o, k) => (
          <button key={o.id} type="button" disabled={!!choice || gone(o.id)} onClick={(e) => onAnswer(o.id, { x: e.clientX, y: e.clientY })} className={`card card-hover p-4 text-left disabled:cursor-default ${mark(o.id, o.id === round.answer)} ${gone(o.id) ? "is-struck" : ""}`}>
            <span className="flex items-start justify-between gap-2">
              <span className="font-semibold">{local(o, lang).name}</span>
              <span className="font-mono text-xs text-muted">{k + 1}</span>
            </span>
            <span className="block text-xs text-muted">
              {local(o, lang).country} · {local(o, lang).category}
            </span>
            {choice && (
              <span className="mt-3 block">
                <span className="flex items-baseline justify-between text-sm">
                  <span className="text-muted">{t("index_short")}</span>
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
        ))}
      </div>
      {choice && (
        <div className="page-enter flex flex-wrap items-center justify-between gap-3" role="status">
          <p className="font-semibold">
            {choice === round.answer ? tx("Correct!", "ត្រឹមត្រូវ!") : tx("Not quite.", "មិនទាន់ត្រូវទេ។")} {tx("Scores use balanced weights across all eight dimensions.", "ពិន្ទុប្រើទម្ងន់ស្មើគ្នាលើវិមាត្រទាំងប្រាំបី។")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link className="btn" href={`/site/?id=${round.answer}&ref=${round.ref.id}`}>
              {tx("Why? Open the evidence", "ហេតុអ្វី? បើកភស្តុតាង")}
            </Link>
            {after}
          </div>
        </div>
      )}
    </section>
  );
}

/** The original 10-round quiz, now with one hint per round. */
function Quiz() {
  const { t, tx, lang } = useApp();
  const [game, setGame] = useState<Round[]>([]);
  const [i, setI] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [hint, setHint] = useState<Hint | null>(null);
  const [hints, setHints] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [best, setBest] = useState(0);

  const start = useCallback(() => {
    setGame(makeGame(seeded(Math.floor(Math.random() * 1e9)), ROUNDS));
    setI(0);
    setChoice(null);
    setHint(null);
    setHints(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
  }, []);

  useEffect(() => {
    setBest(readNum("terratoria.challenge.best"));
    start();
  }, [start]);

  const round = game[i];
  const done = game.length > 0 && i >= game.length;

  const answer = (c: string, at?: { x: number; y: number }) => {
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
  };
  const next = useCallback(() => {
    setChoice(null);
    setHint(null);
    setI((x) => x + 1);
  }, []);

  useEffect(() => {
    if (!choice) return;
    const key = (e: KeyboardEvent) => (e.key === "Enter" || e.key === "ArrowRight") && next();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [choice, next]);

  useEffect(() => {
    if (done && score > best) {
      setBest(score);
      writeNum("terratoria.challenge.best", score);
    }
  }, [done, score, best]);

  if (!game.length) return <div className="card h-96 animate-pulse" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm text-muted">{tx("Ten rounds built from the same data as the rankings. Keys 1–3 answer, Enter continues. Stuck? Use a hint.", "ដប់ជុំ ដែលបង្កើតពីទិន្នន័យដូចគ្នានឹងចំណាត់ថ្នាក់។ ចុចលេខ ១–៣ ដើម្បីឆ្លើយ ហើយចុច Enter ដើម្បីបន្ត។ ជាប់គាំងមែនទេ? ប្រើតម្រុយ។")}</p>
        <dl className="flex gap-5 text-sm">
          <div>
            <dt className="label">{tx("Score", "ពិន្ទុ")}</dt>
            <dd className="text-2xl">
              <Score value={score} />
              <span className="text-sm text-muted"> / {ROUNDS}</span>
            </dd>
          </div>
          <div>
            <dt className="label">{tx("Streak", "ត្រូវជាប់ៗគ្នា")}</dt>
            <dd className="font-mono text-2xl">{streak}</dd>
          </div>
          <div>
            <dt className="label">{tx("Best", "ល្អបំផុត")}</dt>
            <dd className="font-mono text-2xl">{best}</dd>
          </div>
        </dl>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--panel-2)]" role="progressbar" aria-valuemin={0} aria-valuemax={ROUNDS} aria-valuenow={Math.min(i, ROUNDS)} aria-label={tx("Progress", "វឌ្ឍនភាព")}>
        <div className="bar-fill h-full rounded-full" style={{ width: `${(Math.min(i + (choice ? 1 : 0), ROUNDS) / ROUNDS) * 100}%`, animation: "none" }} />
      </div>

      {done ? (
        <section className="card page-enter p-8 text-center">
          <p className="label">{tx("Mission complete", "បេសកកម្មបានបញ្ចប់")}</p>
          <p className="mt-2 font-mono text-6xl">
            <Score value={score} />
            <span className="text-2xl text-muted">/{ROUNDS}</span>
          </p>
          <p className="mt-2 text-2xl font-semibold">{rankTitle(score, ROUNDS, lang)}</p>
          <p className="mt-1 text-sm text-muted">{tx(`Best streak ${bestStreak}. Hints used ${hints}. Personal best ${best}.`, `ត្រូវជាប់ៗគ្នាច្រើនបំផុត ${bestStreak}។ តម្រុយដែលបានប្រើ ${hints}។ ពិន្ទុល្អបំផុតផ្ទាល់ខ្លួន ${best}។`)}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" className="btn btn-primary px-5 py-2.5 text-base" onClick={start}>
              {tx("Play again", "លេងម្តងទៀត")}
            </button>
            <Link href="/explore/" className="btn px-5 py-2.5 text-base">
              {t("explore_3d")}
            </Link>
          </div>
        </section>
      ) : (
        round && (
          <>
            <RoundView
              round={round}
              n={i + 1}
              choice={choice}
              hint={hint}
              onAnswer={answer}
              after={
                <button type="button" className="btn btn-primary mt-3" onClick={next}>
                  {tx("Next round →", "ជុំបន្ទាប់ →")}
                </button>
              }
            />
            <div className="flex justify-end">
              <HintButton
                used={!!hint}
                disabled={!!choice}
                onHint={() => {
                  setHint(hintFor(round));
                  setHints((h) => h + 1);
                  sfx("open");
                }}
              />
            </div>
          </>
        )
      )}
    </div>
  );
}

/** Rush: as many questions as you can in 60 seconds. Wrong answers and hints cost time. */
function Rush() {
  const { tx } = useApp();
  const [state, setState] = useState<"ready" | "running" | "over">("ready");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [i, setI] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [hint, setHint] = useState<Hint | null>(null);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(RUSH_SECONDS);
  const [best, setBest] = useState(0);
  const end = useRef(0);

  useEffect(() => setBest(readNum("terratoria.rush.best")), []);

  const fresh = () => makeGame(seeded(Math.floor(Math.random() * 1e9)), ROUNDS);
  const go = () => {
    setRounds(fresh());
    setI(0);
    setChoice(null);
    setHint(null);
    setScore(0);
    end.current = performance.now() + RUSH_SECONDS * 1000;
    setLeft(RUSH_SECONDS);
    setState("running");
  };

  useEffect(() => {
    if (state !== "running") return;
    const id = setInterval(() => {
      const s = Math.max(0, (end.current - performance.now()) / 1000);
      setLeft(s);
      if (s <= 0) setState("over");
    }, 100);
    return () => clearInterval(id);
  }, [state]);

  useEffect(() => {
    if (state === "over" && score > best) {
      setBest(score);
      writeNum("terratoria.rush.best", score);
    }
  }, [state, score, best]);

  // Top up with a fresh batch before the questions run out.
  useEffect(() => {
    if (state === "running" && rounds.length && i >= rounds.length - 2) setRounds((r) => [...r, ...fresh()]);
  }, [state, i, rounds.length]);

  const round = rounds[i];
  const answer = (c: string, at?: { x: number; y: number }) => {
    if (!round || choice || state !== "running") return;
    setChoice(c);
    const right = c === round.answer;
    sfx(right ? "correct" : "wrong");
    if (right) {
      setScore((s) => s + 1);
      confetti(at?.x ?? window.innerWidth / 2, at?.y ?? window.innerHeight / 2);
    } else end.current -= 3000;
    // Short look at the answer, then straight on.
    setTimeout(() => {
      setChoice(null);
      setHint(null);
      setI((x) => x + 1);
    }, right ? 650 : 1300);
  };

  if (state === "ready" || state === "over")
    return (
      <section className="card page-enter p-8 text-center">
        <p className="label">{state === "over" ? tx("Time!", "អស់ម៉ោង!") : tx("Rush · 60 seconds", "ប្រញាប់ · ៦០ វិនាទី")}</p>
        {state === "over" ? (
          <>
            <p className="mt-2 font-mono text-6xl">
              <Score value={score} />
            </p>
            <p className="mt-1 text-sm text-muted">{tx(`correct answers · personal best ${best}`, `ចម្លើយត្រឹមត្រូវ · ពិន្ទុល្អបំផុតផ្ទាល់ខ្លួន ${best}`)}</p>
          </>
        ) : (
          <p className="mx-auto mt-3 max-w-md text-muted">{tx("Answer as many questions as you can before the clock runs out. A wrong answer costs 3 seconds, a hint costs 5.", "ឆ្លើយសំណួរឱ្យបានច្រើនតាមដែលអាចធ្វើបាន មុនពេលអស់ម៉ោង។ ចម្លើយខុសម្តង ដក ៣ វិនាទី ហើយតម្រុយម្តង ដក ៥ វិនាទី។")}</p>
        )}
        <button type="button" className="btn btn-primary mt-6 px-5 py-2.5 text-base" onClick={go}>
          {state === "over" ? tx("Run it again", "លេងម្តងទៀត") : tx("Start the clock", "ចាប់ផ្តើមម៉ោង")}
        </button>
      </section>
    );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <p className={`font-mono text-4xl tabular-nums ${left < 10 ? "text-[var(--warn)]" : ""}`} aria-label={tx("Seconds left", "វិនាទីដែលនៅសល់")}>
          {left.toFixed(1)}s
        </p>
        <p className="text-sm">
          <span className="label">{tx("Correct", "ត្រឹមត្រូវ")}</span> <span className="font-mono text-2xl">{score}</span>
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--panel-2)]" aria-hidden="true">
        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${(left / RUSH_SECONDS) * 100}%`, transition: "width 0.1s linear" }} />
      </div>
      {round && <RoundView round={round} n={i + 1} choice={choice} hint={hint} onAnswer={answer} />}
      <div className="flex justify-end">
        <HintButton
          used={!!hint}
          disabled={!!choice}
          cost="−5s"
          onHint={() => {
            setHint(hintFor(round));
            end.current -= 5000;
            sfx("open");
          }}
        />
      </div>
    </div>
  );
}

const LANDER_FACT: Record<LanderWorld, [string, string]> = {
  moon: ["No air on the Moon: Apollo landers used rockets all the way down.", "ព្រះច័ន្ទគ្មានខ្យល់៖ យាន Apollo ប្រើរ៉ុក្កែតរហូតដល់ដី។"],
  mars: ["Real Mars landers first slow down with a heat shield and a parachute, then fire rockets for the last stretch.", "យានចុះចតលើភពអង្គារពិតប្រាកដ បន្ថយល្បឿនដោយខែលកម្តៅ និងឆ័ត្រយោងជាមុនសិន ទើបបាញ់រ៉ុក្កែតនៅចុងក្រោយ។"],
  earth: ["Earth's gravity is six times the Moon's: the same engine barely beats it.", "ទំនាញផែនដីខ្លាំងជាងព្រះច័ន្ទប្រាំមួយដង៖ ម៉ាស៊ីនដដែលស្ទើរតែមិនអាចឈ្នះវាបាន។"],
};

const SKY: Record<LanderWorld, [string, string]> = { moon: ["#000000", "#05070b"], mars: ["#3b2418", "#c98a5a"], earth: ["#0b2a55", "#7fb6e6"] };
const GROUND: Record<LanderWorld, string> = { moon: "#8d8d8d", mars: "#a4532e", earth: "#4c6b3a" };

/** Touchdown: land softly. Same lander and engine everywhere, only gravity changes. */
function Touchdown() {
  const { t, tx, lang } = useApp();
  const [world, setWorld] = useState<LanderWorld>("moon");
  const [power, setPower] = useState(THRUST);
  const [phase, setPhase] = useState<"ready" | "flying" | "landed">("ready");
  const [hud, setHud] = useState<Lander>(START);
  const [best, setBest] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const thrust = useRef(false);
  const sim = useRef<Lander>(START);

  useEffect(() => setBest(readNum(`terratoria.landing.${world}`)), [world]);

  // Draw the scene: sky, ground, lander and, while firing, a flickering flame.
  const draw = useCallback(
    (s: Lander, firing: boolean) => {
      const c = canvas.current;
      const x = c?.getContext("2d");
      if (!c || !x) return;
      const W = c.width, H = c.height, ground = H - 40, k = (ground - 50) / START.alt;
      const sky = x.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, SKY[world][0]);
      sky.addColorStop(1, SKY[world][1]);
      x.fillStyle = sky;
      x.fillRect(0, 0, W, H);
      if (world !== "earth") {
        x.fillStyle = "rgba(255,255,255,0.7)";
        for (let i = 0; i < 40; i++) x.fillRect((i * 97) % W, (i * 53) % (ground - 60), 1.2, 1.2);
      }
      x.fillStyle = GROUND[world];
      x.beginPath();
      x.moveTo(0, ground);
      for (let i = 0; i <= 20; i++) x.lineTo((i / 20) * W, ground - (i === 9 || i === 10 || i === 11 ? 0 : 6 + ((i * 37) % 14)));
      x.lineTo(W, H);
      x.lineTo(0, H);
      x.fill();
      x.fillStyle = "rgba(255,255,255,0.55)";
      x.fillRect(W / 2 - 34, ground - 2, 68, 3); // landing pad
      const ly = ground - s.alt * k, lx = W / 2;
      if (firing && s.fuel > 0) {
        const f = 14 + Math.random() * 12;
        const fl = x.createLinearGradient(lx, ly, lx, ly + f);
        fl.addColorStop(0, "#fff6c8");
        fl.addColorStop(0.4, "#ff9b3d");
        fl.addColorStop(1, "rgba(255,59,48,0)");
        x.fillStyle = fl;
        x.beginPath();
        x.moveTo(lx - 6, ly);
        x.lineTo(lx, ly + f);
        x.lineTo(lx + 6, ly);
        x.fill();
      }
      x.fillStyle = "#e9ecf1";
      x.fillRect(lx - 11, ly - 22, 22, 15); // descent stage
      x.fillStyle = "#c9a227";
      x.fillRect(lx - 9, ly - 8, 18, 6); // foil wrap
      x.strokeStyle = "#e9ecf1";
      x.lineWidth = 2;
      x.beginPath();
      x.moveTo(lx - 9, ly - 4);
      x.lineTo(lx - 15, ly);
      x.moveTo(lx + 9, ly - 4);
      x.lineTo(lx + 15, ly);
      x.stroke();
      x.fillStyle = "#3d7bff";
      x.fillRect(lx - 4, ly - 19, 8, 5); // window
    },
    [world],
  );

  useEffect(() => draw(START, false), [draw]);

  useEffect(() => {
    if (phase !== "flying") return;
    let frame = 0, last = performance.now(), tick = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      sim.current = step(sim.current, GRAVITY[world], thrust.current, dt, power);
      draw(sim.current, thrust.current);
      if (++tick % 4 === 0) setHud(sim.current);
      if (sim.current.alt <= 0) {
        setHud(sim.current);
        setPhase("landed");
        const v = verdict(sim.current.v);
        sfx(v === "crash" ? "wrong" : "correct");
        const pts = landingScore(sim.current.v, sim.current.fuel);
        if (v !== "crash") confetti(window.innerWidth / 2, window.innerHeight / 2);
        if (pts > readNum(`terratoria.landing.${world}`)) {
          writeNum(`terratoria.landing.${world}`, pts);
          setBest(pts);
        }
        return;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    const key = (e: KeyboardEvent, on: boolean) => {
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
        e.preventDefault();
        thrust.current = on;
      }
    };
    const kd = (e: KeyboardEvent) => key(e, true), ku = (e: KeyboardEvent) => key(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, [phase, world, draw, power]);

  const launch = () => {
    sim.current = START;
    thrust.current = false;
    setHud(START);
    setPhase("flying");
  };
  const v = verdict(hud.v);
  const hold = { onPointerDown: () => (thrust.current = true), onPointerUp: () => (thrust.current = false), onPointerLeave: () => (thrust.current = false), onPointerCancel: () => (thrust.current = false) };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted">{tx("Land on the pad at 2.5 m/s or slower. Hold Space, the up arrow or the Thrust button to fire the engine. Same lander everywhere: only gravity changes.", "ចុះចតលើវេទិកាក្នុងល្បឿន ២.៥ ម៉ែត្រ/វិនាទី ឬយឺតជាងនេះ។ សង្កត់ Space ព្រួញឡើងលើ ឬប៊ូតុង Thrust ដើម្បីបាញ់ម៉ាស៊ីន។ យានដូចគ្នាគ្រប់ទីកន្លែង មានតែទំនាញទេដែលខុសគ្នា។")}</p>
        <div role="group" aria-label={tx("World", "ពិភព")} className="flex gap-1">
          {(Object.keys(GRAVITY) as LanderWorld[]).map((w) => (
            <button key={w} type="button" className="btn" aria-pressed={world === w} disabled={phase === "flying"} onClick={() => (setWorld(w), setPhase("ready"))}>
              {t(w as Key)} <span className="font-mono text-xs text-muted">{GRAVITY[w]} m/s²</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <label htmlFor="thrust" className="font-semibold">
          {tx("Engine thrust", "កម្លាំងរុញម៉ាស៊ីន")}
        </label>
        <input id="thrust" type="range" min={THRUST_RANGE[0]} max={THRUST_RANGE[1]} step={0.5} value={power} disabled={phase === "flying"} onChange={(e) => setPower(Number(e.target.value))} className="w-48" />
        <span className="font-mono tabular-nums">{power.toFixed(1)} m/s²</span>
        {power <= GRAVITY[world] ? (
          <span className="text-[var(--warn)]">{tx("Weaker than this world's gravity: the lander cannot slow down!", "ខ្សោយជាងទំនាញនៃពិភពនេះ៖ យានមិនអាចបន្ថយល្បឿនបានទេ!")}</span>
        ) : (
          <span className="text-muted">{tx(`Net braking ${(power - GRAVITY[world]).toFixed(1)} m/s²`, `ការហ្វ្រាំងសុទ្ធ ${(power - GRAVITY[world]).toFixed(1)} m/s²`)}</span>
        )}
      </div>
      <div className="relative overflow-hidden rounded-xl border border-line">
        <canvas ref={canvas} width={720} height={360} className="block h-auto w-full touch-none select-none" aria-label={tx("Landing game", "ល្បែងចុះចត")} {...hold} />
        <dl className="absolute left-3 top-3 grid grid-cols-3 gap-4 rounded-lg bg-black/45 px-3 py-2 font-mono text-xs backdrop-blur">
          <div>
            <dt className="text-muted">{tx("Altitude", "កម្ពស់")}</dt>
            <dd className="text-base tabular-nums">{hud.alt.toFixed(0)} m</dd>
          </div>
          <div>
            <dt className="text-muted">{tx("Speed", "ល្បឿន")}</dt>
            <dd className={`text-base tabular-nums ${hud.v > 5 ? "text-[var(--warn)]" : ""}`}>{hud.v.toFixed(1)} m/s</dd>
          </div>
          <div>
            <dt className="text-muted">{tx("Fuel", "ឥន្ធនៈ")}</dt>
            <dd className="text-base tabular-nums">{hud.fuel.toFixed(0)}%</dd>
          </div>
        </dl>
        {phase !== "flying" && (
          <div className="absolute inset-0 grid place-items-center bg-black/35 p-4 text-center">
            <div className="page-enter max-w-md">
              {phase === "landed" && (
                <>
                  <p className="text-2xl font-semibold">{v === "soft" ? tx("The Eagle has landed! Soft touchdown.", "ចុះចតដោយទន់ភ្លន់!") : v === "hard" ? tx("Hard landing, but the crew is safe.", "ចុះចតខ្លាំងបន្តិច ប៉ុន្តែក្រុមមានសុវត្ថិភាព។") : tx("Crash! Too fast.", "បុកដី! លឿនពេក។")}</p>
                  <p className="mt-1 font-mono text-sm">
                    {hud.v.toFixed(1)} m/s · {tx("score", "ពិន្ទុ")} {landingScore(hud.v, hud.fuel)} · {tx("best", "ល្អបំផុត")} {best}
                  </p>
                  <p className="mt-2 text-sm text-muted">{LANDER_FACT[world][lang === "km" ? 1 : 0]}</p>
                </>
              )}
              <button type="button" className="btn btn-primary mt-4 px-5 py-2.5 text-base" onClick={launch}>
                {phase === "landed" ? tx("Fly again", "ហោះម្តងទៀត") : tx(`Start descent to ${t(world as Key)}`, `ចាប់ផ្តើមចុះទៅ${t(world as Key)}`)}
              </button>
            </div>
          </div>
        )}
      </div>
      <button type="button" className="btn btn-lg w-full justify-center select-none sm:hidden" disabled={phase !== "flying"} {...hold}>
        🔥 {tx("Thrust (hold)", "Thrust (សង្កត់)")}
      </button>
    </div>
  );
}

type Game = "quiz" | "rush" | "landing";

export default function ChallengePage() {
  const { t, tx } = useApp();
  const [game, setGame] = useState<Game>("quiz");
  const games: { id: Game; name: string; blurb: string }[] = [
    { id: "quiz", name: tx("Quiz", "សំណួរ"), blurb: tx("10 rounds", "១០ ជុំ") },
    { id: "rush", name: tx("Rush", "ប្រញាប់"), blurb: tx("60 seconds", "៦០ វិនាទី") },
    { id: "landing", name: tx("Touchdown", "ចុះចត"), blurb: tx("Land a rocket", "ចុះចតរ៉ុក្កែត") },
  ];
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="label">{t("nav_challenge")}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{tx("Can you read another world?", "តើអ្នកអាចអានពិភពផ្សេងបានទេ?")}</h1>
      </header>
      <div role="group" aria-label={tx("Choose a game", "ជ្រើសរើសល្បែង")} className="grid grid-cols-3 gap-2">
        {games.map((g) => (
          <button key={g.id} type="button" aria-pressed={game === g.id} onClick={() => setGame(g.id)} className="game-pick">
            <span className="block font-semibold">{g.name}</span>
            <span className="block text-xs text-muted">{g.blurb}</span>
          </button>
        ))}
      </div>
      {game === "quiz" ? <Quiz /> : game === "rush" ? <Rush /> : <Touchdown />}
    </div>
  );
}
