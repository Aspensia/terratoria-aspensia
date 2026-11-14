"use client";

import Link from "next/link";
import { RefList } from "@/components/Bits";
import { useApp } from "@/components/AppState";
import { getPlace } from "@/data/catalog";
import { local } from "@/data/km";
import { R, type RefKey } from "@/data/references";
import { cite } from "@/lib/cite";

type Bi = { en: string; km: string };

const Cite = ({ k }: { k: RefKey[] }) => <span className="text-muted">({k.map(cite).join("; ")})</span>;

const EXAMPLES: { title: Bi; where: string[]; did: Bi; teaches: Bi; refs: RefKey[] }[] = [
  {
    title: { en: "Apollo crews learned geology on Earth first", km: "ក្រុម Apollo បានរៀនភូគព្ភវិទ្យានៅលើផែនដីជាមុន" },
    where: ["meteor-crater", "ries", "askja"],
    did: {
      en: "Before landing on the Moon, Apollo astronauts trained in volcanic fields and impact craters on Earth so they could recognise rocks and choose samples on the lunar surface.",
      km: "មុនពេលចុះចតលើព្រះច័ន្ទ អវកាសយានិក Apollo បានហ្វឹកហាត់នៅវាលភ្នំភ្លើង និងរណ្តៅអាចម៍ផ្កាយលើផែនដី ដើម្បីអាចស្គាល់ថ្ម និងជ្រើសរើសសំណាកនៅលើផ្ទៃព្រះច័ន្ទ។",
    },
    teaches: {
      en: "Training on the right kind of ground made every hour on the Moon count. The same idea guides Artemis crews today.",
      km: "ការហ្វឹកហាត់លើដីប្រភេទត្រឹមត្រូវ ធ្វើឱ្យម៉ោងនីមួយៗនៅលើព្រះច័ន្ទមានតម្លៃ។ គំនិតដូចគ្នានេះកំពុងណែនាំក្រុម Artemis សព្វថ្ងៃ។",
    },
    refs: ["phinney2015"],
  },
  {
    title: { en: "Living and drilling in the High Arctic", km: "ការរស់នៅ និងការខួងនៅតំបន់អាក់ទិកខ្ពស់" },
    where: ["haughton"],
    did: {
      en: "The Haughton-Mars Project has run field seasons in a polar impact crater since 1997, and NASA tested an automated drill for Mars there.",
      km: "គម្រោង Haughton-Mars បានធ្វើការសិក្សាទីវាលក្នុងរណ្តៅអាចម៍ផ្កាយប៉ូលតាំងពីឆ្នាំ ១៩៩៧ ហើយ NASA បានសាកល្បងម៉ាស៊ីនខួងស្វ័យប្រវត្តិសម្រាប់ភពអង្គារនៅទីនោះ។",
    },
    teaches: {
      en: "How crews and machines cope with cold, isolation and frozen ground, and how to drill without a human at the controls.",
      km: "របៀបដែលក្រុមនាវិក និងម៉ាស៊ីនទប់ទល់នឹងភាពត្រជាក់ ភាពឯកោ និងដីកក ព្រមទាំងរបៀបខួងដោយគ្មានមនុស្សបញ្ជា។",
    },
    refs: ["lee2005", "glass2008"],
  },
  {
    title: { en: "Rovers hunting for life in the driest desert", km: "រ៉ូវើរស្វែងរកជីវិតក្នុងវាលខ្សាច់ស្ងួតបំផុត" },
    where: ["atacama-yungay"],
    did: {
      en: "Soils in the Atacama's hyperarid core are so dry that they hold almost no organic material, like Mars. Science teams drove rovers across it to practise searching for life remotely.",
      km: "ដីនៅស្នូលស្ងួតខ្លាំងនៃ Atacama ស្ងួតខ្លាំងរហូតដល់ស្ទើរតែគ្មានសារធាតុសរីរាង្គ ដូចភពអង្គារ។ ក្រុមវិទ្យាសាស្ត្របានបើករ៉ូវើរកាត់វា ដើម្បីហាត់ស្វែងរកជីវិតពីចម្ងាយ។",
    },
    teaches: {
      en: "How to tell a real sign of life from a false alarm in nearly sterile ground, before trying it on Mars.",
      km: "របៀបបែងចែកសញ្ញាជីវិតពិត ពីការព្រមានខុស ក្នុងដីដែលស្ទើរគ្មានមេរោគ មុនពេលសាកល្បងលើភពអង្គារ។",
    },
    refs: ["navarrogonzalez2003", "cabrol2007"],
  },
  {
    title: { en: "Salt flats that test Mars orbiters", km: "វាលអំបិលដែលសាកល្បងផ្កាយរណបភពអង្គារ" },
    where: ["death-valley"],
    did: {
      en: "Scientists mapped the Badwater Basin salt flats with the same kind of thermal instruments that orbit Mars, and found microbes preserved inside salt crystals.",
      km: "អ្នកវិទ្យាសាស្ត្របានគូសផែនទីវាលអំបិល Badwater Basin ដោយប្រើឧបករណ៍កម្តៅប្រភេទដូចគ្នានឹងឧបករណ៍ដែលគោចរជុំវិញភពអង្គារ ហើយបានរកឃើញអតិសុខុមប្រាណដែលរក្សាទុកក្នុងគ្រីស្តាល់អំបិល។",
    },
    teaches: {
      en: "Whether orbiters can spot salt minerals left by evaporating water on Mars, and where ancient life could be sealed away.",
      km: "ថាតើផ្កាយរណបអាចរកឃើញរ៉ែអំបិលដែលទឹកហួតបន្សល់ទុកលើភពអង្គារឬទេ និងកន្លែងដែលជីវិតបុរាណអាចត្រូវបានរក្សាទុក។",
    },
    refs: ["baldridge2004", "schubert2009"],
  },
  {
    title: { en: "Spacewalks on fresh lava", km: "ការដើរក្នុងអវកាសលើកម្អែភ្នំភ្លើងថ្មី" },
    where: ["mauna-loa", "craters-of-the-moon"],
    did: {
      en: "NASA's BASALT programme ran simulated Mars spacewalks on young lava flows, with time delays to mission control. HI-SEAS crews on Mauna Loa practised exploring lava tubes.",
      km: "កម្មវិធី BASALT របស់ NASA បានក្លែងធ្វើការដើរក្នុងអវកាសភពអង្គារលើលំហូរកម្អែថ្មី ដោយមានការពន្យារពេលទំនាក់ទំនងទៅមជ្ឈមណ្ឌលបញ្ជា។ ក្រុម HI-SEAS នៅ Mauna Loa បានហាត់រុករកបំពង់កម្អែភ្នំភ្លើង។",
    },
    teaches: {
      en: "How science teams on Earth and crews on another world can work together despite communication delays.",
      km: "របៀបដែលក្រុមវិទ្យាសាស្ត្រលើផែនដី និងក្រុមនាវិកលើពិភពផ្សេងអាចធ្វើការជាមួយគ្នា ទោះមានការពន្យារពេលទំនាក់ទំនងក៏ដោយ។",
    },
    refs: ["lim2019", "musilova2021"],
  },
  {
    title: { en: "Astronauts training in a lava cave", km: "អវកាសយានិកហ្វឹកហាត់ក្នុងរូងកម្អែភ្នំភ្លើង" },
    where: ["lanzarote"],
    did: {
      en: "ESA's PANGAEA course trains astronauts in field geology on Lanzarote's young lava fields and inside its 7.6 km Corona lava tube.",
      km: "វគ្គ PANGAEA របស់ ESA ហ្វឹកហាត់អវកាសយានិកផ្នែកភូគព្ភវិទ្យាទីវាល លើវាលកម្អែថ្មីនៃ Lanzarote និងក្នុងបំពង់កម្អែ Corona ប្រវែង ៧.៦ គ.ម.។",
    },
    teaches: {
      en: "Recognising volcanic rocks and caves, which matters for using lunar lava tubes as shelters.",
      km: "ការស្គាល់ថ្មភ្នំភ្លើង និងរូងភ្នំ ដែលសំខាន់សម្រាប់ការប្រើបំពង់កម្អែលើព្រះច័ន្ទជាជម្រក។",
    },
    refs: ["sauro2023"],
  },
  {
    title: { en: "Drilling for buried life", km: "ការខួងស្វែងរកជីវិតដែលកប់" },
    where: ["rio-tinto"],
    did: {
      en: "The MARTE experiment simulated a robotic Mars drilling mission in Río Tinto's iron- and sulfate-rich ground and checked the results against what remote science teams predicted.",
      km: "ការពិសោធ MARTE បានក្លែងធ្វើបេសកកម្មខួងដោយមនុស្សយន្តលើភពអង្គារ ក្នុងដីសម្បូរដែក និងស៊ុលហ្វាតនៃ Río Tinto ហើយពិនិត្យលទ្ធផលធៀបនឹងអ្វីដែលក្រុមវិទ្យាសាស្ត្រពីចម្ងាយបានទស្សន៍ទាយ។",
    },
    teaches: {
      en: "How well a robot drill and a remote team can find hidden life, and where they go wrong.",
      km: "កម្រិតដែលម៉ាស៊ីនខួងមនុស្សយន្ត និងក្រុមពីចម្ងាយអាចរកឃើញជីវិតដែលលាក់ និងកន្លែងដែលពួកគេធ្វើខុស។",
    },
    refs: ["bonaccorsi2008", "amils2007"],
  },
  {
    title: { en: "The coldest, driest ice-cemented ground", km: "ដីកកជាប់ទឹកកកដែលត្រជាក់ និងស្ងួតបំផុត" },
    where: ["mcmurdo-dry-valleys"],
    did: {
      en: "In Antarctica's high Dry Valleys the ground stays frozen year round, with dry soil sitting on top of ice-cemented ground, much like the ice-rich ground found near the poles of Mars.",
      km: "នៅជ្រលងស្ងួតខ្ពស់នៃអង់តាក់ទិក ដីនៅកកពេញមួយឆ្នាំ ដោយមានដីស្ងួតនៅពីលើដីដែលកកជាប់ទឹកកក ស្រដៀងនឹងដីសម្បូរទឹកកកដែលរកឃើញក្បែរប៉ូលនៃភពអង្គារ។",
    },
    teaches: {
      en: "Where buried ice survives and how deep to dig for it: the same question a lunar or Martian base must answer for its water.",
      km: "កន្លែងដែលទឹកកកកប់នៅរស់ និងត្រូវជីកជ្រៅប៉ុណ្ណា៖ ជាសំណួរដូចគ្នាដែលមូលដ្ឋាននៅលើព្រះច័ន្ទ ឬភពអង្គារត្រូវឆ្លើយសម្រាប់ទឹករបស់វា។",
    },
    refs: ["marchant2007", "mckay2008"],
  },
];

const STEPS: { need: Bi; moon: Bi; earth: string[]; how: Bi; refs: RefKey[] }[] = [
  {
    need: { en: "1. Pick a site with sunlight and water", km: "១. ជ្រើសរើសទីតាំងដែលមានពន្លឺព្រះអាទិត្យ និងទឹក" },
    moon: {
      en: "The rims around Shackleton crater at the lunar south pole are lit for most of the year, while the crater floor next to them stays in permanent shadow, cold enough to trap water ice.",
      km: "គែមជុំវិញរណ្តៅ Shackleton នៅប៉ូលខាងត្បូងនៃព្រះច័ន្ទទទួលពន្លឺស្ទើរពេញមួយឆ្នាំ ខណៈដែលបាតរណ្តៅក្បែរនោះស្ថិតក្នុងម្លប់ជានិច្ច ត្រជាក់ល្មមអាចរក្សាទឹកកកបាន។",
    },
    earth: ["mcmurdo-dry-valleys", "svalbard-bockfjorden"],
    how: { en: "Test solar power, batteries and machinery under months of low sun and deep cold.", km: "សាកល្បងថាមពលព្រះអាទិត្យ ថ្ម និងគ្រឿងម៉ាស៊ីន ក្រោមពន្លឺព្រះអាទិត្យទាប និងភាពត្រជាក់ខ្លាំងរាប់ខែ។" },
    refs: ["mazarico2011", "paige2010", "li2018"],
  },
  {
    need: { en: "2. Get water from the ground", km: "២. យកទឹកពីដី" },
    moon: { en: "Ice in permanently shadowed craters could supply drinking water, oxygen and rocket fuel.", km: "ទឹកកកក្នុងរណ្តៅដែលស្ថិតក្នុងម្លប់ជានិច្ច អាចផ្គត់ផ្គង់ទឹកផឹក អុកស៊ីសែន និងឥន្ធនៈរ៉ុក្កែត។" },
    earth: ["haughton", "mcmurdo-dry-valleys"],
    how: { en: "Practise automated drilling in frozen ground and learn where ice survives below dry soil.", km: "ហាត់ការខួងស្វ័យប្រវត្តិក្នុងដីកក និងរៀនពីកន្លែងដែលទឹកកកនៅរស់ក្រោមដីស្ងួត។" },
    refs: ["zuber2012", "glass2008", "mckay2008"],
  },
  {
    need: { en: "3. Find shelter from radiation and temperature swings", km: "៣. ស្វែងរកជម្រកការពារពីវិទ្យុសកម្ម និងការប្រែប្រួលសីតុណ្ហភាព" },
    moon: {
      en: "A collapse pit in the Marius Hills appears to open into an intact lava tube, a ready-made cave that could shield a habitat.",
      km: "រណ្តៅស្រុតមួយនៅ Marius Hills ហាក់ដូចជាបើកចូលទៅបំពង់កម្អែភ្នំភ្លើងដែលនៅដដែល ជារូងភ្នំស្រាប់ដែលអាចការពារលំនៅដ្ឋាន។",
    },
    earth: ["lanzarote", "mauna-loa", "harrat-khaybar"],
    how: { en: "Map lava tubes with robots and crews, and test how habitats could be placed inside them.", km: "គូសផែនទីបំពង់កម្អែដោយមនុស្សយន្ត និងក្រុមនាវិក ហើយសាកល្បងរបៀបដាក់លំនៅដ្ឋាននៅខាងក្នុង។" },
    refs: ["haruyama2009", "kaku2017", "sauro2020"],
  },
  {
    need: { en: "4. Move and build on sharp, dusty ground", km: "៤. ធ្វើដំណើរ និងសាងសង់លើដីមុត និងមានធូលី" },
    moon: { en: "Lunar dust is fine, sharp and clings to everything; it wears out seals, joints and spacesuits.", km: "ធូលីព្រះច័ន្ទល្អិត មុត ហើយជាប់គ្រប់យ៉ាង វាធ្វើឱ្យការបិទជិត សន្លាក់ និងឈុតអវកាសខូចឆាប់។" },
    earth: ["askja", "craters-of-the-moon"],
    how: {
      en: "Drive rovers and test construction on loose volcanic sand and rough lava, the closest Earth materials to lunar soil.",
      km: "បើករ៉ូវើរ និងសាកល្បងការសាងសង់លើខ្សាច់ភ្នំភ្លើងរលុង និងកម្អែរដិបរដុប ដែលជាសម្ភារៈលើផែនដីជិតបំផុតនឹងដីព្រះច័ន្ទ។",
    },
    refs: ["colwell2007", "mangold2011"],
  },
  {
    need: { en: "5. Live and work there for months", km: "៥. រស់នៅ និងធ្វើការនៅទីនោះរាប់ខែ" },
    moon: {
      en: "Artemis aims for crews to stay longer on the lunar surface and to do real field science while they are there.",
      km: "Artemis មានគោលដៅឱ្យក្រុមនាវិកស្នាក់នៅលើផ្ទៃព្រះច័ន្ទយូរជាងមុន និងធ្វើវិទ្យាសាស្ត្រទីវាលពិតប្រាកដពេលនៅទីនោះ។",
    },
    earth: ["mauna-loa", "haughton"],
    how: {
      en: "Rehearse long missions in isolated habitats and train crews to choose samples like field geologists.",
      km: "ហាត់បេសកកម្មរយៈពេលវែងក្នុងលំនៅដ្ឋានដាច់ស្រយាល និងហ្វឹកហាត់ក្រុមនាវិកឱ្យជ្រើសរើសសំណាកដូចអ្នកភូគព្ភវិទ្យាទីវាល។",
    },
    refs: ["nasa2020", "lim2019", "lee2005"],
  },
];

const USED: RefKey[] = [...new Set([...EXAMPLES.flatMap((e) => e.refs), ...STEPS.flatMap((s) => s.refs), "farley2020", "phinney2015"] as RefKey[])];

function SiteLinks({ ids }: { ids: string[] }) {
  const { lang } = useApp();
  return (
    <span className="flex flex-wrap gap-1.5">
      {ids.map((id) => (
        <Link key={id} href={`/site/?id=${id}`} className="chip chip-ok rounded-full px-2.5 py-0.5 text-xs hover:brightness-125">
          {local(getPlace(id)!, lang).name} →
        </Link>
      ))}
    </span>
  );
}

export default function PlanPage() {
  const { t, tx, lang } = useApp();
  return (
    <article className="mx-auto max-w-5xl space-y-10">
      <header className="space-y-3">
        <p className="label">{t("nav_plan")}</p>
        <h1 className="text-4xl font-semibold tracking-tight">
          {tx("From Earth analogues to a self-sustaining lunar base", "ពីទីតាំងស្រដៀងលើផែនដី ទៅកាន់មូលដ្ឋានព្រះច័ន្ទដែលអាចទ្រទ្រង់ខ្លួនឯងបាន")}
        </h1>
        <p className="max-w-3xl text-lg">
          {tx(
            "PROJECT: Terratoria uses NASA and partner-agency datasets to study the environments of the Moon and Mars, find places on Earth with similar features, and use those places to plan experiments for building bases on other worlds.",
            "PROJECT: Terratoria ប្រើសំណុំទិន្នន័យរបស់ NASA និងទីភ្នាក់ងារដៃគូ ដើម្បីសិក្សាបរិស្ថាននៃព្រះច័ន្ទ និងភពអង្គារ ស្វែងរកកន្លែងលើផែនដីដែលមានលក្ខណៈស្រដៀងគ្នា ហើយប្រើកន្លែងទាំងនោះដើម្បីរៀបចំផែនការពិសោធសម្រាប់ការសាងសង់មូលដ្ឋាននៅលើពិភពផ្សេង។",
          )}
        </p>
        <p className="max-w-3xl text-muted">
          {tx(
            "Visitors can explore, side by side, how the landscapes of Earth compare with the Moon and Mars, and see how lessons learned at home could help build a self-sustaining lunar base. Places such as the Atacama Desert, the Haughton impact crater and Death Valley share features with the Moon or Mars, so experiments there can help map the plan before anyone leaves Earth. NASA has done this before: Apollo astronauts rehearsed lunar field geology at sites on Earth that resembled the Moon",
            "អ្នកទស្សនាអាចរុករកដោយប្រៀបធៀបចំហៀងគ្នា ថាតើទេសភាពផែនដីប្រៀបធៀបនឹងព្រះច័ន្ទ និងភពអង្គារយ៉ាងដូចម្តេច ហើយមើលពីរបៀបដែលមេរៀនដែលរៀនបាននៅផ្ទះ អាចជួយសាងសង់មូលដ្ឋានព្រះច័ន្ទដែលអាចទ្រទ្រង់ខ្លួនឯងបាន។ កន្លែងដូចជាវាលខ្សាច់ Atacama រណ្តៅអាចម៍ផ្កាយ Haughton និង Death Valley មានលក្ខណៈដូចព្រះច័ន្ទ ឬភពអង្គារ ដូច្នេះការពិសោធនៅទីនោះអាចជួយរៀបចំផែនការ មុនពេលនរណាម្នាក់ចាកចេញពីផែនដី។ NASA ធ្លាប់ធ្វើបែបនេះពីមុន៖ អវកាសយានិក Apollo បានហាត់ភូគព្ភវិទ្យាទីវាលនៃព្រះច័ន្ទ នៅទីតាំងលើផែនដីដែលស្រដៀងនឹងព្រះច័ន្ទ",
          )}{" "}
          <Cite k={["phinney2015"]} />.{" "}
          {tx(
            "Our research draws on several biomes, from polar deserts to volcanic fields, and every source is listed below and on the",
            "ការស្រាវជ្រាវរបស់យើងផ្អែកលើជីវភូមិច្រើន ចាប់ពីវាលខ្សាច់ប៉ូល ដល់វាលភ្នំភ្លើង ហើយប្រភពនីមួយៗមានរាយខាងក្រោម និងនៅលើទំព័រ",
          )}{" "}
          <Link href="/methods/" className="text-accent underline">
            {t("nav_methods")}
          </Link>
          {tx(" page.", "។")}
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link href="/discover/" className="btn btn-primary">
            {tx("Rank the analogues yourself →", "ដាក់ចំណាត់ថ្នាក់ទីតាំងស្រដៀងដោយខ្លួនឯង →")}
          </Link>
          <Link href="/explore/?body=moon&focus=moon-shackleton" className="btn">
            {tx("See Shackleton crater in 3D", "មើលរណ្តៅ Shackleton ជា 3D")}
          </Link>
        </div>
      </header>

      <section aria-labelledby="examples-h" className="space-y-4">
        <div>
          <h2 id="examples-h" className="text-2xl font-semibold">
            {tx("Critical examples: analogues that shaped real missions", "ឧទាហរណ៍សំខាន់ៗ៖ ទីតាំងស្រដៀងដែលបានជួយរៀបចំបេសកកម្មពិត")}
          </h2>
          <p className="text-sm text-muted">
            {tx(
              "Each example is a documented field campaign. Select a place to see how it scores in Terratoria.",
              "ឧទាហរណ៍នីមួយៗជាយុទ្ធនាការទីវាលដែលមានឯកសារ។ ជ្រើសរើសទីតាំងមួយដើម្បីមើលពិន្ទុរបស់វាក្នុង Terratoria។",
            )}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {EXAMPLES.map((e) => (
            <section key={e.title.en} className="card card-hover space-y-2 p-5">
              <h3 className="text-lg font-semibold">{e.title[lang]}</h3>
              <SiteLinks ids={e.where} />
              <p className="text-sm">
                {e.did[lang]} <Cite k={e.refs} />
              </p>
              <p className="text-sm">
                <span className="font-semibold text-accent">{tx("What it teaches: ", "អ្វីដែលវាបង្រៀន៖ ")}</span>
                {e.teaches[lang]}
              </p>
            </section>
          ))}
        </div>
      </section>

      <section aria-labelledby="steps-h" className="space-y-4">
        <div>
          <h2 id="steps-h" className="text-2xl font-semibold">
            {tx("The plan: five steps toward a self-sustaining lunar base", "ផែនការ៖ ប្រាំជំហានឆ្ពោះទៅកាន់មូលដ្ឋានព្រះច័ន្ទដែលអាចទ្រទ្រង់ខ្លួនឯងបាន")}
          </h2>
          <p className="text-sm text-muted">
            {tx("Each step pairs a need on the Moon with the Earth sites where it can be tested first.", "ជំហាននីមួយៗផ្គូផ្គងតម្រូវការនៅលើព្រះច័ន្ទ ជាមួយទីតាំងផែនដីដែលអាចសាកល្បងវាជាមុន។")}
          </p>
        </div>
        <ol className="space-y-3">
          {STEPS.map((s) => (
            <li key={s.need.en} className="card grid gap-4 p-5 md:grid-cols-[1fr_1fr]">
              <div>
                <h3 className="text-lg font-semibold">{s.need[lang]}</h3>
                <p className="mt-1 text-sm">
                  <span className="label !text-moon">{tx("On the Moon", "នៅលើព្រះច័ន្ទ")} </span>
                  <br />
                  {s.moon[lang]} <Cite k={s.refs.slice(0, 2)} />
                </p>
              </div>
              <div className="space-y-2 border-t border-line pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
                <p className="label !text-earth">{tx("Test it on Earth", "សាកល្បងនៅលើផែនដី")}</p>
                <SiteLinks ids={s.earth} />
                <p className="text-sm">
                  {s.how[lang]} <Cite k={s.refs.slice(2)} />
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="card p-5 text-sm">
          <span className="font-semibold">{tx("And then Mars.", "បន្ទាប់មក ភពអង្គារ។")}</span>{" "}
          {tx(
            "The same approach carries to Mars. Perseverance is collecting samples in Jezero crater's ancient lake",
            "វិធីសាស្ត្រដូចគ្នាអាចអនុវត្តចំពោះភពអង្គារ។ Perseverance កំពុងប្រមូលសំណាកនៅបឹងបុរាណនៃរណ្តៅ Jezero",
          )}{" "}
          <Cite k={["farley2020"]} />
          {tx(
            ", and the Atacama Desert, Pilbara, Río Tinto and Death Valley are where teams practise recognising signs of ancient life and water before samples come home.",
            " ហើយវាលខ្សាច់ Atacama, Pilbara, Río Tinto និង Death Valley គឺជាកន្លែងដែលក្រុមនានាហាត់ស្គាល់សញ្ញានៃជីវិត និងទឹកបុរាណ មុនពេលសំណាកត្រូវបាននាំយកមកផែនដី។",
          )}
        </p>
      </section>

      <section aria-labelledby="critical-h" className="card space-y-3 p-6">
        <h2 id="critical-h" className="text-2xl font-semibold">
          {tx("Thinking critically: what analogues cannot tell us", "ការគិតពិចារណា៖ អ្វីដែលទីតាំងស្រដៀងមិនអាចប្រាប់យើងបាន")}
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>
            <strong>{tx("No place on Earth is a perfect copy.", "គ្មានកន្លែងណាលើផែនដីដូចបេះបិទទេ។")}</strong>{" "}
            {tx(
              "Earth has air, weather, liquid water and full gravity; the Moon has none of these and Mars has very little. An analogue is useful for one question at a time, never for all of them.",
              "ផែនដីមានខ្យល់ អាកាសធាតុ ទឹករាវ និងទំនាញពេញលេញ ព្រះច័ន្ទគ្មានអ្វីទាំងនេះទេ ហើយភពអង្គារមានតិចតួចណាស់។ ទីតាំងស្រដៀងមានប្រយោជន៍សម្រាប់សំណួរម្តងមួយ មិនមែនសម្រាប់សំណួរទាំងអស់ទេ។",
            )}
          </li>
          <li>
            <strong>{tx("Similar is not the same.", "ស្រដៀង មិនមែនមានន័យថាដូចគ្នាទេ។")}</strong>{" "}
            {tx(
              "The McMurdo Dry Valleys are the closest match to Shackleton crater in our data, yet their coldest ground is still around 170 K warmer than the crater floor.",
              "ជ្រលងស្ងួត McMurdo ស្រដៀងនឹងរណ្តៅ Shackleton ជាងគេក្នុងទិន្នន័យរបស់យើង ប៉ុន្តែដីត្រជាក់បំផុតរបស់វានៅតែក្តៅជាងបាតរណ្តៅប្រហែល ១៧០ K។",
            )}
          </li>
          <li>
            <strong>{tx("Our scores are a screening tool.", "ពិន្ទុរបស់យើងជាឧបករណ៍ពិនិត្យបឋម។")}</strong>{" "}
            {tx(
              "Three dimensions are measured from satellite data at a 463 m scale; five come from published research, so well-studied sites can look stronger simply because more has been written about them.",
              "វិមាត្របីត្រូវបានវាស់ពីទិន្នន័យផ្កាយរណបនៅមាត្រដ្ឋាន ៤៦៣ ម. ចំណែកប្រាំទៀតមកពីការស្រាវជ្រាវដែលបានបោះពុម្ព ដូច្នេះទីតាំងដែលត្រូវបានសិក្សាច្រើនអាចមើលទៅខ្លាំងជាង ដោយសារតែមានអ្នកសរសេរអំពីវាច្រើន។",
            )}
          </li>
          <li>
            <strong>{tx("Good analogues can be hard to reach.", "ទីតាំងស្រដៀងល្អៗអាចពិបាកទៅដល់។")}</strong>{" "}
            {tx(
              "Antarctica and the High Arctic are scientifically excellent but costly; Hawaii, Lanzarote and Iceland are easier places to train.",
              "អង់តាក់ទិក និងតំបន់អាក់ទិកខ្ពស់ល្អខាងវិទ្យាសាស្ត្រ ប៉ុន្តែថ្លៃ ចំណែកហាវ៉ៃ Lanzarote និងអ៊ីស្លង់ជាកន្លែងហ្វឹកហាត់ដែលងាយស្រួលជាង។",
            )}
          </li>
          <li>
            <strong>{tx("What would make this stronger:", "អ្វីដែលអាចធ្វើឱ្យការងារនេះខ្លាំងជាងមុន៖")}</strong>{" "}
            {tx(
              "field visits to check the top matches, higher-resolution terrain, measured mineral data and an automated search beyond our 21 sites.",
              "ការចុះទីវាលដើម្បីពិនិត្យទីតាំងដែលស្រដៀងបំផុត ទិន្នន័យសណ្ឋានដីដែលច្បាស់ជាងមុន ទិន្នន័យរ៉ែដែលវាស់បាន និងការស្វែងរកដោយស្វ័យប្រវត្តិលើសពីទីតាំង ២១ របស់យើង។",
            )}
          </li>
        </ul>
        <Link href="/methods/" className="btn">
          {tx("See the full method and limitations", "មើលវិធីសាស្ត្រ និងដែនកំណត់ពេញលេញ")}
        </Link>
      </section>

      <section className="card space-y-3 p-6" aria-labelledby="plan-refs">
        <h2 id="plan-refs" className="text-xl font-semibold">
          {tx("References for this page (APA 7th edition)", "ឯកសារយោងសម្រាប់ទំព័រនេះ (ទម្រង់ APA បោះពុម្ពលើកទី ៧)")}
        </h2>
        <RefList refs={USED.map((k) => R[k])} />
      </section>
    </article>
  );
}
