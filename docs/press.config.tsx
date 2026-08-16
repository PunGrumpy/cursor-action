import { defineDocs } from "fumadocs-mdx/macro";
import { defineConfig } from "fumapress";
import { fumadocsMdx } from "fumapress/adapters/mdx";
import { metaSchema, pageSchema } from "fumapress/adapters/mdx/schema";
import { linkValidationPlugin } from "fumapress/plugins/link-validation";
import { sitemapPlugin } from "fumapress/plugins/sitemap";
import { takumiPlugin } from "fumapress/plugins/takumi";

import { MARKETPLACE, REPO } from "./src/lib/links";
import { MARK_VIEW_BOX, markPath } from "./src/lib/mark";
import { url } from "./src/lib/url";

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

const SITE_NAME = "Cursor Action";

const OG = {
  accent: "#f54e00",
  background: "#14120b",
  foreground: "#edecec",
  muted: "#d5d4d2",
};

export default defineConfig({
  content: docs.toFumadocsSource(),
  defaultLayoutProps: {
    links: [
      { text: "GitHub", url: REPO },
      { text: "Marketplace", url: MARKETPLACE },
    ],
    nav: { title: SITE_NAME },
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
  // Deployed to a CDN as a static site, so no route may depend on a server.
  mode: "static",
  site: {
    baseUrl: url,
    git: {
      branch: "main",
      repo: "cursor-action",
      rootDir: "docs",
      user: "PunGrumpy",
    },
    name: SITE_NAME,
  },
})
  .adapters(fumadocsMdx())
  .plugins(
    sitemapPlugin(),
    linkValidationPlugin(),
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
    {
      init() {
        this.interceptPageMeta(({ page }) => {
          const title = `${page.data.title} | ${SITE_NAME}`;
          const canonical = this.siteConfig.baseUrl
            ? new URL(page.url, this.siteConfig.baseUrl).href
            : page.url;

          return (
            <>
              <title>{title}</title>
              <link href={canonical} rel="canonical" />
              <meta content={title} property="og:title" />
              <meta content={SITE_NAME} property="og:site_name" />
              <meta content="article" property="og:type" />
              <meta content={canonical} property="og:url" />
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
      name: "site:page-meta",
    }
  );
