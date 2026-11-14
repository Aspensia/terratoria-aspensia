"use client";

import { useEffect, useState } from "react";
import { DATASETS, type Dataset } from "@/data/datasets";
import { DIMENSION_LABEL, DIMENSION_SIMPLE } from "@/lib/i18n";
import type { Aggregate, Basis, DimensionResult, Place, Status } from "@/lib/types";
import { useApp } from "./AppState";

export const fmtCoord = (p: Place) => {
  const lat = `${Math.abs(p.lat).toFixed(2)}°${p.lat >= 0 ? "N" : "S"}`;
  if (p.body !== "earth") return `${lat}, ${p.lon.toFixed(2)}°E`;
  return `${lat}, ${Math.abs(p.lon).toFixed(2)}°${p.lon >= 0 ? "E" : "W"}`;
};

/** Shape plus text, so status never depends on colour alone. */
export function StatusBadge({ status }: { status?: Status }) {
  const { t } = useApp();
  if (!status) return null;
  const known = status === "established" || status === "documented";
  return (
    <span className={`chip inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${known ? "chip-ok" : "chip-warn"}`}>
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        {known ? <circle cx="5" cy="5" r="4" fill="var(--ok)" /> : <rect x="1.5" y="1.5" width="7" height="7" transform="rotate(45 5 5)" fill="var(--warn)" />}
      </svg>
      {t(`status_${status}`)}
    </span>
  );
}

export function BasisChip({ basis }: { basis: Basis }) {
  const { t } = useApp();
  return <span className="rounded border border-line px-1.5 py-px text-[11px] text-muted">{t(`basis_${basis}`)}</span>;
}

/** Eases a number up to its value whenever it changes (instant with reduced motion). */
export function useCountUp(value: number | null, ms = 700): number | null {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (value === null || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setShown(value);
    let raf = 0;
    const from = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      setShown(from + (value - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return shown;
}

export function IndexBadge({ agg, size = "md" }: { agg: Aggregate; size?: "md" | "lg" }) {
  const { t } = useApp();
  const shown = useCountUp(agg.index);
  return (
    <div className="text-right">
      <div className={`font-mono font-semibold tabular-nums ${size === "lg" ? "text-5xl" : "text-2xl"}`} title={agg.index === null ? t("no_index_why") : t("index")}>
        {shown === null ? "–" : shown.toFixed(0)}
        {agg.index !== null && <span className="text-sm font-normal text-muted"> / 100</span>}
      </div>
      <div className="text-xs text-muted">
        {agg.index === null ? t("no_index") : t("index_short")} · {t("coverage")} {Math.round(agg.coverage * 8)}/8
      </div>
    </div>
  );
}

export function ScoreBar({ r, detail = false }: { r: DimensionResult; detail?: boolean }) {
  const { lang, mode, t } = useApp();
  const pct = r.score ?? 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span>{DIMENSION_LABEL[lang][r.id]}</span>
        <span className="flex items-center gap-2">
          <BasisChip basis={r.basis} />
          <span className="w-8 text-right font-mono tabular-nums">{r.score === null ? "–" : r.score.toFixed(0)}</span>
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded bg-panel-2" role="img" aria-label={`${DIMENSION_LABEL[lang][r.id]}: ${r.score === null ? t("basis_none") : `${r.score.toFixed(0)} / 100`}`}>
        {r.score !== null && <div className="bar-fill h-full rounded" style={{ width: `${pct.toFixed(1)}%` }} />}
      </div>
      {detail && (
        <div className="mt-2 text-sm text-muted">
          {mode === "simple" ? (
            <p>{DIMENSION_SIMPLE[lang][r.id]}</p>
          ) : (
            <>
              <p>
                <span className="text-text">{t("method")}:</span> {r.method}
              </p>
              {r.score !== null && (
                <p className="mt-1">
                  {t("quality")}: <span className="font-mono">{r.quality.toFixed(2)}</span>
                </p>
              )}
            </>
          )}
          {r.evidence.length > 0 && (
            <ul className="mt-1 list-disc pl-5">
              {r.evidence.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

const datasetsFor = (places: Place[]): Dataset[] => {
  const ids = new Set<string>(["literature"]);
  for (const p of places) {
    if (p.terrain) ids.add(p.body === "earth" ? "copdem" : p.body === "moon" ? "lola" : "mola");
    if (p.climate) ids.add(p.body === "earth" ? "power" : p.body === "moon" ? "diviner" : "meda");
  }
  return DATASETS.filter((d) => ids.has(d.id));
};

export function ProvenancePanel({ places, open = false }: { places: Place[]; open?: boolean }) {
  const { t } = useApp();
  const retrieved = places.map((p) => p.terrain?.retrieved).find(Boolean);
  return (
    <details className="card p-4" open={open}>
      <summary className="cursor-pointer font-semibold">{t("provenance")}</summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="label">
            <tr>
              <th className="py-1 pr-3">Agency / mission</th>
              <th className="py-1 pr-3">Instrument and product</th>
              <th className="py-1 pr-3">Resolution / period</th>
              <th className="py-1 pr-3">Level</th>
              <th className="py-1">Quality notes</th>
            </tr>
          </thead>
          <tbody>
            {datasetsFor(places).map((d) => (
              <tr key={d.id} className="border-t border-line align-top">
                <td className="py-2 pr-3">
                  {d.agency}
                  <span className="block text-muted">{d.mission}</span>
                </td>
                <td className="py-2 pr-3">
                  {d.instrument}
                  <a href={d.url} target="_blank" rel="noreferrer" className="block text-accent underline">
                    {d.product}
                  </a>
                  <span className="text-muted">{d.version}</span>
                </td>
                <td className="py-2 pr-3">
                  {d.resolution}
                  <span className="block text-muted">{d.period}</span>
                </td>
                <td className="py-2 pr-3 capitalize">{d.level}</td>
                <td className="py-2 text-muted">{d.quality}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">
        {retrieved && <>Retrieved and processed {retrieved}. </>}
        {t("archived_note")}
      </p>
    </details>
  );
}

/** APA reference list: alphabetical, hanging indent, live DOI and URL links. */
export function RefList({ refs }: { refs: string[] }) {
  const sorted = [...new Set(refs)].sort((a, b) => a.localeCompare(b));
  return (
    <ul className="space-y-2 text-sm">
      {sorted.map((r) => {
        const m = r.match(/^(.*?)(https?:\/\/\S+)$/);
        return (
          <li key={r} className="pl-8 -indent-8 break-words text-muted">
            {m ? (
              <>
                {m[1]}
                <a href={m[2]} target="_blank" rel="noreferrer" className="text-accent underline decoration-dotted underline-offset-2">
                  {m[2]}
                </a>
              </>
            ) : (
              r
            )}
          </li>
        );
      })}
    </ul>
  );
}
