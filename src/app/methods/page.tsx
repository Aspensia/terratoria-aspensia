"use client";

import { useApp } from "@/components/AppState";
import { EARTH_SITES, REFERENCES, VOCABULARY } from "@/data/catalog";
import { RefList } from "@/components/Bits";
import { DATASETS, type Dataset } from "@/data/datasets";
import { R } from "@/data/references";
import { GENERAL_LIMITS, LIMITS } from "@/data/limits";
import { PRESETS } from "@/data/presets";
import { DIMENSION_LABEL } from "@/lib/i18n";
import { scoreDimension } from "@/lib/scoring";
import { DIMENSIONS } from "@/lib/types";

const GROUPS: { id: Dataset["group"]; title: string; note: string }[] = [
  { id: "nasa", title: "NASA data", note: "Matches the “NASA Data” field of the project submission." },
  { id: "partner", title: "Space agency partner data", note: "ESA is a 2026 Space Apps partner agency." },
  { id: "other", title: "Other references", note: "Published results used where no open gridded product was processed." },
];

const GLOSSARY: [string, string, string][] = [
  ["Analogue environment", "A place on Earth that resembles part of another world in some specific, useful way.", "No analogue matches in every respect; each is chosen for particular properties such as rock type, temperature or terrain."],
  ["Digital elevation model (DEM)", "A grid of ground heights, like a map made of height numbers.", "Terratoria uses LOLA (Moon), MOLA (Mars) and Copernicus DEM (Earth), all resampled to 463 m cells."],
  ["Spatial resolution", "The size of the smallest detail a dataset can show.", "Comparing data at different resolutions is misleading, so everything is brought to one baseline first."],
  ["Surface roughness", "How bumpy the ground is at a chosen scale.", "Here: the standard deviation of elevation after subtracting the local 5 × 5 cell mean, at 463 m."],
  ["Hypsometric integral", "Whether a landscape is mostly high ground with deep cuts, or mostly low ground with peaks.", "(mean − minimum) ÷ (maximum − minimum) elevation in the window; 0.5 is evenly balanced."],
  ["Regolith", "The loose layer of dust and broken rock covering solid bedrock.", "Lunar regolith is formed by impacts, not weather, so its grains are sharp and glassy."],
  ["Permanently shadowed region", "A crater floor near a pole that sunlight never reaches.", "Temperatures stay near 40 K, cold enough to trap water ice for billions of years."],
  ["Thermal inertia", "How slowly a surface heats up and cools down.", "Rock has high thermal inertia and dust has low. It was not compared in this version."],
  ["Aeolian processes", "Shaping of the land by wind: dunes, ripples, sand-blasted rock.", "Active on Mars and Earth; absent on the airless Moon."],
  ["Mineral spectroscopy", "Identifying minerals from the colours of light they reflect or emit.", "Terratoria does not process spectra; mineral tags come from published studies."],
  ["Bolometric brightness temperature", "A single surface temperature worked out from all the heat an instrument measures.", "The Diviner value used for the Moon's temperature."],
  ["Reanalysis", "A weather model continually corrected with real observations to fill in a complete global record.", "MERRA-2, behind NASA POWER, is the source of Earth temperatures and wind here."],
];

export default function MethodsPage() {
  const { t, lang } = useApp();
  const sample = scoreDimension("terrain", REFERENCES[0], EARTH_SITES[0]);
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">{t("nav_methods")}</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Everything Terratoria shows can be traced to an open dataset or a citation. This page lists the data, the exact scoring rules and the limits of the method.
        </p>
      </header>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">What was analysed</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>
            {REFERENCES.length} reference regions: {REFERENCES.map((r) => r.name).join("; ")}.
          </li>
          <li>
            {EARTH_SITES.length} Earth sites, each as one 60 km window: {EARTH_SITES.filter((s) => s.terrain).length} with terrain metrics, {EARTH_SITES.filter((s) => s.climate).length} with climate data.
          </li>
          <li>
            {EARTH_SITES.filter((s) => s.status === "candidate").length} of the Earth sites are the team&apos;s own candidates and have not been validated in the field.
          </li>
          <li>This is not a search of the whole Earth. No site outside this list was examined.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Datasets</h2>
        {GROUPS.map((g) => (
          <div key={g.id} className="card p-4">
            <h3 className="font-semibold">{g.title}</h3>
            <p className="text-xs text-muted">{g.note}</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="label">
                  <tr>
                    <th className="py-1 pr-3">Mission / instrument</th>
                    <th className="py-1 pr-3">Product and version</th>
                    <th className="py-1 pr-3">Resolution / period</th>
                    <th className="py-1 pr-3">Level</th>
                    <th className="py-1">Used for, and quality notes</th>
                  </tr>
                </thead>
                <tbody>
                  {DATASETS.filter((d) => d.group === g.id).map((d) => (
                    <tr key={d.id} className="border-t border-line align-top">
                      <td className="py-2 pr-3">
                        {d.mission}
                        <span className="block text-muted">{d.instrument}</span>
                        <span className="block text-muted">{d.agency}</span>
                      </td>
                      <td className="py-2 pr-3">
                        <a href={d.url} target="_blank" rel="noreferrer" className="text-accent underline">
                          {d.product}
                        </a>
                        <span className="block text-muted">{d.version}</span>
                      </td>
                      <td className="py-2 pr-3">
                        {d.resolution}
                        <span className="block text-muted">{d.period}</span>
                      </td>
                      <td className="py-2 pr-3 capitalize">{d.level}</td>
                      <td className="py-2">
                        {d.usedFor}
                        <span className="block text-muted">{d.quality}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        <p className="text-sm text-muted">
          Levels: <strong>raw</strong> = instrument readings; <strong>processed</strong> = calibrated, gridded products from the mission team; <strong>derived</strong> =
          model or reanalysis output; <strong>literature</strong> = values taken from papers. Terratoria computes its own derived indicators (slope, relief, roughness,
          similarity scores) from the processed products. Basemap imagery is NASA GIBS Blue Marble, used for display only.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">How the pipeline works</h2>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm">
          <li>For each place, read a 60.2 km × 60.2 km window centred on its coordinates from the open archive (HTTP range requests; no bulk download).</li>
          <li>Resample to 130 × 130 cells of 463 m, the native MOLA pixel. Finer sources (Copernicus 90 m, LOLA 80 m) are block-averaged so slopes mean the same thing on every world.</li>
          <li>Exclude nodata and open water. If under half the window is valid, no terrain metrics are produced.</li>
          <li>Compute slope (Horn 3 × 3), slope histogram, 2nd–98th percentile relief, roughness, hypsometric integral and a west–east profile.</li>
          <li>Read Earth climate from NASA POWER and lunar temperature from the Diviner cumulative product for the bin containing each place.</li>
          <li>Before trusting any output, the pipeline checks itself against known values: Mauna Loa summit, Jezero floor, Shackleton depth, Marius Hills elevation.</li>
        </ol>
        <p className="mt-3 text-sm text-muted">
          The scripts are in the repository under <code className="font-mono">pipeline/</code> and can be rerun with <code className="font-mono">node pipeline/run-terrain.mjs</code> and{" "}
          <code className="font-mono">node pipeline/run-climate.mjs</code>.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">{t("index")}</h2>
        <p className="mt-2 font-mono text-sm">Index = Σ(Wᵢ × Qᵢ × Sᵢ) ÷ Σ(Wᵢ × Qᵢ)</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
          <li><strong>Sᵢ</strong> is a dimension&apos;s similarity score, 0 to 100. <strong>Wᵢ</strong> is the weight you set. <strong>Qᵢ</strong> is a data-quality factor between 0 and 1.</li>
          <li>Q is 1.0 × the valid-data fraction for measured terrain, 0.9 for measured climate, 0.7 when one side is a literature value and 0.6 for literature tags.</li>
          <li>A dimension with no data on either side is left out of both sums. It lowers the coverage figure, never the score.</li>
          <li>No index is shown unless at least three dimensions have data and a weight above zero.</li>
          <li>The index is a screening aid. It is not a probability and has not been validated against field results.</li>
        </ul>
        <h3 className="mt-5 font-semibold">Rule for each dimension</h3>
        <dl className="mt-2 space-y-3 text-sm">
          {DIMENSIONS.map((d) => (
            <div key={d}>
              <dt className="font-medium">{DIMENSION_LABEL[lang][d]}</dt>
              <dd className="text-muted">{scoreDimension(d, REFERENCES[0], EARTH_SITES[0]).method}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-muted">
          Worked example, terrain, {EARTH_SITES[0].name} against {REFERENCES[0].name}: {sample.evidence.join("; ")}. Score {sample.score?.toFixed(1)}, quality {sample.quality.toFixed(2)}.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">Literature tags</h2>
        <p className="mt-2 text-sm text-muted">
          For the six literature-derived parts, each place carries tags from a fixed vocabulary, and each tag set cites its sources. The score is the share of the
          reference region&apos;s tags that are also documented at the Earth site.
        </p>
        <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
          {DIMENSIONS.filter((d) => VOCABULARY[d].length > 0).map((d) => (
            <div key={d}>
              <dt className="font-medium">{DIMENSION_LABEL[lang][d]}</dt>
              <dd className="text-muted">{VOCABULARY[d].map((v) => v.replace(/_/g, " ")).join(", ")}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">Weight presets</h2>
        <dl className="mt-2 space-y-2 text-sm">
          {PRESETS.map((p) => (
            <div key={p.id}>
              <dt className="font-medium">{p.name}</dt>
              <dd className="text-muted">
                {p.explain} <span className="font-mono text-xs">[{DIMENSIONS.map((d) => p.weights[d]).join(", ")}]</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">Limitations</h2>
        <div className="mt-2 grid gap-5 text-sm md:grid-cols-3">
          <div>
            <h3 className="font-semibold">{t("limits_title")}: {t("moon")}</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">{LIMITS.moon.map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
          <div>
            <h3 className="font-semibold">{t("limits_title")}: {t("mars")}</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">{LIMITS.mars.map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
          <div>
            <h3 className="font-semibold">Limits of this method</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">{GENERAL_LIMITS.map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
        </div>
        <h3 className="mt-5 font-semibold">Not done in this version</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>No Landsat, MODIS, ASTER or CRISM spectral processing; mineral information is literature-derived.</li>
          <li>No gridded Mars thermal product (TES, THEMIS) was processed; Arsia Mons has no thermal comparison.</li>
          <li>No illumination modelling; lighting conditions are literature tags.</li>
          <li>No automated global scan or machine learning. Candidates were chosen by hand and then measured.</li>
        </ul>
      </section>

      <section className="card p-5" id="references">
        <h2 className="text-lg font-semibold">References (APA 7th edition)</h2>
        <p className="mt-1 text-sm text-muted">
          Data sets and literature together, in alphabetical order. Journal articles were checked against their Crossref records (authors, year, title,
          volume, pages and DOI); NASA reports and books were checked against NASA and publisher records.
        </p>
        <div className="mt-4">
          <RefList refs={[...Object.values(R), ...DATASETS.filter((d) => d.id !== "literature").map((d) => d.apa)]} />
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">Glossary</h2>
        <dl className="mt-2 grid gap-4 text-sm md:grid-cols-2">
          {GLOSSARY.map(([term, simple, detail]) => (
            <div key={term}>
              <dt className="font-medium">{term}</dt>
              <dd>{simple}</dd>
              <dd className="text-muted">{detail}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
