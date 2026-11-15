"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { trackById, type Track } from "@/data/tracks";
import { useApp } from "./AppState";

/** Coloured Greek-letter badge, or the themed song's own icon. */
export function TrackBadge({ track, size = 28 }: { track: Track; size?: number }) {
  const box = { width: size, height: size };
  if (track.icon === "blackhole")
    return (
      <svg {...box} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
        <ellipse cx="16" cy="16" rx="14" ry="5" fill="none" stroke="#ffb35c" strokeWidth="2.2" />
        <path d="M5 13a11 11 0 0 1 22 0" fill="none" stroke="#ffd9a0" strokeWidth="1.6" />
        <circle cx="16" cy="16" r="6" fill="#000" stroke="#ffe7c2" strokeWidth="1" />
      </svg>
    );
  if (track.icon === "tauceti")
    return (
      <svg {...box} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
        <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.25)" strokeDasharray="2 3" />
        <circle cx="16" cy="16" r="5" fill="#ffc46b" />
        <circle cx="27" cy="11" r="3.4" fill="#5fe38a" />
        <path d="M24 5l2.5 1-1 2.5" fill="none" stroke="#e9ecf1" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  if (track.icon === "runner")
    return (
      <svg {...box} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
        <rect x="5" y="8" width="11" height="11" rx="1.5" fill="none" stroke="#5ff2ff" strokeWidth="2.2" transform="rotate(-12 10.5 13.5)" />
        <path d="M18 26l4-8 4 8z" fill="none" stroke="#ff4fd8" strokeWidth="2" strokeLinejoin="round" />
        <path d="M3 26h26" stroke="#5ff2ff" strokeWidth="1.6" />
      </svg>
    );
  return (
    <span className="track-greek shrink-0" style={{ ...box, background: track.color, fontSize: size * 0.5 }} aria-hidden="true">
      {"αβγδεζ"[["alpha", "beta", "gamma", "delta", "epsilon", "zeta"].indexOf(track.id)]}
    </span>
  );
}

const cmd = (f: HTMLIFrameElement | null, func: string, args: unknown[] = []) =>
  f?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "https://www.youtube-nocookie.com");

/**
 * Docked player for the YouTube songs. YouTube requires a visible player of at least 200 × 200 px while it plays,
 * so the dock never shrinks below that; collapsing it pauses the song.
 */
export function MusicDock() {
  const { music, setMusic, musicAll, track: id, volume, muted, tx, lang } = useApp();
  const track = trackById(id);
  const frame = useRef<HTMLIFrameElement>(null);
  const [open, setOpen] = useState(true);
  const home = usePathname() === "/";

  // Loop by restarting at the end. (YouTube's own loop needs a one-song playlist, which pops up a playlist panel.)
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || typeof e.data !== "string") return;
      try {
        const d = JSON.parse(e.data);
        const state = d.event === "onStateChange" ? d.info : d.info?.playerState;
        if (state === 0) {
          cmd(frame.current, "seekTo", [0, true]);
          cmd(frame.current, "playVideo");
        }
      } catch {
        // not a player message
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Keep the player in step with the volume slider and the mute button.
  useEffect(() => {
    const apply = () => {
      // Ask the player to report its state, so the loop above hears when the song ends.
      frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "https://www.youtube-nocookie.com");
      cmd(frame.current, "setVolume", [Math.round((muted ? 0 : volume) * 100)]);
      cmd(frame.current, open ? "playVideo" : "pauseVideo");
    };
    apply();
    const f = frame.current;
    f?.addEventListener("load", apply);
    return () => f?.removeEventListener("load", apply);
  }, [volume, muted, open, track.youtube]);

  if (!music || !track.youtube || (!musicAll && !home)) return null;
  const origin = typeof window === "undefined" ? "" : `&origin=${encodeURIComponent(window.location.origin)}`;

  return (
    <aside className={`music-dock no-print ${open ? "" : "is-closed"}`} aria-label={tx("Now playing", "កំពុងចាក់")}>
      <div className="flex items-center gap-2 px-2.5 py-2">
        <TrackBadge track={track} size={22} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold">{track.label}</span>
          <span className="block truncate text-[11px] text-muted">
            {track.title} · {track.artist}
          </span>
        </span>
        <button
          type="button"
          className="btn h-8 min-h-0 px-2 text-xs"
          aria-expanded={open}
          title={tx("YouTube only allows its player to play while it is visible, so hiding it pauses the song.", "YouTube អនុញ្ញាតឱ្យចាក់បានតែពេលកម្មវិធីចាក់អាចមើលឃើញ ដូច្នេះការលាក់វានឹងផ្អាកបទចម្រៀង។")}
          onClick={() => setOpen(!open)}
        >
          {open ? tx("Pause & hide", "ផ្អាក និងលាក់") : tx("Play", "ចាក់")}
        </button>
        <button type="button" className="btn h-8 min-h-0 w-8 justify-center p-0" aria-label={tx("Turn music off", "បិទតន្ត្រី")} onClick={() => setMusic(false)}>
          ×
        </button>
      </div>
      {/* Stays mounted while hidden so the song resumes where it paused. */}
      <div className="music-frame" hidden={!open}>
        <iframe
          key={track.youtube}
          ref={frame}
          title={`${track.title} · ${track.artist}`}
          src={`https://www.youtube-nocookie.com/embed/${track.youtube}?autoplay=1&enablejsapi=1&playsinline=1&rel=0&iv_load_policy=3${origin}`}
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      {open && <p className="px-2.5 py-1.5 text-[10.5px] leading-snug text-muted">{track.credit[lang]}</p>}
    </aside>
  );
}
