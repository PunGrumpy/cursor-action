import { MARK_VIEW_BOX, markPath } from "../lib/mark";

/**
 * The logo. Its geometry is computed in `lib/mark.ts`, which the favicons and
 * the open-graph card also draw from, so the three can never drift apart.
 */
export const Mark = ({ className }: { className?: string }) => (
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
