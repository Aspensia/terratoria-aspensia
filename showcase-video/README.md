# Terratoria 30-second showcase (HyperFrames)

The film played on the site's Showcase page (`/showcase/`, file `public/showcase/terratoria-showcase.mp4`).
It is made with [HyperFrames](https://hyperframes.heygen.com): HTML compositions rendered frame by frame to video.

- `index.html` mounts eight scenes from `compositions/` plus a live 3D layer (`space3d.html`, Three.js with the site's own Earth, Moon and Mars textures), a HUD and the captions.
- `assets/shots/` are 2x captures of the real built site; `assets/audio/score.wav` is the procedural soundtrack from `scripts/score.mjs`.
- `SPEC.md` holds the shot list and the caption wording; `REVIEW.md` what was checked.

Re-render (needs FFmpeg and FFprobe on PATH):

```bash
node scripts/score.mjs
npx hyperframes@0.9.52 check
npx hyperframes@0.9.52 render --fps 60 --quality delivery -o ../public/showcase/terratoria-showcase.mp4
```

On Windows, keep the project in a short folder path: very long paths break the final assembly step.
