"use client";

import Link from "next/link";
import { useApp } from "@/components/AppState";
import { TeamSection } from "@/components/Team";
import { EARTH_SITES, REFERENCES } from "@/data/catalog";

export default function AboutPage() {
  const { t, tx } = useApp();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{t("nav_about")}</h1>
        <p className="mt-2 text-lg text-muted">{t("tagline")}</p>
      </header>

      <TeamSection />

      <section className="card p-5">
        <h2 className="text-lg font-semibold">{tx("What is a planetary analogue?", "តើទីតាំងស្រដៀងភពគឺជាអ្វី?")}</h2>
        <p className="mt-2">
          {tx(
            "A terrestrial analogue is a place on Earth that shares specific characteristics with a place on another world: its rocks, its terrain, its cold, its dryness. Space agencies use analogues to train crews, test rovers and drills, and learn how to read landscapes before a mission arrives.",
            "ទីតាំងស្រដៀងលើផែនដី គឺជាកន្លែងមួយលើផែនដីដែលមានលក្ខណៈជាក់លាក់ដូចកន្លែងមួយនៅលើពិភពផ្សេង៖ ថ្ម សណ្ឋានដី ភាពត្រជាក់ ឬភាពស្ងួតរបស់វា។ ទីភ្នាក់ងារអវកាសប្រើទីតាំងស្រដៀងទាំងនេះដើម្បីហ្វឹកហាត់ក្រុមនាវិក សាកល្បងរ៉ូវើរ និងម៉ាស៊ីនខួង ហើយរៀនអានទេសភាព មុនពេលបេសកកម្មទៅដល់។",
          )}
        </p>
        <p className="mt-2">
          {tx(
            "Most analogue sites were chosen from field experience. Terratoria asks the question the other way round: start from a specific region on the Moon or Mars, say which properties matter, and rank Earth sites by how well the measurements and the published evidence agree.",
            "ទីតាំងស្រដៀងភាគច្រើនត្រូវបានជ្រើសរើសពីបទពិសោធន៍ទីវាល។ Terratoria សួរសំណួរផ្ទុយមកវិញ៖ ចាប់ផ្តើមពីតំបន់ជាក់លាក់មួយនៅលើព្រះច័ន្ទ ឬភពអង្គារ ប្រាប់ថាលក្ខណៈណាសំខាន់ ហើយដាក់ចំណាត់ថ្នាក់ទីតាំងផែនដីតាមកម្រិតដែលការវាស់វែង និងភស្តុតាងដែលបានបោះពុម្ពត្រូវគ្នា។",
          )}
        </p>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">{tx("What this version covers", "អ្វីដែលកំណែនេះគ្របដណ្តប់")}</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>{tx(`${REFERENCES.length} reference regions: two on the Moon, two on Mars.`, `តំបន់យោង ${REFERENCES.length}៖ ពីរនៅលើព្រះច័ន្ទ និងពីរនៅលើភពអង្គារ។`)}</li>
          <li>
            {tx(
              `${EARTH_SITES.length} Earth sites on seven continents, from long-established analogues to three untested candidates.`,
              `ទីតាំងផែនដី ${EARTH_SITES.length} នៅលើទ្វីបទាំងប្រាំពីរ ចាប់ពីទីតាំងស្រដៀងដែលបានទទួលស្គាល់យូរមកហើយ រហូតដល់ទីតាំងបេក្ខភាពបីដែលមិនទាន់សាកល្បង។`,
            )}
          </li>
          <li>{tx("Three dimensions built on data the team processed: terrain, temperature and wind.", "វិមាត្របីផ្អែកលើទិន្នន័យដែលក្រុមបានដំណើរការ៖ សណ្ឋានដី សីតុណ្ហភាព និងខ្យល់។")}</li>
          <li>{tx("Five dimensions built on cited literature, clearly labelled.", "វិមាត្រប្រាំផ្អែកលើឯកសារស្រាវជ្រាវដែលមានការដកស្រង់ ហើយមានស្លាកច្បាស់លាស់។")}</li>
        </ul>
        <p className="mt-3 text-muted">
          {t("coverage_note")} {t("screening_note")}
        </p>
        <Link href="/methods/" className="btn mt-4">
          {t("nav_methods")}
        </Link>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">{tx("Challenge", "បញ្ហាប្រកួត")}</h2>
        <p className="mt-2">
          {tx("Built for the NASA Space Apps Challenge 2026:", "បង្កើតសម្រាប់ NASA Space Apps Challenge 2026៖")}{" "}
          <a className="text-accent underline" href="https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/" target="_blank" rel="noreferrer">
            Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars
          </a>
          .
        </p>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">{tx("Use of AI", "ការប្រើប្រាស់ AI")}</h2>
        <p className="mt-2">
          {tx(
            "The idea and direction for PROJECT: Terratoria are the Aspensia team's. The application code, the data pipeline, the catalogue text and the Khmer interface strings were written with an AI coding assistant (Claude, by Anthropic) and reviewed by the team.",
            "គំនិត និងទិសដៅនៃ PROJECT: Terratoria គឺជារបស់ក្រុម Aspensia។ កូដកម្មវិធី ប្រព័ន្ធដំណើរការទិន្នន័យ អត្ថបទកាតាឡុក និងអត្ថបទចំណុចប្រទាក់ភាសាខ្មែរ ត្រូវបានសរសេរដោយមានជំនួយពីជំនួយការសរសេរកូដ AI (Claude ដោយ Anthropic) ហើយត្រូវបានពិនិត្យដោយក្រុម។",
          )}
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted">
          <li>
            {tx(
              "No AI-generated images are used. Relief views are drawn from mission elevation data; the basemap is NASA imagery.",
              "មិនប្រើរូបភាពដែលបង្កើតដោយ AI ទេ។ រូបសណ្ឋានដីត្រូវបានគូរពីទិន្នន័យកម្ពស់របស់បេសកកម្ម ហើយផែនទីមូលដ្ឋានជារូបភាពរបស់ NASA។",
            )}
          </li>
          <li>
            {tx(
              "No measured value was generated by AI. Terrain and climate numbers come from the pipeline's reading of the archives.",
              "គ្មានតម្លៃវាស់វែងណាមួយត្រូវបានបង្កើតដោយ AI ទេ។ តួលេខសណ្ឋានដី និងអាកាសធាតុមកពីការអានបណ្ណសាររបស់ប្រព័ន្ធដំណើរការទិន្នន័យ។",
            )}
          </li>
          <li>
            {tx(
              "Literature references were checked against Crossref and NASA records and are listed in APA 7th edition on the Data and Methods page. The Khmer translation was reviewed for accuracy.",
              "ឯកសារយោងត្រូវបានផ្ទៀងផ្ទាត់ជាមួយកំណត់ត្រា Crossref និង NASA ហើយមានរាយក្នុងទម្រង់ APA បោះពុម្ពលើកទី ៧ នៅទំព័រទិន្នន័យ និងវិធីសាស្ត្រ។ ការបកប្រែភាសាខ្មែរត្រូវបានពិនិត្យសម្រាប់ភាពត្រឹមត្រូវ។",
            )}
          </li>
        </ul>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">{tx("Credits", "ការទទួលស្គាល់")}</h2>
        <p className="mt-2 text-muted">
          {tx(
            "Lunar topography: LOLA Science Team, NASA GSFC. Lunar temperature: Diviner team, UCLA. Mars topography: MOLA Science Team. Earth climate: NASA Langley POWER Project. Earth elevation: Copernicus DEM © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018, provided under COPERNICUS by the European Union and ESA. Basemap: NASA Global Imagery Browse Services. Terratoria is not affiliated with or endorsed by NASA or ESA.",
            "សណ្ឋានដីព្រះច័ន្ទ៖ ក្រុមវិទ្យាសាស្ត្រ LOLA, NASA GSFC។ សីតុណ្ហភាពព្រះច័ន្ទ៖ ក្រុម Diviner, UCLA។ សណ្ឋានដីភពអង្គារ៖ ក្រុមវិទ្យាសាស្ត្រ MOLA។ អាកាសធាតុផែនដី៖ គម្រោង NASA Langley POWER។ កម្ពស់ផែនដី៖ Copernicus DEM © DLR e.V. 2010–2014 និង © Airbus Defence and Space GmbH 2014–2018 ផ្តល់ក្រោមកម្មវិធី COPERNICUS ដោយសហភាពអឺរ៉ុប និង ESA។ ផែនទីមូលដ្ឋាន៖ NASA Global Imagery Browse Services។ Terratoria មិនមានទំនាក់ទំនង ឬការគាំទ្រពី NASA ឬ ESA ទេ។",
          )}
        </p>
      </section>
    </div>
  );
}
