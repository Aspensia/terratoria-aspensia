"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { EARTH_SITES, PLACES, REFERENCES } from "@/data/catalog";
import terrain from "@/data/generated/terrain.json";
import type { Key } from "@/lib/i18n";
import type { Place } from "@/lib/types";
import { useApp } from "./AppState";

const NAV: { href: string; key: Key }[] = [
  { href: "/", key: "nav_home" },
  { href: "/discover/", key: "nav_discover" },
  { href: "/explore/", key: "nav_explore" },
  { href: "/challenge/", key: "nav_challenge" },
  { href: "/compare/", key: "nav_compare" },
  { href: "/saved/", key: "nav_saved" },
  { href: "/methods/", key: "nav_methods" },
  { href: "/about/", key: "nav_about" },
];

export const placeHref = (p: Place, ref?: string) =>
  p.body === "earth" ? `/site/?id=${p.id}${ref ? `&ref=${ref}` : ""}` : `/explore/?body=${p.body}&focus=${p.id}`;

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

const isActive = (href: string, path: string) => (href === "/" ? path === "/" : path.startsWith(href.replace(/\/$/, "")));

export function AspensiaLogo({ size = 28 }: { size?: number }) {
  // The logo PNG is transparent, so it sits on the brand-blue gradient tile.
  return (
    <span className="logo-chip" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image optimiser */}
      <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/aspensia-logo.png`} alt="Aspensia" width={Math.round(size * 0.86)} height={Math.round(size * 0.86)} />
    </span>
  );
}

function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" />
      {muted ? <path d="M17 9l5 6M22 9l-5 6" /> : <path d="M16.5 8.5a5 5 0 010 7M19.5 5.5a9 9 0 010 13" />}
    </svg>
  );
}

const PIPELINE_RUN = Object.values(terrain).find((v) => v && "retrieved" in v)?.retrieved ?? "";

/** Mission-control style status line. Everything it shows is true: archive data, real counts, a real clock. */
function MissionStrip() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const tick = () => setNow(new Date().toISOString().slice(11, 19));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="mission-strip no-print">
      <div className="mx-auto flex max-w-7xl items-center gap-x-5 overflow-x-auto whitespace-nowrap px-4 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
        <span className="flex items-center gap-2 text-text">
          <span className="live" aria-hidden="true" /> Archive data online
        </span>
        <span>Targets {REFERENCES.length + EARTH_SITES.length}</span>
        <span>Moon {REFERENCES.filter((r) => r.body === "moon").length} · Mars {REFERENCES.filter((r) => r.body === "mars").length} · Earth {EARTH_SITES.length}</span>
        <span>Pipeline run {PIPELINE_RUN}</span>
        <span className="ml-auto text-text" aria-label="Coordinated Universal Time">
          UTC {now}
        </span>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { t, lang, setLang, theme, setTheme, mode, setMode, muted, setMuted } = useApp();
  const path = usePathname();
  const section = NAV.find((n) => n.href !== "/" && isActive(n.href, path)) ?? (path.startsWith("/site") ? NAV[1] : null);
  return (
    <>
      <a href="#main" className="btn btn-primary sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50">
        {t("skip")}
      </a>
      <header className="glass-bar no-print relative z-40 md:sticky md:top-0">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
          <Link href="/" className="brand flex items-center gap-2.5" aria-label="PROJECT: Terratoria, home">
            <svg width="32" height="32" viewBox="0 0 30 30" aria-hidden="true" className="brand-mark">
              <circle cx="12" cy="15" r="9" fill="none" stroke="var(--earth)" strokeWidth="2" />
              <circle cx="18" cy="15" r="9" fill="none" stroke="var(--mars)" strokeWidth="2" />
              <circle cx="15" cy="15" r="2.4" fill="var(--moon)" />
            </svg>
            <span>
              <span className="block font-mono text-[10px] leading-tight tracking-[0.3em] text-accent">PROJECT:</span>
              <span className="block text-lg font-semibold leading-tight tracking-tight">Terratoria</span>
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
            <button
              type="button"
              className="btn"
              aria-pressed={!muted}
              aria-label={muted ? t("sound_off") : t("sound_on")}
              title={muted ? t("sound_off") : t("sound_on")}
              onClick={() => setMuted(!muted)}
            >
              <SoundIcon muted={muted} />
            </button>
          </div>
        </div>
        <nav aria-label="Main" className="mx-auto flex max-w-7xl items-center gap-3 px-4">
          <ul className="flex flex-1 gap-1 overflow-x-auto text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV.map((n) => {
              const active = isActive(n.href, path);
              return (
                <li key={n.href}>
                  <Link href={n.href} aria-current={active ? "page" : undefined} className={`nav-link ${active ? "is-active" : ""}`}>
                    {t(n.key)}
                  </Link>
                </li>
              );
            })}
          </ul>
          <a href="#credits" className="hidden items-center gap-2 text-[11px] text-muted hover:text-text sm:flex" title={t("made_by")}>
            <AspensiaLogo size={22} />
            <span>by Aspensia</span>
          </a>
        </nav>
        <MissionStrip />
      </header>
      {section && (
        <nav aria-label="Breadcrumb" className="no-print mx-auto max-w-7xl px-4 pt-4 text-xs text-muted">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-text">{t("nav_home")}</Link>
            </li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-text">{t(section.key)}</li>
          </ol>
        </nav>
      )}
      <main id="main" className="mx-auto max-w-7xl px-4 py-6">
        <Suspense fallback={<div className="card h-96 animate-pulse" />}>
          <div key={path} className="page-enter">{children}</div>
        </Suspense>
      </main>
      <footer id="credits" className="relative z-10 mx-auto max-w-7xl border-t border-line px-4 py-6 text-xs text-muted">
        <div className="flex flex-wrap items-center gap-4">
          <AspensiaLogo size={44} />
          <div>
            <p className="text-sm font-semibold text-text">PROJECT: Terratoria · {t("made_by")}</p>
            <p>A team of six high school students from Cambodia. NASA Space Apps Challenge 2026. Not affiliated with or endorsed by NASA or ESA.</p>
          </div>
        </div>
        <p className="mt-3">{t("screening_note")} {t("coverage_note")} {t("archived_note")}</p>
        <p className="mt-1">
          Data: NASA LRO LOLA and Diviner, MGS MOLA, NASA POWER; ESA Copernicus DEM. Imagery: NASA GIBS Blue Marble and NASA 3D Resources. Code written with AI
          assistance (Claude) from the team&apos;s concept.
        </p>
      </footer>
    </>
  );
}
