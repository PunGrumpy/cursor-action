/**
 * The stage a demo sits on: cursor.com's `media-border-container`, a flat panel
 * in the warmer `--color-fd-media` with the figure clipped to it. Using it under
 * the small cards too is what stops the section carrying two visual languages.
 */
export const MediaPanel = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`bg-fd-media overflow-hidden rounded-lg ${className}`}>
    {children}
  </div>
);
