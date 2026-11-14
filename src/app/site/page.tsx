"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp, useQuery } from "@/components/AppState";
import { fmtCoord, IndexBadge, PlainSummary, ProvenancePanel, RefList, ScoreBar, StatusBadge } from "@/components/Bits";
import { ProfileChart, SlopeChart } from "@/components/Charts";
import { ReliefCanvas } from "@/components/ReliefCanvas";
import { getPlace, REFERENCES } from "@/data/catalog";
import { GENERAL_LIMITS, LIMITS } from "@/data/limits";
import { DIMENSION_LABEL, type Key } from "@/lib/i18n";
import { aggregate, explain, scoreAll } from "@/lib/scoring";
import { parseWeights, serializeWeights } from "@/lib/storage";
import { DIMENSIONS, type DimensionResult, type Place } from "@/lib/types";

function NotFound() {
  const { t } = useApp();
  return (
    <div className="card mx-auto max-w-lg p-8 text-center">
      <h1 className="text-xl font-semibold">{t("not_found")}</h1>
      <Link href="/discover/" className="btn btn-primary mt-4">
        {t("back_discover")}
      </Link>
    </div>
  );
}

const K = (v?: number) => (v === undefined ? "–" : `${v.toFixed(0)} K`);

function MetricsTable({ site, refPlace }: { site: Place; refPlace: Place }) {
  const { t } = useApp();
  const rows: [string, string, string][] = [
    ["Median slope", site.terrain ? `${site.terrain.slopeMedianDeg.toFixed(1)}°` : "–", refPlace.terrain ? `${refPlace.terrain.slopeMedianDeg.toFixed(1)}°` : "–"],
    ["90th percentile slope", site.terrain ? `${site.terrain.slopeP90Deg.toFixed(1)}°` : "–", refPlace.terrain ? `${refPlace.terrain.slopeP90Deg.toFixed(1)}°` : "–"],
    ["Local relief (2nd to 98th percentile)", site.terrain ? `${site.terrain.reliefM} m` : "–", refPlace.terrain ? `${refPlace.terrain.reliefM} m` : "–"],
    ["Roughness at 463 m", site.terrain ? `${site.terrain.roughnessM.toFixed(1)} m` : "–", refPlace.terrain ? `${refPlace.terrain.roughnessM.toFixed(1)} m` : "–"],
    ["Valid data in window", site.terrain ? `${(site.terrain.validFraction * 100).toFixed(0)}%` : "–", refPlace.terrain ? `${(refPlace.terrain.validFraction * 100).toFixed(0)}%` : "–"],
    [`${t("temperature")}: ${t("mean")}`, K(site.climate?.meanK), K(refPlace.climate?.meanK)],
    [`${t("temperature")}: ${t("min")}`, K(site.climate?.minK), K(refPlace.climate?.minK)],
    [`${t("temperature")}: ${t("max")}`, K(site.climate?.maxK), K(refPlace.climate?.maxK)],
    [t("wind"), site.climate?.windMs !== undefined ? `${site.climate.windMs.toFixed(1)} m/s` : "–", refPlace.climate?.windMs !== undefined ? `${refPlace.climate.windMs.toFixed(1)} m/s` : "–"],
  ];
  return (
    <div className="card overflow-x-auto p-4">
      <table className="w-full min-w-[420px] text-sm">
        <thead className="label text-left">
          <tr>
            <th className="py-1 pr-3">Measured value</th>
            <th className="py-1 pr-3">{site.name}</th>
            <th className="py-1">{refPlace.name}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, a, b]) => (
            <tr key={label} className="border-t border-line">
              <th scope="row" className="py-1.5 pr-3 text-left font-normal text-muted">{label}</th>
              <td className="py-1.5 pr-3 font-mono">{a}</td>
              <td className="py-1.5 font-mono">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted">
        A dash means no data. {site.climate && <>Earth climate: {site.climate.cite}. </>}
        {refPlace.climate && <>Reference: {refPlace.climate.cite}.</>}
      </p>
    </div>
  );
}

function Bucket({ title, items, tone }: { title: string; items: DimensionResult[]; tone: string }) {
  if (items.length === 0) return null;
  return (
    <section className="card p-4">
      <h3 className="flex items-center gap-2 font-semibold">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: tone }} aria-hidden="true" />
        {title} <span className="font-normal text-muted">({items.length})</span>
      </h3>
      <div className="mt-3 space-y-5">
        {items.map((r) => (
          <ScoreBar key={r.id} r={r} detail />
        ))}
      </div>
    </section>
  );
}

export default function SitePage() {
  const { t, lang, mode, saved, toggleSaved } = useApp();
  const [params, setQuery] = useQuery();
  const [copied, setCopied] = useState(false);

  const site = getPlace(params?.get("id"));
  const refParam = getPlace(params?.get("ref"));
  const refPlace = refParam && refParam.body !== "earth" ? refParam : REFERENCES[0];
  const weights = useMemo(() => parseWeights(params?.get("w")), [params]);

  const results = useMemo(() => (site ? scoreAll(refPlace, site) : []), [site, refPlace]);
  if (params === null) return <div className="card h-96 animate-pulse" aria-label={t("loading")} />;
  if (!site || site.body !== "earth") return <NotFound />;

  const agg = aggregate(results, weights);
  const ex = explain(results);
  const scoreOf = (id: string) => results.find((r) => r.id === id)?.score ?? null;
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t("share"), window.location.href);
    }
  };
  const isSaved = saved.includes(site.id);
  const cites = DIMENSIONS.flatMap((d) => [
    ...(site.attributes[d]?.cites ?? []).map((c) => ({ d, who: site.name, c })),
    ...(refPlace.attributes[d]?.cites ?? []).map((c) => ({ d, who: refPlace.name, c })),
  ]);
  const uniqueCites = [...new Set(cites.map((c) => c.c))].sort();

  return (
    <article className="space-y-6">
      <header className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="label">{site.category}</p>
            <h1 className="text-3xl font-semibold tracking-tight">{site.name}</h1>
            <p className="mt-1 text-muted">
              {site.country} · <span className="font-mono text-sm">{fmtCoord(site)}</span>
            </p>
            <div className="mt-2">
              <StatusBadge status={site.status} />
            </div>
          </div>
          <IndexBadge agg={agg} size="lg" />
        </div>
        <p className="mt-4 max-w-3xl">{site.summary}</p>
        <p className="mt-2 text-sm text-muted">{t("screening_note")}</p>

        <div className="no-print mt-4 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">{t("target")}</span>
            <select className="btn" value={refPlace.id} onChange={(e) => setQuery({ ref: e.target.value })}>
              {REFERENCES.map((r) => (
                <option key={r.id} value={r.id}>
                  {t(r.body as Key)}: {r.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            {t("download_report")}
          </button>
          <button type="button" className="btn" onClick={share}>
            {copied ? t("copied") : t("share")}
          </button>
          <button type="button" className="btn" aria-pressed={isSaved} onClick={() => toggleSaved(site.id)}>
            {isSaved ? t("saved") : t("save")}
          </button>
          <Link className="btn" href={`/compare/?ref=${refPlace.id}&sites=${site.id}&w=${serializeWeights(weights)}`}>
            {t("compare")}
          </Link>
        </div>
        <p className="mt-3 hidden text-sm print:block">
          Compared against: {refPlace.name} ({fmtCoord(refPlace)}). Weights: {DIMENSIONS.map((d) => `${DIMENSION_LABEL.en[d]} ${weights[d]}`).join(", ")}. Report generated {new Date().toISOString().slice(0, 10)}.
        </p>
      </header>

      <div className="simple-only card space-y-1 p-4">
        <PlainSummary results={results} />
        <p className="no-print text-sm text-muted">{t("simple_hint")}</p>
      </div>

      <section className="grid gap-4 lg:grid-cols-2" aria-label="Similarity by dimension">
        <Bucket title={t("strong")} items={ex.strong} tone="var(--ok)" />
        <Bucket title={t("moderate")} items={ex.moderate} tone="var(--accent)" />
        <Bucket title={t("weak")} items={ex.weak} tone="var(--warn)" />
        <Bucket title={t("unknown")} items={ex.unknown} tone="var(--muted)" />
      </section>

      <section className="space-y-4" aria-labelledby="terrain-h">
        <h2 id="terrain-h" className="text-xl font-semibold">{t("terrain_compare")}</h2>
        <p className="text-sm text-muted">{t("relief_view")}. Both windows are 60 km across at the same pixel size. Neither image is stretched or recoloured to resemble the other.</p>
        <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
          <ReliefCanvas place={site} />
          <ReliefCanvas place={refPlace} />
        </div>
        <div className="science-only space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ProfileChart refPlace={refPlace} sites={[site]} />
            <SlopeChart refPlace={refPlace} sites={[site]} />
          </div>
          <MetricsTable site={site} refPlace={refPlace} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="font-semibold">{t("use_cases")}</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {(site.useCases ?? []).map((u) => {
              const supported = u.because.filter((d) => (scoreOf(d) ?? 0) >= 40);
              return (
                <li key={u.title} className="border-l-2 pl-3" style={{ borderColor: supported.length ? "var(--ok)" : "var(--line)" }}>
                  <span className="font-medium">{u.title}</span>
                  <span className="block text-muted">
                    {supported.length > 0
                      ? `${t("use_supported")}: ${supported.map((d) => `${DIMENSION_LABEL[lang][d]} (${scoreOf(d)!.toFixed(0)})`).join(", ")}`
                      : `${t("use_weak")}: ${u.because.map((d) => DIMENSION_LABEL[lang][d]).join(", ")}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card p-4">
          <h2 className="font-semibold">{t("differences")}</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
            {(site.differences ?? []).map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <h3 className="mt-4 text-sm font-semibold">
            {t("limits_title")} ({t(refPlace.body as Key)})
          </h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted">
            {LIMITS[refPlace.body as "moon" | "mars"].map((d) => (
              <li key={d}>{d}</li>
            ))}
            {mode === "science" && GENERAL_LIMITS.map((d) => <li key={d}>{d}</li>)}
          </ul>
        </section>
      </div>

      <section className="card p-4">
        <h2 className="font-semibold">{t("why_selected")}</h2>
        <p className="mt-2 text-sm">
          <StatusBadge status={site.status} /> <span className="text-muted">{site.statusCite}</span>
        </p>
      </section>

      <div className="science-only">
        <ProvenancePanel places={[site, refPlace]} />
      </div>

      <details className="science-only card p-4" open>
        <summary className="cursor-pointer font-semibold">References, APA 7th edition ({uniqueCites.length})</summary>
        <div className="mt-3">
          <RefList refs={uniqueCites} />
        </div>
        <p className="mt-3 text-xs text-muted">Each reference was checked against its Crossref or NASA record in November 2026.</p>
      </details>
    </article>
  );
}
