# PROJECT: Terratoria — 30 s showcase (SPEC)

1920×1080, rendered at 60 fps, exactly 30.0 s. Audience: NASA Space Apps judges first, casual viewers second.

## Truth rules
- Every UI frame is a capture of the real built site (`capture/`, served from `out/`), 2× scale. No invented screens.
- Captions say what the site really does. Requested wording changed where it would mislead a judge:
  - "real NASA telemetry" → "real NASA and ESA mission data" (the site uses archived LOLA, Diviner, MOLA, POWER and Copernicus DEM products, not live telemetry).
  - Discover is a ranking of 21 Earth sites against Moon/Mars regions, not an image archive.
  - Compare shows terrain, temperature and 8 similarity dimensions, not gravity/atmosphere.
  - Mission Challenge now has 4 games (Quiz, Rush, Flashcards, Touchdown); all 4 are shown.
- 3D bodies are drawn live with Three.js from the site's own textures (`public/textures`): Earth (NASA Blue Marble), Moon (LOLA-derived), Mars, Milky Way.

## Look
- Ground `#08090b`, ink `#ededef`, muted `#9d9fa6`, accent `#a9bfd6`, Earth `#56b4e9`, Mars `#e0865c`, Moon `#c8d0dc`, OK `#4fc3a1`, warn `#e6b34d`.
- Display: Space Grotesk 600/700. Body: Geist. Labels/HUD: Geist Mono, uppercase, 0.16em tracking. All from the site build.
- Captions: lower third, left at x=144, y≈880, feature tag in mono (accent) above a 44 px Space Grotesk line; max 2 lines; enter with a 0.35 s mask wipe, leave 0.2 s.
- HUD: 4 corner brackets 56 px, 2 px accent at 60% opacity, a mono timecode and scene index top-right. No vignette, no grain.

## Motion numbers
- Cuts every 2–5 s on scene boundaries: 4.0, 8.0, 13.0, 17.0, 23.0, 26.0, 28.0.
- Transitions (5 kinds): whip-push (blur 12 px, 0.35 s), zoom-through into a UI element, clip-path wipe, split-grid assemble, pull-back to space.
- Push-ins 1.0 → 1.6–2.0× over 2–3 s, `power2.inOut`; holds ≥ 0.6 s after any reveal. Text ≥ 26 px at 1080p after push.
- Cursor 64 px, enters from off-frame, its click causes the next change on the same frame.
- Banned: title over a dimmed screenshot as the only content, UI tilted in 3D, idle drift longer than 1.5 s, the logo parked in a corner.

## Shots
| t | Scene | Picture | Caption |
|---|---|---|---|
| 0–4 | Intro | 3D fly-in past Mars and the Moon to Earth; "PROJECT: / Terratoria" types on; Aspensia badge lands | Real NASA and ESA mission data. Welcome to PROJECT: Terratoria. |
| 4–8 | Discover | Real Discover page: world map of ranked sites → push to weight sliders and ranking | DISCOVER · Rank 21 Earth analogues against the Moon and Mars, your way. |
| 8–13 | 3D Explorer | Live Mars globe spins, cursor clicks Jezero pin → real Explore page, site drawer wipes open, punch-in on drawer | 3D EXPLORER · Spin real globes, click a site for its measured terrain and climate. |
| 13–17 | Mission Plan | Real plan page → pan to the five-step plan, steps highlighted in turn | MISSION PLAN · Five steps to a lunar base, each tested on Earth first. |
| 17–23 | Mission Challenge | 2×2 grid of the 4 real games; each quadrant takes focus for 1.4 s: Quiz hints, Rush clock, Flashcard flip, Touchdown burn | MISSION CHALLENGE · Four games: Quiz, Rush, Flashcards and Touchdown. |
| 23–26 | Compare | Real compare cards → similarity bars wipe in | COMPARE · Put sites side by side across eight science dimensions. |
| 26–28 | Saved Sites | Real Saved page, bookmark pops on the list | SAVED SITES · Bookmark targets, compare them in one click. |
| 28–30 | Finale | Pull back to Earth, Moon and Mars; logo lockup centred | PROJECT: TERRATORIA · Made by Aspensia · NASA Space Apps Challenge 2026 |

## Sound
Procedural, as requested: a synthesised space pad in the site's ALPHA style (C-major pentatonic, slow chords), a soft pulse from 4 s, filtered-noise whooshes on each cut (3 takes rotated), short telemetry blips on UI events (pin click, drawer open, hint, flip, bookmark), one riser into the 28 s end-card hit. Rendered offline to `assets/audio/score.wav`, peaks ≤ −1 dBFS.
