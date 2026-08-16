import { Cta } from "./cta";
import { MediaPanel } from "./media-panel";
import { Window } from "./window";

const FEATURES = [
  {
    body: "Send a prompt, read the response from steps.<id>.outputs.summary, and pipe it wherever the workflow needs it.",
    cta: "Read the quickstart",
    figure: "outputs",
    href: "/quickstart",
    // The two outputs action.yml actually declares, rather than another copy of
    // the step in the hero. Split by line because each line is typed separately.
    summary: ['"Two risks: the retry', 'loop has no ceiling."'],
    title: "One step, one output",
  },
  {
    body: "Every push to main runs the action on all three runners, so the platform you build on is the one it was tested on.",
    cta: "See how it runs",
    figure: "Actions",
    href: "/behaviour",
    run: [
      { label: "Build & Test", state: "done" },
      { label: "Integration (ubuntu)", state: "done" },
      { label: "Integration (windows)", state: "done" },
      { label: "Integration (macos)", state: "running" },
    ],
    title: "Ubuntu, Windows, macOS",
  },
  {
    body: "The reference tables are generated from action.yml, and the inputs that do not work yet say so on the page.",
    cta: "Open the reference",
    figure: "Reference",
    href: "/reference",
    // The point of the card is that the reference states what an input does
    // *not* do, so the figure is that column and nothing else.
    inputs: [
      { name: "prompt", state: "works" },
      { name: "timeout", state: "works" },
      { name: "permissions", state: "Not enforced" },
      { name: "cursor-version", state: "Ignored" },
    ],
    title: "Documented honestly",
  },
];

const CONSUMER_BEFORE = `- name: Comment the review
  uses: actions/github-script@v8
  with:
    script: |
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: \``;
// The workflow expression is rendered verbatim, not interpolated here. It is
// split out so the shimmer can mark it: it is the one value the whole section
// is about, and the card to its left is shown writing it.
// oxlint-disable-next-line no-template-curly-in-string
const CONSUMER_TOKEN = "${{ steps.cursor.outputs.summary }}";
const CONSUMER_AFTER = "`,\n      })";

/**
 * Both cards carry the same surface. cursor.com's `.card` is a filled panel
 * with a 1px border at 2.4% of the foreground, and `.card:is(a):hover` lifts
 * it — the hover *is* the link affordance in their system, which is why a card
 * that is not a link never gets one. Every card here is a link.
 *
 * cursor.com's `card--large`: one card across a 24-column grid, text in columns
 * 1 to 9 and the media in 9 to 25, both vertically centred, collapsing to
 * stacked rows below `lg`.
 *
 * The whole card is the link, as theirs is, but labelled by its heading —
 * theirs takes its accessible name from every word inside it, which is a link
 * name three sentences long.
 */
const LargeCard = () => (
  <a
    aria-labelledby="handoff"
    className="border-fd-card-border bg-fd-card hover:bg-fd-card-hover focus-visible:outline-fd-ring grid grid-cols-1 items-center gap-y-8 rounded-xl border p-7 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 lg:grid-cols-24 lg:gap-y-0"
    href="/examples"
  >
    <div className="lg:col-start-1 lg:col-end-9 lg:pr-12">
      <h3 className="text-base font-medium text-balance" id="handoff">
        The answer is a value, not a log line
      </h3>
      <p className="text-fd-muted-foreground mt-2 max-w-prose text-sm leading-relaxed text-pretty">
        <code className="text-fd-foreground font-mono">
          steps.&lt;id&gt;.outputs.summary
        </code>{" "}
        holds whatever the agent wrote back. Comment it on the pull request,
        append it to the job summary, or gate what runs next. The action does
        not decide for you.
      </p>
      <span className="mt-8 block">
        <Cta>See the examples</Cta>
      </span>
    </div>

    <div aria-hidden="true" className="lg:col-start-9 lg:col-end-25">
      <MediaPanel className="h-[260px] p-6 sm:h-[300px] sm:p-8">
        {/* Clipped by the panel rather than fitted to it, the way their demo
            windows run past the bottom edge. */}
        <div className="mx-auto max-w-xl">
          <Window label="comment.yml">
            <pre className="overflow-hidden p-5 font-mono text-[12.5px] leading-relaxed">
              <code>
                {CONSUMER_BEFORE}
                <span className="shimmer">{CONSUMER_TOKEN}</span>
                {CONSUMER_AFTER}
              </code>
            </pre>
          </Window>
        </div>
      </MediaPanel>
    </div>
  </a>
);

/**
 * The demo under each card. cursor.com's equivalents are animated but inert —
 * every control in their markup is `disabled` and the whole block is
 * `aria-hidden` — so these are pictures of the product, not miniatures of it.
 * The motion lives in `app.css`; the resting markup here is the finished state.
 */
const FeatureFigure = ({ feature }: { feature: (typeof FEATURES)[number] }) => {
  const body = (() => {
    if (feature.summary) {
      return (
        <dl>
          <dt className="text-fd-muted-foreground">summary</dt>
          <dd className="text-fd-foreground">
            {feature.summary.map((line) => (
              // `--chars` is the finished width and the resting width; the
              // animation only starts it at zero.
              <span
                className="type"
                key={line}
                style={{
                  ["--chars" as string]: `${line.length}ch`,
                  ["--steps" as string]: line.length,
                }}
              >
                {line}
              </span>
            ))}
          </dd>
          <dt className="text-fd-muted-foreground pt-1.5">exit-code</dt>
          <dd className="text-fd-foreground">
            0<span className="caret text-fd-primary">▌</span>
          </dd>
        </dl>
      );
    }

    if (feature.run) {
      return (
        <ul className="space-y-1.5">
          {feature.run.map((step, i) => (
            <li className="flex items-center gap-2" key={step.label}>
              {/* Three glyphs in one cell, one opaque at a time. Without the
                  animation only the last is drawn, so the run reads complete. */}
              <span className="step grid" style={{ ["--step" as string]: i }}>
                <span className="step--queued text-fd-muted-foreground opacity-0">
                  ○
                </span>
                <span className="step--running text-fd-primary opacity-0">
                  ●
                </span>
                <span className="step--done text-fd-foreground">✓</span>
              </span>
              <span className="text-fd-muted-foreground">{step.label}</span>
            </li>
          ))}
        </ul>
      );
    }

    return (
      <ul className="space-y-1.5">
        {feature.inputs?.map((input, i) => (
          <li
            className="row-in flex items-baseline gap-3"
            key={input.name}
            style={{ ["--row" as string]: i }}
          >
            <span className="text-fd-muted-foreground">{input.name}</span>
            <span
              className={
                input.state === "works"
                  ? "text-fd-foreground ms-auto"
                  : "text-fd-primary ms-auto"
              }
            >
              {input.state === "works" ? "✓" : input.state}
            </span>
          </li>
        ))}
      </ul>
    );
  })();

  return (
    <MediaPanel className="h-[188px] px-5 pt-5">
      <Window label={feature.figure}>
        <div className="p-4 font-mono text-[11.5px] leading-relaxed">
          {body}
        </div>
      </Window>
    </MediaPanel>
  );
};

const FeatureCard = ({ feature }: { feature: (typeof FEATURES)[number] }) => {
  const headingId = `feature-${feature.href.slice(1)}`;

  return (
    <a
      aria-labelledby={headingId}
      className="border-fd-card-border bg-fd-card hover:bg-fd-card-hover focus-visible:outline-fd-ring flex h-full grow flex-col rounded-xl border p-7 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      href={feature.href}
    >
      <div className="flex max-w-prose grow flex-col">
        <div>
          <h3 className="text-base font-medium" id={headingId}>
            {feature.title}
          </h3>
          <p className="text-fd-muted-foreground mt-2 text-sm leading-relaxed text-pretty">
            {feature.body}
          </p>
        </div>
        {/* mt-auto so the links line up across cards whose text runs to
            different lengths, as theirs do. */}
        <div className="mt-auto pt-6">
          <Cta>{feature.cta}</Cta>
        </div>
      </div>
      {/* Decorative, like theirs: hidden from assistive tech, and nothing in it
          pretends to be a control. */}
      <figure aria-hidden="true" className="pt-7">
        <FeatureFigure feature={feature} />
      </figure>
    </a>
  );
};

/**
 * Their card grid: the heading sits in a narrow measure, then one large card
 * across the container, then a stretch grid of smaller ones.
 */
export const Features = () => (
  <section aria-labelledby="features" className="pb-24">
    <h2
      className="mb-6 max-w-md text-[1.625rem] leading-[1.25] font-normal tracking-[-0.01em] text-balance"
      id="features"
    >
      What you get
    </h2>

    <LargeCard />

    <div className="mt-4 grid grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
      {FEATURES.map((feature) => (
        <FeatureCard feature={feature} key={feature.title} />
      ))}
    </div>
  </section>
);
