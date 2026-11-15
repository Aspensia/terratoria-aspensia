// Flashcards for Mission Challenge, built from the catalogue and the same scores as the rankings.
// Earth site cards ask which Moon or Mars region the site stands in for; region cards ask for the best Earth stand-in.
import { EARTH_SITES, REFERENCES } from "../data/catalog";
import { local, tagLabel } from "../data/km";
import { BALANCED } from "../data/presets";
import type { Text } from "./challenge";
import { DIMENSION_LABEL, type Lang } from "./i18n";
import { aggregate, scoreAll } from "./scoring";
import type { Body, Place } from "./types";

export interface Flashcard {
  id: string;
  body: Body;
  /** Shown on the front: the place and the question. */
  title: Text;
  question: Text;
  /** Shown on the back. */
  answer: Text;
  detail: Text;
}

const BODY: Record<Body, Text> = {
  earth: { en: "Earth", km: "ផែនដី" },
  moon: { en: "the Moon", km: "ព្រះច័ន្ទ" },
  mars: { en: "Mars", km: "ភពអង្គារ" },
};
const kmDigits = (s: string) => s.replace(/[0-9]/g, (d) => "០១២៣៤៥៦៧៨៩"[+d]);
const both = (f: (l: Lang) => string): Text => ({ en: f("en"), km: f("km") });
const index = (ref: Place, site: Place) => aggregate(scoreAll(ref, site), BALANCED).index;

function siteCard(site: Place): Flashcard | null {
  const ranked = REFERENCES.map((ref) => ({ ref, score: index(ref, site) }))
    .filter((r): r is { ref: Place; score: number } => r.score !== null)
    .sort((a, b) => b.score - a.score);
  if (!ranked.length) return null;
  const { ref, score } = ranked[0];
  const top = scoreAll(ref, site)
    .filter((d) => d.score !== null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 2);
  const tags = [...(site.attributes.geology?.tags ?? []), ...(site.attributes.subsurface?.tags ?? [])].slice(0, 3);
  return {
    id: site.id,
    body: "earth",
    title: both((l) => local(site, l).name),
    question: both((l) => (l === "km" ? "តើវាជាទីតាំងស្រដៀងល្អបំផុតសម្រាប់តំបន់ណានៃព្រះច័ន្ទ ឬភពអង្គារ?" : "Which Moon or Mars region is it the best stand-in for?")),
    answer: both((l) =>
      l === "km"
        ? `${local(ref, l).name} (${BODY[ref.body].km}) · ពិន្ទុ ${kmDigits(String(Math.round(score)))}`
        : `${local(ref, l).name} (${BODY[ref.body].en}) · score ${Math.round(score)}`,
    ),
    detail: both((l) => {
      const dims = top.map((d) => DIMENSION_LABEL[l][d.id]).join(l === "km" ? " និង " : " and ");
      const traits = tags.map((t) => tagLabel(t, l)).join(l === "km" ? ", " : ", ");
      return l === "km"
        ? `ស្រដៀងខ្លាំងបំផុតក្នុង ${dims}។${traits ? ` លក្ខណៈ៖ ${traits}។` : ""}`
        : `Most alike in ${dims.toLowerCase()}.${traits ? ` Traits: ${traits}.` : ""}`;
    }),
  };
}

function refCard(ref: Place): Flashcard | null {
  const ranked = EARTH_SITES.map((site) => ({ site, score: index(ref, site) }))
    .filter((r): r is { site: Place; score: number } => r.score !== null)
    .sort((a, b) => b.score - a.score);
  if (ranked.length < 2) return null;
  const [first, second] = ranked;
  return {
    id: ref.id,
    body: ref.body,
    title: both((l) => local(ref, l).name),
    question: both((l) => (l === "km" ? `តើទីតាំងផែនដីណាស្រដៀងនឹងតំបន់នេះលើ${BODY[ref.body].km}ជាងគេ?` : `Which Earth site is most like this region of ${BODY[ref.body].en}?`)),
    answer: both((l) =>
      l === "km" ? `${local(first.site, l).name} · ពិន្ទុ ${kmDigits(String(Math.round(first.score)))}` : `${local(first.site, l).name} · score ${Math.round(first.score)}`,
    ),
    detail: both((l) =>
      l === "km"
        ? `លេខ ២៖ ${local(second.site, l).name} (${kmDigits(String(Math.round(second.score)))})។ ${local(first.site, l).category}។`
        : `Runner-up: ${local(second.site, l).name} (${Math.round(second.score)}). ${local(first.site, l).category}.`,
    ),
  };
}

export function makeFlashcards(): Flashcard[] {
  return [...REFERENCES.map(refCard), ...EARTH_SITES.map(siteCard)].filter((c): c is Flashcard => c !== null);
}
