"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useApp, useQuery } from "@/components/AppState";
import { fmtCoord, IndexBadge, ProvenancePanel, StatusBadge } from "@/components/Bits";
import { DimensionChart, ProfileChart, SERIES, SlopeChart } from "@/components/Charts";
import { ReliefCanvas } from "@/components/ReliefCanvas";
import { EARTH_SITES, getPlace, REFERENCES } from "@/data/catalog";
import { LIMITS } from "@/data/limits";
import { DIMENSION_LABEL, type Key } from "@/lib/i18n";
import { aggregate, explain, scoreAll } from "@/lib/scoring";
import { parseWeights, serializeWeights } from "@/lib/storage";
import type { Place } from "@/lib/types";

export default function ComparePage() {
  const { t, lang } = useApp();
  const [params, setQuery] = useQuery();

  const refParam = getPlace(params?.get("ref"));
  const refPlace = refParam && refParam.body !== "earth" ? refParam : REFERENCES[0];
  const weights = useMemo(() => parseWeights(params?.get("w")), [params]);
  // Unknown or duplicate ids in a shared link are ignored rather than breaking the page.
  const sites = useMemo(
    () =>
      [...new Set((params?.get("sites") ?? "").split(",").filter(Boolean))]
        .map((id) => getPlace(id))
        .filter((p): p is Place => !!p && p.body === "earth")
        .slice(0, 3),
    [params],
  );
  const results = useMemo(() => sites.map((s) => scoreAll(refPlace, s)), [sites, refPlace]);
  if (params === null) return <div className="card h-96 animate-pulse" aria-label={t("loading")} />;

  const setSites = (ids: string[]) => setQuery({ sites: ids.join(",") });
  const wq = serializeWeights(weights);
  const available = EARTH_SITES.filter((s) => !sites.includes(s));

  return (
    <div className="space-y-6">
      <header className="card p-5">
        <h1 className="text-2xl font-semibold">{t("nav_compare")}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-muted">{t("target")}</span>
            <select className="btn" value={refPlace.id} onChange={(e) => setQuery({ ref: e.target.value })}>
              {REFERENCES.map((r) => (
                <option key={r.id} value={r.id}>
                  {t(r.body as Key)}: {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-muted">{t("add_compare")}</span>
            <select
              className="btn"
              value=""
              disabled={sites.length >= 3}
              onChange={(e) => e.target.value && setSites([...sites.map((s) => s.id), e.target.value])}
            >
              <option value="">{sites.length >= 3 ? t("compare_limit") : "Choose an Earth site"}</option>
              {available.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <span className="text-muted">{t("compare_limit")}</span>
        </div>
      </header>

      {sites.length === 0 ? (
        <div className="card p-8 text-center">
          <p>Choose up to three Earth sites above, or pick them from the ranking.</p>
          <Link href={`/discover/?ref=${refPlace.id}&w=${wq}`} className="btn btn-primary mt-4">
            {t("back_discover")}
          </Link>
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label={t("relief_view")}>
            <div className="card p-4" style={{ borderTop: "3px solid #E69F00" }}>
              <p className="label">{t("target")}</p>
              <h2 className="font-semibold">{refPlace.name}</h2>
              <p className="mb-3 font-mono text-xs text-muted">{fmtCoord(refPlace)}</p>
              <ReliefCanvas place={refPlace} />
            </div>
            {sites.map((s, i) => {
              const agg = aggregate(results[i], weights);
              return (
                <div key={s.id} className="card p-4" style={{ borderTop: `3px solid ${SERIES[i]}` }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="label">{t("earth")}</p>
                      <h2 className="font-semibold leading-tight">
                        <Link href={`/site/?id=${s.id}&ref=${refPlace.id}&w=${wq}`} className="hover:underline">
                          {s.name}
                        </Link>
                      </h2>
                      <p className="font-mono text-xs text-muted">{fmtCoord(s)}</p>
                    </div>
                    <IndexBadge agg={agg} />
                  </div>
                  <div className="my-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={s.status} />
                    <button type="button" className="btn no-print" onClick={() => setSites(sites.filter((x) => x !== s).map((x) => x.id))}>
                      {t("remove")}
                    </button>
                  </div>
                  <ReliefCanvas place={s} />
                </div>
              );
            })}
          </section>
          <p className="text-sm text-muted">
            Every panel shows a 60 km window at the same pixel size, so sizes can be compared directly. Maps are not synchronised for panning because they are on
            different worlds and projections; the shared scale is the fair comparison.
          </p>

          <DimensionChart sites={sites} results={results} />

          <div className="science-only grid gap-4 lg:grid-cols-2">
            <ProfileChart refPlace={refPlace} sites={sites} />
            <SlopeChart refPlace={refPlace} sites={sites} />
          </div>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Strengths and weaknesses">
            {sites.map((s, i) => {
              const ex = explain(results[i]);
              const names = (rs: typeof ex.strong) => rs.map((r) => `${DIMENSION_LABEL[lang][r.id]} (${r.score!.toFixed(0)})`).join(", ") || "none";
              return (
                <div key={s.id} className="card p-4 text-sm">
                  <h3 className="font-semibold" style={{ borderLeft: `3px solid ${SERIES[i]}`, paddingLeft: 8 }}>{s.name}</h3>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="label">{t("strong")}</dt>
                      <dd>{names(ex.strong)}</dd>
                    </div>
                    <div>
                      <dt className="label">{t("moderate")}</dt>
                      <dd>{names(ex.moderate)}</dd>
                    </div>
                    <div>
                      <dt className="label">{t("weak")}</dt>
                      <dd>{names(ex.weak)}</dd>
                    </div>
                    <div>
                      <dt className="label">{t("unknown")}</dt>
                      <dd>{ex.unknown.map((r) => DIMENSION_LABEL[lang][r.id]).join(", ") || "none"}</dd>
                    </div>
                    <div>
                      <dt className="label">{t("differences")}</dt>
                      <dd className="text-muted">{(s.differences ?? []).join(" ")}</dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </section>

          <section className="card p-4">
            <h2 className="font-semibold">
              {t("limits_title")} ({t(refPlace.body as Key)})
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              {LIMITS[refPlace.body as "moon" | "mars"].map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </section>

          <div className="science-only">
            <ProvenancePanel places={[refPlace, ...sites]} />
          </div>
        </>
      )}
    </div>
  );
}
