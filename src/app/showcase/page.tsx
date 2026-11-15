"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppState";

const SRC = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/showcase/terratoria-showcase.mp4`;
const POSTER = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/showcase/poster.jpg`;
// Scene starts in the 30 s film, for the progress bar's marks and labels.
const SCENES: [number, string, string][] = [
  [0, "Launch", "ចាប់ផ្តើម"],
  [4, "Discover", "ស្វែងរក"],
  [8, "3D Explorer", "កម្មវិធីរុករក 3D"],
  [13, "Mission Plan", "ផែនការបេសកកម្ម"],
  [17, "Mission Challenge", "ការប្រកួតបេសកកម្ម"],
  [23, "Compare", "ប្រៀបធៀប"],
  [26, "Saved Sites", "ទីតាំងដែលបានរក្សាទុក"],
  [28, "Mission ready", "រួចរាល់"],
];

/**
 * Showcase Mode: plays the 30-second film (rendered with HyperFrames from the real site) at 60 fps.
 * Space play/pause, R restart, F fullscreen, H HUD progress bar, C clean mode (hides all controls for recording).
 */
export default function ShowcasePage() {
  const { tx, lang, music, setMusic } = useApp();
  const video = useRef<HTMLVideoElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [t, setT] = useState(0);
  const [hud, setHud] = useState(true);
  const [clean, setClean] = useState(false);
  const musicWas = useRef<boolean | null>(null);

  // The film has its own soundtrack: pause the site's theme music while watching, restore it on leaving.
  useEffect(
    () => () => {
      if (musicWas.current) setMusic(true);
    },
    [setMusic],
  );

  const play = useCallback(() => {
    const v = video.current;
    if (!v) return;
    if (musicWas.current === null) {
      musicWas.current = music;
      if (music) setMusic(false);
    }
    setStarted(true);
    void v.play();
  }, [music, setMusic]);
  const toggle = useCallback(() => (video.current?.paused ? play() : video.current?.pause()), [play]);
  const restart = useCallback(() => {
    if (video.current) video.current.currentTime = 0;
    play();
  }, [play]);
  const fullscreen = useCallback(() => {
    const el = stage.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }, []);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as Element).closest?.("input, select, textarea")) return;
      const k = e.key.toLowerCase();
      if (k === " ") (e.preventDefault(), toggle());
      else if (k === "r") restart();
      else if (k === "f") fullscreen();
      else if (k === "h") setHud((h) => !h);
      else if (k === "c") setClean((c) => !c);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [toggle, restart, fullscreen]);

  const scene = [...SCENES].reverse().find(([s]) => t >= s) ?? SCENES[0];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <p className="label">{tx("Showcase", "បង្ហាញ")}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{tx("Terratoria in 30 seconds", "Terratoria ក្នុងរយៈពេល ៣០ វិនាទី")}</h1>
        <p className="mt-1 max-w-3xl text-muted">
          {tx(
            "A 30-second film of every feature, made from captures of this site and its 3D globes, at 60 frames per second with its own soundtrack. It plays on its own: press play once.",
            "ខ្សែភាពយន្ត ៣០ វិនាទីនៃមុខងារទាំងអស់ ដែលបង្កើតពីរូបថតអេក្រង់នៃគេហទំព័រនេះ និងភពផែនដី 3D របស់វា ក្នុងល្បឿន ៦០ ស៊ុមក្នុងមួយវិនាទី ជាមួយបទភ្លេងផ្ទាល់ខ្លួន។ វាលេងដោយខ្លួនឯង៖ ចុចលេងតែម្តង។",
          )}
        </p>
      </header>

      <div ref={stage} className={`showcase-stage ${clean ? "is-clean" : ""}`}>
        <video
          ref={video}
          src={SRC}
          poster={POSTER}
          playsInline
          preload="auto"
          className="h-full w-full"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
          onClick={toggle}
        />
        {!started && (
          <button type="button" className="showcase-start" onClick={play} aria-label={tx("Play the showcase", "លេងការបង្ហាញ")}>
            <span aria-hidden="true">▶</span>
            {tx("Play the 30-second showcase", "លេងការបង្ហាញ ៣០ វិនាទី")}
          </button>
        )}
        {hud && started && (
          <div className="showcase-hud" aria-hidden="true">
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-white/80">
              <span>{lang === "km" ? scene[2] : scene[1]}</span>
              <span>{t.toFixed(1)} / 30.0 s</span>
            </div>
            <div className="showcase-bar">
              <div style={{ width: `${(t / 30) * 100}%` }} />
              {SCENES.slice(1).map(([s]) => (
                <i key={s} style={{ left: `${(s / 30) * 100}%` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {!clean && (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-primary" onClick={toggle}>
            {playing ? tx("⏸ Pause", "⏸ ផ្អាក") : tx("▶ Play", "▶ លេង")}
          </button>
          <button type="button" className="btn" onClick={restart}>
            ↺ {tx("Restart", "ចាប់ផ្តើមឡើងវិញ")}
          </button>
          <button type="button" className="btn" onClick={fullscreen}>
            ⛶ {tx("Fullscreen", "ពេញអេក្រង់")}
          </button>
          <button type="button" className="btn" aria-pressed={hud} onClick={() => setHud(!hud)}>
            {tx("HUD progress bar", "របារវឌ្ឍនភាព HUD")}: {hud ? tx("on", "បើក") : tx("off", "បិទ")}
          </button>
          <button type="button" className="btn" aria-pressed={clean} onClick={() => setClean(true)}>
            {tx("Clean record mode", "របៀបថតស្អាត")}
          </button>
          <span className="text-xs text-muted">{tx("Keys: Space play/pause · R restart · F fullscreen · H HUD · C clean mode", "គ្រាប់ចុច៖ Space លេង/ផ្អាក · R ចាប់ផ្តើមឡើងវិញ · F ពេញអេក្រង់ · H HUD · C របៀបស្អាត")}</span>
        </div>
      )}
      {clean && (
        <p className="text-xs text-muted">{tx("Clean record mode: controls hidden. Press C to show them again.", "របៀបថតស្អាត៖ ការគ្រប់គ្រងត្រូវបានលាក់។ ចុច C ដើម្បីបង្ហាញម្តងទៀត។")}</p>
      )}
      <p className="text-xs text-muted">
        {tx(
          "Made with HyperFrames from real captures of this site. Soundtrack synthesised for the film. Earth, Moon and Mars use the site's NASA-derived textures.",
          "បង្កើតដោយ HyperFrames ពីរូបថតអេក្រង់ពិតនៃគេហទំព័រនេះ។ បទភ្លេងសំយោគសម្រាប់ខ្សែភាពយន្តនេះ។ ផែនដី ព្រះច័ន្ទ និងភពអង្គារ ប្រើរូបភាពដែលបានមកពី NASA របស់គេហទំព័រ។",
        )}
      </p>
    </div>
  );
}
