"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PLACES } from "@/data/catalog";
import { STRINGS, type Key, type Lang } from "@/lib/i18n";
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

  useEffect(() => {
    if (pref("analogatlas.lang") === "km") setLangState("km");
    if (pref("analogatlas.theme") === "light") setThemeState("light");
    if (pref("analogatlas.mode") === "simple") setModeState("simple");
    setSaved(readSaved(store(), PLACES.map((p) => p.id)));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = lang;
  }, [theme, lang]);

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
      t: (key) => STRINGS[lang][key],
    }),
    [lang, theme, mode, saved, toggleSaved],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside AppProvider");
  return v;
}

/** URL query as state, read after mount so pages can be statically exported. */
export function useQuery(): [URLSearchParams | null, (patch: Record<string, string | null>) => void] {
  const [params, setParams] = useState<URLSearchParams | null>(null);
  useEffect(() => {
    setParams(new URLSearchParams(window.location.search));
  }, []);
  const update = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
    setParams(next);
  }, []);
  return [params, update];
}
