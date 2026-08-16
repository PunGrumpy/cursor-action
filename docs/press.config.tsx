import { defineDocs } from "fumadocs-mdx/macro";
import { defineConfig } from "fumapress";
import { fumadocsMdx } from "fumapress/adapters/mdx";
import { metaSchema, pageSchema } from "fumapress/adapters/mdx/schema";
import { linkValidationPlugin } from "fumapress/plugins/link-validation";
import { takumiPlugin } from "fumapress/plugins/takumi";

import { MARK_VIEW_BOX, markPath } from "./src/lib/mark";

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

const SITE_NAME = "Cursor Action";

/**
 * The dark-appearance tokens from `src/app.css`, resolved out of OKLCH because
 * the OG renderer has no stylesheet to read them from. `muted` is the same
 * stronger secondary step the site uses, not a dimmer one: a card is read at
 * thumbnail size in a feed, where less contrast is exactly wrong.
 */
const OG = {
  accent: "#f54e00",
  background: "#14120b",
  foreground: "#edecec",
  muted: "#d5d4d2",
};

export default defineConfig({
  content: docs.toFumadocsSource(),
  // Deployed to a CDN as a static site, so no route may depend on a server.
  mode: "static",
  defaultLayoutProps: {
    nav: { title: SITE_NAME },
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
            href="https://fonts.googleapis.com/css2?family=Geist:ital,wght@0,100..900;1,100..900&family=Geist+Mono:wght@100..900&display=swap"
            rel="stylesheet"
          />
          {/* Two files rather than one with `currentColor`, because an SVG
              favicon is rendered outside the document and cannot inherit from
              it. The unqualified link comes first for engines that ignore
              `media` on an icon; the qualified pair decides for the rest.
              The ICO leads for anything that cannot read SVG at all. */}
          <link href="/favicon.ico" rel="icon" sizes="16x16 32x32 48x48" />
          <link href="/favicon-light.svg" rel="icon" type="image/svg+xml" />
          <link
            href="/favicon-light.svg"
            media="(prefers-color-scheme: light)"
            rel="icon"
            type="image/svg+xml"
          />
          <link
            href="/favicon.svg"
            media="(prefers-color-scheme: dark)"
            rel="icon"
            type="image/svg+xml"
          />
          <link
            href="/icon-192.png"
            rel="icon"
            sizes="192x192"
            type="image/png"
          />
          <link href="/apple-touch-icon.png" rel="apple-touch-icon" />
        </>
      );
    },
  },
  site: {
    name: SITE_NAME,
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
  // Search, sitemap, robots.txt, llms.txt and RSS come from the "recommended"
  // preset. Three plugins are named here instead.
  .plugins(
    // The reference tables are generated from action.yml, but prose still rots,
    // and a broken link is the cheapest signal that a page describes something
    // that no longer exists.
    linkValidationPlugin(),
    // Named explicitly so the preset does not add its own: the stock card is
    // pink on near-black with a dashed rule, which belongs to no part of this
    // site. Same layout, this site's palette.
    takumiPlugin({
      generate(page) {
        return {
          node: (
            <div
              style={{
                backgroundColor: OG.background,
                borderBottom: `12px solid ${OG.accent}`,
                color: OG.foreground,
                display: "flex",
                flexDirection: "column",
                height: "100%",
                padding: "72px 72px 60px",
                width: "100%",
              }}
            >
              <div style={{ alignItems: "center", display: "flex" }}>
                <svg
                  fill={OG.foreground}
                  height={44}
                  viewBox={MARK_VIEW_BOX}
                  width={44 * (19.4 / 22.4)}
                >
                  <path d={markPath(1.4)} fillRule="evenodd" />
                </svg>
                <span
                  style={{
                    fontSize: 30,
                    letterSpacing: "0.04em",
                    paddingLeft: 16,
                  }}
                >
                  {this.siteConfig.name?.toUpperCase()}
                </span>
              </div>

              <p
                style={{
                  fontSize: 76,
                  fontWeight: 600,
                  margin: 0,
                  marginTop: "auto",
                }}
              >
                {page.data.title}
              </p>
              {page.data.description ? (
                <p
                  style={{
                    color: OG.muted,
                    fontSize: 38,
                    lineHeight: 1.35,
                    margin: 0,
                    marginTop: 20,
                  }}
                >
                  {page.data.description}
                </p>
              ) : null}
            </div>
          ),
        };
      },
    }),
    // Registered after Takumi so it sits inside Takumi's own interceptor: this
    // one replaces the default title and og:title rather than adding a second
    // set, and Takumi's og:image still wraps the result.
    {
      name: "site:page-meta",
      init() {
        this.interceptPageMeta(({ page }) => {
          const title = `${page.data.title} | ${SITE_NAME}`;
          const url = this.siteConfig.baseUrl
            ? new URL(page.url, this.siteConfig.baseUrl).href
            : page.url;

          return (
            <>
              <title>{title}</title>
              <link href={url} rel="canonical" />
              <meta content={title} property="og:title" />
              <meta content={SITE_NAME} property="og:site_name" />
              <meta content="article" property="og:type" />
              <meta content={url} property="og:url" />
              {page.data.description ? (
                <>
                  <meta content={page.data.description} name="description" />
                  <meta
                    content={page.data.description}
                    property="og:description"
                  />
                </>
              ) : null}
            </>
          );
        });
      },
    }
  );
