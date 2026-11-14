"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ReactLenis, useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

// The 3D globes, terrain, the map and the image viewer own their wheel and touch gestures; Lenis leaves them alone.
const ownsGestures = (node: HTMLElement) =>
  node.tagName === "CANVAS" || node.classList.contains("maplibregl-map") || node.getAttribute("aria-modal") === "true";

const OPTIONS = { lerp: 0.11, anchors: true, allowNestedScroll: true, prevent: ownsGestures };

/** Keeps ScrollTrigger in step with Lenis, and starts every new page at the top without gliding there. */
function Sync() {
  const lenis = useLenis(ScrollTrigger.update);
  const path = usePathname();
  useEffect(() => {
    lenis?.resize();
    lenis?.scrollTo(0, { immediate: true, force: true });
    ScrollTrigger.refresh();
  }, [lenis, path]);
  return null;
}

/** Lenis smooth scrolling for the whole site. */
export function SmoothScroll() {
  return (
    <ReactLenis root options={OPTIONS}>
      <Sync />
    </ReactLenis>
  );
}
