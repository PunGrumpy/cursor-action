import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch";

import PressConfig from "../../press.config";
import { MARK_VIEW_BOX, markPath } from "../lib/mark";

const WORKFLOW = `- name: Run Cursor Agent
  id: cursor
  uses: PunGrumpy/cursor-action@v1
  with:
    api-key: \${{ secrets.CURSOR_API_KEY }}
    prompt: "Review the changes and summarize the risks."`;

const FEATURES = [
  {
    title: "One step, one output",
    body: "Send a prompt, read the response from steps.<id>.outputs.summary, and pipe it wherever the workflow needs it.",
    href: "/quickstart",
    cta: "Read the quickstart →",
    lines: ["- name: Run Cursor Agent", "  id: cursor", "  uses: PunGrumpy/", "    cursor-action@v1"],
  },
  {
    title: "Ubuntu, Windows, macOS",
    body: "Every push to main runs the action on all three runners, so the platform you build on is the one it was tested on.",
    href: "/behaviour",
    cta: "See how it runs →",
    run: [
      { label: "Build & Test", state: "done" },
      { label: "Integration (ubuntu)", state: "done" },
      { label: "Integration (windows)", state: "done" },
      { label: "Integration (macos)", state: "running" },
    ],
  },
  {
    title: "Documented honestly",
    body: "The reference tables are generated from action.yml, and the inputs that do not work yet say so on the page.",
    href: "/reference",
    cta: "Open the reference →",
    // The point of the card is that the reference states what an input does
    // *not* do, so the figure is that column and nothing else.
    inputs: [
      { name: "prompt", state: "works" },
      { name: "timeout", state: "works" },
      { name: "permissions", state: "Not enforced" },
      { name: "cursor-version", state: "Ignored" },
    ],
  },
];

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring";

/**
 * cursor.com sizes both buttons at 14px, normal weight, with
 * `--button-padding-default: .89em 1.45em .91em` and a fully rounded radius.
 * The filled one carries the foreground colour, not the brand orange.
 */
const buttonBase = `inline-flex items-center justify-center rounded-full px-[1.45em] pt-[0.89em] pb-[0.91em] text-sm leading-none ${focusRing}`;

/** `.btn-icon` on cursor.com: inline-flex, 0.25em of lead-in, 70% opacity. */
const buttonIcon = "inline-flex ps-[0.25em] opacity-70";

/**
 * cursor.com backs its hero stage with a landscape painting and dims it with
 * `filter: brightness(.9)` in the dark theme. Same treatment, different
 * painting: Bierstadt's *Alaskan Coastal Range*, public domain since 1902 and
 * therefore ours to serve. See docs/README.md.
 */
const WALLPAPER = "/hero-wallpaper.webp";

/** See `src/lib/mark.ts`, which the favicons and the OG card also draw from. */
function Mark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      fillRule="evenodd"
      viewBox={MARK_VIEW_BOX}
    >
      <path d={markPath()} />
    </svg>
  );
}

const NAV_LINKS = [
  { href: "/quickstart", label: "Quickstart" },
  { href: "/reference", label: "Reference" },
  { href: "/examples", label: "Examples" },
  { href: "/behaviour", label: "Behaviour" },
];

/**
 * cursor.com's header is a three-column grid — logo, nav, actions — 56px tall
 * and fixed to the top. The nav is not centred by the grid: it is absolutely
 * positioned at 50% and pulled back by half its own size, so it stays centred
 * on the viewport however wide the logo and the action cluster grow.
 *
 * The action cluster is a plain text link, then a ghost pill bordered at 20%
 * of the foreground, then the filled pill. Both pills are 14px, weight normal.
 */
function SiteHeader() {
  return (
    <header className="fixed top-0 left-0 z-50 w-full bg-fd-background">
      <div className="relative mx-auto grid h-14 max-w-6xl grid-cols-[1fr_auto] items-center px-5 lg:grid-cols-[auto_1fr_auto]">
        <a
          className={`-translate-y-full absolute top-2 left-5 rounded-full bg-fd-foreground px-4 py-2 text-fd-background text-sm opacity-0 transition-transform focus:translate-y-0 focus:opacity-100 ${focusRing}`}
          href="#main"
        >
          Skip to content
        </a>

        <a
          className={`col-start-1 col-end-2 row-start-1 row-end-2 inline-flex items-center gap-2 font-medium text-sm ${focusRing}`}
          href="/"
        >
          <Mark className="size-[22px]" />
          Cursor Action
        </a>

        <div className="hidden lg:block">
          <nav className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2">
            <ul className="flex items-center justify-center">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    className={`rounded-full px-3 py-2 text-fd-muted-foreground text-sm transition-colors hover:text-fd-foreground ${focusRing}`}
                    href={link.href}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="col-start-2 col-end-3 row-start-1 row-end-2 flex items-center gap-2 justify-self-end lg:col-start-3 lg:col-end-[-1]">
          <a
            className={`rounded-full p-1 text-sm lg:hidden ${focusRing}`}
            href="/quickstart"
          >
            Docs
          </a>
          <a
            className={`hidden rounded-full border border-fd-foreground/20 px-[0.8em] pt-[0.45em] pb-[0.46em] text-sm leading-none transition-colors hover:bg-fd-accent lg:inline-flex ${focusRing}`}
            href="https://github.com/marketplace/actions/cursor-action"
            rel="noreferrer"
            target="_blank"
          >
            Marketplace
          </a>
          <a
            className={`inline-flex rounded-full bg-fd-foreground px-[0.8em] pt-[0.45em] pb-[0.46em] text-fd-background text-sm leading-none transition-opacity hover:opacity-90 ${focusRing}`}
            href="https://github.com/PunGrumpy/cursor-action"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}

/**
 * The window chrome cursor.com floats over its hero panel: a 10px radius, a
 * 28px title bar with three 10px dots at 20% of the foreground and a centred
 * label at 70% opacity, and a two-layer shadow closed off by a 1px border.
 */
function Window({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-[10px] bg-fd-card"
      style={{
        boxShadow:
          "0 28px 70px rgb(0 0 0 / 0.14), 0 14px 32px rgb(0 0 0 / 0.1), 0 0 0 1px var(--color-fd-border)",
      }}
    >
      <div className="relative flex h-7 items-center border-fd-border border-b px-2">
        <div aria-hidden="true" className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-fd-foreground/20" />
          <span className="inline-block size-2.5 rounded-full bg-fd-foreground/20" />
          <span className="inline-block size-2.5 rounded-full bg-fd-foreground/20" />
        </div>
        <div className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 left-1/2 truncate text-center text-[13px] opacity-70">
          {label}
        </div>
      </div>
      {children}
    </div>
  );
}

const CONSUMER = `- name: Comment the review
  uses: actions/github-script@v8
  with:
    script: |
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: \`\${{ steps.cursor.outputs.summary }}\`,
      })`;

/**
 * cursor.com's `card--large`: one card across a 24-column grid, text in columns
 * 1 to 9 and the media in 9 to 25, both vertically centred, collapsing to
 * stacked rows below `lg`. The media sits on a flat panel a shade warmer than
 * the page — they set `--layered-media-bg-light: #D9D5CF` and `-dark: #4A443B`,
 * which is their own foreground hue rotated about 22 degrees toward yellow.
 * Rotating this theme's foreground by the same amount lands on the same two
 * values, because the two palettes share a foreground.
 *
 * The whole card is the link, as theirs is, but labelled by its heading — theirs
 * takes its accessible name from every word inside it, which is a link name
 * three sentences long.
 */
function LargeCard() {
  return (
    <a
      aria-labelledby="handoff"
      className={`group grid grid-cols-1 items-center gap-y-8 rounded-xl bg-fd-card p-7 transition-colors hover:bg-fd-accent lg:grid-cols-24 lg:gap-y-0 ${focusRing}`}
      href="/examples"
    >
      <div className="lg:col-start-1 lg:col-end-9 lg:pr-12">
        <h3
          className="text-balance font-medium text-base"
          id="handoff"
        >
          The answer is a value, not a log line
        </h3>
        <p className="mt-2 max-w-prose text-pretty text-fd-muted-foreground text-sm leading-relaxed">
          <code className="font-mono text-fd-foreground">
            steps.&lt;id&gt;.outputs.summary
          </code>{" "}
          holds whatever the agent wrote back. Comment it on the pull request,
          append it to the job summary, or gate what runs next. The action does
          not decide for you.
        </p>
        <span className="mt-8 inline-flex text-fd-primary text-sm">
          See the examples
          <span
            aria-hidden="true"
            className="inline-flex ps-[0.25em] transition-transform group-hover:translate-x-0.5"
          >
            →
          </span>
        </span>
      </div>

      {/* Decorative: the card is already labelled, and nothing in here is
          reachable or meant to be read out a second time. */}
      <div
        aria-hidden="true"
        className="lg:col-start-9 lg:col-end-25"
        style={{
          // Their two custom properties, one per appearance, applied by the
          // panel below rather than by two stacked absolute layers.
          ["--panel-light" as string]: "oklch(0.874 0.009 78.28)",
          ["--panel-dark" as string]: "oklch(0.39 0.017 78.09)",
        }}
      >
        <div className="h-[260px] overflow-hidden rounded-lg bg-[var(--panel-light)] p-6 sm:h-[300px] sm:p-8 dark:bg-[var(--panel-dark)]">
          {/* Clipped by the panel rather than fitted to it, the way their demo
              windows run past the bottom edge. */}
          <div className="mx-auto max-w-xl">
            <Window label="comment.yml">
              <pre className="overflow-hidden p-5 font-mono text-[12.5px] leading-relaxed">
                <code>{CONSUMER}</code>
              </pre>
            </Window>
          </div>
        </div>
      </div>
    </a>
  );
}

/**
 * The illustration under each card. cursor.com's equivalents are animated but
 * inert — every control in their markup is `disabled` and the whole block is
 * `aria-hidden` — so these are pictures of the product, not miniatures of it.
 */
function FeatureFigure({ feature }: { feature: (typeof FEATURES)[number] }) {
  if (feature.run) {
    return (
      <ul className="space-y-1.5">
        {feature.run.map((step) => {
          const done = step.state === "done";
          return (
            <li className="flex items-center gap-2" key={step.label}>
              <span className={done ? "text-fd-foreground" : "text-fd-primary"}>
                {done ? "✓" : "•"}
              </span>
              <span className={done ? "text-fd-muted-foreground" : "shimmer"}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  if (feature.inputs) {
    return (
      <ul className="space-y-1.5">
        {feature.inputs.map((input) => (
          <li className="flex items-baseline gap-3" key={input.name}>
            <span className="text-fd-muted-foreground">{input.name}</span>
            <span
              className={
                input.state === "works"
                  ? "ms-auto text-fd-foreground"
                  : "ms-auto text-fd-primary"
              }
            >
              {input.state === "works" ? "✓" : input.state}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <pre className="overflow-hidden text-fd-muted-foreground">
      <code>{feature.lines?.join("\n")}</code>
    </pre>
  );
}

const REPO = "https://github.com/PunGrumpy/cursor-action";

type FooterColumn = {
  heading: string;
  links: { label: string; href: string; external?: boolean }[];
};

const FOOTER: FooterColumn[] = [
  {
    heading: "Documentation",
    links: [
      { label: "Quickstart", href: "/quickstart" },
      { label: "Reference", href: "/reference" },
      { label: "Examples", href: "/examples" },
      { label: "Behaviour", href: "/behaviour" },
      { label: "Troubleshooting", href: "/troubleshooting" },
    ],
  },
  {
    heading: "Project",
    links: [
      { label: "GitHub", href: REPO, external: true },
      {
        label: "Marketplace",
        href: "https://github.com/marketplace/actions/cursor-action",
        external: true,
      },
      {
        label: "npm",
        href: "https://www.npmjs.com/package/@pungrumpy/cursor-action",
        external: true,
      },
      { label: "Releases", href: `${REPO}/releases`, external: true },
      { label: "Changelog", href: `${REPO}/blob/main/CHANGELOG.md`, external: true },
    ],
  },
  {
    heading: "Community",
    links: [
      { label: "Issues", href: `${REPO}/issues`, external: true },
      {
        label: "Contributing",
        href: `${REPO}/blob/main/.github/CONTRIBUTING.md`,
        external: true,
      },
      {
        label: "Code of conduct",
        href: `${REPO}/blob/main/.github/CODE_OF_CONDUCT.md`,
        external: true,
      },
      {
        label: "Report a bug",
        href: `${REPO}/issues/new?template=bug_report.md`,
        external: true,
      },
      {
        label: "Request a feature",
        href: `${REPO}/issues/new?template=feature_request.md`,
        external: true,
      },
    ],
  },
  {
    heading: "Credits",
    links: [
      { label: "Cursor", href: "https://cursor.com", external: true },
      {
        label: "@cursor/sdk",
        href: "https://www.npmjs.com/package/@cursor/sdk",
        external: true,
      },
      { label: "Fumapress", href: "https://press.fumadocs.dev", external: true },
      {
        label: "Bierstadt painting",
        href: "https://commons.wikimedia.org/wiki/File:Bierstadt-Alaskan_Coastal_Range.jpg",
        external: true,
      },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "MIT licence", href: `${REPO}/blob/main/LICENSE`, external: true },
    ],
  },
];

/**
 * Their footer sits on the card surface and runs five link columns across the
 * container: headings in the secondary colour, links in the primary one, and
 * the external-link arrow hidden until hover so it is there when you reach for
 * the link and out of the way while you read. The bottom bar splits the
 * copyright from the appearance control.
 */
function SiteFooter() {
  return (
    <footer className="mt-24 bg-fd-card">
      {/* Same container as the header and the page body — max width, then the
          gutter inside it. With the gutter on the <footer> instead, its columns
          started 20px left of everything above them. */}
      <div className="mx-auto max-w-6xl px-5 pt-16 pb-12">
        <nav className="mb-20 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-5">
          {FOOTER.map((column) => (
            <div key={column.heading}>
              <h3 className="pb-2 text-fd-muted-foreground text-sm">
                {column.heading}
              </h3>
              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      className={`group inline-block py-1 text-fd-foreground text-sm ${focusRing}`}
                      href={link.href}
                      {...(link.external
                        ? { rel: "noreferrer", target: "_blank" }
                        : {})}
                    >
                      {link.label}
                      {link.external ? (
                        <span
                          aria-hidden="true"
                          className="inline-block opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                        >
                          &nbsp;↗
                        </span>
                      ) : null}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-fd-muted-foreground">
            <small className="text-sm">
              © 2026{" "}
              <a
                className={`hover:text-fd-foreground ${focusRing}`}
                href="https://www.pungrumpy.com"
                rel="noreferrer"
                target="_blank"
              >
                Noppakorn Kaewsalabnil
              </a>
            </small>
            <small className="text-sm">
              Not affiliated with or endorsed by Cursor
            </small>
          </div>
          {/* Closing the gap opened by turning the layout's own nav off: without
              this the home page had no way to change appearance. */}
          <ThemeSwitch mode="light-dark-system" />
        </div>
      </div>
    </footer>
  );
}

/**
 * Adapted from the pair cursor.com runs on its own home page: a benefit-led
 * noun phrase suffixed with the product, and a description that says what the
 * agent does before it says what to do about it.
 */
const TITLE = "AI Coding Agent for Your GitHub Workflows | Cursor Action";
const DESCRIPTION =
  "Built to fit the workflows you already have, a Cursor agent turns a prompt into a step output. Hand off reviews, summaries, and changes to CI.";
/**
 * Read from the config rather than written down, so this page's canonical and
 * og:url come from the same Vercel-supplied domain every other page's do.
 */
const SITE_URL = PressConfig.get().site?.baseUrl ?? "";

export default function HomePage() {
  return (
    <>
      {/* React hoists these into the document head; the file-based route has no
          frontmatter for the page-meta plugin to read. */}
      <title>{TITLE}</title>
      <meta content={DESCRIPTION} name="description" />
      <link href={SITE_URL} rel="canonical" />
      <meta content={TITLE} property="og:title" />
      <meta content={DESCRIPTION} property="og:description" />
      <meta content="Cursor Action" property="og:site_name" />
      <meta content="website" property="og:type" />
      <meta content={SITE_URL} property="og:url" />
      <meta content={`${SITE_URL}/og.png`} property="og:image" />
      <meta content="1200" property="og:image:width" />
      <meta content="630" property="og:image:height" />
      <meta content="summary_large_image" property="twitter:card" />

      {/* Both of these sit outside the layout on purpose. Fumapress wraps the
          layout's children in a `max-w-[1400px]` container, which stops the
          footer's own background short of the viewport edges, and a `<footer>`
          inside `<main>` is not a `contentinfo` landmark — nor a `<header>` a
          `banner` one. Outside, they are both full-bleed and both landmarks. */}
      <SiteHeader />

      {/* Not Fumapress's home layout. With its nav turned off it contributed
          nothing this page uses, and it nested two <main> elements — its own
          inside Fumadocs' — which is two `main` landmarks on one page. */}
      <main className="flex-1" id="main">
        {/* The header is fixed, so the content starts below its 56px. */}
        <div className="mx-auto w-full max-w-6xl px-5 pt-14 pb-28">
          {/* Their hero is one `max-w-prose` block: headline, then the buttons
              directly under it. The headline is a single sentence at
              --text-md-lg, one colour — the two-tone reading of it came from a
              screenshot caught mid-animation, not from the design. */}
          <section className="max-w-prose pt-24 pb-14 text-left sm:pt-32">
            <h1 className="mb-6 text-balance font-normal text-[1.625rem] leading-[1.25] tracking-[-0.01em]">
              Cursor Action runs your coding agent inside the workflows you
              already have.
            </h1>

            <div className="flex items-center justify-start gap-x-3">
              <a
                className={`${buttonBase} bg-fd-foreground text-fd-background transition-opacity hover:opacity-90`}
                href="/quickstart"
              >
                Get started
                <span aria-hidden="true" className={buttonIcon}>
                  →
                </span>
              </a>
              {/* `.btn--secondary` is filled with the card-03 surface and edged
                  with border-01 at 2.5% of the foreground, not a transparent
                  pill with a heavy border. */}
              <a
                className={`${buttonBase} border border-fd-foreground/[0.025] bg-fd-accent transition-[filter] hover:brightness-125`}
                href="https://github.com/PunGrumpy/cursor-action"
                rel="noreferrer"
                target="_blank"
              >
                View on GitHub
                <span aria-hidden="true" className={buttonIcon}>
                  →
                </span>
              </a>
            </div>
          </section>

          {/* cursor.com stages its product shots on a filled panel and floats
              two overlapping windows over it, each with a 28px-height title bar,
              three 10px dots at 20% of the foreground, a centred label, and a
              layered shadow closed off by a 1px border. Same construction here,
              over a warm gradient rather than their photograph. */}
          <section aria-labelledby="preview" className="pb-24">
            <h2 className="sr-only" id="preview">
              What a run looks like
            </h2>
            <div className="relative isolate overflow-hidden rounded-xl border border-fd-border bg-fd-accent p-8 sm:p-12">
              <img
                alt=""
                className="-z-10 absolute inset-0 h-full w-full object-cover dark:brightness-90"
                src={WALLPAPER}
              />

              <div className="relative mx-auto max-w-3xl">
                <Window label="review.yml">
                  <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed">
                    <code>{WORKFLOW}</code>
                  </pre>
                </Window>

                {/* Offset and layered over the first, the way the CLI window sits
                    over the desktop one on cursor.com. */}
                <div className="-mb-6 relative z-10 ml-auto w-full max-w-md translate-y-[-2.5rem] sm:mr-[-2rem]">
                  <Window label="Job summary">
                    <div className="p-5">
                      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 font-mono text-[13px]">
                        <dt className="text-fd-muted-foreground">Status</dt>
                        <dd>Success</dd>
                        <dt className="text-fd-muted-foreground">Exit code</dt>
                        <dd className="tabular-nums">0</dd>
                      </dl>
                      <p className="mt-4 text-[13px] text-fd-muted-foreground leading-relaxed">
                        The response also lands in{" "}
                        <code className="font-mono text-fd-foreground">
                          outputs.summary
                        </code>
                        , ready for the next step to comment, gate, or ignore.
                      </p>
                    </div>
                  </Window>
                </div>
              </div>
            </div>
          </section>

          {/* Their card grid: the heading sits in a narrow measure above a
              stretch grid, and every card is a column that pushes its tertiary
              link to the bottom with mt-auto, so the links line up across cards
              of different text lengths. The figure below each one sits on a
              filled panel. */}
          <section aria-labelledby="features" className="pb-24">
            <h2
              className="mb-6 max-w-md text-balance font-normal text-[1.625rem] leading-[1.25] tracking-[-0.01em]"
              id="features"
            >
              What you get
            </h2>

            <LargeCard />

            <div className="mt-4 grid grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
              {FEATURES.map((feature) => (
                <div
                  className="flex h-full grow flex-col rounded-xl bg-fd-card p-7"
                  key={feature.title}
                >
                  <div className="flex max-w-prose grow flex-col">
                    <div>
                      <h3 className="font-medium text-base">{feature.title}</h3>
                      <p className="mt-2 text-pretty text-fd-muted-foreground text-sm leading-relaxed">
                        {feature.body}
                      </p>
                    </div>
                    <div className="mt-auto pt-6">
                      <a
                        className={`text-fd-primary text-sm ${focusRing}`}
                        href={feature.href}
                      >
                        {feature.cta}
                      </a>
                    </div>
                  </div>
                  {/* Decorative, like theirs: hidden from assistive tech, and
                      nothing in it pretends to be a control. */}
                  <figure aria-hidden="true" className="pt-7">
                    <div className="overflow-hidden rounded-md bg-fd-accent p-4 font-mono text-[12px] leading-relaxed">
                      <FeatureFigure feature={feature} />
                    </div>
                  </figure>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="caveats" className="pb-24">
            <h2
              className="font-normal text-[1.625rem] leading-[1.25] tracking-[-0.01em]"
              id="caveats"
            >
              What it does not do yet
            </h2>
            <ul className="mt-8 max-w-2xl space-y-4 text-fd-muted-foreground text-sm leading-relaxed">
              <li>
                <code className="font-mono text-fd-foreground">permissions</code>{" "}
                is accepted but never enforced. <code>read-only</code> will not
                stop the agent editing files or running shell commands.
              </li>
              <li>
                A run that times out, or fails inside the agent, still reports
                success. Do not gate a merge on it yet.
              </li>
            </ul>
            <a
              className={`mt-8 inline-flex min-h-11 items-center font-medium text-fd-primary text-sm underline underline-offset-4 ${focusRing}`}
              href="/behaviour"
            >
              Read exactly how it behaves
            </a>
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
