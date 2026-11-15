"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { gsap } from "gsap";
import { useEffect, useRef, useState } from "react";
import { useApp } from "./AppState";
import { textureUrl } from "./three/space";

const Globe = dynamic(() => import("./three/Globe").then((m) => m.Globe), { ssr: false });

type World = "earth" | "moon" | "mars";
type Bi = { en: string; km: string };

const NO_MARKERS: never[] = [];
const HOLD_MS = 9000;
const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Gravity and solar day are standard NASA fact-sheet values.
const STOPS: { id: World; line: Bi; g: string; day: Bi }[] = [
  {
    id: "earth",
    line: { en: "21 field sites on seven continents, scored against both worlds.", km: "ទីតាំងទីវាល ២១ នៅលើទ្វីបទាំងប្រាំពីរ ដែលដាក់ពិន្ទុធៀបនឹងពិភពទាំងពីរ។" },
    g: "9.81",
    day: { en: "24 h", km: "២៤ ម៉ោង" },
  },
  {
    id: "moon",
    line: { en: "Shackleton crater at the south pole and the Marius Hills lava-tube pit.", km: "រណ្តៅ Shackleton នៅប៉ូលខាងត្បូង និងរណ្តៅស្រុតបំពង់កម្អែ Marius Hills។" },
    g: "1.62",
    day: { en: "29.5 Earth days", km: "២៩.៥ ថ្ងៃផែនដី" },
  },
  {
    id: "mars",
    line: { en: "Jezero crater's ancient lake and the cave skylights of Arsia Mons.", km: "បឹងបុរាណនៃរណ្តៅ Jezero និងរន្ធធ្លុះរូងភ្នំនៃ Arsia Mons។" },
    g: "3.71",
    day: { en: "24 h 40 min", km: "២៤ ម៉ោង ៤០ នាទី" },
  },
];

/** Home page destination tour: a letterboxed 3D view that warps between Earth, the Moon and Mars. */
export function WorldTour() {
  const { t, tx, lang } = useApp();
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const stage = useRef<HTMLDivElement>(null);
  const hud = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const stop = STOPS[i];

  const go = (next: number) => {
    next = (next + STOPS.length) % STOPS.length;
    if (next === i || busy.current) return;
    if (calm() || !stage.current) return setI(next);
    busy.current = true;
    gsap
      .timeline({ onComplete: () => void (busy.current = false) })
      .to(stage.current, { scale: 1.18, filter: "blur(10px) brightness(1.8)", autoAlpha: 0, duration: 0.45, ease: "power3.in" })
      .to(".tour-warp", { autoAlpha: 1, duration: 0.2 }, 0.15)
      .add(() => setI(next))
      .fromTo(stage.current, { scale: 0.86, filter: "blur(8px) brightness(1.4)" }, { scale: 1, filter: "blur(0px) brightness(1)", autoAlpha: 1, duration: 1.1, ease: "expo.out", clearProps: "filter,transform" })
      .to(".tour-warp", { autoAlpha: 0, duration: 0.5 }, "<");
  };

  // Text lines rise in after every jump.
  useEffect(() => {
    if (!hud.current || calm()) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-tour]", { autoAlpha: 0, y: 16, duration: 0.8, stagger: 0.07, ease: "expo.out", clearProps: "all" });
    }, hud);
    // revert, not kill: an interrupted from() would otherwise leave lines stuck mid-way.
    return () => ctx.revert();
  }, [i]);

  // Auto-advance; the pause control and any manual jump stop it.
  useEffect(() => {
    if (!playing || calm()) return;
    const id = setTimeout(() => go(i + 1), HOLD_MS);
    return () => clearTimeout(id);
  });

  const pick = (n: number) => {
    setPlaying(false);
    go(n);
  };

  return (
    <section aria-labelledby="worlds-h" className="tour">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="worlds-h" className="label">
          {t("worlds_title")}
        </h2>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
          {tx("Destination", "គោលដៅ")} {String(i + 1).padStart(2, "0")} / {String(STOPS.length).padStart(2, "0")}
        </p>
      </div>

      <div className="tour-frame">
        <div ref={stage} className="tour-stage">
          <Globe key={stop.id} world={stop.id} markers={NO_MARKERS} selectedId={null} onSelect={() => {}} />
        </div>
        <div className="tour-warp" aria-hidden="true" />
        <div className="tour-shade" aria-hidden="true" />

        <div ref={hud} className="tour-hud" aria-live="polite">
          <p data-tour className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">
            {tx("Target", "គោលដៅ")} · {stop.id.toUpperCase()}
          </p>
          <h3 data-tour className="mt-2 text-5xl font-semibold tracking-tight sm:text-6xl">
            {t(stop.id)}
          </h3>
          <p data-tour className="mt-3 max-w-sm text-text/85">
            {stop.line[lang]}
          </p>
          <dl data-tour className="mt-5 flex gap-6 font-mono text-xs">
            <div>
              <dt className="uppercase tracking-[0.16em] text-muted">{tx("Gravity", "ទំនាញ")}</dt>
              <dd className="mt-1 text-base tabular-nums">{stop.g} m/s²</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.16em] text-muted">{tx("Solar day", "មួយថ្ងៃ")}</dt>
              <dd className="mt-1 text-base">{stop.day[lang]}</dd>
            </div>
          </dl>
          <Link data-tour href={`/explore/?body=${stop.id}`} className="btn btn-primary mt-6 w-fit">
            {t("explore_3d")} →
          </Link>
        </div>

        <div className="tour-controls">
          <div role="group" aria-label={tx("Choose a world", "ជ្រើសរើសពិភព")} className="flex gap-2">
            {STOPS.map((s, n) => (
              <button key={s.id} type="button" aria-pressed={n === i} onClick={() => pick(n)} className="tour-pick">
                <span aria-hidden="true" className="globe-thumb h-7 w-7 rounded-full" style={{ backgroundImage: `url(${textureUrl(s.id)})` }} />
                <span className="hidden sm:inline">{t(s.id)}</span>
                {n === i && playing && <span key={i} aria-hidden="true" className="tour-progress" style={{ animationDuration: `${HOLD_MS}ms` }} />}
              </button>
            ))}
          </div>
          <button type="button" className="btn tour-next" onClick={() => pick(i + 1)}>
            {tx("Warp to next", "ទៅពិភពបន្ទាប់")} <span aria-hidden="true">⟶</span>
          </button>
          <button
            type="button"
            className="btn h-9 w-9 justify-center p-0"
            aria-pressed={!playing}
            aria-label={playing ? tx("Pause the tour", "ផ្អាកការបង្ហាញ") : tx("Play the tour", "ចាក់ការបង្ហាញ")}
            onClick={() => setPlaying(!playing)}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" fill="currentColor">
              {playing ? <path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" /> : <path d="M3 1.5v9l7-4.5z" />}
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
