/**
 * The section that says what the action does not do. It is on the home page on
 * purpose: both of these will bite someone who assumes otherwise, and finding
 * out from the reference after a merge is too late.
 */
export const Caveats = () => (
  <section aria-labelledby="caveats" className="pb-24">
    <h2
      className="text-[1.625rem] leading-[1.25] font-normal tracking-[-0.01em]"
      id="caveats"
    >
      What it does not do yet
    </h2>
    <ul className="text-fd-muted-foreground mt-8 max-w-2xl space-y-4 text-sm leading-relaxed">
      <li>
        <code className="text-fd-foreground font-mono">permissions</code> is
        accepted but never enforced. <code>read-only</code> will not stop the
        agent editing files or running shell commands.
      </li>
      <li>
        A run that times out, or fails inside the agent, still reports success.
        Do not gate a merge on it yet.
      </li>
    </ul>
    <a
      className="text-fd-primary mt-8 inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring"
      href="/behaviour"
    >
      Read exactly how it behaves
    </a>
  </section>
);
