# AnalogAtlas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static web app that ranks Earth sites as analogues of chosen Moon/Mars reference regions using an explainable, weighted, multi-dimension similarity index built on real open data.

**Architecture:** Node scripts in `pipeline/` reduce open elevation and climate data to committed JSON in `src/data/generated/`. A Next.js static export reads that JSON plus a hand-curated, cited catalogue and does all scoring in the browser with pure functions in `src/lib/`. No server.

**Tech Stack:** Node 26, Next.js (App Router, `output: 'export'`), TypeScript, Tailwind, MapLibre GL JS, Recharts, Vitest, `geotiff` (pipeline only).

**Spec:** `docs/superpowers/specs/2026-11-14-analogatlas-design.md`

## Global Constraints

- Open-access data only; no credentials anywhere.
- No invented values: every number is pipeline output or carries a citation.
- Score is named "Exploratory Analogue Similarity Index"; never "probability".
- Missing data lowers coverage, never the score. No aggregate below 3 valid dimensions.
- All DEMs resampled to a 463 m baseline over a 60 km window before metrics.
- English default; Khmer toggle for navigation, buttons, short explanations.
- No NASA logos or mission badges; no AI-generated images.
- AI-use notice in README, About page and `package.json` description.
- Scoring code imports nothing from React or the UI.

## Review Focus

1. All weights set to zero → index is `null` with a "set at least one weight" state, never `NaN`.
2. DEM windows containing nodata (ocean, voids, missing tiles) → those cells are excluded; a window with <50% valid cells yields no terrain metrics rather than wrong ones.
3. A shared URL with an unknown site or region id → a clear not-found state with a link back, not a crash.
4. `localStorage` unavailable or holding stale ids → page renders, saved list is empty, stale ids are ignored.
5. A reference region and site sharing no literature tags for a dimension → score 0 with quality intact (a real mismatch), distinct from a dimension with no data on either side (unknown).

---

## File Structure

```
pipeline/
  lib/terrain.mjs        window grid → TerrainMetrics (pure)
  lib/terrain.test.mjs
  lib/fetch-dem.mjs      earth/mars/moon window readers via HTTP range
  targets.mjs            ids, coordinates, product choice for every place
  run-terrain.mjs        writes src/data/generated/terrain.json
  run-climate.mjs        writes src/data/generated/climate.json (NASA POWER)
src/
  data/generated/*.json  pipeline output (committed)
  data/catalog.ts        places: names, tags, citations, status, use cases
  data/datasets.ts       provenance records for every product
  data/presets.ts        six weight presets
  lib/types.ts
  lib/scoring.ts         dimension scores, aggregate, explanations
  lib/scoring.test.ts
  lib/i18n.ts            en/km strings
  lib/storage.ts         saved sites (guarded localStorage)
  components/…           Map, WeightPanel, RankList, DimensionBars,
                         ProfileChart, SlopeChart, ProvenancePanel, Shell
  app/page.tsx           Discover
  app/site/page.tsx      Site profile (?id=&ref=)
  app/compare/page.tsx   Compare (?ref=&sites=a,b,c)
  app/methods/page.tsx   Data and Methods
  app/about/page.tsx
README.md  SUBMISSION.md
```

Query-string routes keep the static export simple and URLs shareable.

---

### Task 1: Scaffold and scoring engine

**Files:** Create `package.json`, Next/Tailwind/Vitest config, `src/lib/types.ts`, `src/lib/scoring.ts`, `src/lib/scoring.test.ts`.

**Interfaces — Produces:**

```ts
export type Body = 'earth' | 'moon' | 'mars';
export type DimensionId =
  | 'terrain' | 'geology' | 'thermal' | 'water_ice'
  | 'dust_wind' | 'biology' | 'subsurface' | 'operations';
export const DIMENSIONS: DimensionId[];

export interface TerrainMetrics {
  windowKm: number; baselineM: number; validFraction: number;
  slopeBinsDeg: number[];      // edges [0,2,5,10,15,20,30,90]
  slopeHist: number[];         // 7 fractions summing to 1
  slopeMedianDeg: number; slopeP90Deg: number;
  reliefM: number;             // p98 − p2 elevation
  roughnessM: number;          // std of elevation minus 5×5 mean
  hypsometricIntegral: number; // (mean − min)/(max − min)
  profile: { distKm: number[]; elevM: number[] }; // W–E through centre, relative to mean
}
export interface Climate {
  meanK: number; maxK: number; minK: number;
  windMs?: number;
  basis: 'measured' | 'literature'; cite: string;
}
export interface TagSet { tags: string[]; cites: string[]; note?: string }
export interface Place {
  id: string; body: Body; name: string; lat: number; lon: number;
  country?: string; category: string; summary: string;
  status?: 'established' | 'documented' | 'candidate' | 'unverified';
  statusCite?: string;
  terrain?: TerrainMetrics; climate?: Climate;
  attributes: Partial<Record<DimensionId, TagSet>>;
  useCases?: { title: string; because: DimensionId[] }[];
  differences?: string[];
}
export interface DimensionResult {
  id: DimensionId; score: number | null; quality: number;
  basis: 'measured' | 'literature' | 'mixed' | 'none';
  method: string; evidence: string[];
}
export interface Aggregate { index: number | null; coverage: number; valid: number }
export type Weights = Record<DimensionId, number>; // 0–100

export function scoreDimension(id: DimensionId, ref: Place, site: Place): DimensionResult;
export function scoreAll(ref: Place, site: Place): DimensionResult[];
export function aggregate(results: DimensionResult[], w: Weights): Aggregate;
export function explain(results: DimensionResult[]): {
  strong: DimensionResult[]; moderate: DimensionResult[];
  weak: DimensionResult[]; unknown: DimensionResult[] };
```

Scoring rules (the spec leaves these to the builder; fixed here):
- **terrain** (quality 1.0 × min validFraction): mean of four parts, each 0–100: slope histogram overlap `100·(1 − ½·Σ|a−b|)`; relief `100·min/max`; roughness `100·min/max`; hypsometric `100·(1 − |a−b|)`.
- **thermal**: `100·exp(−|Δmean|/60)` and `100·exp(−|Δrange|/80)` averaged (K; range = max − min). Quality 0.9 if both measured, 0.7 if either is literature. Illumination tags, when present on both, blend in at 25% via the tag rule.
- **dust_wind**: tag rule; if both have `windMs`, blend 50% with `100·min/max`.
- **operations**: 50% tag rule, 50% `100·exp(−|Δ slopeP90|/10)` when both have terrain.
- **tag rule** (geology, water_ice, biology, subsurface, and the blends above): `100·|ref∩site| / |ref tags|`, quality 0.6. Either side missing the dimension → `score: null`, `basis: 'none'`.
- `aggregate`: `Σ w·q·s / Σ w·q` over non-null scores with w>0; `coverage` = non-null count / 8; `index` is `null` if valid < 3 or `Σ w·q` = 0.
- `explain`: strong ≥ 70, moderate 40–69, weak < 40, unknown null.

- [ ] **Step 1:** `npx create-next-app@latest . --ts --tailwind --app --src-dir --no-eslint --use-npm --yes`; add `vitest`, `maplibre-gl`, `recharts`; set `output: 'export'`, `images.unoptimized`, `trailingSlash: true`; `git init`.
- [ ] **Step 2: Failing tests** in `scoring.test.ts`:
  - `identical places score 100 on every dimension with data`
  - `missing dimension is null and does not change the index` (index with/without the extra dimension absent is equal)
  - `fewer than three valid dimensions → index null`
  - `all weights zero → index null, not NaN` (Review Focus 1)
  - `no shared tags → score 0, basis literature; one side missing → null` (Review Focus 5)
  - `raising a weight on a dimension where B beats A reorders A and B`
  - `terrain quality scales with validFraction`
- [ ] **Step 3:** Run `npx vitest run` → FAIL (not defined).
- [ ] **Step 4:** Implement `types.ts`, `scoring.ts`.
- [ ] **Step 5:** `npx vitest run` → PASS. Commit.

### Task 2: Terrain pipeline

**Files:** Create `pipeline/lib/terrain.mjs`, `pipeline/lib/terrain.test.mjs`, `pipeline/lib/fetch-dem.mjs`, `pipeline/targets.mjs`, `pipeline/run-terrain.mjs` → `src/data/generated/terrain.json`.

**Interfaces — Produces:**
- `terrainMetrics(grid: Float32Array, n: number, cellM: number): TerrainMetrics | null` — square n×n grid, NaN = nodata; `null` when valid < 50%.
- `readWindow(target): Promise<{grid, n, cellM}>` — samples an n×n grid (n = 130, cell 463 m) centred on the target by local equirectangular offsets, bilinear from source, block-averaging where the source is finer.
  - earth: Copernicus GLO-30 COG via `geotiff.fromUrl` (range requests), 1° tiles `Copernicus_DSM_COG_10_{N|S}dd_00_{E|W}ddd_00_DEM`; a 404 tile = ocean = NaN.
  - mars: MOLA MEGDR 128 px/deg `megtXXnYYYhb.img`, int16 big-endian, no header, HTTP `Range` per row span; radius-relative metres.
  - moon: LOLA GDR — cylindrical `ldem_*` for Marius Hills; polar stereographic product for the south pole (read projection constants from the `.lbl`), int16 little-endian × scaling factor from the label.
- `terrain.json`: `{ [placeId]: TerrainMetrics & { product, url, retrieved } }`.

- [ ] **Step 1: Failing tests** (`node --test pipeline/`):
  - `tilted plane of 10% grade → slopeMedianDeg ≈ 5.71 ±0.05, roughnessM ≈ 0`
  - `flat grid → relief 0, hist[0] = 1`
  - `grid with 60% NaN → null`; `grid with 10% NaN → metrics, validFraction ≈ 0.9` (Review Focus 2)
  - `slopeHist sums to 1`
- [ ] **Step 2:** Run → FAIL. Implement `terrain.mjs` (Horn 3×3 slope). Run → PASS.
- [ ] **Step 3:** Implement `fetch-dem.mjs`; sanity-check each body against a known value before trusting it: Mauna Loa summit ≈ 4170 m; Jezero floor ≈ −2600 m; Shackleton rim-to-floor ≈ 4 km. Print and assert within 10%.
- [ ] **Step 4:** Fill `targets.mjs` (4 reference regions, ~12 Earth sites, coordinates from cited sources); run `node pipeline/run-terrain.mjs`; commit the JSON.

### Task 3: Climate and catalogue

**Files:** Create `pipeline/run-climate.mjs` → `src/data/generated/climate.json`; `src/data/catalog.ts`, `src/data/datasets.ts`, `src/data/presets.ts`; `src/data/catalog.test.ts`.

**Interfaces — Produces:** `PLACES: Place[]` (terrain and climate merged from generated JSON), `getPlace(id): Place | undefined`, `REFERENCES`, `EARTH_SITES`; `DATASETS: Dataset[]` with `{ id, agency, mission, instrument, product, version, resolution, period, level: 'raw'|'processed'|'derived', url, usedFor }`; `PRESETS: { id, name, explain, weights: Weights }[]` — the six named in the spec.

- [ ] **Step 1:** `run-climate.mjs`: NASA POWER climatology point API, parameters `TS,TS_MAX,TS_MIN,WS10M`, convert °C→K, `basis: 'measured'`. Try to locate an open Diviner gridded temperature product for the two lunar regions; if not found in 30 minutes, use published values with citation and `basis: 'literature'`. Mars climate: published values, cited.
- [ ] **Step 2:** Write `catalog.ts`. Tags come from a fixed vocabulary per dimension declared at the top of the file; every `TagSet` has at least one citation; every `status` has a `statusCite`.
- [ ] **Step 3: Tests:** every Earth site has `terrain` or an explicit absence note; every tag is in the vocabulary; every TagSet has ≥1 cite; lat/lon in range; ids unique; each preset's weights cover all 8 dimensions.
- [ ] **Step 4:** Run → PASS. Commit.

### Task 4: Discover page

**Files:** `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/{Shell,Map,WeightPanel,RankList,DimensionBars}.tsx`, `src/lib/{i18n,storage}.ts`.

**Interfaces — Consumes:** Task 1 scoring, Task 3 data. **Produces:** `useLang()`, `t(key)`, `useSaved(): { ids, toggle, has }`, `<Shell>` (nav, search, language, theme).

- [ ] **Step 1:** Shell: nav (Discover, Compare, Saved, Data and Methods, About), search over place names/countries/coordinates, EN/KM toggle, dark/light toggle, skip link, visible focus rings.
- [ ] **Step 2:** Discover: world switch → region cards → weight sliders + presets + dimension on/off → ranked list (index, coverage, per-dimension bars with text values, status badge, basis label) → MapLibre Earth map with shape-coded markers (circle = established/documented, diamond = candidate/unverified) and legend. State lives in the URL query.
- [ ] **Step 3:** CSV export of the current ranking (place, coords, index, coverage, each dimension score and basis).
- [ ] **Step 4:** `storage.test.ts`: `localStorage throwing → ids [] and toggle does not throw`; `stale ids filtered` (Review Focus 4). Run → PASS.
- [ ] **Step 5:** `npm run build`; open in browser; confirm changing a preset reorders the list. Commit.

### Task 5: Site profile and report

**Files:** `src/app/site/page.tsx`, `src/components/{ProvenancePanel,ProfileChart,SlopeChart}.tsx`, print CSS.

- [ ] **Step 1:** Profile for `?id=&ref=`: overview, index + coverage, each dimension with score, basis, method sentence and evidence; strong/moderate/weak/unknown; differences; use cases each naming the dimensions that justify them; provenance panel; save and share buttons. Unknown id → not-found state (Review Focus 3).
- [ ] **Step 2:** Charts: elevation profile (km vs m relative to mean) and slope histogram, site vs reference, labelled axes and units, distinct line styles as well as colours.
- [ ] **Step 3:** "Download report" → `window.print()` with a print stylesheet that includes datasets, retrieval dates and methods.
- [ ] **Step 4:** Browser check including `?id=nope`. Commit.

### Task 6: Compare, Methods, About, Saved

**Files:** `src/app/{compare,methods,about,saved}/page.tsx`.

- [ ] **Step 1:** Compare: reference region beside up to three Earth sites — dimension chart, profiles, slope histograms, strengths and weaknesses. Each map keeps its own true scale with a scale bar; no stretching.
- [ ] **Step 2:** Methods: dataset table grouped as "NASA data" / "Space agency partner data" / "Other references"; scoring formula and each dimension's rule; pipeline coverage statement; limitations list from the spec; glossary.
- [ ] **Step 3:** About: what an analogue is, what was and was not analysed, AI-use notice. Saved page with remove + confirm.
- [ ] **Step 4:** Khmer strings for nav, buttons, short explanations. Commit.

### Task 7: Verify and hand over

- [ ] **Step 1:** `npx vitest run && node --test pipeline/ && npm run build` → all pass.
- [ ] **Step 2:** Walk the 12-step demo sequence in the browser at desktop and mobile widths; fix what breaks.
- [ ] **Step 3:** Recompute one site's index by hand from the JSON and confirm it matches the UI.
- [ ] **Step 4:** `README.md` (run, rerun pipeline, data sources, AI-use notice) and `SUBMISSION.md` (draft text for each project-page field). Commit.
- [ ] **Step 5:** Hand the deploy step to the team (Vercel or GitHub Pages).
