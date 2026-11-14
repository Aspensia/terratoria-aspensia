"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { PLACES } from "@/data/catalog";
import type { Key } from "@/lib/i18n";
import type { Place } from "@/lib/types";
import { useApp } from "./AppState";

const NAV: { href: string; key: Key }[] = [
  { href: "/", key: "nav_discover" },
  { href: "/compare/", key: "nav_compare" },
  { href: "/saved/", key: "nav_saved" },
  { href: "/methods/", key: "nav_methods" },
  { href: "/about/", key: "nav_about" },
];

export const placeHref = (p: Place, ref?: string) =>
  p.body === "earth" ? `/site/?id=${p.id}${ref ? `&ref=${ref}` : ""}` : `/?ref=${p.id}`;

/** "19.6, -155.5" style input → nearest catalogue place on Earth. */
function nearestByCoords(q: string): Place | null {
  const m = q.match(/^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lon = Number(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lon) > 360) return null;
  let best: Place | null = null;
  let bestD = Infinity;
  for (const p of PLACES.filter((x) => x.body === "earth")) {
    const d = Math.hypot(p.lat - lat, (((p.lon - lon + 540) % 360) - 180) * Math.cos((lat * Math.PI) / 180));
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

function Search() {
  const { t } = useApp();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const near = nearestByCoords(s);
    if (near) return [near];
    return PLACES.filter((p) => `${p.name} ${p.country ?? ""} ${p.category} ${p.body}`.toLowerCase().includes(s)).slice(0, 7);
  }, [q]);
  const go = (p: Place) => {
    setOpen(false);
    setQ("");
    router.push(placeHref(p));
  };
  return (
    <div className="relative w-full md:max-w-xs">
      <input
        type="search"
        role="combobox"
        aria-expanded={open && q.trim() !== ""}
        aria-controls="search-results"
        aria-label={t("search")}
        placeholder={t("search")}
        value={q}
        onChange={(e) => (setQ(e.target.value), setOpen(true))}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) go(results[0]);
          if (e.key === "Escape") setOpen(false);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-sm placeholder:text-muted"
      />
      {open && q.trim() !== "" && (
        <ul id="search-results" role="listbox" className="card absolute z-50 mt-1 w-full overflow-hidden text-sm shadow-lg">
          {results.length === 0 && <li className="px-3 py-2 text-muted">{t("search_none")}</li>}
          {results.map((p) => (
            <li key={p.id} role="option" aria-selected="false">
              <button type="button" onMouseDown={() => go(p)} className="block w-full px-3 py-2 text-left hover:bg-panel-2">
                <span className="font-medium">{p.name}</span>
                <span className="block text-xs text-muted">
                  {t(p.body)} · {p.country ?? p.category}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { t, lang, setLang, theme, setTheme, mode, setMode } = useApp();
  const path = usePathname();
  return (
    <>
      <a href="#main" className="btn btn-primary sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50">
        {t("skip")}
      </a>
      <header className="no-print border-b border-line bg-panel">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
              <circle cx="12" cy="15" r="9" fill="none" stroke="var(--earth)" strokeWidth="2" />
              <circle cx="18" cy="15" r="9" fill="none" stroke="var(--mars)" strokeWidth="2" />
              <circle cx="15" cy="15" r="2.4" fill="var(--moon)" />
            </svg>
            <span>
              <span className="block text-lg font-semibold leading-tight tracking-tight">AnalogAtlas</span>
              <span className="block text-[11px] leading-tight text-muted">{t("tagline")}</span>
            </span>
          </Link>
          <div className="order-last w-full md:order-none md:ml-auto md:w-auto md:flex-1 md:max-w-xs">
            <Search />
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2 md:ml-0">
            <div role="group" aria-label={t("mode_label")} className="flex">
              <button type="button" className="btn rounded-r-none" aria-pressed={mode === "simple"} onClick={() => setMode("simple")}>
                {t("mode_simple")}
              </button>
              <button type="button" className="btn -ml-px rounded-l-none" aria-pressed={mode === "science"} onClick={() => setMode("science")}>
                {t("mode_science")}
              </button>
            </div>
            <button type="button" className="btn" aria-label={t("lang_label")} onClick={() => setLang(lang === "en" ? "km" : "en")}>
              {lang === "en" ? "ខ្មែរ" : "English"}
            </button>
            <button type="button" className="btn" aria-label={t("theme_label")} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? t("theme_light") : t("theme_dark")}
            </button>
          </div>
        </div>
        <nav aria-label="Main" className="mx-auto max-w-7xl overflow-x-auto px-4">
          <ul className="flex gap-1 text-sm">
            {NAV.map((n) => {
              const active = n.href === "/" ? path === "/" : path.startsWith(n.href.replace(/\/$/, ""));
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={`block whitespace-nowrap border-b-2 px-3 py-2 ${active ? "border-accent font-semibold text-text" : "border-transparent text-muted hover:text-text"}`}
                  >
                    {t(n.key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-7xl px-4 py-6">
        {children}
      </main>
      <footer className="mx-auto max-w-7xl border-t border-line px-4 py-5 text-xs text-muted">
        <p>{t("screening_note")} {t("coverage_note")} {t("archived_note")}</p>
        <p className="mt-1">
          Data: NASA LRO LOLA and Diviner, MGS MOLA, NASA POWER; ESA Copernicus DEM. Basemap imagery: NASA GIBS Blue Marble. Code written with AI
          assistance (Claude) from the team&apos;s concept.
        </p>
      </footer>
    </>
  );
}
