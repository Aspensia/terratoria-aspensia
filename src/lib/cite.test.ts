import { expect, test } from "vitest";
import { R } from "../data/references";
import { cite } from "./cite";

test("APA in-text citations for one, two and many authors, and for organisations", () => {
  expect(cite("phinney2015")).toBe("Phinney, 2015");
  expect(cite("lee2005")).toBe("Lee & Osinski, 2005");
  expect(cite("paige2010")).toBe("Paige et al., 2010");
  expect(cite("nasa2020")).toBe("National Aeronautics and Space Administration, 2020");
  expect(cite("vankranendonk2008")).toBe("Van Kranendonk et al., 2008");
});

test("every reference produces a citation that starts with the first author's surname and ends with its year", () => {
  for (const k of Object.keys(R) as (keyof typeof R)[]) {
    const c = cite(k);
    expect(c, k).toMatch(/, (\d{4}|n\.d\.)$/);
    expect(R[k].startsWith(c.split(/,| &| et al\./)[0]), k).toBe(true);
  }
});
