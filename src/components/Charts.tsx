"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DIMENSION_LABEL } from "@/lib/i18n";
import { DIMENSIONS, type DimensionResult, type Place } from "@/lib/types";
import { useApp } from "./AppState";

// Okabe-Ito colours: distinguishable with the common forms of colour blindness.
// The reference region is always orange and dashed; Earth sites are solid.
export const SERIES = ["#56B4E9", "#009E73", "#CC79A7"];
export const REF_COLOR = "#E69F00";
const DASH = ["", "2 2", "8 3 2 3"];

/** Vertical (or horizontal, prefix "h") gradients per series, lighter at the tip. */
const gradients = (dir: "" | "h" = "") =>
  [...SERIES, REF_COLOR].map((c, i) => (
    <linearGradient key={i} id={`g${dir}-${i === SERIES.length ? "ref" : i}`} x1="0" y1={dir ? "0" : "1"} x2={dir ? "1" : "0"} y2="0">
      <stop offset="0%" stopColor={c} stopOpacity={0.55} />
      <stop offset="100%" stopColor={c} stopOpacity={1} />
    </linearGradient>
  ));

const axis = { stroke: "var(--muted)", fontSize: 12 };
const tip = {
  contentStyle: { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 8, color: "var(--text)", fontSize: 12 },
  labelStyle: { color: "var(--muted)" },
};

function Frame({ title, children, note }: { title: string; children: React.ReactElement; note?: string }) {
  return (
    <figure className="card p-4">
      <figcaption className="mb-2 text-sm font-semibold">{title}</figcaption>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
      {note && <p className="mt-2 text-xs text-muted">{note}</p>}
    </figure>
  );
}

export function ProfileChart({ refPlace, sites }: { refPlace: Place; sites: Place[] }) {
  const { t } = useApp();
  const all = [refPlace, ...sites].filter((p) => p.terrain);
  if (all.length === 0) return null;
  const dist = all[0].terrain!.profile.distKm;
  const data = dist.map((d, i) => {
    const row: Record<string, number | null> = { d };
    for (const p of all) row[p.id] = p.terrain!.profile.elevM[i] ?? null;
    return row;
  });
  return (
    <Frame title={t("profile_chart")} note="Each profile crosses the full 60 km window. Heights are relative to each window's own mean, so shapes are compared, not absolute elevations.">
      <LineChart data={data} margin={{ top: 5, right: 12, bottom: 18, left: 8 }}>
        <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" />
        <XAxis dataKey="d" type="number" domain={[0, 60]} tickCount={7} {...axis} label={{ value: t("dist_km"), position: "insideBottom", offset: -10, fill: "var(--muted)", fontSize: 12 }} />
        <YAxis {...axis} width={56} label={{ value: t("elev_m"), angle: -90, position: "insideLeft", fill: "var(--muted)", fontSize: 12, style: { textAnchor: "middle" } }} />
        <Tooltip {...tip} formatter={(v) => [`${v} m`]} labelFormatter={(l) => `${l} km`} />
        <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: 12 }} />
        <Line dataKey={refPlace.id} name={refPlace.name} stroke={REF_COLOR} strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} connectNulls={false} />
        {sites.filter((s) => s.terrain).map((s, i) => (
          <Line key={s.id} dataKey={s.id} name={s.name} stroke={SERIES[i]} strokeWidth={2} strokeDasharray={DASH[i]} dot={false} isAnimationActive={false} connectNulls={false} />
        ))}
      </LineChart>
    </Frame>
  );
}

export function SlopeChart({ refPlace, sites }: { refPlace: Place; sites: Place[] }) {
  const { t } = useApp();
  const all = [refPlace, ...sites].filter((p) => p.terrain);
  if (all.length === 0) return null;
  const bins = all[0].terrain!.slopeBinsDeg;
  const data = bins.slice(0, -1).map((lo, i) => {
    const row: Record<string, number | string> = { bin: i === bins.length - 2 ? `${lo}+` : `${lo}–${bins[i + 1]}` };
    for (const p of all) row[p.id] = Math.round(p.terrain!.slopeHist[i] * 1000) / 10;
    return row;
  });
  return (
    <Frame title={t("slope_chart")} note="Slopes measured over a 463 m baseline on every world. Short, steep features smaller than that are averaged out.">
      <BarChart data={data} margin={{ top: 5, right: 12, bottom: 18, left: 8 }}>
        <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="bin" {...axis} label={{ value: t("slope_deg"), position: "insideBottom", offset: -10, fill: "var(--muted)", fontSize: 12 }} />
        <YAxis {...axis} width={56} label={{ value: t("share_pct"), angle: -90, position: "insideLeft", fill: "var(--muted)", fontSize: 12, style: { textAnchor: "middle" } }} />
        <Tooltip {...tip} formatter={(v) => [`${v}%`]} cursor={{ fill: "var(--panel-2)" }} />
        <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: 12 }} />
        <defs>{gradients()}</defs>
        <Bar dataKey={refPlace.id} name={refPlace.name} fill="url(#g-ref)" radius={[3, 3, 0, 0]} animationDuration={700} />
        {sites.filter((s) => s.terrain).map((s, i) => (
          <Bar key={s.id} dataKey={s.id} name={s.name} fill={`url(#g-${i})`} radius={[3, 3, 0, 0]} animationDuration={700} />
        ))}
      </BarChart>
    </Frame>
  );
}

export function DimensionChart({ sites, results }: { sites: Place[]; results: DimensionResult[][] }) {
  const { lang } = useApp();
  const data = DIMENSIONS.map((d) => {
    const row: Record<string, number | string | null> = { dim: DIMENSION_LABEL[lang][d] };
    sites.forEach((s, i) => (row[s.id] = results[i].find((r) => r.id === d)?.score ?? null));
    return row;
  });
  return (
    <figure className="card p-4">
      <figcaption className="mb-2 text-sm font-semibold">Similarity by dimension (0 to 100)</figcaption>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 16, bottom: 5, left: 8 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} {...axis} />
            <YAxis type="category" dataKey="dim" width={150} {...axis} />
            <Tooltip {...tip} formatter={(v) => [v === null ? "no data" : Number(v).toFixed(0)]} cursor={{ fill: "var(--panel-2)" }} />
            <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: 12 }} />
            <defs>{gradients("h")}</defs>
            {sites.map((s, i) => (
              <Bar key={s.id} dataKey={s.id} name={s.name} fill={`url(#gh-${i})`} radius={[0, 3, 3, 0]} animationDuration={700} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-muted">A missing bar means no data for that dimension, not a score of zero.</p>
    </figure>
  );
}
