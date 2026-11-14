"use client";

import Link from "next/link";
import { useApp } from "@/components/AppState";
import { fmtCoord, StatusBadge } from "@/components/Bits";
import { getPlace } from "@/data/catalog";

export default function SavedPage() {
  const { t, saved, toggleSaved } = useApp();
  const places = saved.map((id) => getPlace(id)).filter((p) => !!p);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("nav_saved")}</h1>
      <p className="text-sm text-muted">Saved in this browser only. Nothing is sent to a server and no account is needed.</p>
      {places.length === 0 ? (
        <div className="card p-8 text-center">
          <p>{t("saved_empty")}</p>
          <Link href="/" className="btn btn-primary mt-4">
            {t("back_discover")}
          </Link>
        </div>
      ) : (
        <>
          <ul className="grid gap-3 md:grid-cols-2">
            {places.map((p) => (
              <li key={p.id} className="card flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <h2 className="font-semibold">
                    <Link href={`/site/?id=${p.id}`} className="hover:underline">
                      {p.name}
                    </Link>
                  </h2>
                  <p className="text-sm text-muted">
                    {p.country} · <span className="font-mono text-xs">{fmtCoord(p)}</span>
                  </p>
                  <div className="mt-1.5">
                    <StatusBadge status={p.status} />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    if (window.confirm(t("confirm_remove"))) toggleSaved(p.id);
                  }}
                >
                  {t("remove")}
                </button>
              </li>
            ))}
          </ul>
          <Link href={`/compare/?sites=${places.slice(0, 3).map((p) => p.id).join(",")}`} className="btn btn-primary">
            {t("compare_selected")} ({Math.min(3, places.length)})
          </Link>
        </>
      )}
    </div>
  );
}
