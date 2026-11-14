"use client";

import { useApp } from "@/components/AppState";
import { EARTH_SITES, REFERENCES, VOCABULARY } from "@/data/catalog";
import { levelLabel, RefList } from "@/components/Bits";
import { DATASETS, type Dataset } from "@/data/datasets";
import { R } from "@/data/references";
import { GENERAL_LIMITS, LIMITS } from "@/data/limits";
import { DATASET_KM, GENERAL_LIMITS_KM, LIMITS_KM, local, PRESET_KM, tagLabel } from "@/data/km";
import { PRESETS } from "@/data/presets";
import { DIMENSION_LABEL } from "@/lib/i18n";
import { scoreDimension } from "@/lib/scoring";
import { DIMENSIONS } from "@/lib/types";

type Bi = { en: string; km: string };

const GROUPS: { id: Dataset["group"]; title: Bi; note: Bi }[] = [
  {
    id: "nasa",
    title: { en: "NASA data", km: "ទិន្នន័យ NASA" },
    note: { en: "Matches the “NASA Data” field of the project submission.", km: "ត្រូវនឹងផ្នែក “NASA Data” នៃការដាក់ស្នើគម្រោង។" },
  },
  {
    id: "partner",
    title: { en: "Space agency partner data", km: "ទិន្នន័យទីភ្នាក់ងារអវកាសដៃគូ" },
    note: { en: "ESA is a 2026 Space Apps partner agency.", km: "ESA គឺជាទីភ្នាក់ងារដៃគូរបស់ Space Apps ឆ្នាំ ២០២៦។" },
  },
  {
    id: "other",
    title: { en: "Other references", km: "ឯកសារយោងផ្សេងទៀត" },
    note: { en: "Published results used where no open gridded product was processed.", km: "លទ្ធផលដែលបានបោះពុម្ព ប្រើនៅកន្លែងដែលមិនមានផលិតផលក្រឡាចត្រង្គបើកចំហដែលបានដំណើរការ។" },
  },
];

const GLOSSARY: { term: Bi; simple: Bi; detail: Bi }[] = [
  {
    term: { en: "Analogue environment", km: "បរិស្ថានស្រដៀង" },
    simple: { en: "A place on Earth that resembles part of another world in some specific, useful way.", km: "កន្លែងមួយលើផែនដី ដែលស្រដៀងនឹងផ្នែកមួយនៃពិភពផ្សេង តាមរបៀបជាក់លាក់ និងមានប្រយោជន៍។" },
    detail: { en: "No analogue matches in every respect; each is chosen for particular properties such as rock type, temperature or terrain.", km: "គ្មានទីតាំងស្រដៀងណាដូចគ្រប់ចំណុចទេ ទីតាំងនីមួយៗត្រូវបានជ្រើសរើសសម្រាប់លក្ខណៈជាក់លាក់ ដូចជាប្រភេទថ្ម សីតុណ្ហភាព ឬសណ្ឋានដី។" },
  },
  {
    term: { en: "Digital elevation model (DEM)", km: "ម៉ូដែលកម្ពស់ឌីជីថល (DEM)" },
    simple: { en: "A grid of ground heights, like a map made of height numbers.", km: "ក្រឡាចត្រង្គនៃកម្ពស់ដី ដូចជាផែនទីដែលធ្វើពីលេខកម្ពស់។" },
    detail: { en: "Terratoria uses LOLA (Moon), MOLA (Mars) and Copernicus DEM (Earth), all resampled to 463 m cells.", km: "Terratoria ប្រើ LOLA (ព្រះច័ន្ទ) MOLA (ភពអង្គារ) និង Copernicus DEM (ផែនដី) ដែលទាំងអស់ត្រូវបានកែទៅក្រឡា ៤៦៣ ម.។" },
  },
  {
    term: { en: "Spatial resolution", km: "ភាពច្បាស់តាមលំហ" },
    simple: { en: "The size of the smallest detail a dataset can show.", km: "ទំហំនៃព័ត៌មានលម្អិតតូចបំផុត ដែលសំណុំទិន្នន័យអាចបង្ហាញបាន។" },
    detail: { en: "Comparing data at different resolutions is misleading, so everything is brought to one baseline first.", km: "ការប្រៀបធៀបទិន្នន័យដែលមានភាពច្បាស់ខុសគ្នាអាចបំភាន់ ដូច្នេះទិន្នន័យទាំងអស់ត្រូវបានកែទៅមាត្រដ្ឋានតែមួយជាមុនសិន។" },
  },
  {
    term: { en: "Surface roughness", km: "ភាពរដិបរដុបនៃផ្ទៃ" },
    simple: { en: "How bumpy the ground is at a chosen scale.", km: "កម្រិតដែលដីមានភាពមិនរាបស្មើ នៅមាត្រដ្ឋានដែលបានជ្រើសរើស។" },
    detail: { en: "Here: the standard deviation of elevation after subtracting the local 5 × 5 cell mean, at 463 m.", km: "នៅទីនេះ៖ គម្លាតស្តង់ដារនៃកម្ពស់ បន្ទាប់ពីដកមធ្យមនៃក្រឡា ៥ × ៥ ក្នុងតំបន់ នៅ ៤៦៣ ម.។" },
  },
  {
    term: { en: "Hypsometric integral", km: "សន្ទស្សន៍ hypsometric" },
    simple: { en: "Whether a landscape is mostly high ground with deep cuts, or mostly low ground with peaks.", km: "ថាតើទេសភាពភាគច្រើនជាដីខ្ពស់ដែលមានជ្រលងជ្រៅ ឬជាដីទាបដែលមានកំពូលភ្នំ។" },
    detail: { en: "(mean − minimum) ÷ (maximum − minimum) elevation in the window; 0.5 is evenly balanced.", km: "(មធ្យម − អប្បបរមា) ÷ (អតិបរមា − អប្បបរមា) នៃកម្ពស់ក្នុងតំបន់ ០.៥ មានន័យថាមានតុល្យភាព។" },
  },
  {
    term: { en: "Regolith", km: "ដី regolith" },
    simple: { en: "The loose layer of dust and broken rock covering solid bedrock.", km: "ស្រទាប់ធូលី និងកំទេចថ្មរលុង ដែលគ្របលើថ្មគ្រឹះរឹង។" },
    detail: { en: "Lunar regolith is formed by impacts, not weather, so its grains are sharp and glassy.", km: "regolith នៃព្រះច័ន្ទកើតឡើងពីការបុក មិនមែនពីអាកាសធាតុទេ ដូច្នេះគ្រាប់របស់វាមុត និងដូចកញ្ចក់។" },
  },
  {
    term: { en: "Permanently shadowed region", km: "តំបន់ម្លប់ជានិច្ច" },
    simple: { en: "A crater floor near a pole that sunlight never reaches.", km: "បាតរណ្តៅក្បែរប៉ូល ដែលពន្លឺព្រះអាទិត្យមិនដែលចាំងដល់។" },
    detail: { en: "Temperatures stay near 40 K, cold enough to trap water ice for billions of years.", km: "សីតុណ្ហភាពនៅជិត ៤០ K ត្រជាក់ល្មមអាចរក្សាទឹកកកបានរាប់ពាន់លានឆ្នាំ។" },
  },
  {
    term: { en: "Thermal inertia", km: "និចលភាពកម្តៅ" },
    simple: { en: "How slowly a surface heats up and cools down.", km: "ល្បឿនយឺតដែលផ្ទៃមួយឡើងកម្តៅ និងចុះត្រជាក់។" },
    detail: { en: "Rock has high thermal inertia and dust has low. It was not compared in this version.", km: "ថ្មមាននិចលភាពកម្តៅខ្ពស់ ចំណែកធូលីមានទាប។ មិនបានប្រៀបធៀបក្នុងកំណែនេះទេ។" },
  },
  {
    term: { en: "Aeolian processes", km: "ដំណើរការខ្យល់ (aeolian)" },
    simple: { en: "Shaping of the land by wind: dunes, ripples, sand-blasted rock.", km: "ការកែរូបរាងដីដោយខ្យល់៖ ទួលខ្សាច់ រលកខ្សាច់ និងថ្មដែលខ្សាច់បក់សំណឹក។" },
    detail: { en: "Active on Mars and Earth; absent on the airless Moon.", km: "សកម្មលើភពអង្គារ និងផែនដី ប៉ុន្តែគ្មាននៅលើព្រះច័ន្ទដែលគ្មានខ្យល់ទេ។" },
  },
  {
    term: { en: "Mineral spectroscopy", km: "វិសាលគមវិទ្យារ៉ែ" },
    simple: { en: "Identifying minerals from the colours of light they reflect or emit.", km: "ការកំណត់រ៉ែតាមពណ៌ពន្លឺដែលវាឆ្លុះ ឬបញ្ចេញ។" },
    detail: { en: "Terratoria does not process spectra; mineral tags come from published studies.", km: "Terratoria មិនដំណើរការវិសាលគមទេ ស្លាករ៉ែមកពីការសិក្សាដែលបានបោះពុម្ព។" },
  },
  {
    term: { en: "Bolometric brightness temperature", km: "សីតុណ្ហភាពពន្លឺ bolometric" },
    simple: { en: "A single surface temperature worked out from all the heat an instrument measures.", km: "សីតុណ្ហភាពផ្ទៃតែមួយ ដែលគណនាពីកម្តៅទាំងអស់ដែលឧបករណ៍វាស់បាន។" },
    detail: { en: "The Diviner value used for the Moon's temperature.", km: "តម្លៃ Diviner ដែលប្រើសម្រាប់សីតុណ្ហភាពព្រះច័ន្ទ។" },
  },
  {
    term: { en: "Reanalysis", km: "ការវិភាគឡើងវិញ (reanalysis)" },
    simple: { en: "A weather model continually corrected with real observations to fill in a complete global record.", km: "ម៉ូដែលអាកាសធាតុដែលត្រូវបានកែតម្រូវជាប្រចាំដោយការសង្កេតពិត ដើម្បីបង្កើតកំណត់ត្រាពេញលេញទូទាំងពិភពលោក។" },
    detail: { en: "MERRA-2, behind NASA POWER, is the source of Earth temperatures and wind here.", km: "MERRA-2 ដែលនៅពីក្រោយ NASA POWER គឺជាប្រភពនៃសីតុណ្ហភាព និងខ្យល់លើផែនដីនៅទីនេះ។" },
  },
];

export default function MethodsPage() {
  const { t, tx, lang } = useApp();
  const sample = scoreDimension("terrain", REFERENCES[0], EARTH_SITES[0], lang);
  const dkm = (d: Dataset) => (lang === "km" ? DATASET_KM[d.id] : undefined);
  const limits = lang === "km" ? LIMITS_KM : LIMITS;
  const general = lang === "km" ? GENERAL_LIMITS_KM : GENERAL_LIMITS;
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">{t("nav_methods")}</h1>
        <p className="mt-2 max-w-3xl text-muted">
          {tx(
            "Everything Terratoria shows can be traced to an open dataset or a citation. This page lists the data, the exact scoring rules and the limits of the method.",
            "អ្វីៗទាំងអស់ដែល Terratoria បង្ហាញ អាចតាមដានទៅសំណុំទិន្នន័យបើកចំហ ឬឯកសារយោងបាន។ ទំព័រនេះរាយទិន្នន័យ ច្បាប់ដាក់ពិន្ទុពិតប្រាកដ និងដែនកំណត់នៃវិធីសាស្ត្រ។",
          )}
        </p>
      </header>

      <p className="simple-only card p-5">{t("simple_methods")}</p>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">{tx("What was analysed", "អ្វីដែលបានវិភាគ")}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>
            {tx(`${REFERENCES.length} reference regions`, `តំបន់យោង ${REFERENCES.length}`)}: {REFERENCES.map((r) => local(r, lang).name).join("; ")}.
          </li>
          <li>
            {tx(
              `${EARTH_SITES.length} Earth sites, each as one 60 km window: ${EARTH_SITES.filter((s) => s.terrain).length} with terrain metrics, ${EARTH_SITES.filter((s) => s.climate).length} with climate data.`,
              `ទីតាំងផែនដី ${EARTH_SITES.length} ដែលនីមួយៗជាតំបន់វិភាគ ៦០ គ.ម.៖ ${EARTH_SITES.filter((s) => s.terrain).length} មានរង្វាស់សណ្ឋានដី និង ${EARTH_SITES.filter((s) => s.climate).length} មានទិន្នន័យអាកាសធាតុ។`,
            )}
          </li>
          <li>
            {tx(
              `${EARTH_SITES.filter((s) => s.status === "candidate").length} of the Earth sites are the team's own candidates and have not been validated in the field.`,
              `ទីតាំងផែនដី ${EARTH_SITES.filter((s) => s.status === "candidate").length} ជាបេក្ខភាពផ្ទាល់របស់ក្រុម ហើយមិនទាន់ត្រូវបានផ្ទៀងផ្ទាត់នៅទីវាលទេ។`,
            )}
          </li>
          <li>{tx("This is not a search of the whole Earth. No site outside this list was examined.", "នេះមិនមែនជាការស្វែងរកទូទាំងផែនដីទេ។ គ្មានទីតាំងក្រៅពីបញ្ជីនេះត្រូវបានពិនិត្យទេ។")}</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{tx("Datasets", "សំណុំទិន្នន័យ")}</h2>
        {GROUPS.map((g) => (
          <div key={g.id} className="card p-4">
            <h3 className="font-semibold">{g.title[lang]}</h3>
            <p className="text-xs text-muted">{g.note[lang]}</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="label">
                  <tr>
                    <th className="py-1 pr-3">{tx("Mission / instrument", "បេសកកម្ម / ឧបករណ៍")}</th>
                    <th className="py-1 pr-3">{tx("Product and version", "ផលិតផល និងកំណែ")}</th>
                    <th className="py-1 pr-3">{tx("Resolution / period", "ភាពច្បាស់ / រយៈពេល")}</th>
                    <th className="py-1 pr-3">{tx("Level", "កម្រិត")}</th>
                    <th className="py-1">{tx("Used for, and quality notes", "ប្រើសម្រាប់ និងកំណត់សម្គាល់គុណភាព")}</th>
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
                        {dkm(d)?.resolution ?? d.resolution}
                        <span className="block text-muted">{dkm(d)?.period ?? d.period}</span>
                      </td>
                      <td className="py-2 pr-3 capitalize">{levelLabel(d.level, lang)}</td>
                      <td className="py-2">
                        {dkm(d)?.usedFor ?? d.usedFor}
                        <span className="block text-muted">{dkm(d)?.quality ?? d.quality}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        <p className="text-sm text-muted">
          {tx(
            "Levels: raw = instrument readings; processed = calibrated, gridded products from the mission team; derived = model or reanalysis output; literature = values taken from papers. Terratoria computes its own derived indicators (slope, relief, roughness, similarity scores) from the processed products. Basemap imagery is NASA GIBS Blue Marble, used for display only.",
            "កម្រិត៖ ទិន្នន័យដើម = ការអានពីឧបករណ៍ បានដំណើរការ = ផលិតផលក្រឡាចត្រង្គដែលបានក្រិតដោយក្រុមបេសកកម្ម ទាញយកពីម៉ូដែល = លទ្ធផលពីម៉ូដែល ឬការវិភាគឡើងវិញ ឯកសារស្រាវជ្រាវ = តម្លៃយកពីអត្ថបទ។ Terratoria គណនាសូចនាករផ្ទាល់ខ្លួន (ជម្រាល កម្ពស់ខុសគ្នា ភាពរដិបរដុប ពិន្ទុភាពស្រដៀង) ពីផលិតផលដែលបានដំណើរការ។ ផែនទីមូលដ្ឋានជា NASA GIBS Blue Marble ប្រើសម្រាប់បង្ហាញតែប៉ុណ្ណោះ។",
          )}
        </p>
      </section>

      <section className="science-only card p-5">
        <h2 className="text-lg font-semibold">{tx("How the pipeline works", "របៀបដែលប្រព័ន្ធដំណើរការទិន្នន័យធ្វើការ")}</h2>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm">
          <li>{tx("For each place, read a 60.2 km × 60.2 km window centred on its coordinates from the open archive (HTTP range requests; no bulk download).", "សម្រាប់ទីតាំងនីមួយៗ អានតំបន់ ៦០.២ គ.ម. × ៦០.២ គ.ម. ដែលមានកណ្តាលនៅកូអរដោនេរបស់វា ពីបណ្ណសារបើកចំហ (ស្នើសុំតាមផ្នែក HTTP មិនទាញយកទាំងស្រុងទេ)។")}</li>
          <li>{tx("Resample to 130 × 130 cells of 463 m, the native MOLA pixel. Finer sources (Copernicus 90 m, LOLA 80 m) are block-averaged so slopes mean the same thing on every world.", "កែទៅក្រឡា ១៣០ × ១៣០ ដែលមានទំហំ ៤៦៣ ម. ស្មើនឹងភីកសែលដើមរបស់ MOLA។ ប្រភពដែលលម្អិតជាង (Copernicus ៩០ ម. LOLA ៨០ ម.) ត្រូវយកមធ្យមតាមប្លុក ដើម្បីឱ្យជម្រាលមានន័យដូចគ្នានៅគ្រប់ពិភព។")}</li>
          <li>{tx("Exclude nodata and open water. If under half the window is valid, no terrain metrics are produced.", "ដកចេញកន្លែងគ្មានទិន្នន័យ និងទឹកបើកចំហ។ ប្រសិនបើតំបន់ត្រឹមត្រូវតិចជាងពាក់កណ្តាល មិនបង្កើតរង្វាស់សណ្ឋានដីទេ។")}</li>
          <li>{tx("Compute slope (Horn 3 × 3), slope histogram, 2nd–98th percentile relief, roughness, hypsometric integral and a west–east profile.", "គណនាជម្រាល (Horn ៣ × ៣) របាយជម្រាល កម្ពស់ខុសគ្នាភាគរយទី ២–៩៨ ភាពរដិបរដុប សន្ទស្សន៍ hypsometric និងទម្រង់ពីលិចទៅកើត។")}</li>
          <li>{tx("Read Earth climate from NASA POWER and lunar temperature from the Diviner cumulative product for the bin containing each place.", "អានអាកាសធាតុផែនដីពី NASA POWER និងសីតុណ្ហភាពព្រះច័ន្ទពីផលិតផលប្រមូលផ្តុំ Diviner សម្រាប់ប្រអប់ដែលមានទីតាំងនីមួយៗ។")}</li>
          <li>{tx("Before trusting any output, the pipeline checks itself against known values: Mauna Loa summit, Jezero floor, Shackleton depth, Marius Hills elevation.", "មុនពេលទុកចិត្តលទ្ធផល ប្រព័ន្ធពិនិត្យខ្លួនឯងជាមួយតម្លៃដែលគេដឹងរួច៖ កំពូល Mauna Loa បាត Jezero ជម្រៅ Shackleton និងកម្ពស់ Marius Hills។")}</li>
        </ol>
        <p className="mt-3 text-sm text-muted">
          {tx("The scripts are in the repository under", "ស្គ្រីបនៅក្នុងឃ្លាំងក្រោម")} <code className="font-mono">pipeline/</code> {tx("and can be rerun with", "ហើយអាចដំណើរការម្តងទៀតដោយ")}{" "}
          <code className="font-mono">node pipeline/run-terrain.mjs</code> {tx("and", "និង")} <code className="font-mono">node pipeline/run-climate.mjs</code>.
        </p>
      </section>

      <section className="science-only card p-5">
        <h2 className="text-lg font-semibold">{t("index")}</h2>
        <p className="mt-2 font-mono text-sm">{tx("Index", "សន្ទស្សន៍")} = Σ(Wᵢ × Qᵢ × Sᵢ) ÷ Σ(Wᵢ × Qᵢ)</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
          <li>
            {tx(
              "Sᵢ is a dimension's similarity score, 0 to 100. Wᵢ is the weight you set. Qᵢ is a data-quality factor between 0 and 1.",
              "Sᵢ គឺពិន្ទុភាពស្រដៀងនៃវិមាត្រមួយ ពី ០ ដល់ ១០០។ Wᵢ គឺទម្ងន់ដែលអ្នកកំណត់។ Qᵢ គឺកត្តាគុណភាពទិន្នន័យ ចន្លោះ ០ និង ១។",
            )}
          </li>
          <li>
            {tx(
              "Q is 1.0 × the valid-data fraction for measured terrain, 0.9 for measured climate, 0.7 when one side is a literature value and 0.6 for literature tags.",
              "Q គឺ ១.០ × ចំណែកទិន្នន័យត្រឹមត្រូវ សម្រាប់សណ្ឋានដីដែលវាស់ ០.៩ សម្រាប់អាកាសធាតុដែលវាស់ ០.៧ ពេលម្ខាងជាតម្លៃពីឯកសារ និង ០.៦ សម្រាប់ស្លាកពីឯកសារស្រាវជ្រាវ។",
            )}
          </li>
          <li>{tx("A dimension with no data on either side is left out of both sums. It lowers the coverage figure, never the score.", "វិមាត្រដែលគ្មានទិន្នន័យនៅម្ខាងណាមួយ ត្រូវដកចេញពីផលបូកទាំងពីរ។ វាបន្ថយតួលេខវិសាលភាព មិនមែនពិន្ទុទេ។")}</li>
          <li>{tx("No index is shown unless at least three dimensions have data and a weight above zero.", "មិនបង្ហាញសន្ទស្សន៍ទេ លុះត្រាតែវិមាត្រយ៉ាងតិចបីមានទិន្នន័យ និងទម្ងន់ធំជាងសូន្យ។")}</li>
          <li>{tx("The index is a screening aid. It is not a probability and has not been validated against field results.", "សន្ទស្សន៍នេះជាជំនួយពិនិត្យបឋម។ វាមិនមែនជាប្រូបាបទេ ហើយមិនទាន់ត្រូវបានផ្ទៀងផ្ទាត់ជាមួយលទ្ធផលទីវាលទេ។")}</li>
        </ul>
        <h3 className="mt-5 font-semibold">{tx("Rule for each dimension", "ច្បាប់សម្រាប់វិមាត្រនីមួយៗ")}</h3>
        <dl className="mt-2 space-y-3 text-sm">
          {DIMENSIONS.map((d) => (
            <div key={d}>
              <dt className="font-medium">{DIMENSION_LABEL[lang][d]}</dt>
              <dd className="text-muted">{scoreDimension(d, REFERENCES[0], EARTH_SITES[0], lang).method}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-muted">
          {tx(
            `Worked example, terrain, ${EARTH_SITES[0].name} against ${REFERENCES[0].name}: ${sample.evidence.join("; ")}. Score ${sample.score?.toFixed(1)}, quality ${sample.quality.toFixed(2)}.`,
            `ឧទាហរណ៍ សណ្ឋានដី ${local(EARTH_SITES[0], "km").name} ធៀបនឹង ${local(REFERENCES[0], "km").name}៖ ${sample.evidence.join("; ")}។ ពិន្ទុ ${sample.score?.toFixed(1)} គុណភាព ${sample.quality.toFixed(2)}។`,
          )}
        </p>
      </section>

      <section className="science-only card p-5">
        <h2 className="text-lg font-semibold">{tx("Literature tags", "ស្លាកពីឯកសារស្រាវជ្រាវ")}</h2>
        <p className="mt-2 text-sm text-muted">
          {tx(
            "For the six literature-derived parts, each place carries tags from a fixed vocabulary, and each tag set cites its sources. The score is the share of the reference region's tags that are also documented at the Earth site.",
            "សម្រាប់ផ្នែកប្រាំមួយដែលផ្អែកលើឯកសារស្រាវជ្រាវ ទីតាំងនីមួយៗមានស្លាកពីបញ្ជីពាក្យថេរ ហើយស្លាកនីមួយៗមានឯកសារយោង។ ពិន្ទុគឺជាចំណែកនៃស្លាករបស់តំបន់យោង ដែលក៏មានឯកសារនៅទីតាំងផែនដីដែរ។",
          )}
        </p>
        <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
          {DIMENSIONS.filter((d) => VOCABULARY[d].length > 0).map((d) => (
            <div key={d}>
              <dt className="font-medium">{DIMENSION_LABEL[lang][d]}</dt>
              <dd className="text-muted">{VOCABULARY[d].map((v) => tagLabel(v, lang)).join(", ")}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="science-only card p-5">
        <h2 className="text-lg font-semibold">{tx("Weight presets", "ការកំណត់ទម្ងន់ស្រាប់")}</h2>
        <dl className="mt-2 space-y-2 text-sm">
          {PRESETS.map((p) => (
            <div key={p.id}>
              <dt className="font-medium">{lang === "km" ? PRESET_KM[p.id].name : p.name}</dt>
              <dd className="text-muted">
                {lang === "km" ? PRESET_KM[p.id].explain : p.explain} <span className="font-mono text-xs">[{DIMENSIONS.map((d) => p.weights[d]).join(", ")}]</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">{tx("Limitations", "ដែនកំណត់")}</h2>
        <div className="mt-2 grid gap-5 text-sm md:grid-cols-3">
          <div>
            <h3 className="font-semibold">
              {t("limits_title")}: {t("moon")}
            </h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">{limits.moon.map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
          <div>
            <h3 className="font-semibold">
              {t("limits_title")}: {t("mars")}
            </h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">{limits.mars.map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
          <div>
            <h3 className="font-semibold">{tx("Limits of this method", "ដែនកំណត់នៃវិធីសាស្ត្រនេះ")}</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">{general.map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
        </div>
        <h3 className="mt-5 font-semibold">{tx("Not done in this version", "អ្វីដែលមិនទាន់ធ្វើក្នុងកំណែនេះ")}</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>{tx("No Landsat, MODIS, ASTER or CRISM spectral processing; mineral information is literature-derived.", "មិនបានដំណើរការវិសាលគម Landsat, MODIS, ASTER ឬ CRISM ទេ ព័ត៌មានរ៉ែមកពីឯកសារស្រាវជ្រាវ។")}</li>
          <li>{tx("No gridded Mars thermal product (TES, THEMIS) was processed; Arsia Mons has no thermal comparison.", "មិនបានដំណើរការផលិតផលសីតុណ្ហភាពក្រឡាចត្រង្គនៃភពអង្គារ (TES, THEMIS) ទេ Arsia Mons គ្មានការប្រៀបធៀបសីតុណ្ហភាពទេ។")}</li>
          <li>{tx("No illumination modelling; lighting conditions are literature tags.", "មិនបានធ្វើម៉ូដែលពន្លឺទេ លក្ខខណ្ឌពន្លឺជាស្លាកពីឯកសារស្រាវជ្រាវ។")}</li>
          <li>{tx("No automated global scan or machine learning. Candidates were chosen by hand and then measured.", "គ្មានការស្កេនទូទាំងពិភពលោកដោយស្វ័យប្រវត្តិ ឬការរៀនរបស់ម៉ាស៊ីនទេ។ បេក្ខភាពត្រូវបានជ្រើសរើសដោយដៃ ហើយបន្ទាប់មកវាស់។")}</li>
        </ul>
      </section>

      <section className="card p-5" id="references">
        <h2 className="text-lg font-semibold">{tx("References (APA 7th edition)", "ឯកសារយោង (ទម្រង់ APA បោះពុម្ពលើកទី ៧)")}</h2>
        <p className="mt-1 text-sm text-muted">
          {tx(
            "Data sets and literature together, in alphabetical order. Journal articles were checked against their Crossref records (authors, year, title, volume, pages and DOI); NASA reports and books were checked against NASA and publisher records. References stay in their original language.",
            "សំណុំទិន្នន័យ និងឯកសារស្រាវជ្រាវរួមគ្នា តាមលំដាប់អក្សរក្រម។ អត្ថបទទស្សនាវដ្តីត្រូវបានផ្ទៀងផ្ទាត់ជាមួយកំណត់ត្រា Crossref (អ្នកនិពន្ធ ឆ្នាំ ចំណងជើង វ៉ុល ទំព័រ និង DOI) ហើយរបាយការណ៍ NASA និងសៀវភៅត្រូវបានផ្ទៀងផ្ទាត់ជាមួយកំណត់ត្រា NASA និងអ្នកបោះពុម្ព។ ឯកសារយោងរក្សាភាសាដើម។",
          )}
        </p>
        <div className="mt-4">
          <RefList refs={[...Object.values(R), ...DATASETS.filter((d) => d.id !== "literature").map((d) => d.apa)]} />
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">{tx("Glossary", "សទ្ទានុក្រម")}</h2>
        <dl className="mt-2 grid gap-4 text-sm md:grid-cols-2">
          {GLOSSARY.map((g) => (
            <div key={g.term.en}>
              <dt className="font-medium">{g.term[lang]}</dt>
              <dd>{g.simple[lang]}</dd>
              <dd className="text-muted">{g.detail[lang]}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
