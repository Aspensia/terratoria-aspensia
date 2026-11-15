"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FACTS } from "@/data/facts";
import { useApp } from "./AppState";

const MIN_VISIBLE = 1100; // long enough to read a short fact; the new page loads underneath meanwhile

/** Page-change loader: a short orbit animation and a random space fact while the next page loads. */
export function RouteLoader() {
  const { tx, lang } = useApp();
  const path = usePathname();
  const [fact, setFact] = useState<number | null>(null);
  const shownAt = useRef(0);
  const timers = useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Start on any same-site link click that goes to another page.
  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      clear();
      // Shown synchronously, so even an instant (prefetched) page change gets the transition.
      shownAt.current = performance.now();
      setFact(Math.floor(Math.random() * FACTS.length));
      timers.current.push(window.setTimeout(() => setFact(null), 8000)); // never get stuck
    };
    // Capture phase: Next.js links cancel the click (to route themselves) before it would bubble here.
    document.addEventListener("click", click, true);
    return () => document.removeEventListener("click", click, true);
  }, []);

  // The new page has rendered: finish.
  useEffect(() => {
    clear();
    if (!shownAt.current) return;
    const wait = Math.max(0, MIN_VISIBLE - (performance.now() - shownAt.current));
    shownAt.current = 0;
    timers.current.push(window.setTimeout(() => setFact(null), wait));
  }, [path]);

  if (fact === null) return null;
  const f = FACTS[fact];
  return (
    <div className="route-loader" role="status" aria-live="polite">
      <div className="route-card">
        <span className="route-orbit" aria-hidden="true">
          <span className="route-planet" />
          <span className="route-moon" />
        </span>
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent">{tx("Loading · Did you know?", "កំពុងផ្ទុក · តើអ្នកដឹងទេ?")}</p>
        <p className="mt-2 text-lg leading-snug">{lang === "km" ? f.km : f.en}</p>
      </div>
      <span className="route-bar" aria-hidden="true" />
    </div>
  );
}
