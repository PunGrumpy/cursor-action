import { defineDocs } from "fumadocs-mdx/macro";
import { defineConfig } from "fumapress";
import { fumadocsMdx } from "fumapress/adapters/mdx";
import { metaSchema, pageSchema } from "fumapress/adapters/mdx/schema";
import { linkValidationPlugin } from "fumapress/plugins/link-validation";

const docs = defineDocs({
  dir: "content",
  docs: {
    async: true,
    lastModified: true,
    postprocess: {
      includeProcessedMarkdown: true,
    },
    schema: pageSchema,
  },
  meta: {
    schema: metaSchema,
  },
});

// Vercel exposes the production domain at build time, so the deployment does
// not have to be pinned to a domain that has not been chosen yet.
const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export default defineConfig({
  content: docs.toFumadocsSource(),
  // Deployed to a CDN as a static site, so no route may depend on a server.
  mode: "static",
  defaultLayoutProps: {
    nav: { title: "Cursor Action" },
    links: [
      {
        text: "GitHub",
        url: "https://github.com/PunGrumpy/cursor-action",
      },
      {
        text: "Marketplace",
        url: "https://github.com/marketplace/actions/cursor-action",
      },
    ],
  },
  meta: {
    root() {
      return (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin=""
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Geist:ital,wght@0,100..900;1,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap"
            rel="stylesheet"
          />
        </>
      );
    },
  },
  site: {
    name: "Cursor Action",
    baseUrl,
    git: {
      user: "PunGrumpy",
      repo: "cursor-action",
      branch: "main",
      // This site lives in `docs/`, so "Edit on GitHub" has to start there.
      rootDir: "docs",
    },
  },
})
  .adapters(fumadocsMdx())
  // Search, sitemap, robots.txt, llms.txt, RSS and OG images come from the
  // "recommended" preset. Link validation does not, and it is the one that
  // earns its place here: the reference tables are generated from action.yml,
  // but prose still rots, and a broken link is the cheapest signal that a page
  // describes something that no longer exists.
  .plugins(linkValidationPlugin());
