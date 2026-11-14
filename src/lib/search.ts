import type { Place } from "./types";

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Every searchable word about a place: name, country, category, summary and documented characteristics. */
const placeText = (p: Place) =>
  fold(
    [p.name, p.country ?? "", p.category, p.summary, ...Object.values(p.attributes).flatMap((s) => s?.tags ?? [])]
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
