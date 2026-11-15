"use client";

import { useState } from "react";
import { SITE_PHOTOS, type SitePhoto } from "@/data/photos";
import { useApp } from "./AppState";
import { Lightbox } from "./Lightbox";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function Credit({ p }: { p: SitePhoto }) {
  const { tx } = useApp();
  return (
    <>
      {p.credit} ·{" "}
      {/^(Public domain|PD|CC0)/i.test(p.license) ? null : <>{tx("resized, converted to WebP", "ប្តូរទំហំ និងបម្លែងជា WebP")} · </>}
      {p.licenseUrl ? (
        <a href={p.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-line-strong underline-offset-2 hover:text-text">
          {p.license}
        </a>
      ) : (
        p.license
      )}{" "}
      ·{" "}
      <a href={p.source} target="_blank" rel="noopener noreferrer" className="underline decoration-line-strong underline-offset-2 hover:text-text">
        {tx("Source", "ប្រភព")} ↗
      </a>
    </>
  );
}

/** Real photographs of an Earth site from Wikimedia Commons, stored locally, each with credit, licence and source. */
export function SitePhotos({ siteId, siteName }: { siteId: string; siteName: string }) {
  const { tx } = useApp();
  const photos = SITE_PHOTOS[siteId] ?? [];
  const [open, setOpen] = useState<SitePhoto | null>(null);
  const [broken, setBroken] = useState<Set<string>>(new Set());

  return (
    <section className="space-y-3" aria-labelledby="photos-h">
      <h2 id="photos-h" className="text-xl font-semibold">{tx("Site photography", "រូបថតទីតាំង")}</h2>
      <p className="text-sm text-muted">
        {tx(
          "Real photographs of this place, to set beside the terrain models above. Each one is credited and links to its original source and licence.",
          "រូបថតពិតនៃទីកន្លែងនេះ សម្រាប់ប្រៀបធៀបជាមួយគំរូដីខាងលើ។ រូបនីមួយៗមានឈ្មោះអ្នកថត និងតំណទៅប្រភពដើម និងអាជ្ញាប័ណ្ណ។",
        )}
      </p>
      {photos.length === 0 ? (
        <p className="card p-4 text-sm text-muted">
          {tx("No openly licensed photograph of this exact site was found yet.", "មិនទាន់រកឃើញរូបថតដែលមានអាជ្ញាប័ណ្ណបើកចំហនៃទីតាំងនេះពិតប្រាកដនៅឡើយទេ។")}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p) => (
            <li key={p.file} className="card overflow-hidden">
              <button
                type="button"
                className="group relative block aspect-[4/3] w-full overflow-hidden bg-panel-2"
                onClick={() => setOpen(p)}
                aria-label={`${tx("View full size", "មើលទំហំពេញ")}: ${p.caption}`}
              >
                {broken.has(p.file) ? (
                  <span className="flex h-full items-center justify-center p-4 text-center text-xs text-muted">{tx("Image unavailable", "រូបភាពមិនអាចបង្ហាញបាន")}</span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- static export, pre-optimised WebP
                  <img
                    src={`${BASE}/photos/${siteId}/${p.file}-sm.webp`}
                    alt={p.caption}
                    width={p.w}
                    height={p.h}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    onError={() => setBroken((b) => new Set(b).add(p.file))}
                  />
                )}
                <span className="absolute bottom-2 right-2 rounded bg-black/65 px-1.5 py-0.5 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  ⤢ {tx("Full size", "ទំហំពេញ")}
                </span>
              </button>
              <div className="space-y-1 p-3">
                <p className="text-sm leading-snug">{p.caption}</p>
                <p className="text-[11px] leading-snug text-muted">
                  <Credit p={p} />
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <Lightbox
          image={{
            src: `${BASE}/photos/${siteId}/${open.file}.webp`,
            alt: `${siteName}: ${open.caption}`,
            caption: (
              <>
                <span className="text-text">{open.caption}</span> · <Credit p={open} />
              </>
            ),
          }}
          onClose={() => setOpen(null)}
        />
      )}
    </section>
  );
}
