import { Caveats } from "../components/caveats";
import { Features } from "../components/features";
import { SiteFooter } from "../components/footer";
import { SiteHeader } from "../components/header";
import { Hero } from "../components/hero";
import { Preview } from "../components/preview";
import { url } from "../lib/url";

/**
 * Adapted from the pair cursor.com runs on its own home page: a benefit-led
 * noun phrase suffixed with the product, and a description that says what the
 * agent does before it says what to do about it.
 */
const TITLE = "AI Coding Agent for Your GitHub Workflows | Cursor Action";
const DESCRIPTION =
  "Built to fit the workflows you already have, a Cursor agent turns a prompt into a step output. Hand off reviews, summaries, and changes to CI.";

const HomePage = () => (
  <>
    {/* React hoists these into the document head; the file-based route has no
        frontmatter for the page-meta plugin to read. */}
    <title>{TITLE}</title>
    <meta content={DESCRIPTION} name="description" />
    <link href={url} rel="canonical" />
    <meta content={TITLE} property="og:title" />
    <meta content={DESCRIPTION} property="og:description" />
    <meta content="Cursor Action" property="og:site_name" />
    <meta content="website" property="og:type" />
    <meta content={url} property="og:url" />
    <meta content={`${url}/og.png`} property="og:image" />
    <meta content="1200" property="og:image:width" />
    <meta content="630" property="og:image:height" />
    <meta content="summary_large_image" property="twitter:card" />

    {/* The header and the footer sit outside <main> on purpose. Fumapress wraps
        a home layout's children in a `max-w-[1400px]` container, which stops
        the footer's background short of the viewport edges, and a `<footer>`
        inside `<main>` is not a `contentinfo` landmark — nor a `<header>` a
        `banner` one. Out here they are full-bleed and both landmarks.

        There is no Fumapress home layout at all for the same reason: with its
        nav turned off it contributed nothing this page uses, and it nested two
        <main> elements, which is two `main` landmarks on one page. */}
    <SiteHeader />

    <main className="flex-1" id="main">
      {/* The header is fixed, so the content starts below its 56px. The gutter
          is 20px, as cursor.com's is, and the same container the header and the
          footer use so all three line up. */}
      <div className="mx-auto w-full max-w-6xl px-5 pt-14 pb-28">
        <Hero />
        <Preview />
        <Features />
        <Caveats />
      </div>
    </main>

    <SiteFooter />
  </>
);

export default HomePage;
