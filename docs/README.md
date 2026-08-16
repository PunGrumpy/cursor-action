# docs

The documentation site for [Cursor Action](../README.md), built with [Fumapress](https://press.fumadocs.dev) on Waku.

It is a standalone project with its own lockfile, so `bun install` at the repository root does not pull in React, Waku, or Vite.

```sh
bun install          # from this directory
bun run dev          # http://localhost:3000
bun run build        # static output in dist/public
bun run brand        # regenerate the icons and the social card
```

## Three rules worth knowing before editing

**The reference tables are generated.** `content/reference.mdx` contains `{/* reference:start */}` and `{/* reference:end */}` markers, and everything between them is written by `bun run docs:reference` from the repository root, reading `action.yml`. Edit the manifest, not the table. CI regenerates it and fails if the result differs from what was committed.

**Broken internal links fail the build.** The `linkValidationPlugin` is the one plugin here that is not part of Fumapress's `recommended` preset. Prose about an action that changes underneath it goes stale quietly; a link to a page that no longer exists is the cheapest way to notice.

**The brand assets are generated too.** `src/lib/mark.ts` computes the logo, and `bun run brand` draws every file in `public/` that contains it — both favicons, `favicon.ico`, the PNG icons, `logo.svg`, and the `og.png` social card — plus the header uses the same function. Editing an SVG in `public/` by hand puts it one regeneration away from being overwritten. The counter in the mark takes a scale, because the one that reads at 220px closes to a slit at 16px; that is optical sizing, not a second logo.

Per-page social cards are rendered at build time by Takumi, configured in `press.config.tsx`. Its palette is written out as hex because the renderer has no stylesheet to read `--color-fd-*` from; the values are the same OKLCH tokens in `src/app.css`, resolved.

## Third-party assets

`public/hero-wallpaper.webp` is Albert Bierstadt's _Alaskan Coastal Range_ (before 1889), re-encoded to WebP from [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Bierstadt-Alaskan_Coastal_Range.jpg). Bierstadt died in 1902, so the painting is in the public domain worldwide and carries no licence obligation.

## Deployment

Vercel, with the root directory set to `docs`. `vercel.json` pins the build command and points at `dist/public`. `site.baseUrl` is read from `VERCEL_PROJECT_PRODUCTION_URL` at build time, so no domain is hardcoded.
