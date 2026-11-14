import { R, type RefKey } from "../data/references";

/** APA 7 in-text citation from a reference entry: "Phinney, 2015", "Lee & Osinski, 2005", "Paige et al., 2010". */
export function cite(key: RefKey): string {
  const ref: string = R[key];
  const year = ref.match(/ \((\d{4}|n\.d\.)\)\./)![1];
  const authors = ref.slice(0, ref.indexOf(` (${year}).`));
  if (!/, [A-Z]\./.test(authors)) return `${authors.replace(/\.$/, "")}, ${year}`; // organisation as author
  // Split before each "Surname, I." that follows ", " (optionally "& ").
  const people = authors.split(/, (?=(?:& )?[^,]+, [A-Z]\.)/).map((a) => a.replace(/^& /, "").split(",")[0]);
  if (people.length === 1) return `${people[0]}, ${year}`;
  if (people.length === 2) return `${people[0]} & ${people[1]}, ${year}`;
  return `${people[0]} et al., ${year}`;
}
