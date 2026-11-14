import { BALANCED } from "../data/presets";
import { DIMENSIONS, type Weights } from "./types";

type Store = { getItem(key: string): string | null; setItem(key: string, value: string): void };
const KEY = "terratoria.saved";

/** Saved site ids. Never throws: blocked, missing or corrupt storage reads as empty. */
export function readSaved(store: Store | undefined, validIds: string[]): string[] {
  try {
    const parsed: unknown = JSON.parse(store?.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string" && validIds.includes(v)) : [];
  } catch {
    return [];
  }
}

export function writeSaved(store: Store | undefined, ids: string[]): void {
  try {
    store?.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Private mode or blocked storage: saving is a convenience, so carry on without it.
  }
}

export const toggleId = (ids: string[], id: string): string[] =>
  ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];

export const serializeWeights = (w: Weights): string => DIMENSIONS.map((d) => w[d]).join(",");

export function parseWeights(s: string | null | undefined): Weights {
  const parts = (s ?? "").split(",").map(Number);
  if (parts.length !== DIMENSIONS.length || parts.some((n) => !Number.isFinite(n))) return { ...BALANCED };
  return Object.fromEntries(DIMENSIONS.map((d, i) => [d, Math.min(100, Math.max(0, Math.round(parts[i])))])) as Weights;
}
