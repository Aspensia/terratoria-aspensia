"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { sfx } from "@/lib/audio";
import { useApp } from "./AppState";

export interface ViewerImage {
  src: string;
  alt: string;
  caption: ReactNode;
  pixelated?: boolean;
}

const MIN = 1;
const MAX = 12;

/** Full-screen image viewer: wheel or buttons to zoom toward a point, drag to pan, Esc to close. */
export function Lightbox({ image, onClose }: { image: ViewerImage; onClose(): void }) {
  const { t } = useApp();
  const stage = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const [view, setView] = useState({ s: 1, x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const close = useRef(onClose);
  close.current = onClose;

  // Zoom keeping the point under (cx, cy) fixed; clamp so the image cannot be dragged fully away.
  const zoomAt = useCallback((factor: number, cx = 0, cy = 0) => {
    setView((v) => {
      const s = Math.min(MAX, Math.max(MIN, v.s * factor));
      const k = s / v.s;
      return s === 1 ? { s, x: 0, y: 0 } : { s, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k };
    });
  }, []);

  useEffect(() => {
    sfx("open");
    closeBtn.current?.focus();
    const prev = document.activeElement as HTMLElement | null;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
      if (e.key === "+" || e.key === "=") zoomAt(1.4);
      if (e.key === "-") zoomAt(1 / 1.4);
      if (e.key === "0") setView({ s: 1, x: 0, y: 0 });
    };
    window.addEventListener("keydown", key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      sfx("close");
      prev?.focus?.();
    };
  }, [zoomAt]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault(); // non-passive so the page does not scroll under the viewer
      const r = el.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2);
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [zoomAt]);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={image.alt} className="fixed inset-0 z-[100] flex flex-col bg-[rgba(2,5,12,0.94)] backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2">
        <div className="flex items-center gap-2">
          <button type="button" className="btn" onClick={() => zoomAt(1 / 1.4)} aria-label={t("zoom_out")}>−</button>
          <span className="w-14 text-center font-mono text-sm tabular-nums">{Math.round(view.s * 100)}%</span>
          <button type="button" className="btn" onClick={() => zoomAt(1.4)} aria-label={t("zoom_in")}>+</button>
          <button type="button" className="btn" onClick={() => setView({ s: 1, x: 0, y: 0 })}>{t("reset_view")}</button>
        </div>
        <button ref={closeBtn} type="button" className="btn" onClick={onClose}>
          {t("close")} ✕
        </button>
      </div>
      <div
        ref={stage}
        className="relative flex-1 touch-none select-none overflow-hidden"
        style={{ cursor: view.s > 1 ? (drag.current ? "grabbing" : "grab") : "zoom-in" }}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (d && view.s > 1) setView((v) => ({ ...v, x: d.vx + e.clientX - d.x, y: d.vy + e.clientY - d.y }));
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          // A click without a drag zooms in at that point.
          if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 4 && view.s < MAX) {
            const r = stage.current!.getBoundingClientRect();
            zoomAt(2, e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2);
          }
        }}
        onDoubleClick={() => setView({ s: 1, x: 0, y: 0 })}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, arbitrary data URLs */}
        <img
          src={image.src}
          alt={image.alt}
          draggable={false}
          className="absolute left-1/2 top-1/2 max-h-[calc(100%-2rem)] max-w-[calc(100%-2rem)]"
          style={{
            transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${view.s})`,
            transition: drag.current ? "none" : "transform 0.18s ease-out",
            imageRendering: image.pixelated && view.s > 3 ? "pixelated" : "auto",
          }}
        />
      </div>
      <div className="border-t border-line px-4 py-3 text-sm text-muted">{image.caption}</div>
    </div>,
    document.body,
  );
}

/** A thumbnail that opens the viewer. */
export function ZoomableImage({ image, className = "" }: { image: ViewerImage; className?: string }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`group relative block overflow-hidden rounded-lg border border-line ${className}`} aria-label={`${t("view_image")}: ${image.alt}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
        <img src={image.src} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        <span className="absolute bottom-2 right-2 rounded bg-black/65 px-1.5 py-0.5 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          ⤢ {t("view_image")}
        </span>
      </button>
      {open && <Lightbox image={image} onClose={() => setOpen(false)} />}
    </>
  );
}
