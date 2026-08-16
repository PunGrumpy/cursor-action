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

export default function HomePage() {
  return (
    <HomeLayout>
      {/* React hoists these into the document head; the file-based route has no
          frontmatter to carry them. */}
      <title>Cursor Action — run a Cursor agent in GitHub Actions</title>
      <meta
        content="Run a Cursor agent as a step in any GitHub Actions workflow and read its response as a step output."
        name="description"
      />
      <div className="mx-auto w-full max-w-6xl px-6 pb-28">
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

        {/* cursor.com hands the space under the hero to one large product
            still. The equivalent here is the thing you actually look at: the
            step in the log, and the summary it writes. */}
        <section aria-labelledby="preview" className="pb-24">
          <h2 className="sr-only" id="preview">
            What a run looks like
          </h2>
          <div className="overflow-hidden rounded-2xl border border-fd-border bg-fd-card">
            <div className="flex items-center gap-2 border-fd-border border-b px-4 py-3">
              <span className="inline-block size-2.5 rounded-full bg-fd-border" />
              <span className="inline-block size-2.5 rounded-full bg-fd-border" />
              <span className="inline-block size-2.5 rounded-full bg-fd-border" />
              <span className="ml-2 font-mono text-fd-muted-foreground text-xs">
                .github/workflows/review.yml
              </span>
            </div>
            <div className="grid gap-px bg-fd-border md:grid-cols-2">
              <pre className="overflow-x-auto bg-fd-card p-6 font-mono text-[13px] leading-relaxed">
                <code>{WORKFLOW}</code>
              </pre>
              <div className="bg-fd-card p-6">
                <p className="font-mono text-fd-muted-foreground text-xs uppercase tracking-[0.14em]">
                  Job summary
                </p>
                <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 font-mono text-[13px]">
                  <dt className="text-fd-muted-foreground">Status</dt>
                  <dd>Success</dd>
                  <dt className="text-fd-muted-foreground">Exit code</dt>
                  <dd className="tabular-nums">0</dd>
                </dl>
                <p className="mt-5 text-fd-muted-foreground text-sm leading-relaxed">
                  The agent's response lands in the job summary and in{" "}
                  <code className="font-mono text-fd-foreground">
                    outputs.summary
                  </code>
                  , ready for the next step to comment, gate, or ignore.
                </p>
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
