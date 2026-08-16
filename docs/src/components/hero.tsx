import { REPO } from "../lib/links";

/**
 * Their hero is one `max-w-prose` block: headline, then the buttons directly
 * under it. The headline is a single sentence at --text-md-lg, in one colour —
 * the two-tone reading of it came from a screenshot caught mid-animation, not
 * from the design.
 *
 * cursor.com sizes both buttons at 14px, normal weight, with
 * `--button-padding-default: .89em 1.45em .91em` and a pill radius, and the
 * filled one carries the foreground colour rather than the brand orange. Their
 * `.btn-icon` is an inline-flex span with 0.25em of lead-in at 70% opacity.
 */
export const Hero = () => (
  <section className="max-w-prose pt-24 pb-14 text-left sm:pt-32">
    <h1 className="mb-6 text-[1.625rem] leading-[1.25] font-normal tracking-[-0.01em] text-balance">
      Cursor Action runs your coding agent inside the workflows you already
      have.
    </h1>

    <div className="flex items-center justify-start gap-x-3">
      <a
        className="bg-fd-foreground text-fd-background focus-visible:outline-fd-ring inline-flex items-center justify-center rounded-full px-[1.45em] pt-[0.89em] pb-[0.91em] text-sm leading-none transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
        href="/quickstart"
      >
        Get started
        <span aria-hidden="true" className="inline-flex ps-[0.25em] opacity-70">
          →
        </span>
      </a>
      {/* `.btn--secondary` is filled with the card-03 surface and edged with
          border-01 at 2.5% of the foreground, not a transparent pill with a
          heavy border. */}
      <a
        className="border-fd-foreground/[0.025] bg-fd-accent focus-visible:outline-fd-ring inline-flex items-center justify-center rounded-full border px-[1.45em] pt-[0.89em] pb-[0.91em] text-sm leading-none transition-[filter] hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2"
        href={REPO}
        rel="noreferrer"
        target="_blank"
      >
        View on GitHub
        <span aria-hidden="true" className="inline-flex ps-[0.25em] opacity-70">
          →
        </span>
      </a>
    </div>
  </section>
);
