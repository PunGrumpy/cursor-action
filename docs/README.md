# docs

The documentation site for [Cursor Action](../README.md), built with
[Fumapress](https://press.fumadocs.dev) on Waku.

It is a standalone project with its own lockfile, so `bun install` at the
repository root does not pull in React, Waku, or Vite.

```sh
bun install          # from this directory
bun run dev          # http://localhost:3000
bun run build        # static output in dist/public
```

## Two rules worth knowing before editing

**The reference tables are generated.** `content/reference.mdx` contains
`{/* reference:start */}` and `{/* reference:end */}` markers, and everything
between them is written by `bun run docs:reference` from the repository root,
reading `action.yml`. Edit the manifest, not the table. CI regenerates it and
fails if the result differs from what was committed.

**Broken internal links fail the build.** The `linkValidationPlugin` is the one
plugin here that is not part of Fumapress's `recommended` preset. Prose about
an action that changes underneath it goes stale quietly; a link to a page that
no longer exists is the cheapest way to notice.

## Third-party assets

`public/hero-wallpaper.webp` is the wallpaper cursor.com uses behind its own
hero, re-encoded from their
[PNG](https://cursor.com/marketing-static/demos/cursor-wallpaper.png). It is
Cursor's artwork, not ours, and the repository's MIT licence does not cover it.
Replace it with an image of our own if that ever matters.

## Deployment

Vercel, with the root directory set to `docs`. `vercel.json` pins the build
command and points at `dist/public`. `site.baseUrl` is read from
`VERCEL_PROJECT_PRODUCTION_URL` at build time, so no domain is hardcoded.
