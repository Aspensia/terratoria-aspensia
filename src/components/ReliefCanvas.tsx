"use client";

import { useEffect, useRef, useState } from "react";
import type { Place } from "@/lib/types";
import { useApp } from "./AppState";

interface Grid {
  n: number;
  cellM: number;
  z: (number | null)[];
}

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Shaded relief of the 60 km analysis window, drawn from the same grid the metrics use.
 * Every place is drawn at the same ground scale and pixel size; nothing is stretched to look alike.
 */
export function ReliefCanvas({ place }: { place: Place }) {
  const { t } = useApp();
  const ref = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [range, setRange] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!place.terrain) return;
    let cancelled = false;
    setState("loading");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    fetch(`${BASE}/grids/${place.id}.json`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((g: Grid) => {
        if (cancelled || !ref.current) return;
        const { n, cellM, z } = g;
        const canvas = ref.current;
        canvas.width = n;
        canvas.height = n;
        const ctx = canvas.getContext("2d")!;
        const img = ctx.createImageData(n, n);
        let lo = Infinity, hi = -Infinity;
        for (const v of z) if (v !== null) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
        const at = (r: number, c: number) => z[Math.min(n - 1, Math.max(0, r)) * n + Math.min(n - 1, Math.max(0, c))];
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            const i = (r * n + c) * 4;
            const v = z[r * n + c];
            if (v === null) {
              img.data[i + 3] = 0;
              continue;
            }
            // Hillshade, light from the north-west at 45°.
            const dzdx = ((at(r, c + 1) ?? v) - (at(r, c - 1) ?? v)) / (2 * cellM);
            const dzdy = ((at(r + 1, c) ?? v) - (at(r - 1, c) ?? v)) / (2 * cellM);
            const k = 3; // vertical exaggeration for the shading only
            const lit = (0.5 * k * dzdx + 0.5 * k * dzdy + 0.7071) / Math.sqrt(1 + k * k * (dzdx * dzdx + dzdy * dzdy));
            const shade = 0.25 + 0.75 * Math.max(0, Math.min(1, lit / 0.95));
            const h = hi > lo ? (v - lo) / (hi - lo) : 0.5;
            const g2 = 70 + 150 * h; // neutral grey ramp by height: no false "planet" colours
            img.data[i] = g2 * shade * 1.02;
            img.data[i + 1] = g2 * shade;
            img.data[i + 2] = g2 * shade * 0.97;
            img.data[i + 3] = 255;
          }
        }
        ctx.putImageData(img, 0, 0);
        setRange([lo, hi]);
        setState("ok");
      })
      .catch(() => !cancelled && setState("error"))
      .finally(() => clearTimeout(timer));
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [place.id, place.terrain, attempt]);

  if (!place.terrain) {
    return <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-line p-4 text-center text-sm text-muted">{t("no_terrain")}</div>;
  }
  return (
    <figure>
      <div className="relative aspect-square overflow-hidden rounded-lg border border-line bg-panel-2">
        <canvas ref={ref} className="h-full w-full" style={{ imageRendering: "auto" }} role="img" aria-label={`Shaded relief of ${place.name}`} />
        {state === "loading" && <div className="absolute inset-0 animate-pulse bg-panel-2" aria-label={t("loading")} />}
        {state === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-panel-2 text-sm">
            <p>{t("load_failed")}</p>
            <button type="button" className="btn" onClick={() => setAttempt((a) => a + 1)}>
              {t("retry")}
            </button>
          </div>
        )}
        {state === "ok" && (
          <div className="absolute bottom-2 left-2 text-[11px] text-white" style={{ width: `${(10 / place.terrain.windowKm) * 100}%` }}>
            <div className="h-1.5 border-x-2 border-b-2 border-white drop-shadow" />
            <span className="rounded bg-black/65 px-1">10 km</span>
          </div>
        )}
      </div>
      <figcaption className="mt-1.5 text-xs text-muted">
        {place.name} · {place.terrain.windowKm} km window at {place.terrain.baselineM} m
        {range && <> · {Math.round(range[0])} to {Math.round(range[1])} m</>}
        <span className="block">{place.terrain.product}</span>
      </figcaption>
    </figure>
  );
}
