# Review — Terratoria 30 s showcase

Checked with `hyperframes check` (0 errors) and two snapshot passes (29 frames across all 8 scenes and their transitions).

## Fixed after review
- Site header under the HUD read as clutter on Discover, Plan and Compare → added a top scrim to the HUD.
- Cursor tip missed the Jezero pin by ~25 px → re-aimed; the click lands on the pin at 10.0 s.
- Rush panel cropped the first digit of "55.8s" → crop moved left.
- Finale: the Moon sat behind the wordmark and Earth touched "PROJECT:" → pull-back mirrored to the other side, lockup lowered.
- Intro: Earth arrived too large against the title → fly-in ends further out.
- Pill label wrapped and overflowed ("10 rounds · 3 hints") → shortened, no wrap.
- Overlapping push/exit tweens on Discover and Saved → retimed.

## Warnings left standing, and why
- `duplicate_media_discovery_risk`: the Explorer drawer crop reuses its page screenshot on purpose.
- `overlapping_gsap_tweens` on `.br`: the HUD brackets' staggered entrance; harmless.
- `console_warning`: three.js r160 UMD build is deprecated but shipped and works; no visual effect.
- `canvas_content_at_edge`: the 3D layer is full-bleed by design.
- `text_below_floor`: HUD labels (22–24 px) and pill subtitles (21 px) are decorative; every caption and title is 30 px or larger.
- `line_unread`: the closing line holds 1.55 s; the film is capped at 30.0 s by the brief.

## Accuracy notes (for judges)
Captions describe what the site does: archived NASA/ESA mission data (not live telemetry), Discover is a ranking, Compare shows terrain/temperature and eight similarity dimensions, and Mission Challenge has four games. Every UI frame is a capture of the real built site.

## Sound
Procedural score (`scripts/score.mjs`) placed as one track; levels measured by peak normalisation (−1 dBFS), not listened to.
