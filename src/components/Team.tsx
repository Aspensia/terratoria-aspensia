"use client";

import Link from "next/link";
import { initials, TEAM } from "@/data/team";
import { TEAM_KM } from "@/data/km";
import { useApp } from "./AppState";
import { AspensiaLogo } from "./Shell";

// Quiet graphite tiles; a slight shift in tone keeps the six apart.
const HUES = [
  ["#2a2d33", "#3d4149"],
  ["#2c2f35", "#41454d"],
  ["#2b2e34", "#3f434b"],
  ["#2d3036", "#43474f"],
  ["#2a2d32", "#3c4048"],
  ["#2c2f34", "#42464e"],
];

function Avatar({ name, i, size = 48 }: { name: string; i: number; size?: number }) {
  const [a, b] = HUES[i % HUES.length];
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-2xl font-semibold text-white shadow-lg"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(135deg, ${a}, ${b})` }}
    >
      {initials(name)}
    </span>
  );
}

/** Full team section: logo, story and one card per member. */
export function TeamSection() {
  const { t, lang } = useApp();
  return (
    <section id="team" aria-labelledby="team-h" className="card space-y-5 p-6">
      <div className="flex flex-wrap items-center gap-4">
        <AspensiaLogo size={64} />
        <div>
          <p className="label">{t("made_by")}</p>
          <h2 id="team-h" className="text-2xl font-semibold">
            {t("team_title")}
          </h2>
        </div>
      </div>
      <p className="max-w-3xl">{t("aspensia_story")}</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {TEAM.map((m, i) => (
          <li key={m.name} className="card card-hover flex gap-3 p-4">
            <Avatar name={m.name} i={i} />
            <div className="min-w-0">
              <p className="font-semibold">{m.name}</p>
              <p className="text-sm text-accent">{lang === "km" ? TEAM_KM[m.name].role : m.role}</p>
              <p className="mt-1 text-sm text-muted">{lang === "km" ? TEAM_KM[m.name].work : m.work}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Compact strip for the home page. */
export function TeamStrip() {
  const { t, lang } = useApp();
  return (
    <section className="card flex flex-wrap items-center gap-5 p-6">
      <AspensiaLogo size={64} />
      <div className="min-w-0 flex-1">
        <p className="label">{t("made_by")}</p>
        <p className="mt-1 max-w-2xl">{t("aspensia_short")}</p>
        <div className="mt-3 flex -space-x-2">
          {TEAM.map((m, i) => (
            <span key={m.name} title={`${m.name}, ${lang === "km" ? TEAM_KM[m.name].role : m.role}`} className="rounded-2xl ring-2 ring-[var(--bg)] transition-transform hover:z-10 hover:-translate-y-1">
              <Avatar name={m.name} i={i} size={40} />
            </span>
          ))}
        </div>
      </div>
      <Link href="/about/#team" className="btn btn-primary">
        {t("meet_team")} →
      </Link>
    </section>
  );
}
