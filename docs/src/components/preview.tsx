import { Window } from "./window";

const WORKFLOW = `- name: Run Cursor Agent
  id: cursor
  uses: PunGrumpy/cursor-action@v1
  with:
    api-key: \${{ secrets.CURSOR_API_KEY }}
    prompt: "Review the changes and summarize the risks."`;

/**
 * cursor.com backs its hero stage with a landscape painting and dims it with
 * `filter: brightness(.9)` in the dark theme. Same treatment, different
 * painting: Bierstadt's *Alaskan Coastal Range*, public domain since 1902 and
 * therefore ours to serve. See docs/README.md.
 */
const WALLPAPER = "/hero-wallpaper.webp";

/**
 * cursor.com stages its product shots on a filled panel and floats two
 * overlapping windows over it. Same construction here, over the painting rather
 * than their photograph.
 */
export const Preview = () => (
  <section aria-labelledby="preview" className="pb-24">
    <h2 className="sr-only" id="preview">
      What a run looks like
    </h2>
    <div className="border-fd-border bg-fd-accent relative isolate overflow-hidden rounded-xl border p-8 sm:p-12">
      <img
        alt=""
        className="absolute inset-0 -z-10 h-full w-full object-cover dark:brightness-90"
        src={WALLPAPER}
      />

      <div className="relative mx-auto max-w-3xl">
        <Window label="review.yml">
          <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed">
            <code>{WORKFLOW}</code>
          </pre>
        </Window>

        {/* Offset and layered over the first, the way the CLI window sits over
            the desktop one on cursor.com. */}
        <div className="relative z-10 -mb-6 ml-auto w-full max-w-md translate-y-[-2.5rem] sm:mr-[-2rem]">
          <Window label="Job summary">
            <div className="p-5">
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 font-mono text-[13px]">
                <dt className="text-fd-muted-foreground">Status</dt>
                <dd>Success</dd>
                <dt className="text-fd-muted-foreground">Exit code</dt>
                <dd className="tabular-nums">0</dd>
              </dl>
              <p className="text-fd-muted-foreground mt-4 text-[13px] leading-relaxed">
                The response also lands in{" "}
                <code className="text-fd-foreground font-mono">
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
);
