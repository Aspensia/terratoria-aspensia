"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PLACES } from "@/data/catalog";
import { STRINGS, type Key, type Lang } from "@/lib/i18n";
import * as audio from "@/lib/audio";
import { TRACKS } from "@/data/tracks";
import { ripple } from "@/lib/fx";
import { readSaved, toggleId, writeSaved } from "@/lib/storage";

type Mode = "simple" | "science";
export type Perf = "base" | "lite";
export const VISIONS = ["default", "protanopia", "protanomaly", "deuteranopia", "deuteranomaly", "tritanopia", "tritanomaly", "achromatopsia", "achromatomaly"] as const;
export type Vision = (typeof VISIONS)[number];

interface AppState {
  lang: Lang;
  setLang(l: Lang): void;
  mode: Mode;
  setMode(m: Mode): void;
  saved: string[];
  toggleSaved(id: string): void;
  muted: boolean;
  setMuted(m: boolean): void;
  /** 0–1. */
  volume: number;
  setVolume(v: number): void;
  /** Base Mode (full quality) or Lite Mode (less memory). Changing it reloads the page so 3D scenes rebuild. */
  perf: Perf;
  setPerf(p: Perf): void;
  /** Theme music and sound effects can each be switched off. */
  music: boolean;
  setMusic(on: boolean): void;
  /** Music on every page (true) or on the home page only. */
  musicAll: boolean;
  setMusicAll(on: boolean): void;
  sfx: boolean;
  setSfx(on: boolean): void;
  /** Theme song id from data/tracks.ts. */
  track: string;
  setTrack(id: string): void;
  /** Colour-vision palette for data colours. */
  vision: Vision;
  setVision(v: Vision): void;
  t(key: Key): string;
  /** Inline bilingual text: tx("English", "ខ្មែរ"). */
  tx(en: string, km: string): string;
}

const Ctx = createContext<AppState | null>(null);
const store = () => (typeof window === "undefined" ? undefined : window.localStorage);
const pref = (key: string): string | null => {
  try {
    return store()?.getItem(key) ?? null;
  } catch {
    return null;
  }
};
const setPref = (key: string, value: string) => {
  try {
    store()?.setItem(key, value);
  } catch {
    // preference simply is not remembered
  }
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [mode, setModeState] = useState<Mode>("science");
  const [saved, setSaved] = useState<string[]>([]);
  const [muted, setMutedState] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [perf, setPerfState] = useState<Perf>("base");
  const [vision, setVisionState] = useState<Vision>("default");
  const [music, setMusicState] = useState(true);
  const [musicAll, setMusicAllState] = useState(true);
  const home = usePathname() === "/";
  const [sfxOn, setSfxState] = useState(true);
  const [track, setTrackState] = useState("alpha");

  useEffect(() => {
    if (pref("terratoria.lang") === "km") setLangState("km");
    if (pref("terratoria.mode") === "simple") setModeState("simple");
    if (pref("terratoria.muted") === "1") {
      setMutedState(true);
      audio.setMuted(true);
    }
    const v = Number(pref("terratoria.volume") ?? "0.7");
    if (Number.isFinite(v) && v >= 0 && v <= 1) {
      setVolumeState(v);
      audio.setVolume(v);
    }
    // The inline script in layout.tsx already applied these to <html>; mirror them into state.
    if (document.documentElement.dataset.perf === "lite") setPerfState("lite");
    const vis = document.documentElement.dataset.vision as Vision | undefined;
    if (vis && VISIONS.includes(vis)) setVisionState(vis);
    if (pref("terratoria.music") === "0") setMusicState(false);
    if (pref("terratoria.musicAll") === "0") setMusicAllState(false);
    if (pref("terratoria.sfx") === "0") {
      setSfxState(false);
      audio.setSfxOn(false);
    }
    const tr = pref("terratoria.track");
    if (tr && TRACKS.some((x) => x.id === tr)) setTrackState(tr);
    setSaved(readSaved(store(), PLACES.map((p) => p.id)));
  }, []);

  // ALPHA is synthesised here; the other songs play in the YouTube player (components/MusicDock.tsx).
  useEffect(() => audio.ambient(music && track === "alpha" && (musicAll || home)), [music, track, musicAll, home]);

  useEffect(() => {
    document.documentElement.dataset.mode = mode; // CSS shows .simple-only / .science-only accordingly
    document.documentElement.lang = lang;
  }, [mode, lang]);

  // One set of page-wide listeners gives every control its sound; components stay unaware of audio.
  useEffect(() => {
    const SEL = "button, a[href], select, input[type=range], [role=tab]";
    let last: Element | null = null;
    const over = (e: PointerEvent) => {
      const el = (e.target as Element).closest?.(SEL) ?? null;
      if (el && el !== last && !(el as HTMLButtonElement).disabled) audio.sfx("hover");
      last = el;
    };
    const down = (e: PointerEvent | KeyboardEvent) => {
      audio.unlock();
      if (e instanceof KeyboardEvent && e.key !== "Enter" && e.key !== " ") return;
      const el = (e.target as Element).closest?.(SEL);
      if (el) audio.sfx("click");
      if (e instanceof PointerEvent && el?.classList.contains("btn")) ripple(el as HTMLElement, e.clientX, e.clientY);
    };
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", down);
    return () => {
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", down);
    };
  }, []);

  const toggleSaved = useCallback((id: string) => {
    setSaved((ids) => {
      const next = toggleId(ids, id);
      writeSaved(store(), next);
      return next;
    });
  }, []);

  const value = useMemo<AppState>(
    () => ({
      lang,
      setLang: (l) => (setLangState(l), setPref("terratoria.lang", l)),
      mode,
      setMode: (m) => (setModeState(m), setPref("terratoria.mode", m)),
      saved,
      toggleSaved,
      muted,
      setMuted: (m) => (setMutedState(m), audio.setMuted(m), setPref("terratoria.muted", m ? "1" : "0")),
      volume,
      setVolume: (v) => (setVolumeState(v), audio.setVolume(v), setPref("terratoria.volume", String(v))),
      perf,
      setPerf: (p) => {
        setPref("terratoria.perf", p);
        window.location.reload();
      },
      music,
      setMusic: (on) => (setMusicState(on), setPref("terratoria.music", on ? "1" : "0")),
      musicAll,
      setMusicAll: (on) => (setMusicAllState(on), setPref("terratoria.musicAll", on ? "1" : "0")),
      sfx: sfxOn,
      setSfx: (on) => (setSfxState(on), audio.setSfxOn(on), setPref("terratoria.sfx", on ? "1" : "0")),
      track,
      setTrack: (id) => (setTrackState(id), setPref("terratoria.track", id)),
      vision,
      setVision: (v) => {
        setVisionState(v);
        setPref("terratoria.vision", v);
        if (v === "default") delete document.documentElement.dataset.vision;
        else document.documentElement.dataset.vision = v;
      },
      t: (key) => STRINGS[lang][key],
      tx: (en, km) => (lang === "km" ? km : en),
    }),
    [lang, mode, saved, toggleSaved, muted, volume, perf, vision, music, musicAll, sfxOn, track],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside AppProvider");
  return v;
}

/** URL query as state. Follows every URL change (links, search, replaceState); pages using it need a Suspense parent. */
export function useQuery(): [URLSearchParams | null, (patch: Record<string, string | null>) => void] {
  const params = useSearchParams();
  const update = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, []);
  return [params, update];
}
