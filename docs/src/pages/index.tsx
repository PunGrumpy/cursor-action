import { createHomeLayout } from "fumapress/layouts/home";

import type PressConfig from "../../press.config";

const HomeLayout = createHomeLayout<typeof PressConfig.$context>();

const WORKFLOW = `- name: Run Cursor Agent
  id: cursor
  uses: PunGrumpy/cursor-action@v1
  with:
    api-key: \${{ secrets.CURSOR_API_KEY }}
    prompt: "Review the changes and summarize the risks."

- name: Print summary
  env:
    SUMMARY: \${{ steps.cursor.outputs.summary }}
  run: echo "$SUMMARY"`;

const FEATURES = [
  {
    title: "One step, one output",
    body: "Send a prompt, read the agent's response from steps.<id>.outputs.summary, and pipe it wherever the rest of your workflow needs it.",
  },
  {
    title: "Ubuntu, Windows, macOS",
    body: "Every push to main runs the action on all three runners, so the platform you build on is the platform it was tested on.",
  },
  {
    title: "Documented honestly",
    body: "The reference tables are generated from action.yml, and the inputs that do not work yet say so on the page instead of in an issue.",
  },
];

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring";

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
      <div className="mx-auto w-full max-w-5xl px-6 pb-24">
        <section className="pt-20 pb-16 sm:pt-28">
          <p className="font-mono text-fd-muted-foreground text-xs uppercase tracking-[0.14em]">
            GitHub Action
          </p>
          <h1 className="mt-5 max-w-3xl text-balance font-semibold text-5xl tracking-tight sm:text-6xl lg:text-7xl">
            Run a Cursor agent inside your workflow.
          </h1>
          <p className="mt-6 max-w-2xl text-fd-muted-foreground text-lg leading-relaxed">
            Give it a prompt on a pull request, a push, or a schedule, and read
            what it says back as a step output. Built on the official{" "}
            <code className="font-mono text-fd-foreground text-base">
              @cursor/sdk
            </code>
            .
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              className={`inline-flex min-h-11 items-center rounded-lg bg-fd-primary px-6 font-medium text-fd-primary-foreground transition-opacity hover:opacity-90 ${focusRing}`}
              href="/quickstart"
            >
              Get started
            </a>
            <a
              className={`inline-flex min-h-11 items-center rounded-lg border border-fd-border px-6 font-medium transition-colors hover:bg-fd-accent ${focusRing}`}
              href="https://github.com/PunGrumpy/cursor-action"
              rel="noreferrer"
              target="_blank"
            >
              View on GitHub
            </a>
          </div>
        </section>

        <section aria-labelledby="workflow" className="pb-20">
          <h2 className="sr-only" id="workflow">
            A minimal workflow
          </h2>
          <pre className="overflow-x-auto rounded-xl border border-fd-border bg-fd-card p-6 font-mono text-sm leading-relaxed">
            <code>{WORKFLOW}</code>
          </pre>
        </section>

        <section aria-labelledby="features" className="pb-20">
          <h2 className="font-semibold text-3xl tracking-tight" id="features">
            What you get
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                className="rounded-xl border border-fd-border bg-fd-card p-6"
                key={feature.title}
              >
                <h3 className="font-medium text-base">{feature.title}</h3>
                <p className="mt-3 text-fd-muted-foreground text-sm leading-relaxed">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="caveats" className="pb-20">
          <h2 className="font-semibold text-3xl tracking-tight" id="caveats">
            What it does not do yet
          </h2>
          <ul className="mt-8 space-y-4 text-fd-muted-foreground leading-relaxed">
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
            className={`mt-8 inline-flex min-h-11 items-center font-medium text-fd-primary underline underline-offset-4 ${focusRing}`}
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
