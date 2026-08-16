import { createHomeLayout } from "fumapress/layouts/home";

import type PressConfig from "../../press.config";

const HomeLayout = createHomeLayout<typeof PressConfig.$context>();

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
  },
  {
    title: "Ubuntu, Windows, macOS",
    body: "Every push to main runs the action on all three runners, so the platform you build on is the one it was tested on.",
  },
  {
    title: "Documented honestly",
    body: "The reference tables are generated from action.yml, and the inputs that do not work yet say so on the page.",
  },
];

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring";

/**
 * cursor.com sizes both buttons at 14px, normal weight, with
 * `--button-padding-default: .89em 1.45em .91em` and a fully rounded radius.
 * The filled one carries the foreground colour, not the brand orange.
 */
const buttonBase = `inline-flex items-center justify-center gap-2 rounded-full px-[1.45em] pt-[0.89em] pb-[0.91em] text-sm leading-none ${focusRing}`;

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
    <header className="fixed top-0 left-0 z-50 w-full border-fd-border border-b bg-fd-background">
      <div className="relative mx-auto grid h-14 max-w-6xl grid-cols-[1fr_auto] items-center px-6 lg:grid-cols-[auto_1fr_auto]">
        <a
          className={`-translate-y-full absolute top-2 left-6 rounded-full bg-fd-foreground px-4 py-2 text-fd-background text-sm opacity-0 transition-transform focus:translate-y-0 focus:opacity-100 ${focusRing}`}
          href="#main"
        >
          Skip to content
        </a>

        <a
          className={`col-start-1 col-end-2 row-start-1 row-end-2 font-medium text-sm ${focusRing}`}
          href="/"
        >
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
            className={`hidden rounded-full border border-fd-foreground/20 px-[1.35em] pt-[0.78em] pb-[0.8em] text-sm leading-none transition-colors hover:bg-fd-accent lg:inline-flex ${focusRing}`}
            href="https://github.com/marketplace/actions/cursor-action"
            rel="noreferrer"
            target="_blank"
          >
            Marketplace
          </a>
          <a
            className={`inline-flex rounded-full bg-fd-foreground px-[1.35em] pt-[0.78em] pb-[0.8em] text-fd-background text-sm leading-none transition-opacity hover:opacity-90 ${focusRing}`}
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

export default function HomePage() {
  return (
    <HomeLayout layoutProps={{ nav: { enabled: false } }}>
      {/* React hoists these into the document head; the file-based route has no
          frontmatter to carry them. */}
      <title>Cursor Action — run a Cursor agent in GitHub Actions</title>
      <meta
        content="Run a Cursor agent as a step in any GitHub Actions workflow and read its response as a step output."
        name="description"
      />
      <SiteHeader />

      {/* The header is fixed, so the content starts below its 56px. */}
      <div className="mx-auto w-full max-w-6xl px-6 pt-14 pb-28" id="main">
        <section className="pt-24 pb-14 sm:pt-32">
          {/* --text-md-lg is 1.625rem at --leading-snug, weight normal. The
              second sentence drops to the muted step, the way cursor.com
              splits its own headline. */}
          <h1 className="max-w-2xl text-balance font-normal text-[1.625rem] leading-[1.25] tracking-[-0.01em]">
            Cursor Action runs your coding agent{" "}
            <span className="text-fd-muted-foreground">
              inside the workflows you already have.
            </span>
          </h1>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              className={`${buttonBase} border border-fd-foreground bg-fd-foreground text-fd-background transition-opacity hover:opacity-90`}
              href="/quickstart"
            >
              Get started
            </a>
            <a
              className={`${buttonBase} border border-fd-foreground/60 transition-colors hover:bg-fd-accent`}
              href="https://github.com/PunGrumpy/cursor-action"
              rel="noreferrer"
              target="_blank"
            >
              View on GitHub
              <span aria-hidden="true">→</span>
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
            <div
              aria-hidden="true"
              className="-z-10 absolute inset-0 bg-[radial-gradient(120%_120%_at_20%_0%,var(--color-fd-secondary),var(--color-fd-background))]"
            />

            <div className="relative mx-auto max-w-3xl">
              <Window label="GitHub Actions · review.yml">
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

        <section aria-labelledby="features" className="pb-24">
          <h2
            className="font-normal text-[1.625rem] leading-[1.25] tracking-[-0.01em]"
            id="features"
          >
            What you get
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                className="rounded-xl border border-fd-border bg-fd-card p-6"
                key={feature.title}
              >
                <h3 className="font-medium text-sm">{feature.title}</h3>
                <p className="mt-3 text-fd-muted-foreground text-sm leading-relaxed">
                  {feature.body}
                </p>
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

        <p className="border-fd-border border-t pt-8 text-fd-muted-foreground text-sm">
          A community project by{" "}
          <a
            className={`underline underline-offset-4 ${focusRing}`}
            href="https://github.com/PunGrumpy"
            rel="noreferrer"
            target="_blank"
          >
            PunGrumpy
          </a>
          , not affiliated with or endorsed by Cursor.
        </p>
      </div>
    </HomeLayout>
  );
}
