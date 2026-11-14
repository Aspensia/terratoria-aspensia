import type { Place } from "./types";
import { local, TAG_KM } from "../data/km";

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Every searchable word about a place: name, country, category, summary and documented characteristics. */
const placeText = (p: Place) =>
  fold(
    [
      p.name, p.country ?? "", p.category, p.summary,
      ...Object.values(p.attributes).flatMap((s) => s?.tags ?? []),
      // Khmer text too, so a Khmer keyword finds the same places.
      ...Object.values(local(p, "km")).filter((v): v is string => typeof v === "string"),
      ...Object.values(p.attributes).flatMap((s) => (s?.tags ?? []).map((t) => TAG_KM[t] ?? "")),
    ]
      .join(" ")
      .replace(/_/g, " "),
  );

/** True when every keyword starts a word somewhere in the place's text. */
export function matchesKeywords(p: Place, query: string): boolean {
  const text = placeText(p);
  return fold(query)
    .split(/[\s,]+/)
    .filter(Boolean)
    .every((term) => new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(text));
}
