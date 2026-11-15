"use client";

import { useEffect, useRef } from "react";
import arrow from "@/app/cursor/cursor.svg";
import pointer from "@/app/cursor/cursor-pointer.svg";

const src = (m: unknown) => (typeof m === "string" ? m : (m as { src: string }).src);
const CLICKABLE = "a[href], button, [role=button], summary, select, label, input[type=range], input[type=checkbox], input[type=radio], .cursor-pointer";
const TYPING = "input:not([type=range]):not([type=checkbox]):not([type=radio]):not([type=button]), textarea, [contenteditable=true]";

/**
 * Animated Aspensia cursor for mouse and trackpad users: it tilts and fills with blue and red over
 * anything clickable, squeezes on press, and a blue-red ring trails behind it.
 * Touch screens and text fields keep the system cursor; the static SVG cursor in globals.css is the fallback.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const d = dot.current, r = ring.current;
    if (!d || !r) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;
    root.classList.add("has-cursor");

    let x = -100, y = -100, rx = -100, ry = -100, frame = 0;
    // The ring eases toward the pointer; the loop stops once it has caught up.
    const step = () => {
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      r.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      frame = Math.abs(x - rx) + Math.abs(y - ry) > 0.3 ? requestAnimationFrame(step) : 0;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      x = e.clientX;
      y = e.clientY;
      d.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (d.dataset.state === "hidden") d.dataset.state = "";
      if (calm) return;
      if (!frame) frame = requestAnimationFrame(step);
    };
    const over = (e: PointerEvent) => {
      const t = e.target as Element;
      d.dataset.state = t.closest?.(TYPING) ? "text" : t.closest?.(CLICKABLE) ? "hover" : "";
      r.dataset.state = d.dataset.state;
    };
    const down = () => {
      d.dataset.press = "1";
      r.classList.remove("is-burst");
      void r.offsetWidth; // restart the burst animation
      r.classList.add("is-burst");
    };
    const up = () => delete d.dataset.press;
    const leave = () => (d.dataset.state = "hidden");

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      root.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <>
      <div ref={ring} aria-hidden="true" className="cursor-ring" />
      <div ref={dot} aria-hidden="true" className="cursor-dot" data-state="hidden">
        <span className="cursor-art">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny local SVGs, no optimiser in a static export */}
          <img src={src(arrow)} alt="" width={27} height={34} className="cursor-a" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src(pointer)} alt="" width={27} height={34} className="cursor-b" />
        </span>
      </div>
    </>
  );
}
