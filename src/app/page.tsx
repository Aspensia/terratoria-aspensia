"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect } from "react";
import { useApp } from "@/components/AppState";
import { ZoomableImage } from "@/components/Lightbox";
import { TeamStrip } from "@/components/Team";
import { textureUrl } from "@/components/three/space";
import { EARTH_SITES, REFERENCES } from "@/data/catalog";
import { DATASETS } from "@/data/datasets";
import { ambient } from "@/lib/audio";
import type { Key } from "@/lib/i18n";
import { DIMENSIONS } from "@/lib/types";

const SolarSystem = dynamic(() => import("@/components/three/SolarSystem").then((m) => m.SolarSystem), { ssr: false });

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type Bi = { en: string; km: string };

const ARCHIVE: { src: string; alt: Bi; caption: Bi }[] = [
  {
    src: `${BASE}/images/apollo-full-moon.jpg`,
    alt: { en: "Full Moon photographed during the Apollo programme", km: "ព្រះច័ន្ទពេញវង់ ថតក្នុងកម្មវិធី Apollo" },
    caption: {
      en: "Full Moon photographed during the Apollo programme. Source: NASA 3D Resources (public domain).",
      km: "ព្រះច័ន្ទពេញវង់ ថតក្នុងកម្មវិធី Apollo។ ប្រភព៖ NASA 3D Resources (សាធារណៈ)។",
    },
  },
  {
    src: `${BASE}/images/apollo-lunar-surface.jpg`,
    alt: { en: "Lunar surface seen from orbit", km: "ផ្ទៃព្រះច័ន្ទមើលពីគន្លងគោចរ" },
    caption: {
      en: "Lunar surface photographed from orbit during the Apollo programme. Source: NASA 3D Resources (public domain).",
      km: "ផ្ទៃព្រះច័ន្ទ ថតពីគន្លងគោចរក្នុងកម្មវិធី Apollo។ ប្រភព៖ NASA 3D Resources (សាធារណៈ)។",
    },
  },
  {
    src: textureUrl("earth"),
    alt: { en: "NASA Blue Marble map of Earth", km: "ផែនទីផែនដី Blue Marble របស់ NASA" },
    caption: {
      en: "NASA Blue Marble with shaded relief and bathymetry, served by NASA GIBS. A static composite, not a live image.",
      km: "NASA Blue Marble ដែលមានស្រមោលសណ្ឋានដី និងជម្រៅសមុទ្រ ពី NASA GIBS។ ជារូបភាពផ្គុំ មិនមែនរូបភាពផ្ទាល់ទេ។",
    },
  },
  {
    src: textureUrl("mars"),
    alt: { en: "Global colour mosaic of Mars", km: "រូបភាពពណ៌ផ្គុំទូទាំងភពអង្គារ" },
    caption: {
      en: "Global colour mosaic of Mars. Source: NASA 3D Resources (public domain).",
      km: "រូបភាពពណ៌ផ្គុំទូទាំងភពអង្គារ។ ប្រភព៖ NASA 3D Resources (សាធារណៈ)។",
    },
  },
];

const WORLDS: { id: "earth" | "moon" | "mars"; line: Bi }[] = [
  {
    id: "moon",
    line: { en: "Shackleton crater at the south pole and the Marius Hills lava-tube pit.", km: "រណ្តៅ Shackleton នៅប៉ូលខាងត្បូង និងរណ្តៅស្រុតបំពង់កម្អែ Marius Hills។" },
  },
  {
    id: "mars",
    line: { en: "Jezero crater's ancient lake and the cave skylights of Arsia Mons.", km: "បឹងបុរាណនៃរណ្តៅ Jezero និងរន្ធធ្លុះរូងភ្នំនៃ Arsia Mons។" },
  },
  {
    id: "earth",
    line: { en: "21 field sites on seven continents, scored against both worlds.", km: "ទីតាំងទីវាល ២១ នៅលើទ្វីបទាំងប្រាំពីរ ដែលដាក់ពិន្ទុធៀបនឹងពិភពទាំងពីរ។" },
  },
];

export default function Home() {
  const { t, lang } = useApp();

  useEffect(() => {
    ambient(true);
    return () => ambient(false);
  }, []);

  const stats: [number, Key][] = [
    [REFERENCES.length, "stat_regions"],
    [EARTH_SITES.length, "stat_sites"],
    [DIMENSIONS.length, "stat_dims"],
    [DATASETS.filter((d) => d.level !== "literature").length, "stat_data"],
  ];

  return (
    <>
      <SolarSystem />
      <div className="relative z-10 space-y-20 pb-10">
        <section className="flex min-h-[68vh] max-w-2xl flex-col justify-center pt-6">
          <p className="label !text-accent">{t("hero_kicker")}</p>
          <h1 className="mt-3 leading-none">
            <span className="block font-mono text-sm tracking-[0.45em] text-accent">PROJECT:</span>
            <span className="mt-2 block text-6xl font-semibold tracking-tight sm:text-7xl">Terratoria</span>
          </h1>
          <p className="mt-4 text-xl text-text/90">{t("tagline")}</p>
          <p className="mt-3 max-w-xl text-muted">{t("hero_desc")}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/discover/" className="btn btn-primary px-5 py-2.5 text-base">
              {t("start_discovering")} →
            </Link>
            <Link href="/explore/" className="btn px-5 py-2.5 text-base">
              {t("explore_3d")}
            </Link>
            <Link href="/plan/" className="btn px-5 py-2.5 text-base">
              {t("nav_plan")}
            </Link>
            <Link href="/challenge/" className="btn px-5 py-2.5 text-base">
              ▶ {t("nav_challenge")}
            </Link>
          </div>
          <dl className="mt-10 grid max-w-xl grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map(([n, k]) => (
              <div key={k} className="border-l border-[var(--line-strong)] pl-3">
                <dt className="sr-only">{t(k)}</dt>
                <dd className="font-mono text-3xl tabular-nums">{n}</dd>
                <dd aria-hidden="true" className="text-xs text-muted">
                  {t(k)}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="worlds-h">
          <h2 id="worlds-h" className="label mb-4">
            {t("worlds_title")}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {WORLDS.map((w) => (
              <Link key={w.id} href={`/explore/?body=${w.id}`} className="card card-hover group flex items-center gap-4 p-5">
                <span
                  aria-hidden="true"
                  className="globe-thumb h-20 w-20 shrink-0 rounded-full"
                  style={{ backgroundImage: `url(${textureUrl(w.id)})` }}
                />
                <span>
                  <span className="block text-lg font-semibold">{t(w.id)}</span>
                  <span className="block text-sm text-muted">{w.line[lang]}</span>
                  <span className="mt-1 block text-sm text-accent transition-transform group-hover:translate-x-1">{t("explore_3d")} →</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="archive-h">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="archive-h" className="label">
              {t("archive_title")}
            </h2>
            <p className="text-xs text-muted">{t("archive_hint")}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {ARCHIVE.map((img) => (
              <ZoomableImage key={img.src} image={{ src: img.src, alt: img.alt[lang], caption: img.caption[lang] }} className="img-frame aspect-square" />
            ))}
          </div>
        </section>

        <TeamStrip />
      </div>
    </>
  );
}
