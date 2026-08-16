/**
 * Their `.btn-tertiary`: the accent as text. The arrow is fixed — the card's
 * own background is what answers the pointer, and a second thing moving under
 * the same hover is one motion too many for one intent.
 */
export const Cta = ({ children }: { children: React.ReactNode }) => (
  <span className="text-fd-primary inline-flex text-sm">
    {children}
    {/* The same 0.25em lead-in the hero buttons use, at full strength: the
        accent is already close to its contrast floor as text. */}
    <span aria-hidden="true" className="inline-flex ps-[0.25em]">
      →
    </span>
  </span>
);
