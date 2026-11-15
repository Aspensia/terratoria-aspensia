"use client";

// Motion layer in the spirit of React Bits (Spotlight Card, Magnet, Count Up), written on GSAP.
// Every effect rests in its final state under prefers-reduced-motion.

import { gsap } from "gsap";
import { useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const calm = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Page entrance: the page's top-level blocks stagger in once and the h1 wipes in.
 */
export function usePageEnter(root: RefObject<HTMLElement | null>, key: string) {
  useIso(() => {
    const el = root.current;
    if (!el || calm()) return;
    const ctx = gsap.context(() => {
      const page = el.firstElementChild;
      const blocks = page ? Array.from(page.children).filter((b) => !b.hasAttribute("data-own-enter")).slice(0, 8) : [];
      const h1 = el.querySelector("h1:not(.hero-title)");
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from(blocks, { autoAlpha: 0, y: 28, duration: 0.9, stagger: 0.08, clearProps: "transform,opacity,visibility" });
      // Clip reveal on the whole heading: splitting it would replace text nodes React still owns.
      if (h1 && !h1.querySelector("[data-split]"))
        tl.from(h1, { clipPath: "inset(0 100% 0 0)", x: -12, duration: 1.1, ease: "power4.out", clearProps: "clipPath,transform" }, 0.1);
    }, el);
    return () => ctx.revert();
  }, [key]);
}

/** One delegated listener feeds every card its pointer position, for the spotlight and border glow in CSS. */
export function useSpotlight() {
  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;
    const onMove = (e: PointerEvent) => {
      const card = (e.target as Element | null)?.closest?.(".card");
      if (!(card instanceof HTMLElement)) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);
}

/** A focal button that leans toward the pointer, clamped so it never leaves its hit box. */
export function Magnet({ children, strength = 0.28 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || calm() || window.matchMedia("(hover: none)").matches) return;
    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "elastic.out(1, 0.45)" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "elastic.out(1, 0.45)" });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * strength);
      yTo((e.clientY - r.top - r.height / 2) * strength);
    };
    const leave = () => (xTo(0), yTo(0));
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => (el.removeEventListener("pointermove", move), el.removeEventListener("pointerleave", leave));
  }, [strength]);
  return (
    <span ref={ref} className="inline-flex will-change-transform">
      {children}
    </span>
  );
}

/** Counts up to a real figure once on load. The final number is in the markup, so it reads right without script. */
export function CountUp({ to, delay = 0 }: { to: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || calm()) return;
    const n = { v: 0 };
    const tw = gsap.to(n, { v: to, duration: 1.6, delay, ease: "power3.out", onUpdate: () => void (el.textContent = String(Math.round(n.v))) });
    return () => void (tw.kill(), (el.textContent = String(to)));
  }, [to, delay]);
  return <span ref={ref}>{to}</span>;
}

/** The glowing pill that slides under the active main-menu link. */
export function useNavPill(list: RefObject<HTMLUListElement | null>, pill: RefObject<HTMLElement | null>, key: string) {
  useEffect(() => {
    const ul = list.current;
    const p = pill.current;
    if (!ul || !p) return;
    const place = (instant: boolean) => {
      const a = ul.querySelector<HTMLElement>("[aria-current='page']");
      if (!a) return gsap.to(p, { autoAlpha: 0, duration: 0.2 });
      const vars = { x: a.offsetLeft, width: a.offsetWidth, autoAlpha: 1 };
      return instant || calm() ? gsap.set(p, vars) : gsap.to(p, { ...vars, duration: 0.6, ease: "expo.out" });
    };
    place(!p.dataset.placed);
    p.dataset.placed = "1";
    // Watch every link, not just the list: a language switch (and the Khmer web font arriving
    // a moment later) changes link widths without changing the list's own size.
    const ro = new ResizeObserver(() => place(true));
    ro.observe(ul);
    ul.querySelectorAll("a").forEach((a) => ro.observe(a));
    document.fonts?.ready.then(() => place(true));
    return () => ro.disconnect();
  }, [list, pill, key]);
}

/** A thin bar under the header that fills as the page is read. */
export function ScrollProgress() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = gsap.quickSetter(el, "scaleX");
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      set(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => (window.removeEventListener("scroll", onScroll), window.removeEventListener("resize", onScroll));
  }, []);
  return <span ref={ref} aria-hidden="true" className="scroll-progress" />;
}
