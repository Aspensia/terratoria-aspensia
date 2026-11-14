"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp, useQuery } from "@/components/AppState";
import { fmtCoord, IndexBadge, ScoreBar, StatusBadge } from "@/components/Bits";
import { ZoomableImage } from "@/components/Lightbox";
import { ReliefCanvas } from "@/components/ReliefCanvas";
import type { GlobeMarker } from "@/components/three/Globe";
import { textureUrl } from "@/components/three/space";
import { EARTH_SITES, getPlace, REFERENCES } from "@/data/catalog";
import { BALANCED } from "@/data/presets";
import { sfx } from "@/lib/audio";
import type { Key } from "@/lib/i18n";
import { aggregate, scoreAll } from "@/lib/scoring";
import type { Place } from "@/lib/types";

const Globe = dynamic(() => import("@/components/three/Globe").then((m) => m.Globe), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-[radial-gradient(circle,rgba(108,196,255,0.12),transparent_60%)]" />,
});

type World = "earth" | "moon" | "mars";
const WORLDS: World[] = ["earth", "moon", "mars"];

const SOURCE: Record<World, string> = {
  earth: "NASA Blue Marble with shaded relief and bathymetry, served by NASA GIBS. A static composite, not a live image.",
  moon: "Shaded relief computed by Terratoria from NASA LRO LOLA elevation (LDEM_16). Brightness shows slope and height, not true colour.",
  mars: "NASA 3D Resources Mars colour mosaic (equirectangular).",
};

const K = (v?: number) => (v === undefined ? "–" : `${v.toFixed(0)} K`);

function Telemetry({ place }: { place: Place }) {
  const { t } = useApp();
  const rows: [string, string][] = [];
  if (place.terrain) {
    rows.push(["Median slope", `${place.terrain.slopeMedianDeg.toFixed(1)}°`], ["Local relief", `${place.terrain.reliefM} m`], ["Roughness", `${place.terrain.roughnessM.toFixed(1)} m`]);
  }
  if (place.climate) {
    rows.push([`${t("temperature")}: ${t("mean")}`, K(place.climate.meanK)], [`${t("min")} / ${t("max")}`, `${K(place.climate.minK)} / ${K(place.climate.maxK)}`]);
    if (place.climate.windMs !== undefined) rows.push([t("wind"), `${place.climate.windMs.toFixed(1)} m/s`]);
  }
  if (rows.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-[var(--line)] text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="bg-[var(--panel-solid)] px-3 py-2">
          <dt className="label !text-[10px]">{k}</dt>
          <dd className="font-mono">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function RegionPanel({ region }: { region: Place }) {
  const { t } = useApp();
  const top = useMemo(
    () =>
      EARTH_SITES.map((s) => ({ s, a: aggregate(scoreAll(region, s), BALANCED) }))
        .filter((x) => x.a.index !== null)
        .sort((a, b) => b.a.index! - a.a.index!)
        .slice(0, 5),
    [region],
  );
  return (
    <>
      <Telemetry place={region} />
      <ReliefCanvas place={region} />
      <section>
        <h3 className="label mb-2">{t("analogues_here")}</h3>
        <ol className="space-y-1.5">
          {top.map(({ s, a }, i) => (
            <li key={s.id}>
              <Link href={`/explore/?body=earth&focus=${s.id}&ref=${region.id}`} className="card card-hover flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="font-mono text-muted">#{i + 1}</span> <span className="font-medium">{s.name}</span>
                  <span className="block text-xs text-muted">{s.country}</span>
                </span>
                <span className="font-mono text-lg tabular-nums">{a.index!.toFixed(0)}</span>
              </Link>
            </li>
          ))}
        </ol>
        <p className="mt-1 text-xs text-muted">{t("fly_to")} →</p>
      </section>
      <Link href={`/discover/?ref=${region.id}`} className="btn btn-primary w-full justify-center">
        {t("analyse")}
      </Link>
    </>
  );
}

function SitePanel({ site, refId, onRef }: { site: Place; refId: string; onRef(id: string): void }) {
  const { t, saved, toggleSaved } = useApp();
  const ref = getPlace(refId) ?? REFERENCES[0];
  const results = useMemo(() => scoreAll(ref, site), [ref, site]);
  const agg = aggregate(results, BALANCED);
  return (
    <>
      <div className="flex items-end justify-between gap-3">
        <label className="flex min-w-0 flex-col gap-1 text-xs">
          <span className="label">{t("target")}</span>
          <select className="btn max-w-full" value={ref.id} onChange={(e) => onRef(e.target.value)}>
            {REFERENCES.map((r) => (
              <option key={r.id} value={r.id}>
                {t(r.body as Key)}: {r.name}
              </option>
            ))}
          </select>
        </label>
        <IndexBadge agg={agg} />
      </div>
      <div className="space-y-2">
        {results.map((r) => (
          <ScoreBar key={r.id} r={r} />
        ))}
      </div>
      <Telemetry place={site} />
      <ReliefCanvas place={site} />
      <div className="grid grid-cols-2 gap-2">
        <Link href={`/site/?id=${site.id}&ref=${ref.id}`} className="btn btn-primary col-span-2 justify-center">
          {t("open_full")}
        </Link>
        <Link href={`/compare/?ref=${ref.id}&sites=${site.id}`} className="btn justify-center">
          {t("compare")}
        </Link>
        <button type="button" className="btn justify-center" aria-pressed={saved.includes(site.id)} onClick={() => toggleSaved(site.id)}>
          {saved.includes(site.id) ? t("saved") : t("save")}
        </button>
      </div>
    </>
  );
}

export default function ExplorePage() {
  const { t } = useApp();
  const [params, setQuery] = useQuery();
  const drawer = useRef<HTMLElement>(null);
  const [touring, setTouring] = useState(false);

  const bodyParam = params?.get("body");
  const world: World = WORLDS.includes(bodyParam as World) ? (bodyParam as World) : "moon";
  const places = useMemo(() => (world === "earth" ? EARTH_SITES : REFERENCES.filter((r) => r.body === world)), [world]);
  const focused = places.find((p) => p.id === params?.get("focus")) ?? null;
  const refId = params?.get("ref") ?? REFERENCES[0].id;

  // Stable per world, so the 3D scene is built once per world and not on every render.
  const markers = useMemo<GlobeMarker[]>(
    () =>
      places.map((p) => {
        const known = p.status === "established" || p.status === "documented";
        return {
          id: p.id,
          lat: p.lat,
          lon: p.lon,
          label: p.name,
          color: p.body === "earth" ? (known ? "#4fc3a1" : "#e6b34d") : "#e69f00",
          shape: p.body === "earth" && !known ? "diamond" : "circle",
        };
      }),
    [places],
  );

  const select = (id: string | null) => {
    sfx(id ? "select" : "close");
    setQuery({ focus: id });
  };
  const pick = (id: string | null) => {
    setTouring(false); // any manual choice ends the tour
    select(id);
  };

  // Guided tour: visit every location in turn, long enough to read the panel.
  const focusId = focused?.id;
  useEffect(() => {
    if (!touring) return;
    const next = () => {
      const i = places.findIndex((p) => p.id === new URLSearchParams(window.location.search).get("focus"));
      select(places[(i + 1) % places.length].id);
    };
    if (!focusId) next();
    const id = setInterval(next, 7000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only when the tour or world changes
  }, [touring, places]);
  useEffect(() => setTouring(false), [world]);

  useEffect(() => {
    if (!focused) return;
    drawer.current?.focus({ preventScroll: true });
    const esc = (e: KeyboardEvent) => e.key === "Escape" && pick(null);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- select only touches the URL
  }, [focused?.id]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label">{t("nav_explore")}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{t(world as Key)}</h1>
          <p className="text-sm text-muted">{t("explore_hint")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={`btn ${touring ? "btn-primary" : ""}`} aria-pressed={touring} onClick={() => setTouring((v) => !v)}>
          {touring ? "■ Stop tour" : "▶ Guided tour"}
        </button>
        <div role="tablist" aria-label={t("step1")} className="flex gap-1 rounded-xl border border-line bg-[var(--panel)] p-1">
          {WORLDS.map((w) => (
            <button
              key={w}
              type="button"
              role="tab"
              aria-selected={w === world}
              onClick={() => w !== world && setQuery({ body: w, focus: null })}
              className={`btn border-0 ${w === world ? "btn-primary" : "bg-transparent"}`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: `var(--${w})` }} aria-hidden="true" />
              {t(w as Key)}
            </button>
          ))}
        </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[250px_1fr]">
        <aside className="card order-2 max-h-[70vh] overflow-y-auto p-3 lg:order-1">
          <h2 className="label mb-2">
            {t("locations")} ({places.length})
          </h2>
          <ul className="space-y-1">
            {places.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => pick(p.id)}
                  aria-current={p.id === focused?.id ? "true" : undefined}
                  className={`w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-[var(--panel-2)] ${p.id === focused?.id ? "bg-[var(--panel-2)] text-text ring-1 ring-[var(--line-strong)]" : "text-muted"}`}
                >
                  <span className="block font-medium text-text">{p.name}</span>
                  <span className="block text-xs">{p.country ?? p.category}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-line pt-3">
            <ZoomableImage
              className="aspect-[2/1] w-full"
              image={{ src: textureUrl(world), alt: `Source map of ${t(world as Key)}`, caption: SOURCE[world] }}
            />
            <p className="mt-1 text-xs text-muted">{t("view_map")}</p>
          </div>
        </aside>

        <div className="card order-1 overflow-hidden p-0 lg:order-2">
          <div className="relative h-[58vh] min-h-[380px] lg:h-[72vh]">
            <Globe key={world} world={world} markers={markers} selectedId={focused?.id ?? null} onSelect={(id) => pick(id)} />

            {focused && (
              <aside
                ref={drawer}
                tabIndex={-1}
                aria-label={`${t("telemetry")}: ${focused.name}`}
                className="drawer glass-bar absolute inset-x-2 bottom-2 max-h-[62%] space-y-4 overflow-y-auto rounded-2xl border border-[var(--line-strong)] p-4 shadow-2xl md:inset-x-auto md:bottom-3 md:right-3 md:top-3 md:max-h-none md:w-[400px]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="label">{t("telemetry")}</p>
                    <h2 className="text-xl font-semibold leading-tight">{focused.name}</h2>
                    <p className="text-sm text-muted">
                      {focused.country ?? focused.category} · <span className="font-mono text-xs">{fmtCoord(focused)}</span>
                    </p>
                    {focused.status && (
                      <div className="mt-1.5">
                        <StatusBadge status={focused.status} />
                      </div>
                    )}
                  </div>
                  <button type="button" className="btn shrink-0" onClick={() => pick(null)} aria-label={t("close")}>
                    ✕
                  </button>
                </div>
                <p className="text-sm">{focused.summary}</p>
                {focused.body === "earth" ? (
                  <SitePanel site={focused} refId={refId} onRef={(id) => setQuery({ ref: id })} />
                ) : (
                  <RegionPanel region={focused} />
                )}
              </aside>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
