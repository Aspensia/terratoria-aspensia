"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect } from "react";
import { useApp } from "@/components/AppState";
import { ZoomableImage, type ViewerImage } from "@/components/Lightbox";
import { AspensiaLogo } from "@/components/Shell";
import { textureUrl } from "@/components/three/space";
import { EARTH_SITES, REFERENCES } from "@/data/catalog";
import { DATASETS } from "@/data/datasets";
import { ambient } from "@/lib/audio";
import type { Key } from "@/lib/i18n";
import { DIMENSIONS } from "@/lib/types";

const SolarSystem = dynamic(() => import("@/components/three/SolarSystem").then((m) => m.SolarSystem), { ssr: false });

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const ARCHIVE: ViewerImage[] = [
  { src: `${BASE}/images/apollo-full-moon.jpg`, alt: "Full Moon photographed during the Apollo programme", caption: "Full Moon photographed during the Apollo programme. Source: NASA 3D Resources (public domain)." },
  { src: `${BASE}/images/apollo-lunar-surface.jpg`, alt: "Lunar surface seen from orbit", caption: "Lunar surface photographed from orbit during the Apollo programme. Source: NASA 3D Resources (public domain)." },
  { src: textureUrl("earth"), alt: "NASA Blue Marble map of Earth", caption: "NASA Blue Marble with shaded relief and bathymetry, served by NASA GIBS. A static composite, not a live image." },
  { src: textureUrl("mars"), alt: "Global colour mosaic of Mars", caption: "Global colour mosaic of Mars. Source: NASA 3D Resources (public domain)." },
];

const WORLDS: { id: "earth" | "moon" | "mars"; line: string }[] = [
  { id: "moon", line: "Shackleton crater at the south pole and the Marius Hills lava-tube pit." },
  { id: "mars", line: "Jezero crater's ancient lake and the cave skylights of Arsia Mons." },
  { id: "earth", line: "20 field sites on seven continents, scored against both worlds." },
];

export default function Home() {
  const { t } = useApp();

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
                  <span className="block text-sm text-muted">{w.line}</span>
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
              <ZoomableImage key={img.src} image={img} className="aspect-square" />
            ))}
          </div>
        </section>

        <section className="card flex flex-wrap items-center gap-5 p-6">
          <AspensiaLogo size={64} />
          <div className="min-w-0 flex-1">
            <p className="label">{t("made_by")}</p>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              {t("screening_note")} {t("coverage_note")}
            </p>
          </div>
          <Link href="/about/" className="btn">
            {t("nav_about")}
          </Link>
        </section>
      </div>
    </>
  );
}
