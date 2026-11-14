"use client";

import Link from "next/link";
import { RefList } from "@/components/Bits";
import { useApp } from "@/components/AppState";
import { R, type RefKey } from "@/data/references";
import { cite } from "@/lib/cite";

const Cite = ({ k }: { k: RefKey[] }) => <span className="text-muted">({k.map(cite).join("; ")})</span>;

const EXAMPLES: { title: string; where: { name: string; id: string }[]; did: string; teaches: string; refs: RefKey[] }[] = [
  {
    title: "Apollo crews learned geology on Earth first",
    where: [
      { name: "Meteor Crater", id: "meteor-crater" },
      { name: "Nördlinger Ries", id: "ries" },
      { name: "Askja, Iceland", id: "askja" },
    ],
    did: "Before landing on the Moon, Apollo astronauts trained in volcanic fields and impact craters on Earth so they could recognise rocks and choose samples on the lunar surface.",
    teaches: "Training on the right kind of ground made every hour on the Moon count. The same idea guides Artemis crews today.",
    refs: ["phinney2015"],
  },
  {
    title: "Living and drilling in the High Arctic",
    where: [{ name: "Haughton impact structure", id: "haughton" }],
    did: "The Haughton-Mars Project has run field seasons in a polar impact crater since 1997, and NASA tested an automated drill for Mars there.",
    teaches: "How crews and machines cope with cold, isolation and frozen ground, and how to drill without a human at the controls.",
    refs: ["lee2005", "glass2008"],
  },
  {
    title: "Rovers hunting for life in the driest desert",
    where: [{ name: "Atacama Desert", id: "atacama-yungay" }],
    did: "Soils in the Atacama's hyperarid core are so dry that they hold almost no organic material, like Mars. Science teams drove rovers across it to practise searching for life remotely.",
    teaches: "How to tell a real sign of life from a false alarm in nearly sterile ground, before trying it on Mars.",
    refs: ["navarrogonzalez2003", "cabrol2007"],
  },
  {
    title: "Salt flats that test Mars orbiters",
    where: [{ name: "Death Valley", id: "death-valley" }],
    did: "Scientists mapped the Badwater Basin salt flats with the same kind of thermal instruments that orbit Mars, and found microbes preserved inside salt crystals.",
    teaches: "Whether orbiters can spot salt minerals left by evaporating water on Mars, and where ancient life could be sealed away.",
    refs: ["baldridge2004", "schubert2009"],
  },
  {
    title: "Spacewalks on fresh lava",
    where: [
      { name: "Mauna Loa, Hawaii", id: "mauna-loa" },
      { name: "Craters of the Moon, Idaho", id: "craters-of-the-moon" },
    ],
    did: "NASA's BASALT programme ran simulated Mars spacewalks on young lava flows, with time delays to mission control. HI-SEAS crews on Mauna Loa practised exploring lava tubes.",
    teaches: "How science teams on Earth and crews on another world can work together despite communication delays.",
    refs: ["lim2019", "musilova2021"],
  },
  {
    title: "Astronauts training in a lava cave",
    where: [{ name: "Lanzarote", id: "lanzarote" }],
    did: "ESA's PANGAEA course trains astronauts in field geology on Lanzarote's young lava fields and inside its 7.6 km Corona lava tube.",
    teaches: "Recognising volcanic rocks and caves, which matters for using lunar lava tubes as shelters.",
    refs: ["sauro2023"],
  },
  {
    title: "Drilling for buried life",
    where: [{ name: "Río Tinto, Spain", id: "rio-tinto" }],
    did: "The MARTE experiment simulated a robotic Mars drilling mission in Río Tinto's iron- and sulfate-rich ground and checked the results against what remote science teams predicted.",
    teaches: "How well a robot drill and a remote team can find hidden life, and where they go wrong.",
    refs: ["bonaccorsi2008", "amils2007"],
  },
  {
    title: "The coldest, driest ice-cemented ground",
    where: [{ name: "McMurdo Dry Valleys", id: "mcmurdo-dry-valleys" }],
    did: "In Antarctica's high Dry Valleys the ground stays frozen year round, with dry soil sitting on top of ice-cemented ground, much like the ice-rich ground found near the poles of Mars.",
    teaches: "Where buried ice survives and how deep to dig for it: the same question a lunar or Martian base must answer for its water.",
    refs: ["marchant2007", "mckay2008"],
  },
];

const STEPS: { need: string; moon: string; earth: { name: string; id: string }[]; how: string; refs: RefKey[] }[] = [
  {
    need: "1. Pick a site with sunlight and water",
    moon: "The rims around Shackleton crater at the lunar south pole are lit for most of the year, while the crater floor next to them stays in permanent shadow, cold enough to trap water ice.",
    earth: [
      { name: "McMurdo Dry Valleys", id: "mcmurdo-dry-valleys" },
      { name: "Svalbard", id: "svalbard-bockfjorden" },
    ],
    how: "Test solar power, batteries and machinery under months of low sun and deep cold.",
    refs: ["mazarico2011", "paige2010", "li2018"],
  },
  {
    need: "2. Get water from the ground",
    moon: "Ice in permanently shadowed craters could supply drinking water, oxygen and rocket fuel.",
    earth: [
      { name: "Haughton", id: "haughton" },
      { name: "McMurdo Dry Valleys", id: "mcmurdo-dry-valleys" },
    ],
    how: "Practise automated drilling in frozen ground and learn where ice survives below dry soil.",
    refs: ["zuber2012", "glass2008", "mckay2008"],
  },
  {
    need: "3. Find shelter from radiation and temperature swings",
    moon: "A collapse pit in the Marius Hills appears to open into an intact lava tube, a ready-made cave that could shield a habitat.",
    earth: [
      { name: "Lanzarote", id: "lanzarote" },
      { name: "Mauna Loa", id: "mauna-loa" },
      { name: "Harrat Khaybar", id: "harrat-khaybar" },
    ],
    how: "Map lava tubes with robots and crews, and test how habitats could be placed inside them.",
    refs: ["haruyama2009", "kaku2017", "sauro2020"],
  },
  {
    need: "4. Move and build on sharp, dusty ground",
    moon: "Lunar dust is fine, sharp and clings to everything; it wears out seals, joints and spacesuits.",
    earth: [
      { name: "Askja, Iceland", id: "askja" },
      { name: "Craters of the Moon", id: "craters-of-the-moon" },
    ],
    how: "Drive rovers and test construction on loose volcanic sand and rough lava, the closest Earth materials to lunar soil.",
    refs: ["colwell2007", "mangold2011"],
  },
  {
    need: "5. Live and work there for months",
    moon: "Artemis aims for crews to stay longer on the lunar surface and to do real field science while they are there.",
    earth: [
      { name: "Mauna Loa (HI-SEAS)", id: "mauna-loa" },
      { name: "Haughton", id: "haughton" },
    ],
    how: "Rehearse long missions in isolated habitats and train crews to choose samples like field geologists.",
    refs: ["nasa2020", "lim2019", "lee2005"],
  },
];

const USED: RefKey[] = [...new Set([...EXAMPLES.flatMap((e) => e.refs), ...STEPS.flatMap((s) => s.refs), "farley2020", "phinney2015"] as RefKey[])];

const SiteLinks = ({ list }: { list: { name: string; id: string }[] }) => (
  <span className="flex flex-wrap gap-1.5">
    {list.map((w) => (
      <Link key={w.id + w.name} href={`/site/?id=${w.id}`} className="chip chip-ok rounded-full px-2.5 py-0.5 text-xs hover:brightness-125">
        {w.name} →
      </Link>
    ))}
  </span>
);

export default function PlanPage() {
  const { t } = useApp();
  return (
    <article className="mx-auto max-w-5xl space-y-10">
      <header className="space-y-3">
        <p className="label">{t("nav_plan")}</p>
        <h1 className="text-4xl font-semibold tracking-tight">From Earth analogues to a self-sustaining lunar base</h1>
        <p className="max-w-3xl text-lg">
          PROJECT: Terratoria uses NASA and partner-agency datasets to study the environments of the Moon and Mars, find places on Earth with similar
          features, and use those places to plan experiments for building bases on other worlds.
        </p>
        <p className="max-w-3xl text-muted">
          Visitors can explore, side by side, how the landscapes of Earth compare with the Moon and Mars, and see how lessons learned at home could help
          build a self-sustaining lunar base. Places such as the Atacama Desert, the Haughton impact crater and Death Valley share features with the Moon or
          Mars, so experiments there can help map the plan before anyone leaves Earth. NASA has done this before: Apollo astronauts rehearsed lunar field
          geology at sites on Earth that resembled the Moon <Cite k={["phinney2015"]} />. Our research draws on several biomes, from polar deserts to volcanic
          fields, and every source is listed below and on the{" "}
          <Link href="/methods/" className="text-accent underline">
            Data and Methods
          </Link>{" "}
          page.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link href="/discover/" className="btn btn-primary">
            Rank the analogues yourself →
          </Link>
          <Link href="/explore/?body=moon&focus=moon-shackleton" className="btn">
            See Shackleton crater in 3D
          </Link>
        </div>
      </header>

      <section aria-labelledby="examples-h" className="space-y-4">
        <div>
          <h2 id="examples-h" className="text-2xl font-semibold">
            Critical examples: analogues that shaped real missions
          </h2>
          <p className="text-sm text-muted">Each example is a documented field campaign. Select a place to see how it scores in Terratoria.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {EXAMPLES.map((e) => (
            <section key={e.title} className="card card-hover space-y-2 p-5">
              <h3 className="text-lg font-semibold">{e.title}</h3>
              <SiteLinks list={e.where} />
              <p className="text-sm">
                {e.did} <Cite k={e.refs} />
              </p>
              <p className="text-sm">
                <span className="font-semibold text-accent">What it teaches: </span>
                {e.teaches}
              </p>
            </section>
          ))}
        </div>
      </section>

      <section aria-labelledby="steps-h" className="space-y-4">
        <div>
          <h2 id="steps-h" className="text-2xl font-semibold">
            The plan: five steps toward a self-sustaining lunar base
          </h2>
          <p className="text-sm text-muted">Each step pairs a need on the Moon with the Earth sites where it can be tested first.</p>
        </div>
        <ol className="space-y-3">
          {STEPS.map((s) => (
            <li key={s.need} className="card grid gap-4 p-5 md:grid-cols-[1fr_1fr]">
              <div>
                <h3 className="text-lg font-semibold">{s.need}</h3>
                <p className="mt-1 text-sm">
                  <span className="label !text-moon">On the Moon </span>
                  <br />
                  {s.moon} <Cite k={s.refs.slice(0, 2)} />
                </p>
              </div>
              <div className="space-y-2 border-t border-line pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
                <p className="label !text-earth">Test it on Earth</p>
                <SiteLinks list={s.earth} />
                <p className="text-sm">
                  {s.how} <Cite k={s.refs.slice(2)} />
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="card p-5 text-sm">
          <span className="font-semibold">And then Mars.</span> The same approach carries to Mars. Perseverance is collecting samples in Jezero crater&apos;s
          ancient lake <Cite k={["farley2020"]} />, and the Atacama Desert, Pilbara, Río Tinto and Death Valley are where teams practise recognising signs of
          ancient life and water before samples come home.
        </p>
      </section>

      <section aria-labelledby="critical-h" className="card space-y-3 p-6">
        <h2 id="critical-h" className="text-2xl font-semibold">
          Thinking critically: what analogues cannot tell us
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>
            <strong>No place on Earth is a perfect copy.</strong> Earth has air, weather, liquid water and full gravity; the Moon has none of these and Mars
            has very little. An analogue is useful for one question at a time, never for all of them.
          </li>
          <li>
            <strong>Similar is not the same.</strong> The McMurdo Dry Valleys are the closest match to Shackleton crater in our data, yet their coldest ground
            is still around 170 K warmer than the crater floor.
          </li>
          <li>
            <strong>Our scores are a screening tool.</strong> Three dimensions are measured from satellite data at a 463 m scale; five come from published
            research, so well-studied sites can look stronger simply because more has been written about them.
          </li>
          <li>
            <strong>Good analogues can be hard to reach.</strong> Antarctica and the High Arctic are scientifically excellent but costly; Hawaii, Lanzarote and
            Iceland are easier places to train.
          </li>
          <li>
            <strong>What would make this stronger:</strong> field visits to check the top matches, higher-resolution terrain, measured mineral data and an
            automated search beyond our 21 sites.
          </li>
        </ul>
        <Link href="/methods/" className="btn">
          See the full method and limitations
        </Link>
      </section>

      <section className="card space-y-3 p-6" aria-labelledby="plan-refs">
        <h2 id="plan-refs" className="text-xl font-semibold">
          References for this page (APA 7th edition)
        </h2>
        <RefList refs={USED.map((k) => R[k])} />
      </section>
    </article>
  );
}
