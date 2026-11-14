"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp, useQuery } from "@/components/AppState";
import { fmtCoord, IndexBadge, ScoreBar, StatusBadge } from "@/components/Bits";
import { ReliefCanvas } from "@/components/ReliefCanvas";
import { EARTH_SITES, getPlace, REFERENCES } from "@/data/catalog";
import { BALANCED, PRESETS } from "@/data/presets";
import { DIMENSION_LABEL, DIMENSION_SIMPLE } from "@/lib/i18n";
import { aggregate, scoreAll } from "@/lib/scoring";
import { parseWeights, serializeWeights } from "@/lib/storage";
import { DIMENSIONS, type Body, type DimensionId, type Weights } from "@/lib/types";

const EarthMap = dynamic(() => import("@/components/EarthMap").then((m) => m.EarthMap), {
  ssr: false,
  loading: () => <div className="card h-[380px] animate-pulse md:h-[480px]" />,
});

type SortKey = "index" | DimensionId;
type StatusFilter = "all" | "known" | "candidate";

const csvCell = (v: string | number | null) => {
  const s = v === null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export default function Discover() {
  const { t, lang, mode, saved, toggleSaved } = useApp();
  const router = useRouter();
  const [params, setQuery] = useQuery();
  const [sort, setSort] = useState<SortKey>("index");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [picked, setPicked] = useState<string[]>([]);
  const [showHow, setShowHow] = useState(false);

  useEffect(() => {
    try {
      setShowHow(window.localStorage.getItem("analogatlas.how") !== "done");
    } catch {
      setShowHow(true);
    }
  }, []);
  const dismissHow = () => {
    setShowHow(false);
    try {
      window.localStorage.setItem("analogatlas.how", "done");
    } catch {
      // not remembered
    }
  };

  const ref = getPlace(params?.get("ref")) ?? REFERENCES[0];
  const refValid = ref.body !== "earth" ? ref : REFERENCES[0];
  const body: Body = refValid.body;
  const weights = useMemo(() => parseWeights(params?.get("w")), [params]);
  const wq = serializeWeights(weights);

  const setWeights = (w: Weights) => setQuery({ w: serializeWeights(w) });
  const activePreset = PRESETS.find((p) => serializeWeights(p.weights) === wq)?.id ?? (wq === serializeWeights(BALANCED) ? "balanced" : null);

  const rows = useMemo(() => {
    const all = EARTH_SITES.map((site) => {
      const results = scoreAll(refValid, site);
      return { site, results, agg: aggregate(results, weights) };
    });
    const key = (r: (typeof all)[number]) => (sort === "index" ? r.agg.index : r.results.find((x) => x.id === sort)!.score) ?? -1;
    return all.sort((a, b) => key(b) - key(a));
  }, [refValid, weights, sort]);

  const overallRank = useMemo(() => {
    const byIndex = [...rows].filter((r) => r.agg.index !== null).sort((a, b) => b.agg.index! - a.agg.index!);
    return new Map(byIndex.map((r, i) => [r.site.id, i + 1]));
  }, [rows]);

  const shown = rows.filter((r) => {
    const known = r.site.status === "established" || r.site.status === "documented";
    return filter === "all" || (filter === "known" ? known : !known);
  });
  const mapSites = useMemo(
    () => rows.map((r) => ({ place: r.site, index: r.agg.index, rank: overallRank.get(r.site.id) ?? null })),
    [rows, overallRank],
  );
  const openSite = useCallback((id: string) => router.push(`/site/?id=${id}&ref=${refValid.id}&w=${wq}`), [router, refValid.id, wq]);
  const noRanking = rows.every((r) => r.agg.index === null);

  const exportCsv = () => {
    const head = ["rank", "site", "country", "lat", "lon", "status", "reference_region", "exploratory_similarity_index", "dimensions_with_data", ...DIMENSIONS.flatMap((d) => [`${d}_score`, `${d}_basis`])];
    const lines = rows.map((r) =>
      [
        overallRank.get(r.site.id) ?? null, r.site.name, r.site.country ?? "", r.site.lat, r.site.lon, r.site.status ?? "", refValid.name,
        r.agg.index === null ? null : r.agg.index.toFixed(1), Math.round(r.agg.coverage * 8),
        ...r.results.flatMap((x) => [x.score === null ? null : x.score.toFixed(1), x.basis]),
      ].map(csvCell).join(","),
    );
    const meta = `# AnalogAtlas export; weights ${DIMENSIONS.map((d) => `${d}=${weights[d]}`).join(" ")}; screening tool not a validated classification; empty score = no data`;
    const blob = new Blob([[meta, head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `analogatlas-${refValid.id}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-8">
      {showHow && (
        <section aria-label={t("how_title")} className="card p-4">
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-semibold">{t("how_title")}</h2>
            <button type="button" className="btn" onClick={dismissHow}>
              {t("dismiss")}
            </button>
          </div>
          <ol className="mt-2 grid gap-3 text-sm text-muted sm:grid-cols-2 lg:grid-cols-4">
            {(["how_1", "how_2", "how_3", "how_4"] as const).map((k, i) => (
              <li key={k} className="flex gap-2">
                <span className="font-mono text-text">{i + 1}</span>
                {t(k)}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="s1" className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <h2 id="s1" className="label">{t("step1")}</h2>
          <div role="group" aria-label={t("step1")} className="mt-2 flex gap-2">
            {(["moon", "mars"] as const).map((b) => (
              <button
                key={b}
                type="button"
                className="btn flex-1 justify-center py-2 text-base"
                aria-pressed={body === b}
                onClick={() => setQuery({ ref: REFERENCES.find((r) => r.body === b)!.id })}
              >
                <span className="h-3 w-3 rounded-full" style={{ background: `var(--${b})` }} aria-hidden="true" />
                {t(b)}
              </button>
            ))}
          </div>

          <h2 className="label mt-6">{t("step2")}</h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {REFERENCES.filter((r) => r.body === body).map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={r.id === refValid.id}
                onClick={() => setQuery({ ref: r.id })}
                className={`card p-3 text-left ${r.id === refValid.id ? "border-accent ring-1 ring-accent" : "hover:border-accent"}`}
              >
                <span className="block font-semibold">{r.name}</span>
                <span className="block text-xs text-muted">{r.category}</span>
                <span className="mt-1 block font-mono text-xs text-muted">{fmtCoord(r)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card grid gap-4 p-4 sm:grid-cols-[200px_1fr]">
          <ReliefCanvas place={refValid} />
          <div>
            <p className="label">{t("target")}</p>
            <h3 className="text-xl font-semibold">{refValid.name}</h3>
            <p className="mt-1 text-sm text-muted">{refValid.summary}</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {refValid.terrain && (
                <>
                  <dt className="text-muted">Median slope</dt>
                  <dd className="font-mono">{refValid.terrain.slopeMedianDeg.toFixed(1)}°</dd>
                  <dt className="text-muted">Local relief</dt>
                  <dd className="font-mono">{refValid.terrain.reliefM} m</dd>
                </>
              )}
              {refValid.climate ? (
                <>
                  <dt className="text-muted">{t("temperature")}</dt>
                  <dd className="font-mono">
                    {refValid.climate.minK.toFixed(0)}–{refValid.climate.maxK.toFixed(0)} K
                  </dd>
                </>
              ) : (
                <>
                  <dt className="text-muted">{t("temperature")}</dt>
                  <dd className="text-muted">{t("basis_none")}</dd>
                </>
              )}
            </dl>
          </div>
        </div>
      </section>

      <section aria-labelledby="s3" className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="s3" className="label">{t("step3")}</h2>
          <button type="button" className="btn" onClick={() => setWeights(BALANCED)}>
            {t("reset")}
          </button>
        </div>
        <div role="group" aria-label={t("presets")} className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn" aria-pressed={activePreset === "balanced"} onClick={() => setWeights(BALANCED)}>
            {t("balanced")}
          </button>
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className="btn" aria-pressed={activePreset === p.id} title={p.explain} onClick={() => setWeights(p.weights)}>
              {p.name}
            </button>
          ))}
        </div>
        {activePreset && activePreset !== "balanced" && (
          <p className="mt-2 text-sm text-muted">{PRESETS.find((p) => p.id === activePreset)!.explain}</p>
        )}
        <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          {DIMENSIONS.map((d) => (
            <div key={d}>
              <label htmlFor={`w-${d}`} className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{DIMENSION_LABEL[lang][d]}</span>
                <span className="font-mono text-muted">{weights[d] === 0 ? "off" : weights[d]}</span>
              </label>
              <input
                id={`w-${d}`}
                type="range"
                min={0}
                max={100}
                step={5}
                value={weights[d]}
                onChange={(e) => setWeights({ ...weights, [d]: Number(e.target.value) })}
                className="w-full"
                aria-valuetext={weights[d] === 0 ? "off" : String(weights[d])}
              />
              {mode === "simple" && <p className="text-xs text-muted">{DIMENSION_SIMPLE[lang][d]}</p>}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="s4" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="s4" className="label">{t("step4")}</h2>
            <p className="text-sm text-muted">
              {refValid.name} · {t("coverage_note")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <label className="flex items-center gap-1.5">
              <span className="text-muted">Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="btn">
                <option value="index">{t("overall")}</option>
                {DIMENSIONS.map((d) => (
                  <option key={d} value={d}>
                    {DIMENSION_LABEL[lang][d]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5">
              <span className="text-muted">Show</span>
              <select value={filter} onChange={(e) => setFilter(e.target.value as StatusFilter)} className="btn">
                <option value="all">All sites</option>
                <option value="known">{t("legend_known")}</option>
                <option value="candidate">{t("legend_new")}</option>
              </select>
            </label>
            <button type="button" className="btn" onClick={exportCsv}>
              {t("export_csv")}
            </button>
            <Link
              href={`/compare/?ref=${refValid.id}&sites=${picked.join(",")}&w=${wq}`}
              aria-disabled={picked.length === 0}
              className={`btn btn-primary ${picked.length === 0 ? "pointer-events-none opacity-50" : ""}`}
            >
              {t("compare_selected")} ({picked.length}/3)
            </Link>
          </div>
        </div>

        <EarthMap sites={mapSites} onOpen={openSite} />

        {noRanking && <p className="card border-warn p-4 text-sm">{t("zero_weights")}</p>}
        {shown.length === 0 && <p className="card p-4 text-sm text-muted">No sites match this filter.</p>}

        <ol className="grid gap-3 lg:grid-cols-2">
          {shown.map(({ site, results, agg }) => {
            const rank = overallRank.get(site.id);
            const isPicked = picked.includes(site.id);
            return (
              <li key={site.id} className="card flex flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm text-muted">{rank ? `#${rank}` : "–"}</span>
                      <h3 className="text-lg font-semibold leading-tight">
                        <Link href={`/site/?id=${site.id}&ref=${refValid.id}&w=${wq}`} className="hover:underline">
                          {site.name}
                        </Link>
                      </h3>
                    </div>
                    <p className="text-sm text-muted">
                      {site.country} · <span className="font-mono text-xs">{fmtCoord(site)}</span>
                    </p>
                    <div className="mt-1.5">
                      <StatusBadge status={site.status} />
                    </div>
                  </div>
                  <IndexBadge agg={agg} />
                </div>
                <div className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                  {results.map((r) => (
                    <ScoreBar key={r.id} r={r} />
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/site/?id=${site.id}&ref=${refValid.id}&w=${wq}`} className="btn btn-primary">
                    {t("open_profile")}
                  </Link>
                  <button
                    type="button"
                    className="btn"
                    aria-pressed={isPicked}
                    disabled={!isPicked && picked.length >= 3}
                    title={t("compare_limit")}
                    onClick={() => setPicked((p) => (isPicked ? p.filter((x) => x !== site.id) : [...p, site.id]))}
                  >
                    {isPicked ? t("remove_compare") : t("add_compare")}
                  </button>
                  <button type="button" className="btn" aria-pressed={saved.includes(site.id)} onClick={() => toggleSaved(site.id)}>
                    {saved.includes(site.id) ? t("saved") : t("save")}
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
