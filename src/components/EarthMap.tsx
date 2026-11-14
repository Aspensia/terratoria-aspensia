"use client";

import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type { Place } from "@/lib/types";
import { useApp } from "./AppState";

export interface MapSite {
  place: Place;
  index: number | null;
  rank: number | null;
}

// NASA GIBS Blue Marble: open, no key. Static composite imagery, not live.
const BASEMAP = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg";
const HOME = { center: [10, 22] as [number, number], zoom: 0.9 };

export function EarthMap({ sites, onOpen }: { sites: MapSite[]; onOpen(id: string): void }) {
  const { t } = useApp();
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [coords, setCoords] = useState<string>("");
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!el.current) return;
    setFailed(false);
    let m: maplibregl.Map;
    try {
      m = new maplibregl.Map({
        container: el.current,
        style: {
          version: 8,
          sources: {
            gibs: { type: "raster", tiles: [BASEMAP], tileSize: 256, maxzoom: 8, attribution: "Imagery: NASA GIBS Blue Marble (static composite)" },
          },
          layers: [
            { id: "bg", type: "background", paint: { "background-color": "#0a111f" } },
            { id: "gibs", type: "raster", source: "gibs" },
          ],
        },
        ...HOME,
        maxZoom: 8,
        attributionControl: { compact: true },
      });
    } catch {
      setFailed(true); // WebGL unavailable
      return;
    }
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    m.on("mousemove", (e) => setCoords(`${e.lngLat.lat.toFixed(2)}°, ${e.lngLat.lng.toFixed(2)}°`));
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, [attempt]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    markers.current.forEach((k) => k.remove());
    markers.current = sites.map(({ place, index, rank }) => {
      const known = place.status === "established" || place.status === "documented";
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `${place.name}, ${place.country}. ${index === null ? "No index" : `Index ${index.toFixed(0)}`}`);
      b.style.cssText = `width:26px;height:26px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:none;border:none;padding:0;`;
      const size = rank !== null && rank <= 3 ? 20 : 15;
      // Circle = known site, diamond = candidate. Shape carries the meaning; colour only reinforces it.
      b.innerHTML = `<span style="display:block;width:${size}px;height:${size}px;background:${known ? "#4fc3a1" : "#e6b34d"};border:2px solid #06111f;box-shadow:0 0 0 1.5px #fff;${known ? "border-radius:50%" : "transform:rotate(45deg)"};font:600 10px/1 sans-serif;color:#06111f;display:flex;align-items:center;justify-content:center"><span style="${known ? "" : "transform:rotate(-45deg)"}">${rank !== null && rank <= 3 ? rank : ""}</span></span>`;
      const popup = new maplibregl.Popup({ offset: 14, closeButton: false }).setHTML(
        `<strong>${place.name}</strong><br><span style="opacity:.75">${place.country ?? ""}</span><br>${index === null ? "No index (insufficient data)" : `Similarity index ${index.toFixed(0)} / 100`}`,
      );
      const mk = new maplibregl.Marker({ element: b }).setLngLat([place.lon, place.lat]).setPopup(popup).addTo(m);
      b.addEventListener("mouseenter", () => popup.addTo(m));
      b.addEventListener("mouseleave", () => popup.remove());
      b.addEventListener("focus", () => popup.addTo(m));
      b.addEventListener("blur", () => popup.remove());
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        onOpen(place.id);
      });
      return mk;
    });
  }, [sites, onOpen, attempt]);

  return (
    <div className="card overflow-hidden">
      <div className="relative h-[340px] md:h-[440px]">
        <div ref={el} className="h-full w-full" />
        {failed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-panel-2 text-sm">
            <p>{t("load_failed")}</p>
            <button type="button" className="btn" onClick={() => setAttempt((a) => a + 1)}>
              {t("retry")}
            </button>
          </div>
        )}
        <button type="button" className="btn absolute left-2 top-2" onClick={() => map.current?.flyTo(HOME)}>
          {t("reset_map")}
        </button>
        {coords && <div className="absolute bottom-2 left-2 rounded bg-black/65 px-2 py-0.5 font-mono text-[11px] text-white">{coords}</div>}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line px-3 py-2 text-xs">
        <span className="label">{t("legend")}</span>
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="5" fill="#4fc3a1" stroke="#fff" /></svg>
          {t("legend_known")}
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12" aria-hidden="true"><rect x="2" y="2" width="8" height="8" transform="rotate(45 6 6)" fill="#e6b34d" stroke="#fff" /></svg>
          {t("legend_new")}
        </span>
        <span className="text-muted">1–3 = top ranked</span>
      </div>
    </div>
  );
}
