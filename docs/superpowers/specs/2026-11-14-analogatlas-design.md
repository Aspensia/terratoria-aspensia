# AnalogAtlas — design

Date: 2026-11-14. Submission deadline: Sunday 2026-11-15, 23:59 local.

## Intent

A working web app for the NASA Space Apps 2026 challenge "Identify Earth
Locations that Analog the Permanent Moon Base Locations and Mars". A user picks
a specific Moon or Mars reference region, weights the scientific dimensions
they care about, and gets ranked Earth sites with per-dimension scores,
evidence, mismatches and a report. The value is an explainable similarity
engine on real data, shown to judges through one public link.

The concept is the team's. The code is AI-assisted and says so.

## Goals

- The demo path works end to end: pick world → pick region → set weights →
  ranked Earth sites → site profile → side-by-side → sources → report.
- Terrain, thermal and wind scores come from data we processed ourselves.
- Every number shows where it came from and whether it is measured or
  literature-derived.
- One public URL, no login, nothing that can be down during judging.

## Non-goals (cut for time)

Live back-end, database, accounts, offline mode, saved searches, machine
learning, global automated scanning, 3D terrain, Deck.gl, full Khmer
translation of scientific text, PDF library (browser print is the report).

## Anti-goals

- Invented data, sites or conclusions. No fake API responses.
- Missing data counted as dissimilarity.
- Calling the score a probability or a validated classification.
- Claiming global search when ~12 sites were analysed.
- NASA logos or mission badges; AI-generated images.

## Constraints

- One developer, about one day. Node 26 is installed; Python is not.
- Open-access data only (no Earthdata login).
- Submission rules: public link without login; English default; AI use
  acknowledged in text and metadata.

## Approaches considered

| | How | Trade-off |
|---|---|---|
| A. Precompute, static site (chosen) | Scripts reduce data to JSON once; the site scores in the browser; one static deploy | Departs from the brief's FastAPI line; nothing to fail in the demo |
| B. Next.js + hosted FastAPI | As the original brief | Two deploys, cold starts, a day of plumbing judges never see |
| C. Literature-only catalogue | No processing | Fails the "real observations" requirement |

The team chose A, and chose Node over Python for the pipeline because Python
is not on the build machine. The project page must state this.

## Design

### Data pipeline (`pipeline/`, Node scripts, run by hand, outputs committed)

- **Earth elevation:** Copernicus DEM GLO-30 COGs from the public AWS bucket
  (ESA partner data). Verified open.
- **Mars elevation:** MOLA MEGDR 128 px/deg tiles from PDS Geosciences
  (raw 16-bit big-endian grids). Verified open.
- **Moon elevation:** LOLA gridded DEMs from PDS Geosciences (polar product for
  the south pole, global product elsewhere). Verified open.
- **Earth thermal and wind:** NASA POWER climatology API (surface skin
  temperature mean/max/min, 10 m wind). Verified open.
- **Moon thermal:** LRO Diviner polar/global temperature product if an open
  gridded file can be located; otherwise cited published values, labelled.
- **Mars thermal and wind:** cited published values (TES / Mars Climate
  Database literature), labelled literature-derived.

Scale handling: all DEMs are resampled to one common baseline (~463 m, the
MOLA pixel) over a window of the same physical size before any metric is
computed. Terrain metrics per region: slope distribution (histogram, median,
p90), local relief, roughness (std of detrended elevation), hypsometric
shape. Elevation is compared as shape relative to the local mean, never as
absolute height. An elevation profile across each window is stored for charts.

Each output JSON records product id, version, resolution, source URL,
retrieval date and whether each value is raw, processed or derived.

### Catalogue (`data/`)

- 2 Moon regions: Shackleton–de Gerlache ridge (south pole), Marius Hills
  (volcanic, pit/lava tube).
- 2 Mars regions: Jezero crater (ancient lake delta), Arsia Mons flank
  (volcanic, lava tubes).
- About 12 Earth sites spanning volcanic, polar, desert, impact, dune and cave
  settings (e.g. Mauna Loa, Iceland highlands, Lanzarote, Craters of the Moon,
  Atacama, McMurdo Dry Valleys, Devon Island/Haughton, Meteor Crater, Lonar,
  Rio Tinto, Namib, Svalbard). Each is tagged established analogue /
  documented research site / potential candidate / unverified, with the
  source for that tag. Final list is the builder's call, provided every tag
  and coordinate is checked against a citable source.

### Dimensions (the challenge's eight)

Measured: terrain; temperature (part of "temperature, illumination,
extremes"); dust and wind (wind part).
Literature-derived, with citation and a visible label: geology and
mineralogy; illumination; water/ice/permafrost; biology and habitability;
subsurface; exploration relevance (derived from terrain slope stats plus
literature).

Literature dimensions use a small documented rubric (shared categorical
attributes → score), not free-form numbers.

### Scoring (pure functions, unit-tested, no UI imports)

`Index = Σ(Wᵢ·Qᵢ·Sᵢ) / Σ(Wᵢ·Qᵢ)` over dimensions that have data.
- Sᵢ 0–100; Qᵢ 0–1 (measured > literature > sparse).
- A dimension with no data is excluded and reported as unknown; it lowers
  coverage, not the score.
- No aggregate is shown with fewer than three valid dimensions.
- Named "Exploratory Analogue Similarity Index"; coverage shown beside it.
- Explanations are generated from the stored numbers only: strong / moderate
  / weak / unknown / mismatches.

### Site (Next.js static export, TypeScript, Tailwind, MapLibre, Recharts)

- **Discover:** world and region picker, weight sliders with six presets,
  Earth map with distinct symbols for established vs candidate, ranked list
  that re-sorts live, CSV export.
- **Site profile:** overview, per-dimension scores with method and evidence,
  differences, use cases tied to the actual similarities, data provenance
  panel, printable report, shareable URL.
- **Compare:** one Earth site beside its reference region: elevation
  profiles, slope histograms, dimension chart; up to three Earth sites.
- **Data and Methods:** datasets laid out to match the submission form's
  "NASA Data" and "Partner Data and Other References" fields; scoring method;
  limitations (vacuum, gravity, pressure, radiation, scale, instruments).
- **About:** what an analogue is, coverage statement, AI-use notice.
- English default with a Khmer toggle for navigation, buttons and short
  explanations. Dark default with light theme. Keyboard focus states, text
  labels beside colour, colourblind-safe palette, responsive to mobile.
- Saved sites in localStorage.

### Deploy

Static export to Vercel or GitHub Pages; the team connects the account.
README carries the AI-use notice, data sources and how to rerun the pipeline.

## Left to the builder

Exact site list and window sizes; LOLA product choice per region; rubric
tables for literature dimensions; visual design within the direction above;
Khmer wording (flag for a native-speaker check).

## Also delivered

Draft project-page text (summary, description, AI-use answer, data lists)
for the team to edit. Slide content once real screenshots exist.
