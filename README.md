# Aayush Bhandari — portfolio platformer

Astro + Phaser 3 + TypeScript. A visitor plays a 2D platformer that doubles as a
UX portfolio; every project is also a real, indexable page for anyone who'd rather read.

## One content model, three presentations

Case-study copy is written **once** in `src/content/*.ts` (typed). It renders as:
- in-game checkpoints (the playable homepage),
- flat pages at `/work/<slug>` (what search engines see),
- (later) a mobile vertical scroll.

Never write case-study copy anywhere except the content data files.

## Run

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output to dist/
npm run preview
```

## Routes

`/` (game) · `/resume` · `/work/orbit` · `/work/memory-bank` · `/work/nav-aid` · `/work/pitwall`

## Swapping placeholder art (no logic changes)

All art is placeholder colored rectangles generated at runtime. To add real art:
1. Drop image files into `public/assets/`.
2. In `src/game/config/sprites.ts` set `path` and flip `usePlaceholder` to `false`.
3. In `src/game/config/biomes.ts` set per-layer `path` and flip `usePlaceholder`.

No game logic references an image path directly.

Placeholder **fonts** are equally centralized: swap the three `--font-*` vars in
`src/styles/global.css` and the `<link>` in `src/layouts/Layout.astro`.

## Deploy (Vercel)

Static build; Vercel auto-detects Astro (`vercel.json` pins it explicitly).

1. Push this repo to GitHub.
2. Vercel dashboard → New Project → import the repo. Framework: Astro. Build: `astro build`, output `dist`.
3. Add your custom domain under Project → Settings → Domains and point DNS as Vercel instructs.

No env vars, no backend, no database.
