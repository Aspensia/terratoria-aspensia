// Small visual effects: button ripples and a confetti burst. Skipped when the user prefers reduced motion.

const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Ripple from the pointer position inside a button. */
export function ripple(btn: HTMLElement, clientX: number, clientY: number) {
  if (still()) return;
  const r = btn.getBoundingClientRect();
  const dot = document.createElement("span");
  dot.className = "ripple";
  dot.style.left = `${clientX - r.left}px`;
  dot.style.top = `${clientY - r.top}px`;
  btn.appendChild(dot);
  setTimeout(() => dot.remove(), 650);
}

const COLORS = ["#6cc4ff", "#8b7cff", "#4fc3a1", "#f2c94c", "#e07ad0", "#f2a36b"];

/** Confetti burst from a screen point. */
export function confetti(x: number, y: number, count = 28) {
  if (still()) return;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = "confetti";
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 120;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.background = COLORS[i % COLORS.length];
    p.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    p.style.setProperty("--dy", `${Math.sin(angle) * dist + 80}px`); // drift down a little, like falling
    p.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }
}
