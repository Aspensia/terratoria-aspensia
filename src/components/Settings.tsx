"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useApp, VISIONS, type Perf, type Vision } from "./AppState";

const VISION_LABEL: Record<Vision, [string, string]> = {
  default: ["Standard colours", "ពណ៌ធម្មតា"],
  protanopia: ["Protanopia (no red)", "Protanopia (មើលមិនឃើញពណ៌ក្រហម)"],
  protanomaly: ["Protanomaly (weak red)", "Protanomaly (ខ្សោយពណ៌ក្រហម)"],
  deuteranopia: ["Deuteranopia (no green)", "Deuteranopia (មើលមិនឃើញពណ៌បៃតង)"],
  deuteranomaly: ["Deuteranomaly (weak green)", "Deuteranomaly (ខ្សោយពណ៌បៃតង)"],
  tritanopia: ["Tritanopia (no blue)", "Tritanopia (មើលមិនឃើញពណ៌ខៀវ)"],
  tritanomaly: ["Tritanomaly (weak blue)", "Tritanomaly (ខ្សោយពណ៌ខៀវ)"],
  achromatopsia: ["Achromatopsia (no colour)", "Achromatopsia (មើលមិនឃើញពណ៌)"],
  achromatomaly: ["Achromatomaly (weak colour)", "Achromatomaly (ខ្សោយពណ៌ទាំងអស់)"],
};

function Gear() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="gear-icon">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
    </svg>
  );
}

/** Gear button and panel: Base / Lite Mode, volume and colour vision. */
export function Settings() {
  const { tx, perf, setPerf, volume, setVolume, muted, setMuted, vision, setVision, lang } = useApp();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => (document.removeEventListener("pointerdown", away), document.removeEventListener("keydown", esc));
  }, [open]);

  const modes: { id: Perf; name: string; hint: string }[] = [
    { id: "base", name: "Base Mode", hint: tx("Full quality: sharp textures, bloom, every star.", "គុណភាពពេញលេញ៖ រូបភាពច្បាស់ ពន្លឺភ្លឺ និងផ្កាយទាំងអស់។") },
    { id: "lite", name: "Lite Mode", hint: tx("Uses far less memory for older phones and laptops. Same lessons, same data.", "ប្រើអង្គចងចាំតិចជាងច្រើន សម្រាប់ទូរស័ព្ទ និងកុំព្យូទ័រចាស់ៗ។ មេរៀន និងទិន្នន័យដដែល។") },
  ];

  return (
    <div ref={box} className="relative">
      <button type="button" className="btn" aria-expanded={open} aria-controls={id} aria-label={tx("Settings", "ការកំណត់")} title={tx("Settings", "ការកំណត់")} onClick={() => setOpen(!open)}>
        <Gear />
      </button>
      {open && (
        <div id={id} role="dialog" aria-label={tx("Settings", "ការកំណត់")} className="settings-panel card">
          <p className="label">{tx("Settings", "ការកំណត់")}</p>

          <fieldset className="mt-3">
            <legend className="text-sm font-semibold">{tx("Performance", "ដំណើរការ")}</legend>
            <div className="mt-2 grid gap-2">
              {modes.map((m) => (
                <label key={m.id} className={`settings-option ${perf === m.id ? "is-on" : ""}`}>
                  <input type="radio" name="perf" className="sr-only" checked={perf === m.id} onChange={() => setPerf(m.id)} />
                  <span className="block font-semibold">{m.name}</span>
                  <span className="block text-xs text-muted">{m.hint}</span>
                </label>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-muted">{tx("Switching reloads the page.", "ការប្តូរនឹងផ្ទុកទំព័រឡើងវិញ។")}</p>
          </fieldset>

          <div className="mt-4">
            <label htmlFor={`${id}-vol`} className="flex items-center justify-between text-sm font-semibold">
              {tx("Volume", "កម្រិតសំឡេង")}
              <span className="font-mono text-xs text-muted">{muted ? tx("muted", "បិទសំឡេង") : `${Math.round(volume * 100)}%`}</span>
            </label>
            <input
              id={`${id}-vol`}
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(e) => {
                setVolume(Number(e.target.value) / 100);
                if (muted) setMuted(false);
              }}
              className="mt-2 w-full"
            />
          </div>

          <div className="mt-4">
            <label htmlFor={`${id}-cv`} className="text-sm font-semibold">
              {tx("Colour vision", "ការមើលឃើញពណ៌")}
            </label>
            <select id={`${id}-cv`} className="btn mt-2 w-full" value={vision} onChange={(e) => setVision(e.target.value as Vision)}>
              {VISIONS.map((v) => (
                <option key={v} value={v}>
                  {VISION_LABEL[v][lang === "km" ? 1 : 0]}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-muted">{tx("Changes map, chart and marker colours to ones you can tell apart.", "ប្តូរពណ៌ផែនទី គំនូសតាង និងសញ្ញាសម្គាល់ ទៅជាពណ៌ដែលអ្នកអាចបែងចែកបាន។")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
