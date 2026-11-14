// node pipeline/flatten-segments.mjs [outDir]  (runs after `next build`)
// The static export writes prefetch segments as out/discover/__next.discover/__PAGE__.txt, but the
// client requests out/discover/__next.discover.__PAGE__.txt. Plain static hosts then answer 404 and
// every link falls back to a full page load. This copies each segment file to its dotted name too.
import assert from "node:assert/strict";
import { copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

export function dottedTargets(root) {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (!statSync(p).isDirectory()) continue;
      if (name.startsWith("__next.")) {
        const files = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? files(join(d, n)) : [join(d, n)]));
        for (const f of files(p)) out.push([f, join(dir, `${name}.${relative(p, f).split(sep).join(".")}`)]);
      } else walk(p);
    }
  };
  walk(root);
  return out;
}

const root = process.argv[2] ?? "out";
if (existsSync(root)) {
  const pairs = dottedTargets(root);
  for (const [from, to] of pairs) copyFileSync(from, to);
  // Self-check: the Discover page segment must now exist under the name the client requests.
  if (existsSync(join(root, "discover", "__next.discover"))) assert.ok(existsSync(join(root, "discover", "__next.discover.__PAGE__.txt")));
  console.log(`flatten-segments: ${pairs.length} segment files copied to dotted names`);
}
