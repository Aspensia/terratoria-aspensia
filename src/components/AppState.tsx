"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { PLACES } from "@/data/catalog";
import { STRINGS, type Key, type Lang } from "@/lib/i18n";
import * as audio from "@/lib/audio";
import { readSaved, toggleId, writeSaved } from "@/lib/storage";

type Theme = "dark" | "light";
type Mode = "simple" | "science";

interface AppState {
  lang: Lang;
  setLang(l: Lang): void;
  theme: Theme;
  setTheme(t: Theme): void;
  mode: Mode;
  setMode(m: Mode): void;
  saved: string[];
  toggleSaved(id: string): void;
  muted: boolean;
  setMuted(m: boolean): void;
  t(key: Key): string;
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
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mode, setModeState] = useState<Mode>("science");
  const [saved, setSaved] = useState<string[]>([]);
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    if (pref("analogatlas.lang") === "km") setLangState("km");
    if (pref("analogatlas.theme") === "light") setThemeState("light");
    if (pref("analogatlas.mode") === "simple") setModeState("simple");
    if (pref("analogatlas.muted") === "1") {
      setMutedState(true);
      audio.setMuted(true);
    }
    setSaved(readSaved(store(), PLACES.map((p) => p.id)));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = lang;
  }, [theme, lang]);

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
      if ((e.target as Element).closest?.(SEL)) audio.sfx("click");
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
      setLang: (l) => (setLangState(l), setPref("analogatlas.lang", l)),
      theme,
      setTheme: (t) => (setThemeState(t), setPref("analogatlas.theme", t)),
      mode,
      setMode: (m) => (setModeState(m), setPref("analogatlas.mode", m)),
      saved,
      toggleSaved,
      muted,
      setMuted: (m) => (setMutedState(m), audio.setMuted(m), setPref("analogatlas.muted", m ? "1" : "0")),
      t: (key) => STRINGS[lang][key],
    }),
    [lang, theme, mode, saved, toggleSaved, muted],
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
